import { describe, test, expect } from 'bun:test';
import {
  encodeChunk,
  encodeDone,
  encodeError,
  buildAnthropicStreamBody,
  buildGoogleStreamUrl,
  stripCodeFences,
  ensureRenderCall,
} from './streaming';

describe('encodeChunk', () => {
  test('텍스트를 줄바꿈 구분 JSON으로 직렬화한다', () => {
    expect(encodeChunk('hello')).toBe('{"chunk":"hello"}\n');
  });

  test('빈 문자열도 인코딩한다', () => {
    expect(encodeChunk('')).toBe('{"chunk":""}\n');
  });

  test('특수 문자를 올바르게 이스케이프한다', () => {
    const result = encodeChunk('a"b');
    expect(result).toBe('{"chunk":"a\\"b"}\n');
  });
});

describe('encodeDone', () => {
  test('done: true 와 code 필드를 포함한다', () => {
    const result = encodeDone('const A = () => <div/>;');
    const parsed = JSON.parse(result.trim());
    expect(parsed.done).toBe(true);
    expect(parsed.code).toBe('const A = () => <div/>;');
  });

  test('줄바꿈으로 끝난다', () => {
    expect(encodeDone('code').endsWith('\n')).toBe(true);
  });
});

describe('encodeError', () => {
  test('error 필드를 포함한다', () => {
    const result = encodeError('API 실패');
    const parsed = JSON.parse(result.trim());
    expect(parsed.error).toBe('API 실패');
  });

  test('줄바꿈으로 끝난다', () => {
    expect(encodeError('err').endsWith('\n')).toBe(true);
  });
});

describe('buildAnthropicStreamBody', () => {
  test('stream: true 필드를 포함한다', () => {
    const body = buildAnthropicStreamBody('프롬프트', '시스템');
    const parsed = JSON.parse(body);
    expect(parsed.stream).toBe(true);
  });

  test('프롬프트를 messages에 담는다', () => {
    const body = buildAnthropicStreamBody('버튼 만들어줘', '시스템');
    const parsed = JSON.parse(body);
    expect(parsed.messages[0].content).toBe('버튼 만들어줘');
    expect(parsed.messages[0].role).toBe('user');
  });

  test('시스템 프롬프트를 system 필드에 담는다', () => {
    const body = buildAnthropicStreamBody('프롬프트', '나는 시스템이야');
    const parsed = JSON.parse(body);
    expect(parsed.system).toBe('나는 시스템이야');
  });
});

describe('buildGoogleStreamUrl', () => {
  test('streamGenerateContent 엔드포인트를 포함한다', () => {
    const url = buildGoogleStreamUrl('my-key');
    expect(url).toContain('streamGenerateContent');
  });

  test('API 키를 쿼리 파라미터로 포함한다', () => {
    const url = buildGoogleStreamUrl('test-api-key');
    expect(url).toContain('key=test-api-key');
  });

  test('alt=sse 파라미터를 포함한다', () => {
    const url = buildGoogleStreamUrl('my-key');
    expect(url).toContain('alt=sse');
  });
});

describe('stripCodeFences', () => {
  test('jsx 코드 펜스를 제거한다', () => {
    const input = '```jsx\nconst A = () => <div/>;\n```';
    expect(stripCodeFences(input)).toBe('const A = () => <div/>;');
  });

  test('tsx 코드 펜스를 제거한다', () => {
    const input = '```tsx\nconst A = () => <div/>;\n```';
    expect(stripCodeFences(input)).toBe('const A = () => <div/>;');
  });

  test('언어 없는 펜스도 제거한다', () => {
    const input = '```\nconst A = () => <div/>;\n```';
    expect(stripCodeFences(input)).toBe('const A = () => <div/>;');
  });

  test('펜스 없는 코드는 그대로 반환한다', () => {
    const code = 'const A = () => <div/>;';
    expect(stripCodeFences(code)).toBe(code);
  });
});

describe('ensureRenderCall', () => {
  test('render() 없으면 첫 PascalCase 컴포넌트에 render 추가', () => {
    const code = 'const Button = () => <button/>;';
    const result = ensureRenderCall(code);
    expect(result).toContain('render(<Button />);');
  });

  test('이미 render() 있으면 변경 없음', () => {
    const code = 'const A = () => <div/>;\nrender(<A />);';
    expect(ensureRenderCall(code)).toBe(code);
  });

  test('PascalCase 없으면 코드 그대로 반환', () => {
    const code = 'const x = 1;';
    expect(ensureRenderCall(code)).toBe(code);
  });
});
