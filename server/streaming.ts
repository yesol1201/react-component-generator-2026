const GEMINI_MODEL = 'gemini-2.5-flash';

export function encodeChunk(text: string): string {
  return JSON.stringify({ chunk: text }) + '\n';
}

export function encodeDone(code: string): string {
  return JSON.stringify({ done: true, code }) + '\n';
}

export function encodeError(message: string): string {
  return JSON.stringify({ error: message }) + '\n';
}

export function buildAnthropicStreamBody(prompt: string, systemPrompt: string): string {
  return JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    stream: true,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });
}

export function buildGoogleStreamUrl(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`;
}

export function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:jsx|tsx|javascript|typescript)?\n?/gm, '')
    .replace(/```$/gm, '')
    .trim();
}

export function ensureRenderCall(code: string): string {
  if (/\brender\s*\(/.test(code)) return code;

  const match = code.match(/(?:const|function)\s+([A-Z]\w+)/);
  if (match) {
    return `${code}\n\nrender(<${match[1]} />);`;
  }
  return code;
}
