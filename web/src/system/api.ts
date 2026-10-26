import {request, type Project, type Preview, type Source} from '../api';
import type {Comparison,SystemScenario,SystemState,SystemRun} from './types';
export const systemAPI={
 benchmark:()=>request<Project>('/system/benchmark',{}),
 template:()=>request<SystemScenario>('/system/template'),
 state:(p:Project)=>request<SystemState>(`/projects/${p.id}/system`),
 latest:(p:Project,id:string)=>request<SystemRun|null>(`/projects/${p.id}/system/latest/${id}`),
 preview:(p:Project,id:string|null,changes:SystemScenario,source:Source={kind:'manual'})=>request<Preview>(`/projects/${p.id}/system/preview`,{base_revision:p.revision,scenario_id:id,changes,source}),
 compare:(p:Project,ids:string[])=>request<Comparison>(`/projects/${p.id}/system/compare`,{base_revision:p.revision,scenario_ids:ids}),
 backup:(p:Project)=>request<Record<string,unknown>>(`/projects/${p.id}/backup`),
 inspectBackup:(backup:unknown)=>request<{name:string;sha256:string;assets:number;revisions:number;runs:number;notice:string}>('/backups/preview',{backup}),
 restore:(backup:unknown,approved_sha256:string)=>request<Project>('/backups/restore',{backup,approved_sha256}),
};
export function downloadJSON(value:unknown,name:string){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
