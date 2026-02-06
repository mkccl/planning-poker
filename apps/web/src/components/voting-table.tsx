"use client";

import type { Doc, Id } from "@planning-poker-nextjs/backend/convex/_generated/dataModel";

import { Spade } from "lucide-react";

import { Ripple } from "@/components/ui/ripple";
import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";

interface VotingTableProps {
  participants: Doc<"participants">[];
  votes: { _id: Id<"votes">; participantId: Id<"participants">; value: number }[];
  round: Doc<"rounds">;
  myId: Id<"participants">;
}

export default function VotingTable({
  participants,
  votes,
  round,
  myId,
}: VotingTableProps) {
  const isRevealed = round.status === "revealed";

  return (
    <div className="flex flex-col items-center gap-10">
      {/* Topic */}
      {round.topic && (
        <div className="text-center">
          <p className="text-muted-foreground mb-1.5 text-sm uppercase tracking-wider">
            Estimating
          </p>
          <h2 className="text-foreground text-2xl font-bold tracking-tight">
            {round.topic}
          </h2>
        </div>
      )}

      {/* Table — participants arranged around a virtual surface */}
      <div className="relative flex min-h-[320px] w-full max-w-4xl items-center justify-center rounded-full">
        {/* Shine border effect during voting */}
        {!isRevealed && (
          <ShineBorder
            shineColor={["hsl(var(--primary))", "hsl(var(--primary) / 0.5)"]}
            borderWidth={2}
            duration={8}
          />
        )}
        {/* Table surface */}
        <div className="pointer-events-none absolute inset-0 poker-table-bg rounded-full" />
        {/* Ripple effect at center */}
        <Ripple
          mainCircleSize={100}
          mainCircleOpacity={0.1}
          numCircles={4}
          className="opacity-30"
        />

        {/* Participant cards arranged in a wrap */}
        <div className="relative flex flex-wrap items-center justify-center gap-x-8 gap-y-6 px-6 py-8">
          {participants.map((p) => {
            const vote = votes.find((v) => v.participantId === p._id);
            const hasVoted = !!vote;
            const isMe = p._id === myId;

            return (
              <div
                key={p._id}
                className="flex flex-col items-center gap-3"
              >
                {/* Poker Card with flip */}
                <div className="card-flip h-44 w-32">
                  <div
                    className={cn(
                      "card-flip-inner",
                      isRevealed && hasVoted && "flipped",
                    )}
                  >
                    {/* Back face (shown during voting) */}
                    <div
                      className={cn(
                        "card-face card-face-back overflow-hidden rounded-xl border-2 shadow-md",
                        hasVoted
                          ? "border-primary/60 bg-primary/10 shadow-primary/10"
                          : "border-border bg-card",
                      )}
                    >
                      {/* Pattern overlay */}
                      <div className="card-back-pattern absolute inset-0" />
                      <div className="relative flex flex-col items-center gap-2">
                        <Spade
                          className={cn(
                            "size-10",
                            hasVoted
                              ? "text-primary/70"
                              : "text-muted-foreground/40",
                          )}
                          aria-hidden="true"
                        />
                        {hasVoted && (
                          <span className="text-primary text-sm font-semibold uppercase tracking-wider">
                            Ready
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Front face (shown after reveal) */}
                    <div className="card-face card-face-front overflow-hidden rounded-xl border-2 border-primary bg-card shadow-lg">
                      <div className="flex flex-col items-center">
                        <span className="text-foreground text-5xl font-bold tabular-nums">
                          {vote?.value ?? "?"}
                        </span>
                      </div>
                      {/* Corner pips */}
                      <span className="text-primary/60 absolute left-2.5 top-2 text-sm font-bold" aria-hidden="true">
                        {vote?.value}
                      </span>
                      <span className="text-primary/60 absolute bottom-2 right-2.5 rotate-180 text-sm font-bold" aria-hidden="true">
                        {vote?.value}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <span
                  className={cn(
                    "max-w-32 truncate text-center text-sm",
                    isMe
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {p.displayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
