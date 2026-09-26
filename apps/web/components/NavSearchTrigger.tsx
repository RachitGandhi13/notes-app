"use client";

import { Search } from "lucide-react";
import { useRecoilState } from "recoil";
import { searchOpenAtom } from "@repo/store";

export function NavSearchTrigger() {
  const [, setOpen] = useRecoilState(searchOpenAtom);

  return (
    <button
      onClick={() => setOpen(true)}
      className="bg-muted/60 border-input text-muted-foreground hover:text-foreground flex h-10 w-full items-center gap-2 rounded-lg border px-3 text-sm transition-colors"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span>Search tracks</span>
      <kbd className="ml-auto rounded border px-1.5 py-0.5 font-mono text-xs">Ctrl K</kbd>
    </button>
  );
}
