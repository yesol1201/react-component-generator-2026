# AGENTS.md — React 컴포넌트 생성기

## Operational Commands

패키지 매니저: **bun 고정** — npm/yarn/pnpm 사용 금지.

```bash
bun install              # 의존성 설치
bun run dev              # Vite(5173) + Bun API 서버(3002) 동시 실행
bun run server           # Bun 서버만 실행 (--watch 포함)
bun run build            # tsc -b && vite build → dist/
bun run lint             # ESLint 실행
bun run preview          # dist/ 빌드 결과 미리보기
```

개발 중 두 프로세스가 모두 필요한 경우: `bun run dev` 단독 사용.  
서버 로직만 수정 시: `bun run server`로 충분.

## Golden Rules

**Immutable (절대 금지):**
- API 키(ANTHROPIC_API_KEY, GOOGLE_API_KEY)를 코드에 하드코딩하지 마라.
- `server/`에서 외부 AI API를 직접 호출할 때 공식 REST API만 사용한다 (SDK 설치 금지 — Bun 호환성 이슈).
- `src/` 프론트엔드에서 AI API를 직접 호출하지 마라 — 반드시 `/api/generate` 프록시를 통해야 한다.
- react-live에서 실행되는 생성 코드에 `import` 문을 포함하지 마라 (샌드박스 환경, React는 글로벌로 제공됨).

**Do's:**
- AI가 생성한 코드에는 항상 `stripCodeFences()` → `ensureRenderCall()` 순서로 후처리를 적용한다.
- 새 Provider 추가 시 `server/index.ts`의 `Provider` 타입과 `ENV_KEYS` 맵을 함께 수정한다.
- 환경 변수 접근은 `process.env.*`로 서버에서만 한다.
- TypeScript를 `src/`에서 사용하고, 생성되는 React 컴포넌트 코드는 순수 JavaScript로만 생성한다.

**Don'ts:**
- `dist/`를 직접 편집하지 마라.
- `vite.config.ts`의 프록시 설정(`/api → localhost:3002`)을 제거하지 마라.
- CORS 헤더(`CORS_HEADERS`)를 서버 응답에서 누락하지 마라.

## Project Context

AI 프롬프트로 React 컴포넌트를 즉시 생성하고 react-live로 실시간 렌더링하는 웹 애플리케이션.  
Tech Stack: React 19, TypeScript, Vite 8, Bun 런타임, react-live, Anthropic Claude, Google Gemini.

## Standards & References

- 커밋 메시지: `feat:`, `fix:`, `refactor:`, `chore:` 접두사 사용 (한국어 또는 영어 본문 허용).
- ESLint: `bun run lint` 통과 필수. `eslint.config.js` (flat config) 기준.
- TypeScript strict 모드. `any` 타입 사용 시 명시적 캐스팅으로만 허용.
- **TDD 규칙:** [.claude/rules/tdd.md](./.claude/rules/tdd.md) 참고. RED-GREEN-REFACTOR 사이클 필수 준수.
- **Maintenance Policy:** 규칙과 실제 코드 구현 간 괴리가 발생하면 이 파일 수정을 제안하라.

## Context Map

- **[프론트엔드 컴포넌트/훅 (src/)](./src/AGENTS.md)** — React 컴포넌트, 커스텀 훅, 타입, react-live 관련 작업 시.
- **[백엔드 API 서버 (server/)](./server/AGENTS.md)** — Bun HTTP 서버, AI API 호출, 코드 후처리 로직 수정 시.
