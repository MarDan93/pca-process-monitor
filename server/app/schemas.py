"""Strict, bounded contracts. Missing business values stay unknown (None)."""
from typing import Annotated, Literal
from decimal import Decimal, InvalidOperation

from pydantic import BaseModel, ConfigDict, Field, SecretStr, field_serializer, field_validator, model_validator

Text = Annotated[str, Field(max_length=300)]
Money = Annotated[Decimal, Field(ge=0, max_digits=18, decimal_places=6, allow_inf_nan=False)]
Quantity = Annotated[int, Field(ge=0, le=9007199254740991)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class CommercialPatch(StrictModel):
    customer: Text | None = None
    reference: Text | None = None
    market: Text | None = None
    commercial_unit: Literal["part", "kit", "assembly"] | None = None
    annual_volume: Quantity | None = None
    lot_size: Quantity | None = None
    program_years: Annotated[float, Field(gt=0, allow_inf_nan=False)] | None = None
    currency: Literal["EUR", "USD", "GBP", "CHF", "CAD", "JPY"] | None = None
    unit_cost_target: Money | None = None
    selling_price: Money | None = None
    mould_budget: Money | None = None
    notes: Annotated[str, Field(max_length=4000)] | None = None

    @field_validator("unit_cost_target", "selling_price", "mould_budget", mode="before")
    @classmethod
    def exact_amount(cls, value):
        if value is None:
            return None
        if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
            raise ValueError("Use a non-negative decimal amount.")
        try:
            result = Decimal(str(value))
        except InvalidOperation as error:
            raise ValueError("Invalid decimal amount.") from error
        if not result.is_finite():
            raise ValueError("Use a finite decimal amount.")
        return result.normalize()

    @field_serializer("unit_cost_target", "selling_price", "mould_budget")
    def amount_string(self, value):
        return None if value is None else format(value, "f")


class NewProject(StrictModel):
    name: Annotated[str, Field(min_length=1, max_length=120)]

    @model_validator(mode="after")
    def nonblank(self):
        self.name = self.name.strip()
        if not self.name:
            raise ValueError("A project name is required.")
        return self


class LoginRequest(StrictModel):
    username: Annotated[str, Field(min_length=1, max_length=64)]
    password: Annotated[SecretStr, Field(min_length=1, max_length=512)]


class Provenance(StrictModel):
    kind: Literal["manual", "ai"]
    request: Annotated[str, Field(max_length=2000)] = ""
    model: Text | None = None
    model_revision: Text | None = None

    @model_validator(mode="after")
    def ai_identity(self):
        if self.kind == "ai" and not (self.request.strip() and self.model and self.model_revision):
            raise ValueError("AI proposals require the request and pinned model identity.")
        if self.kind == "manual" and (self.model or self.model_revision):
            raise ValueError("Manual edits cannot claim an AI model.")
        return self


class PreviewRequest(StrictModel):
    base_revision: Annotated[int, Field(ge=0)]
    changes: CommercialPatch
    source: Provenance


class ApprovalRequest(StrictModel):
    digest: Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]


class ExecuteRequest(ApprovalRequest):
    approval_token: Annotated[str, Field(min_length=20, max_length=200)]
    idempotency_key: Annotated[str, Field(min_length=12, max_length=100)]


class UndoRequest(StrictModel):
    base_revision: Annotated[int, Field(ge=1)]
    idempotency_key: Annotated[str, Field(min_length=12, max_length=100)]


class AssetRequest(StrictModel):
    base_revision: Annotated[int, Field(ge=0)]
    name: Annotated[str, Field(min_length=1, max_length=180, pattern=r"^[^/\\\x00-\x1f]+$")]
    units: Literal["mm", "cm", "m", "in"]
    content_base64: Annotated[str, Field(min_length=1, max_length=16777216)]
    source: Literal["user", "synthetic_reference"] = "user"
