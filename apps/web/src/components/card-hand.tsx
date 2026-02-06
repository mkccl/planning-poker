"use client";

import { Spade } from "lucide-react";

import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

interface CardHandProps {
  values: readonly number[];
  selectedValue: number | null;
  onSelect: (value: number) => void;
}

export default function CardHand({
  values,
  selectedValue,
  onSelect,
}: CardHandProps) {
  const count = values.length;
  const maxAngle = Math.min(count * 3, 30);

  return (
    <div className="border-t bg-muted/20 px-6 pb-6 pt-8">
      <div
        className="flex items-end justify-center"
        role="radiogroup"
        aria-label="Vote value"
      >
        {values.map((value, i) => {
          const isSelected = selectedValue === value;
          const angle = count > 1
            ? -maxAngle / 2 + (i / (count - 1)) * maxAngle
            : 0;
          const normalizedPos = count > 1 ? (i / (count - 1)) * 2 - 1 : 0;
          const yOffset = normalizedPos * normalizedPos * 14;

          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${value} points`}
              onClick={() => onSelect(value)}
              className={cn(
                "relative -mx-1 flex h-36 w-[5.5rem] flex-col items-center justify-center overflow-hidden rounded-xl border-2 shadow-md",
                "transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out",
                "hover:-translate-y-5 hover:z-20 hover:shadow-xl motion-reduce:hover:translate-y-0",
                "focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground z-30 -translate-y-8 shadow-xl shadow-primary/20 motion-reduce:-translate-y-0"
                  : "border-border bg-card text-card-foreground hover:border-primary/50",
              )}
              style={{
                transform: isSelected
                  ? `rotate(${angle * 0.3}deg) translateY(-2rem)`
                  : `rotate(${angle}deg) translateY(${yOffset}px)`,
                transformOrigin: "bottom center",
              }}
            >
              {/* Corner pip top-left */}
              <span className="absolute left-2 top-1.5 flex flex-col items-center leading-none" aria-hidden="true">
                <span className="text-sm font-bold opacity-70">{value}</span>
                <Spade className="size-3 opacity-50" />
              </span>

              {/* Center value */}
              <span className="text-3xl font-bold tabular-nums">{value}</span>

              {/* Corner pip bottom-right (inverted) */}
              <span className="absolute bottom-1.5 right-2 flex rotate-180 flex-col items-center leading-none" aria-hidden="true">
                <span className="text-sm font-bold opacity-70">{value}</span>
                <Spade className="size-3 opacity-50" />
              </span>

              {isSelected && (
                <BorderBeam
                  size={50}
                  duration={3}
                  className="from-transparent via-primary-foreground/60 to-transparent"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
