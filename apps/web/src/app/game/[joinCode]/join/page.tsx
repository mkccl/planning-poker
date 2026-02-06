"use client";

import { api } from "@planning-poker-nextjs/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Eye, Spade, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionId } from "@/hooks/use-session-id";
import { cn } from "@/lib/utils";

export default function JoinGamePage() {
  const params = useParams<{ joinCode: string }>();
  const router = useRouter();
  const sessionId = useSessionId();

  const game = useQuery(api.games.getByJoinCode, {
    joinCode: params.joinCode,
  });

  const joinGame = useMutation(api.participants.join);

  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"voter" | "spectator">("voter");
  const [isJoining, setIsJoining] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !game || !displayName.trim()) return;

    setIsJoining(true);
    try {
      await joinGame({
        gameId: game._id,
        displayName: displayName.trim(),
        role,
        sessionId,
      });
      router.push(`/game/${params.joinCode}`);
    } catch {
      setIsJoining(false);
    }
  }

  if (game === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (game === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <Spade className="text-muted-foreground size-12" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Game Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The game code &quot;{params.joinCode}&quot; doesn&apos;t exist.
        </p>
        <Button variant="outline" render={<Link href="/" />}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <BlurFade delay={0.1}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4" aria-hidden="true" />
              Join Game
            </CardTitle>
            <CardDescription>
              Joining <strong>{game.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="displayName">Your Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Jane..."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-pressed={role === "voter"}
                    onClick={() => setRole("voter")}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-none border p-3 text-xs transition-colors",
                      role === "voter"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    <Spade className="size-5" aria-hidden="true" />
                    <span className="font-medium">Voter</span>
                    <span className="text-muted-foreground text-[10px]">
                      Pick cards to estimate
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={role === "spectator"}
                    onClick={() => setRole("spectator")}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-none border p-3 text-xs transition-colors",
                      role === "spectator"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    <Eye className="size-5" aria-hidden="true" />
                    <span className="font-medium">Spectator</span>
                    <span className="text-muted-foreground text-[10px]">
                      Watch without voting
                    </span>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-2"
                disabled={isJoining || !sessionId || !displayName.trim()}
              >
                {isJoining ? "Joining\u2026" : "Join Game"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </BlurFade>
    </div>
  );
}
