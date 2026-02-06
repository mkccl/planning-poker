import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const start = mutation({
  args: {
    gameId: v.id("games"),
    topic: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.adminSessionId !== args.sessionId) {
      throw new Error("Only the admin can start a round");
    }

    // Mark any current voting round as revealed
    const currentRound = await ctx.db
      .query("rounds")
      .withIndex("by_gameId_status", (q) =>
        q.eq("gameId", args.gameId).eq("status", "voting"),
      )
      .first();

    if (currentRound) {
      await ctx.db.patch(currentRound._id, {
        status: "revealed",
        revealedAt: Date.now(),
      });
    }

    // Create new round
    const roundId = await ctx.db.insert("rounds", {
      gameId: args.gameId,
      topic: args.topic,
      status: "voting",
    });

    // Update game status and topic
    await ctx.db.patch(args.gameId, {
      status: "voting",
      currentTopic: args.topic,
    });

    return roundId;
  },
});

export const reveal = mutation({
  args: {
    roundId: v.id("rounds"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");
    if (round.status === "revealed") return;

    const game = await ctx.db.get(round.gameId);
    if (!game) throw new Error("Game not found");
    if (game.adminSessionId !== args.sessionId) {
      throw new Error("Only the admin can reveal cards");
    }

    await ctx.db.patch(args.roundId, {
      status: "revealed",
      revealedAt: Date.now(),
    });

    await ctx.db.patch(round.gameId, {
      status: "revealed",
    });
  },
});

export const revote = mutation({
  args: {
    roundId: v.id("rounds"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");
    if (round.status !== "revealed") {
      throw new Error("Can only revote on a revealed round");
    }

    const game = await ctx.db.get(round.gameId);
    if (!game) throw new Error("Game not found");
    if (game.adminSessionId !== args.sessionId) {
      throw new Error("Only the admin can trigger a revote");
    }

    // Delete all votes for this round
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_roundId", (q) => q.eq("roundId", args.roundId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Reset round to voting status
    await ctx.db.patch(args.roundId, {
      status: "voting",
      revealedAt: undefined,
    });

    // Update game status
    await ctx.db.patch(round.gameId, {
      status: "voting",
    });
  },
});

export const autoReveal = mutation({
  args: {
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status === "revealed") return;

    // Count voters (not spectators)
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_gameId", (q) => q.eq("gameId", round.gameId))
      .collect();
    const voters = participants.filter((p) => p.role === "voter");

    // Count votes
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_roundId", (q) => q.eq("roundId", args.roundId))
      .collect();

    if (votes.length >= voters.length && voters.length > 0) {
      await ctx.db.patch(args.roundId, {
        status: "revealed",
        revealedAt: Date.now(),
      });

      await ctx.db.patch(round.gameId, {
        status: "revealed",
      });
    }
  },
});

export const getCurrent = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("rounds")
      .withIndex("by_gameId_status", (q) =>
        q.eq("gameId", args.gameId).eq("status", "voting"),
      )
      .first();
  },
});

export const getLatest = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(1);
    return rounds[0] ?? null;
  },
});

export const listHistory = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .collect();

    // Enrich with vote stats for revealed rounds
    const enriched = await Promise.all(
      rounds.map(async (round) => {
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_roundId", (q) => q.eq("roundId", round._id))
          .collect();

        const values = votes.map((v) => v.value);
        const avg =
          values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;

        return {
          ...round,
          voteCount: votes.length,
          average: Math.round(avg * 10) / 10,
        };
      }),
    );

    return enriched;
  },
});
