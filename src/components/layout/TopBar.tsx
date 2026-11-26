"use client";

import {
  ChevronRight,
  EyeOff,
  Maximize2,
  Monitor,
  Moon,
  PanelLeftOpen,
  Search,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { CURRICULUM_PLAN } from "@/data/curriculumPlan";
import { getDomainById, getTrackById } from "@/data/domains";
import { getSimulatorById } from "@/data/simulators";
import { useLearningStore } from "@/store/learningStore";
import type { SimulatorId } from "@/types/simulator";
import { ComputeLogo } from "./ComputeLogo";

const PRIMARY_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/curriculum", label: "Curriculum" },
  { href: "/graph", label: "Graph" },
  { href: "/labs", label: "Labs" },
  { href: "/glossary", label: "Glossary" },
  { href: "/review", label: "Review" },
  { href: "/progress", label: "Progress" },
  { href: "/manifest", label: "Manifest" },
];

export interface TopBarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
}

export function TopBar({
  sidebarOpen,
  onToggleSidebar,
  onOpenSearch,
}: TopBarProps) {
  const pathname = usePathname();
  const { state, setTheme, toggleDistractionFree } = useLearningStore();

  const breadcrumbs = useMemo(() => {
    const items: Array<{ label: string; href: string }> = [
      { label: "COMPUTE", href: "/" },
    ];

    if (pathname === "/") return items;

    if (pathname.startsWith("/learn/")) {
      const slug = pathname.replace("/learn/", "").split("/")[0];
      const entry = CURRICULUM_PLAN.find((e) => e.slug === slug);
      if (entry) {
        const track = getTrackById(entry.trackId);
        const domain = getDomainById(entry.domainId);
        items.push({ label: "Curriculum", href: "/curriculum" });
        if (track) {
          items.push({
            label: `Track ${track.number}`,
            href: `/curriculum?track=${track.id}`,
          });
        }
        if (domain) {
          items.push({
            label: domain.title,
            href: `/curriculum?domain=${domain.id}`,
          });
        }
        items.push({
          label: `Lesson ${entry.number}`,
          href: `/learn/${entry.slug}`,
        });
        return items;
      }
    }

    if (pathname.startsWith("/labs/")) {
      const id = pathname.replace("/labs/", "").split("/")[0] as SimulatorId;
      const sim = getSimulatorById(id);
      items.push({ label: "Labs", href: "/labs" });
      items.push({
        label: sim?.title ?? id,
        href: pathname,
      });
      return items;
    }

    const matched = PRIMARY_NAV_LINKS.find((link) => link.href === pathname);
    if (matched) {
      items.push({ label: matched.label, href: matched.href });
    } else {
      items.push({ label: pathname.replace("/", ""), href: pathname });
    }

    return items;
  }, [pathname]);

  const cycleTheme = () => {
    const next =
      state.theme === "light"
        ? "dark"
        : state.theme === "dark"
        ? "system"
        : "light";
    setTheme(next);
  };

  const ThemeIcon =
    state.theme === "light" ? Sun : state.theme === "dark" ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          {!state.distractionFree && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label={sidebarOpen ? "Toggle sidebar" : "Open sidebar"}
              className={`rounded border border-[var(--border-subtle)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] ${
                sidebarOpen ? "lg:hidden" : "inline-flex"
              }`}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}

          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] overflow-x-auto"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={`${crumb.href}-${idx}`} className="flex items-center gap-1.5 whitespace-nowrap">
                  {idx > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                  {isLast ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                      {idx === 0 && <ComputeLogo size={20} />}
                      <span className={idx === 0 ? "font-mono tracking-wider font-semibold" : ""}>
                        {crumb.label}
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      prefetch={true}
                      className="inline-flex items-center gap-1.5 hover:text-[var(--text-primary)]"
                    >
                      {idx === 0 && <ComputeLogo size={20} />}
                      <span className={idx === 0 ? "font-mono tracking-wider font-semibold text-[var(--text-primary)]" : ""}>
                        {crumb.label}
                      </span>
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!state.distractionFree && (
            <nav
              aria-label="Primary sections"
              className="hidden items-center gap-1 md:flex"
            >
              {PRIMARY_NAV_LINKS.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={true}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex items-center gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1 text-[10px] font-mono text-[var(--text-muted)] sm:inline">
              Ctrl K
            </kbd>
          </button>

          <button
            type="button"
            onClick={cycleTheme}
            aria-label={`Theme: ${state.theme}. Click to switch.`}
            title={`Theme: ${state.theme}`}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <ThemeIcon className="h-3.5 w-3.5" />
            <span className="hidden capitalize xl:inline">{state.theme}</span>
          </button>

          <button
            type="button"
            onClick={toggleDistractionFree}
            aria-pressed={state.distractionFree}
            title={
              state.distractionFree
                ? "Exit distraction-free focus mode"
                : "Enter distraction-free focus mode"
            }
            className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors ${
              state.distractionFree
                ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            }`}
          >
            {state.distractionFree ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            <span className="hidden xl:inline">
              {state.distractionFree ? "Exit Focus" : "Focus"}
            </span>
          </button>
        </div>
      </div>

      {/* Compact secondary nav on mobile when not in distraction-free mode */}
      {!state.distractionFree && (
        <nav
          aria-label="Mobile sections"
          className="flex items-center gap-1 overflow-x-auto border-t border-[var(--border-subtle)] px-4 py-1.5 md:hidden"
        >
          {PRIMARY_NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={`whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${
                  active
                    ? "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
