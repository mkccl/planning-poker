"use client";

import type { VotingSystemKey } from "@/lib/voting-systems";

import { api } from "@planning-poker-nextjs/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Spade, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DotPattern } from "@/components/ui/dot-pattern";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextAnimate } from "@/components/ui/text-animate";
import { useSessionId } from "@/hooks/use-session-id";
import { VOTING_SYSTEMS } from "@/lib/voting-systems";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const sessionId = useSessionId();
  const createGame = useMutation(api.games.create);

  const [gameName, setGameName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [votingSystem, setVotingSystem] = useState<VotingSystemKey>("fibonacci");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !gameName.trim() || !adminName.trim()) return;

    setIsCreating(true);
    try {
      const { joinCode } = await createGame({
        name: gameName.trim(),
        votingSystem,
        adminName: adminName.trim(),
        sessionId,
      });
      router.push(`/game/${joinCode}`);
    } catch {
      setIsCreating(false);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4">
      <DotPattern
        className={cn(
          "absolute inset-0 -z-10",
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
        )}
      />

      <div className="flex w-full max-w-md flex-col items-center gap-8">
        {/* Hero */}
        <BlurFade delay={0.1}>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <Spade className="size-8" aria-hidden="true" />
              <TextAnimate
                animation="blurInUp"
                by="character"
                once
                as="h1"
                className="text-3xl font-bold tracking-tight"
              >
                Planning Poker
              </TextAnimate>
            </div>
            <p className="text-muted-foreground text-sm">
              Estimate together, align faster. Real-time collaborative estimation
              for agile teams.
            </p>
          </div>
        </BlurFade>

        {/* Create Game Form */}
        <BlurFade delay={0.25}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" aria-hidden="true" />
              Start New Game
            </CardTitle>
            <CardDescription>
              Create a room and invite your team to estimate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGame} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gameName">Game Name</Label>
                <Input
                  id="gameName"
                  placeholder="Sprint 42 Planning..."
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="adminName">Your Display Name</Label>
                <Input
                  id="adminName"
                  placeholder="Jane..."
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Voting System</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      "border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
                      "inline-flex h-8 w-full items-center justify-between rounded-none border px-2.5 text-xs font-medium outline-none transition-colors",
                    )}
                  >
                    {VOTING_SYSTEMS[votingSystem].label}
                    <span className="text-muted-foreground text-xs">
                      [{VOTING_SYSTEMS[votingSystem].values.join(", ")}]
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--anchor-width)]">
                    <DropdownMenuRadioGroup
                      value={votingSystem}
                      onValueChange={(val) =>
                        setVotingSystem(val as VotingSystemKey)
                      }
                    >
                      {(
                        Object.entries(VOTING_SYSTEMS) as [
                          VotingSystemKey,
                          (typeof VOTING_SYSTEMS)[VotingSystemKey],
                        ][]
                      ).map(([key, system]) => (
                        <DropdownMenuRadioItem key={key} value={key}>
                          <div className="flex flex-col gap-0.5">
                            <span>{system.label}</span>
                            <span className="text-muted-foreground text-xs">
                              {system.values.join(", ")}
                            </span>
                          </div>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-2 w-full"
                disabled={isCreating || !sessionId}
              >
                {isCreating ? "Creating\u2026" : "Create Game"}
              </Button>
            </form>
          </CardContent>
        </Card>
        </BlurFade>
      </div>
    </div>
  );
}
