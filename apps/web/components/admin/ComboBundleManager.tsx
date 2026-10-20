"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Package } from "lucide-react";
import { createComboBundle, toggleTrackHidden } from "@/lib/track-actions";

interface BundlableCourse {
  id: string;
  title: string;
  price: number;
  slug: string;
}

interface ExistingBundle {
  id: string;
  title: string;
  bundlePrice: number | null;
  hidden: boolean;
  courses: { course: { id: string; title: string } }[];
}

const inputClass =
  "border-input bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2";

// Shortcut for creating a combo bundle directly from Admin -> Courses, instead
// of going through Notes -> create a track -> open it -> Combo bundle
// settings. Creates the underlying Track + TrackCourse links + bundlePrice in
// one step (createComboBundle); further edits (renaming, re-linking courses,
// uploading slides) still happen on the track's own page, same as any other
// track — this is just a faster on-ramp, not a second system.
export function ComboBundleManager({
  allCourses,
  bundles: initialBundles,
}: {
  allCourses: BundlableCourse[];
  bundles: ExistingBundle[];
}) {
  const router = useRouter();
  const [bundles, setBundles] = useState(initialBundles);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [togglingId, setTogglingId] = useState<string | null>(null);

  function toggleCourse(courseId: string) {
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const track = await createComboBundle({
        title,
        description,
        courseIds: [...selected],
        bundlePrice: priceNumber,
      });
      setBundles((prev) => [
        {
          id: track.id,
          title: track.title,
          bundlePrice: priceNumber,
          hidden: false,
          courses: allCourses
            .filter((c) => selected.has(c.id))
            .map((c) => ({ course: { id: c.id, title: c.title } })),
        },
        ...prev,
      ]);
      setTitle("");
      setDescription("");
      setSelected(new Set());
      setPrice("");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't create this combo.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleHidden(bundle: ExistingBundle) {
    setTogglingId(bundle.id);
    try {
      await toggleTrackHidden(bundle.id);
      setBundles((prev) => prev.map((b) => (b.id === bundle.id ? { ...b, hidden: !b.hidden } : b)));
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <Package className="h-4 w-4" /> Combo bundles
      </h2>
      <p className="text-muted-foreground text-sm">
        Combine any of your courses at a discounted price. Buying a combo grants every course in it
        (and each course&apos;s own notes track) in one payment; owning any one of them already
        unlocks the combo&apos;s own track page too. It shows up as a &quot;🔥 Get Special Combo
        Deal&quot; banner on the homepage.
      </p>

      <form onSubmit={handleCreate} className="space-y-3 border-b pb-4">
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="cb-title" className="text-sm font-medium">
              Combo name
            </label>
            <input
              id="cb-title"
              required
              placeholder="e.g. AWS + DevOps + DSA Combo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="cb-description" className="text-sm font-medium">
              Description
            </label>
            <input
              id="cb-description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Courses in this combo</p>
          {allCourses.length === 0 ? (
            <p className="text-muted-foreground text-xs">No courses exist yet.</p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
              {allCourses.map((course) => (
                <li key={course.id}>
                  <label className="hover:bg-accent flex min-h-9 cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.has(course.id)}
                      onChange={() => toggleCourse(course.id)}
                      className="accent-primary h-4 w-4 shrink-0"
                    />
                    <span className="flex-1 truncate">{course.title}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">₹{course.price}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected.size > 0 && (
          <div className="space-y-2">
            <div className="space-y-1">
              <label htmlFor="cb-price" className="text-sm font-medium">
                Combo price (₹)
              </label>
              <input
                id="cb-price"
                type="number"
                min="1"
                required
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

        <button
          type="submit"
          disabled={creating || selected.size < 2}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          title={selected.size < 2 ? "Pick at least 2 courses" : undefined}
        >
          {creating ? "Creating…" : "Create combo"}
        </button>
      </form>

      {bundles.length === 0 ? (
        <p className="text-muted-foreground text-sm">No combos yet — create one above.</p>
      ) : (
        <ul className="divide-y rounded border text-sm">
          {bundles.map((bundle) => (
            <li key={bundle.id} className="flex items-center justify-between gap-4 px-3 py-2.5">
              <div className="min-w-0">
                <p
                  className={`truncate font-medium ${bundle.hidden ? "text-muted-foreground line-through" : ""}`}
                >
                  {bundle.title}
                  {bundle.hidden && (
                    <span className="ml-2 text-xs font-normal no-underline">(hidden)</span>
                  )}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  ₹{bundle.bundlePrice} · {bundle.courses.map((c) => c.course.title).join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => handleToggleHidden(bundle)}
                  disabled={togglingId === bundle.id}
                  className="text-muted-foreground hover:bg-accent rounded p-1.5 disabled:opacity-50"
                  aria-label={bundle.hidden ? "Show combo" : "Hide combo"}
                  title={
                    bundle.hidden
                      ? "Hidden from the homepage banner. Click to show"
                      : "Visible on the homepage banner. Click to hide"
                  }
                >
                  {bundle.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <a
                  href={`/tracks/${bundle.id}`}
                  className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-medium"
                >
                  Open &amp; edit
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
