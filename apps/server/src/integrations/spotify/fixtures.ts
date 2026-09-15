import { FALLBACK_TRACK_DURATION_MS } from "@grille/shared";
import type { StubTrack } from "./types.js";

/**
 * Fake "top tracks" fixture pool, standing in for real Spotify data whenever a
 * player skips/never finishes Spotify OAuth (see ./stub.ts). Titles are invented,
 * not real songs, so there's no real duration either — every fixture track gets the
 * same fallback duration, sized for up to 8 players x 5 tracks each with room to
 * spare.
 */
export const FIXTURE_TRACKS: StubTrack[] = (
  [
  { id: "t01", title: "Nuit Corail", artist: "Les Voisins du Dessus", coverUrl: "#FF6B5A" },
  { id: "t02", title: "Tempo Ambre", artist: "Salomé & les Spots", coverUrl: "#FFB34D" },
  { id: "t03", title: "Rose Poudré", artist: "Kenza B.", coverUrl: "#F7A8B8" },
  { id: "t04", title: "Piste 3", artist: "Marin Solaire", coverUrl: "#4A3557" },
  { id: "t05", title: "Confetti Party", artist: "DJ Prune", coverUrl: "#FFF3E8" },
  { id: "t06", title: "Danse ou Rougis", artist: "Théo Néon", coverUrl: "#FF6B5A" },
  { id: "t07", title: "Salon Éteint", artist: "Ava & Noé", coverUrl: "#FFB34D" },
  { id: "t08", title: "Grillé au Refrain", artist: "Basile Écho", coverUrl: "#F7A8B8" },
  { id: "t09", title: "Manette en Main", artist: "Lila Groove", coverUrl: "#4A3557" },
  { id: "t10", title: "Dernier Round", artist: "Les Insomniaques", coverUrl: "#FFF3E8" },
  { id: "t11", title: "Écouté en Boucle", artist: "Marin Solaire", coverUrl: "#FF6B5A" },
  { id: "t12", title: "Secret de Playlist", artist: "Salomé & les Spots", coverUrl: "#FFB34D" },
  { id: "t13", title: "Bluff Nocturne", artist: "Kenza B.", coverUrl: "#F7A8B8" },
  { id: "t14", title: "Sous le Strobe", artist: "Théo Néon", coverUrl: "#4A3557" },
  { id: "t15", title: "Titre Mystère", artist: "Ava & Noé", coverUrl: "#FFF3E8" },
  { id: "t16", title: "Pas Moi, Promis", artist: "Basile Écho", coverUrl: "#FF6B5A" },
  { id: "t17", title: "Vote Discret", artist: "Lila Groove", coverUrl: "#FFB34D" },
  { id: "t18", title: "Slow Motion Piste", artist: "Les Insomniaques", coverUrl: "#F7A8B8" },
  { id: "t19", title: "Casque Vissé", artist: "Marin Solaire", coverUrl: "#4A3557" },
  { id: "t20", title: "Playlist Interdite", artist: "DJ Prune", coverUrl: "#FFF3E8" },
  { id: "t21", title: "Refrain Grillant", artist: "Salomé & les Spots", coverUrl: "#FF6B5A" },
  { id: "t22", title: "Basse qui Pulse", artist: "Kenza B.", coverUrl: "#FFB34D" },
  { id: "t23", title: "Anonyme sur la Piste", artist: "Théo Néon", coverUrl: "#F7A8B8" },
  { id: "t24", title: "Fin de Soirée", artist: "Ava & Noé", coverUrl: "#4A3557" },
  { id: "t25", title: "Chuchote le Titre", artist: "Basile Écho", coverUrl: "#FFF3E8" },
  { id: "t26", title: "Sur Écoute", artist: "Lila Groove", coverUrl: "#FF6B5A" },
  { id: "t27", title: "Cachée dans les Écoutes", artist: "Les Insomniaques", coverUrl: "#FFB34D" },
  { id: "t28", title: "Rythme Interdit", artist: "Marin Solaire", coverUrl: "#F7A8B8" },
  { id: "t29", title: "Piste aux Confettis", artist: "DJ Prune", coverUrl: "#4A3557" },
  { id: "t30", title: "Devine qui Chante", artist: "Salomé & les Spots", coverUrl: "#FFF3E8" },
  { id: "t31", title: "Poudre de Rose", artist: "Kenza B.", coverUrl: "#FF6B5A" },
  { id: "t32", title: "Timer qui Tourne", artist: "Théo Néon", coverUrl: "#FFB34D" },
  { id: "t33", title: "Reveal du Round 8", artist: "Ava & Noé", coverUrl: "#F7A8B8" },
  { id: "t34", title: "Écoute Secrète", artist: "Basile Écho", coverUrl: "#4A3557" },
  { id: "t35", title: "Podium de Minuit", artist: "Lila Groove", coverUrl: "#FFF3E8" },
  { id: "t36", title: "Bonus Inaperçu", artist: "Les Insomniaques", coverUrl: "#FF6B5A" },
  { id: "t37", title: "Dernier Vote", artist: "Marin Solaire", coverUrl: "#FFB34D" },
  { id: "t38", title: "Après le Générique", artist: "DJ Prune", coverUrl: "#F7A8B8" },
  { id: "t39", title: "Salle Assombrie", artist: "Salomé & les Spots", coverUrl: "#4A3557" },
  { id: "t40", title: "Le Titre de Qui ?", artist: "Kenza B.", coverUrl: "#FFF3E8" },
  ] satisfies Omit<StubTrack, "durationMs">[]
).map((t) => ({ ...t, durationMs: FALLBACK_TRACK_DURATION_MS }));

export const FIXTURE_PARTITION_SIZE = 5;
