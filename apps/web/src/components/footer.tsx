import { Heart } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex items-center justify-center gap-1.5 border-t px-4 py-3 text-sm text-muted-foreground">
      <span>Made by ccl with</span>
      <Heart className="size-4 fill-red-500 text-red-500" aria-label="love" />
      <span>open source on</span>
      <Link
        href="https://github.com/mkccl/planning-poker"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
      >
        GitHub
      </Link>
    </footer>
  );
}
