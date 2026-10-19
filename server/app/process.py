"""Bounded L0 scheduling, not a polymer flow/thermal solver. Units: s, g, mm."""
from typing import Annotated, Literal

from pydantic import Field

from .schemas import Provenance, StrictModel

Seconds = Annotated[float, Field(ge=0, le=86400, allow_inf_nan=False)]
Positive = Annotated[float, Field(gt=0, le=1e7, allow_inf_nan=False)]


class ProcessScenario(StrictModel):
    name: Annotated[str, Field(min_length=1, max_length=120)]
    basis: Literal["synthetic", "user_declared"]
    material: Annotated[str, Field(min_length=1, max_length=120)]
    cycles: Annotated[int, Field(ge=1, le=100)]
    cavities: Annotated[int, Field(ge=1, le=8)]
    part_mass_g: Positive
    runner_mass_g: Annotated[float, Field(ge=0, le=1e7, allow_inf_nan=False)]
    initial_material_g: Positive
    hopper_capacity_g: Positive
    dryer_enabled: bool
    drying_s: Seconds
    feed_delay_s: Seconds
    feed_rate_g_s: Positive
    plasticising_s: Seconds
    closing_s: Seconds
    injection_s: Annotated[float, Field(gt=0, le=3600, allow_inf_nan=False)]
    holding_s: Seconds
    cooling_s: Seconds
    opening_s: Seconds
    ejection_s: Seconds
    robot_pick_s: Seconds
    robot_transfer_s: Annotated[float, Field(gt=0, le=3600, allow_inf_nan=False)]
    robot_return_s: Seconds
    belt_speed_mm_s: Positive
    belt_length_mm: Positive
    batch_pitch_mm: Positive
    mould_orientation_deg: Literal[0, 90, 180, 270]
    belt_orientation_deg: Literal[0, 90, 180, 270]


class ProcessPreviewRequest(StrictModel):
    base_revision: Annotated[int, Field(ge=0)]
    changes: ProcessScenario
    source: Provenance


class RunRequest(StrictModel):
    base_revision: Annotated[int, Field(ge=0)]


def example():
    """Explicitly opted-in fixture. No polymer grade properties are inferred."""
    return ProcessScenario(name="Configured cycle example", basis="synthetic", material="Unspecified grade — synthetic timing fixture",
        cycles=5, cavities=2, part_mass_g=20., runner_mass_g=4., initial_material_g=1000., hopper_capacity_g=200.,
        dryer_enabled=True, drying_s=20., feed_delay_s=1., feed_rate_g_s=44., plasticising_s=5., closing_s=1.,
        injection_s=1., holding_s=3., cooling_s=8., opening_s=1., ejection_s=1., robot_pick_s=2.,
        robot_transfer_s=3., robot_return_s=2., belt_speed_mm_s=100., belt_length_mm=1200., batch_pitch_mm=180.,
        mould_orientation_deg=0, belt_orientation_deg=0)


def simulate(s: ProcessScenario):
    events, cycles, issues = [], [], []
    initial = s.initial_material_g
    dose = s.cavities * s.part_mass_g + s.runner_mass_g
    part_mass = s.cavities * s.part_mass_g
    def event(phase, resource, cycle, start, end, delta=None):
        events.append({"phase": phase, "resource": resource, "cycle": cycle, "start_s": start, "end_s": end, "mass_delta_g": delta or {}})
    if s.mould_orientation_deg != s.belt_orientation_deg:
        issues.append("orientation_unreachable")
    if dose > s.hopper_capacity_g:
        issues.append("hopper_too_small")
    ready = s.drying_s if s.dryer_enabled else 0.
    if not issues:
        event("drying" if s.dryer_enabled else "conditioning_bypassed", "dryer", 0, 0., ready, {"raw": -initial, "conditioned": initial})
    press_free = robot_free = feeder_free = screw_free = hopper_free = belt_free = 0.
    remaining = initial
    for number in range(1, s.cycles + 1):
        if issues and not cycles:
            break
        if remaining + 1e-9 < dose:
            issues.append("material_starved")
            break
        remaining = max(0., remaining - dose)
        feed_start = max(ready, feeder_free, hopper_free)
        feed_end = feed_start + s.feed_delay_s + dose / s.feed_rate_g_s
        event("feeding", "feeder", number, feed_start, feed_end, {"conditioned": -dose, "hopper": dose})
        plastic_start = max(feed_end, screw_free)
        plastic_end = plastic_start + s.plasticising_s
        # The hopper reserves at most one configured dose until plasticising ends.
        feeder_free, hopper_free = feed_end, plastic_end
        event("plasticising", "screw", number, plastic_start, plastic_end, {"hopper": -dose, "melt": dose})
        close_end = press_free + s.closing_s
        event("closing", "press", number, press_free, close_end)
        inject_start = max(close_end, plastic_end)
        if inject_start > close_end:
            event("dose_wait", "press", number, close_end, inject_start)
        inject_end = inject_start + s.injection_s
        event("injection", "press", number, inject_start, inject_end, {"melt": -dose, "mould": dose})
        hold_end = inject_end + s.holding_s
        event("holding", "press", number, inject_end, hold_end)
        # Screw recovery for the next shot overlaps subsequent cooling/open/pick.
        screw_free = hold_end
        cool_end = hold_end + s.cooling_s
        event("cooling", "press", number, hold_end, cool_end)
        open_end = cool_end + s.opening_s
        event("opening", "press", number, cool_end, open_end)
        eject_end = open_end + s.ejection_s
        event("ejection", "press", number, open_end, eject_end)
        pick_start = max(eject_end, robot_free)
        if pick_start > eject_end:
            event("robot_wait", "press", number, eject_end, pick_start)
        pick_end = pick_start + s.robot_pick_s
        event("pickup", "robot", number, pick_start, pick_end, {"mould": -dose, "robot": part_mass, "runner": s.runner_mass_g})
        transfer_end = pick_end + s.robot_transfer_s
        event("transfer", "robot", number, pick_end, transfer_end)
        deposit = max(transfer_end, belt_free)
        if deposit > transfer_end:
            event("belt_wait", "robot", number, transfer_end, deposit)
        event("deposit", "robot", number, deposit, deposit, {"robot": -part_mass, "belt": part_mass})
        robot_free = deposit + s.robot_return_s
        event("return", "robot", number, deposit, robot_free)
        exit_time = deposit + s.belt_length_mm / s.belt_speed_mm_s
        event("conveying", "belt", number, deposit, exit_time, {"belt": -part_mass, "output": part_mass})
        press_free = pick_end
        belt_free = deposit + s.batch_pitch_mm / s.belt_speed_mm_s
        cycles.append({"cycle": number, "feed_start_s": feed_start, "injection_start_s": inject_start,
            "opening_start_s": cool_end, "opening_end_s": open_end, "pick_start_s": pick_start, "pick_end_s": pick_end,
            "transfer_end_s": transfer_end, "deposit_s": deposit, "return_end_s": robot_free, "exit_s": exit_time,
            "part_ids": [f"C{number}-P{c}" for c in range(1, s.cavities + 1)]})
    events.sort(key=lambda e: (e["start_s"], e["end_s"], e["cycle"], e["phase"]))
    duration = max((e["end_s"] for e in events), default=0.)
    intervals = [b["injection_start_s"] - a["injection_start_s"] for a, b in zip(cycles, cycles[1:])]
    interval = sum(intervals) / len(intervals) if intervals else None
    return {"engine": "configured-l0/1", "fidelity": "L0 configured times; no polymer or thermal field solution",
        "status": "completed" if len(cycles) == s.cycles else "partial" if cycles else "blocked",
        "issues": issues, "events": events, "cycles": cycles, "duration_s": duration,
        "summary": {"completed_cycles": len(cycles), "output_parts": len(cycles) * s.cavities,
            "shot_mass_g": dose, "consumed_g": len(cycles) * dose, "runner_g": len(cycles) * s.runner_mass_g,
            "remaining_g": remaining, "output_g": len(cycles) * part_mass,
            "mean_cycle_interval_s": interval, "configured_parts_per_hour": 3600 * s.cavities / interval if interval else None,
            "first_deposit_s": cycles[0]["deposit_s"] if cycles else None},
        "assumptions": ["Batch drying qualifies the entire initial stock at its configured end time; moisture is not calculated.",
            "No feeder refill, scrap regrind, rejects or quality qualification is modelled.",
            "Mass transfers occur at phase completion; this is a discrete inventory model.",
            "Holding ends before next-shot screw recovery; cooling starts after holding.",
            "The mould is free after pickup includes robot clearance; transfer/return may overlap the next cycle.",
            "One XYZ robot carries all cavities together; orientation is unchanged. Linear paths have no collision/acceleration validation.",
            "Belt batches occupy parallel cavity lanes with configured longitudinal pitch. Rates are configured, not validated good production."]}
