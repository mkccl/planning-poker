"use client";

import type { Doc } from "@planning-poker-nextjs/backend/convex/_generated/dataModel";
import type { VotingSystemKey } from "@/lib/voting-systems";

import { api } from "@planning-poker-nextjs/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ClipboardCopy,
  Eye,
  Play,
  RefreshCw,
  RotateCcw,
  Spade,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HyperText } from "@/components/ui/hyper-text";
import { Input } from "@/components/ui/input";
import { PulsatingButton } from "@/components/ui/pulsating-button";
import { getCardValues } from "@/lib/voting-systems";
import { cn } from "@/lib/utils";

import CardHand from "./card-hand";
import ResultsPanel from "./results-panel";
import { SummaryDialog } from "./summary-dialog";
import VotingTable from "./voting-table";

interface GameScreenProps {
  game: Doc<"games">;
  me: Doc<"participants">;
  sessionId: string;
  joinCode: string;
}

export default function GameScreen({
  game,
  me,
  sessionId,
  joinCode,
}: GameScreenProps) {
  const isAdmin = game.adminSessionId === sessionId;
  const isVoter = me.role === "voter";

  const participants = useQuery(api.participants.list, { gameId: game._id });
  const latestRound = useQuery(api.rounds.getLatest, { gameId: game._id });
  const votes = useQuery(
    api.votes.getForRound,
    latestRound ? { roundId: latestRound._id } : "skip",
  );
  const myVote = useQuery(
    api.votes.getMyVote,
    latestRound ? { roundId: latestRound._id, participantId: me._id } : "skip",
  );
  const stats = useQuery(
    api.votes.getStats,
    latestRound && latestRound.status === "revealed"
      ? { roundId: latestRound._id }
      : "skip",
  );
  const roundHistory = useQuery(api.rounds.listHistory, {
    gameId: game._id,
  });

  const startRound = useMutation(api.rounds.start);
  const revealRound = useMutation(api.rounds.reveal);
  const revoteRound = useMutation(api.rounds.revote);
  const castVote = useMutation(api.votes.cast);
  const removeVote = useMutation(api.votes.remove);

  const [topic, setTopic] = useState("");
  const [copied, setCopied] = useState(false);

  const cardValues = getCardValues(game.votingSystem as VotingSystemKey);
  const voters = participants?.filter((p) => p.role === "voter") ?? [];
  const spectators = participants?.filter((p) => p.role === "spectator") ?? [];
  const isVoting = latestRound?.status === "voting";
  const isRevealed = latestRound?.status === "revealed";
  const voteCount = votes?.length ?? 0;

  async function handleCopyLink() {
    const url = `${window.location.origin}/game/${joinCode}/join`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleStartRound() {
    if (!topic.trim()) {
      toast.error("Please enter a topic for this round.");
      return;
    }
    await startRound({
      gameId: game._id,
      topic: topic.trim(),
      sessionId,
    });
    setTopic("");
  }

  async function handleReveal() {
    if (!latestRound) return;
    await revealRound({
      roundId: latestRound._id,
      sessionId,
    });
  }

  async function handleRevote() {
    if (!latestRound) return;
    await revoteRound({
      roundId: latestRound._id,
      sessionId,
    });
  }

  async function handleVote(value: number) {
    if (!latestRound || !isVoting) return;

    if (myVote && myVote.value === value) {
      await removeVote({
        roundId: latestRound._id,
        participantId: me._id,
      });
    } else {
      await castVote({
        roundId: latestRound._id,
        participantId: me._id,
        value,
      });
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center gap-4 border-b px-5 py-3">
        <Spade className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
        <h1 className="min-w-0 truncate text-base font-semibold">{game.name}</h1>

        {/* Participant count */}
        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <Users className="size-4" aria-hidden="true" />
          <span>{(participants?.length ?? 0)}</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Round history badges */}
          {roundHistory && roundHistory.filter((r) => r.status === "revealed").length > 0 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <AnimatePresence mode="popLayout">
                {roundHistory
                  .filter((r) => r.status === "revealed")
                  .slice(0, 3)
                  .map((r) => (
                    <motion.div
                      key={r._id}
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <Badge variant="secondary" className="text-xs tabular-nums">
                        {r.topic}: {r.average}
                      </Badge>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          )}

          {/* Summary dialog */}
          {roundHistory && (
            <SummaryDialog gameName={game.name} rounds={roundHistory} />
          )}

          <Badge variant="outline" className="overflow-hidden px-2 py-0.5">
            <HyperText
              className="py-0 text-xs font-medium tracking-wider"
              duration={600}
              animateOnHover={false}
              characterSet={[..."ABCDEFGHJKLMNPQRSTUVWXYZ23456789"]}
            >
              {joinCode}
            </HyperText>
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopyLink}
            aria-label={copied ? "Link copied" : "Copy invite link"}
          >
            {copied ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <ClipboardCopy className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Spectator bar */}
        {spectators.length > 0 && (
          <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-2">
            <Eye className="text-muted-foreground size-4" aria-hidden="true" />
            <span className="text-muted-foreground text-sm">Spectating</span>
            <div className="flex -space-x-2">
              {spectators.slice(0, 5).map((s) => (
                <div
                  key={s._id}
                  className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full border-2 border-background text-xs font-medium uppercase"
                  title={s.displayName}
                >
                  {s.displayName.charAt(0)}
                </div>
              ))}
              {spectators.length > 5 && (
                <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full border-2 border-background text-xs font-medium">
                  +{spectators.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Table Area ─── */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10">
          {/* Empty state: no round yet */}
          {!latestRound && (
            <div className="flex flex-col items-center gap-8 text-center">
              <div className="relative">
                <div className="bg-muted/50 flex size-24 items-center justify-center rounded-full">
                  <Spade className="text-muted-foreground/60 size-12" aria-hidden="true" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-foreground text-xl font-semibold">
                  {isAdmin ? "Ready to Estimate" : "Waiting for Round"}
                </h2>
                <p className="text-muted-foreground max-w-sm text-base">
                  {isAdmin
                    ? "Enter a topic below and start your first round."
                    : "The game admin will start a round shortly\u2026"}
                </p>
              </div>

              {/* Inline start form for admin (empty state) */}
              {isAdmin && (
                <div className="flex w-full max-w-md items-center gap-2">
                  <Input
                    placeholder="Topic (e.g. JIRA-123)..."
                    aria-label="Round topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleStartRound();
                    }}
                  />
                  <Button size="lg" onClick={handleStartRound}>
                    <Play className="mr-1.5 size-4" aria-hidden="true" />
                    Start
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Active round: Voting Table */}
          {latestRound && (
            <>
              <VotingTable
                participants={voters}
                votes={votes ?? []}
                round={latestRound}
                myId={me._id}
              />

              {/* Admin action bar — contextual */}
              {isAdmin && (
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {isVoting && (
                    <>
                      {/* Vote progress - circular */}
                      <div className="flex items-center gap-4">
                        <AnimatedCircularProgressBar
                          max={voters.length || 1}
                          min={0}
                          value={voteCount}
                          gaugePrimaryColor="hsl(var(--primary))"
                          gaugeSecondaryColor="hsl(var(--muted))"
                          className="size-14 text-sm"
                        />
                        <span className="text-muted-foreground text-sm tabular-nums">
                          {voteCount}/{voters.length} voted
                        </span>
                      </div>

                      {voteCount === voters.length && voters.length > 0 ? (
                        <PulsatingButton
                          onClick={handleReveal}
                          pulseColor="hsl(var(--primary))"
                          className="gap-1.5"
                        >
                          <Eye className="size-4" aria-hidden="true" />
                          Reveal Cards
                        </PulsatingButton>
                      ) : (
                        <Button onClick={handleReveal}>
                          <Eye className="mr-1.5 size-4" aria-hidden="true" />
                          Reveal Cards
                        </Button>
                      )}
                    </>
                  )}

                  {isRevealed && (
                    <div className="flex w-full max-w-md items-center gap-2">
                      <Button variant="outline" onClick={handleRevote}>
                        <RefreshCw className="mr-1.5 size-4" aria-hidden="true" />
                        Revote
                      </Button>
                      <Input
                        placeholder="Next topic..."
                        aria-label="Next round topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleStartRound();
                        }}
                      />
                      <Button onClick={handleStartRound}>
                        <RotateCcw className="mr-1.5 size-4" aria-hidden="true" />
                        New Round
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Results */}
              {isRevealed && stats && (
                <ResultsPanel stats={stats} />
              )}
            </>
          )}
        </div>

        {/* ─── Card Hand (voters only, during voting) ─── */}
        {isVoter && latestRound && isVoting && (
          <CardHand
            values={cardValues}
            selectedValue={myVote?.value ?? null}
            onSelect={handleVote}
          />
        )}
      </div>
    </div>
  );
}
