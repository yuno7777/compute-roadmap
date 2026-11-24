"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CURRICULUM_PLAN } from "@/data/curriculumPlan";
import { SIMULATOR_CATALOG } from "@/data/simulators";

const PRIMARY_ROUTES = [
  "/",
  "/curriculum",
  "/graph",
  "/labs",
  "/glossary",
  "/review",
  "/progress",
  "/manifest",
];

const BATCH_SIZE = 8;
const INITIAL_DELAY_MS = 50;
const BATCH_DELAY_MS = 40;

let sessionPreloadCompleted = false;

export function RoutePreloader() {
  const router = useRouter();

  useEffect(() => {
    if (sessionPreloadCompleted || typeof window === "undefined") {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    // 1. Immediately prefetch all 8 primary routes
    for (const href of PRIMARY_ROUTES) {
      router.prefetch(href);
    }

    // 2. Staggered non-blocking prefetch of all 58 lesson routes & 21 lab routes
    const deferredRoutes = [
      ...CURRICULUM_PLAN.map((entry) => `/learn/${entry.slug}`),
      ...SIMULATOR_CATALOG.map((sim) => `/labs/${sim.id}`),
    ];

    let cursor = 0;

    const scheduleNextBatch = (delayMs: number) => {
      if (cancelled) return;
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        if (typeof window.requestIdleCallback === "function") {
          idleId = window.requestIdleCallback(runBatch, { timeout: 200 });
        } else {
          runBatch();
        }
      }, delayMs);
    };

    const runBatch = () => {
      if (cancelled) return;
      const end = Math.min(cursor + BATCH_SIZE, deferredRoutes.length);
      for (let i = cursor; i < end; i++) {
        router.prefetch(deferredRoutes[i]);
      }
      cursor = end;

      if (cursor >= deferredRoutes.length) {
        sessionPreloadCompleted = true;
      } else {
        scheduleNextBatch(BATCH_DELAY_MS);
      }
    };

    scheduleNextBatch(INITIAL_DELAY_MS);

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      if (
        idleId !== null &&
        typeof window.cancelIdleCallback === "function"
      ) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [router]);

  return null;
}
