from __future__ import annotations

import json
import re
from typing import Any, TypeVar

from pydantic import BaseModel, ValidationError

FINAL_DECISION_TERMS = (
    "reject",
    "rejected",
    "hired",
    "do not proceed",
    "advance candidate",
    "final decision",
)
FINAL_DECISION_PATTERN = re.compile(
    r"\b(reject|rejected|hired|do not proceed|advance candidate|final decision)\b",
    re.IGNORECASE,
)

ModelT = TypeVar("ModelT", bound=BaseModel)


def parse_json_model(raw_output: Any, model_type: type[ModelT]) -> ModelT:
    if isinstance(raw_output, model_type):
        model = raw_output
    elif isinstance(raw_output, BaseModel):
        model = model_type.model_validate(raw_output.model_dump())
    else:
        text = getattr(raw_output, "raw", raw_output)
        if not isinstance(text, str):
            text = str(text)
        try:
            payload = json.loads(text)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Crew output was not valid JSON for {model_type.__name__}") from exc
        try:
            model = model_type.model_validate(payload)
        except ValidationError as exc:
            raise ValueError(f"Crew output failed {model_type.__name__} validation") from exc

    assert_no_final_decision_language(model.model_dump())
    return model


def assert_no_final_decision_language(value: Any) -> None:
    text = json.dumps(value, default=str).lower()
    matched_terms = [match.group(1).lower() for match in FINAL_DECISION_PATTERN.finditer(text)]
    if matched_terms:
        raise ValueError(
            "Generated output included prohibited final-decision language: "
            + ", ".join(sorted(set(matched_terms)))
        )
