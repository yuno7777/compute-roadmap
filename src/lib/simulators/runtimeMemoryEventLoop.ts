// ============================================================================
// 1. Rust / C Ownership & Lifetimes
// ============================================================================

export type RustOwnershipOp = "move" | "shared-borrow" | "mut-borrow" | "clone";

export interface RustOwnershipState {
  operation: RustOwnershipOp;
  aValid: boolean;
  bValid: boolean;
  sharedBorrows: number;
  mutBorrows: number;
  heapAllocations: number;
  useAAllowed: boolean;
  mutateAAllowed: boolean;
  dropTiming: string;
  compilerVerdict: string;
  cComparisonNote: string;
  codeSnippet: string;
}

export function simulateRustOwnership(
  operation: RustOwnershipOp
): RustOwnershipState {
  switch (operation) {
    case "move":
      return {
        operation,
        aValid: false,
        bValid: true,
        sharedBorrows: 0,
        mutBorrows: 0,
        heapAllocations: 1,
        useAAllowed: false,
        mutateAAllowed: false,
        dropTiming: "Single allocation dropped once when B goes out of scope.",
        compilerVerdict:
          "E0382 (borrow of moved value: A) — Rust prevents use-after-move at compile time.",
        cComparisonNote:
          "In C, copying a pointer `int* b = a;` leaves `a` dangling after `free(b)` -> runtime use-after-free or double-free.",
        codeSnippet:
          "let a = String::from(\"heap\");\nlet b = a; // ownership moved\n// println!(\"{}\", a); // ERROR: use of moved value",
      };
    case "shared-borrow":
      return {
        operation,
        aValid: true,
        bValid: true,
        sharedBorrows: 1,
        mutBorrows: 0,
        heapAllocations: 1,
        useAAllowed: true,
        mutateAAllowed: false,
        dropTiming:
          "Reference B ends before A; owner A drops the single heap allocation at scope exit.",
        compilerVerdict:
          "OK to read A alongside &A (shared aliasing), but mutating A while &A is alive fails with E0506.",
        cComparisonNote:
          "In C, `const int* b = a;` is advisory only; another pointer can still mutate or free underneath.",
        codeSnippet:
          "let mut a = String::from(\"heap\");\nlet b: &String = &a;\nprintln!(\"{} == {}\", a, b); // valid shared read",
      };
    case "mut-borrow":
      return {
        operation,
        aValid: true,
        bValid: true,
        sharedBorrows: 0,
        mutBorrows: 1,
        heapAllocations: 1,
        useAAllowed: false,
        mutateAAllowed: false,
        dropTiming:
          "Exclusive &mut B expires first; owner A re-gains access and drops allocation at scope exit.",
        compilerVerdict:
          "E0502 / E0499 — While &mut A is active in B, A cannot be read or mutated (prevents data races & iterator invalidation).",
        cComparisonNote:
          "In C, aliasing mutable pointers are unchecked unless explicitly marked `restrict`, risking torn reads/UB.",
        codeSnippet:
          "let mut a = String::from(\"heap\");\nlet b: &mut String = &mut a;\nb.push_str(\"!\"); // exclusive mutation via B",
      };
    case "clone":
      return {
        operation,
        aValid: true,
        bValid: true,
        sharedBorrows: 0,
        mutBorrows: 0,
        heapAllocations: 2,
        useAAllowed: true,
        mutateAAllowed: true,
        dropTiming:
          "Independent allocations: B drops first, then A drops separately (2 frees total).",
        compilerVerdict:
          "Fully independent owners (A and B); reading or mutating A is unconditionally valid at the cost of a deep copy.",
        cComparisonNote:
          "Equivalent to C `strdup()` / `malloc` + `memcpy`, requiring two matching `free()` calls.",
        codeSnippet:
          "let mut a = String::from(\"heap\");\nlet b = a.clone(); // 2nd heap allocation\na.push_str(\"!\"); // valid: A and B are disjoint",
      };
  }
}

// ============================================================================
// 2. Python Object Identity & Copying
// ============================================================================

export type PythonCopyMode = "alias" | "shallow" | "deep";
export type PythonMutationOp = "none" | "append-outer" | "mutate-inner";

export interface PythonCopyState {
  mode: PythonCopyMode;
  mutation: PythonMutationOp;
  a: Array<number | number[]>;
  b: Array<number | number[]>;
  idA: string;
  idB: string;
  idA0: string;
  idB0: string;
  outerShared: boolean;
  innerShared: boolean;
  explanation: string;
}

export function simulatePythonCopy(
  mode: PythonCopyMode,
  mutation: PythonMutationOp
): PythonCopyState {
  const innerA = [1];
  const a: Array<number | number[]> = [innerA];

  let b: Array<number | number[]>;
  let idB: string;
  let idB0: string;
  let outerShared = false;
  let innerShared = false;

  const idA = "0x1000";
  const idA0 = "0x2000";

  if (mode === "alias") {
    b = a;
    idB = idA;
    idB0 = idA0;
    outerShared = true;
    innerShared = true;
  } else if (mode === "shallow") {
    b = [...a];
    idB = "0x1040";
    idB0 = idA0;
    outerShared = false;
    innerShared = true;
  } else {
    b = [[...innerA]];
    idB = "0x1040";
    idB0 = "0x2040";
    outerShared = false;
    innerShared = false;
  }

  if (mutation === "append-outer") {
    b.push(2);
  } else if (mutation === "mutate-inner") {
    const first = b[0];
    if (Array.isArray(first)) {
      first[0] = 7;
    }
  }

  let explanation = "";
  if (mode === "alias") {
    explanation =
      "b = a binds the same outer and inner list references; any outer or inner mutation is visible through both a and b.";
  } else if (mode === "shallow") {
    explanation =
      mutation === "mutate-inner"
        ? "Shallow copy creates a new outer list (id(a) != id(b)), but a[0] and b[0] still share the same inner list! Mutating b[0][0] changes a[0][0] to 7."
        : "Shallow copy creates a separate outer list (id(a) != id(b)), so b.append(2) leaves a unchanged — though a[0] and b[0] remain shared.";
  } else {
    explanation =
      "copy.deepcopy(a) recursively clones both outer and inner lists; neither outer nor inner mutations affect a.";
  }

  return {
    mode,
    mutation,
    a,
    b,
    idA,
    idB,
    idA0,
    idB0,
    outerShared,
    innerShared,
    explanation,
  };
}

// ============================================================================
// 3. JS/TS Browser Event Loop Stepper
// ============================================================================

export type EventLoopScenario = "promise-in-main" | "promise-in-timer";

export interface EventLoopStep {
  step: number;
  phase: string;
  callStack: string[];
  microtaskQueue: string[];
  macrotaskQueue: string[];
  consoleOutput: string[];
  description: string;
}

export function createEventLoopTrace(
  scenario: EventLoopScenario
): EventLoopStep[] {
  if (scenario === "promise-in-main") {
    return [
      {
        step: 0,
        phase: "Script Start",
        callStack: ["<main>"],
        microtaskQueue: [],
        macrotaskQueue: [],
        consoleOutput: [],
        description: "Push synchronous <main> script onto the Call Stack.",
      },
      {
        step: 1,
        phase: "Sync Log",
        callStack: ["<main>", "console.log('A')"],
        microtaskQueue: [],
        macrotaskQueue: [],
        consoleOutput: ["A"],
        description: "Execute console.log('A') synchronously -> prints 'A'.",
      },
      {
        step: 2,
        phase: "Schedule Timer",
        callStack: ["<main>", "setTimeout(cb, 0)"],
        microtaskQueue: [],
        macrotaskQueue: ["timerCb"],
        consoleOutput: ["A"],
        description:
          "setTimeout(..., 0) registers 'timerCb' in the Macrotask Queue.",
      },
      {
        step: 3,
        phase: "Schedule Promise",
        callStack: ["<main>", "Promise.then(cb)"],
        microtaskQueue: ["promiseCb"],
        macrotaskQueue: ["timerCb"],
        consoleOutput: ["A"],
        description:
          "Resolved Promise schedules 'promiseCb' in the Microtask Queue.",
      },
      {
        step: 4,
        phase: "Sync End",
        callStack: [],
        microtaskQueue: ["promiseCb"],
        macrotaskQueue: ["timerCb"],
        consoleOutput: ["A", "B"],
        description:
          "Execute console.log('B') -> prints 'B'. Call Stack is now empty.",
      },
      {
        step: 5,
        phase: "Microtask Checkpoint",
        callStack: ["promiseCb"],
        microtaskQueue: [],
        macrotaskQueue: ["timerCb"],
        consoleOutput: ["A", "B", "promise"],
        description:
          "Event Loop drains ALL Microtasks before the next Macrotask -> prints 'promise'.",
      },
      {
        step: 6,
        phase: "Macrotask Turn",
        callStack: [],
        microtaskQueue: [],
        macrotaskQueue: [],
        consoleOutput: ["A", "B", "promise", "timer"],
        description:
          "Event Loop pops 'timerCb' from Macrotask Queue -> prints 'timer'.",
      },
    ];
  }

  return [
    {
      step: 0,
      phase: "Script Start",
      callStack: ["<main>"],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleOutput: [],
      description: "Push synchronous <main> script onto the Call Stack.",
    },
    {
      step: 1,
      phase: "Sync Log",
      callStack: ["<main>", "console.log('A')"],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleOutput: ["A"],
      description: "Execute console.log('A') synchronously -> prints 'A'.",
    },
    {
      step: 2,
      phase: "Schedule Timer",
      callStack: ["<main>", "setTimeout(cb, 0)"],
      microtaskQueue: [],
      macrotaskQueue: ["timerCb (logs + enqueues promise)"],
      consoleOutput: ["A"],
      description:
        "setTimeout schedules 'timerCb' (which will enqueue a Promise) in Macrotask Queue.",
    },
    {
      step: 3,
      phase: "Sync End",
      callStack: [],
      microtaskQueue: [],
      macrotaskQueue: ["timerCb (logs + enqueues promise)"],
      consoleOutput: ["A", "B"],
      description:
        "Execute console.log('B') -> prints 'B'. Microtask Queue is empty.",
    },
    {
      step: 4,
      phase: "Macrotask Turn",
      callStack: ["timerCb"],
      microtaskQueue: ["promiseCb"],
      macrotaskQueue: [],
      consoleOutput: ["A", "B", "timer"],
      description:
        "Run 'timerCb': prints 'timer' and enqueues 'promiseCb' into the Microtask Queue.",
    },
    {
      step: 5,
      phase: "Microtask Checkpoint",
      callStack: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleOutput: ["A", "B", "timer", "promise"],
      description:
        "Post-macrotask Microtask Checkpoint runs 'promiseCb' -> prints 'promise'.",
    },
  ];
}
