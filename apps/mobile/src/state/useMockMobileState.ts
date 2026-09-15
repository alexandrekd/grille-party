import { useCallback, useMemo, useState } from "react";
import type { DancerTraits, HairStyle, AccessoryType } from "@grille/shared";
import {
  HAIR_STYLES,
  SKIN_SWATCHES,
  OUTFIT_SWATCHES,
  ACCESSORIES,
  DEFAULT_TRAITS,
} from "@grille/shared";
import { CHAR_FIXTURES, toPublicPlayer } from "./fixtures.js";

const MOCK_TOTAL_VOTE_MS = 20_000;

export type MobileScreen =
  | "JOIN"
  | "SPOTIFY"
  | "EDITOR"
  | "WAITING"
  | "VOTE"
  | "RESULT"
  | "LEADERBOARD"
  | "GAME_OVER";

const OWNER_ID = "salome";
const ME_ID = "me";

export interface VoteCard {
  id: string;
  name: string;
  traits: DancerTraits;
  selected: boolean;
  reaction: "dance" | "surprise";
}

/**
 * Hand-steppable mock for the mobile controller — local UI state for the
 * pre-join/pre-ready steps (matching how the real app will layer local state over
 * `useMobileSocket()`, since join/Spotify/character-creation happen before the
 * server has anything to broadcast back). Screens don't change when this is later
 * swapped for the real hook.
 */
export function useMockMobileState() {
  const [screen, setScreen] = useState<MobileScreen>("JOIN");
  const [code, setCode] = useState("");
  const [hair, setHair] = useState<HairStyle>(DEFAULT_TRAITS.hair);
  const [skin, setSkin] = useState(DEFAULT_TRAITS.skin);
  const [outfit, setOutfit] = useState(DEFAULT_TRAITS.outfit);
  const [acc, setAcc] = useState<AccessoryType>(DEFAULT_TRAITS.acc);
  const [name, setName] = useState("");
  const [vote, setVote] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [deadline] = useState(() => Date.now() + MOCK_TOTAL_VOTE_MS);

  const draftTraits: DancerTraits = useMemo(
    () => ({ skin, hairColor: DEFAULT_TRAITS.hairColor, hair, outfit, pants: DEFAULT_TRAITS.pants, acc }),
    [skin, hair, outfit, acc],
  );

  const submitJoin = useCallback(() => setScreen("SPOTIFY"), []);
  const submitSpotify = useCallback(() => setScreen("EDITOR"), []);
  const skipSpotify = useCallback(() => setScreen("EDITOR"), []);
  const submitCharacter = useCallback(() => setScreen("WAITING"), []);
  const devGoTo = useCallback((s: MobileScreen) => setScreen(s), []);

  // 7 fixture friends + "you" = a believable 8-player room (matching the DA's 2x4
  // vote grid) rather than 8 fixtures + you = 9, which would overflow a 5th row.
  const roster = useMemo(
    () => [
      ...CHAR_FIXTURES.filter((c) => c.id !== ME_ID && c.id !== OWNER_ID).slice(0, 6),
      CHAR_FIXTURES.find((c) => c.id === OWNER_ID)!,
      { id: ME_ID, name: name || "Toi", traits: draftTraits },
    ],
    [name, draftTraits],
  );

  const voteCards: VoteCard[] = useMemo(
    () =>
      roster.map((c) => ({
        id: c.id,
        name: c.name,
        traits: c.traits,
        selected: c.id === vote,
        reaction: c.id === vote ? "surprise" : "dance",
      })),
    [roster, vote],
  );

  const toggleVote = useCallback(
    (id: string) => {
      if (locked) return;
      setVote((v) => (v === id ? null : id));
    },
    [locked],
  );

  const sendVote = useCallback(() => {
    if (!vote) return;
    setLocked(true);
  }, [vote]);

  const changeMind = useCallback(() => setLocked(false), []);

  const lobbyChars = useMemo(() => CHAR_FIXTURES.slice(0, 5).map((c) => toPublicPlayer(c)), []);

  // Fixed demo outcome for the round-result screen: "you" voted for the owner
  // correctly. Real per-player outcome comes from the server's `round_resolved` in
  // the WebSocket milestone.
  const myOutcome = useMemo(
    () => ({
      ownerName: CHAR_FIXTURES.find((c) => c.id === OWNER_ID)?.name ?? "Salomé",
      wasOwner: false,
      guessedCorrectly: vote === OWNER_ID || vote === null,
      pointsDelta: vote === OWNER_ID || vote === null ? 10 : 0,
      myTraits: draftTraits,
      myName: name || "Toi",
    }),
    [vote, draftTraits, name],
  );

  const standings = useMemo(() => {
    const scores: Record<string, number> = {
      marin: 780,
      ava: 620,
      theo: 540,
      salome: 480,
      kenza: 420,
      lila: 360,
      noe: 300,
      basile: 240,
    };
    return [...CHAR_FIXTURES]
      .map((c) => ({ playerId: c.id, name: c.name, score: scores[c.id] ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }, []);

  return {
    screen,
    code,
    setCode,
    submitJoin,
    submitSpotify,
    skipSpotify,
    hairOptions: HAIR_STYLES,
    skinOptions: SKIN_SWATCHES,
    outfitOptions: OUTFIT_SWATCHES,
    accOptions: ACCESSORIES,
    hair,
    setHair,
    skin,
    setSkin,
    outfit,
    setOutfit,
    acc,
    setAcc,
    name,
    setName,
    draftTraits,
    submitCharacter,
    lobbyChars,
    voteCards,
    vote,
    toggleVote,
    sendVote,
    locked,
    changeMind,
    votingDeadlineTs: deadline,
    myOutcome,
    standings,
    devGoTo,
  };
}
