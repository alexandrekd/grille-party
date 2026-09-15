import type { DancerTraits, PublicPlayerSummary } from "@grille/shared";

export interface CharFixture {
  id: string;
  name: string;
  traits: DancerTraits;
  score: number;
}

/** Same 8 fixture characters as the DA mockup, for a faithful side-by-side visual
 * check against `Grille - Identite visuelle.dc.html` while the real server (task 7)
 * isn't wired up yet. */
export const CHAR_FIXTURES: CharFixture[] = [
  {
    id: "marin",
    name: "Marin",
    traits: { skin: "#8A5A3B", hairColor: "#1C1519", hair: "afro", outfit: "#FFB34D", pants: "#2B2136", acc: "glasses" },
    score: 780,
  },
  {
    id: "lila",
    name: "Lila",
    traits: { skin: "#F5CFA8", hairColor: "#F7A8B8", hair: "long", outfit: "#4A3557", pants: "#E8553F", acc: "hoops" },
    score: 360,
  },
  {
    id: "noe",
    name: "Noé",
    traits: { skin: "#C98B5E", hairColor: "#2B1D18", hair: "buzz", outfit: "#FF6B5A", pants: "#2B2136", acc: "cap" },
    score: 300,
  },
  {
    id: "salome",
    name: "Salomé",
    traits: { skin: "#6E4227", hairColor: "#1C1519", hair: "bun", outfit: "#FFF3E8", pants: "#4A3557", acc: "none" },
    score: 480,
  },
  {
    id: "theo",
    name: "Théo",
    traits: { skin: "#F0C39A", hairColor: "#C9803A", hair: "curly", outfit: "#E8553F", pants: "#2B2136", acc: "headphones" },
    score: 540,
  },
  {
    id: "ava",
    name: "Ava",
    traits: { skin: "#A9714A", hairColor: "#3A2A33", hair: "ponytail", outfit: "#F7A8B8", pants: "#2B2136", acc: "glasses" },
    score: 620,
  },
  {
    id: "kenza",
    name: "Kenza",
    traits: { skin: "#E0A97B", hairColor: "#1F1720", hair: "bob", outfit: "#FFCE85", pants: "#4A3557", acc: "hoops" },
    score: 420,
  },
  {
    id: "basile",
    name: "Basile",
    traits: { skin: "#F7DCC0", hairColor: "#E6C28A", hair: "bob", outfit: "#4A3557", pants: "#2B2136", acc: "cap" },
    score: 240,
  },
];

export function byId(id: string): CharFixture {
  const c = CHAR_FIXTURES.find((f) => f.id === id);
  if (!c) throw new Error(`unknown fixture char ${id}`);
  return c;
}

export function toPublicPlayer(c: CharFixture, overrides: Partial<PublicPlayerSummary> = {}): PublicPlayerSummary {
  return {
    id: c.id,
    name: c.name,
    status: "READY",
    traits: c.traits,
    score: c.score,
    connected: true,
    ...overrides,
  };
}
