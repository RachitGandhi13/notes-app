// Static config for the training gallery. Photos live in
// public/images/gallery/ and are tracked in git (unlike apps/*/public/uploads/,
// which is gitignored) so they're bundled into the production build and
// actually render on the deployed site — this gallery is public-facing.

export interface GalleryItem {
  id: string;
  /** Path under public/, e.g. "/images/gallery/training-1.jpg". */
  src: string;
  title: string;
  description: string;
  category: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /**
   * Bump this whenever the file at `src` is replaced in place (same filename,
   * new content) — the browser's and Next's own image caches key on the URL,
   * so an unchanged `src` with new bytes underneath it can keep serving the
   * old photo until this changes. New items can omit it (defaults to 1).
   */
  version?: number;
}

// Real photos the client supplied. Renumbered 1-12 after the original
// photo 1 (faculty felicitation) was removed — every src/version below was
// bumped because each filename now points at different bytes than before
// (previously-viewed browsers/caches could otherwise still show the old
// photo that used to live at that path). Dates for items 4, 5, 8, 9 and 11
// had no visible timestamp in the source photo and are estimated from nearby
// dated photos at the same venue — confirm/correct these with the client if
// the exact dates matter.
export const galleryItems: GalleryItem[] = [
  {
    id: "1",
    src: "/images/gallery/training-1.jpg",
    title: "Live coding session at SRM",
    description: "A hands-on coding exercise in progress at the SRM lab.",
    category: "Hands-on Lab",
    date: "2026-06-03",
    version: 2,
  },
  {
    id: "2",
    src: "/images/gallery/training-2.jpg",
    title: "Lab session at SRM Tech Park",
    description: "Students working through exercises on their own machines during a lab session.",
    category: "Hands-on Lab",
    date: "2026-06-01",
    version: 2,
  },
  {
    id: "3",
    src: "/images/gallery/training-3.jpg",
    title: "DevOps fundamentals lecture in Kalaburagi",
    description:
      "Covering the preface to DevOps: the waterfall and agile models, and why DevOps, at Kalaburagi, Karnataka.",
    category: "Classroom",
    date: "2025-07-06",
    version: 2,
  },
  {
    id: "4",
    src: "/images/gallery/training-4.jpg",
    title: "Guided lab session at SRM",
    description: "Walking the batch through an exercise at the SRM lab.",
    category: "Hands-on Lab",
    date: "2026-06-08",
    version: 2,
  },
  {
    id: "5",
    src: "/images/gallery/training-5.jpg",
    title: "Batch photo with our trainees",
    description: "A group photo with a full batch of trainees after a session.",
    category: "Event",
    date: "2026-06-10",
    version: 2,
  },
  {
    id: "6",
    src: "/images/gallery/training-6.jpg",
    title: "SRM lab wrap-up",
    description: "Closing out a training collaboration with the team.",
    category: "Event",
    date: "2026-06-12",
    version: 2,
  },
  {
    id: "7",
    src: "/images/gallery/training-7.jpg",
    title: "Project evaluation in Kusnur, Karnataka",
    description: "Reviewing a student project build during an on-site evaluation.",
    category: "Event",
    date: "2026-08-21",
    version: 2,
  },
  {
    id: "8",
    src: "/images/gallery/training-8.jpg",
    title: "Smart India Hackathon 2026 prize distribution",
    description:
      "Recognising a winning team at the Smart India Hackathon 2026 internal round, Kusnur, Karnataka.",
    category: "Hackathon",
    date: "2026-08-21",
    version: 2,
  },
  {
    id: "9",
    src: "/images/gallery/training-9.jpg",
    title: "Inside the SRM lab",
    description: "A full batch at work across the SRM lab.",
    category: "Hands-on Lab",
    date: "2026-06-04",
    version: 2,
  },
  {
    id: "10",
    src: "/images/gallery/training-10.jpg",
    title: "Python fundamentals session at SRM",
    description: "Walking through data types and operators during a Python fundamentals session.",
    category: "Hands-on Lab",
    date: "2026-06-06",
    version: 2,
  },
  {
    id: "11",
    src: "/images/gallery/training-11.jpg",
    title: "Classroom session in Kalaburagi",
    description: "A full classroom following along during a training session at Kalaburagi.",
    category: "Classroom",
    date: "2025-04-28",
    version: 2,
  },
  {
    id: "12",
    src: "/images/gallery/training-12.jpg",
    title: "Full lab session at SRM",
    description: "A full batch working at their stations during a lab session.",
    category: "Hands-on Lab",
    date: "2026-06-07",
    version: 2,
  },
];
