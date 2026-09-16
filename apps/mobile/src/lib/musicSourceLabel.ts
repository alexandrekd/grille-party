import type { MusicSource } from "@grille/shared";

/** The reveal's "Top N de {name}" stat, phrased to match whichever music source
 * the leader picked — see MusicSource's doc comment. */
export function rankLabel(source: MusicSource, rank: number, name: string): string {
  switch (source) {
    case "alltime":
      return `Top ${rank} de tous les temps de ${name}`;
    case "onrepeat":
      return `Top ${rank} en boucle chez ${name}`;
    case "recent":
    default:
      return `Top ${rank} du mois de ${name}`;
  }
}
