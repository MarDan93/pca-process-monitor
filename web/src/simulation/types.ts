import type { Asset, Source } from '../api';
export type Scenario = {
  name: string; basis: 'synthetic' | 'user_declared'; material: string; cycles: number; cavities: number;
  part_mass_g: number; runner_mass_g: number; initial_material_g: number; hopper_capacity_g: number;
  dryer_enabled: boolean; drying_s: number; feed_delay_s: number; feed_rate_g_s: number;
  plasticising_s: number; closing_s: number; injection_s: number; holding_s: number; cooling_s: number;
  opening_s: number; ejection_s: number; robot_pick_s: number; robot_transfer_s: number; robot_return_s: number;
  belt_speed_mm_s: number; belt_length_mm: number; batch_pitch_mm: number;
  mould_orientation_deg: number; belt_orientation_deg: number;
};
export type ProcessEvent = { phase: string; resource: string; cycle: number; start_s: number; end_s: number; mass_delta_g: Record<string, number> };
export type Cycle = { cycle: number; injection_start_s: number; opening_start_s: number; opening_end_s: number; pick_start_s: number; pick_end_s: number; transfer_end_s: number; deposit_s: number; return_end_s: number; exit_s: number; part_ids: string[] };
export type ProcessRun = { id: string; project_id: string; project_revision: number; scenario: Scenario; asset: Asset | null; input_sha256: string; status: string; issues: string[]; engine: string; duration_s: number; events: ProcessEvent[]; cycles: Cycle[]; assumptions: string[]; summary: { completed_cycles: number; output_parts: number; shot_mass_g: number; consumed_g: number; remaining_g: number; output_g: number; runner_g: number; mean_cycle_interval_s: number | null; configured_parts_per_hour: number | null; first_deposit_s: number | null } };
export type AssistantReply = { reply: string; commercial: Record<string, unknown> | null; process: Scenario | null; source: Source; base_revision: number; validation_error?: string };
export const scenarioLabels: Record<string, string> = {
  cycles: 'Cycles', cavities: 'Cavities', part_mass_g: 'Part mass (g)', runner_mass_g: 'Runner per shot (g)', initial_material_g: 'Initial granules (g)', hopper_capacity_g: 'Hopper capacity (g)',
  drying_s: 'Drying (s)', feed_delay_s: 'Feed transport delay (s)', feed_rate_g_s: 'Feed rate (g/s)', plasticising_s: 'Plasticising (s)', closing_s: 'Closing (s)', injection_s: 'Injection (s)', holding_s: 'Holding (s)', cooling_s: 'Cooling after holding (s)', opening_s: 'Opening (s)', ejection_s: 'Ejection (s)', robot_pick_s: 'Pickup and clearance (s)', robot_transfer_s: 'Transfer to belt (s)', robot_return_s: 'Robot return (s)', belt_speed_mm_s: 'Belt speed (mm/s)', belt_length_mm: 'Belt travel (mm)', batch_pitch_mm: 'Batch pitch (mm)', mould_orientation_deg: 'Orientation at mould (°)', belt_orientation_deg: 'Required orientation at belt (°)', name: 'Scenario name', material: 'Material / grade', basis: 'Input basis', dryer_enabled: 'Dryer enabled'
};
export const phaseLabels: Record<string, string> = { drying: 'Drying', conditioning_bypassed: 'Drying bypassed', feeding: 'Feeding', plasticising: 'Plasticising', closing: 'Closing', dose_wait: 'Waiting for dose', injection: 'Injection', holding: 'Holding', cooling: 'Cooling', opening: 'Opening', ejection: 'Ejection', robot_wait: 'Waiting for robot', pickup: 'Pickup', transfer: 'Transfer', belt_wait: 'Waiting for belt', deposit: 'Deposit', return: 'Return', conveying: 'Conveying' };
export const issueLabels: Record<string, string> = { material_starved: 'Insufficient material: only the available shots were run.', hopper_too_small: 'The configured shot exceeds hopper capacity.', orientation_unreachable: 'The XYZ robot cannot change orientation. Change the mould orientation or configure another handling solution.' };
