import type { DancerTraits, Reaction } from "@grille/shared";
import { HAIR } from "./hairTable.js";

export interface DancerRenderOptions {
  label?: string;
  showName?: boolean;
  /** 1-6, picks a dance-loop variant (wraps via `((dance-1)%6)+1`). */
  dance?: number;
  /** Overrides the idle dance loop with a contextual reaction pose/animation. */
  reaction?: Reaction;
  /** Negative CSS animation-delay (e.g. `-.21s`) so identical dance numbers desync. */
  delay?: string;
  /** Tempo multiplier — scales animation-duration. */
  speed?: number;
  /** Uniform scale of the 130x250 character box. */
  scale?: number;
  /** Grays out non-winners (brightness/saturate filter). */
  dim?: boolean;
  /** Highlight glow (drop-shadow), used on the revealed character. */
  glow?: boolean;
}

export interface DancerStyles {
  label: string;
  showName: boolean;
  hasHairExtra: boolean;
  hasAccA: boolean;
  hasAccB: boolean;
  hasAccC: boolean;
  hands: boolean;
  sweat: boolean;
  spark: boolean;
  wrapS: string;
  innerS: string;
  shadowS: string;
  bodyS: string;
  legLS: string;
  legRS: string;
  shoeLS: string;
  shoeRS: string;
  torsoS: string;
  collarS: string;
  armLS: string;
  armRS: string;
  headGroupS: string;
  hairBackS: string;
  hairExtraS: string;
  headS: string;
  hairFrontS: string;
  eyeLS: string;
  eyeRS: string;
  mouthS: string;
  blushLS: string;
  blushRS: string;
  accAS: string;
  accBS: string;
  accCS: string;
  handLS: string;
  handRS: string;
  sweatS: string;
  sparkS: string;
  nameS: string;
}

const INK = "#2A1E2B";
const AB = "position:absolute;";

/**
 * Ported near-verbatim from `renderVals()` in `project/Dancer.dc.html` — same
 * branching per reaction, same math (dance wraps mod 6, arm/head animation set wraps
 * mod 3, duration = 0.86s / speed), same geometry constants. See that file's chat
 * history for the two known fixes already folded in here: arms pivot at the shoulder
 * (not a further-out point) so arms-up reactions read correctly, and the name pill
 * sits low enough to clear the shoes.
 */
export function computeDancerStyles(
  traits: DancerTraits,
  options: DancerRenderOptions = {},
): DancerStyles {
  const skin = traits.skin || "#F3C9A2";
  const hair = traits.hairColor || "#33242E";
  const outfit = traits.outfit || "#FF6B5A";
  const pants = traits.pants || "#2B2136";
  const shoe = "#FFF3E8";

  const sc = options.scale ?? 1;
  const dance = ((Math.trunc(options.dance ?? 1) - 1) % 6) + 1;
  const delay = options.delay || "0s";
  const react = options.reaction || "dance";
  const spd = options.speed ?? 1;
  const dur = (0.86 / spd).toFixed(2) + "s";
  const hs = HAIR[traits.hair] || HAIR.bob;
  const dim = options.dim ? "filter:brightness(.52) saturate(.75);" : "";
  const glow = options.glow ? "filter:drop-shadow(0 0 26px rgba(255,179,77,.85));" : "";

  const armSet = ((dance - 1) % 3) + 1;
  const headSet = ((dance - 1) % 3) + 1;
  let bodyAnim = `animation:body${dance} ${dur} ${delay} infinite alternate ease-in-out;`;
  let armL = `animation:al${armSet} ${dur} ${delay} infinite alternate ease-in-out;`;
  let armR = `animation:ar${armSet} ${dur} ${delay} infinite alternate ease-in-out;`;
  let headAnim = `animation:hd${headSet} ${dur} ${delay} infinite alternate ease-in-out;`;
  let eyeW = 11;
  let eyeH = 13;
  let eyeR = "50%";
  let mouth = `left:56px;bottom:174px;width:20px;height:10px;border-radius:2px 2px 14px 14px;background:${INK}`;
  let blush = 0;
  let hands = false;
  let sweat = false;
  let spark = false;
  let extraT = "";

  if (react === "idle") {
    bodyAnim = `animation:idlebob ${(1.6 / spd).toFixed(2)}s ${delay} infinite alternate ease-in-out;`;
    armL = "transform:rotate(8deg);";
    armR = "transform:rotate(-8deg);";
    headAnim = `animation:hd2 ${(1.8 / spd).toFixed(2)}s ${delay} infinite alternate ease-in-out;`;
  } else if (react === "caught") {
    bodyAnim = "animation:shiver .22s infinite alternate ease-in-out;";
    armL = "transform:rotate(-118deg);";
    armR = "transform:rotate(118deg);";
    headAnim = "transform:rotate(3deg) translateY(3px);";
    eyeH = 3;
    eyeR = "3px";
    blush = 0.85;
    hands = true;
    sweat = true;
    mouth = `left:58px;bottom:172px;width:16px;height:7px;border-radius:14px 14px 2px 2px;background:${INK}`;
  } else if (react === "dodge") {
    bodyAnim = "animation:shiver .3s infinite alternate ease-in-out;";
    extraT = "transform:rotate(-13deg) translateX(-8px);";
    armL = "transform:rotate(-150deg);";
    armR = "transform:rotate(128deg);";
    headAnim = "transform:rotate(-8deg);";
    eyeW = 13;
    eyeH = 14;
    sweat = true;
    mouth = `left:54px;bottom:172px;width:24px;height:14px;border-radius:4px 4px 16px 16px;background:${INK}`;
  } else if (react === "laugh") {
    bodyAnim = `animation:laughb ${(0.34 / spd).toFixed(2)}s ${delay} infinite alternate ease-in-out;`;
    armL = "transform:rotate(-58deg);";
    armR = "transform:rotate(38deg);";
    headAnim = "animation:hd3 .34s infinite alternate ease-in-out;";
    eyeH = 4;
    eyeR = "4px";
    blush = 0.5;
    mouth = `left:52px;bottom:168px;width:28px;height:20px;border-radius:6px 6px 18px 18px;background:${INK}`;
  } else if (react === "surprise") {
    bodyAnim = "animation:body2 .5s infinite alternate ease-in-out;";
    armL = "transform:rotate(-142deg);";
    armR = "transform:rotate(142deg);";
    headAnim = "transform:translateY(-4px);";
    eyeW = 16;
    eyeH = 18;
    spark = true;
    mouth = `left:57px;bottom:168px;width:18px;height:18px;border-radius:50%;background:${INK}`;
  } else if (react === "sad") {
    bodyAnim = "transform:translateY(6px) scaleY(.97);";
    armL = "transform:rotate(6deg);";
    armR = "transform:rotate(-6deg);";
    headAnim = "transform:rotate(2deg) translateY(6px);";
    eyeH = 9;
    mouth = `left:56px;bottom:172px;width:20px;height:9px;border-radius:14px 14px 2px 2px;background:${INK}`;
  } else if (react === "win") {
    bodyAnim = `animation:winjump ${(0.62 / spd).toFixed(2)}s ${delay} infinite ease-in-out;`;
    armL = "transform:rotate(-152deg);";
    armR = "transform:rotate(152deg);";
    headAnim = "animation:hd1 .3s infinite alternate ease-in-out;";
    eyeH = 5;
    eyeR = "5px";
    blush = 0.55;
    mouth = `left:52px;bottom:168px;width:28px;height:19px;border-radius:6px 6px 18px 18px;background:${INK}`;
  }

  const acc = traits.acc || "none";
  let accA = "";
  let accB = "";
  let accC = "";
  if (acc === "glasses") {
    accA = `left:36px;bottom:182px;width:26px;height:26px;border-radius:50%;border:3px solid ${INK}`;
    accB = `left:68px;bottom:182px;width:26px;height:26px;border-radius:50%;border:3px solid ${INK}`;
    accC = "left:61px;bottom:193px;width:9px;height:3px;border-radius:2px;background:" + INK;
  } else if (acc === "cap") {
    accA = "left:22px;bottom:212px;width:88px;height:32px;border-radius:44px 44px 6px 6px;background:#FF6B5A";
    accB = "left:60px;bottom:212px;width:58px;height:13px;border-radius:0 12px 12px 0;background:#E8553F";
  } else if (acc === "headphones") {
    accA = "left:26px;bottom:230px;width:80px;height:14px;border-radius:14px;background:#4A3557";
    accB = "left:18px;bottom:192px;width:20px;height:30px;border-radius:9px;background:#FFB34D";
    accC = "left:94px;bottom:192px;width:20px;height:30px;border-radius:9px;background:#FFB34D";
  } else if (acc === "hoops") {
    accA = "left:22px;bottom:178px;width:15px;height:15px;border-radius:50%;border:3px solid #FFB34D";
    accB = "left:95px;bottom:178px;width:15px;height:15px;border-radius:50%;border:3px solid #FFB34D";
  }

  const label = options.label ?? "";

  return {
    label,
    showName: options.showName !== false && !!label,
    hasHairExtra: !!hs.extra,
    hasAccA: !!accA,
    hasAccB: !!accB,
    hasAccC: !!accC,
    hands,
    sweat,
    spark,
    wrapS: `position:relative;width:${Math.round(130 * sc)}px;height:${Math.round(250 * sc)}px;flex:0 0 auto;${dim}${glow}`,
    innerS: `position:absolute;left:0;bottom:0;width:130px;height:250px;transform:scale(${sc});transform-origin:left bottom;`,
    shadowS: AB + "left:14px;bottom:-4px;width:102px;height:20px;border-radius:50%;background:rgba(10,6,16,.5);filter:blur(4px);",
    bodyS: `position:absolute;left:0;bottom:0;width:130px;height:250px;transform-origin:65px 240px;${extraT}${bodyAnim}`,
    legLS: AB + `left:38px;bottom:8px;width:23px;height:68px;border-radius:12px;background:${pants};`,
    legRS: AB + `left:69px;bottom:8px;width:23px;height:68px;border-radius:12px;background:${pants};`,
    shoeLS: AB + `left:32px;bottom:0;width:34px;height:17px;border-radius:10px 12px 8px 8px;background:${shoe};`,
    shoeRS: AB + `left:64px;bottom:0;width:34px;height:17px;border-radius:12px 10px 8px 8px;background:${shoe};`,
    torsoS: AB + `left:27px;bottom:66px;width:76px;height:102px;border-radius:38px 38px 22px 22px;background:${outfit};`,
    collarS: AB + `left:52px;bottom:158px;width:26px;height:18px;border-radius:9px;background:${skin};`,
    armLS: AB + `left:17px;bottom:96px;width:20px;height:76px;border-radius:11px;background:${outfit};transform-origin:10px 9px;${armL}`,
    armRS: AB + `left:93px;bottom:96px;width:20px;height:76px;border-radius:11px;background:${outfit};transform-origin:10px 9px;${armR}`,
    headGroupS: `position:absolute;left:0;bottom:0;width:130px;height:250px;transform-origin:65px 60px;${headAnim}`,
    hairBackS: AB + hs.back + `;background:${hair};`,
    hairExtraS: AB + (hs.extra || "display:none") + `;background:${hair};`,
    headS: AB + `left:28px;bottom:152px;width:74px;height:80px;border-radius:50%;background:${skin};`,
    hairFrontS: AB + hs.front + `;background:${hair};`,
    eyeLS: AB + `left:${45 - (eyeW - 11) / 2}px;bottom:190px;width:${eyeW}px;height:${eyeH}px;border-radius:${eyeR};background:${INK};`,
    eyeRS: AB + `left:${74 - (eyeW - 11) / 2}px;bottom:190px;width:${eyeW}px;height:${eyeH}px;border-radius:${eyeR};background:${INK};`,
    mouthS: AB + mouth + ";",
    blushLS: AB + `left:34px;bottom:178px;width:16px;height:9px;border-radius:50%;background:#FF6B5A;opacity:${blush};`,
    blushRS: AB + `left:80px;bottom:178px;width:16px;height:9px;border-radius:50%;background:#FF6B5A;opacity:${blush};`,
    accAS: AB + accA + ";",
    accBS: AB + accB + ";",
    accCS: AB + accC + ";",
    handLS: AB + `left:28px;bottom:170px;width:38px;height:36px;border-radius:16px;background:${skin};box-shadow:0 -2px 0 rgba(0,0,0,.12) inset;`,
    handRS: AB + `left:64px;bottom:170px;width:38px;height:36px;border-radius:16px;background:${skin};box-shadow:0 -2px 0 rgba(0,0,0,.12) inset;`,
    sweatS: AB + "left:100px;bottom:216px;width:11px;height:15px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#9AD9FF;animation:sweatdrop 1.1s infinite ease-in;",
    sparkS: AB + "left:98px;bottom:224px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;color:#FFB34D;font:800 22px 'Fredoka',sans-serif;animation:sparkpop .9s infinite ease-out;",
    nameS: "position:absolute;left:50%;bottom:-44px;transform:translateX(-50%);white-space:nowrap;font:700 19px 'Fredoka',system-ui,sans-serif;color:#2A1E2B;background:#FFF3E8;padding:4px 14px;border-radius:999px;box-shadow:0 3px 0 rgba(0,0,0,.25);",
  };
}
