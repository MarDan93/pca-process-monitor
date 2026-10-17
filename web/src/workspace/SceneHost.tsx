import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { mountConceptViewer } from '../../../prototype/concept-view.js';
import type { Concept } from '../geometry/import';
export type SceneControls = { view: (value: string) => void; select: (name: string) => void };
export const SceneHost = forwardRef<SceneControls, { concept: Concept | null; wire: boolean; transparent: boolean; grid: boolean; onSelection: (name: string | null) => void; onError: (error: string) => void }>(function SceneHost(props, ref) {
  const element = useRef<HTMLDivElement>(null);
  const viewer = useRef<ReturnType<typeof mountConceptViewer> | null>(null);
  const [version, setVersion] = useState(0);
  const callbacks = useRef(props); callbacks.current = props;
  useImperativeHandle(ref, () => ({ view: (value) => viewer.current?.setView(value), select: (name) => viewer.current?.select(name) }), []);
  useEffect(() => {
    if (!element.current) return;
    try {
      viewer.current = mountConceptViewer(element.current, props.concept ?? { dimensions_mm: { length: 100, width: 100, height: 100 }, components: [] }, { dark: true, onSelection: (name: string | null) => callbacks.current.onSelection(name) });
      setVersion(v => v + 1);
    } catch (error) { callbacks.current.onError((error as Error).message); }
    return () => { viewer.current?.dispose(); viewer.current = null; };
  }, [props.concept]);
  useEffect(() => { viewer.current?.setWireframe(props.wire); }, [props.wire, version]);
  useEffect(() => { viewer.current?.setTransparent(props.transparent); }, [props.transparent, version]);
  useEffect(() => { viewer.current?.setGridVisible(props.grid); }, [props.grid, version]);
  return <div ref={element} id="scene-host" className="scene-host"/>;
});
