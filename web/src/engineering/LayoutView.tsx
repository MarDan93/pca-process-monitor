import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { mountConceptViewer } from '../../../prototype/concept-view.js';
import type { Concept } from '../geometry/import';
import type { Layout } from './types';
function box(name:string,x:number,y:number,z:number,a:number,b:number,c:number){const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([i,j,k])=>[x+i*a/2,y+j*b/2,z+k*c/2]);return {name,vertices,triangles:[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]]};}
export function layoutConcept(layout:Layout,part:Concept):Concept{
 const all=part.components.flatMap(c=>c.vertices),center=[0,0,0];
 // Iteration avoids spreading large user meshes into function arguments.
 for(let i=0;i<3;i++){let lo=Infinity,hi=-Infinity;for(const v of all){lo=Math.min(lo,v[i]);hi=Math.max(hi,v[i]);}center[i]=(lo+hi)/2;}
 const axis=layout.spec.ejection_axis,rotate=(p:number[])=>axis==='x'?p:axis==='y'?[p[1],-p[0],p[2]]:[p[2],p[1],-p[0]];
 const components=layout.cavity_positions_mm.flatMap((pos,n)=>part.components.map(c=>({name:`C${n+1} · ${c.name}`,triangles:c.triangles,vertices:c.vertices.map(v=>rotate(v.map((x,i)=>x-center[i])).map((x,i)=>x+pos[i]))})));
 const {width_mm:w,height_mm:h}=layout.mould,th=layout.spec.plate_thickness_mm,d=layout.part_cell_bounds_mm[0];
 components.push(box('Fixed plate envelope',d/2+th/2,0,0,th,w,h),box('Moving plate envelope',-d/2-th/2-layout.spec.opening_mm,0,0,th,w,h));
 return {components,dimensions_mm:{length:layout.mould.depth_mm+layout.spec.opening_mm,width:w,height:h},model_kind:'imported_mesh'};
}
export function LayoutView({layout,concept,active,t,controlsRef}:{layout:Layout;concept:Concept;active:boolean;controlsRef:Ref<{view:(v:string)=>void}>;t:(s:string)=>string}){
 const viewer=useRef<ReturnType<typeof mountConceptViewer> | null>(null);
 useImperativeHandle(controlsRef,()=>({view:(v:string)=>viewer.current?.setView(v)}),[]);
 const host=useRef<HTMLDivElement>(null),mesh=useMemo(()=>layoutConcept(layout,concept),[layout,concept]);
 useEffect(()=>{if(!host.current)return;const v=mountConceptViewer(host.current,mesh,{dark:true});viewer.current=v;v.setTransparent(true);return()=>{v.dispose();viewer.current=null;};},[mesh]);
 return <div className="layout-workbench" hidden={!active}><div className="process-view-title"><span className="badge">{t('Preliminary layout')}</span><strong>{t('Product → mould → press')}</strong></div><div id="layout-view" ref={host}/><p className="layout-note">{t('Plate envelopes and product copies. No shaped cavity, slides, cooling or collision validation yet.')}</p></div>;
}
