"use client";

import { api } from "@planning-poker-nextjs/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import GameScreen from "@/components/game-screen";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionId } from "@/hooks/use-session-id";

export default function GamePage() {
  const params = useParams<{ joinCode: string }>();
  const router = useRouter();
  const sessionId = useSessionId();

  const game = useQuery(api.games.getByJoinCode, {
    joinCode: params.joinCode,
  });

  const me = useQuery(
    api.participants.getMe,
    game && sessionId ? { gameId: game._id, sessionId } : "skip",
  );

  // Redirect to join page if not a participant
  useEffect(() => {
    if (game !== undefined && game !== null && me === null && sessionId) {
      router.push(`/game/${params.joinCode}/join`);
    }
  }, [game, me, sessionId, router, params.joinCode]);

  if (game === undefined || me === undefined || !sessionId) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex flex-1 gap-4">
          <Skeleton className="h-64 flex-1" />
          <Skeleton className="h-64 w-48" />
        </div>
      </div>
    );
  }

  if (game === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <h2 className="text-lg font-semibold">Game Not Found</h2>
        <p className="text-muted-foreground text-sm">
          This game doesn&apos;t exist.
        </p>
      </div>
    );
  }

  if (!me) return null; // Will redirect

  return (
    <GameScreen
      game={game}
      me={me}
      sessionId={sessionId}
      joinCode={params.joinCode}
    />
  );
}
