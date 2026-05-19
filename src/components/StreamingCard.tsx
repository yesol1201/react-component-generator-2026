import type { StreamingState } from '../types';
import { CodeView } from './CodeView';

interface StreamingCardProps {
  streamingState: StreamingState;
}

export function StreamingCard({ streamingState }: StreamingCardProps) {
  const createdAt = streamingState.createdAt.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="component-card">
      <div className="card-header">
        <div className="card-title-group">
          <span>{createdAt}</span>
          <p className="card-prompt">{streamingState.prompt}</p>
        </div>
        <div className="card-actions">
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--color-accent, #6366f1)',
              fontWeight: 500,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'currentColor',
                animation: 'pulse 1.2s ease-in-out infinite',
              }}
            />
            생성 중...
          </span>
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }`}</style>
        </div>
      </div>
      <div className="card-tabs">
        <button className="tab tab--active">코드</button>
      </div>
      <div className="card-content">
        <CodeView code={streamingState.streamingCode} isStreaming={true} />
      </div>
    </div>
  );
}
