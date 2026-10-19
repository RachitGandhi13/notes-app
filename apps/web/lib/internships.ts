// Internship Program applications. There is no database table for this yet —
// the form posts straight to the client's own Google Apps Script Web App,
// which logs each submission as a row in a Google Sheet. That script is the
// system of record, not this app.

export const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzuUM_xe_0PwJ3uAFafSABasc_84lvCmuoomi3-CRunlO-blEFq1AV9BlJRQl294gIP4A/exec";

export interface InternshipTrack {
  title: string;
  duration: string;
  description: string;
}

// The 3 official programs. INTERNSHIP_TRACK_OPTIONS (the form dropdown) is derived from
// this list's titles, so the two can never drift out of sync.
export const INTERNSHIP_TRACKS: InternshipTrack[] = [
  {
    title: "AWS Cloud Engineering Internship",
    duration: "4 Weeks",
    description:
      "Learn cloud fundamentals, IAM, VPC, EC2, S3, Lambda, databases, monitoring, security, and deploying applications on AWS.",
  },
  {
    title: "DevOps & Automation Internship",
    duration: "4 Weeks",
    description:
      "Learn Git, CodeCommit/GitHub, Linux, Jenkins, Docker, Terraform, CI/CD pipelines, containers, and automated deployments.",
  },
  {
    title: "AI & Cloud Application Development Internship",
    duration: "4 Weeks",
    description:
      "Learn Python-based automation, generative AI fundamentals, API integration, AI-powered applications, and cloud deployment.",
  },
];

export const INTERNSHIP_TRACK_OPTIONS = INTERNSHIP_TRACKS.map((t) => t.title);

export interface RoadmapWeek {
  week: string;
  title: string;
  description: string;
}

export const INTERNSHIP_ROADMAP: RoadmapWeek[] = [
  {
    week: "Week 1",
    title: "Foundations & Environment Setup",
    description:
      "Concepts, tool installation, Git workflows, Linux basics, cloud fundamentals, IAM & secure lab access.",
  },
  {
    week: "Week 2",
    title: "Core Technology Labs",
    description: "Hands-on AWS/DevOps/AI tools, configuration & troubleshooting.",
  },
  {
    week: "Week 3",
    title: "Real-World Mini-Project",
    description: "Build and test a solution, write documentation, manage work in Git.",
  },
  {
    week: "Week 4",
    title: "Deployment, Evaluation & Career Readiness",
    description: "Project completion, demo, assessment, resume guidance, certificate eligibility.",
  },
];

// "Practical Cloud Lab Experience" is deliberately not listed publicly here — the client
// asked not to advertise lab-account provisioning. "Video Library Access" replaces it.
export const PROGRAM_BENEFITS = [
  "Hands-on Technical Training",
  "Industry-Relevant Projects",
  "Project Repository & Documentation",
  "Mentoring & Doubt-Clearing Sessions",
  "Internship Certificate",
  "Resume & Portfolio Development",
  "Interview Preparation",
  "Final Project Presentation",
  "Video Library Access",
];

export const PROGRAM_DELIVERABLES = [
  "Completed technical project",
  "Setup repository & docs",
  "Practical tool mastery",
  "Project presentation & assessment score",
  "Resume-ready project description",
  "CloudVidya Internship Certificate",
  "Clear certification roadmap",
];

export const DURATION_OPTIONS = ["1 Month", "2 Months", "3 Months", "6 Months"] as const;

export const YEAR_OF_STUDY_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Graduated",
] as const;

export interface InternshipApplication {
  fullName: string;
  email: string;
  phone: string;
  usn: string;
  college: string;
  branch: string;
  yearOfStudy: string;
  internshipTrack: string;
  preferredDuration: string;
  preferredStartDate: string;
  linkedIn: string;
  resumeLink: string;
}

export const EMPTY_APPLICATION: InternshipApplication = {
  fullName: "",
  email: "",
  phone: "",
  usn: "",
  college: "",
  branch: "",
  yearOfStudy: "",
  internshipTrack: "",
  preferredDuration: "",
  preferredStartDate: "",
  linkedIn: "",
  resumeLink: "",
};

/** Shared by the certificate component, the profile page and the public verify page. */
export function formatCertificateDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}
