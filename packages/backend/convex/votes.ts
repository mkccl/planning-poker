import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const cast = mutation({
  args: {
    roundId: v.id("rounds"),
    participantId: v.id("participants"),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");
    if (round.status === "revealed") {
      throw new Error("Cannot vote on a revealed round");
    }

    // Upsert: update existing vote or create new one
    const existing = await ctx.db
      .query("votes")
      .withIndex("by_roundId_participantId", (q) =>
        q
          .eq("roundId", args.roundId)
          .eq("participantId", args.participantId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
      return existing._id;
    }

    const voteId = await ctx.db.insert("votes", {
      roundId: args.roundId,
      participantId: args.participantId,
      value: args.value,
    });

    // Check if all voters have voted for auto-reveal
    const game = await ctx.db.get(round.gameId);
    if (!game) return voteId;

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_gameId", (q) => q.eq("gameId", round.gameId))
      .collect();
    const voters = participants.filter((p) => p.role === "voter");

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_roundId", (q) => q.eq("roundId", args.roundId))
      .collect();

    // Auto-reveal if all voters have voted
    if (votes.length >= voters.length && voters.length > 0) {
      await ctx.db.patch(args.roundId, {
        status: "revealed",
        revealedAt: Date.now(),
      });

      await ctx.db.patch(round.gameId, {
        status: "revealed",
      });
    }

    return voteId;
  },
});

export const remove = mutation({
  args: {
    roundId: v.id("rounds"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");
    if (round.status === "revealed") {
      throw new Error("Cannot change vote on a revealed round");
    }

    const existing = await ctx.db
      .query("votes")
      .withIndex("by_roundId_participantId", (q) =>
        q
          .eq("roundId", args.roundId)
          .eq("participantId", args.participantId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getForRound = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) return [];

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_roundId", (q) => q.eq("roundId", args.roundId))
      .collect();

    // If round is not revealed, hide the actual values
    if (round.status !== "revealed") {
      return votes.map((vote) => ({
        ...vote,
        value: -1, // Hidden
      }));
    }

    return votes;
  },
});

export const getMyVote = query({
  args: {
    roundId: v.id("rounds"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("votes")
      .withIndex("by_roundId_participantId", (q) =>
        q
          .eq("roundId", args.roundId)
          .eq("participantId", args.participantId),
      )
      .first();
  },
});

export const getStats = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "revealed") return null;

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_roundId", (q) => q.eq("roundId", args.roundId))
      .collect();

    if (votes.length === 0) return null;

    const values = votes.map((v) => v.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Build distribution
    const distribution: Record<string, number> = {};
    for (const val of values) {
      const key = String(val);
      distribution[key] = (distribution[key] ?? 0) + 1;
    }

    // Check consensus (all same value)
    const uniqueValues = new Set(values);
    const isConsensus = uniqueValues.size === 1;

    // Agreement percentage (most common value / total)
    let maxCount = 0;
    for (const count of Object.values(distribution)) {
      if (count > maxCount) maxCount = count;
    }
    const agreementPercent = Math.round((maxCount / values.length) * 100);

    return {
      average: Math.round(avg * 10) / 10,
      min,
      max,
      totalVotes: votes.length,
      distribution,
      isConsensus,
      agreementPercent,
    };
  },
});
