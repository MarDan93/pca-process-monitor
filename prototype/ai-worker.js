import { pipeline, env } from './node_modules/@huggingface/transformers/dist/transformers.web.js';
import { AI_MODEL, AI_MODEL_REVISION, buildAIMessages } from './ai-contract.js';

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2/dist/';
const browserFetch = self.fetch.bind(self);
self.fetch = async (input, options) => {
  try { return await browserFetch(input, options); }
  catch (error) {
    const url = new URL(typeof input === 'string' ? input : input.url, self.location.href);
    // Report the destination without signed URL parameters or other request metadata.
    throw new Error(`Download failed at ${url.origin}${url.pathname}: ${error.message}`);
  }
};
let generator;
let running = false;
const send = (type, payload = {}) => self.postMessage({ type, ...payload });

self.onmessage = async ({ data }) => {
  if (running) return;
  running = true;
  try {
    if (data.type === 'load') {
      // Static hosts may serve the same pinned model/runtime files from their own origin.
      for (const value of [data.assets?.modelHost, data.assets?.wasmBase].filter(Boolean)) {
        if (!['http:', 'https:'].includes(new URL(value).protocol)) throw new Error('AI asset hosts must use HTTP or HTTPS.');
      }
      if (data.assets?.modelHost) env.remoteHost = data.assets.modelHost.replace(/\/?$/, '/');
      if (data.assets?.wasmBase) env.backends.onnx.wasm.wasmPaths = data.assets.wasmBase.replace(/\/?$/, '/');
      generator ??= await pipeline('text-generation', AI_MODEL, {
        revision: AI_MODEL_REVISION, dtype: 'q4', device: 'wasm',
        progress_callback: (progress) => send('progress', { file: progress.file ?? '', progress: progress.progress ?? null, status: progress.status, loaded: progress.loaded, total: progress.total }),
      });
      send('ready', { model: AI_MODEL, revision: AI_MODEL_REVISION });
    } else if (data.type === 'generate') {
      if (!generator) throw new Error('Load the AI model first.');
      const messages = buildAIMessages(data.context, data.language, data.messages, data.mode);
      const result = await generator(messages, { max_new_tokens: data.mode === 'chat' ? 180 : 320, do_sample: false, return_full_text: false });
      const generated = result[0]?.generated_text;
      const text = Array.isArray(generated) ? generated.at(-1)?.content : generated;
      if (typeof text !== 'string' || !text.trim()) throw new Error('The model returned no text.');
      send('result', { text });
    }
  } catch (error) { send('error', { message: String(error.message ?? error).slice(0, 1200) }); }
  finally { running = false; }
};
