"use client";

import { Spade } from "lucide-react";
import Link from "next/link";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Spade className="size-5" aria-hidden="true" />
          <span className="text-sm">Planning Poker</span>
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
      <hr />
    </div>
  );
}
