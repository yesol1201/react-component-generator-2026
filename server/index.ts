import {
  encodeChunk,
  encodeDone,
  encodeError,
  buildAnthropicStreamBody,
  buildGoogleStreamUrl,
  stripCodeFences,
  ensureRenderCall,
} from './streaming';

const SYSTEM_PROMPT = `You are a React component generator. Generate a single React component based on the user's description.

Rules:
- Use inline styles only (no CSS imports, no CSS modules)
- Do NOT use import statements — React is already available in scope as a global
- Define the component as a function, then call render(<ComponentName />) at the end
- Make the component visually appealing with proper styling
- Use React hooks if needed (e.g., React.useState, React.useEffect)
- The component must be completely self-contained
- Respond with ONLY the code block — no explanations, no markdown fences
- Use descriptive variable names and clean formatting
- For colors, prefer modern palettes (gradients, shadows, etc.)
- Ensure the component is interactive where appropriate (hover states, click handlers, etc.)
- Do NOT use TypeScript syntax — no type annotations, no interfaces, no generics, no "as" casts. Write plain JavaScript only.

Example output format:
const GradientButton = () => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      style={{
        background: hovered
          ? 'linear-gradient(135deg, #667eea, #764ba2)'
          : 'linear-gradient(135deg, #764ba2, #667eea)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      Click me
    </button>
  );
};

render(<GradientButton />);`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type Provider = 'anthropic' | 'google';

const ENV_KEYS: Record<Provider, string | undefined> = {
  anthropic: process.env.ANTHROPIC_API_KEY,
  google: process.env.GOOGLE_API_KEY,
};

function resolveApiKey(provider: Provider, clientKey?: string): string | null {
  return clientKey || ENV_KEYS[provider] || null;
}

function getKoreanErrorMessage(status: number, defaultMsg: string): string {
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  if (status === 503) return 'API 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
  return defaultMsg;
}

async function streamAnthropic(
  prompt: string,
  apiKey: string,
  controller: ReadableStreamDefaultController<Uint8Array>
): Promise<void> {
  const encoder = new TextEncoder();
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: buildAnthropicStreamBody(prompt, SYSTEM_PROMPT),
  });

  if (!response.ok) {
    const msg = getKoreanErrorMessage(response.status, `Claude API error: ${response.status}`);
    controller.enqueue(encoder.encode(encodeError(msg)));
    controller.close();
    return;
  }

  const reader = response.body!.getReader();
  const textDecoder = new TextDecoder();
  let lineBuffer = '';
  let accumulatedRaw = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    lineBuffer += textDecoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') continue;

      try {
        const event = JSON.parse(jsonStr) as {
          type?: string;
          delta?: { type?: string; text?: string };
        };
        if (
          event.type === 'content_block_delta' &&
          event.delta?.type === 'text_delta' &&
          event.delta.text
        ) {
          accumulatedRaw += event.delta.text;
          controller.enqueue(encoder.encode(encodeChunk(event.delta.text)));
        }
      } catch {
        // 불완전한 JSON 무시
      }
    }
  }

  const finalCode = ensureRenderCall(stripCodeFences(accumulatedRaw));
  controller.enqueue(encoder.encode(encodeDone(finalCode)));
  controller.close();
}

async function streamGoogle(
  prompt: string,
  apiKey: string,
  controller: ReadableStreamDefaultController<Uint8Array>
): Promise<void> {
  const encoder = new TextEncoder();
  const response = await fetch(buildGoogleStreamUrl(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192 },
    }),
  });

  if (!response.ok) {
    const msg = getKoreanErrorMessage(response.status, `Gemini API error: ${response.status}`);
    controller.enqueue(encoder.encode(encodeError(msg)));
    controller.close();
    return;
  }

  const reader = response.body!.getReader();
  const textDecoder = new TextDecoder();
  let lineBuffer = '';
  let accumulatedRaw = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    lineBuffer += textDecoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const event = JSON.parse(jsonStr) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
            finishReason?: string;
          }>;
        };

        const candidate = event.candidates?.[0];
        if (candidate?.finishReason === 'MAX_TOKENS') {
          controller.enqueue(
            encoder.encode(encodeError('생성된 코드가 너무 길어 잘렸습니다. 더 간단한 컴포넌트를 요청해주세요.'))
          );
          controller.close();
          return;
        }

        const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        if (text) {
          accumulatedRaw += text;
          controller.enqueue(encoder.encode(encodeChunk(text)));
        }
      } catch {
        // 불완전한 JSON 무시
      }
    }
  }

  const finalCode = ensureRenderCall(stripCodeFences(accumulatedRaw));
  controller.enqueue(encoder.encode(encodeDone(finalCode)));
  controller.close();
}

const server = Bun.serve({
  port: 3002,
  async fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(req.url);

    if (req.method === 'GET' && url.pathname === '/api/config') {
      return Response.json(
        {
          envKeys: {
            anthropic: !!ENV_KEYS.anthropic,
            google: !!ENV_KEYS.google,
          },
        },
        { headers: CORS_HEADERS }
      );
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      const { prompt, apiKey, provider = 'anthropic' } = (await req.json()) as {
        prompt: string;
        apiKey?: string;
        provider?: Provider;
      };

      const resolvedKey = resolveApiKey(provider, apiKey);

      if (!resolvedKey) {
        return Response.json(
          { error: `API key is required. Set ${provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_API_KEY'} in .env or enter it manually.` },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      if (!prompt) {
        return Response.json(
          { error: 'Prompt is required' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            if (provider === 'google') {
              await streamGoogle(prompt, resolvedKey, controller);
            } else {
              await streamAnthropic(prompt, resolvedKey, controller);
            }
          } catch (err) {
            const encoder = new TextEncoder();
            const message = err instanceof Error ? err.message : 'Unknown error';
            controller.enqueue(encoder.encode(encodeError(message)));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/octet-stream',
          'Transfer-Encoding': 'chunked',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    return Response.json(
      { error: 'Not found' },
      { status: 404, headers: CORS_HEADERS }
    );
  },
});

console.log(`API server running at http://localhost:${server.port}`);
