import type { BadgeDef } from "./types";

export const BADGES: BadgeDef[] = [
  {
    id: "first_session",
    name: "First Session",
    description: "Logged your first focused study block.",
  },
  {
    id: "streak_7",
    name: "7 Day Streak",
    description: "Showed up seven days in a row.",
  },
  {
    id: "hours_50",
    name: "50 Hours",
    description: "Crossed fifty hours of deep work.",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Studied after 10:00 PM.",
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Studied every day of the current week.",
  },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.id, b]));

export const STUDY_QUOTES = [
  "Small hours compound into mastery.",
  "Show up. The page will meet you.",
  "Focus is a muscle. You just trained it.",
  "Quiet work today is loud progress tomorrow.",
  "Consistency beats intensity when both cannot stay.",
  "One honest session is better than a perfect plan.",
  "Protect the streak. The rest follows.",
  "Curiosity is the cleanest fuel.",
  "Finish the block. Then rest like you mean it.",
  "The work you repeat becomes the person you are.",
  "Clarity arrives after the first twenty minutes.",
  "Keep the promise you made this morning.",
];

export function quoteForDate(iso: string): string {
  const n = iso.split("-").reduce((acc, part) => acc + Number(part), 0);
  return STUDY_QUOTES[n % STUDY_QUOTES.length] ?? STUDY_QUOTES[0];
}
