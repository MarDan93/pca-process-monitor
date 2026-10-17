export type Concept = { components: { name: string; vertices: number[][]; triangles: number[][] }[]; dimensions_mm: { length: number; width: number; height: number }; triangle_count?: number; display_offset_mm?: number[]; model_kind?: string };
export function parseMesh(buffer: ArrayBuffer, name: string, units: string): Promise<Concept> {
  if (buffer.byteLength > 12 * 1024 * 1024) return Promise.reject(new Error('The mesh exceeds the 12 MiB limit.'));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./mesh-worker.ts', import.meta.url), { type: 'module' });
    const finish = () => { clearTimeout(timer); worker.terminate(); };
    const timer = setTimeout(() => { finish(); reject(new Error('Mesh parsing exceeded 8 seconds. Simplify the file.')); }, 8000);
    worker.onmessage = ({ data }) => { finish(); data.error ? reject(new Error(data.error)) : resolve(data.concept); };
    worker.onerror = () => { finish(); reject(new Error('The mesh parser could not read this file.')); };
    worker.postMessage({ buffer, name, units }, [buffer]);
  });
}
