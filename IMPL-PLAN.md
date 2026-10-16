<!-- 생성: 2026-10-07 22:36 KST -->

# 상식 퀴즈 웹 앱 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서버 없이 브라우저에서 파일을 열어 푸는 4지선다 상식 퀴즈(카테고리 4개, 카테고리마다 같은 수의 문항)를 연습, 스피드, 힌트 모드와 localStorage 순위표까지 3단계로 만든다.

**Architecture:** `script.js`를 순수 함수, 상태 객체, 화면 함수의 세 덩어리로 나눈다. 순수 함수는 개발용 `tests.html`을 브라우저로 열어 검사하고, 화면 동작은 단계마다 브라우저 확인 항목으로 사람이 확인한다. 화면은 `#app` 요소 안을 통째로 다시 그리는 방식이며, DOM은 `createElement`와 `textContent`로만 만든다(사용자가 입력한 이름을 안전하게 표시하기 위해 `innerHTML`을 쓰지 않는다).

**Tech Stack:** HTML, CSS, 바닐라 JavaScript(클래식 `<script>`, 모듈 아님), localStorage. 서버, 빌드, 외부 라이브러리, Node.js 없음.

**Spec:** [PRD.md](PRD.md)

## Global Constraints

- 앱 파일은 `index.html`, `style.css`, `script.js`, `questions.js` 4개다. `tests.html`은 개발용이며 앱에 포함하지 않는다.
- `index.html`을 더블클릭해 `file://`로 열었을 때 동작해야 한다. `fetch`, ES 모듈(`type="module"`), 외부 CDN을 쓰지 않는다.
- 카테고리는 4개(한국사, 세계지리, 과학, 예술과 문화)이고, 카테고리마다 문항 수가 같다. 한 판은 한 카테고리의 문항 전부다.
- 문항 규칙: (1) 문항마다 정답은 하나만이어야 한다. (2) 해설에는 확인한 출처를 명시해야 한다. (3) "가장 ~한"처럼 최상급 표현이 사용된 문항은 기준과 시점을 문제에 명시해야 한다.
- 틀린 문항은 모든 모드에서 0점이다. 연습과 스피드는 맞히면 1점, 힌트는 힌트를 쓰고 맞히면 0.5점, 쓰지 않고 맞히면 1점이다.
- 문제 순서와 보기 순서는 고정한다. 섞지 않는다.
- 화면 문구 규칙: 완결된 문장은 마침표로 끝낸다(예: "정답입니다."). 버튼, 라벨에는 마침표를 붙이지 않는다. 열거에는 가운뎃점 대신 쉼표를 쓴다. 보조용언은 띄어 쓴다(예: "입력해 주세요.").
- 새로 만드는 파일의 첫 줄에 생성 일시를 주석으로 남긴다. 시각은 추측하지 말고 PowerShell에서 `[System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, 'Korea Standard Time').ToString('yyyy-MM-dd HH:mm')`로 확인한다. 이 계획의 코드 블록에 있는 `YYYY-MM-DD HH:MM`은 그 값으로 바꿔 쓴다. 형식: JS `// 생성: 2026-10-07 22:36 KST`, CSS `/* 생성: ... KST */`, HTML `<!-- 생성: ... KST -->`
- git 저장소이고, 브랜치는 `main`, 원격은 `origin`(https://github.com/vhsy1901750-ai/study03_Quiz)이다. 커밋 작성자는 이 저장소에만 설정된 값(`git config user.name`, `git config user.email`)을 그대로 쓰고 바꾸지 않는다.

## 파일 구조

| 파일 | 책임 | 만드는 작업 |
|---|---|---|
| `tests.html` | 순수 함수와 문항 데이터 형식을 검사하고 통과/실패 목록을 보여 준다. | Task 1 |
| `script.js` | 순수 함수(맨 위), 상태, 화면 함수(아래). 마지막 줄에서 `#app`이 있을 때만 시작한다. | Task 1 |
| `questions.js` | `CATEGORIES`, `QUESTIONS` 전역 상수 | Task 2 |
| `index.html` | `#app`과 스크립트 연결 | Task 7 |
| `style.css` | 화면 스타일 | Task 7 |

**테스트 실행 방법(모든 작업 공통):** 탐색기에서 `tests.html`을 더블클릭하거나 PowerShell에서 `Start-Process .\tests.html`을 실행한다. 이미 열려 있으면 새로고침(F5)한다. 맨 위 요약 줄에 "전부 통과" 또는 "n개 실패"가 나오고, 아래에 테스트마다 "통과: ..." 또는 "실패: ..."가 나온다.

**앱 실행 방법:** 탐색기에서 `index.html`을 더블클릭하거나 `Start-Process .\index.html`을 실행한다.

---

# 1단계: 연습 모드와 점수

**만들 것**
- `index.html`, `style.css`, `script.js`(`scoreFor`, `formatScore`, `validateQuestions`와 연습 모드 화면), `tests.html`
- `questions.js`: 카테고리 4개, 카테고리마다 같은 수의 문항. 사실은 웹에서 확인하고 출처를 적는다.
- 모드 선택 화면과 틀린 문제 다시 풀기는 아직 만들지 않는다. 시작 화면은 카테고리 버튼 4개와 "순위표에 기록되지 않음"만 보여 준다.

**완료 기준**
- `tests.html`이 "전부 통과"를 보여 준다. 여기에는 `validateQuestions(CATEGORIES, QUESTIONS)`가 빈 배열을 돌려준다는 검사가 포함된다.
- `index.html?test`로 열면 개발자 도구 콘솔 마지막 줄에 `자체 점검 결과: 통과 12, 실패 0`이 나온다(PRD 7.3).
- 카테고리 4개의 문항을 각각 문항 규칙 3개로 검토했고, 사용자가 검토를 마쳤다.
- 아래 브라우저 확인 항목을 전부 통과한다.

**브라우저에서 직접 확인할 항목** (PRD 7.2.1)
- [ ] `index.html`을 더블클릭하면 열리고, 개발자 도구(F12) 콘솔에 오류가 없다.
- [ ] 시작 화면에 카테고리 4개와 "순위표에 기록되지 않음"이 보인다.
- [ ] 카테고리를 누르면 "1 / 한 판의 문항 수", 문제, 보기 4개가 나온다.
- [ ] 정답을 고르면 초록색, "정답입니다.", 해설, 출처가 나오고 점수가 1 오른다.
- [ ] 오답을 고르면 고른 보기는 빨강, 정답은 초록으로 표시되고 "오답입니다."가 나온다. 점수는 그대로다.
- [ ] 답을 고른 뒤 다른 보기를 눌러도 아무 변화가 없다.
- [ ] 맞혔을 때와 틀렸을 때 모두 해설 한 줄과 출처 링크가 나오고, 출처 링크를 누르면 새 탭에서 해당 페이지가 열린다. 퀴즈 화면은 그대로 남는다.
- [ ] 마지막 문항에서 [결과 보기]를 누르면 "x / 한 판의 문항 수"와 "순위표에 기록되지 않음"이 나온다.
- [ ] 결과 화면의 "문항별 결과"에 그 판의 문항 전부가 순서대로 나오고, 맞힌 문항은 초록 ✔와 내 답, 틀린 문항은 빨강 ✘와 내 답, 정답이 나온다.
- [ ] [처음으로]를 누른 뒤 나머지 카테고리 3개도 각각 문항 전부가 정상으로 나온다.
- [ ] 휴대폰 크기(폭 360px)에서 시작, 문제와 해설, 결과 화면이 가로 스크롤 없이 보이고, 버튼과 글자가 잘리지 않는다.

---

### Task 1: 테스트 페이지와 점수 함수

**Files:**
- Create: `tests.html`
- Create: `script.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `scoreFor(isCorrect: boolean, usedHint: boolean): number` — 0, 0.5, 1 중 하나
  - `formatScore(score: number): string` — 7 → `"7"`, 7.5 → `"7.5"`
  - `tests.html`의 도우미: `test(name, fn)`, `assertEqual(actual, expected)`(JSON 문자열로 비교), `assertIncludes(list, item)`. 새 테스트는 항상 `// ===== 테스트 끝 =====` 줄 바로 위에 추가한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests.html`을 만든다(첫 줄 생성 일시 주석).

```html
<!-- 생성: YYYY-MM-DD HH:MM KST -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>퀴즈 테스트</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 16px; }
    .pass { color: #2e7d32; }
    .fail { color: #c62828; font-weight: bold; }
  </style>
</head>
<body>
  <h1>퀴즈 테스트</h1>
  <p id="summary"></p>
  <ul id="results"></ul>

  <script src="questions.js"></script>
  <script src="script.js"></script>
  <script>
    const results = document.getElementById("results");
    let failed = 0;

    function test(name, fn) {
      const li = document.createElement("li");
      try {
        fn();
        li.textContent = "통과: " + name;
        li.className = "pass";
      } catch (error) {
        failed++;
        li.textContent = "실패: " + name + " (" + error.message + ")";
        li.className = "fail";
      }
      results.appendChild(li);
    }

    function assertEqual(actual, expected) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) throw new Error("기대값 " + b + ", 실제값 " + a);
    }

    function assertIncludes(list, item) {
      if (!list.includes(item)) {
        throw new Error("목록에 " + JSON.stringify(item) + "이(가) 없음. 실제 목록 " + JSON.stringify(list));
      }
    }

    test("scoreFor: 오답이면 0점", () => {
      assertEqual(scoreFor(false, false), 0);
      assertEqual(scoreFor(false, true), 0);
    });

    test("scoreFor: 힌트 없이 맞히면 1점", () => {
      assertEqual(scoreFor(true, false), 1);
    });

    test("scoreFor: 힌트를 쓰고 맞히면 0.5점", () => {
      assertEqual(scoreFor(true, true), 0.5);
    });

    test("formatScore: 정수는 정수로, 0.5 단위는 소수 한 자리로", () => {
      assertEqual(formatScore(0), "0");
      assertEqual(formatScore(7), "7");
      assertEqual(formatScore(7.5), "7.5");
      assertEqual(formatScore(0.5 + 1 + 0.5), "2");
    });

    // ===== 테스트 끝 =====

    document.getElementById("summary").textContent =
      failed === 0 ? "전부 통과" : failed + "개 실패";
  </script>
</body>
</html>
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

`tests.html`을 연다.
Expected: "4개 실패", 각 줄에 `scoreFor is not defined` 또는 `formatScore is not defined`. 콘솔의 `questions.js`, `script.js` 파일 없음 오류는 이 단계에서 정상이다.

- [ ] **Step 3: 최소 구현 작성**

`script.js`를 만든다.

```js
// 생성: YYYY-MM-DD HH:MM KST

// ===== 순수 함수 =====

function scoreFor(isCorrect, usedHint) {
  if (!isCorrect) return 0;
  return usedHint ? 0.5 : 1;
}

function formatScore(score) {
  return String(score);
}
```

0.5와 1의 합은 부동소수점 오차 없이 정확하므로 `String(score)`만으로 "7"과 "7.5"가 나온다.

- [ ] **Step 4: 테스트가 통과하는지 확인**

`tests.html`을 새로고침한다.
Expected: "전부 통과", 통과 4줄.

- [ ] **Step 5: 커밋**

```bash
git add tests.html script.js
git commit -m "feat: 테스트 페이지와 점수 함수 추가"
```

---

### Task 2: 문항 데이터 형식 검사

**Files:**
- Modify: `script.js` (`formatScore` 함수 아래에 추가)
- Create: `questions.js`
- Test: `tests.html`

**Interfaces:**
- Consumes: Task 1의 `test`, `assertEqual`, `assertIncludes`
- Produces:
  - `validateQuestions(categories: {id, name}[], questions: {[id]: Item[]}): string[]` — 오류 메시지 배열, 오류가 없으면 `[]`
  - `Item = { question: string, choices: string[4], answer: 0|1|2|3, explanation: string, source: string }`
  - 전역 상수 `CATEGORIES`(id: `history`, `geography`, `science`, `culture`)와 `QUESTIONS`
  - 오류 메시지 형식(테스트가 그대로 비교한다):
    - `카테고리가 4개가 아닙니다(3개).`
    - `b: 문항 배열이 없습니다.`
    - `a: 문항이 10개가 아닙니다(9개).`
    - `a 1번: source 값이 비어 있습니다.` (`question`, `explanation`도 같은 형식)
    - `a 1번: 보기가 4개가 아닙니다.`
    - `a 1번: 비어 있는 보기가 있습니다.`
    - `a 1번: 중복된 보기가 있습니다.`
    - `a 1번: answer가 0~3의 정수가 아닙니다.`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests.html`의 `// ===== 테스트 끝 =====` 줄 바로 위에 추가한다.

```js
    function makeItem(overrides) {
      return Object.assign({
        question: "문제",
        choices: ["가", "나", "다", "라"],
        answer: 0,
        explanation: "해설이다.",
        source: "출처",
      }, overrides);
    }

    function makeData() {
      const categories = [
        { id: "a", name: "A" }, { id: "b", name: "B" },
        { id: "c", name: "C" }, { id: "d", name: "D" },
      ];
      const questions = {};
      for (const category of categories) {
        questions[category.id] = Array.from({ length: 10 }, () => makeItem({}));
      }
      return { categories, questions };
    }

    test("validateQuestions: 올바른 데이터는 오류가 없다", () => {
      const { categories, questions } = makeData();
      assertEqual(validateQuestions(categories, questions), []);
    });

    test("validateQuestions: 카테고리가 4개가 아니면 오류", () => {
      const { categories, questions } = makeData();
      assertIncludes(validateQuestions(categories.slice(0, 3), questions), "카테고리가 4개가 아닙니다(3개).");
    });

    test("validateQuestions: 카테고리의 문항 배열이 없으면 오류", () => {
      const { categories, questions } = makeData();
      delete questions.b;
      assertIncludes(validateQuestions(categories, questions), "b: 문항 배열이 없습니다.");
    });

    test("validateQuestions: 문항이 10개가 아니면 오류", () => {
      const { categories, questions } = makeData();
      questions.a.pop();
      assertIncludes(validateQuestions(categories, questions), "a: 문항이 10개가 아닙니다(9개).");
    });

    test("validateQuestions: 문제, 해설, 출처가 비어 있으면 오류", () => {
      const { categories, questions } = makeData();
      questions.a[0] = makeItem({ question: "", explanation: " ", source: "" });
      const errors = validateQuestions(categories, questions);
      assertIncludes(errors, "a 1번: question 값이 비어 있습니다.");
      assertIncludes(errors, "a 1번: explanation 값이 비어 있습니다.");
      assertIncludes(errors, "a 1번: source 값이 비어 있습니다.");
    });

    test("validateQuestions: 보기가 4개가 아니면 오류", () => {
      const { categories, questions } = makeData();
      questions.a[0] = makeItem({ choices: ["가", "나", "다"] });
      assertIncludes(validateQuestions(categories, questions), "a 1번: 보기가 4개가 아닙니다.");
    });

    test("validateQuestions: 비어 있는 보기가 있으면 오류", () => {
      const { categories, questions } = makeData();
      questions.a[0] = makeItem({ choices: ["가", "나", "다", " "] });
      assertIncludes(validateQuestions(categories, questions), "a 1번: 비어 있는 보기가 있습니다.");
    });

    test("validateQuestions: 보기가 중복되면 오류", () => {
      const { categories, questions } = makeData();
      questions.a[0] = makeItem({ choices: ["가", "나", "다", "가"] });
      assertIncludes(validateQuestions(categories, questions), "a 1번: 중복된 보기가 있습니다.");
    });

    test("validateQuestions: answer가 0~3의 정수가 아니면 오류", () => {
      const { categories, questions } = makeData();
      questions.a[0] = makeItem({ answer: 4 });
      questions.a[1] = makeItem({ answer: 1.5 });
      const errors = validateQuestions(categories, questions);
      assertIncludes(errors, "a 1번: answer가 0~3의 정수가 아닙니다.");
      assertIncludes(errors, "a 2번: answer가 0~3의 정수가 아닙니다.");
    });

    test("실제 문항 데이터가 형식 규칙을 지킨다", () => {
      assertEqual(validateQuestions(CATEGORIES, QUESTIONS), []);
    });
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

`tests.html`을 새로고침한다.
Expected: 새 테스트 10개가 `validateQuestions is not defined`로 실패한다(마지막 테스트는 `CATEGORIES is not defined`일 수 있다).

- [ ] **Step 3: 최소 구현 작성**

`script.js`의 `formatScore` 함수 아래에 추가한다.

```js
function validateQuestions(categories, questions) {
  const errors = [];
  if (categories.length !== 4) {
    errors.push(`카테고리가 4개가 아닙니다(${categories.length}개).`);
  }
  for (const category of categories) {
    const items = questions[category.id];
    if (!Array.isArray(items)) {
      errors.push(`${category.id}: 문항 배열이 없습니다.`);
      continue;
    }
    if (items.length !== 10) {
      errors.push(`${category.id}: 문항이 10개가 아닙니다(${items.length}개).`);
    }
    items.forEach((item, i) => {
      const where = `${category.id} ${i + 1}번`;
      for (const field of ["question", "explanation", "source"]) {
        if (typeof item[field] !== "string" || item[field].trim() === "") {
          errors.push(`${where}: ${field} 값이 비어 있습니다.`);
        }
      }
      if (!Array.isArray(item.choices) || item.choices.length !== 4) {
        errors.push(`${where}: 보기가 4개가 아닙니다.`);
      } else {
        if (item.choices.some((choice) => typeof choice !== "string" || choice.trim() === "")) {
          errors.push(`${where}: 비어 있는 보기가 있습니다.`);
        }
        if (new Set(item.choices).size !== 4) {
          errors.push(`${where}: 중복된 보기가 있습니다.`);
        }
      }
      if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3) {
        errors.push(`${where}: answer가 0~3의 정수가 아닙니다.`);
      }
    });
  }
  return errors;
}
```

`questions.js`를 만든다. 문항은 Task 3~6에서 채운다.

```js
// 생성: YYYY-MM-DD HH:MM KST

const CATEGORIES = [
  { id: "history", name: "한국사" },
  { id: "geography", name: "세계지리" },
  { id: "science", name: "과학" },
  { id: "culture", name: "예술과 문화" },
];

const QUESTIONS = {
  history: [],
  geography: [],
  science: [],
  culture: [],
};
```

- [ ] **Step 4: 테스트 결과 확인**

`tests.html`을 새로고침한다.
Expected: "1개 실패". 실패하는 것은 "실제 문항 데이터가 형식 규칙을 지킨다" 하나뿐이고, 실제값에 `history: 문항이 10개가 아닙니다(0개).` 등 4개 메시지가 보인다. 이 테스트는 Task 6이 끝날 때 통과한다. 나머지는 모두 통과해야 한다.

- [ ] **Step 5: 커밋**

```bash
git add tests.html script.js questions.js
git commit -m "feat: 문항 데이터 형식 검사 추가"
```

---

> **Task 3~6 공통 안내:** 문항 내용은 이 계획에 미리 적지 않는다. PRD 4.2가 "웹 검색으로 사실을 확인한 뒤 출처를 적는다"를 요구하므로, 확인되지 않은 문항을 계획에 써 두면 그대로 옮겨질 위험이 있기 때문이다. 각 작업은 따로 검토받고 따로 커밋한다.

### Task 3: 한국사 10문제

**Files:**
- Modify: `questions.js` (`QUESTIONS.history` 배열)

**Interfaces:**
- Consumes: Task 2의 `Item` 형식과 `validateQuestions`
- Produces: `QUESTIONS.history`에 `Item` 10개

- [ ] **Step 1: 실패 상태 확인**

`tests.html`을 연다.
Expected: "실제 문항 데이터가 형식 규칙을 지킨다"가 실패하고, 실제값에 `history: 문항이 10개가 아닙니다(0개).`가 있다.

- [ ] **Step 2: 주제 10개 고르기**

대학 1학년 상식 수준에서 주제가 겹치지 않게 고른다. 시대를 고르게 섞는다: 고대(고조선, 삼국, 남북국) 3개, 고려 2개, 조선 3개, 근현대 2개.

- [ ] **Step 3: 문항마다 사실 확인 후 작성**

문항 하나마다 다음을 한다.
1. 정답이 되는 사실을 웹 검색으로 확인한다. 출처는 한국민족문화대백과사전, 우리역사넷(국사편찬위원회), 국립중앙박물관, 문화유산청 국가유산포털을 우선한다.
2. 오답 보기 3개도 정답이 될 여지가 없는지 같은 출처에서 확인한다.
3. 아래 형식으로 `QUESTIONS.history` 배열에 추가한다.

```js
    {
      question: "조선을 건국한 인물은 누구인가?",
      choices: ["이성계", "왕건", "이방원", "정도전"],
      answer: 0,
      explanation: "이성계는 1392년 조선을 건국했다.",
      source: "한국민족문화대백과사전, '태조'",
    },
```

- `source`에는 문서(사이트) 이름과 항목 이름을 함께 적는다.
- `explanation`은 한 문장으로 쓰고 마침표로 끝낸다.

- [ ] **Step 4: 문항 규칙 체크리스트로 검토**

10문항 각각에 대해 확인한다.
- [ ] 정답이 하나뿐이다. 기준이나 해석에 따라 다른 보기도 정답이 될 수 있으면 문제를 고친다.
- [ ] `source`에 실제로 확인한 출처가 적혀 있다.
- [ ] "가장", "최초", "최대" 같은 최상급 표현이 있으면 기준과 시점을 괄호로 문제에 적었다. 예: "(현존하는 건물 기준) 한국에서 가장 오래된 목조 건물은?"
- [ ] `explanation`이 한 문장이다.
- [ ] 보기 4개가 같은 종류(모두 인물, 모두 연도 등)여서 형식만 보고 정답을 고를 수 없다.
- [ ] 순서가 고정이므로, 정답 위치(`answer` 0~3)가 한쪽에 몰리지 않는다(위치마다 2~3번).

- [ ] **Step 5: 형식 검사 확인**

`tests.html`을 새로고침한다.
Expected: "실제 문항 데이터가 형식 규칙을 지킨다"의 실제값에 `history`로 시작하는 메시지가 하나도 없다.

- [ ] **Step 6: 사용자 검토**

10문항을 표(번호, 문제, 정답, 해설, 출처)로 정리해 사용자에게 보여 주고, 고칠 곳을 반영한다. 사용자가 승인해야 다음 작업으로 간다.

- [ ] **Step 7: 커밋**

```bash
git add questions.js
git commit -m "feat: 한국사 문항 10개 추가"
```

---

### Task 4: 세계지리 10문제

**Files:**
- Modify: `questions.js` (`QUESTIONS.geography` 배열)

**Interfaces:**
- Consumes: Task 2의 `Item` 형식과 `validateQuestions`
- Produces: `QUESTIONS.geography`에 `Item` 10개

- [ ] **Step 1: 실패 상태 확인**

`tests.html`을 연다.
Expected: "실제 문항 데이터가 형식 규칙을 지킨다"가 실패하고, 실제값에 `geography: 문항이 10개가 아닙니다(0개).`가 있다.

- [ ] **Step 2: 주제 10개 고르기**

대학 1학년 상식 수준에서 주제가 겹치지 않게 고른다. 대륙(아시아, 유럽, 아프리카, 아메리카, 오세아니아)을 고르게 섞고, 수도, 강과 산맥, 기후, 국경 같은 유형도 섞는다.

- [ ] **Step 3: 문항마다 사실 확인 후 작성**

문항 하나마다 다음을 한다.
1. 정답이 되는 사실을 웹 검색으로 확인한다. 출처는 브리태니커, 각국 정부 공식 사이트, 국제연합(UN) 등 국제기구 통계, 외교부 국가 정보를 우선한다.
2. 오답 보기 3개도 정답이 될 여지가 없는지 같은 출처에서 확인한다.
3. 아래 형식으로 `QUESTIONS.geography` 배열에 추가한다.

```js
    {
      question: "오스트레일리아의 수도는 어디인가?",
      choices: ["시드니", "멜버른", "캔버라", "퍼스"],
      answer: 2,
      explanation: "오스트레일리아의 수도는 캔버라다.",
      source: "브리태니커, 'Canberra'",
    },
```

- `source`에는 문서(사이트) 이름과 항목 이름을 함께 적는다.
- `explanation`은 한 문장으로 쓰고 마침표로 끝낸다.
- 세계지리는 "가장 긴 강", "가장 높은 산"처럼 최상급 문항이 많고, 측정 기준에 따라 답이 갈리는 경우가 있다(예: 가장 긴 강은 나일강과 아마존강 사이에 논쟁이 있다). 이런 주제는 기준을 문제에 적어 답이 하나로 정해질 때만 쓰고, 그렇지 않으면 피한다.

- [ ] **Step 4: 문항 규칙 체크리스트로 검토**

10문항 각각에 대해 확인한다.
- [ ] 정답이 하나뿐이다. 기준이나 해석에 따라 다른 보기도 정답이 될 수 있으면 문제를 고친다.
- [ ] `source`에 실제로 확인한 출처가 적혀 있다.
- [ ] "가장", "최초", "최대" 같은 최상급 표현이 있으면 기준과 시점을 괄호로 문제에 적었다. 예: "(2024년 기준, 면적 기준) 세계에서 가장 넓은 나라는?"
- [ ] `explanation`이 한 문장이다.
- [ ] 보기 4개가 같은 종류(모두 도시, 모두 나라 등)여서 형식만 보고 정답을 고를 수 없다.
- [ ] 순서가 고정이므로, 정답 위치(`answer` 0~3)가 한쪽에 몰리지 않는다(위치마다 2~3번).

- [ ] **Step 5: 형식 검사 확인**

`tests.html`을 새로고침한다.
Expected: "실제 문항 데이터가 형식 규칙을 지킨다"의 실제값에 `geography`로 시작하는 메시지가 하나도 없다.

- [ ] **Step 6: 사용자 검토**

10문항을 표(번호, 문제, 정답, 해설, 출처)로 정리해 사용자에게 보여 주고, 고칠 곳을 반영한다. 사용자가 승인해야 다음 작업으로 간다.

- [ ] **Step 7: 커밋**

```bash
git add questions.js
git commit -m "feat: 세계지리 문항 10개 추가"
```

---

### Task 5: 과학 10문제

**Files:**
- Modify: `questions.js` (`QUESTIONS.science` 배열)

**Interfaces:**
- Consumes: Task 2의 `Item` 형식과 `validateQuestions`
- Produces: `QUESTIONS.science`에 `Item` 10개

- [ ] **Step 1: 실패 상태 확인**

`tests.html`을 연다.
Expected: "실제 문항 데이터가 형식 규칙을 지킨다"가 실패하고, 실제값에 `science: 문항이 10개가 아닙니다(0개).`가 있다.

- [ ] **Step 2: 주제 10개 고르기**

대학 1학년 상식 수준에서 주제가 겹치지 않게 고른다. 물리, 화학, 생명과학, 지구과학(천문 포함)을 고르게 섞는다(분야마다 2~3개).

- [ ] **Step 3: 문항마다 사실 확인 후 작성**

문항 하나마다 다음을 한다.
1. 정답이 되는 사실을 웹 검색으로 확인한다. 출처는 브리태니커, NASA, 국제순수응용화학연합(IUPAC), 국제도량형국(BIPM), 국립과천과학관 같은 기관의 공식 자료를 우선한다.
2. 오답 보기 3개도 정답이 될 여지가 없는지 같은 출처에서 확인한다.
3. 아래 형식으로 `QUESTIONS.science` 배열에 추가한다.

```js
    {
      question: "원소 기호 Fe가 나타내는 원소는 무엇인가?",
      choices: ["불소", "철", "납", "구리"],
      answer: 1,
      explanation: "Fe는 철을 뜻하는 라틴어 ferrum에서 온 원소 기호다.",
      source: "브리태니커, 'iron'",
    },
```

- `source`에는 문서(사이트) 이름과 항목 이름을 함께 적는다.
- `explanation`은 한 문장으로 쓰고 마침표로 끝낸다.
- 행성의 위성 수처럼 새 발견으로 바뀌는 값은 시점을 문제에 적거나 쓰지 않는다.

- [ ] **Step 4: 문항 규칙 체크리스트로 검토**

10문항 각각에 대해 확인한다.
- [ ] 정답이 하나뿐이다. 기준이나 해석에 따라 다른 보기도 정답이 될 수 있으면 문제를 고친다.
- [ ] `source`에 실제로 확인한 출처가 적혀 있다.
- [ ] "가장", "최초", "최대" 같은 최상급 표현이 있으면 기준과 시점을 괄호로 문제에 적었다. 예: "(질량 기준) 태양계에서 가장 큰 행성은?"
- [ ] `explanation`이 한 문장이다.
- [ ] 보기 4개가 같은 종류(모두 원소, 모두 단위 등)여서 형식만 보고 정답을 고를 수 없다.
- [ ] 순서가 고정이므로, 정답 위치(`answer` 0~3)가 한쪽에 몰리지 않는다(위치마다 2~3번).

- [ ] **Step 5: 형식 검사 확인**

`tests.html`을 새로고침한다.
Expected: "실제 문항 데이터가 형식 규칙을 지킨다"의 실제값에 `science`로 시작하는 메시지가 하나도 없다.

- [ ] **Step 6: 사용자 검토**

10문항을 표(번호, 문제, 정답, 해설, 출처)로 정리해 사용자에게 보여 주고, 고칠 곳을 반영한다. 사용자가 승인해야 다음 작업으로 간다.

- [ ] **Step 7: 커밋**

```bash
git add questions.js
git commit -m "feat: 과학 문항 10개 추가"
```

---

### Task 6: 예술과 문화 10문제

**Files:**
- Modify: `questions.js` (`QUESTIONS.culture` 배열)

**Interfaces:**
- Consumes: Task 2의 `Item` 형식과 `validateQuestions`
- Produces: `QUESTIONS.culture`에 `Item` 10개

- [ ] **Step 1: 실패 상태 확인**

`tests.html`을 연다.
Expected: "실제 문항 데이터가 형식 규칙을 지킨다"가 실패하고, 실제값에 `culture: 문항이 10개가 아닙니다(0개).`가 있다.

- [ ] **Step 2: 주제 10개 고르기**

대학 1학년 상식 수준에서 주제가 겹치지 않게 고른다. 미술, 음악, 문학, 건축, 한국 전통 예술, 세계유산을 고르게 섞는다.

- [ ] **Step 3: 문항마다 사실 확인 후 작성**

문항 하나마다 다음을 한다.
1. 정답이 되는 사실을 웹 검색으로 확인한다. 출처는 브리태니커, 한국민족문화대백과사전, 유네스코 세계유산 공식 사이트, 미술관과 박물관 공식 사이트(예: 루브르 박물관, 국립현대미술관)를 우선한다.
2. 오답 보기 3개도 정답이 될 여지가 없는지 같은 출처에서 확인한다.
3. 아래 형식으로 `QUESTIONS.culture` 배열에 추가한다.

```js
    {
      question: "「모나리자」를 그린 화가는 누구인가?",
      choices: ["미켈란젤로", "라파엘로", "보티첼리", "레오나르도 다빈치"],
      answer: 3,
      explanation: "「모나리자」는 레오나르도 다빈치가 그린 초상화다.",
      source: "루브르 박물관 공식 사이트, 'Mona Lisa'",
    },
```

- `source`에는 문서(사이트) 이름과 항목 이름을 함께 적는다.
- `explanation`은 한 문장으로 쓰고 마침표로 끝낸다.
- 작품의 제작 연도나 작가처럼 학설이 갈리는 사실은 쓰지 않는다.

- [ ] **Step 4: 문항 규칙 체크리스트로 검토**

10문항 각각에 대해 확인한다.
- [ ] 정답이 하나뿐이다. 기준이나 해석에 따라 다른 보기도 정답이 될 수 있으면 문제를 고친다.
- [ ] `source`에 실제로 확인한 출처가 적혀 있다.
- [ ] "가장", "최초", "최대" 같은 최상급 표현이 있으면 기준과 시점을 괄호로 문제에 적었다. 예: "(2024년 기준, 연간 관람객 수 기준) 세계에서 관람객이 가장 많은 미술관은?"
- [ ] `explanation`이 한 문장이다.
- [ ] 보기 4개가 같은 종류(모두 화가, 모두 작곡가 등)여서 형식만 보고 정답을 고를 수 없다.
- [ ] 순서가 고정이므로, 정답 위치(`answer` 0~3)가 한쪽에 몰리지 않는다(위치마다 2~3번).

- [ ] **Step 5: 형식 검사 확인**

`tests.html`을 새로고침한다.
Expected: "실제 문항 데이터가 형식 규칙을 지킨다"가 통과하고, 요약이 "전부 통과"다.

- [ ] **Step 6: 사용자 검토**

10문항을 표(번호, 문제, 정답, 해설, 출처)로 정리해 사용자에게 보여 주고, 고칠 곳을 반영한다. 사용자가 승인해야 다음 작업으로 간다.

- [ ] **Step 7: 커밋**

```bash
git add questions.js
git commit -m "feat: 예술과 문화 문항 10개 추가"
```

---

### Task 7: 연습 모드 화면

**Files:**
- Create: `index.html`
- Create: `style.css`
- Modify: `script.js` (파일 끝에 추가)

**Interfaces:**
- Consumes: `scoreFor`, `formatScore`(Task 1), `CATEGORIES`, `QUESTIONS`(Task 2~6)
- Produces (2, 3단계가 고치거나 부르는 이름):
  - 상수 `MODE_NAMES = { practice: "연습", speed: "스피드", hint: "힌트" }`, `NOT_RECORDED = "순위표에 기록되지 않음"`
  - `state` 객체(PRD 5.2의 필드 전부)
  - 도우미: `el(tag, text?, className?)`, `button(text, onClick, className?)`, `render(...nodes)`, `categoryName(id)`, `currentQuestion()`
  - 화면 함수: `showStart()`, `startGame(mode, categoryId)`, `showQuestion()`, `handleAnswer(choiceIndex)`, `nextQuestion()`, `showResult()`
  - DOM id: `#score`(문제 화면 점수), `#feedback`(해설 영역). 보기 버튼은 클래스 `choice`, `data-index` 속성에 보기 번호

이 작업은 DOM을 다루므로 `tests.html`로 검사하지 않고 브라우저에서 확인한다.

- [ ] **Step 1: `index.html` 작성**

```html
<!-- 생성: YYYY-MM-DD HH:MM KST -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>상식 퀴즈</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main id="app"></main>
  <script src="questions.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: `style.css` 작성**

```css
/* 생성: YYYY-MM-DD HH:MM KST */

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #f5f5f5;
  color: #222;
}

#app {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px;
}

button {
  font: inherit;
  padding: 10px 16px;
  margin: 4px 0;
  border: 1px solid #bbb;
  border-radius: 8px;
  background: #fff;
  color: inherit;
  cursor: pointer;
}

button:disabled {
  cursor: default;
  color: inherit;
}

.categories,
.choices {
  display: grid;
  gap: 8px;
}

.categories button,
.choices button {
  margin: 0;
  text-align: left;
}

.status {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #555;
  font-size: 14px;
}

.notice {
  color: #a15c00;
  font-weight: bold;
}

.choice.correct {
  background: #d4f5d4;
  border-color: #2e7d32;
}

.choice.wrong {
  background: #fbd5d5;
  border-color: #c62828;
}

.result-correct {
  color: #2e7d32;
  font-weight: bold;
}

.result-wrong {
  color: #c62828;
  font-weight: bold;
}

.source {
  color: #666;
  font-size: 14px;
}

.final-score {
  font-size: 32px;
  font-weight: bold;
}
```

- [ ] **Step 3: `script.js` 끝에 상태와 화면 코드 추가**

```js
// ===== 상태 =====

const MODE_NAMES = { practice: "연습", speed: "스피드", hint: "힌트" };
const NOT_RECORDED = "순위표에 기록되지 않음";

const state = {
  mode: "practice",
  categoryId: null,
  queue: [],
  position: 0,
  score: 0,
  wrongIndices: [],
  hintUsed: false,
  isRetry: false,
  retryCorrect: 0,
  remaining: 0,
  timerId: null,
};

// ===== 화면 =====

const app = document.getElementById("app");

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(text, onClick, className) {
  const node = el("button", text, className);
  node.type = "button";
  node.addEventListener("click", onClick);
  return node;
}

function render(...nodes) {
  app.replaceChildren(...nodes);
}

function categoryName(id) {
  return CATEGORIES.find((category) => category.id === id).name;
}

function currentQuestion() {
  return QUESTIONS[state.categoryId][state.queue[state.position]];
}

function showStart() {
  const categoryButtons = el("div", undefined, "categories");
  for (const category of CATEGORIES) {
    categoryButtons.append(button(category.name, () => startGame("practice", category.id)));
  }
  render(
    el("h1", "상식 퀴즈"),
    el("p", "연습 모드: 시간 제한과 힌트 없이 풉니다. 맞히면 1점입니다."),
    el("p", NOT_RECORDED, "notice"),
    el("h2", "카테고리를 고르세요"),
    categoryButtons,
  );
}

function startGame(mode, categoryId) {
  state.mode = mode;
  state.categoryId = categoryId;
  state.queue = QUESTIONS[categoryId].map((_, i) => i);
  state.position = 0;
  state.score = 0;
  state.wrongIndices = [];
  state.isRetry = false;
  state.retryCorrect = 0;
  showQuestion();
}

function showQuestion() {
  state.hintUsed = false;
  const item = currentQuestion();

  const status = el("div", undefined, "status");
  const scoreNode = el("span", `점수 ${formatScore(state.score)}`);
  scoreNode.id = "score";
  status.append(
    el("span", categoryName(state.categoryId)),
    el("span", MODE_NAMES[state.mode]),
    el("span", `${state.position + 1} / ${state.queue.length}`),
    scoreNode,
  );

  const choices = el("div", undefined, "choices");
  item.choices.forEach((choice, i) => {
    const node = button(choice, () => handleAnswer(i), "choice");
    node.dataset.index = i;
    choices.append(node);
  });

  const feedback = el("div", undefined, "feedback");
  feedback.id = "feedback";

  render(status, el("h2", item.question, "question"), choices, feedback);
}

function handleAnswer(choiceIndex) {
  const item = currentQuestion();
  const isCorrect = choiceIndex === item.answer;
  state.score += scoreFor(isCorrect, state.hintUsed);
  document.getElementById("score").textContent = `점수 ${formatScore(state.score)}`;
  if (!isCorrect) state.wrongIndices.push(state.queue[state.position]);

  for (const node of app.querySelectorAll(".choice")) {
    node.disabled = true;
    const index = Number(node.dataset.index);
    if (index === item.answer) node.classList.add("correct");
    else if (index === choiceIndex) node.classList.add("wrong");
  }

  const message = isCorrect ? "정답입니다." : "오답입니다.";
  const isLast = state.position === state.queue.length - 1;
  document.getElementById("feedback").append(
    el("p", message, isCorrect ? "result-correct" : "result-wrong"),
    el("p", item.explanation),
    el("p", `출처: ${item.source}`, "source"),
    button(isLast ? "결과 보기" : "다음", nextQuestion),
  );
}

function nextQuestion() {
  if (state.position === state.queue.length - 1) {
    showResult();
    return;
  }
  state.position++;
  showQuestion();
}

function showResult() {
  const total = state.queue.length;
  render(
    el("h1", "결과"),
    el("p", `${categoryName(state.categoryId)}, ${MODE_NAMES[state.mode]} 모드`),
    el("p", `${formatScore(state.score)} / ${total}`, "final-score"),
    el("p", `맞힌 문항 ${total - state.wrongIndices.length}개`),
    el("p", NOT_RECORDED, "notice"),
    button("처음으로", showStart),
  );
}

if (app) showStart();
```

`if (app) showStart();`는 반드시 파일 마지막 줄이어야 한다. 2, 3단계에서 함수를 추가할 때도 이 줄 위에 넣는다. `tests.html`에는 `#app`이 없으므로 화면이 시작되지 않는다.

- [ ] **Step 4: 테스트가 여전히 통과하는지 확인**

`tests.html`을 새로고침한다.
Expected: "전부 통과". 콘솔에 오류가 없다.

- [ ] **Step 5: 브라우저에서 동작 확인**

`index.html`을 열어 1단계의 "브라우저에서 직접 확인할 항목"을 하나씩 해 본다(출처 링크 항목은 Task 7-1에서 확인한다).
Expected: 전부 통과.

- [ ] **Step 6: 커밋**

```bash
git add index.html style.css script.js
git commit -m "feat: 연습 모드 화면과 점수 표시"
```

---

### Task 7-1: 출처 링크 (1단계 진행 중 사용자 요청으로 추가)

**Files:**
- Modify: `tests.html` (`makeItem`에 `url` 추가, 테스트 1개 추가)
- Modify: `script.js` (`validateQuestions`에 url 규칙 추가, `sourceLine` 추가, `handleAnswer`의 출처 줄 교체)
- Modify: `questions.js` (40문항마다 `source` 다음 줄에 `url` 추가)

**Interfaces:**
- Consumes: `Item`(Task 2), `el`, `handleAnswer`(Task 7)
- Produces:
  - `Item`에 `url: string` 필드 추가. 사실을 확인한 페이지 주소이며 `https://`로 시작한다.
  - 오류 메시지 `a 1번: url이 https://로 시작하지 않습니다.`
  - `sourceLine(item): HTMLParagraphElement` — "출처: " 뒤에 출처 이름 링크(새 탭)를 단 문단

- [ ] **Step 1: 실패하는 테스트 작성**

`tests.html`의 `makeItem` 기본값에서 `source: "출처",` 다음 줄에 추가한다.

```js
        url: "https://example.com/page",
```

`"실제 문항 데이터가 형식 규칙을 지킨다"` 테스트 바로 위에 추가한다.

```js
    test("validateQuestions: url이 https://로 시작하지 않으면 오류", () => {
      const { categories, questions } = makeData();
      questions.a[0] = makeItem({ url: undefined });
      questions.a[1] = makeItem({ url: "http://example.com" });
      questions.a[2] = makeItem({ url: "" });
      const errors = validateQuestions(categories, questions);
      assertIncludes(errors, "a 1번: url이 https://로 시작하지 않습니다.");
      assertIncludes(errors, "a 2번: url이 https://로 시작하지 않습니다.");
      assertIncludes(errors, "a 3번: url이 https://로 시작하지 않습니다.");
    });
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

`tests.html`을 새로고침한다(브라우저가 이전 `script.js`를 캐시에서 쓰지 않게 Ctrl+F5). Expected: 새 테스트가 "목록에 ... 없음"으로 실패한다.

- [ ] **Step 3: 형식 규칙 구현**

`validateQuestions`에서 answer 검사 `if` 블록 바로 아래에 추가한다.

```js
      if (typeof item.url !== "string" || !item.url.startsWith("https://")) {
        errors.push(`${where}: url이 https://로 시작하지 않습니다.`);
      }
```

Expected: 새 테스트는 통과하고, "실제 문항 데이터가 형식 규칙을 지킨다"가 40개의 url 오류로 실패한다.

- [ ] **Step 4: 문항마다 url 추가**

각 문항의 `source` 다음 줄에 그 사실을 확인한 페이지 주소를 넣는다. 넣기 전에 주소를 브라우저로 열어 해당 항목 페이지가 뜨는지 확인한다. 브리태니커, MoMA처럼 `curl`에는 403을 주는 사이트가 있으므로 확인은 브라우저로 한다. 주소가 다른 페이지로 넘어가면 넘어간 최종 주소를 쓰고, `source`의 항목 이름도 그 페이지에 맞춘다.

```js
      source: "한국민족문화대백과사전, '광개토왕릉비'",
      url: "https://encykorea.aks.ac.kr/Article/E0005058",
```

Expected: `tests.html`이 "전부 통과".

- [ ] **Step 5: 출처를 링크로 표시**

`script.js`의 `currentQuestion` 함수 아래에 추가한다.

```js
function sourceLine(item) {
  const line = el("p", "출처: ", "source");
  const link = el("a", item.source);
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  line.append(link);
  return line;
}
```

`handleAnswer`에서 이 줄을

```js
    el("p", `출처: ${item.source}`, "source"),
```

아래로 바꾼다.

```js
    sourceLine(item),
```

`handleAnswer`는 정답, 오답(2단계부터는 시간 초과도)에서 모두 같은 해설 영역을 그리므로 모든 경우에 해설과 출처 링크가 나온다.

- [ ] **Step 6: 브라우저 확인**

`index.html`을 열어 정답과 오답을 하나씩 골라 본다. Expected: 두 경우 모두 해설 한 줄과 출처 링크가 나오고, 링크를 누르면 새 탭에서 출처 페이지가 열리며 퀴즈 화면은 그대로다.

- [ ] **Step 7: 커밋**

```bash
git add tests.html script.js questions.js PRD.md IMPL-PLAN.md
git commit -m "feat: 해설 아래 출처를 새 탭 링크로 표시"
```

---

### Task 7-2: 결과 화면의 문항별 결과 목록 (1단계 진행 중 사용자 요청으로 추가)

**Files:**
- Modify: `script.js` (`state`에 `answers` 추가, `startGame`, `handleAnswer` 수정, `reviewList` 추가, `showResult` 수정)
- Modify: `style.css` (끝에 추가)

**Interfaces:**
- Consumes: `state`, `el`, `QUESTIONS`(Task 7)
- Produces:
  - `state.answers: { index: number, choiceIndex: number | null, usedHint: boolean }[]` — 이번 풀이에서 문항마다 고른 답. `choiceIndex`가 `null`이면 시간 초과(2단계)
  - `reviewList(): HTMLUListElement` — "문항별 결과" 목록. 각 항목은 클래스 `review-correct` 또는 `review-wrong`, 표시 `review-mark`(✔ 또는 ✘)
  - 2단계 Task 10, 11, 12가 `reviewList`의 `myAnswer`, `detail` 줄과 `state.answers` 초기화를 고친다.

이 작업은 DOM을 다루므로 브라우저에서 확인한다.

- [ ] **Step 1: 답 기록 추가**

`state` 객체에서 `wrongIndices: [],` 다음 줄에 추가한다.

```js
  answers: [],
```

`startGame`에서 `state.wrongIndices = [];` 다음 줄에 추가한다.

```js
  state.answers = [];
```

`handleAnswer`에서 `if (!isCorrect) state.wrongIndices.push(state.queue[state.position]);` 다음 줄에 추가한다.

```js
  state.answers.push({ index: state.queue[state.position], choiceIndex, usedHint: state.hintUsed });
```

- [ ] **Step 2: `reviewList` 추가와 결과 화면 수정**

`showResult` 함수 바로 위에 추가한다.

```js
function reviewList() {
  const list = el("ul", undefined, "review");
  for (const answer of state.answers) {
    const item = QUESTIONS[state.categoryId][answer.index];
    const isCorrect = answer.choiceIndex === item.answer;
    const row = el("li", undefined, isCorrect ? "review-correct" : "review-wrong");
    const question = el("p", undefined, "review-question");
    question.append(el("span", isCorrect ? "✔" : "✘", "review-mark"), ` ${answer.index + 1}. ${item.question}`);
    const myAnswer = item.choices[answer.choiceIndex];
    let detail = `내 답: ${myAnswer}`;
    if (!isCorrect) detail += `, 정답: ${item.choices[item.answer]}`;
    row.append(question, el("p", detail, "review-detail"));
    list.append(row);
  }
  return list;
}
```

`showResult`의 `render( ... )` 안에서 `el("p", NOT_RECORDED, "notice"),` 다음 줄에 추가한다.

```js
    el("h2", "문항별 결과"),
    reviewList(),
```

띠 색은 `.review .review-correct`처럼 `.review`를 앞에 붙여 쓴다. `.review li`의 `border-left: 4px solid`가 색을 글자색으로 덮어쓰는데, `.review-correct`만 쓰면 우선순위가 더 낮아 띠가 검게 나오기 때문이다.

문항 번호는 목록 순서가 아니라 원래 문항 번호(`answer.index + 1`)를 쓴다. 그래서 다시 풀기(2단계)에서도 몇 번 문항이었는지 알 수 있다.

- [ ] **Step 3: 스타일 추가**

`style.css` 끝에 추가한다.

```css
.review {
  display: grid;
  gap: 8px;
  padding: 0;
  list-style: none;
}

.review li {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-left: 4px solid;
  border-radius: 8px;
  background: #fff;
}

.review .review-correct {
  border-left-color: #2e7d32;
}

.review .review-wrong {
  border-left-color: #c62828;
}

.review-correct .review-mark {
  color: #2e7d32;
}

.review-wrong .review-mark {
  color: #c62828;
}

.review-question {
  margin: 0 0 4px;
  font-weight: bold;
}

.review-detail {
  margin: 0;
  color: #555;
  font-size: 14px;
}
```

- [ ] **Step 4: 브라우저 확인**

`index.html`을 열고 한 카테고리에서 2, 5, 9번을 일부러 틀린다. Expected: 결과가 "7 / 10"이고, "문항별 결과"에 10개 항목이 나오며, 2, 5, 9번만 빨강 ✘와 "내 답: …, 정답: …", 나머지는 초록 ✔와 "내 답: …"이다. [처음으로]로 다른 카테고리를 풀면 목록이 그 카테고리의 10문항으로 바뀐다. `tests.html`은 여전히 "전부 통과"다.

- [ ] **Step 5: 커밋**

```bash
git add script.js style.css PRD.md IMPL-PLAN.md
git commit -m "feat: 결과 화면에 문항별 결과 목록 추가"
```

---

### Task 7-3: 자체 점검 `index.html?test` (1단계 진행 중 사용자 요청으로 추가)

**Files:**
- Modify: `script.js` (맨 아래에 "자체 점검" 구역 추가, 마지막 줄 다음에 한 줄 추가)

**Interfaces:**
- Consumes: 화면 함수 전부(`showStart`, `startGame`, `currentQuestion`, `validateQuestions` 등), `state`, `NOT_RECORDED`
- Produces:
  - `check(condition, reason)` — 조건이 거짓이면 `reason`을 메시지로 예외를 던진다.
  - 도우미 `choiceButton(index)`, `feedbackTexts()`, `answerAndNext(choiceIndex)`
  - `SELF_CHECKS: [이름, 점검 함수][]` — 2단계에서 항목을 이 배열 끝에 추가한다.
  - `runSelfCheck()` — 항목마다 통과면 `console.log("통과: 이름")`, 실패면 `console.error("실패: 이름 (이유)")`를 찍고, 끝나면 시작 화면으로 돌아가 `console.log("자체 점검 결과: 통과 n, 실패 m")`을 찍는다.

**점검 항목 12개**(사용자 확정): PRD 7.3의 목록과 같다. 각 항목은 실제 버튼을 `click()`으로 눌러 화면을 조작하고, DOM과 `state`를 확인한다.

- [ ] **Step 1: 자체 점검 구역 작성**

`script.js`의 `if (app) showStart();` 줄 바로 위에 "자체 점검" 구역(`check`, 도우미 3개, `SELF_CHECKS`, `runSelfCheck`)을 추가하고, 파일 마지막에 다음 줄을 추가한다. `if (app) showStart();` 줄은 그대로 둔다(2, 3단계 작업이 이 줄을 위치 기준으로 쓴다).

```js
if (app && new URLSearchParams(location.search).has("test")) runSelfCheck();
```

- [ ] **Step 2: 통과 확인**

`index.html?test`를 열고 개발자 도구 콘솔을 본다. Expected: "통과: …" 12줄과 `자체 점검 결과: 통과 12, 실패 0`.

- [ ] **Step 3: 실패를 잡는지 확인**

콘솔에서 `scoreFor = () => 0; runSelfCheck();`를 실행한다. Expected: 점수와 관련된 항목(5, 10, 11번)이 `console.error`로 "실패: …"를 찍고, 합계가 `통과 9, 실패 3`이다. 확인 뒤 새로고침한다.

- [ ] **Step 4: `?test` 없이 열면 점검하지 않는지 확인**

`index.html`을 열면 콘솔에 점검 출력이 없다. `tests.html`은 여전히 "전부 통과"다.

- [ ] **Step 5: 커밋**

```bash
git add script.js PRD.md IMPL-PLAN.md
git commit -m "feat: index.html?test 자체 점검 12개 항목 추가"
```

---

### Task 8: 1단계 완료 확인

**Files:** 없음(확인만 한다. 문제가 나오면 해당 Task로 돌아가 고친다)

- [ ] **Step 1: 자동 검사**

`tests.html`을 연다. Expected: "전부 통과". `index.html?test`를 연다. Expected: 콘솔 마지막 줄이 `자체 점검 결과: 통과 12, 실패 0`.

- [ ] **Step 2: 브라우저 확인 항목**

1단계의 "브라우저에서 직접 확인할 항목" 11개를 사용자가 직접 해 보고 체크한다. 카테고리 4개 모두 끝까지 풀어 본다.

- [ ] **Step 3: 문항 검토 완료 확인**

Task 3~6의 사용자 검토가 모두 승인되었는지 확인한다.

- [ ] **Step 4: 사용자에게 1단계 완료를 보고하고 2단계로 갈지 확인받는다**

---

# 2단계: 스피드 모드, 힌트 모드, 틀린 문제 다시 풀기

**만들 것**
- 시작 화면의 모드 선택(연습, 스피드, 힌트). 스피드와 힌트 모드에 들어가려면 필요하므로 이 단계에서 만든다(PRD 6.2).
- 스피드 모드 타이머(`startTimer`, `stopTimer`)
- `pickHintRemovals`와 힌트 버튼(`useHint`)
- 연습 모드의 틀린 문제 다시 풀기(`startRetry`)
- 순위표는 아직 만들지 않는다.

**완료 기준**
- `tests.html`이 "전부 통과"를 보여 준다. 여기에는 `pickHintRemovals` 테스트가 포함된다: 항상 서로 다른 번호 2개를 돌려주고, 정답 번호는 절대 포함하지 않는다.
- `index.html?test`로 열면 콘솔 마지막 줄에 `자체 점검 결과: 통과 15, 실패 0`이 나온다(PRD 7.3, Task 12-1).
- 아래 브라우저 확인 항목을 전부 통과하고, 1단계 브라우저 확인 항목도 다시 통과한다.

**브라우저에서 직접 확인할 항목** (PRD 7.2.2)
- [ ] 모드 3개가 보이고, 연습을 골랐을 때만 "순위표에 기록되지 않음"이 보인다.
- 스피드
  - [ ] 15부터 1초씩 줄어든다.
  - [ ] 그대로 두면 0에서 "시간 초과입니다."가 나오고 정답이 표시되며, 점수는 그대로다.
  - [ ] 답을 고른 뒤 몇 초 기다려도 숫자가 멈춰 있다.
  - [ ] [다음]을 누르면 15부터 다시 센다.
  - [ ] 결과 화면에서 [처음으로]를 누르고 새 판을 시작해도 시간이 2초씩 줄어들지 않는다(이전 타이머가 남아 있지 않다).
- 힌트
  - [ ] [힌트]를 누르면 오답 2개가 흐려지고 눌리지 않는다. 정답은 남아 있다.
  - [ ] 힌트 버튼은 한 번 누르면 꺼진다.
  - [ ] 힌트를 쓰고 맞히면 0.5점, 쓰지 않고 맞히면 1점이 오르고, 결과가 "7.5 / 10"(한 판이 10문항일 때)처럼 표시된다.
  - [ ] 다음 문항에서는 힌트를 다시 쓸 수 있다.
- 다시 풀기
  - [ ] 연습 결과에서 틀린 문제가 있으면 [틀린 문제 다시 풀기]가 보이고, 다 맞혔으면 보이지 않는다.
  - [ ] 다시 풀기에서는 틀린 문항만 "다시 풀기" 표시와 함께 나온다.
  - [ ] 다시 풀기가 끝나면 "다시 풀기 n문제 중 m문제 정답"이 나오고, 처음 점수는 그대로다.
  - [ ] 또 틀린 문항이 있으면 버튼이 다시 나온다.
  - [ ] 스피드, 힌트 결과에는 다시 풀기 버튼이 없다.

---

### Task 9: 모드 선택 화면

**Files:**
- Modify: `script.js` (`NOT_RECORDED` 상수 아래에 상수 추가, `showStart` 함수 전체 교체)
- Modify: `style.css` (끝에 추가)

**Interfaces:**
- Consumes: `MODE_NAMES`, `NOT_RECORDED`, `state`, `el`, `button`, `render`, `startGame`(Task 7)
- Produces: `MODE_DESCRIPTIONS`. 선택한 모드는 `state.mode`에 저장되고, 카테고리 버튼이 `startGame(state.mode, categoryId)`를 부른다.

- [ ] **Step 1: 모드 설명 상수 추가**

`script.js`의 `const NOT_RECORDED = ...;` 줄 아래에 추가한다.

```js
const MODE_DESCRIPTIONS = {
  practice: "시간 제한과 힌트 없이 풉니다. 맞히면 1점입니다.",
  speed: "문항마다 15초 안에 답합니다. 시간이 지나면 오답입니다.",
  hint: "문항마다 힌트를 1번 써서 오답 2개를 지울 수 있습니다. 힌트를 쓰고 맞히면 0.5점입니다.",
};
```

- [ ] **Step 2: `showStart` 교체**

`script.js`의 `function showStart() { ... }` 전체를 아래로 바꾼다.

```js
function showStart() {
  const modeButtons = el("div", undefined, "modes");
  for (const mode of ["practice", "speed", "hint"]) {
    const className = mode === state.mode ? "mode selected" : "mode";
    modeButtons.append(button(MODE_NAMES[mode], () => {
      state.mode = mode;
      showStart();
    }, className));
  }

  const categoryButtons = el("div", undefined, "categories");
  for (const category of CATEGORIES) {
    categoryButtons.append(button(category.name, () => startGame(state.mode, category.id)));
  }

  const nodes = [
    el("h1", "상식 퀴즈"),
    el("h2", "모드를 고르세요"),
    modeButtons,
    el("p", MODE_DESCRIPTIONS[state.mode]),
  ];
  if (state.mode === "practice") nodes.push(el("p", NOT_RECORDED, "notice"));
  nodes.push(el("h2", "카테고리를 고르세요"), categoryButtons);
  render(...nodes);
}
```

`state.mode`의 처음 값이 `"practice"`이므로 기본 선택은 연습이다. 한 판을 마치고 [처음으로]를 누르면 직전 모드가 선택된 채로 보인다.

- [ ] **Step 3: 스타일 추가**

`style.css` 끝에 추가한다.

```css
.modes {
  display: flex;
  gap: 8px;
}

.mode.selected {
  background: #222;
  color: #fff;
}
```

- [ ] **Step 4: 브라우저 확인**

`index.html`을 연다.
Expected:
- 모드 버튼 3개가 보이고 연습이 선택돼 있다.
- 스피드나 힌트를 누르면 설명이 바뀌고 "순위표에 기록되지 않음"이 사라진다.
- 스피드를 고른 뒤 카테고리를 누르면 문제 화면 위쪽에 "스피드"가 보인다(타이머는 Task 10에서 붙는다).
- `tests.html`은 여전히 "전부 통과"다.

- [ ] **Step 5: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 시작 화면에 모드 선택 추가"
```

---

### Task 10: 스피드 모드 타이머

**Files:**
- Modify: `script.js` (`startGame`, `showQuestion`, `handleAnswer`, `showResult` 일부 수정, 타이머 함수 추가)
- Modify: `style.css` (끝에 추가)

**Interfaces:**
- Consumes: `state.remaining`, `state.timerId`, `handleAnswer`(Task 7)
- Produces:
  - `TIME_LIMIT = 15`
  - `startTimer()`: 이전 타이머를 멈추고 15부터 센다. 0이 되면 `handleAnswer(null)`
  - `stopTimer()`: 타이머를 멈춘다. 여러 번 불러도 안전하다.
  - `handleAnswer(null)`은 시간 초과를 뜻한다.
  - DOM id `#timer`

- [ ] **Step 1: 타이머 함수 추가**

`script.js`의 `function nextQuestion()` 바로 위에 추가한다.

```js
const TIME_LIMIT = 15;

function startTimer() {
  stopTimer();
  state.remaining = TIME_LIMIT;
  updateTimer();
  state.timerId = setInterval(() => {
    state.remaining--;
    updateTimer();
    if (state.remaining === 0) handleAnswer(null);
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
}

function updateTimer() {
  document.getElementById("timer").textContent = `남은 시간 ${state.remaining}초`;
}
```

- [ ] **Step 2: 새 판 시작과 결과 화면에서 타이머 멈추기**

`startGame` 함수의 첫 줄(`state.mode = mode;` 위)에 추가한다.

```js
  stopTimer();
```

`showResult` 함수의 첫 줄(`const total = ...` 위)에 추가한다.

```js
  stopTimer();
```

- [ ] **Step 3: 문제 화면에 타이머 표시**

`showQuestion` 함수의 마지막 줄 `render(status, el("h2", item.question, "question"), choices, feedback);` 바로 아래에 추가한다.

```js
  if (state.mode === "speed") {
    const timer = el("p", undefined, "timer");
    timer.id = "timer";
    status.after(timer);
    startTimer();
  }
```

- [ ] **Step 4: 답을 고르면 타이머를 멈추고 시간 초과 문구 표시**

`handleAnswer` 함수의 첫 줄(`const item = currentQuestion();` 위)에 추가한다.

```js
  stopTimer();
```

같은 함수에서 이 줄을

```js
  const message = isCorrect ? "정답입니다." : "오답입니다.";
```

아래로 바꾼다.

```js
  let message = "오답입니다.";
  if (isCorrect) message = "정답입니다.";
  else if (choiceIndex === null) message = "시간 초과입니다.";
```

`choiceIndex`가 `null`이면 `isCorrect`는 `false`이므로 점수는 0점이 더해지고, 문항은 `wrongIndices`에 들어가며, 정답 보기만 초록으로 표시된다.

결과 목록(Task 7-2)에서도 시간 초과를 표시한다. `reviewList` 함수에서 이 줄을

```js
    const myAnswer = item.choices[answer.choiceIndex];
```

아래로 바꾼다.

```js
    const myAnswer = answer.choiceIndex === null ? "시간 초과" : item.choices[answer.choiceIndex];
```

- [ ] **Step 5: 스타일 추가**

`style.css` 끝에 추가한다.

```css
.timer {
  font-size: 20px;
  font-weight: bold;
}
```

- [ ] **Step 6: 브라우저 확인**

`index.html`을 열어 2단계 확인 항목 중 "스피드" 5개를 해 본다.
Expected: 전부 통과. 마지막 항목(2초씩 줄지 않음)은 한 판을 끝까지 푼 뒤 [처음으로], 스피드, 같은 카테고리로 다시 시작해서 확인한다. 연습 모드 문제 화면에는 타이머가 없다. `tests.html`은 여전히 "전부 통과"다.

- [ ] **Step 7: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 스피드 모드 15초 타이머 추가"
```

---

### Task 11: 힌트 모드

**Files:**
- Modify: `script.js` (`validateQuestions` 아래에 순수 함수 추가, `useHint` 추가, `showQuestion`, `handleAnswer` 일부 수정)
- Modify: `style.css` (끝에 추가)
- Test: `tests.html`

**Interfaces:**
- Consumes: `state.hintUsed`, `currentQuestion`, `scoreFor`(이미 `state.hintUsed`를 받는다)
- Produces:
  - `pickHintRemovals(answer: number, random = Math.random): number[]` — 정답이 아닌 보기 번호 2개. 남길 오답 1개를 `random()`으로 고르고 나머지 2개를 돌려준다.
  - `useHint()`, DOM id `#hint`, 지운 보기에 클래스 `removed`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests.html`의 `// ===== 테스트 끝 =====` 줄 바로 위에 추가한다.

```js
    test("pickHintRemovals: random 값에 따라 남길 오답을 고른다", () => {
      assertEqual(pickHintRemovals(0, () => 0), [2, 3]);
      assertEqual(pickHintRemovals(0, () => 0.99), [1, 2]);
      assertEqual(pickHintRemovals(2, () => 0.5), [0, 3]);
    });

    test("pickHintRemovals: 항상 서로 다른 오답 2개이고 정답은 없다", () => {
      for (let answer = 0; answer < 4; answer++) {
        for (const value of [0, 0.2, 0.34, 0.5, 0.67, 0.8, 0.999]) {
          const removals = pickHintRemovals(answer, () => value);
          assertEqual(removals.length, 2);
          assertEqual(removals[0] !== removals[1], true);
          assertEqual(removals.includes(answer), false);
          assertEqual(removals.every((i) => Number.isInteger(i) && i >= 0 && i <= 3), true);
        }
      }
    });

    test("pickHintRemovals: random을 넘기지 않아도 동작한다", () => {
      const removals = pickHintRemovals(1);
      assertEqual(removals.length, 2);
      assertEqual(removals.includes(1), false);
    });
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

`tests.html`을 새로고침한다.
Expected: "3개 실패", 각 줄에 `pickHintRemovals is not defined`.

- [ ] **Step 3: 최소 구현 작성**

`script.js`의 `validateQuestions` 함수 아래(`// ===== 상태 =====` 위)에 추가한다.

```js
function pickHintRemovals(answer, random = Math.random) {
  const wrong = [0, 1, 2, 3].filter((i) => i !== answer);
  const keep = Math.floor(random() * wrong.length);
  return wrong.filter((_, i) => i !== keep);
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

`tests.html`을 새로고침한다.
Expected: "전부 통과".

- [ ] **Step 5: 힌트 버튼과 `useHint` 추가**

`script.js`의 `const TIME_LIMIT = 15;` 줄 바로 위에 추가한다.

```js
function useHint() {
  state.hintUsed = true;
  const removals = pickHintRemovals(currentQuestion().answer);
  for (const node of app.querySelectorAll(".choice")) {
    if (removals.includes(Number(node.dataset.index))) {
      node.disabled = true;
      node.classList.add("removed");
    }
  }
  document.getElementById("hint").disabled = true;
}
```

`showQuestion` 함수에서 Task 10에서 넣은 `if (state.mode === "speed") { ... }` 블록 바로 아래에 추가한다.

```js
  if (state.mode === "hint") {
    const hint = button("힌트", useHint, "hint");
    hint.id = "hint";
    choices.after(hint);
  }
```

`handleAnswer` 함수에서 보기를 잠그는 `for (const node of app.querySelectorAll(".choice")) { ... }` 블록 바로 아래에 추가한다.

```js
  const hint = document.getElementById("hint");
  if (hint) hint.disabled = true;
```

답을 고른 뒤에는 힌트를 누를 수 없다. `showQuestion`이 `state.hintUsed = false`로 시작하므로 다음 문항에서는 힌트를 다시 쓸 수 있다.

결과 목록(Task 7-2)에 힌트 사용을 표시한다. `reviewList` 함수에서 `let detail = ...;` 줄 바로 아래에 추가한다.

```js
    if (isCorrect && answer.usedHint) detail += " (힌트 사용, 0.5점)";
```

- [ ] **Step 6: 스타일 추가**

`style.css` 끝에 추가한다.

```css
.choice.removed {
  opacity: 0.3;
  text-decoration: line-through;
}
```

- [ ] **Step 7: 브라우저 확인**

`index.html`을 열어 2단계 확인 항목 중 "힌트" 4개를 해 본다.
Expected: 전부 통과. 한 판 동안 힌트를 쓰고 맞히기, 힌트 없이 맞히기, 틀리기를 섞어서 결과가 예상 점수(예: 한 판이 10문항이면 7.5 / 10)와 같은지 계산해 본다. 연습, 스피드 모드에는 힌트 버튼이 없다.

- [ ] **Step 8: 커밋**

```bash
git add script.js style.css tests.html
git commit -m "feat: 힌트 모드 추가"
```

---

### Task 12: 틀린 문제 다시 풀기 (연습 모드)

**Files:**
- Modify: `script.js` (`startRetry` 추가, `showQuestion`, `handleAnswer` 일부 수정, `showResult` 전체 교체)

**Interfaces:**
- Consumes: `state.wrongIndices`, `state.isRetry`, `state.retryCorrect`, `stopTimer`(Task 10)
- Produces: `startRetry()`. 다시 풀기 중에는 `state.score`를 바꾸지 않고 `state.retryCorrect`만 센다. 다시 풀기에서 또 틀린 문항은 새 `state.wrongIndices`에 담긴다.

- [ ] **Step 1: `startRetry` 추가**

`script.js`의 `function nextQuestion()` 바로 위에 추가한다.

```js
function startRetry() {
  state.queue = state.wrongIndices;
  state.wrongIndices = [];
  state.answers = [];
  state.position = 0;
  state.isRetry = true;
  state.retryCorrect = 0;
  showQuestion();
}
```

- [ ] **Step 2: 문제 화면 위쪽에 "다시 풀기" 표시**

`showQuestion` 함수에서 `status.append( ... );` 호출 전체를 아래로 바꾼다.

```js
  status.append(
    el("span", categoryName(state.categoryId)),
    el("span", MODE_NAMES[state.mode]),
    el("span", `${state.position + 1} / ${state.queue.length}`),
    state.isRetry ? el("span", "다시 풀기", "retry-label") : scoreNode,
  );
```

다시 풀기 중에는 처음 점수를 바꾸지 않으므로 점수 대신 "다시 풀기"를 보여 준다.

- [ ] **Step 3: 다시 풀기 중에는 처음 점수를 바꾸지 않기**

`handleAnswer` 함수에서 이 두 줄을

```js
  state.score += scoreFor(isCorrect, state.hintUsed);
  document.getElementById("score").textContent = `점수 ${formatScore(state.score)}`;
```

아래로 바꾼다.

```js
  if (state.isRetry) {
    if (isCorrect) state.retryCorrect++;
  } else {
    state.score += scoreFor(isCorrect, state.hintUsed);
    document.getElementById("score").textContent = `점수 ${formatScore(state.score)}`;
  }
```

- [ ] **Step 4: `showResult` 교체**

`function showResult() { ... }` 전체를 아래로 바꾼다.

```js
function showResult() {
  stopTimer();
  const fullCount = QUESTIONS[state.categoryId].length;
  const nodes = [
    el("h1", "결과"),
    el("p", `${categoryName(state.categoryId)}, ${MODE_NAMES[state.mode]} 모드`),
  ];
  if (state.isRetry) {
    nodes.push(
      el("p", `다시 풀기 ${state.queue.length}문제 중 ${state.retryCorrect}문제 정답`, "final-score"),
      el("p", `처음 점수 ${formatScore(state.score)} / ${fullCount}`),
    );
  } else {
    nodes.push(
      el("p", `${formatScore(state.score)} / ${fullCount}`, "final-score"),
      el("p", `맞힌 문항 ${fullCount - state.wrongIndices.length}개`),
    );
  }
  if (state.mode === "practice") nodes.push(el("p", NOT_RECORDED, "notice"));
  nodes.push(el("h2", "문항별 결과"), reviewList());
  if (state.mode === "practice" && state.wrongIndices.length > 0) {
    nodes.push(button("틀린 문제 다시 풀기", startRetry));
  }
  nodes.push(button("처음으로", showStart));
  render(...nodes);
}
```

`startRetry`가 `state.answers`를 비우므로, 다시 풀기 결과의 목록에는 다시 푼 문항만 원래 문항 번호와 함께 나온다.

- [ ] **Step 5: 브라우저 확인**

`index.html`을 열어 2단계 확인 항목 중 "다시 풀기" 5개를 해 본다.
Expected: 전부 통과. 일부러 3문제를 틀린 뒤 다시 풀기에서 1문제를 또 틀리면 "다시 풀기 3문제 중 2문제 정답"이 나오고, 다시 버튼을 누르면 "1 / 1"로 그 문제만 나오는지 확인한다. `tests.html`은 여전히 "전부 통과"다.

- [ ] **Step 6: 커밋**

```bash
git add script.js
git commit -m "feat: 연습 모드 틀린 문제 다시 풀기 추가"
```

---

### Task 12-1: 자체 점검 13~15 (2단계 시작 때 사용자가 PRD 7.3의 제안대로 확정)

**Files:**
- Modify: `script.js` (자체 점검 구역에 도우미 `buttonByText` 추가, `SELF_CHECKS` 끝에 3개 추가)
- Modify: `PRD.md` (7.3의 "제안" 문구를 확정으로 바꿈)

**Interfaces:**
- Consumes: `startGame`, `handleAnswer`, `state.timerId`, `#timer`, `#hint`, `.choice.removed`, `startRetry`(Task 9~12)
- Produces: `buttonByText(text)`, `SELF_CHECKS` 15개

**점검 항목 3개**(PRD 7.3의 13~15)
13. 스피드: 시작 때 "남은 시간 15초"이고 타이머가 돈다. 답하면 `state.timerId`가 `null`이 된다. 다음 문항은 15초부터 다시 센다. 15초를 기다리지 않고, 타이머가 0에서 부르는 `handleAnswer(null)`을 직접 불러 "시간 초과입니다.", 정답 초록 표시, 점수 그대로를 확인한다.
14. 힌트: 힌트를 누르면 `.removed` 보기 2개가 잠기고 정답은 열려 있으며 힌트 버튼이 꺼진다. 맞히면 "점수 0.5"이고, 다음 문항에서 힌트를 다시 쓸 수 있다. 나머지를 다 맞히면 "9.5 / 10"(한 판이 10문항일 때)이고, 결과 목록 1번에만 "(힌트 사용, 0.5점)"이 붙는다.
15. 다시 풀기: 스피드, 힌트 결과에는 [틀린 문제 다시 풀기]가 없다. 연습에서 2, 5, 9번을 틀린 뒤 다시 풀기를 누르면 그 3문항만 "다시 풀기" 표시와 함께 나오고, 다 맞히면 "다시 풀기 3문제 중 3문제 정답", "처음 점수 7 / 10"(한 판이 10문항일 때)이 나오며 버튼이 없다. 연습을 마지막에 풀어서 점검이 끝난 뒤 시작 화면이 연습 모드로 돌아온다.

- [x] **Step 1: 점검 3개 작성**
- [x] **Step 2: 통과 확인** — `index.html?test`: `자체 점검 결과: 통과 15, 실패 0`
- [x] **Step 3: 실패를 잡는지 확인** — 콘솔에서 `stopTimer = () => {}; pickHintRemovals = (a) => [a, (a + 1) % 4];`로 바꾸고, `startRetry`가 전 문항을 다시 내게 바꾼 뒤 `runSelfCheck()`. Expected: 13, 14, 15번이 실패하고 `통과 12, 실패 3`. 확인 뒤 새로고침한다.
- [x] **Step 4: 커밋**

```bash
git add script.js IMPL-PLAN.md PRD.md
git commit -m "feat: index.html?test 자체 점검에 2단계 항목 3개 추가"
```

---

### Task 13: 2단계 완료 확인

**Files:** 없음(확인만 한다. 문제가 나오면 해당 Task로 돌아가 고친다)

- [ ] **Step 1: 자동 검사** — `tests.html`을 연다. Expected: "전부 통과". `index.html?test`를 연다. Expected: 콘솔 마지막 줄이 `자체 점검 결과: 통과 15, 실패 0`.
- [ ] **Step 2: 2단계 브라우저 확인 항목** — 사용자가 전부 직접 해 보고 체크한다.
- [ ] **Step 3: 1단계 브라우저 확인 항목 다시 확인** — 모드 선택이 생겼으므로 "시작 화면에 카테고리 4개와 '순위표에 기록되지 않음'이 보인다"는 연습 모드가 선택된 상태에서 확인한다. 나머지는 연습 모드로 확인한다.
- [ ] **Step 4: 사용자에게 2단계 완료를 보고하고 3단계로 갈지 확인받는다**

---

# 3단계: 점수 저장과 순위표

**만들 것**
- `leaderboardKey`, `addRecord`(순수 함수)
- 순위표 화면(`showLeaderboard`)과 시작 화면의 [순위표] 버튼
- 스피드, 힌트 결과 화면의 이름 입력과 localStorage 저장(`saveRecord`)

**완료 기준**
- `tests.html`이 "전부 통과"를 보여 준다. 여기에는 다음 테스트가 포함된다.
  - `addRecord`: 점수 높은 순으로 정렬하고, 동점이면 먼저 세운 기록이 위에 오며, 6번째 기록은 잘리고, 원래 배열은 바뀌지 않는다.
  - `leaderboardKey("speed", "history")`가 `"quiz.leaderboard.speed.history"`를 돌려준다.
- 아래 브라우저 확인 항목을 전부 통과하고, 1, 2단계 브라우저 확인 항목도 다시 통과한다.

**브라우저에서 직접 확인할 항목** (PRD 7.2.3)
- [ ] 스피드, 힌트 결과에만 이름 입력칸과 [순위표에 저장]이 있고, 연습 결과에는 없다.
- [ ] 이름을 비우거나 공백만 넣고 저장하면 "이름을 입력해 주세요."가 나온다. 11자 이상은 입력되지 않는다.
- [ ] 저장하면 순위표로 이동하고, 해당 모드와 카테고리 표가 선택된 채 기록이 보인다.
- [ ] 같은 판에서 다시 저장할 수 없다.
- [ ] 새로고침하거나 브라우저를 닫았다 다시 열어도 기록이 남아 있다.
- [ ] 같은 표에 6번 저장하면 5개만 남고, 가장 낮은 점수가 빠진다.
- [ ] 동점이면 먼저 저장한 기록이 위에 있다.
- [ ] 다른 모드나 카테고리 표에는 기록이 섞이지 않는다.
- [ ] 빈 표에는 "아직 기록이 없습니다."가 나온다.
- [ ] 시작 화면의 [순위표] 버튼으로도 들어갈 수 있다.

---

### Task 14: 순위표 순수 함수

**Files:**
- Modify: `script.js` (`pickHintRemovals` 아래에 추가)
- Test: `tests.html`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `LEADERBOARD_SIZE = 5`
  - `leaderboardKey(mode: "speed"|"hint", categoryId: string): string` — `quiz.leaderboard.<mode>.<categoryId>`
  - `addRecord(records: Record[], record: Record): Record[]` — 새 배열을 돌려준다. 원래 배열은 바꾸지 않는다.
  - `Record = { name: string, score: number, date: string /* ISO, new Date().toISOString() */ }`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests.html`의 `// ===== 테스트 끝 =====` 줄 바로 위에 추가한다.

```js
    function makeRecord(name, score, date) {
      return { name, score, date };
    }

    test("leaderboardKey: 모드와 카테고리로 키를 만든다", () => {
      assertEqual(leaderboardKey("speed", "history"), "quiz.leaderboard.speed.history");
      assertEqual(leaderboardKey("hint", "culture"), "quiz.leaderboard.hint.culture");
    });

    test("addRecord: 빈 목록에 기록 하나를 넣는다", () => {
      const record = makeRecord("가", 7, "2026-10-01T00:00:00.000Z");
      assertEqual(addRecord([], record), [record]);
    });

    test("addRecord: 점수 높은 순으로 정렬한다", () => {
      const records = [
        makeRecord("가", 9, "2026-10-01T00:00:00.000Z"),
        makeRecord("나", 5, "2026-10-02T00:00:00.000Z"),
      ];
      const result = addRecord(records, makeRecord("다", 7.5, "2026-10-03T00:00:00.000Z"));
      assertEqual(result.map((r) => r.name), ["가", "다", "나"]);
    });

    test("addRecord: 동점이면 먼저 세운 기록이 위에 온다", () => {
      const records = [makeRecord("먼저", 7, "2026-10-01T00:00:00.000Z")];
      const result = addRecord(records, makeRecord("나중", 7, "2026-10-02T00:00:00.000Z"));
      assertEqual(result.map((r) => r.name), ["먼저", "나중"]);
    });

    test("addRecord: 상위 5개만 남기고 가장 낮은 점수를 뺀다", () => {
      const records = [
        makeRecord("가", 10, "2026-10-01T00:00:00.000Z"),
        makeRecord("나", 9, "2026-10-01T00:00:01.000Z"),
        makeRecord("다", 8, "2026-10-01T00:00:02.000Z"),
        makeRecord("라", 7, "2026-10-01T00:00:03.000Z"),
        makeRecord("마", 6, "2026-10-01T00:00:04.000Z"),
      ];
      const result = addRecord(records, makeRecord("바", 6.5, "2026-10-02T00:00:00.000Z"));
      assertEqual(result.map((r) => r.name), ["가", "나", "다", "라", "바"]);
    });

    test("addRecord: 원래 배열은 바꾸지 않는다", () => {
      const records = [makeRecord("가", 5, "2026-10-01T00:00:00.000Z")];
      addRecord(records, makeRecord("나", 9, "2026-10-02T00:00:00.000Z"));
      assertEqual(records.map((r) => r.name), ["가"]);
    });
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

`tests.html`을 새로고침한다.
Expected: "6개 실패", 각 줄에 `leaderboardKey is not defined` 또는 `addRecord is not defined`.

- [ ] **Step 3: 최소 구현 작성**

`script.js`의 `pickHintRemovals` 함수 아래(`// ===== 상태 =====` 위)에 추가한다.

```js
const LEADERBOARD_SIZE = 5;

function leaderboardKey(mode, categoryId) {
  return `quiz.leaderboard.${mode}.${categoryId}`;
}

function addRecord(records, record) {
  return [...records, record]
    .sort((a, b) => b.score - a.score || a.date.localeCompare(b.date))
    .slice(0, LEADERBOARD_SIZE);
}
```

`date`는 ISO 문자열이라 문자열 비교가 곧 시간 순서다. `[...records, record]`로 복사한 뒤 정렬하므로 원래 배열은 바뀌지 않는다.

- [ ] **Step 4: 테스트가 통과하는지 확인**

`tests.html`을 새로고침한다.
Expected: "전부 통과".

- [ ] **Step 5: 커밋**

```bash
git add script.js tests.html
git commit -m "feat: 순위표 키와 기록 정렬 함수 추가"
```

---

### Task 15: 순위표 화면

**Files:**
- Modify: `script.js` (`readRecords`, `showLeaderboard` 추가, `showStart` 일부 수정)
- Modify: `style.css` (끝에 추가)

**Interfaces:**
- Consumes: `leaderboardKey`, `formatScore`, `MODE_NAMES`, `CATEGORIES`, `el`, `button`, `render`, `categoryName`
- Produces:
  - `readRecords(mode, categoryId): Record[]` — localStorage에서 읽는다. 값이 없으면 `[]`. 읽기에 실패하면 예외를 던진다(부르는 쪽이 처리한다).
  - `showLeaderboard(mode = "speed", categoryId = CATEGORIES[0].id)`

- [ ] **Step 1: `readRecords`, `showLeaderboard` 추가**

`script.js`의 `if (app) showStart();` 줄 바로 위에 추가한다.

```js
function readRecords(mode, categoryId) {
  return JSON.parse(localStorage.getItem(leaderboardKey(mode, categoryId))) || [];
}

function showLeaderboard(mode = "speed", categoryId = CATEGORIES[0].id) {
  const modeButtons = el("div", undefined, "modes");
  for (const m of ["speed", "hint"]) {
    const className = m === mode ? "mode selected" : "mode";
    modeButtons.append(button(MODE_NAMES[m], () => showLeaderboard(m, categoryId), className));
  }

  const categoryButtons = el("div", undefined, "categories");
  for (const category of CATEGORIES) {
    const className = category.id === categoryId ? "selected" : undefined;
    categoryButtons.append(button(category.name, () => showLeaderboard(mode, category.id), className));
  }

  let records;
  try {
    records = readRecords(mode, categoryId);
  } catch {
    records = [];
  }

  const nodes = [
    el("h1", "순위표"),
    modeButtons,
    categoryButtons,
    el("h2", `${MODE_NAMES[mode]}, ${categoryName(categoryId)}`),
  ];
  if (records.length === 0) {
    nodes.push(el("p", "아직 기록이 없습니다."));
  } else {
    const table = el("table");
    const head = el("tr");
    for (const title of ["순위", "이름", "점수", "날짜"]) head.append(el("th", title));
    table.append(head);
    records.forEach((record, i) => {
      const row = el("tr");
      row.append(
        el("td", String(i + 1)),
        el("td", record.name),
        el("td", formatScore(record.score)),
        el("td", new Date(record.date).toLocaleDateString("ko-KR")),
      );
      table.append(row);
    });
    nodes.push(table);
  }
  nodes.push(button("처음으로", showStart));
  render(...nodes);
}
```

이름은 `textContent`로 넣으므로 사용자가 `<b>` 같은 글자를 입력해도 태그로 해석되지 않는다.

- [ ] **Step 2: 시작 화면에 [순위표] 버튼 추가**

`showStart` 함수에서 이 줄을

```js
  nodes.push(el("h2", "카테고리를 고르세요"), categoryButtons);
```

아래로 바꾼다.

```js
  nodes.push(
    el("h2", "카테고리를 고르세요"),
    categoryButtons,
    button("순위표", () => showLeaderboard()),
  );
```

화살표 함수로 감싸야 클릭 이벤트 객체가 `mode` 인자로 넘어가지 않는다.

- [ ] **Step 3: 스타일 추가**

`style.css` 끝에 추가한다.

```css
.categories .selected {
  background: #222;
  color: #fff;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  margin: 12px 0;
}

th,
td {
  padding: 8px;
  border-bottom: 1px solid #ddd;
  text-align: left;
}
```

- [ ] **Step 4: 브라우저 확인**

`index.html`을 연다.
1. [순위표]를 누른다. Expected: 스피드, 한국사가 선택돼 있고 "아직 기록이 없습니다."가 보인다.
2. 개발자 도구 콘솔에 다음을 입력하고, 순위표에서 힌트, 과학을 고른다.
   ```js
   localStorage.setItem("quiz.leaderboard.hint.science", JSON.stringify([{ name: "테스트", score: 8.5, date: new Date().toISOString() }]))
   ```
   Expected: 1위 "테스트", 8.5, 오늘 날짜가 보인다. 스피드, 과학으로 바꾸면 "아직 기록이 없습니다."가 보인다.
3. 확인이 끝나면 콘솔에서 `localStorage.removeItem("quiz.leaderboard.hint.science")`로 지운다.
4. `tests.html`은 여전히 "전부 통과"다.

- [ ] **Step 5: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 순위표 화면과 시작 화면 버튼 추가"
```

---

### Task 16: 결과 저장

**Files:**
- Modify: `script.js` (`saveForm`, `saveRecord` 추가, `showResult` 일부 수정)
- Modify: `style.css` (끝에 추가)

**Interfaces:**
- Consumes: `readRecords`, `addRecord`, `leaderboardKey`, `showLeaderboard`(Task 14, 15), `state.mode`, `state.categoryId`, `state.score`
- Produces: `saveForm(): HTMLFormElement`, `saveRecord(rawName, saveButton, message)`

- [ ] **Step 1: `saveForm`, `saveRecord` 추가**

`script.js`의 `function readRecords` 바로 위에 추가한다.

```js
function saveForm() {
  const form = el("form", undefined, "save-form");
  const input = el("input");
  input.maxLength = 10;
  input.placeholder = "이름(10자까지)";
  const saveButton = el("button", "순위표에 저장");
  saveButton.type = "submit";
  const message = el("p", undefined, "form-message");
  form.append(input, saveButton, message);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveRecord(input.value, saveButton, message);
  });
  return form;
}

function saveRecord(rawName, saveButton, message) {
  const name = rawName.trim();
  if (name === "") {
    message.textContent = "이름을 입력해 주세요.";
    return;
  }
  const record = { name, score: state.score, date: new Date().toISOString() };
  try {
    const records = addRecord(readRecords(state.mode, state.categoryId), record);
    localStorage.setItem(leaderboardKey(state.mode, state.categoryId), JSON.stringify(records));
  } catch {
    message.textContent = "기록을 저장하지 못했습니다.";
    return;
  }
  saveButton.disabled = true;
  showLeaderboard(state.mode, state.categoryId);
}
```

`<form>`의 submit 이벤트를 쓰므로 입력칸에서 Enter를 눌러도 저장된다. `maxLength = 10`이 11자 이상 입력을 막고, 앞뒤 공백을 뺀 이름은 항상 1~10자다.

- [ ] **Step 2: 스피드, 힌트 결과 화면에 저장 폼 표시**

`showResult` 함수에서 이 줄을

```js
  nodes.push(button("처음으로", showStart));
```

아래로 바꾼다.

```js
  if (state.mode !== "practice") nodes.push(saveForm());
  nodes.push(button("처음으로", showStart));
```

- [ ] **Step 3: 스타일 추가**

`style.css` 끝에 추가한다.

```css
.save-form {
  margin: 12px 0;
}

.save-form input {
  font: inherit;
  padding: 10px;
  border: 1px solid #bbb;
  border-radius: 8px;
}

.form-message {
  color: #c62828;
}
```

- [ ] **Step 4: 브라우저 확인**

`index.html`을 열어 3단계 브라우저 확인 항목 10개를 해 본다.
Expected: 전부 통과. "같은 표에 6번 저장" 항목은 스피드 모드로 같은 카테고리를 6판 풀어 점수가 서로 다르게 나오도록 하고, 동점 항목은 같은 점수를 두 번 만들어 이름으로 순서를 확인한다. 저장된 값은 개발자 도구의 Application > Local Storage에서 `quiz.leaderboard.speed.<카테고리 id>` 키로도 볼 수 있다.

- [ ] **Step 5: 커밋**

```bash
git add script.js style.css
git commit -m "feat: 스피드, 힌트 결과를 순위표에 저장"
```

---

### Task 17: 3단계 완료 확인

**Files:** 없음(확인만 한다. 문제가 나오면 해당 Task로 돌아가 고친다)

- [ ] **Step 1: 자동 검사** — `tests.html`을 연다. Expected: "전부 통과".
- [ ] **Step 2: 3단계 브라우저 확인 항목** — 사용자가 전부 직접 해 보고 체크한다.
- [ ] **Step 3: 1, 2단계 브라우저 확인 항목 다시 확인** — 특히 연습 결과 화면에 저장 폼이 없고, 스피드 타이머가 저장이나 순위표 이동 뒤에도 남아 있지 않은지 본다.
- [ ] **Step 4: 마무리 확인** — 앱 파일이 `index.html`, `style.css`, `script.js`, `questions.js` 4개이고, 그 밖에는 개발용 `tests.html`과 문서(`PRD.md`, `IMPL-PLAN.md`)만 있는지 확인한다. 사용자에게 완료를 보고한다.
