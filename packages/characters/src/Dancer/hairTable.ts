import type { HairStyle } from "@grille/shared";

export interface HairShapes {
  back: string;
  front: string;
  extra?: string;
}

/**
 * Ported verbatim from the `HAIR` lookup table in the Claude Design prototype
 * (`project/Dancer.dc.html`) — per-style back/front/(optional extra) hair-shape CSS
 * position+size+border-radius strings, hand-tuned against the 130x250 character box.
 * Do not "clean up" these numbers; they're load-bearing geometry, not arbitrary.
 */
export const HAIR: Record<HairStyle, HairShapes> = {
  afro: {
    back: "left:9px;bottom:172px;width:112px;height:108px;border-radius:50%",
    front: "left:30px;bottom:212px;width:70px;height:24px;border-radius:20px",
  },
  long: {
    back: "left:15px;bottom:118px;width:100px;height:132px;border-radius:50px 50px 26px 26px",
    front: "left:26px;bottom:206px;width:78px;height:34px;border-radius:30px 30px 18px 6px",
  },
  buzz: {
    back: "left:26px;bottom:200px;width:78px;height:48px;border-radius:40px 40px 4px 4px",
    front: "left:28px;bottom:208px;width:74px;height:18px;border-radius:14px",
  },
  bun: {
    back: "left:22px;bottom:178px;width:86px;height:74px;border-radius:44px 44px 18px 18px",
    extra: "left:46px;bottom:232px;width:40px;height:40px;border-radius:50%",
    front: "left:32px;bottom:210px;width:66px;height:22px;border-radius:16px",
  },
  curly: {
    back: "left:12px;bottom:180px;width:106px;height:96px;border-radius:52px 52px 34px 34px",
    extra: "left:6px;bottom:192px;width:44px;height:44px;border-radius:50%",
    front: "left:28px;bottom:210px;width:74px;height:28px;border-radius:22px",
  },
  ponytail: {
    back: "left:22px;bottom:180px;width:86px;height:72px;border-radius:44px 44px 16px 16px",
    extra: "left:98px;bottom:142px;width:28px;height:86px;border-radius:14px 14px 14px 14px",
    front: "left:30px;bottom:212px;width:70px;height:22px;border-radius:16px",
  },
  bob: {
    back: "left:14px;bottom:166px;width:102px;height:92px;border-radius:48px 48px 26px 26px",
    front: "left:26px;bottom:206px;width:78px;height:32px;border-radius:26px 26px 8px 18px",
  },
};
