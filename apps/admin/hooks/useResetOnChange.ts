"use client";

import { useState } from "react";

/**
 * Runs `reset` during render whenever one of `deps` changes (compared with
 * `Object.is`, like effect dependencies), typically to re-seed local state
 * from props. This is React's "adjusting state when a prop changes" pattern:
 * the state updates land before the children render, instead of one commit
 * later from an effect. Nothing runs on the first render, so seed the
 * initial state from the same props.
 */
export function useResetOnChange(deps: readonly unknown[], reset: () => void) {
  const [prevDeps, setPrevDeps] = useState(deps);

  const changed =
    prevDeps.length !== deps.length ||
    deps.some((dep, index) => !Object.is(dep, prevDeps[index]));

  if (changed) {
    setPrevDeps(deps);
    reset();
  }
}
