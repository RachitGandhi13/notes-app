interface Application {
  id: string;
  fullName: string;
  email: string;
  usn: string;
  internshipTrack: string;
  preferredDuration: string;
  preferredStartDate: string;
  createdAt: Date;
}

export function InternshipApplicationsList({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return <p className="text-muted-foreground text-sm">No applications yet.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border text-sm">
      {applications.map((app) => (
        <li key={app.id} className="space-y-1 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{app.fullName}</p>
            <span className="text-muted-foreground text-xs">
              {new Date(app.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            {app.email} · {app.usn}
          </p>
          <p className="text-xs">
            {app.internshipTrack} · {app.preferredDuration} · starts {app.preferredStartDate}
          </p>
        </li>
      ))}
    </ul>
  );
}
