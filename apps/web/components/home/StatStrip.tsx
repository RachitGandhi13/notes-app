// Real, publicly-safe numbers only — no enrollment/student counts here (see
// the comment on the homepage's own `stats` array: that's deliberate, an
// admin-only metric).
export function StatStrip({
  courseCount,
  trackCount,
}: {
  courseCount: number;
  trackCount: number;
}) {
  const stats = [
    { value: String(courseCount), label: courseCount === 1 ? "Course" : "Courses" },
    {
      value: String(trackCount),
      label: trackCount === 1 ? "Internship track" : "Internship tracks",
    },
    { value: "7+", label: "Years of industry experience" },
  ];

  return (
    <section className="container py-10 sm:py-14">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl border p-6 text-center sm:p-8">
            <p className="text-primary text-4xl font-extrabold tracking-tight sm:text-5xl">
              {s.value}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
