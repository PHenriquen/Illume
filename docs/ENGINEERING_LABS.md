# Engineering Labs

This area extends Noa beyond its normal desktop-assistant stack without forcing experimental code into the production runtime.

## Security engineering

`backend/security.py` introduces a small dependency-free policy engine and a tamper-evident HMAC audit trail.

The intended flow is:

```text
intent -> action request -> security policy -> optional confirmation -> execution -> signed audit event
```

It complements, rather than replaces, Electron isolation, Windows permissions, allowlists and user consent.

## Machine learning lifecycle

`backend/ml_intent.py` implements a trainable multinomial Naive Bayes classifier using only the Python standard library. It demonstrates:

```text
labeled examples -> tokenization -> training -> probabilistic inference -> confidence
```

The model is deliberately small. Noa can continue using an LLM for rich language while the local classifier is useful for experimentation with fast, deterministic routing and offline intent recognition.

Run the demonstration with:

```powershell
python -m backend.ml_intent
```

## Native / low-level computing

`native/labs/audio_ring_buffer.cpp` is an experimental C++ single-producer/single-consumer ring buffer for low-latency audio work. It exposes concepts that are normally hidden by Python and TypeScript:

- explicit memory layout;
- atomic synchronization;
- cache-line alignment;
- fixed-capacity buffering;
- real-time producer/consumer behavior.

The native lab is intentionally not linked to the shipping Electron build yet. A later milestone can expose it through Node-API, a C ABI or Python FFI after benchmarking proves that a native path is useful.

## Portfolio purpose

These labs keep Noa coherent as a product while demonstrating three additional software-engineering dimensions:

1. application security and auditability;
2. training and serving a small ML model;
3. native C++ and low-level performance primitives.

Experimental modules must remain optional until they have tests, benchmarks and a clear product benefit.
