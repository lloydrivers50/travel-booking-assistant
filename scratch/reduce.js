// reduce kata — run: node reduce.js
// Fill in each function body. Run after each one; watch FAIL turn to PASS.
// The whole point: the accumulator can be ANY type — a number, an object,
// an array of arrays, even a function. Each rung changes what `acc` is.
//
// Type NOTHING from me. If you stall, ask — I'll give a question, not the answer.

// ── 1. sum: numbers -> one number ───────────────────────────────────────────
// [1, 2, 3, 4] -> 10
function total(nums) {
  // TODO

  return nums.reduce((accumulator, currentValue) => {
    return accumulator + currentValue;
  }, 0);
}

// ── 2. tally: values -> count of each (this is the ticket's summary) ─────────
// ['heading','paragraph','table','paragraph'] -> { heading: 1, paragraph: 2, table: 1 }
function tally(values) {
  // TODO
  return values.reduce((accumulator, currentValue) => {
    if (!accumulator[currentValue]) {
      accumulator[currentValue] = 1;
    } else {
      accumulator[currentValue]++;
    }

    return accumulator;
  }, {});
}

// ── 3. groupBy: objects -> arrays bucketed by .type ─────────────────────────
// [{type:'a',n:1},{type:'b',n:2},{type:'a',n:3}]
//   -> { a: [{type:'a',n:1},{type:'a',n:3}], b: [{type:'b',n:2}] }
function groupByType(items) {
  return items.reduce((accumulator, currentValue) => {
    if (!accumulator[currentValue.type]) {
      accumulator[currentValue.type] = [];
      console.log("pushing");
      accumulator[currentValue.type].push(currentValue);
    } else {
      accumulator[currentValue.type].push(currentValue);
    }

    return accumulator;

    return accumulator + currentValue;
  }, {});
}

// ── 4. longest: words -> the longest one (acc is the running winner) ─────────
// ['a','bbbb','cc','ddd'] -> 'bbbb'
function longest(words) {
  // TODO
  return words.reduce((accumulator, currentValue) => {
    if (accumulator.length < currentValue.length) {
      accumulator = currentValue;
    }
    return accumulator;
  }, "");
}

// ── 5. pipe: functions -> one function that runs them left-to-right ──────────
// pipe(x=>x+1, x=>x*2)(3) -> 8   (acc is a VALUE being threaded through fns)
function pipe(...fns) {
  return function (input) {
    // TODO
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// harness — don't edit below
const g = (s) => `\x1b[32m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;
const norm = (v) =>
  JSON.stringify(v, (_k, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val).sort())
      : val,
  );
let pass = 0,
  fail = 0;
function check(label, got, want) {
  const ok = norm(got) === norm(want);
  ok ? pass++ : fail++;
  console.log(
    `${ok ? g("PASS") : r("FAIL")}  ${label}` +
      (ok ? "" : `\n        got:  ${norm(got)}\n        want: ${norm(want)}`),
  );
}

check("1 total", total([1, 2, 3, 4]), 10);
check("1 total empty", total([]), 0);
check("2 tally", tally(["heading", "paragraph", "table", "paragraph"]), {
  heading: 1,
  paragraph: 2,
  table: 1,
});
check(
  "3 groupByType",
  groupByType([
    { type: "a", n: 1 },
    { type: "b", n: 2 },
    { type: "a", n: 3 },
  ]),
  {
    a: [
      { type: "a", n: 1 },
      { type: "a", n: 3 },
    ],
    b: [{ type: "b", n: 2 }],
  },
);
check("4 longest", longest(["a", "bbbb", "cc", "ddd"]), "bbbb");
check(
  "5 pipe",
  pipe(
    (x) => x + 1,
    (x) => x * 2,
  )(3),
  8,
);

console.log(`\n${pass} passed, ${fail} failed`);
