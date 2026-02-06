"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "planning-poker-session-id";

function generateId(): string {
  return crypto.randomUUID();
}

export function useSessionId(): string | null {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(SESSION_KEY, id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
