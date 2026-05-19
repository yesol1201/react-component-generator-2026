# AGENTS.md — Backend (server/)

## Module Context

Bun HTTP 서버 (포트 3002). AI API(Anthropic, Google)를 프록시하고,  
생성된 코드를 react-live에서 실행 가능한 형태로 후처리한다.

## Tech Stack & Constraints

- **Bun 런타임 전용** — Node.js API 일부 미지원. `Bun.serve()`, `Bun.file()` 사용.
- 외부 AI SDK(anthropic npm 패키지 등) **설치 금지** — 순수 `fetch()`로 REST 직접 호출.
- TypeScript 사용 가능 (Bun이 직접 실행) — 단, 생성 코드 출력물은 순수 JS여야 함.
- 단일 파일 서버: `server/index.ts` — 라우터 라이브러리 도입 불필요.

## Operational Commands

```bash
bun run server           # --watch 포함, 파일 변경 시 자동 재시작
bun run server/index.ts  # 직접 실행
```

## Implementation Patterns

**새 AI Provider 추가 절차:**
1. `Provider` 타입에 추가: `type Provider = 'anthropic' | 'google' | 'newprovider'`
2. `ENV_KEYS` 맵에 환경 변수 키 추가.
3. `callNewProvider(prompt, apiKey)` 함수 작성 — 반환 타입 `Promise<string>` (원시 텍스트).
4. `fetch()` 분기 조건에 케이스 추가.

**코드 후처리 파이프라인 (순서 변경 금지):**
```ts
const text = await callProvider(prompt, key);
const code = ensureRenderCall(stripCodeFences(text));
```
- `stripCodeFences`: Markdown 코드 펜스 제거 (` ```jsx `, ` ```tsx ` 등).
- `ensureRenderCall`: 첫 번째 PascalCase 함수/const를 찾아 `render(<Name />)` 자동 추가.
  - 이미 `render(` 있으면 건드리지 않음.

**에러 응답 규칙:**
- 400: API 키 누락, 프롬프트 누락 — 클라이언트 오류.
- 429/503: AI 공급자 upstream 오류 — 한국어 메시지 반환.
- 500: 그 외 예외 — `err.message` 그대로 반환.
- 모든 응답에 `CORS_HEADERS` 포함 필수.

## Local Golden Rules

**Do's:**
- `resolveApiKey(provider, clientKey)` 를 통해 키 우선순위(UI 입력 > .env)를 일관되게 적용.
- Google Gemini 응답의 `finishReason === 'MAX_TOKENS'` 케이스를 별도 처리 — 절단된 코드는 렌더 불가.
- OPTIONS 요청은 항상 200으로 즉시 응답 (CORS preflight).

**Don'ts:**
- `SYSTEM_PROMPT` 내용에서 "인라인 스타일", "import 없음", "render() 필수" 세 조건을 제거하지 마라 — react-live 샌드박스 실행에 필수.
- 스트리밍 응답 형식(`encodeChunk` / `encodeDone`)을 임의로 변경하지 마라 — 클라이언트의 `parseStreamChunk`와 쌍으로 동작함.
- `port: 3002`를 임의로 변경하지 마라 — `vite.config.ts` 프록시 설정과 연동됨.
