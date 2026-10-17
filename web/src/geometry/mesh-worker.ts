import { importMesh } from '../../../prototype/mesh-import.js';
self.onmessage = ({ data }) => {
  try { self.postMessage({ concept: importMesh(data.buffer, data.name, data.units) }); }
  catch (error) { self.postMessage({ error: (error as Error).message }); }
};
