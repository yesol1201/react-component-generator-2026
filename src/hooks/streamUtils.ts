export type ParsedChunk =
  | { type: 'chunk'; text: string }
  | { type: 'done'; code: string }
  | { type: 'error'; message: string };

export function parseStreamChunk(line: string): ParsedChunk | null {
  if (!line.trim()) return null;
  try {
    const data = JSON.parse(line) as Record<string, unknown>;
    if (typeof data.chunk === 'string') return { type: 'chunk', text: data.chunk };
    if (data.done === true) return { type: 'done', code: String(data.code ?? '') };
    if (typeof data.error === 'string') return { type: 'error', message: data.error };
    return null;
  } catch {
    return null;
  }
}

export function accumulateChunks(prev: string, next: string): string {
  return prev + next;
}
