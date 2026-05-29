import { useLayoutEffect, useRef } from "react";

type UseIssueDetailScrollRestoreArgs = {
  restoreKey: string;
  scrollContainerEl: HTMLElement | null;
  ready: boolean;
  disabled?: boolean;
};

const scrollPositions = new Map<string, number>();

export function useIssueDetailScrollRestore({
  restoreKey,
  scrollContainerEl,
  ready,
  disabled = false,
}: UseIssueDetailScrollRestoreArgs) {
  const restoredKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    restoredKeyRef.current = null;
  }, [restoreKey]);

  useLayoutEffect(() => {
    if (!scrollContainerEl || disabled || !ready) return;

    const save = () => {
      scrollPositions.set(restoreKey, scrollContainerEl.scrollTop);
    };

    scrollContainerEl.addEventListener("scroll", save, { passive: true });

    return () => {
      save();
      scrollContainerEl.removeEventListener("scroll", save);
    };
  }, [scrollContainerEl, restoreKey, ready, disabled]);

  useLayoutEffect(() => {
    if (!scrollContainerEl || disabled || !ready) return;
    if (restoredKeyRef.current === restoreKey) return;

    restoredKeyRef.current = restoreKey;

    const target = scrollPositions.get(restoreKey) ?? 0;
    return restoreScrollTopWithRetry(scrollContainerEl, target);
  }, [scrollContainerEl, restoreKey, ready, disabled]);
}

function restoreScrollTopWithRetry(el: HTMLElement, target: number) {
  let cancelled = false;
  let attempts = 0;
  const maxAttempts = 30;

  el.scrollTop = target;
  if (Math.abs(el.scrollTop - target) <= 1) return () => {};

  let frameId: number;

  const tick = () => {
    if (cancelled) return;

    el.scrollTop = target;
    attempts += 1;

    if (Math.abs(el.scrollTop - target) <= 1 || attempts >= maxAttempts) {
      return;
    }

    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(frameId);
  };
}
