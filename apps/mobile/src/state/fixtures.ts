import type { DancerTraits, PublicPlayerSummary } from "@grille/shared";

export interface CharFixture {
  id: string;
  name: string;
  traits: DancerTraits;
}

/** Same fixture roster as the host app's mock state, so a side-by-side dev check
 * (host tab + mobile tab) shows a consistent lobby. */
export const CHAR_FIXTURES: CharFixture[] = [
  { id: "marin", name: "Marin", traits: { skin: "#8A5A3B", hairColor: "#1C1519", hair: "afro", outfit: "#FFB34D", pants: "#2B2136", acc: "glasses" } },
  { id: "lila", name: "Lila", traits: { skin: "#F5CFA8", hairColor: "#F7A8B8", hair: "long", outfit: "#4A3557", pants: "#E8553F", acc: "hoops" } },
  { id: "noe", name: "Noé", traits: { skin: "#C98B5E", hairColor: "#2B1D18", hair: "buzz", outfit: "#FF6B5A", pants: "#2B2136", acc: "cap" } },
  { id: "salome", name: "Salomé", traits: { skin: "#6E4227", hairColor: "#1C1519", hair: "bun", outfit: "#FFF3E8", pants: "#4A3557", acc: "none" } },
  { id: "theo", name: "Théo", traits: { skin: "#F0C39A", hairColor: "#C9803A", hair: "curly", outfit: "#E8553F", pants: "#2B2136", acc: "headphones" } },
  { id: "ava", name: "Ava", traits: { skin: "#A9714A", hairColor: "#3A2A33", hair: "ponytail", outfit: "#F7A8B8", pants: "#2B2136", acc: "glasses" } },
  { id: "kenza", name: "Kenza", traits: { skin: "#E0A97B", hairColor: "#1F1720", hair: "bob", outfit: "#FFCE85", pants: "#4A3557", acc: "hoops" } },
  { id: "basile", name: "Basile", traits: { skin: "#F7DCC0", hairColor: "#E6C28A", hair: "bob", outfit: "#4A3557", pants: "#2B2136", acc: "cap" } },
];

export function toPublicPlayer(c: CharFixture, overrides: Partial<PublicPlayerSummary> = {}): PublicPlayerSummary {
  return { id: c.id, name: c.name, status: "READY", traits: c.traits, score: 0, connected: true, isLeader: false, ...overrides };
}
