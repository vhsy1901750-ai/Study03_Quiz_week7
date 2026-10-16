// 생성: 2026-10-07 22:53 KST

// ===== 순수 함수 =====

function scoreFor(isCorrect, usedHint) {
  if (!isCorrect) return 0;
  return usedHint ? 0.5 : 1;
}

function formatScore(score) {
  return String(score);
}

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
      if (typeof item.url !== "string" || !item.url.startsWith("https://")) {
        errors.push(`${where}: url이 https://로 시작하지 않습니다.`);
      }
    });
  }
  return errors;
}

function pickHintRemovals(answer, random = Math.random) {
  const wrong = [0, 1, 2, 3].filter((i) => i !== answer);
  const keep = Math.floor(random() * wrong.length);
  return wrong.filter((_, i) => i !== keep);
}

// ===== 상태 =====

const MODE_NAMES = { practice: "연습", speed: "스피드", hint: "힌트" };
const NOT_RECORDED = "순위표에 기록되지 않음";
const MODE_DESCRIPTIONS = {
  practice: "시간 제한과 힌트 없이 풉니다. 맞히면 1점입니다.",
  speed: "문항마다 15초 안에 답합니다. 시간이 지나면 오답입니다.",
  hint: "문항마다 힌트를 1번 써서 오답 2개를 지울 수 있습니다. 힌트를 쓰고 맞히면 0.5점입니다.",
};

const state = {
  mode: "practice",
  categoryId: null,
  queue: [],
  position: 0,
  score: 0,
  wrongIndices: [],
  answers: [],
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

function sourceLine(item) {
  const line = el("p", "출처: ", "source");
  const link = el("a", item.source);
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  line.append(link);
  return line;
}

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
    el("p", "학번 2601939 이름 박윤진"),
    el("h1", "상식 퀴즈"),
    el("h2", "모드를 고르세요"),
    modeButtons,
    el("p", MODE_DESCRIPTIONS[state.mode]),
  ];
  if (state.mode === "practice") nodes.push(el("p", NOT_RECORDED, "notice"));
  nodes.push(el("h2", "카테고리를 고르세요"), categoryButtons);
  render(...nodes);
}

function startGame(mode, categoryId) {
  stopTimer();
  state.mode = mode;
  state.categoryId = categoryId;
  state.queue = QUESTIONS[categoryId].map((_, i) => i);
  state.position = 0;
  state.score = 0;
  state.wrongIndices = [];
  state.answers = [];
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
    state.isRetry ? el("span", "다시 풀기", "retry-label") : scoreNode,
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
  if (state.mode === "speed") {
    const timer = el("p", undefined, "timer");
    timer.id = "timer";
    status.after(timer);
    startTimer();
  }
  if (state.mode === "hint") {
    const hint = button("힌트", useHint, "hint");
    hint.id = "hint";
    choices.after(hint);
  }
}

function handleAnswer(choiceIndex) {
  stopTimer();
  const item = currentQuestion();
  const isCorrect = choiceIndex === item.answer;
  if (state.isRetry) {
    if (isCorrect) state.retryCorrect++;
  } else {
    state.score += scoreFor(isCorrect, state.hintUsed);
    document.getElementById("score").textContent = `점수 ${formatScore(state.score)}`;
  }
  if (!isCorrect) state.wrongIndices.push(state.queue[state.position]);
  state.answers.push({ index: state.queue[state.position], choiceIndex, usedHint: state.hintUsed });

  for (const node of app.querySelectorAll(".choice")) {
    node.disabled = true;
    const index = Number(node.dataset.index);
    if (index === item.answer) node.classList.add("correct");
    else if (index === choiceIndex) node.classList.add("wrong");
  }
  const hint = document.getElementById("hint");
  if (hint) hint.disabled = true;

  let message = "오답입니다.";
  if (isCorrect) message = "정답입니다.";
  else if (choiceIndex === null) message = "시간 초과입니다.";
  const isLast = state.position === state.queue.length - 1;
  document.getElementById("feedback").append(
    el("p", message, isCorrect ? "result-correct" : "result-wrong"),
    el("p", item.explanation),
    sourceLine(item),
    button(isLast ? "결과 보기" : "다음", nextQuestion),
  );
}

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

function startRetry() {
  state.queue = state.wrongIndices;
  state.wrongIndices = [];
  state.answers = [];
  state.position = 0;
  state.isRetry = true;
  state.retryCorrect = 0;
  showQuestion();
}

function nextQuestion() {
  if (state.position === state.queue.length - 1) {
    showResult();
    return;
  }
  state.position++;
  showQuestion();
}

function reviewList() {
  const list = el("ul", undefined, "review");
  for (const answer of state.answers) {
    const item = QUESTIONS[state.categoryId][answer.index];
    const isCorrect = answer.choiceIndex === item.answer;
    const row = el("li", undefined, isCorrect ? "review-correct" : "review-wrong");
    const question = el("p", undefined, "review-question");
    question.append(el("span", isCorrect ? "✔" : "✘", "review-mark"), ` ${answer.index + 1}. ${item.question}`);
    const myAnswer = answer.choiceIndex === null ? "시간 초과" : item.choices[answer.choiceIndex];
    let detail = `내 답: ${myAnswer}`;
    if (isCorrect && answer.usedHint) detail += " (힌트 사용, 0.5점)";
    if (!isCorrect) detail += `, 정답: ${item.choices[item.answer]}`;
    row.append(question, el("p", detail, "review-detail"));
    list.append(row);
  }
  return list;
}

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

// ===== 자체 점검 (index.html?test) =====

function check(condition, reason) {
  if (!condition) throw new Error(reason);
}

function choiceButton(index) {
  return app.querySelector(`.choice[data-index="${index}"]`);
}

function feedbackTexts() {
  return [...app.querySelectorAll("#feedback p")].map((p) => p.textContent);
}

function answerAndNext(choiceIndex) {
  choiceButton(choiceIndex).click();
  app.querySelector("#feedback button").click();
}

function buttonByText(text) {
  return [...app.querySelectorAll("button")].find((node) => node.textContent === text);
}

const SELF_CHECKS = [
  ["문항 데이터가 형식 규칙을 지킨다", () => {
    const errors = validateQuestions(CATEGORIES, QUESTIONS);
    check(errors.length === 0, errors.join(" "));
  }],
  ["시작 화면에 카테고리 버튼 4개가 있다", () => {
    showStart();
    check(app.querySelectorAll(".categories button").length === 4, "카테고리 버튼이 4개가 아님");
  }],
  ["시작 화면에 \"순위표에 기록되지 않음\"이 있다", () => {
    showStart();
    check(app.textContent.includes(NOT_RECORDED), "안내 문구가 없음");
  }],
  ["카테고리를 누르면 \"1 / 10\"과 보기 4개가 나온다", () => {
    showStart();
    app.querySelector(".categories button").click();
    check(app.querySelector(".status").textContent.includes("1 / 10"), "진행 표시가 1 / 10이 아님");
    check(app.querySelectorAll(".choice").length === 4, "보기가 4개가 아님");
  }],
  ["정답을 고르면 초록 표시, \"정답입니다.\", 점수 1점 증가", () => {
    startGame("practice", "history");
    const answer = currentQuestion().answer;
    choiceButton(answer).click();
    check(choiceButton(answer).classList.contains("correct"), "정답 보기가 초록으로 표시되지 않음");
    check(feedbackTexts()[0] === "정답입니다.", "정답 문구가 다름");
    check(document.getElementById("score").textContent === "점수 1", "점수가 1이 아님");
  }],
  ["오답을 고르면 고른 보기는 빨강, 정답은 초록, \"오답입니다.\", 점수 그대로", () => {
    startGame("practice", "history");
    const answer = currentQuestion().answer;
    const wrong = (answer + 1) % 4;
    choiceButton(wrong).click();
    check(choiceButton(wrong).classList.contains("wrong"), "고른 오답이 빨강으로 표시되지 않음");
    check(choiceButton(answer).classList.contains("correct"), "정답 보기가 초록으로 표시되지 않음");
    check(feedbackTexts()[0] === "오답입니다.", "오답 문구가 다름");
    check(document.getElementById("score").textContent === "점수 0", "점수가 0이 아님");
  }],
  ["답한 뒤에는 보기 4개가 모두 잠긴다", () => {
    startGame("practice", "history");
    choiceButton(0).click();
    check([...app.querySelectorAll(".choice")].every((node) => node.disabled), "잠기지 않은 보기가 있음");
    choiceButton(1).click();
    check(state.answers.length === 1 && feedbackTexts().length === 3, "잠긴 보기를 누르자 답이 바뀜");
  }],
  ["맞혔을 때와 틀렸을 때 모두 해설 한 줄과 새 탭 출처 링크가 나온다", () => {
    for (const pickWrong of [false, true]) {
      startGame("practice", "history");
      const item = currentQuestion();
      choiceButton(pickWrong ? (item.answer + 1) % 4 : item.answer).click();
      const link = app.querySelector("#feedback .source a");
      const when = pickWrong ? "틀렸을 때" : "맞혔을 때";
      check(feedbackTexts()[1] === item.explanation, `${when} 해설이 없거나 다름`);
      check(link && link.href === item.url && link.href.startsWith("https://"), `${when} 출처 링크가 없거나 주소가 다름`);
      check(link.target === "_blank", `${when} 출처 링크가 새 탭으로 열리지 않음`);
    }
  }],
  ["10번째 문항에서 버튼이 [결과 보기]로 바뀐다", () => {
    startGame("practice", "history");
    for (let n = 1; n <= 10; n++) {
      choiceButton(currentQuestion().answer).click();
      const label = app.querySelector("#feedback button").textContent;
      check(label === (n === 10 ? "결과 보기" : "다음"), `${n}번째 문항의 버튼이 "${label}"임`);
      app.querySelector("#feedback button").click();
    }
  }],
  ["결과 화면에 \"x / 10\"과 \"순위표에 기록되지 않음\"이 나온다", () => {
    startGame("practice", "history");
    while (app.querySelector(".choice")) answerAndNext(currentQuestion().answer);
    check(app.querySelector(".final-score").textContent === "10 / 10", "점수 표시가 10 / 10이 아님");
    check(app.textContent.includes(NOT_RECORDED), "안내 문구가 없음");
  }],
  ["문항별 결과 목록의 ✔/✘와 정답 표시가 실제 답과 일치한다", () => {
    const wrongAt = [2, 5, 9];
    startGame("practice", "history");
    for (let n = 1; app.querySelector(".choice"); n++) {
      const answer = currentQuestion().answer;
      answerAndNext(wrongAt.includes(n) ? (answer + 1) % 4 : answer);
    }
    const rows = [...app.querySelectorAll(".review li")];
    check(rows.length === 10, `목록이 ${rows.length}개임`);
    rows.forEach((row, i) => {
      const wrong = wrongAt.includes(i + 1);
      check(row.className === (wrong ? "review-wrong" : "review-correct"), `${i + 1}번 표시가 다름`);
      check(row.textContent.includes(wrong ? "✘" : "✔"), `${i + 1}번 기호가 다름`);
      check(row.textContent.includes("정답:") === wrong, `${i + 1}번 정답 표시가 다름`);
    });
    check(app.querySelector(".final-score").textContent === "7 / 10", "점수 표시가 7 / 10이 아님");
  }],
  ["카테고리 4개 모두 10문항씩 끝까지 진행되고 가로 스크롤이 없다", () => {
    const page = document.documentElement;
    for (const category of CATEGORIES) {
      startGame("practice", category.id);
      let count = 0;
      while (app.querySelector(".choice")) {
        count++;
        choiceButton(currentQuestion().answer).click();
        check(page.scrollWidth <= page.clientWidth, `${category.name} ${count}번에서 가로 스크롤이 생김`);
        app.querySelector("#feedback button").click();
      }
      check(count === 10, `${category.name} 문항이 ${count}개임`);
      check(page.scrollWidth <= page.clientWidth, `${category.name} 결과 화면에서 가로 스크롤이 생김`);
    }
  }],
  ["스피드: 15초에서 시작하고, 답하면 타이머가 멈추고, 시간 초과는 0점이다", () => {
    startGame("speed", "history");
    check(document.getElementById("timer").textContent === "남은 시간 15초", "남은 시간이 15초에서 시작하지 않음");
    check(state.timerId !== null, "타이머가 돌고 있지 않음");
    choiceButton(currentQuestion().answer).click();
    check(state.timerId === null, "답한 뒤에도 타이머가 멈추지 않음");
    app.querySelector("#feedback button").click();
    check(document.getElementById("timer").textContent === "남은 시간 15초", "다음 문항에서 15초부터 다시 세지 않음");
    // 15초를 기다리지 않고, 타이머가 0에서 부르는 handleAnswer(null)을 직접 부른다.
    handleAnswer(null);
    check(feedbackTexts()[0] === "시간 초과입니다.", "시간 초과 문구가 다름");
    check(choiceButton(currentQuestion().answer).classList.contains("correct"), "정답 보기가 초록으로 표시되지 않음");
    check(document.getElementById("score").textContent === "점수 1", "시간 초과에 점수가 바뀜");
    check(state.timerId === null, "시간 초과 뒤에도 타이머가 멈추지 않음");
  }],
  ["힌트: 오답 2개가 잠기고, 힌트를 쓰고 맞히면 0.5점이며 결과 목록에 표시된다", () => {
    startGame("hint", "history");
    const answer = currentQuestion().answer;
    document.getElementById("hint").click();
    const removed = [...app.querySelectorAll(".choice.removed")];
    check(removed.length === 2 && removed.every((node) => node.disabled), "잠긴 오답이 2개가 아님");
    check(!choiceButton(answer).disabled, "정답 보기가 잠김");
    check(document.getElementById("hint").disabled, "힌트 버튼이 꺼지지 않음");
    choiceButton(answer).click();
    check(document.getElementById("score").textContent === "점수 0.5", "점수가 0.5가 아님");
    app.querySelector("#feedback button").click();
    check(!document.getElementById("hint").disabled, "다음 문항에서 힌트를 쓸 수 없음");
    while (app.querySelector(".choice")) answerAndNext(currentQuestion().answer);
    check(app.querySelector(".final-score").textContent === "9.5 / 10", "점수 표시가 9.5 / 10이 아님");
    const details = [...app.querySelectorAll(".review-detail")].map((p) => p.textContent);
    check(details[0].endsWith("(힌트 사용, 0.5점)"), "1번에 힌트 사용 표시가 없음");
    check(!details[1].includes("힌트 사용"), "힌트를 쓰지 않은 2번에 힌트 사용 표시가 있음");
  }],
  ["다시 풀기: 틀린 문항만 다시 나오고 처음 점수는 그대로이며, 스피드와 힌트 결과에는 버튼이 없다", () => {
    for (const mode of ["speed", "hint"]) {
      startGame(mode, "history");
      answerAndNext((currentQuestion().answer + 1) % 4);
      while (app.querySelector(".choice")) answerAndNext(currentQuestion().answer);
      check(!buttonByText("틀린 문제 다시 풀기"), `${MODE_NAMES[mode]} 결과에 다시 풀기 버튼이 있음`);
    }
    const wrongAt = [2, 5, 9];
    startGame("practice", "history");
    for (let n = 1; app.querySelector(".choice"); n++) {
      const answer = currentQuestion().answer;
      answerAndNext(wrongAt.includes(n) ? (answer + 1) % 4 : answer);
    }
    buttonByText("틀린 문제 다시 풀기").click();
    const seen = [];
    while (app.querySelector(".choice")) {
      check(app.querySelector(".status").textContent.includes("다시 풀기"), "다시 풀기 표시가 없음");
      seen.push(state.queue[state.position] + 1);
      answerAndNext(currentQuestion().answer);
    }
    check(seen.join() === wrongAt.join(), `다시 나온 문항이 ${seen.join(", ")}번임`);
    check(app.querySelector(".final-score").textContent === "다시 풀기 3문제 중 3문제 정답", "다시 풀기 결과 문구가 다름");
    check(app.textContent.includes("처음 점수 7 / 10"), "처음 점수가 7 / 10이 아님");
    check(!buttonByText("틀린 문제 다시 풀기"), "다 맞혔는데 다시 풀기 버튼이 있음");
  }],
];

function runSelfCheck() {
  let passed = 0;
  let failed = 0;
  for (const [name, run] of SELF_CHECKS) {
    try {
      run();
      passed++;
      console.log(`통과: ${name}`);
    } catch (error) {
      failed++;
      console.error(`실패: ${name} (${error.message})`);
    }
  }
  showStart();
  console.log(`자체 점검 결과: 통과 ${passed}, 실패 ${failed}`);
}

if (app) showStart();
if (app && new URLSearchParams(location.search).has("test")) runSelfCheck();
