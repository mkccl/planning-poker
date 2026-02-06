import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  games: defineTable({
    name: v.string(),
    votingSystem: v.union(v.literal("fibonacci"), v.literal("power")),
    status: v.union(
      v.literal("lobby"),
      v.literal("voting"),
      v.literal("revealed"),
    ),
    currentTopic: v.optional(v.string()),
    joinCode: v.string(),
    adminSessionId: v.string(),
  })
    .index("by_joinCode", ["joinCode"])
    .index("by_adminSessionId", ["adminSessionId"]),

  participants: defineTable({
    gameId: v.id("games"),
    displayName: v.string(),
    role: v.union(v.literal("voter"), v.literal("spectator")),
    sessionId: v.string(),
    isOnline: v.boolean(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_gameId_sessionId", ["gameId", "sessionId"])
    .index("by_sessionId", ["sessionId"]),

  rounds: defineTable({
    gameId: v.id("games"),
    topic: v.string(),
    status: v.union(v.literal("voting"), v.literal("revealed")),
    revealedAt: v.optional(v.number()),
  })
    .index("by_gameId", ["gameId"])
    .index("by_gameId_status", ["gameId", "status"]),

  votes: defineTable({
    roundId: v.id("rounds"),
    participantId: v.id("participants"),
    value: v.number(),
  })
    .index("by_roundId", ["roundId"])
    .index("by_roundId_participantId", ["roundId", "participantId"]),
});
