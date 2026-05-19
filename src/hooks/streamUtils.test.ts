import { describe, test, expect } from 'bun:test';
import { parseStreamChunk, accumulateChunks } from './streamUtils';

describe('parseStreamChunk', () => {
  test('chunk 타입을 파싱한다', () => {
    const result = parseStreamChunk('{"chunk":"hello"}');
    expect(result).toEqual({ type: 'chunk', text: 'hello' });
  });

  test('빈 chunk도 파싱한다', () => {
    const result = parseStreamChunk('{"chunk":""}');
    expect(result).toEqual({ type: 'chunk', text: '' });
  });

  test('done 타입을 파싱한다', () => {
    const result = parseStreamChunk('{"done":true,"code":"const A=()=><div/>;"}');
    expect(result).toEqual({ type: 'done', code: 'const A=()=><div/>;' });
  });

  test('error 타입을 파싱한다', () => {
    const result = parseStreamChunk('{"error":"API 실패"}');
    expect(result).toEqual({ type: 'error', message: 'API 실패' });
  });

  test('빈 줄은 null을 반환한다', () => {
    expect(parseStreamChunk('')).toBeNull();
  });

  test('공백만 있는 줄은 null을 반환한다', () => {
    expect(parseStreamChunk('   ')).toBeNull();
  });

  test('잘못된 JSON은 null을 반환한다', () => {
    expect(parseStreamChunk('not json')).toBeNull();
  });

  test('알 수 없는 형태의 JSON은 null을 반환한다', () => {
    expect(parseStreamChunk('{"unknown":true}')).toBeNull();
  });
});

describe('accumulateChunks', () => {
  test('빈 문자열에 청크를 누적한다', () => {
    expect(accumulateChunks('', 'hello')).toBe('hello');
  });

  test('기존 텍스트 뒤에 청크를 추가한다', () => {
    expect(accumulateChunks('hello', ' world')).toBe('hello world');
  });

  test('빈 청크를 누적해도 변하지 않는다', () => {
    expect(accumulateChunks('hello', '')).toBe('hello');
  });
});
