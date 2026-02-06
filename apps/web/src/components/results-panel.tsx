"use client";

import confetti from "canvas-confetti";
import { Trophy } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { BlurFade } from "@/components/ui/blur-fade";
import { CoolMode } from "@/components/ui/cool-mode";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { SparklesText } from "@/components/ui/sparkles-text";
import { cn } from "@/lib/utils";

interface Stats {
  average: number;
  min: number;
  max: number;
  totalVotes: number;
  distribution: Record<string, number>;
  isConsensus: boolean;
  agreementPercent: number;
}

interface ResultsPanelProps {
  stats: Stats;
}

export default function ResultsPanel({ stats }: ResultsPanelProps) {
  const hasConfettied = useRef(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (stats.isConsensus && !hasConfettied.current) {
      hasConfettied.current = true;

      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReduced) return;

      const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
      const end = Date.now() + 2500;

      function frame() {
        if (Date.now() > end) return;

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors,
        });

        requestAnimationFrame(frame);
      }

      frame();
    }
  }, [stats.isConsensus]);

  const sortedDistribution = Object.entries(stats.distribution).sort(
    ([a], [b]) => Number(a) - Number(b),
  );

  const maxDistCount = Math.max(
    ...Object.values(stats.distribution).map(Number),
  );

  return (
    <BlurFade delay={0.1}>
      <MagicCard
        className="w-full max-w-lg rounded-xl border"
        gradientColor={resolvedTheme === "dark" ? "#262626" : "#D9D9D955"}
        gradientFrom={stats.isConsensus ? "#22c55e" : "#9E7AFF"}
        gradientTo={stats.isConsensus ? "#86efac" : "#FE8BBB"}
      >
        <div className="flex flex-col gap-6 p-6">
          {/* Consensus banner */}
          {stats.isConsensus && (
            <CoolMode options={{ particle: "🎉", particleCount: 15 }}>
              <div className="flex cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-green-500/10 px-4 py-2.5">
                <Trophy className="size-5 text-green-500" aria-hidden="true" />
                <SparklesText
                  className="text-base font-semibold"
                  colors={{ first: "#22c55e", second: "#86efac" }}
                  sparklesCount={6}
                >
                  Consensus Reached!
                </SparklesText>
              </div>
            </CoolMode>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatBlock label="Average" value={stats.average} decimals={1} highlight />
            <StatBlock label="Min" value={stats.min} />
            <StatBlock label="Max" value={stats.max} />
          </div>

          {/* Agreement bar */}
          {!stats.isConsensus && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Agreement</span>
                <span className="font-semibold tabular-nums">{stats.agreementPercent}%</span>
              </div>
              <div className="bg-muted relative h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
                  style={{ width: `${stats.agreementPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Distribution chart */}
          <div className="flex flex-col gap-3">
            <span className="text-muted-foreground text-sm">Distribution</span>
            <div className="flex items-end justify-center gap-3">
              {sortedDistribution.map(([value, count]) => {
                const height = (Number(count) / maxDistCount) * 72;
                return (
                  <div
                    key={value}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {count}
                    </span>
                    <div
                      className={cn(
                        "w-12 rounded-sm transition-[height,background-color] duration-500",
                        stats.isConsensus
                          ? "bg-green-500/70"
                          : "bg-primary/50",
                      )}
                      style={{ height: `${Math.max(height, 8)}px` }}
                    />
                    <span className="text-sm font-semibold tabular-nums">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </MagicCard>
    </BlurFade>
  );
}

function StatBlock({
  label,
  value,
  decimals = 0,
  highlight = false,
}: {
  label: string;
  value: number;
  decimals?: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg px-4 py-5",
        highlight ? "bg-primary/5" : "bg-muted/50",
      )}
    >
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className={cn("font-bold tabular-nums", highlight ? "text-4xl" : "text-3xl")}>
        <NumberTicker value={value} decimalPlaces={decimals} />
      </span>
    </div>
  );
}
