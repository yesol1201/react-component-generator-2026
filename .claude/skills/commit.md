# 커밋 스킬

변경사항을 분석하여 컨벤션에 맞게 자동으로 커밋하는 스킬입니다.

## 메타정보
- **이름**: 자동 커밋
- **설명**: git diff를 분석하여 변경사항을 논리적으로 분류하고 한국어 커밋 메시지를 작성한 후 사용자 승인 후 커밋
- **트리거**: 커밋, 커밋해줘, 변경사항 저장, 지금 커밋

## 실행 절차

### 1단계: 변경사항 분석
```bash
git status
git diff
```

변경된 파일 목록과 내용을 확인합니다.

### 2단계: 논리적 단위로 분류

변경사항을 다음 카테고리로 분류합니다:

- **feat** (기능): 새로운 기능 추가
  - 새 컴포넌트, 새 훅, 새 API 엔드포인트
  - 기존 기능의 새로운 옵션/플래그

- **fix** (버그 수정): 버그 수정
  - 의도하지 않은 동작 수정
  - 오류/예외 처리

- **refactor** (리팩토링): 코드 구조 개선
  - 동작 변화 없이 코드 정리
  - 성능 개선
  - 스타일/타입 정리

- **chore** (기타): 빌드, 의존성, 문서
  - 패키지 의존성 업데이트
  - 빌드 스크립트
  - 설정 파일
  - 타입 정의만 변경

- **style** (스타일): CSS/디자인 변경
  - 스타일시트 수정
  - 컬러/폰트 변경
  - UI 레이아웃 조정

### 3단계: 한국어 커밋 메시지 작성

형식:
```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

**규칙:**
- type: feat, fix, refactor, chore, style 중 하나 (소문자)
- scope: 변경된 주요 영역 (선택사항)
  - 예: Header, ComponentCard, useComponentGenerator, CSS, API
- subject: 현재형 동사로 명령조 형태 (한국어, 50자 이내)
  - ❌ "다크 모드를 추가했다"
  - ✅ "다크 모드 추가"
- body: 필요시 상세 설명 (왜 이 변경이 필요했는지, 무엇이 바뀌었는지)

**예시:**
```
feat(App): 다크 모드 토글 버튼 추가

- localStorage로 테마 설정 유지
- prefers-color-scheme 미디어 쿼리 기반 초기값
- CSS 변수로 라이트/다크 팔레트 관리

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### 4단계: 사용자 승인 및 커밋

사용자에게 커밋 메시지를 제시하고 승인을 받습니다.

승인 후:
```bash
git add <files>
git commit -m "<message>"
```

## 특별 규칙

### 다중 변경사항
변경사항이 여러 카테고리에 걸쳐있으면:
- **주 변경사항**으로 type 결정
- body에 세부사항 나열

### 파일별 커밋
대규모 변경의 경우, 논리적 단위로 여러 커밋 가능:
```
feat(CSS): 다크 모드 변수 확장
feat(App): 다크 모드 토글 UI 추가
fix(ComponentCard): 탭 전환 애니메이션 적용
```

### 무시할 변경
- node_modules 변경사항
- 로컬 설정 파일 (.env.local, .DS_Store 등)
- 자동 생성 파일 (dist, build, .next 등)

## 예시

**상황**: App.tsx에 다크모드 로직, App.css에 애니메이션, index.css에 배경 변수화

```
style(CSS): 다크 모드 팔레트 및 애니메이션 추가

- :root와 [data-theme="dark"] 변수 확장 (약 40개 변수)
- fadeInUp, fadeIn, scaleIn, shimmer 애니메이션 정의
- 헤더, 패널, 카드에 순차 진입 애니메이션 적용
- 버튼 hover에 translateY 효과 추가
- prefers-reduced-motion 접근성 지원

feat(App): 다크 모드 토글 및 localStorage 저장

- isDark 상태 관리 + useEffect로 data-theme 토글
- 헤더에 🌙/☀️ 버튼 추가
- localStorage와 prefers-color-scheme 초기화 로직

chore(package): index.css body 배경 변수화

- body 배경을 var(--page-gradient) 참조로 변경
- color-scheme: light dark 지원
- 테마 전환 시 transition 효과 추가

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

## 사용 방법

이 스킬을 사용하려면:

1. `커밋` 또는 `커밋해줘` 또는 `변경사항 저장`이라고 입력
2. Claude가 변경사항 분석
3. 커밋 메시지 제시
4. 승인/거절/수정 요청
5. 커밋 실행

---

**참고**: 이 스킬은 git 저장소가 있는 프로젝트에서만 작동합니다.
