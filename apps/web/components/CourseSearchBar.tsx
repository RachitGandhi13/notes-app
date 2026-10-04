"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function CourseSearchBarInner({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/${params.toString() ? `?${params.toString()}` : ""}#browse`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={compact ? "Search courses" : "Search courses, topics, technologies…"}
        className={`bg-muted/60 border-input focus:ring-ring w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
          compact ? "h-10" : "h-12 text-base"
        }`}
      />
    </form>
  );
}

export function CourseSearchBar({ compact }: { compact?: boolean }) {
  return (
    <Suspense fallback={null}>
      <CourseSearchBarInner compact={compact} />
    </Suspense>
  );
}
