// ── The price totem ──
// The totem of the Carburants France card (copied, the repositories stay independent: change both by hand): a red
// PRIX head over one black row per fuel, its pump colour on the left, its short name and the cheapest price in
// yellow digits, on a pole.
import { vpEsc } from "./core.js";

// Short names at the pump, and the pump colours (EN 16942)
export const VP_TOTEM_LABELS = { gazole: "Gazole", sp95: "SP95", sp98: "SP98", e10: "SP95-E10", e85: "E85", gplc: "GPLc" };
export const VP_FUEL_COLORS = { gazole: "#E8A000", sp95: "#00A651", sp98: "#00703C", e10: "#009A3E", e85: "#0057A8", gplc: "#C62828" };

/** The totem's SVG: rows [{key, name, price}] (price null: dashes). */
export const vpTotemSvg = (rows, lang) => {
  const fmt = new Intl.NumberFormat(lang, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const list = rows.length ? rows : [{ key: "", name: "", price: null }];
  const h = 10 + list.length * 9.6;
  const body = list
    .map((r, i) => {
      const y = 9.6 + i * 9.6;
      const label = VP_TOTEM_LABELS[r.key] || String(r.name || r.key || "").slice(0, 8);
      return (
        `<rect class="vp-trow" x="-19.5" y="${y}" width="39" height="8" rx="1"/><rect x="-19.5" y="${y}" width="2" height="8" fill="${vpEsc(VP_FUEL_COLORS[r.key] || "#8a96a3")}"/>` +
        `<text class="vp-tlabel" x="-16" y="${y + 5.3}">${vpEsc(label)}</text>` +
        `<text class="vp-tprice${r.price == null ? " none" : ""}" x="18.4" y="${y + 5.9}" text-anchor="end">${r.price == null ? "----" : vpEsc(fmt.format(r.price))}</text>`
      );
    })
    .join("");
  return (
    `<svg class="totem" viewBox="-23 -1 46 ${h + 24}" role="img" aria-hidden="true">` +
    `<rect class="vp-tpole" x="-2" y="${h - 2}" width="4" height="25"/><rect class="vp-tbase" x="-9" y="${h + 21}" width="18" height="2.4" rx="1"/>` +
    `<rect class="vp-tbox" x="-22" y="0" width="44" height="${h + 1}" rx="3"/><rect class="vp-thead" x="-22" y="0" width="44" height="7" rx="3"/><rect class="vp-thead" x="-22" y="4" width="44" height="3"/>` +
    `<text class="vp-tprix" y="5.3" text-anchor="middle">PRIX</text>${body}</svg>`
  );
};
