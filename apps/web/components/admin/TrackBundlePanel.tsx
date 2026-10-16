"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { setTrackBundle } from "@/lib/track-actions";

interface BundlableCourse {
  id: string;
  title: string;
  price: number;
  slug: string;
}

interface TrackBundlePanelProps {
  trackId: string;
  allCourses: BundlableCourse[];
  linkedCourseIds: string[];
  bundlePrice: number | null;
}

const inputClass =
  "border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2";

// Admin-only, in-page (same place SectionAdminPanel lives) — lets the admin
// turn this track into a purchasable combo by picking any number of existing
// courses and a bundle price. Saving replaces the whole linked-course set,
// rather than adding/removing one at a time, since the set is small and a
// checkbox list already shows the full picture at a glance.
export function TrackBundlePanel({
  trackId,
  allCourses,
  linkedCourseIds,
  bundlePrice,
}: TrackBundlePanelProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(linkedCourseIds));
  const [price, setPrice] = useState(bundlePrice != null ? String(bundlePrice) : "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function toggle(courseId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  const originalTotal = allCourses
    .filter((c) => selected.has(c.id))
    .reduce((sum, c) => sum + c.price, 0);
  const priceNumber = Number(price) || 0;
  const savings = originalTotal - priceNumber;

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await setTrackBundle(trackId, {
        courseIds: [...selected],
        bundlePrice: selected.size > 0 ? priceNumber : null,
      });
      setMessage({ ok: true, text: "Saved." });
      router.refresh();
    } catch (err: any) {
      setMessage({ ok: false, text: err?.message ?? "Couldn't save." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Package className="h-4 w-4" /> Combo bundle
      </h3>
      <p className="text-muted-foreground text-xs">
        Pick the courses this track bundles and set a combo price. Buying the combo grants every
        course checked below; owning any one of them also unlocks this track. Leave everything
        unchecked to keep this track free.
      </p>

      {allCourses.length === 0 ? (
        <p className="text-muted-foreground text-xs">No courses exist yet to bundle.</p>
      ) : (
        <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
          {allCourses.map((course) => (
            <li key={course.id}>
              <label className="hover:bg-accent flex min-h-9 cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(course.id)}
                  onChange={() => toggle(course.id)}
                  className="accent-primary h-4 w-4 shrink-0"
                />
                <span className="flex-1 truncate">{course.title}</span>
                <span className="text-muted-foreground shrink-0 text-xs">₹{course.price}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {selected.size > 0 && (
        <div className="space-y-2">
          <div className="space-y-1">
            <label htmlFor="bundle-price" className="text-xs font-medium">
              Combo price (₹)
            </label>
            <input
              id="bundle-price"
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Original total ₹{originalTotal}
            {priceNumber > 0 && savings > 0 && (
              <span className="text-primary font-medium"> · students save ₹{savings}</span>
            )}
            {priceNumber > 0 && savings <= 0 && (
              <span className="text-destructive font-medium">
                {" "}
                · combo price isn&apos;t cheaper than buying separately
              </span>
            )}
          </p>
        </div>
      )}

      {message && (
        <p
          className={`text-xs ${message.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || (selected.size > 0 && priceNumber <= 0)}
        className="bg-primary text-primary-foreground rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save combo settings"}
      </button>
    </div>
  );
}
