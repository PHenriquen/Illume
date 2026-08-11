"""Tiny trainable intent classifier for local Noa commands.

The implementation uses a multinomial Naive Bayes model built only with the
Python standard library. It is intentionally small: the goal is to demonstrate
the complete ML lifecycle (dataset -> training -> inference -> confidence)
without adding a heavyweight dependency to the desktop assistant.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
import math
import re
from typing import Iterable


TOKEN_RE = re.compile(r"[\wÀ-ÿ]+", re.UNICODE)


@dataclass(frozen=True)
class IntentExample:
    text: str
    label: str


@dataclass(frozen=True)
class Prediction:
    label: str
    confidence: float
    scores: dict[str, float]


DEFAULT_TRAINING_SET = (
    IntentExample("abra o spotify", "open_app"),
    IntentExample("inicie o discord", "open_app"),
    IntentExample("quero abrir o navegador", "open_app"),
    IntentExample("quanto espaço livre eu tenho", "system_info"),
    IntentExample("mostre o uso de memória", "system_info"),
    IntentExample("como está a cpu", "system_info"),
    IntentExample("leia este pdf", "document"),
    IntentExample("resuma o documento", "document"),
    IntentExample("abra e analise este arquivo", "document"),
    IntentExample("fale mais baixo", "voice_control"),
    IntentExample("pare de falar", "voice_control"),
    IntentExample("aumente o volume da voz", "voice_control"),
)


class IntentClassifier:
    def __init__(self, alpha: float = 1.0) -> None:
        self.alpha = alpha
        self._label_docs: Counter[str] = Counter()
        self._label_tokens: dict[str, Counter[str]] = defaultdict(Counter)
        self._vocabulary: set[str] = set()
        self._trained = False

    @staticmethod
    def tokenize(text: str) -> list[str]:
        return [token.lower() for token in TOKEN_RE.findall(text)]

    def fit(self, examples: Iterable[IntentExample]) -> "IntentClassifier":
        self._label_docs.clear()
        self._label_tokens.clear()
        self._vocabulary.clear()

        for example in examples:
            tokens = self.tokenize(example.text)
            if not tokens:
                continue
            self._label_docs[example.label] += 1
            self._label_tokens[example.label].update(tokens)
            self._vocabulary.update(tokens)

        self._trained = bool(self._label_docs and self._vocabulary)
        if not self._trained:
            raise ValueError("training set must contain labeled text")
        return self

    def predict(self, text: str) -> Prediction:
        if not self._trained:
            raise RuntimeError("classifier must be trained before prediction")

        tokens = self.tokenize(text)
        total_docs = sum(self._label_docs.values())
        vocabulary_size = len(self._vocabulary)
        log_scores: dict[str, float] = {}

        for label, docs in self._label_docs.items():
            log_probability = math.log(docs / total_docs)
            token_counts = self._label_tokens[label]
            total_tokens = sum(token_counts.values())
            denominator = total_tokens + self.alpha * vocabulary_size

            for token in tokens:
                numerator = token_counts[token] + self.alpha
                log_probability += math.log(numerator / denominator)

            log_scores[label] = log_probability

        label = max(log_scores, key=log_scores.get)
        normalized = self._softmax(log_scores)
        return Prediction(label, normalized[label], normalized)

    @staticmethod
    def _softmax(log_scores: dict[str, float]) -> dict[str, float]:
        peak = max(log_scores.values())
        exponentials = {label: math.exp(score - peak) for label, score in log_scores.items()}
        total = sum(exponentials.values()) or 1.0
        return {label: value / total for label, value in exponentials.items()}


def build_default_classifier() -> IntentClassifier:
    return IntentClassifier().fit(DEFAULT_TRAINING_SET)


if __name__ == "__main__":
    classifier = build_default_classifier()
    for sample in ("abre o whatsapp", "leia esse arquivo", "mostra a ram"):
        prediction = classifier.predict(sample)
        print(f"{sample!r} -> {prediction.label} ({prediction.confidence:.2%})")
