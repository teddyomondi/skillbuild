// vite.config.js
import path2 from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "file:///C:/Users/Teddy/scrimba-ai-ide/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Teddy/scrimba-ai-ide/node_modules/@vitejs/plugin-react/dist/index.js";

// server/apiHandler.js
import fs from "node:fs";
import path from "node:path";
import { generateText } from "file:///C:/Users/Teddy/scrimba-ai-ide/node_modules/ai/dist/index.js";
import { createOpenAI } from "file:///C:/Users/Teddy/scrimba-ai-ide/node_modules/@ai-sdk/openai/dist/index.js";
import { createGoogleGenerativeAI } from "file:///C:/Users/Teddy/scrimba-ai-ide/node_modules/@ai-sdk/google/dist/index.js";
import { createAnthropic } from "file:///C:/Users/Teddy/scrimba-ai-ide/node_modules/@ai-sdk/anthropic/dist/index.js";
function ensureEnvLoaded() {
  if (process.env.LLM_API_KEY && process.env.LLM_PROVIDER) return;
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!match) continue;
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        if (!process.env[match[1]]) {
          process.env[match[1]] = value;
        }
      }
    }
  } catch {
  }
}
async function readJsonBody(request, maxBytes = 512 * 1024) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }
  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      return {};
    }
  }
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > maxBytes) throw new Error("Request body is too large.");
  }
  return JSON.parse(body || "{}");
}
function sendJsonResponse(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(body));
}
async function callServerLlm({
  systemPrompt,
  userPrompt,
  apiConfig = {},
  expectJson = true,
  temperature = 0.45
}) {
  ensureEnvLoaded();
  const provider = (apiConfig.provider || process.env.LLM_PROVIDER || process.env.VITE_LLM_PROVIDER || "gemini").trim().toLowerCase();
  const apiKey = (apiConfig.apiKey || process.env.LLM_API_KEY || process.env.VITE_LLM_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || "").trim();
  const baseUrl = (apiConfig.baseUrl || process.env.LLM_BASE_URL || process.env.VITE_LLM_BASE_URL || "").trim();
  const defaults = {
    gemini: "gemini-2.5-flash",
    openai: "gpt-4o-mini",
    anthropic: "claude-3-5-haiku-latest",
    custom: "gpt-4o-mini"
  };
  const rawModel = (apiConfig.model || process.env.LLM_MODEL || process.env.VITE_LLM_MODEL || defaults[provider] || defaults.gemini).trim();
  let modelId = rawModel;
  if (provider === "gemini") {
    if (rawModel.startsWith("gpt-") || rawModel === "gemini-1.5-flash" || rawModel === "gemini-2.0-flash" || !rawModel) {
      modelId = "gemini-2.5-flash";
    }
  }
  let primaryError = null;
  if (apiKey || provider === "custom" && baseUrl) {
    try {
      let model;
      if (provider === "gemini") {
        const google = createGoogleGenerativeAI({ apiKey });
        model = google(modelId);
      } else if (provider === "anthropic") {
        const anthropic = createAnthropic({
          apiKey,
          baseURL: baseUrl || "https://api.anthropic.com/v1"
        });
        model = anthropic(modelId);
      } else {
        const openai = createOpenAI({
          apiKey: apiKey || "local-endpoint-no-key",
          baseURL: baseUrl || "https://api.openai.com/v1"
        });
        model = openai(modelId);
      }
      const { text } = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: Math.min(1, Math.max(0, Number(temperature) || 0.45)),
        abortSignal: AbortSignal.timeout(3e4)
      });
      if (text) {
        return { text, providerUsed: provider };
      }
    } catch (err) {
      let friendlyMessage = err.message;
      if (/quota/i.test(err.message) || /limit: 20/i.test(err.message) || /free_tier_requests/i.test(err.message)) {
        friendlyMessage = "Google Gemini Free Tier daily quota reached (limit: 20 requests/day on this API key). Running on backup AI.";
      }
      primaryError = new Error(friendlyMessage);
      console.warn(`[AI Server] Primary provider (${provider}) failed:`, friendlyMessage);
    }
  }
  try {
    const liveRes = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model: "openai",
        messages: [
          { role: "system", content: expectJson ? `${systemPrompt}
IMPORTANT: Reply with valid JSON ONLY.` : systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: Math.min(1, Math.max(0, Number(temperature) || 0.45))
      }),
      signal: AbortSignal.timeout(25e3)
    });
    if (!liveRes.ok) {
      throw new Error(`Fallback service returned status ${liveRes.status} (${liveRes.statusText})`);
    }
    const liveData = await liveRes.json();
    const rawContent = liveData?.choices?.[0]?.message?.content;
    if (rawContent) {
      return {
        text: rawContent,
        providerUsed: "zero-key-fallback",
        isFallback: true,
        primaryError: primaryError?.message
      };
    }
  } catch (fallbackErr) {
    console.error("[AI Server] Zero-key fallback failed:", fallbackErr.message);
    const combinedMessage = primaryError ? `Primary provider (${provider}) error: ${primaryError.message}. Zero-key fallback error: ${fallbackErr.message}.` : `Zero-key fallback error: ${fallbackErr.message}. Please configure an API key in AI Settings.`;
    throw new Error(combinedMessage);
  }
  throw new Error("No AI response was generated.");
}
async function handleApi(request, response, pathname) {
  ensureEnvLoaded();
  if (request.method !== "POST") {
    sendJsonResponse(response, 405, { error: "Use POST for this endpoint." });
    return;
  }
  try {
    const body = await readJsonBody(request);
    if (pathname === "/api/tutor") {
      const { systemPrompt, userPrompt, apiConfig = {}, expectJson = true, temperature = 0.45 } = body;
      if (typeof systemPrompt !== "string" || typeof userPrompt !== "string") {
        sendJsonResponse(response, 400, { error: "A system prompt and learner message are required." });
        return;
      }
      const { text, providerUsed, isFallback, primaryError } = await callServerLlm({
        systemPrompt,
        userPrompt,
        apiConfig,
        expectJson,
        temperature
      });
      sendJsonResponse(response, 200, {
        result: text,
        text,
        providerUsed,
        isFallback: Boolean(isFallback),
        providerError: primaryError || null
      });
      return;
    }
    if (pathname === "/api/tts") {
      const elevenKey = (process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY || "").trim();
      const input = typeof body.input === "string" ? body.input.slice(0, 4e3) : "";
      if (!input) {
        sendJsonResponse(response, 400, { error: "Speech text is required." });
        return;
      }
      if (elevenKey) {
        const voiceId = body.voiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
        try {
          const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
              "xi-api-key": elevenKey,
              "Content-Type": "application/json",
              "Accept": "audio/mpeg"
            },
            body: JSON.stringify({
              text: input,
              model_id: "eleven_turbo_v2_5",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
              }
            }),
            signal: AbortSignal.timeout(45e3)
          });
          if (elevenRes.ok) {
            response.writeHead(200, {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
              "X-Content-Type-Options": "nosniff"
            });
            response.end(Buffer.from(await elevenRes.arrayBuffer()));
            return;
          }
        } catch (err) {
          console.warn("[TTS] ElevenLabs request failed, falling back to OpenAI:", err.message);
        }
      }
      const apiKey = (process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || process.env.VITE_LLM_API_KEY || "").trim();
      if (!apiKey) {
        sendJsonResponse(response, 503, {
          error: "Set ELEVENLABS_API_KEY or OPENAI_API_KEY on the server to use high quality voice."
        });
        return;
      }
      const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"].includes(body.voice) ? body.voice : "nova",
          input
        }),
        signal: AbortSignal.timeout(6e4)
      });
      if (!ttsResponse.ok) {
        sendJsonResponse(response, ttsResponse.status, {
          error: "The speech provider could not create audio."
        });
        return;
      }
      response.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      });
      response.end(Buffer.from(await ttsResponse.arrayBuffer()));
      return;
    }
    sendJsonResponse(response, 404, { error: "API endpoint not found." });
  } catch (error) {
    const status = /too large/i.test(error.message) ? 413 : 500;
    sendJsonResponse(response, status, { error: error.message || "AI service error." });
  }
}

// vite.config.js
var __vite_injected_original_import_meta_url = "file:///C:/Users/Teddy/scrimba-ai-ide/vite.config.js";
var __dirname = path2.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
function apiMiddlewarePlugin() {
  const handler = async (req, res, next) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) {
      return handleApi(req, res, url.pathname);
    }
    next();
  };
  return {
    name: "api-server-middleware",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);
  return {
    plugins: [react(), apiMiddlewarePlugin()],
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    resolve: {
      alias: {
        "@": path2.resolve(__dirname, "./src")
      }
    },
    define: {
      "process.env.IS_PREACT": JSON.stringify("true"),
      "process.env": {}
    },
    server: {
      port: 5173,
      headers: {
        "Cross-Origin-Embedder-Policy": "credentialless",
        "Cross-Origin-Opener-Policy": "same-origin"
      }
    },
    preview: {
      port: 5173,
      headers: {
        "Cross-Origin-Embedder-Policy": "credentialless",
        "Cross-Origin-Opener-Policy": "same-origin"
      }
    },
    build: {
      target: "esnext",
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("monaco-editor") || id.includes("@monaco-editor")) {
                return "vendor-monaco";
              }
              if (id.includes("@excalidraw")) {
                return "vendor-excalidraw";
              }
              if (id.includes("@xterm") || id.includes("@webcontainer")) {
                return "vendor-runtime-engine";
              }
              if (id.includes("@clerk")) {
                return "vendor-clerk";
              }
              if (id.includes("katex") || id.includes("cytoscape")) {
                return "vendor-visuals";
              }
            }
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAic2VydmVyL2FwaUhhbmRsZXIuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxUZWRkeVxcXFxzY3JpbWJhLWFpLWlkZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVGVkZHlcXFxcc2NyaW1iYS1haS1pZGVcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1RlZGR5L3NjcmltYmEtYWktaWRlL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IGhhbmRsZUFwaSB9IGZyb20gJy4vc2VydmVyL2FwaUhhbmRsZXIuanMnO1xuXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKTtcblxuZnVuY3Rpb24gYXBpTWlkZGxld2FyZVBsdWdpbigpIHtcbiAgY29uc3QgaGFuZGxlciA9IGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybCwgJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICBpZiAodXJsLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9hcGkvJykpIHtcbiAgICAgIHJldHVybiBoYW5kbGVBcGkocmVxLCByZXMsIHVybC5wYXRobmFtZSk7XG4gICAgfVxuICAgIG5leHQoKTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdhcGktc2VydmVyLW1pZGRsZXdhcmUnLFxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoaGFuZGxlcik7XG4gICAgfSxcbiAgICBjb25maWd1cmVQcmV2aWV3U2VydmVyKHNlcnZlcikge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShoYW5kbGVyKTtcbiAgICB9XG4gIH07XG59XG5cbi8vIENyb3NzLU9yaWdpbiBJc29sYXRpb24gaGVhZGVycyByZXF1aXJlZCBmb3IgQHdlYmNvbnRhaW5lci9hcGkgKFNoYXJlZEFycmF5QnVmZmVyKVxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBFbnN1cmUgYWxsIC5lbnYgdmFyaWFibGVzIChMTE1fQVBJX0tFWSwgTExNX1BST1ZJREVSLCBldGMuKSBhcmUgYXZhaWxhYmxlIHRvIE5vZGUgc2VydmVyIG1pZGRsZXdhcmVcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG4gIE9iamVjdC5hc3NpZ24ocHJvY2Vzcy5lbnYsIGVudik7XG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbcmVhY3QoKSwgYXBpTWlkZGxld2FyZVBsdWdpbigpXSxcbiAgICBlbnZQcmVmaXg6IFsnVklURV8nLCAnTkVYVF9QVUJMSUNfJ10sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBkZWZpbmU6IHtcbiAgICAgICdwcm9jZXNzLmVudi5JU19QUkVBQ1QnOiBKU09OLnN0cmluZ2lmeSgndHJ1ZScpLFxuICAgICAgJ3Byb2Nlc3MuZW52Jzoge30sXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDcm9zcy1PcmlnaW4tRW1iZWRkZXItUG9saWN5JzogJ2NyZWRlbnRpYWxsZXNzJyxcbiAgICAgICAgJ0Nyb3NzLU9yaWdpbi1PcGVuZXItUG9saWN5JzogJ3NhbWUtb3JpZ2luJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBwcmV2aWV3OiB7XG4gICAgICBwb3J0OiA1MTczLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ3Jvc3MtT3JpZ2luLUVtYmVkZGVyLVBvbGljeSc6ICdjcmVkZW50aWFsbGVzcycsXG4gICAgICAgICdDcm9zcy1PcmlnaW4tT3BlbmVyLVBvbGljeSc6ICdzYW1lLW9yaWdpbicsXG4gICAgICB9LFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIHRhcmdldDogJ2VzbmV4dCcsXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEyMDAsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ21vbmFjby1lZGl0b3InKSB8fCBpZC5pbmNsdWRlcygnQG1vbmFjby1lZGl0b3InKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLW1vbmFjbyc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAZXhjYWxpZHJhdycpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItZXhjYWxpZHJhdyc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAeHRlcm0nKSB8fCBpZC5pbmNsdWRlcygnQHdlYmNvbnRhaW5lcicpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItcnVudGltZS1lbmdpbmUnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQGNsZXJrJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1jbGVyayc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdrYXRleCcpIHx8IGlkLmluY2x1ZGVzKCdjeXRvc2NhcGUnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXZpc3VhbHMnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn0pO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxUZWRkeVxcXFxzY3JpbWJhLWFpLWlkZVxcXFxzZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFRlZGR5XFxcXHNjcmltYmEtYWktaWRlXFxcXHNlcnZlclxcXFxhcGlIYW5kbGVyLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9UZWRkeS9zY3JpbWJhLWFpLWlkZS9zZXJ2ZXIvYXBpSGFuZGxlci5qc1wiO2ltcG9ydCBmcyBmcm9tICdub2RlOmZzJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBnZW5lcmF0ZVRleHQgfSBmcm9tICdhaSc7XG5pbXBvcnQgeyBjcmVhdGVPcGVuQUkgfSBmcm9tICdAYWktc2RrL29wZW5haSc7XG5pbXBvcnQgeyBjcmVhdGVHb29nbGVHZW5lcmF0aXZlQUkgfSBmcm9tICdAYWktc2RrL2dvb2dsZSc7XG5pbXBvcnQgeyBjcmVhdGVBbnRocm9waWMgfSBmcm9tICdAYWktc2RrL2FudGhyb3BpYyc7XG5cbmZ1bmN0aW9uIGVuc3VyZUVudkxvYWRlZCgpIHtcbiAgaWYgKHByb2Nlc3MuZW52LkxMTV9BUElfS0VZICYmIHByb2Nlc3MuZW52LkxMTV9QUk9WSURFUikgcmV0dXJuO1xuICB0cnkge1xuICAgIGNvbnN0IGVudlBhdGggPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJy5lbnYnKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhlbnZQYXRoKSkge1xuICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhlbnZQYXRoLCAndXRmOCcpO1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGNvbnRlbnQuc3BsaXQoL1xccj9cXG4vKSkge1xuICAgICAgICBjb25zdCBtYXRjaCA9IGxpbmUubWF0Y2goL15cXHMqKFtBLVphLXpfXVtBLVphLXowLTlfXSopXFxzKj1cXHMqKC4qKVxccyokLyk7XG4gICAgICAgIGlmICghbWF0Y2gpIGNvbnRpbnVlO1xuICAgICAgICBsZXQgdmFsdWUgPSBtYXRjaFsyXS50cmltKCk7XG4gICAgICAgIGlmICgodmFsdWUuc3RhcnRzV2l0aCgnXCInKSAmJiB2YWx1ZS5lbmRzV2l0aCgnXCInKSkgfHwgKHZhbHVlLnN0YXJ0c1dpdGgoXCInXCIpICYmIHZhbHVlLmVuZHNXaXRoKFwiJ1wiKSkpIHtcbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnNsaWNlKDEsIC0xKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXByb2Nlc3MuZW52W21hdGNoWzFdXSkge1xuICAgICAgICAgIHByb2Nlc3MuZW52W21hdGNoWzFdXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBJZ25vcmUgaWYgdW5yZWFkYWJsZVxuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkSnNvbkJvZHkocmVxdWVzdCwgbWF4Qnl0ZXMgPSA1MTIgKiAxMDI0KSB7XG4gIGlmIChyZXF1ZXN0LmJvZHkgJiYgdHlwZW9mIHJlcXVlc3QuYm9keSA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gcmVxdWVzdC5ib2R5O1xuICB9XG4gIGlmICh0eXBlb2YgcmVxdWVzdC5ib2R5ID09PSAnc3RyaW5nJykge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXF1ZXN0LmJvZHkpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgfVxuICBsZXQgYm9keSA9ICcnO1xuICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHJlcXVlc3QpIHtcbiAgICBib2R5ICs9IGNodW5rO1xuICAgIGlmIChib2R5Lmxlbmd0aCA+IG1heEJ5dGVzKSB0aHJvdyBuZXcgRXJyb3IoJ1JlcXVlc3QgYm9keSBpcyB0b28gbGFyZ2UuJyk7XG4gIH1cbiAgcmV0dXJuIEpTT04ucGFyc2UoYm9keSB8fCAne30nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbmRKc29uUmVzcG9uc2UocmVzcG9uc2UsIHN0YXR1cywgYm9keSkge1xuICByZXNwb25zZS53cml0ZUhlYWQoc3RhdHVzLCB7XG4gICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04JyxcbiAgICAnQ2FjaGUtQ29udHJvbCc6ICduby1zdG9yZScsXG4gICAgJ1gtQ29udGVudC1UeXBlLU9wdGlvbnMnOiAnbm9zbmlmZidcbiAgfSk7XG4gIHJlc3BvbnNlLmVuZChKU09OLnN0cmluZ2lmeShib2R5KSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxsU2VydmVyTGxtKHtcbiAgc3lzdGVtUHJvbXB0LFxuICB1c2VyUHJvbXB0LFxuICBhcGlDb25maWcgPSB7fSxcbiAgZXhwZWN0SnNvbiA9IHRydWUsXG4gIHRlbXBlcmF0dXJlID0gMC40NVxufSkge1xuICBlbnN1cmVFbnZMb2FkZWQoKTtcblxuICBjb25zdCBwcm92aWRlciA9IChhcGlDb25maWcucHJvdmlkZXIgfHwgcHJvY2Vzcy5lbnYuTExNX1BST1ZJREVSIHx8IHByb2Nlc3MuZW52LlZJVEVfTExNX1BST1ZJREVSIHx8ICdnZW1pbmknKS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgYXBpS2V5ID0gKFxuICAgIGFwaUNvbmZpZy5hcGlLZXkgfHxcbiAgICBwcm9jZXNzLmVudi5MTE1fQVBJX0tFWSB8fFxuICAgIHByb2Nlc3MuZW52LlZJVEVfTExNX0FQSV9LRVkgfHxcbiAgICBwcm9jZXNzLmVudi5HRU1JTklfQVBJX0tFWSB8fFxuICAgIHByb2Nlc3MuZW52Lk9QRU5BSV9BUElfS0VZIHx8XG4gICAgcHJvY2Vzcy5lbnYuQU5USFJPUElDX0FQSV9LRVkgfHxcbiAgICAnJ1xuICApLnRyaW0oKTtcblxuICBjb25zdCBiYXNlVXJsID0gKGFwaUNvbmZpZy5iYXNlVXJsIHx8IHByb2Nlc3MuZW52LkxMTV9CQVNFX1VSTCB8fCBwcm9jZXNzLmVudi5WSVRFX0xMTV9CQVNFX1VSTCB8fCAnJykudHJpbSgpO1xuICBjb25zdCBkZWZhdWx0cyA9IHtcbiAgICBnZW1pbmk6ICdnZW1pbmktMi41LWZsYXNoJyxcbiAgICBvcGVuYWk6ICdncHQtNG8tbWluaScsXG4gICAgYW50aHJvcGljOiAnY2xhdWRlLTMtNS1oYWlrdS1sYXRlc3QnLFxuICAgIGN1c3RvbTogJ2dwdC00by1taW5pJ1xuICB9O1xuICBjb25zdCByYXdNb2RlbCA9IChhcGlDb25maWcubW9kZWwgfHwgcHJvY2Vzcy5lbnYuTExNX01PREVMIHx8IHByb2Nlc3MuZW52LlZJVEVfTExNX01PREVMIHx8IGRlZmF1bHRzW3Byb3ZpZGVyXSB8fCBkZWZhdWx0cy5nZW1pbmkpLnRyaW0oKTtcbiAgbGV0IG1vZGVsSWQgPSByYXdNb2RlbDtcbiAgaWYgKHByb3ZpZGVyID09PSAnZ2VtaW5pJykge1xuICAgIGlmIChyYXdNb2RlbC5zdGFydHNXaXRoKCdncHQtJykgfHwgcmF3TW9kZWwgPT09ICdnZW1pbmktMS41LWZsYXNoJyB8fCByYXdNb2RlbCA9PT0gJ2dlbWluaS0yLjAtZmxhc2gnIHx8ICFyYXdNb2RlbCkge1xuICAgICAgbW9kZWxJZCA9ICdnZW1pbmktMi41LWZsYXNoJztcbiAgICB9XG4gIH1cblxuICBsZXQgcHJpbWFyeUVycm9yID0gbnVsbDtcblxuICAvLyAxLiBUcnkgY29uZmlndXJlZCBwcm92aWRlciBpZiBhbiBBUEkga2V5IGlzIGF2YWlsYWJsZSAob3IgY3VzdG9tIGVuZHBvaW50IHdpdGggYmFzZVVybClcbiAgaWYgKGFwaUtleSB8fCAocHJvdmlkZXIgPT09ICdjdXN0b20nICYmIGJhc2VVcmwpKSB7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBtb2RlbDtcbiAgICAgIGlmIChwcm92aWRlciA9PT0gJ2dlbWluaScpIHtcbiAgICAgICAgY29uc3QgZ29vZ2xlID0gY3JlYXRlR29vZ2xlR2VuZXJhdGl2ZUFJKHsgYXBpS2V5IH0pO1xuICAgICAgICBtb2RlbCA9IGdvb2dsZShtb2RlbElkKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgPT09ICdhbnRocm9waWMnKSB7XG4gICAgICAgIGNvbnN0IGFudGhyb3BpYyA9IGNyZWF0ZUFudGhyb3BpYyh7XG4gICAgICAgICAgYXBpS2V5LFxuICAgICAgICAgIGJhc2VVUkw6IGJhc2VVcmwgfHwgJ2h0dHBzOi8vYXBpLmFudGhyb3BpYy5jb20vdjEnXG4gICAgICAgIH0pO1xuICAgICAgICBtb2RlbCA9IGFudGhyb3BpYyhtb2RlbElkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG9wZW5haSA9IGNyZWF0ZU9wZW5BSSh7XG4gICAgICAgICAgYXBpS2V5OiBhcGlLZXkgfHwgJ2xvY2FsLWVuZHBvaW50LW5vLWtleScsXG4gICAgICAgICAgYmFzZVVSTDogYmFzZVVybCB8fCAnaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MSdcbiAgICAgICAgfSk7XG4gICAgICAgIG1vZGVsID0gb3BlbmFpKG1vZGVsSWQpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB7IHRleHQgfSA9IGF3YWl0IGdlbmVyYXRlVGV4dCh7XG4gICAgICAgIG1vZGVsLFxuICAgICAgICBzeXN0ZW06IHN5c3RlbVByb21wdCxcbiAgICAgICAgcHJvbXB0OiB1c2VyUHJvbXB0LFxuICAgICAgICB0ZW1wZXJhdHVyZTogTWF0aC5taW4oMSwgTWF0aC5tYXgoMCwgTnVtYmVyKHRlbXBlcmF0dXJlKSB8fCAwLjQ1KSksXG4gICAgICAgIGFib3J0U2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDMwMDAwKVxuICAgICAgfSk7XG5cbiAgICAgIGlmICh0ZXh0KSB7XG4gICAgICAgIHJldHVybiB7IHRleHQsIHByb3ZpZGVyVXNlZDogcHJvdmlkZXIgfTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxldCBmcmllbmRseU1lc3NhZ2UgPSBlcnIubWVzc2FnZTtcbiAgICAgIGlmICgvcXVvdGEvaS50ZXN0KGVyci5tZXNzYWdlKSB8fCAvbGltaXQ6IDIwL2kudGVzdChlcnIubWVzc2FnZSkgfHwgL2ZyZWVfdGllcl9yZXF1ZXN0cy9pLnRlc3QoZXJyLm1lc3NhZ2UpKSB7XG4gICAgICAgIGZyaWVuZGx5TWVzc2FnZSA9ICdHb29nbGUgR2VtaW5pIEZyZWUgVGllciBkYWlseSBxdW90YSByZWFjaGVkIChsaW1pdDogMjAgcmVxdWVzdHMvZGF5IG9uIHRoaXMgQVBJIGtleSkuIFJ1bm5pbmcgb24gYmFja3VwIEFJLic7XG4gICAgICB9XG4gICAgICBwcmltYXJ5RXJyb3IgPSBuZXcgRXJyb3IoZnJpZW5kbHlNZXNzYWdlKTtcbiAgICAgIGNvbnNvbGUud2FybihgW0FJIFNlcnZlcl0gUHJpbWFyeSBwcm92aWRlciAoJHtwcm92aWRlcn0pIGZhaWxlZDpgLCBmcmllbmRseU1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIC8vIDIuIFNlcnZlci1zaWRlIFplcm8tS2V5IEZhbGxiYWNrIEVuZHBvaW50XG4gIC8vIEluIE5vZGUuanMsIGZldGNoIGRvZXMgbm90IGluY2x1ZGUgYnJvd3NlciBPcmlnaW4gaGVhZGVycywgYXZvaWRpbmcgQ2xvdWRmbGFyZSBUdXJuc3RpbGUgNDAzIGJsb2Nrcy5cbiAgdHJ5IHtcbiAgICBjb25zdCBsaXZlUmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vdGV4dC5wb2xsaW5hdGlvbnMuYWkvb3BlbmFpJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG1vZGVsOiAnb3BlbmFpJyxcbiAgICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgICB7IHJvbGU6ICdzeXN0ZW0nLCBjb250ZW50OiBleHBlY3RKc29uID8gYCR7c3lzdGVtUHJvbXB0fVxcbklNUE9SVEFOVDogUmVwbHkgd2l0aCB2YWxpZCBKU09OIE9OTFkuYCA6IHN5c3RlbVByb21wdCB9LFxuICAgICAgICAgIHsgcm9sZTogJ3VzZXInLCBjb250ZW50OiB1c2VyUHJvbXB0IH1cbiAgICAgICAgXSxcbiAgICAgICAgdGVtcGVyYXR1cmU6IE1hdGgubWluKDEsIE1hdGgubWF4KDAsIE51bWJlcih0ZW1wZXJhdHVyZSkgfHwgMC40NSkpXG4gICAgICB9KSxcbiAgICAgIHNpZ25hbDogQWJvcnRTaWduYWwudGltZW91dCgyNTAwMClcbiAgICB9KTtcblxuICAgIGlmICghbGl2ZVJlcy5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWxsYmFjayBzZXJ2aWNlIHJldHVybmVkIHN0YXR1cyAke2xpdmVSZXMuc3RhdHVzfSAoJHtsaXZlUmVzLnN0YXR1c1RleHR9KWApO1xuICAgIH1cblxuICAgIGNvbnN0IGxpdmVEYXRhID0gYXdhaXQgbGl2ZVJlcy5qc29uKCk7XG4gICAgY29uc3QgcmF3Q29udGVudCA9IGxpdmVEYXRhPy5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQ7XG4gICAgaWYgKHJhd0NvbnRlbnQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRleHQ6IHJhd0NvbnRlbnQsXG4gICAgICAgIHByb3ZpZGVyVXNlZDogJ3plcm8ta2V5LWZhbGxiYWNrJyxcbiAgICAgICAgaXNGYWxsYmFjazogdHJ1ZSxcbiAgICAgICAgcHJpbWFyeUVycm9yOiBwcmltYXJ5RXJyb3I/Lm1lc3NhZ2VcbiAgICAgIH07XG4gICAgfVxuICB9IGNhdGNoIChmYWxsYmFja0Vycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tBSSBTZXJ2ZXJdIFplcm8ta2V5IGZhbGxiYWNrIGZhaWxlZDonLCBmYWxsYmFja0Vyci5tZXNzYWdlKTtcbiAgICBjb25zdCBjb21iaW5lZE1lc3NhZ2UgPSBwcmltYXJ5RXJyb3JcbiAgICAgID8gYFByaW1hcnkgcHJvdmlkZXIgKCR7cHJvdmlkZXJ9KSBlcnJvcjogJHtwcmltYXJ5RXJyb3IubWVzc2FnZX0uIFplcm8ta2V5IGZhbGxiYWNrIGVycm9yOiAke2ZhbGxiYWNrRXJyLm1lc3NhZ2V9LmBcbiAgICAgIDogYFplcm8ta2V5IGZhbGxiYWNrIGVycm9yOiAke2ZhbGxiYWNrRXJyLm1lc3NhZ2V9LiBQbGVhc2UgY29uZmlndXJlIGFuIEFQSSBrZXkgaW4gQUkgU2V0dGluZ3MuYDtcbiAgICB0aHJvdyBuZXcgRXJyb3IoY29tYmluZWRNZXNzYWdlKTtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcignTm8gQUkgcmVzcG9uc2Ugd2FzIGdlbmVyYXRlZC4nKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZUFwaShyZXF1ZXN0LCByZXNwb25zZSwgcGF0aG5hbWUpIHtcbiAgZW5zdXJlRW52TG9hZGVkKCk7XG5cbiAgaWYgKHJlcXVlc3QubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICBzZW5kSnNvblJlc3BvbnNlKHJlc3BvbnNlLCA0MDUsIHsgZXJyb3I6ICdVc2UgUE9TVCBmb3IgdGhpcyBlbmRwb2ludC4nIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRKc29uQm9keShyZXF1ZXN0KTtcblxuICAgIGlmIChwYXRobmFtZSA9PT0gJy9hcGkvdHV0b3InKSB7XG4gICAgICBjb25zdCB7IHN5c3RlbVByb21wdCwgdXNlclByb21wdCwgYXBpQ29uZmlnID0ge30sIGV4cGVjdEpzb24gPSB0cnVlLCB0ZW1wZXJhdHVyZSA9IDAuNDUgfSA9IGJvZHk7XG4gICAgICBpZiAodHlwZW9mIHN5c3RlbVByb21wdCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIHVzZXJQcm9tcHQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHNlbmRKc29uUmVzcG9uc2UocmVzcG9uc2UsIDQwMCwgeyBlcnJvcjogJ0Egc3lzdGVtIHByb21wdCBhbmQgbGVhcm5lciBtZXNzYWdlIGFyZSByZXF1aXJlZC4nIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgdGV4dCwgcHJvdmlkZXJVc2VkLCBpc0ZhbGxiYWNrLCBwcmltYXJ5RXJyb3IgfSA9IGF3YWl0IGNhbGxTZXJ2ZXJMbG0oe1xuICAgICAgICBzeXN0ZW1Qcm9tcHQsXG4gICAgICAgIHVzZXJQcm9tcHQsXG4gICAgICAgIGFwaUNvbmZpZyxcbiAgICAgICAgZXhwZWN0SnNvbixcbiAgICAgICAgdGVtcGVyYXR1cmVcbiAgICAgIH0pO1xuXG4gICAgICBzZW5kSnNvblJlc3BvbnNlKHJlc3BvbnNlLCAyMDAsIHtcbiAgICAgICAgcmVzdWx0OiB0ZXh0LFxuICAgICAgICB0ZXh0LFxuICAgICAgICBwcm92aWRlclVzZWQsXG4gICAgICAgIGlzRmFsbGJhY2s6IEJvb2xlYW4oaXNGYWxsYmFjayksXG4gICAgICAgIHByb3ZpZGVyRXJyb3I6IHByaW1hcnlFcnJvciB8fCBudWxsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocGF0aG5hbWUgPT09ICcvYXBpL3R0cycpIHtcbiAgICAgIGNvbnN0IGVsZXZlbktleSA9IChcbiAgICAgICAgcHJvY2Vzcy5lbnYuRUxFVkVOTEFCU19BUElfS0VZIHx8XG4gICAgICAgIHByb2Nlc3MuZW52LlZJVEVfRUxFVkVOTEFCU19BUElfS0VZIHx8XG4gICAgICAgICcnXG4gICAgICApLnRyaW0oKTtcblxuICAgICAgY29uc3QgaW5wdXQgPSB0eXBlb2YgYm9keS5pbnB1dCA9PT0gJ3N0cmluZycgPyBib2R5LmlucHV0LnNsaWNlKDAsIDQwMDApIDogJyc7XG4gICAgICBpZiAoIWlucHV0KSB7XG4gICAgICAgIHNlbmRKc29uUmVzcG9uc2UocmVzcG9uc2UsIDQwMCwgeyBlcnJvcjogJ1NwZWVjaCB0ZXh0IGlzIHJlcXVpcmVkLicgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgRWxldmVuTGFicyBpcyBjb25maWd1cmVkLCB1c2UgaXRzIHVsdHJhLXJlYWxpc3RpYyB2b2ljZVxuICAgICAgaWYgKGVsZXZlbktleSkge1xuICAgICAgICBjb25zdCB2b2ljZUlkID0gYm9keS52b2ljZUlkIHx8IHByb2Nlc3MuZW52LkVMRVZFTkxBQlNfVk9JQ0VfSUQgfHwgJzIxbTAwVGNtNFRsdkRxOGlrV0FNJzsgLy8gUmFjaGVsIC8gQWRhbVxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGVsZXZlblJlcyA9IGF3YWl0IGZldGNoKGBodHRwczovL2FwaS5lbGV2ZW5sYWJzLmlvL3YxL3RleHQtdG8tc3BlZWNoLyR7dm9pY2VJZH1gLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJ3hpLWFwaS1rZXknOiBlbGV2ZW5LZXksXG4gICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICdBY2NlcHQnOiAnYXVkaW8vbXBlZydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIHRleHQ6IGlucHV0LFxuICAgICAgICAgICAgICBtb2RlbF9pZDogJ2VsZXZlbl90dXJib192Ml81JyxcbiAgICAgICAgICAgICAgdm9pY2Vfc2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICBzdGFiaWxpdHk6IDAuNSxcbiAgICAgICAgICAgICAgICBzaW1pbGFyaXR5X2Jvb3N0OiAwLjc1XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDQ1MDAwKVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKGVsZXZlblJlcy5vaykge1xuICAgICAgICAgICAgcmVzcG9uc2Uud3JpdGVIZWFkKDIwMCwge1xuICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2F1ZGlvL21wZWcnLFxuICAgICAgICAgICAgICAnQ2FjaGUtQ29udHJvbCc6ICduby1zdG9yZScsXG4gICAgICAgICAgICAgICdYLUNvbnRlbnQtVHlwZS1PcHRpb25zJzogJ25vc25pZmYnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlc3BvbnNlLmVuZChCdWZmZXIuZnJvbShhd2FpdCBlbGV2ZW5SZXMuYXJyYXlCdWZmZXIoKSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdbVFRTXSBFbGV2ZW5MYWJzIHJlcXVlc3QgZmFpbGVkLCBmYWxsaW5nIGJhY2sgdG8gT3BlbkFJOicsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBhcGlLZXkgPSAoXG4gICAgICAgIHByb2Nlc3MuZW52Lk9QRU5BSV9BUElfS0VZIHx8XG4gICAgICAgIHByb2Nlc3MuZW52LkxMTV9BUElfS0VZIHx8XG4gICAgICAgIHByb2Nlc3MuZW52LlZJVEVfTExNX0FQSV9LRVkgfHxcbiAgICAgICAgJydcbiAgICAgICkudHJpbSgpO1xuXG4gICAgICBpZiAoIWFwaUtleSkge1xuICAgICAgICBzZW5kSnNvblJlc3BvbnNlKHJlc3BvbnNlLCA1MDMsIHtcbiAgICAgICAgICBlcnJvcjogJ1NldCBFTEVWRU5MQUJTX0FQSV9LRVkgb3IgT1BFTkFJX0FQSV9LRVkgb24gdGhlIHNlcnZlciB0byB1c2UgaGlnaCBxdWFsaXR5IHZvaWNlLidcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdHRzUmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MS9hdWRpby9zcGVlY2gnLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2FwaUtleX1gLFxuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIG1vZGVsOiAndHRzLTEnLFxuICAgICAgICAgIHZvaWNlOiBbJ2FsbG95JywgJ2VjaG8nLCAnZmFibGUnLCAnb255eCcsICdub3ZhJywgJ3NoaW1tZXInXS5pbmNsdWRlcyhib2R5LnZvaWNlKVxuICAgICAgICAgICAgPyBib2R5LnZvaWNlXG4gICAgICAgICAgICA6ICdub3ZhJyxcbiAgICAgICAgICBpbnB1dFxuICAgICAgICB9KSxcbiAgICAgICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDYwMDAwKVxuICAgICAgfSk7XG5cbiAgICAgIGlmICghdHRzUmVzcG9uc2Uub2spIHtcbiAgICAgICAgc2VuZEpzb25SZXNwb25zZShyZXNwb25zZSwgdHRzUmVzcG9uc2Uuc3RhdHVzLCB7XG4gICAgICAgICAgZXJyb3I6ICdUaGUgc3BlZWNoIHByb3ZpZGVyIGNvdWxkIG5vdCBjcmVhdGUgYXVkaW8uJ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNwb25zZS53cml0ZUhlYWQoMjAwLCB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXVkaW8vbXBlZycsXG4gICAgICAgICdDYWNoZS1Db250cm9sJzogJ25vLXN0b3JlJyxcbiAgICAgICAgJ1gtQ29udGVudC1UeXBlLU9wdGlvbnMnOiAnbm9zbmlmZidcbiAgICAgIH0pO1xuICAgICAgcmVzcG9uc2UuZW5kKEJ1ZmZlci5mcm9tKGF3YWl0IHR0c1Jlc3BvbnNlLmFycmF5QnVmZmVyKCkpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZW5kSnNvblJlc3BvbnNlKHJlc3BvbnNlLCA0MDQsIHsgZXJyb3I6ICdBUEkgZW5kcG9pbnQgbm90IGZvdW5kLicgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc3Qgc3RhdHVzID0gL3RvbyBsYXJnZS9pLnRlc3QoZXJyb3IubWVzc2FnZSkgPyA0MTMgOiA1MDA7XG4gICAgc2VuZEpzb25SZXNwb25zZShyZXNwb25zZSwgc3RhdHVzLCB7IGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICdBSSBzZXJ2aWNlIGVycm9yLicgfSk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVIsT0FBT0EsV0FBVTtBQUNsUyxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLGNBQWMsZUFBZTtBQUN0QyxPQUFPLFdBQVc7OztBQ0hvUixPQUFPLFFBQVE7QUFDclQsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsZ0NBQWdDO0FBQ3pDLFNBQVMsdUJBQXVCO0FBRWhDLFNBQVMsa0JBQWtCO0FBQ3pCLE1BQUksUUFBUSxJQUFJLGVBQWUsUUFBUSxJQUFJLGFBQWM7QUFDekQsTUFBSTtBQUNGLFVBQU0sVUFBVSxLQUFLLFFBQVEsUUFBUSxJQUFJLEdBQUcs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QUUsS0FBSyxNQUFNO0FBRXhDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxTQUFPLE9BQU8sUUFBUSxLQUFLLEdBQUc7QUFFOUIsU0FBTztBQUFBLElBQ0wsU0FBUyxDQUFDLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQztBQUFBLElBQ3hDLFdBQVcsQ0FBQyxTQUFTLGNBQWM7QUFBQSxJQUNuQyxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLQSxNQUFLLFFBQVEsV0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTix5QkFBeUIsS0FBSyxVQUFVLE1BQU07QUFBQSxNQUM5QyxlQUFlLENBQUM7QUFBQSxJQUNsQjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBLFFBQ1AsZ0NBQWdDO0FBQUEsUUFDaEMsOEJBQThCO0FBQUEsTUFDaEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUEsUUFDUCxnQ0FBZ0M7QUFBQSxRQUNoQyw4QkFBOEI7QUFBQSxNQUNoQztBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLHVCQUF1QjtBQUFBLE1BQ3ZCLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGFBQWEsSUFBSTtBQUNmLGdCQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDL0Isa0JBQUksR0FBRyxTQUFTLGVBQWUsS0FBSyxHQUFHLFNBQVMsZ0JBQWdCLEdBQUc7QUFDakUsdUJBQU87QUFBQSxjQUNUO0FBQ0Esa0JBQUksR0FBRyxTQUFTLGFBQWEsR0FBRztBQUM5Qix1QkFBTztBQUFBLGNBQ1Q7QUFDQSxrQkFBSSxHQUFHLFNBQVMsUUFBUSxLQUFLLEdBQUcsU0FBUyxlQUFlLEdBQUc7QUFDekQsdUJBQU87QUFBQSxjQUNUO0FBQ0Esa0JBQUksR0FBRyxTQUFTLFFBQVEsR0FBRztBQUN6Qix1QkFBTztBQUFBLGNBQ1Q7QUFDQSxrQkFBSSxHQUFHLFNBQVMsT0FBTyxLQUFLLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDcEQsdUJBQU87QUFBQSxjQUNUO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicGF0aCIsICJwYXRoIl0KfQo=
