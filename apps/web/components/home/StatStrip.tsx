// Hero stat row (Step 4c): the first card uses the real course count from
// the same data the home page already loads; the other two are fixed
// marketing lines, not metrics, so they render without a number.
interface StatCard {
  value?: string;
  label: string;
}

export function StatStrip({ courseCount }: { courseCount?: number }) {
  const count = courseCount ?? 3;
  const stats: StatCard[] = [
    { value: String(count), label: count === 1 ? "Course" : "Courses" },
    { label: "Get certified on AWS with cloud experts" },
    { label: "Get trained with real-time industry experts" },
  ];

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-5 md:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-card rounded-2xl border p-6 text-center">
          {s.value && (
            <p className="text-primary text-4xl font-extrabold tracking-tight sm:text-5xl">
              {s.value}
            </p>
          )}
          <p
            className={
              s.value ? "text-muted-foreground mt-2 text-sm" : "text-foreground text-sm font-medium"
            }
          >
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
