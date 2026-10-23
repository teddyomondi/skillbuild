import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';

export async function readJsonBody(request, maxBytes = 64 * 1024) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > maxBytes) throw new Error('Request body is too large.');
  }
  return JSON.parse(body || '{}');
}

export function sendJsonResponse(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(body));
}

export async function callServerLlm({
  systemPrompt,
  userPrompt,
  apiConfig = {},
  expectJson = true,
  temperature = 0.45
}) {
  const provider = (apiConfig.provider || process.env.LLM_PROVIDER || process.env.VITE_LLM_PROVIDER || 'gemini').trim().toLowerCase();
  const apiKey = (
    apiConfig.apiKey ||
    process.env.LLM_API_KEY ||
    process.env.VITE_LLM_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    ''
  ).trim();

  const baseUrl = (apiConfig.baseUrl || process.env.LLM_BASE_URL || process.env.VITE_LLM_BASE_URL || '').trim();
  const defaults = {
    gemini: 'gemini-2.5-flash',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-haiku-latest',
    custom: 'gpt-4o-mini'
  };
  const rawModel = (apiConfig.model || process.env.LLM_MODEL || process.env.VITE_LLM_MODEL || defaults[provider] || defaults.gemini).trim();
  const modelId = (provider === 'gemini' && rawModel.startsWith('gpt-')) ? 'gemini-2.5-flash' : rawModel;

  let primaryError = null;

  // 1. Try configured provider if an API key is available (or custom endpoint with baseUrl)
  if (apiKey || (provider === 'custom' && baseUrl)) {
    try {
      let model;
      if (provider === 'gemini') {
        const google = createGoogleGenerativeAI({ apiKey });
        model = google(modelId);
      } else if (provider === 'anthropic') {
        const anthropic = createAnthropic({
          apiKey,
          baseURL: baseUrl || 'https://api.anthropic.com/v1'
        });
        model = anthropic(modelId);
      } else {
        const openai = createOpenAI({
          apiKey: apiKey || 'local-endpoint-no-key',
          baseURL: baseUrl || 'https://api.openai.com/v1'
        });
        model = openai(modelId);
      }

      const { text } = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: Math.min(1, Math.max(0, Number(temperature) || 0.45)),
        abortSignal: AbortSignal.timeout(30000)
      });

      if (text) {
        return { text, providerUsed: provider };
      }
    } catch (err) {
      primaryError = err;
      console.warn(`[AI Server] Primary provider (${provider}) failed:`, err.message);
    }
  }

  // 2. Server-side Zero-Key Fallback Endpoint
  // In Node.js, fetch does not include browser Origin headers, avoiding Cloudflare Turnstile 403 blocks.
  try {
    const liveRes = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai',
        ...(expectJson ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: Math.min(1, Math.max(0, Number(temperature) || 0.45))
      }),
      signal: AbortSignal.timeout(25000)
    });

    if (!liveRes.ok) {
      throw new Error(`Fallback service returned status ${liveRes.status} (${liveRes.statusText})`);
    }

    const liveData = await liveRes.json();
    const rawContent = liveData?.choices?.[0]?.message?.content;
    if (rawContent) {
      return {
        text: rawContent,
        providerUsed: 'zero-key-fallback',
        isFallback: true,
        primaryError: primaryError?.message
      };
    }
  } catch (fallbackErr) {
    console.error('[AI Server] Zero-key fallback failed:', fallbackErr.message);
    const combinedMessage = primaryError
      ? `Primary provider (${provider}) error: ${primaryError.message}. Zero-key fallback error: ${fallbackErr.message}.`
      : `Zero-key fallback error: ${fallbackErr.message}. Please configure an API key in AI Settings.`;
    throw new Error(combinedMessage);
  }

  throw new Error('No AI response was generated.');
}

export async function handleApi(request, response, pathname) {
  if (request.method !== 'POST') {
    sendJsonResponse(response, 405, { error: 'Use POST for this endpoint.' });
    return;
  }

  try {
    const body = await readJsonBody(request);

    if (pathname === '/api/tutor') {
      const { systemPrompt, userPrompt, apiConfig = {}, expectJson = true, temperature = 0.45 } = body;
      if (typeof systemPrompt !== 'string' || typeof userPrompt !== 'string') {
        sendJsonResponse(response, 400, { error: 'A system prompt and learner message are required.' });
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

    if (pathname === '/api/tts') {
      const apiKey = (
        process.env.OPENAI_API_KEY ||
        process.env.LLM_API_KEY ||
        process.env.VITE_LLM_API_KEY ||
        ''
      ).trim();

      if (!apiKey) {
        sendJsonResponse(response, 503, {
          error: 'Set OPENAI_API_KEY or LLM_API_KEY on the server to use OpenAI voice.'
        });
        return;
      }

      const input = typeof body.input === 'string' ? body.input.slice(0, 4000) : '';
      if (!input) {
        sendJsonResponse(response, 400, { error: 'Speech text is required.' });
        return;
      }

      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(body.voice)
            ? body.voice
            : 'nova',
          input
        }),
        signal: AbortSignal.timeout(60000)
      });

      if (!ttsResponse.ok) {
        sendJsonResponse(response, ttsResponse.status, {
          error: 'The speech provider could not create audio.'
        });
        return;
      }

      response.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      });
      response.end(Buffer.from(await ttsResponse.arrayBuffer()));
      return;
    }

    sendJsonResponse(response, 404, { error: 'API endpoint not found.' });
  } catch (error) {
    const status = /too large/i.test(error.message) ? 413 : 500;
    sendJsonResponse(response, status, { error: error.message || 'AI service error.' });
  }
}
