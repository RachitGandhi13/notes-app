import { atom } from "recoil";

// ── Shared / UI ────────────────────────────────────────────────────────────────

export const currentViewAtom = atom<"grid" | "list">({
  key: "currentView",
  default: "grid",
});

export const profileSidebarOpenAtom = atom<boolean>({
  key: "profileSidebarOpen",
  default: false,
});

// ── Notes domain ───────────────────────────────────────────────────────────────

export const quizProgressAtom = atom<Record<string, string>>({
  key: "quizProgress",
  default: {},
});

export const trackFilterAtom = atom<string>({
  key: "trackFilter",
  default: "",
});

export const searchOpenAtom = atom<boolean>({
  key: "searchOpen",
  default: false,
});

// ── Video domain ───────────────────────────────────────────────────────────────

export const videoSidebarOpenAtom = atom<boolean>({
  key: "videoSidebarOpen",
  default: true,
});

export const currentContentIdAtom = atom<string | null>({
  key: "currentContentId",
  default: null,
});
