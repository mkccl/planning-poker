import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const join = mutation({
  args: {
    gameId: v.id("games"),
    displayName: v.string(),
    role: v.union(v.literal("voter"), v.literal("spectator")),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already a participant
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_gameId_sessionId", (q) =>
        q.eq("gameId", args.gameId).eq("sessionId", args.sessionId),
      )
      .first();

    if (existing) {
      // Update name/role and mark online
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        role: args.role,
        isOnline: true,
      });
      return existing._id;
    }

    return ctx.db.insert("participants", {
      gameId: args.gameId,
      displayName: args.displayName,
      role: args.role,
      sessionId: args.sessionId,
      isOnline: true,
    });
  },
});

export const list = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("participants")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

export const getMe = query({
  args: {
    gameId: v.id("games"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("participants")
      .withIndex("by_gameId_sessionId", (q) =>
        q.eq("gameId", args.gameId).eq("sessionId", args.sessionId),
      )
      .first();
  },
});

export const updatePresence = mutation({
  args: {
    participantId: v.id("participants"),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.participantId, {
      isOnline: args.isOnline,
    });
  },
});
