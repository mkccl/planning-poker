import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const create = mutation({
  args: {
    name: v.string(),
    votingSystem: v.union(v.literal("fibonacci"), v.literal("power")),
    adminName: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate a unique join code
    let joinCode = generateJoinCode();
    let existing = await ctx.db
      .query("games")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", joinCode))
      .first();
    while (existing) {
      joinCode = generateJoinCode();
      existing = await ctx.db
        .query("games")
        .withIndex("by_joinCode", (q) => q.eq("joinCode", joinCode))
        .first();
    }

    const gameId = await ctx.db.insert("games", {
      name: args.name,
      votingSystem: args.votingSystem,
      status: "lobby",
      joinCode,
      adminSessionId: args.sessionId,
    });

    // Create admin as first participant (voter by default)
    await ctx.db.insert("participants", {
      gameId,
      displayName: args.adminName,
      role: "voter",
      sessionId: args.sessionId,
      isOnline: true,
    });

    return { gameId, joinCode };
  },
});

export const getByJoinCode = query({
  args: { joinCode: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("games")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", args.joinCode))
      .first();
  },
});

export const get = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.gameId);
  },
});
