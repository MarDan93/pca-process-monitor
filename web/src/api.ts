import type { Resource, ResourceData, ResourceKind, Layout, LayoutSpec } from './engineering/types';
import type { Scenario, ProcessRun, AssistantReply } from './simulation/types';
export type Commercial = {
  customer: string | null; reference: string | null; market: string | null;
  commercial_unit: 'part' | 'kit' | 'assembly' | null;
  annual_volume: number | null; lot_size: number | null; program_years: number | null;
  currency: string | null; unit_cost_target: string | null; selling_price: string | null;
  mould_budget: string | null; notes: string | null;
};
export type Asset = { id: string; name: string; source_units: string; sha256: string; size_bytes: number; source: string; frame: string };
export type Project = { id: string; name: string; revision: number; commercial: Commercial; asset: Asset | null; process: Scenario | null; engineering: Layout | null; production_system: import('./system/types').ProductionSystem | null; updated_at: number };
export type ProjectSummary = Pick<Project, 'id' | 'name' | 'revision'>;
export type Source = { kind: 'manual' | 'ai'; request?: string; model?: string; model_revision?: string };
export type Preview = { id: string; project_id: string; base_revision: number; digest: string; expires_at: number; effects: { field: string; before: unknown; after: unknown }[]; source: Source };
export type Revision = { revision: number; created_at: number; source: { kind: string; operation_id?: string; model?: string; tool?: string; restored_from_backup?: boolean } };
let token = '';
const approvals = new Map<string, { approval_token: string }>();
export async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch('/api' + path, { method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-Workspace-Token': token }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('mould-auth-required'));
    const error = await response.json().catch(() => ({}));
    const detail = typeof error.detail === 'string' ? error.detail : error.detail?.map((e: {loc: string[]; msg: string}) => `${e.loc.slice(1).join('.')}: ${e.msg}`).join('; ');
    throw new Error(detail || `Request failed (${response.status}).`);
  }
  return response.json();
}
export const api = {
  resources: (kind: ResourceKind) => request<Resource[]>(`/library/${kind}`),
  saveResource: (kind: ResourceKind, data: ResourceData) => request<Resource>('/library', { kind, data }),
  importResources: (kind: ResourceKind, csv_text: string, commit: boolean) => request<{valid: boolean; rows: ResourceData[]; errors: {row: number; message: string}[]; saved: Resource[]}>('/library/import', { kind, csv_text, commit }),
  sourceRegister: () => request<{verified_manufacturer_models: number; sources: {manufacturer: string; url: string; status: string}[]; families: string[]}>('/library/sources'),
  comparePresses: (project: Project) => request<{project_revision: number; alternatives: {machine: Resource; checks: import('./engineering/types').Check[]; status: string}[]}>(`/projects/${project.id}/engineering/presses`),
  previewLayout: (project: Project, changes: LayoutSpec) => request<Preview>(`/projects/${project.id}/engineering/preview`, { base_revision: project.revision, changes, source: {kind: 'manual'} }),
  processExample: () => request<Scenario>('/process/example'),
  previewProcess: (project: Project, changes: Scenario, source: Source) => request<Preview>(`/projects/${project.id}/process/preview`, { base_revision: project.revision, changes, source }),
  runProcess: (project: Project) => request<ProcessRun>(`/projects/${project.id}/process/runs`, { base_revision: project.revision }),
  latestRun: (project: Project) => request<ProcessRun | null>(`/projects/${project.id}/process/latest`),
  assistantStatus: () => request<{ enabled: boolean; ready: boolean; runtime: string; model: string; profile: string }>('/assistant/status'),
  async assistant(project: Project, message: string, mode: string, language: string, signal?: AbortSignal, history: {role: string; content: string}[] = [], scenario_id?:string): Promise<AssistantReply> {
    const response = await fetch(`/api/projects/${project.id}/assistant`, { method: 'POST', signal, headers: { 'Content-Type': 'application/json', 'X-Workspace-Token': token }, body: JSON.stringify({ base_revision: project.revision, message, mode, language,scenario_id, history: history.slice(-6).map(m => ({...m, content: m.content.slice(0, 3000)})) }) });
    if (!response.ok) { if (response.status === 401) window.dispatchEvent(new Event('mould-auth-required')); throw new Error((await response.json()).detail || 'Server AI failed.'); }
    return response.json();
  },
  authStatus: () => request<{ required: boolean; authenticated: boolean; public_origin?: string | null }>('/auth/status'),
  async login(username: string, password: string) {
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    if (!response.ok) {
      const error = await response.json();
      if (error.code === 'workspace_origin_mismatch') throw new Error(`${error.detail} Expected: ${error.public_origin}. Received: ${error.received_origin ?? '(missing)'}.`);
      throw new Error(error.detail || 'Sign-in failed.');
    }
  },
  logout: () => request('/auth/logout', {}),
  async session() { const session = await request<{ write_token: string; ai_assets_local: boolean }>('/session'); token = session.write_token; return session; },
  list: () => request<ProjectSummary[]>('/projects'),
  create: (name: string) => request<Project>('/projects', { name }),
  get: (id: string) => request<Project>(`/projects/${id}`),
  history: (id: string) => request<Revision[]>(`/projects/${id}/revisions`),
  preview: (project: Project, changes: Partial<Commercial>, source: Source) => request<Preview>(`/projects/${project.id}/operations/preview`, { base_revision: project.revision, changes, source }),
  async execute(preview: Preview, key: string) {
    const base = `/projects/${preview.project_id}/operations/${preview.id}`;
    let approval = approvals.get(preview.id);
    if (!approval) {
      approval = await request<{ approval_token: string }>(`${base}/approve`, { digest: preview.digest });
      approvals.set(preview.id, approval);
    }
    await request<Project>(`${base}/execute`, { ...approval, digest: preview.digest, idempotency_key: key });
    return request<Project>(`/projects/${preview.project_id}`);
  },
  undo: (project: Project, operationId: string, key: string) => request<Project>(`/projects/${project.id}/operations/${operationId}/undo`, { base_revision: project.revision, idempotency_key: key }),
  async importAsset(project: Project, file: File, units: string, source = 'user') {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
    return request<Project>(`/projects/${project.id}/assets`, { base_revision: project.revision, name: file.name, units, content_base64: btoa(binary), source });
  },
  async asset(project: Project) {
    if (!project.asset) throw new Error('No mesh available.');
    const response = await fetch(`/api/projects/${project.id}/assets/${project.asset.id}`);
    if (!response.ok) throw new Error('The stored mesh could not be loaded.');
    return response.arrayBuffer();
  },
};
