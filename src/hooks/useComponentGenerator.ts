import { useState, useCallback } from 'react';
import type { GeneratedComponent, Provider, StreamingState } from '../types';
import { parseStreamChunk } from './streamUtils';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  streamingState: StreamingState | null;
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>([]);
  const [streamingState, setStreamingState] = useState<StreamingState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date();
    setStreamingState({ id, prompt, streamingCode: '', createdAt });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      // API 키 누락 등 스트리밍 시작 전 에러 (400)
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || 'Failed to generate component');
      }

      if (!res.body) throw new Error('스트리밍 응답을 받을 수 없습니다.');

      const reader = res.body.getReader();
      const textDecoder = new TextDecoder();
      let lineBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        lineBuffer += textDecoder.decode(value, { stream: true });
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() ?? '';

        for (const line of lines) {
          const parsed = parseStreamChunk(line);
          if (!parsed) continue;

          if (parsed.type === 'chunk') {
            setStreamingState((prev) =>
              prev ? { ...prev, streamingCode: prev.streamingCode + parsed.text } : prev
            );
          } else if (parsed.type === 'done') {
            const newComponent: GeneratedComponent = { id, prompt, code: parsed.code, createdAt };
            setComponents((prev) => [newComponent, ...prev]);
            setStreamingState(null);
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setStreamingState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, []);

  return { components, streamingState, isLoading, error, generate, removeComponent, clearAll };
}
