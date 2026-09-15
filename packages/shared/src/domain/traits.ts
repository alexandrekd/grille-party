export const HAIR_STYLES = [
  "afro",
  "long",
  "buzz",
  "bun",
  "curly",
  "ponytail",
  "bob",
] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const ACCESSORIES = [
  { id: "none", label: "∅" },
  { id: "glasses", label: "Lun." },
  { id: "cap", label: "Casq." },
  { id: "headphones", label: "Casque" },
  { id: "hoops", label: "Boucles" },
] as const;
export type AccessoryType = (typeof ACCESSORIES)[number]["id"];

export const REACTIONS = [
  "dance",
  "idle",
  "caught",
  "dodge",
  "laugh",
  "surprise",
  "sad",
  "win",
] as const;
export type Reaction = (typeof REACTIONS)[number];

/** Editor-facing skin swatches (mobile "Ton perso" screen). */
export const SKIN_SWATCHES = [
  "#F7DCC0",
  "#F3C9A2",
  "#C98B5E",
  "#A9714A",
  "#6E4227",
] as const;

/** Hair-color swatches — not exposed as its own editor row in the MVP; used for fixed defaults. */
export const HAIR_COLOR_SWATCHES = [
  "#1C1519",
  "#33242E",
  "#C9803A",
  "#F7A8B8",
  "#E6C28A",
] as const;

export const OUTFIT_SWATCHES = [
  "#FF6B5A",
  "#FFB34D",
  "#F7A8B8",
  "#FFF3E8",
  "#4A3557",
] as const;

/** Pants swatches — not exposed as its own editor row in the MVP; used for fixed defaults. */
export const PANTS_SWATCHES = ["#2B2136", "#4A3557", "#E8553F"] as const;

export interface DancerTraits {
  skin: string;
  hairColor: string;
  hair: HairStyle;
  outfit: string;
  pants: string;
  acc: AccessoryType;
}

export const DEFAULT_TRAITS: DancerTraits = {
  skin: "#8A5A3B",
  hairColor: "#1C1519",
  hair: "afro",
  outfit: "#FFB34D",
  pants: "#2B2136",
  acc: "glasses",
};

export function isHairStyle(value: string): value is HairStyle {
  return (HAIR_STYLES as readonly string[]).includes(value);
}

export function isAccessoryType(value: string): value is AccessoryType {
  return ACCESSORIES.some((a) => a.id === value);
}

/** Validates and normalizes a candidate traits payload (e.g. from `submit_traits`). */
export function validateTraits(candidate: Partial<DancerTraits>): DancerTraits {
  return {
    skin:
      typeof candidate.skin === "string" &&
      (SKIN_SWATCHES as readonly string[]).includes(candidate.skin)
        ? candidate.skin
        : DEFAULT_TRAITS.skin,
    hairColor:
      typeof candidate.hairColor === "string" &&
      (HAIR_COLOR_SWATCHES as readonly string[]).includes(candidate.hairColor)
        ? candidate.hairColor
        : DEFAULT_TRAITS.hairColor,
    hair:
      typeof candidate.hair === "string" && isHairStyle(candidate.hair)
        ? candidate.hair
        : DEFAULT_TRAITS.hair,
    outfit:
      typeof candidate.outfit === "string" &&
      (OUTFIT_SWATCHES as readonly string[]).includes(candidate.outfit)
        ? candidate.outfit
        : DEFAULT_TRAITS.outfit,
    pants:
      typeof candidate.pants === "string" &&
      (PANTS_SWATCHES as readonly string[]).includes(candidate.pants)
        ? candidate.pants
        : DEFAULT_TRAITS.pants,
    acc:
      typeof candidate.acc === "string" && isAccessoryType(candidate.acc)
        ? candidate.acc
        : DEFAULT_TRAITS.acc,
  };
}
