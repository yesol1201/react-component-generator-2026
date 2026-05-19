# AGENTS.md — Frontend (src/)

## Module Context

React 19 + TypeScript 프론트엔드. `App.tsx`가 Provider/API키/다크모드 상태를 관리하고,  
생성된 컴포넌트 목록을 `useComponentGenerator` 훅을 통해 렌더링한다.

## Tech Stack & Constraints

- React 19 (`react`, `react-dom`) — React.use() 등 최신 API 사용 가능.
- react-live 4.x — 생성된 컴포넌트를 `<LiveProvider>` 샌드박스에서 실행.
- TypeScript 5.9 strict 모드 — `src/` 내 모든 파일은 `.ts`/`.tsx` 사용.
- 별도 CSS 파일/모듈 없음 — 스타일은 인라인 스타일 객체로만 처리.

## Implementation Patterns

**컴포넌트 생성 흐름:**
```
PromptInput → useComponentGenerator.generate() → POST /api/generate
→ GeneratedComponent 객체 생성 → components 배열 앞에 추가 → ComponentCard 렌더링
```

**GeneratedComponent ID 생성 패턴:**
```ts
id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
```
ID 생성 방식 변경 시 uniqueness 보장 여부를 반드시 검토하라.

**react-live 사용 시 주의:**
- `<LiveProvider code={...}>` 내부에서 실행되는 코드는 `import` 사용 불가.
- `React`는 글로벌 스코프에서 사용 가능 (`React.useState` 등).
- 렌더링 오류는 `<LiveError>`로 표시한다 — try/catch로 감싸지 말 것.

**새 컴포넌트 파일 추가 시:**
- `src/components/` 하위에 PascalCase `.tsx` 파일로 생성.
- `App.tsx`에서 직접 임포트 (별도 index.ts 배럴 파일 없음).

## Local Golden Rules

**Do's:**
- `useComponentGenerator` 훅에 새 기능 추가 시 `UseComponentGeneratorReturn` 인터페이스에 타입 먼저 추가.
- `Provider` 타입 변경 시 `src/types/index.ts`와 `server/index.ts` 양쪽 동기화.
- API 요청은 `fetch('/api/generate', ...)` 패턴 유지 — Vite 프록시가 처리.

**Don'ts:**
- `src/` 어디에서도 `process.env`에 직접 접근하지 마라 — `/api/config` 엔드포인트를 통해 환경 키 존재 여부를 확인한다.
- `useComponentGenerator` 외부에서 `components` 배열을 직접 변환하지 마라.
- react-live `<LiveProvider>`에 `noInline` prop 없이는 `render()` 호출이 필요 없음에 주의 — 현재 설정은 `render(<Component />)` 필수.
