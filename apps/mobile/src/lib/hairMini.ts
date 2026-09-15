import type { HairStyle } from "@grille/shared";

/** Ported verbatim from the `MINI` lookup in `project/Grille - Ecrans mobiles.dc.html`
 * — small hand-tuned hair-shape geometry sized for a 46x46 picker tile (distinct
 * from the full-size `HAIR` table in packages/characters, which is for the actual
 * character). */
export const MINI: Record<HairStyle, string> = {
  afro: "left:5px;top:2px;width:38px;height:26px;border-radius:50%",
  long: "left:7px;top:5px;width:34px;height:36px;border-radius:17px 17px 8px 8px",
  buzz: "left:10px;top:7px;width:28px;height:12px;border-radius:9px 9px 2px 2px",
  bun: "left:8px;top:4px;width:32px;height:20px;border-radius:16px 16px 4px 4px",
  curly: "left:4px;top:3px;width:40px;height:24px;border-radius:50%",
  ponytail: "left:8px;top:4px;width:32px;height:20px;border-radius:16px 16px 4px 4px",
  bob: "left:7px;top:4px;width:34px;height:28px;border-radius:17px 17px 9px 9px",
};
