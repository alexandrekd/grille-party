import type { DancerTraits } from "@grille/shared";
import { computeDancerStyles, type DancerRenderOptions } from "./renderVals.js";
import { cssStringToObject } from "./cssStringToObject.js";

export interface DancerProps extends DancerRenderOptions {
  traits: DancerTraits;
}

/**
 * The party's character system — ported mechanically from `project/Dancer.dc.html`.
 * Same div tree, same trait-driven CSS, same 6 dance loops + 8 reactions. See
 * `renderVals.ts` for the ported style logic and `hairTable.ts`/`keyframes.css` for
 * the ported geometry/animation data.
 */
export function Dancer({ traits, ...options }: DancerProps) {
  const s = computeDancerStyles(traits, options);

  return (
    <div style={cssStringToObject(s.wrapS)}>
      <div style={cssStringToObject(s.innerS)}>
        <div style={cssStringToObject(s.shadowS)} />
        <div style={cssStringToObject(s.bodyS)}>
          <div style={cssStringToObject(s.legLS)} />
          <div style={cssStringToObject(s.legRS)} />
          <div style={cssStringToObject(s.shoeLS)} />
          <div style={cssStringToObject(s.shoeRS)} />
          <div style={cssStringToObject(s.armLS)} />
          <div style={cssStringToObject(s.armRS)} />
          <div style={cssStringToObject(s.torsoS)} />
          <div style={cssStringToObject(s.collarS)} />
          <div style={cssStringToObject(s.headGroupS)}>
            <div style={cssStringToObject(s.hairBackS)} />
            {s.hasHairExtra && <div style={cssStringToObject(s.hairExtraS)} />}
            <div style={cssStringToObject(s.headS)} />
            <div style={cssStringToObject(s.hairFrontS)} />
            <div style={cssStringToObject(s.eyeLS)} />
            <div style={cssStringToObject(s.eyeRS)} />
            <div style={cssStringToObject(s.mouthS)} />
            <div style={cssStringToObject(s.blushLS)} />
            <div style={cssStringToObject(s.blushRS)} />
            {s.hasAccA && <div style={cssStringToObject(s.accAS)} />}
            {s.hasAccB && <div style={cssStringToObject(s.accBS)} />}
            {s.hasAccC && <div style={cssStringToObject(s.accCS)} />}
            {s.hands && <div style={cssStringToObject(s.handLS)} />}
            {s.hands && <div style={cssStringToObject(s.handRS)} />}
            {s.sweat && <div style={cssStringToObject(s.sweatS)} />}
            {s.spark && <div style={cssStringToObject(s.sparkS)}>!</div>}
          </div>
        </div>
      </div>
      {s.showName && <div style={cssStringToObject(s.nameS)}>{s.label}</div>}
    </div>
  );
}
