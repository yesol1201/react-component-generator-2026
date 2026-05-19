# TDD 규칙 — Test-Driven Development

⚠️ **이 규칙은 Rigid — 상황에 맞게 변형하지 마라.** 예외는 AGENTS.md 수정을 통해서만 허용된다.

## 적용 대상 vs 불필요 대상

### TDD 반드시 적용 ✅

- **비즈니스 로직:** 코드 생성 후처리(`stripCodeFences`, `ensureRenderCall`), 프롬프트 빌드, 모델 선택 로직
- **API 엔드포인트:** `server/index.ts`의 `/api/generate`, `/api/models` 등 모든 핸들러
- **유틸리티 함수:** 데이터 변환, 검증, 문자열 처리
- **버그 수정:** 버그를 재현하는 테스트 먼저, 그 다음 수정
- **커스텀 훅 로직:** `useCodeGeneration`, `useModelProvider` 등의 상태/부수효과 로직
- **Provider 통합:** 새로운 AI Provider 추가 시 (예: Gemini 지원)

### TDD 불필요 ❌

- **타입 정의:** TypeScript 타입, 인터페이스
- **설정파일:** `vite.config.ts`, `eslint.config.js`, `tsconfig.json`
- **순수 UI 컴포넌트:** 렌더링 전용, 로직 없음 (예: Button, Card, Badge)
- **레이아웃 컴포넌트:** 마크업 구조만 담당
- **상수 파일:** 환경설정, 매직 넘버

---

## RED-GREEN-REFACTOR 사이클

### 🔴 RED: 테스트 먼저 작성

**1. 하나의 동작 = 하나의 테스트**
- "사용자가 프롬프트를 입력하고 버튼을 클릭하면 컴포넌트 코드를 생성한다" → **너무 크다**
- "생성된 JSX 코드가 있으면 `stripCodeFences()`는 마크다운 펜스를 제거한다" → **딱 맞다**

**2. 반드시 실행해서 실패 확인**
```bash
bun run test -- --watch
```
- 테스트가 **확실히 실패**해야 한다 (FAIL 메시지 확인)
- 실패 이유가 **"기능이 구현되지 않았다"** 여야 한다
- `cannot find module`, `ReferenceError` 같은 설정 오류는 RED가 아니다 → 수정 후 다시

**3. 함수/핸들러가 없으면 생성만 하고 구현은 하지 않기**
```typescript
// ✅ RED: 테스트만 작성
test('stripCodeFences removes markdown code block', () => {
  const input = '```jsx\nconst App = () => <div />;\n```';
  const result = stripCodeFences(input);
  expect(result).toBe('const App = () => <div />;');
});

// 이 시점에는 stripCodeFences() 함수가 없음 → 테스트 실행하면 FAIL
```

---

### 🟢 GREEN: 최소한의 코드만 작성

**1. YAGNI 원칙 (You Aren't Gonna Need It)**
- 지금 필요한 기능만 구현한다
- "나중에 쓰겠지" 하는 변수/함수/옵션은 금지

**2. 테스트를 통과하는 최소 구현**
```typescript
// ✅ GREEN: 테스트를 통과하는 최소 코드
export const stripCodeFences = (code: string): string => {
  return code.replace(/```(?:jsx|js|typescript)?\n?/g, '');
};
```

**3. 신규 + 기존 테스트 모두 통과 확인**
```bash
bun run test
```
- 이전에 통과하던 모든 테스트가 여전히 통과해야 함

---

### 🔵 REFACTOR: 중복 제거, 이름 개선, 추출

**1. 리팩토링 중에는 테스트를 절대 추가하지 않기**
- REFACTOR는 **구현 변경, 동작 변경 없음**
- 새로운 동작을 구현하려면 다시 RED로 돌아가야 한다

**2. 코드 정리 규칙**
- 중복된 로직 → 헬퍼 함수 추출
- 길고 이름 없는 변수 → 의미 있는 이름으로 개명
- 복잡한 조건식 → 명확한 변수로 저장
- 마법 숫자/문자열 → 상수로 정의

**3. Green 상태 유지 확인**
```bash
bun run test
# ✅ PASS: 모든 테스트 통과
```

---

### 🔄 반복

```
RED (테스트 작성) → GREEN (최소 구현) → REFACTOR (개선) → RED (다음 동작)
```

---

## 삭제 강제 규칙

### 프로덕션 코드를 먼저 작성했으면 삭제하고 RED부터 시작

1. **구현된 함수 전체 삭제** (참고용 주석도 금지)
2. 테스트 먼저 작성 (RED)
3. 구현 (GREEN)
4. 리팩토링 (REFACTOR)

임시 코드, 주석 처리된 코드, 참고용 구현 = 모두 삭제.  
나중에 필요하면 git 히스토리에서 찾으면 된다.

---

## 변명 차단표

| 변명 | 반박 |
|------|------|
| "너무 단순해서 테스트 불필요" | 단순할수록 테스트가 빠르다. 테스트 짜는 시간 < 버그 찾는 시간 |
| "나중에 테스트 추가하겠다" | "나중에"는 오지 않는다. RED-GREEN-REFACTOR 순서를 지켜야 하는 이유 |
| "시간이 없다" | TDD는 시간을 아낀다 (리뷰, 디버깅, 통합 비용 감소). 단기 비용 ≠ 장기 비용 |
| "삭제하면 작성한 코드가 낭비" | 테스트 없는 코드는 낭비다. 사라져도 배운 게 있다 |
| "프로토타입이니까 TDD는 나중에" | 프로토타입이 상용 코드가 되는 순간이 언제인지 아는가? → 프로토타입 때부터 TDD |
| "다른 팀원은 테스트 안 짜는데" | AGENTS.md가 규칙이다. Maintenance Policy를 읽어라 |
| "함수 시그니처가 안 정해졌다" | 그럼 RED에서 함수 시그니처부터 정의하는 테스트를 짜라 |

---

## 프로젝트별 규칙 우선 조항

**이 파일은 기본값(fallback)이다.** 우선순위:

1. **프로젝트 AGENTS.md** (최우선)
2. **src/AGENTS.md** — 프론트엔드 작업
3. **server/AGENTS.md** — 백엔드 작업
4. **이 파일** — 일반 TDD 원칙

---

## 테스트 작성 체크리스트

```
[ ] RED: 테스트 작성 + 실행 + 실패 확인
    [ ] 테스트가 명확한 한 가지 동작만 검증하는가?
    [ ] 실패 메시지가 "구현 부족"인가?

[ ] GREEN: 최소 구현 + 모든 테스트 통과
    [ ] 신규 테스트 통과?
    [ ] 기존 테스트도 여전히 통과?
    [ ] YAGNI 원칙 지켰나?

[ ] REFACTOR: 개선 + green 유지
    [ ] 중복 제거?
    [ ] 이름 명확화?
    [ ] 모든 테스트 통과?
```

## 프로젝트 테스트 명령

```bash
bun run test              # 단일 실행
bun run test -- --watch  # watch 모드
bun run test -- --coverage  # 커버리지 리포트
```

테스트 파일 위치:
- `src/**/*.test.ts` — 프론트엔드
- `server/**/*.test.ts` — 백엔드
