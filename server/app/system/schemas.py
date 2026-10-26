"""Versioned inputs. No CFD, material-grade or OEM properties are inferred."""
from decimal import Decimal
from typing import Annotated, Literal
from pydantic import Field, field_serializer, field_validator, model_validator
from ..schemas import StrictModel, CommercialPatch, Money, Provenance
from ..process import ProcessScenario

Positive = Annotated[float, Field(gt=0, le=1e7, allow_inf_nan=False)]
Seconds = Annotated[float, Field(ge=0, le=86400, allow_inf_nan=False)]
Count = Annotated[int, Field(ge=1, le=100000)]

class RobotConfiguration(StrictModel):
    eoat_slots: Annotated[int, Field(ge=1, le=8)]
    allow_multiple_trips: bool
    payload_kg: Positive | None = None
    eoat_mass_kg: Annotated[float, Field(ge=0, le=1000)] | None = None
    eoat_pitch_mm: Positive | None = None
    reindex_s: Seconds
    reach_mm: Positive | None = None
    required_reach_mm: Positive | None = None
    clearance_mm: Positive
    transfer_distance_mm: Positive
    deposit_height_mm: Positive

class ConveyorConfiguration(StrictModel):
    capacity_parts: Annotated[int, Field(ge=1, le=1000)]
    length_mm: Positive
    speed_mm_s: Positive
    minimum_batch_pitch_mm: Positive

class PackagingOperation(StrictModel):
    enabled: bool
    parts_per_container: Count
    handling_s_per_part: Seconds
    container_change_s: Seconds
    supply: Literal['unlimited_configured','finite']
    available_containers: Count | None = None
    required_orientation_deg: Literal[0,90,180,270]

    @model_validator(mode='after')
    def declared_supply(self):
        if self.supply=='finite' and self.available_containers is None:
            raise ValueError('Finite container supply requires an explicit count.')
        return self

class MouldConfiguration(StrictModel):
    ejection_axis: Literal['x','y','z']
    cavity_gap_mm: Positive
    edge_allowance_mm: Positive
    plate_thickness_mm: Positive
    opening_mm: Positive
    projected_area_mm2: Positive | None = None
    cavity_pressure_mpa: Annotated[float,Field(gt=0,le=500)] | None = None
    clamp_safety_factor: Annotated[float,Field(ge=1,le=3)]

class SystemCosts(StrictModel):
    currency: Literal['EUR','USD','GBP','CHF','CAD','JPY']
    material_per_kg: Money | None = None
    robot_per_hour: Money | None = None
    packaging_per_hour: Money | None = None
    container_each: Money | None = None
    tooling_investment: Money | None = None
    energy_in_hourly_rates: bool
    additional_energy_per_shot: Money | None = None
    operating_hours_per_year: Positive | None = None
    annual_good_demand: Annotated[int,Field(ge=0,le=9007199254740991)] | None = None
    programme_years: Positive | None = None

    @field_validator('material_per_kg','robot_per_hour','packaging_per_hour','container_each','tooling_investment','additional_energy_per_shot',mode='before')
    @classmethod
    def exact(cls,value):return CommercialPatch.exact_amount(value)

    @field_serializer('material_per_kg','robot_per_hour','packaging_per_hour','container_each','tooling_investment','additional_energy_per_shot')
    def amount(self,value):return None if value is None else format(value,'f')

class ProductionSystemScenario(StrictModel):
    schema_version: Literal['fabrivra.system-scenario/1']='fabrivra.system-scenario/1'
    name: Annotated[str,Field(min_length=1,max_length=120)]
    origin: Literal['synthetic_demo','user_declared']
    source_ref: Annotated[str,Field(min_length=1,max_length=600)]
    policy: Literal['exploratory','require_known_l0_constraints']
    machine_id: str | None
    material_id: str | None
    recipe: ProcessScenario
    mould: MouldConfiguration
    robot: RobotConfiguration
    conveyor: ConveyorConfiguration
    packaging: PackagingOperation
    costs: SystemCosts

    @model_validator(mode='after')
    def coherent(self):
        if self.origin=='synthetic_demo' and self.recipe.basis!='synthetic':raise ValueError('Synthetic scenarios must label the recipe synthetic.')
        if self.recipe.belt_speed_mm_s!=self.conveyor.speed_mm_s or self.recipe.belt_length_mm!=self.conveyor.length_mm or self.recipe.batch_pitch_mm!=self.conveyor.minimum_batch_pitch_mm:
            raise ValueError('Recipe conveyor fields must match the central conveyor configuration.')
        return self

class ScenarioPreview(StrictModel):
    base_revision: Annotated[int,Field(ge=0)]
    scenario_id: str | None = None
    changes: ProductionSystemScenario
    source: Provenance

class ScenarioCompare(StrictModel):
    base_revision: Annotated[int,Field(ge=0)]
    scenario_ids: Annotated[list[str],Field(min_length=1,max_length=6)]

    @model_validator(mode='after')
    def distinct(self):
        if len(set(self.scenario_ids))!=len(self.scenario_ids):raise ValueError('Compare distinct scenario IDs.')
        return self

class ModelManifest(StrictModel):
    id: str
    version: str
    fidelity: Literal['L0','L1','L2','forecast']
    implementation: Literal['implemented','unavailable']
    license: str
    validity: str

class InterfacePort(StrictModel):
    id: str
    node: str
    quantity: str
    unit: str
    frame: str
    time_basis: str

class CAEOutput(StrictModel):
    schema_version: Literal['fabrivra.cae-output/1']
    source_case_id: str
    source_geometry_sha256: str
    solver: str
    solver_version: str
    converged: bool
    validation: Literal['computed_unvalidated','independently_validated','failed']
    cooling_constraint_s: Seconds | None = None
    maximum_pressure_mpa: Positive | None = None
    source_ref: str

    @model_validator(mode='after')
    def no_false_validation(self):
        if not self.converged and self.validation!='failed':raise ValueError('Non-converged CAE cannot supply usable/validated outputs.')
        return self

class ForecastOutput(StrictModel):
    schema_version: Literal['fabrivra.forecast-output/1']
    model_id: str
    model_version: str
    training_data_sha256: str
    time_basis: str
    unit: str
    timestamps_s: list[Annotated[float,Field(allow_inf_nan=False)]]
    median: list[Annotated[float,Field(allow_inf_nan=False)]]
    lower: list[Annotated[float,Field(allow_inf_nan=False)]]
    upper: list[Annotated[float,Field(allow_inf_nan=False)]]

    @model_validator(mode='after')
    def probabilistic_contract(self):
        n=len(self.timestamps_s)
        if any(len(v)!=n for v in (self.median,self.lower,self.upper)) or any(a>=b for a,b in zip(self.timestamps_s,self.timestamps_s[1:])):raise ValueError('Forecast arrays/time basis must align.')
        if any(lo>mid or mid>hi for lo,mid,hi in zip(self.lower,self.median,self.upper)):raise ValueError('Forecast intervals must contain their medians.')
        return self
