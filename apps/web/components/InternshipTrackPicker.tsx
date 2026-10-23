"use client";

import { useState } from "react";
import { BookOpen, Clock } from "lucide-react";
import { InternshipForm } from "@/components/InternshipForm";
import { InternshipCurriculumModal } from "@/components/InternshipCurriculumModal";
import { TRACK_CURRICULUM } from "@/lib/internship-curriculum";

interface InternshipTrackOption {
  id: string;
  title: string;
  duration: string;
  description: string;
}

// Wraps the "Choose your track" cards and the application form below them so the two
// can share one piece of state — clicking a card jumps to #apply and pre-fills the
// form's track dropdown, and picking a track directly from the dropdown highlights the
// matching card back. Everything between the cards and the form (roadmap, benefits,
// deliverables, assessment) stays server-rendered, passed through as `children` — this
// client boundary only wraps the two pieces that actually need to talk to each other.
export function InternshipTrackPicker({
  tracks,
  children,
}: {
  tracks: InternshipTrackOption[];
  children?: React.ReactNode;
}) {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [curriculumTrack, setCurriculumTrack] = useState<InternshipTrackOption | null>(null);

  function goToApply(title: string) {
    setSelectedTrack(title);
    setCurriculumTrack(null);
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleCardClick(track: InternshipTrackOption) {
    if (TRACK_CURRICULUM[track.title]) {
      setCurriculumTrack(track);
    } else {
      goToApply(track.title);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
          Choose your track
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => {
            const isSelected = selectedTrack === track.title;
            const hasCurriculum = !!TRACK_CURRICULUM[track.title];
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => handleCardClick(track)}
                aria-pressed={isSelected}
                className={`bg-card ring-offset-background focus-visible:ring-ring hover:border-primary/60 flex cursor-pointer flex-col gap-3 rounded-2xl border p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isSelected ? "border-primary ring-primary/40 ring-2" : ""
                }`}
              >
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  {track.duration}
                </span>
                <h3 className="text-lg font-bold leading-snug">{track.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{track.description}</p>
                {hasCurriculum && (
                  <span className="text-primary mt-auto flex items-center gap-1.5 pt-1 text-xs font-semibold">
                    <BookOpen className="h-3.5 w-3.5" />
                    View curriculum
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <InternshipCurriculumModal
        track={curriculumTrack}
        open={curriculumTrack !== null}
        onOpenChange={(open) => !open && setCurriculumTrack(null)}
        onApply={() => curriculumTrack && goToApply(curriculumTrack.title)}
      />

      {children}

      <div id="apply" className="scroll-mt-20">
        <h2 className="mb-6 text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
          Apply now
        </h2>
        <InternshipForm
          tracks={tracks.map((t) => ({ id: t.id, title: t.title }))}
          selectedTrack={selectedTrack}
          onTrackChange={setSelectedTrack}
        />
      </div>
    </>
  );
}
