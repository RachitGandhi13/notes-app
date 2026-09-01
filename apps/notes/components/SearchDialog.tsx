"use client";

import { Dialog, DialogContent } from "@repo/ui";
import Fuse from "fuse.js";
import { Mic, MicOff, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { searchOpenAtom } from "@repo/store";
import { semanticSearch } from "@/lib/actions";
import type { SearchResult } from "@/lib/search";

interface Track {
  id: string;
  title: string;
  description: string;
  categories: { category: { category: string } }[];
}

interface SearchDialogProps {
  tracks: Track[];
}

type Tab = "fuzzy" | "ai";

export function SearchDialog({ tracks }: SearchDialogProps) {
  const [open, setOpen] = useRecoilState(searchOpenAtom);
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [tab, setTab] = useState<Tab>("fuzzy");
  const [aiResults, setAiResults] = useState<SearchResult[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ctrl/Cmd + K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(""); setAiResults([]); setTab("fuzzy"); }
  }, [open]);

  // Fuse.js fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(tracks, {
        keys: ["title", "description", "categories.category.category"],
        threshold: 0.4,
      }),
    [tracks]
  );

  const fuzzyResults = query.trim() ? fuse.search(query).map((r) => r.item) : tracks.slice(0, 6);

  // Debounced AI search — only fires when on AI tab
  useEffect(() => {
    if (tab !== "ai" || !query.trim()) {
      setAiResults([]);
      return;
    }
    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    aiDebounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const res = await semanticSearch(query.trim());
        setAiResults(res);
      } catch {
        setAiResults([]);
      } finally {
        setAiLoading(false);
      }
    }, 500);
    return () => {
      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    };
  }, [query, tab]);

  // Voice input
  function toggleVoice() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (listening) {
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      setQuery(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  }

  function handleSelectTrack(trackId: string) {
    setOpen(false);
    router.push(`/tracks/${trackId}`);
  }

  function handleSelectProblem(trackId: string, problemId: string) {
    setOpen(false);
    router.push(`/tracks/${trackId}/${problemId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracks…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={toggleVoice}
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={listening ? "Stop listening" : "Voice search"}
          >
            {listening ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b text-sm">
          {(["fuzzy", "ai"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${
                tab === t
                  ? "border-b-2 border-primary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "ai" && <Sparkles className="h-3.5 w-3.5" />}
              {t === "fuzzy" ? "Fuzzy" : "AI Search"}
            </button>
          ))}
        </div>

        {/* Results */}
        <ul className="max-h-72 overflow-y-auto p-1">
          {tab === "fuzzy" ? (
            fuzzyResults.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">No tracks found.</li>
            ) : (
              fuzzyResults.map((track) => (
                <li key={track.id}>
                  <button
                    onClick={() => handleSelectTrack(track.id)}
                    className="w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <p className="text-sm font-medium">{track.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{track.description}</p>
                  </button>
                </li>
              ))
            )
          ) : aiLoading ? (
            <li className="py-6 text-center text-sm text-muted-foreground">Searching…</li>
          ) : !query.trim() ? (
            <li className="py-6 text-center text-sm text-muted-foreground">
              Type to search with AI semantic matching.
            </li>
          ) : aiResults.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted-foreground">No results found.</li>
          ) : (
            aiResults.map((r) => (
              <li key={r.payload.problemId}>
                <button
                  onClick={() => handleSelectProblem(r.payload.trackId, r.payload.problemId)}
                  className="w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{r.payload.problemTitle}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {Math.round(r.score * 100)}% match
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{r.payload.trackTitle}</p>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          <kbd className="rounded border px-1 py-0.5 font-mono text-xs">↑↓</kbd> navigate &nbsp;
          <kbd className="rounded border px-1 py-0.5 font-mono text-xs">↵</kbd> select &nbsp;
          <kbd className="rounded border px-1 py-0.5 font-mono text-xs">esc</kbd> close
        </div>
      </DialogContent>
    </Dialog>
  );
}
