// ── Illustrated scenes ──
// The 90 px top bar (sky, clouds, hills, a city far away, the road edge to edge, the cars parked on it) and the
// roadside picture of each vehicle tile (the scene of the vehicle card: lamp, hills, bush, the car's picture or a
// drawn car). Day or night: Home Assistant's dark mode.
import { vpEsc } from "./core.js";

/** A plain car, drawn when the vehicle has no picture. */
export const vpDrawnCar = (x, y, scale) =>
  `<g class="vp-car" transform="translate(${x} ${y}) scale(${scale})"><path class="vp-body" d="M0 -6 Q1 -11 8 -12 L14 -16 H26 L33 -12 Q40 -11 40 -6 V-2 H0Z"/>` +
  '<path class="vp-glass" d="M15 -15 H25 L30 -12 H11Z"/><circle class="vp-tyre" cx="9" cy="-2" r="3.4"/><circle class="vp-tyre" cx="31" cy="-2" r="3.4"/></g>';

const VP_CLOUD = "M-14,4 C-17,4 -18,0 -14.5,-1 C-14,-5 -8,-6 -6,-3 C-4,-8 4,-8 5,-2 C9,-3 12,0 10,4 Z";

/** The roadside scene of a vehicle tile (200 × 80): `img` the car's picture, else the drawn car. */
export const vpTileScene = (img, uid) =>
  `<svg class="vp-tscene" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">` +
  `<defs><radialGradient id="${uid}-glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>` +
  '<g class="vp-night"><circle class="vp-star" cx="20" cy="10" r=".7"/><circle class="vp-star" cx="96" cy="8" r=".7"/><circle class="vp-star" cx="170" cy="20" r=".7"/>' +
  '<circle class="vp-moon" cx="148" cy="12" r="5.5"/><circle class="vp-moon-cut" cx="150.5" cy="10" r="4.5"/></g>' +
  '<g class="vp-day"><circle class="vp-sun-halo" cx="148" cy="12" r="9"/><circle class="vp-sun" cx="148" cy="12" r="6"/></g>' +
  `<path class="vp-cloud" transform="translate(66 14)" d="${VP_CLOUD}"/><path class="vp-cloud" transform="translate(114 24) scale(.75)" d="${VP_CLOUD}"/>` +
  '<path class="vp-hill far" d="M0,80 C30,70 60,64 100,66 C140,68 170,60 200,62 L200,80Z"/><path class="vp-hill" d="M0,80 C40,74 90,75 200,72 L200,80Z"/>' +
  `<g class="vp-lamp"><circle class="vp-halo" cx="46" cy="40" r="16" fill="url(#${uid}-glow)"/><rect class="vp-pole" x="38.4" y="38" width="1.4" height="42"/>` +
  '<path class="vp-arm" d="M39 39 Q39 36 43 36 H47"/><rect class="vp-head" x="43" y="36" width="7" height="2.4" rx="1"/></g>' +
  '<g class="vp-bush"><circle cx="196" cy="72" r="6"/><circle cx="189" cy="75" r="5"/></g>' +
  (img ? `<image href="${vpEsc(img)}" x="54" y="20" width="124" height="66" preserveAspectRatio="xMidYMax meet"/>` : vpDrawnCar(76, 79, 2.1)) +
  "</svg>";

/** The top bar's scene (600 × 80, right-aligned): up to three cars on the road, their pictures or drawn cars. */
export const vpBarScene = (pictures) => {
  const cars = pictures
    .slice(0, 3)
    .map((img, i) => {
      const x = 330 + i * 92;
      return img
        ? `<image href="${vpEsc(img)}" x="${x - 10}" y="${i % 2 ? 26 : 20}" width="${i % 2 ? 100 : 112}" height="${i % 2 ? 54 : 60}" preserveAspectRatio="xMidYMax meet"/>`
        : vpDrawnCar(x + 12, 78, 1.7);
    })
    .join("");
  return (
    `<svg class="vp-bscene" viewBox="0 0 600 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">` +
    '<g class="vp-night"><circle class="vp-star" cx="60" cy="12" r=".9"/><circle class="vp-star" cx="160" cy="26" r=".8"/><circle class="vp-star" cx="250" cy="8" r=".9"/>' +
    '<circle class="vp-star" cx="420" cy="18" r=".8"/><circle class="vp-star" cx="520" cy="10" r=".9"/><circle class="vp-moon" cx="560" cy="18" r="7"/><circle class="vp-moon-cut" cx="563" cy="15" r="6"/></g>' +
    '<g class="vp-day"><circle class="vp-sun-halo" cx="560" cy="18" r="13"/><circle class="vp-sun" cx="560" cy="18" r="8"/></g>' +
    `<path class="vp-cloud" transform="translate(120 18)" d="${VP_CLOUD}"/><path class="vp-cloud" transform="translate(300 28) scale(.8)" d="${VP_CLOUD}"/>` +
    '<path class="vp-hill far" d="M0,80 C80,62 160,58 260,62 C360,66 460,54 600,58 L600,80Z"/>' +
    '<g class="vp-city"><rect x="150" y="40" width="16" height="30" rx="1.5"/><rect x="169" y="30" width="13" height="40" rx="1.5"/><rect x="185" y="44" width="20" height="26" rx="1.5"/><rect x="208" y="36" width="12" height="34" rx="1.5"/></g>' +
    '<path class="vp-hill" d="M0,80 C120,72 260,74 600,70 L600,80Z"/>' +
    '<g class="vp-bush"><circle cx="594" cy="72" r="7"/><circle cx="585" cy="75" r="5.5"/></g>' +
    `${cars}</svg>`
  );
};

export const VP_SCENE_STYLE = `
  .vp-night, .night .vp-day { display:none; } .night .vp-night { display:inline; }
  .vp-sun { fill:#ffd65a; } .vp-sun-halo { fill:#ffd65a; opacity:.28; }
  .vp-moon { fill:#f3eed2; } .vp-moon-cut { fill:#0f2040; } .vp-star { fill:#fff; opacity:.85; }
  .vp-cloud { fill:#fff; opacity:.92; } .night .vp-cloud { opacity:.1; }
  .vp-hill.far { fill:#a7d39f; } .vp-hill { fill:#86c27f; } .night .vp-hill.far { fill:#1d3a4a; } .night .vp-hill { fill:#17303d; }
  .vp-city rect { fill:#c3d4f2; } .night .vp-city rect { fill:#22385a; }
  .vp-bush { fill:#4f9a3a; } .night .vp-bush { fill:#1e3d2a; }
  .vp-pole, .vp-head { fill:#5f6b7a; } .vp-arm { fill:none; stroke:#5f6b7a; stroke-width:1.2; }
  .night .vp-pole, .night .vp-head { fill:#7d8793; } .night .vp-arm { stroke:#7d8793; }
  .vp-halo { display:none; } .night .vp-halo { display:inline; }
  .vp-body { fill:var(--vp-accent); } .vp-glass { fill:#cfe6f7; } .night .vp-glass { fill:#3b4b5e; } .vp-tyre { fill:#22262b; }
  /* The road: a 10 px strip edge to edge, dashed centre line */
  .road { position:absolute; left:0; right:0; bottom:0; height:10px; background:#858c94; box-shadow:inset 0 1px 0 #6f767d; }
  .road::after { content:""; position:absolute; left:0; right:0; top:calc(50% - .8px); height:1.6px;
                 background:repeating-linear-gradient(90deg, rgba(255,255,255,.85) 0 9px, transparent 9px 18px); }
  .night .road { background:#2c323b; box-shadow:inset 0 1px 0 #3a414c; } .night .road::after { opacity:.6; }
`;
