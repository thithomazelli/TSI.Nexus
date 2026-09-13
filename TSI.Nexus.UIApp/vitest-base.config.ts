import { defineConfig } from 'vitest/config';

// Coverage provider override for the Angular CLI's unit-test builder (vitest runner).
// Picked up automatically because "runnerConfig": true is set on the "test" target in
// angular.json - see the filename convention in
// @angular/build/src/builders/unit-test/runners/vitest/configuration.js
// (must be named exactly "vitest-base.config.{ts,mts,cts,js,mjs,cjs}").
//
// Switched from the default "v8" provider to "istanbul": v8's coverage counters are tied to
// V8's internal bytecode/profiler lifecycle, so under memory pressure with many parallel test
// workers V8 can flush ("age out") bytecode for functions that already ran, silently resetting
// their coverage counters to 0 before the final report is generated. That produced run-to-run
// coverage swings of several percentage points on this suite (observed ~93-98% branches on an
// unchanged commit), occasionally dropping below the thresholds below with no code change.
// Istanbul instruments the source with plain counter increments instead, so it isn't subject to
// that GC-driven loss and reports the same numbers on every run of the same code - at the cost of
// a noticeably slower `ng test --coverage` (AST-based instrumentation vs V8's native counters).
export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
    },
  },
});
