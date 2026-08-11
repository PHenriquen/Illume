// Experimental native primitive for Noa.
//
// A fixed-capacity single-producer/single-consumer float ring buffer suitable
// for experimenting with low-latency audio bridges. This file is not linked to
// the production desktop build yet; it exists as a native engineering lab that
// can later be wrapped through Node-API, ctypes or a small C ABI.

#include <atomic>
#include <cstddef>
#include <vector>

namespace noa::audio {

class RingBuffer {
public:
    explicit RingBuffer(std::size_t capacity)
        : data_(capacity + 1), capacity_(capacity + 1) {}

    bool push(float sample) noexcept {
        const auto head = head_.load(std::memory_order_relaxed);
        const auto next = increment(head);
        if (next == tail_.load(std::memory_order_acquire)) {
            return false;
        }
        data_[head] = sample;
        head_.store(next, std::memory_order_release);
        return true;
    }

    bool pop(float& sample) noexcept {
        const auto tail = tail_.load(std::memory_order_relaxed);
        if (tail == head_.load(std::memory_order_acquire)) {
            return false;
        }
        sample = data_[tail];
        tail_.store(increment(tail), std::memory_order_release);
        return true;
    }

    std::size_t approximate_size() const noexcept {
        const auto head = head_.load(std::memory_order_acquire);
        const auto tail = tail_.load(std::memory_order_acquire);
        return head >= tail ? head - tail : capacity_ - (tail - head);
    }

private:
    std::size_t increment(std::size_t value) const noexcept {
        return (value + 1) % capacity_;
    }

    std::vector<float> data_;
    const std::size_t capacity_;
    alignas(64) std::atomic<std::size_t> head_{0};
    alignas(64) std::atomic<std::size_t> tail_{0};
};

} // namespace noa::audio
