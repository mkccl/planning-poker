"use client";

import { Check, ClipboardList, Copy, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Round {
  _id: string;
  topic: string;
  status: string;
  average: number;
  voteCount: number;
}

interface SummaryDialogProps {
  gameName: string;
  rounds: Round[];
}

export function SummaryDialog({ gameName, rounds }: SummaryDialogProps) {
  const [copiedFormat, setCopiedFormat] = useState<"text" | "markdown" | null>(null);

  const revealedRounds = rounds.filter((r) => r.status === "revealed");
  const totalPoints = revealedRounds.reduce((sum, r) => sum + r.average, 0);
  const roundedTotal = Math.round(totalPoints * 10) / 10;

  function generatePlainText() {
    if (revealedRounds.length === 0) {
      return `${gameName} - Summary\n\nNo completed rounds yet.`;
    }

    const lines = revealedRounds.map((r) => {
      const isConsensus = r.voteCount > 0 && r.average === Math.round(r.average);
      const consensusMarker = isConsensus ? " ✓" : "";
      return `• ${r.topic}: ${r.average} points${consensusMarker}`;
    });

    return `${gameName} - Summary\n\n${lines.join("\n")}\n\nTotal: ${roundedTotal} points`;
  }

  function generateMarkdown() {
    if (revealedRounds.length === 0) {
      return `## ${gameName} - Summary\n\n_No completed rounds yet._`;
    }

    const header = `## ${gameName} - Summary\n\n| Topic | Estimate |\n|-------|----------|`;
    const rows = revealedRounds.map((r) => {
      const isConsensus = r.voteCount > 0 && r.average === Math.round(r.average);
      const consensusMarker = isConsensus ? " ✓" : "";
      return `| ${r.topic} | ${r.average}${consensusMarker} |`;
    });

    return `${header}\n${rows.join("\n")}\n\n**Total: ${roundedTotal} points**`;
  }

  async function handleCopy(format: "text" | "markdown") {
    const content = format === "text" ? generatePlainText() : generateMarkdown();
    await navigator.clipboard.writeText(content);
    setCopiedFormat(format);
    toast.success(`Copied as ${format === "text" ? "plain text" : "Markdown"}!`);
    setTimeout(() => setCopiedFormat(null), 2000);
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="View session summary" />
        }
      >
        <ClipboardList className="size-4" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-4" aria-hidden="true" />
            Session Summary
          </DialogTitle>
          <DialogDescription>{gameName}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {revealedRounds.length === 0 ? (
            <BlurFade delay={0.1}>
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <ClipboardList className="text-muted-foreground size-10" aria-hidden="true" />
                <p className="text-muted-foreground text-sm">No completed rounds yet.</p>
                <p className="text-muted-foreground text-xs">
                  Complete some voting rounds to see the summary.
                </p>
              </div>
            </BlurFade>
          ) : (
            <>
              {/* Rounds list */}
              <div className="flex flex-col gap-2">
                {revealedRounds.map((round, index) => {
                  const isConsensus =
                    round.voteCount > 0 && round.average === Math.round(round.average);
                  return (
                    <BlurFade key={round._id} delay={0.05 * index}>
                      <div
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-4 py-3",
                          isConsensus
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-border bg-muted/30"
                        )}
                      >
                        <span className="text-foreground text-sm font-medium truncate max-w-[200px]">
                          {round.topic}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-lg font-bold tabular-nums",
                              isConsensus ? "text-green-600 dark:text-green-400" : "text-foreground"
                            )}
                          >
                            {round.average}
                          </span>
                          {isConsensus && (
                            <Check className="size-4 text-green-500" aria-label="Consensus" />
                          )}
                        </div>
                      </div>
                    </BlurFade>
                  );
                })}
              </div>

              {/* Total */}
              <BlurFade delay={0.05 * revealedRounds.length}>
                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-3">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-xl font-bold tabular-nums">{roundedTotal} points</span>
                </div>
              </BlurFade>

              {/* Copy buttons */}
              <BlurFade delay={0.05 * (revealedRounds.length + 1)}>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopy("text")}
                  >
                    {copiedFormat === "text" ? (
                      <Check className="mr-1.5 size-4" aria-hidden="true" />
                    ) : (
                      <Copy className="mr-1.5 size-4" aria-hidden="true" />
                    )}
                    Copy as Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopy("markdown")}
                  >
                    {copiedFormat === "markdown" ? (
                      <Check className="mr-1.5 size-4" aria-hidden="true" />
                    ) : (
                      <Copy className="mr-1.5 size-4" aria-hidden="true" />
                    )}
                    Copy as Markdown
                  </Button>
                </div>
              </BlurFade>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
