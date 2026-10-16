---
description: questions.js의 문항을 CLAUDE.md의 문항 작성 규칙으로 점검한다 (파일은 고치지 않음)
argument-hint: [카테고리 이름이나 id, 또는 문항 번호(예: history-3). 비우면 전체 문항]
allowed-tools: Read, Grep, Glob, Bash(node:*)
---
<!-- 생성: 2026-10-16 11:40 KST -->

# 문항 점검

`questions.js`의 문항을 `CLAUDE.md`의 "문항 작성 규칙"으로 점검하고 결과를 보고한다.
**점검만 한다. 어떤 파일도 고치지 않는다.** 고칠 문항이 있어도 보고만 하고 멈춘다.

## 대상

인수: `$ARGUMENTS`

- 비어 있으면 `questions.js`에 있는 문항 전부를 점검한다.
- 카테고리 이름(예: `한국사`)이나 id(예: `history`)면 그 카테고리의 문항만 점검한다.
- `history-3`처럼 "카테고리 id-번호"면 그 문항 하나만 점검한다. 번호는 카테고리 안에서 1부터 센다.
- 알아볼 수 없는 인수면 점검하지 말고, 쓸 수 있는 카테고리 이름과 id를 알려 준다.

## 절차

### 1. 규칙 읽기

`CLAUDE.md`의 "문항 작성 규칙"을 읽는다. 규칙은 이 파일에 옮겨 적지 않고 매번 `CLAUDE.md`에서 읽는다.
`CLAUDE.md`가 가리키는 `PRD.md` 4.2, 4.3(해설과 출처 형식)도 읽는다.

### 2. 기계로 거를 수 있는 항목 먼저 뽑기

저장소 루트에서 아래 명령을 실행한다. 문항마다 한 줄씩 의심 항목을 출력한다. `-`는 걸린 것이 없다는 뜻이다.

```bash
node - <<'EOF'
const fs = require("fs");
const vm = require("vm");
const { CATEGORIES, QUESTIONS } = vm.runInNewContext(
  fs.readFileSync("questions.js", "utf8") + ";({ CATEGORIES, QUESTIONS })"
);
const negative = /(아닌|않은|않는|없는|틀린|아니다)/;
const superlative = /(가장|최초|최대|최고|최소|최장|제일|처음으로)/;
const allOrNone = /(모두 맞음|모두 정답|위의 어느|정답 없음|해당 없음)/;
for (const category of CATEGORIES) {
  (QUESTIONS[category.id] || []).forEach((q, i) => {
    const flags = [];
    if (q.choices.length !== 4) flags.push(`보기 수 ${q.choices.length}`);
    if (new Set(q.choices).size !== q.choices.length) flags.push("보기 중복(규칙 3)");
    if (negative.test(q.question)) flags.push("부정 표현 의심(규칙 9)");
    if (superlative.test(q.question)) flags.push("최상급 표현, 기준과 시점 확인(규칙 2)");
    if (q.choices.some((c) => allOrNone.test(c))) flags.push("모두/없음 꼴 보기(규칙 10)");
    const lengths = q.choices.map((c) => c.length);
    const max = Math.max(...lengths);
    const min = Math.min(...lengths);
    if (max >= 2 * min && max - min >= 3) flags.push(`보기 길이 편차 ${lengths.join("/")}(규칙 8)`);
    const sentences = q.explanation.split(/(?<=[.?!])\s+/).filter(Boolean).length;
    if (sentences !== 1) flags.push(`해설 문장 수 ${sentences}(PRD 4.2)`);
    console.log(`${category.id}-${i + 1}\t${flags.join(", ") || "-"}`);
  });
}
console.log("문항 수: " + CATEGORIES.map((c) => `${c.id} ${(QUESTIONS[c.id] || []).length}`).join(", "));
EOF
```

이 결과는 의심 목록일 뿐이다. 걸린 항목도 3단계에서 문항을 읽고 실제로 규칙을 어겼는지 판단한다.

### 3. 문항을 읽고 판단하기

대상 문항을 하나씩 읽고 규칙마다 판단한다. 특히 기계로 거를 수 없는 다음을 본다.

- 정답이 하나뿐인지, 다른 보기가 어떤 기준으로든 정답이 될 여지가 없는지
- 최상급 표현이 있으면 기준과 시점이 문제 문장에 있는지
- 문제 문장이 문법에 맞고 자연스러운지
- 해설이 `choices[answer]`를 뒷받침하는지(정답 번호와 해설이 맞는지)
- 오답 3개가 정답과 같은 유형이고, 모르는 사람에게 답이 될 법한지
- 보기 4개의 길이와 형식(띄어쓰기, 표기 방식 포함)이 비슷한지

**규칙 4(출처 2곳 이상 확인)는 판정하지 않는다.** `questions.js`에는 출처가 하나씩만 적혀 있어서, 파일만으로는 두 곳에서 대조했는지 알 수 없다. 억지로 통과로 적지 말고 판정하지 않았다고 보고에 밝힌다.

## 보고 형식

1. 어긋난 문항을 표로 보여 준다. 어긋난 문항이 없으면 "어긋난 문항 없음"이라고 적는다.

   | 문항 | 문제(앞부분) | 어긴 규칙 | 근거 |
   |---|---|---|---|
   | history-5 | 고려 광종이 958년… | 7 | 오답이 모두 … |

   - "어긴 규칙"에는 `CLAUDE.md`의 규칙 번호를 적는다. 여러 개면 쉼표로 잇는다.
   - "근거"에는 무엇이 왜 어긋났는지 한 문장으로 적는다.

2. 규칙 위반은 아니지만 눈에 띄는 점이 있으면 표 아래 "참고"에 따로 적는다. 표에 섞지 않는다.

3. 마지막에 요약을 적는다.
   - 점검한 문항 수(카테고리별), 어긋난 문항 수
   - 판정하지 않은 규칙: 규칙 4와 그 이유
</content>
</invoke>
