// ── Trips, Consumption, Fuel, Maintenance and Lease ──
// The tabs drawn from the integrations the panel builds on (Vehicle Consumption, Carburants France, Maintenance, a
// home charger), each falling back to the plain entities picked in the setup when the integration is missing.
import { vpEsc, vpFmt, vpName, vpNum, vpRelative, vpState } from "./core.js";
import { vpDaily, vpLevel, vpRange, vpStations, vpTyres, vpUrgency, vpWeekly, vpWhere } from "./model.js";
import {
  VP_TYRE_KEYS,
  vpBest,
  vpCanDone,
  vpCard,
  vpCarFuel,
  vpFuelData,
  vpLeaseCurve,
  vpLeaseInfo,
  vpMaintenanceItems,
  vpMonthDriven,
  vpMonthKey,
  vpMonthly,
  vpPriceSensor,
  vpService,
  vpStationsFor,
} from "./rich.js";
import { vpBar, vpChart, vpDirLink, vpMoney, vpPct, vpTripRow } from "./views.js";

const vpNote = (text) => `<div class="c"><div class="note">${vpEsc(text)}</div></div>`;
const vpSeg = (attr, list, current) =>
  `<div class="seg">${list.map(([k, label]) => `<button class="${k === current ? "on" : ""}" aria-pressed="${k === current}" data-${attr}="${vpEsc(k)}">${vpEsc(label)}</button>`).join("")}</div>`;
const vpMini = (label, value, sub, cls = "") =>
  `<div class="mini"><span class="m">${vpEsc(label)}</span><b class="${cls}">${value}</b>${sub ? `<span class="m ${cls === "good" ? "good" : ""}">${vpEsc(sub)}</span>` : ""}</div>`;
const vpMonthName = (lang, key, style = "short") => new Intl.DateTimeFormat(lang, { month: style }).format(new Date(`${key}-15T12:00:00`));

/** The 7-day bars of a vehicle's mileage, with today and the week. */
const vpDailyBars = (ctx, v) => {
  const { t, lang } = ctx;
  const days = new Intl.DateTimeFormat(lang, { weekday: "short" });
  const daily = v.ent.mileage ? vpDaily(ctx.history[v.ent.mileage], 7, ctx.now) : [];
  const known = daily.filter((d) => d.km != null);
  if (!known.length) return { html: `<div class="note">${vpEsc(t("no_history"))}</div>`, week: null };
  const week = known.reduce((a, d) => a + d.km, 0);
  return {
    week,
    html: `${vpChart(
      daily.map((d) => d.km),
      daily.map((d) => days.format(d.day)),
    )}<div class="r s"><span>${vpEsc(t("today"))} <b>${vpFmt(daily.at(-1)?.km, lang)} km</b></span><span>${vpEsc(t("this_week"))} <b>${vpFmt(week, lang)} km</b></span></div>`,
  };
};

export const vpTrips = (ctx) => {
  const { hass, t, lang } = ctx;
  return `<div class="cards">${ctx.vehicles
    .filter((v) => !v.missing)
    .map((v) => {
      const where = vpWhere(hass, v);
      const last = hass.states[v.ent.location_last_activity]?.state || hass.states[v.ent.location]?.last_updated;
      const card = vpCard(hass, v);
      const live = card?.driving && card.trip && !card.trip.end ? { ...card.trip, live: true, vehicle: v } : null;
      const trips = [...(live ? [live] : []), ...(card?.trips || []).filter((tr) => !live || tr.start !== live.start).map((tr) => ({ ...tr, vehicle: v }))].slice(0, 8);
      return `<div class="c"><div class="h"><b>${vpEsc(v.name)}</b><span>${vpEsc(t("last_7_days"))}</span></div>
        ${where ? `<div class="t r"><span>${vpEsc(t("location"))}</span><b>${vpEsc(where.home ? t("at_home") : where.zone || t("away"))}</b></div>` : ""}
        ${last ? `<div class="s m">${vpEsc(t("updated", { t: vpRelative(last, lang, ctx.now) }))}</div>` : ""}
        ${vpDailyBars(ctx, v).html}
        ${trips.length ? `<div class="cap">${vpEsc(t("recent_trips"))}</div><div class="list">${trips.map((tr) => vpTripRow(ctx, tr, false)).join("")}</div>` : ""}</div>`;
    })
    .join("")}</div>`;
};

/** The consumption of a car without the card sensor of Vehicle Consumption: its 8-week average and its sensors. */
const vpLegacyConsumption = (ctx, v) => {
  const { hass, t, lang } = ctx;
  const c = v.consumption;
  const dev = hass.devices?.[c.device];
  const tiles = c.all.map((id) => vpMini(vpName(hass, id, dev?.name_by_user || dev?.name), vpEsc(vpState(hass, id)))).join("");
  const weeks = c.average ? vpWeekly(ctx.history[c.average], 8, ctx.now) : [];
  const unit = hass.states[c.average]?.attributes?.unit_of_measurement || "";
  return `${c.average ? `<div class="c"><div class="h"><b>${vpEsc(t("consumption_title", { name: v.name }))}</b><span>${vpEsc(t("weeks_8"))}</span></div>${vpChart(weeks)}<div class="s"><b>${vpFmt(vpNum(hass.states[c.average]), lang, 1)}</b> ${vpEsc(unit)} · ${vpEsc(t("this_week_avg"))}</div></div>` : ""}
    <div class="c"><div class="h"><b>${vpEsc(v.name)}</b></div><div class="minis" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">${tiles}</div></div>`;
};

export const vpConsumptionTab = (ctx) => {
  const { hass, t, lang } = ctx;
  const with_ = ctx.vehicles.filter((v) => v.consumption);
  if (!with_.length) return vpNote(t("no_consumption"));
  const v = with_.find((x) => x.id === ctx.cveh) || with_[0];
  const pick = with_.length > 1 ? vpSeg("cveh", with_.map((x) => [x.id, x.name]), v.id) : "";
  const card = vpCard(hass, v);
  if (!card) return pick + vpLegacyConsumption(ctx, v);
  const cur = card.currency;
  const m = card.month || {};
  const energy = m.fuel_consumption == null && m.energy_consumption != null;
  const unit = energy ? "kWh/100" : "L/100";
  const cons = m.fuel_consumption ?? m.energy_consumption;
  const avg = energy ? card.total?.energy_consumption : card.total?.fuel_consumption;
  const diff = cons != null && avg != null ? cons - avg : null;
  const monthKey = vpMonthKey(ctx.now);
  const tripsMonth = (card.trips || []).filter((tr) => vpMonthKey(Date.parse(tr.start)) === monthKey).length;
  const service = vpService(hass, v);
  const tiles = [
    vpMini(t("this_month"), cons != null ? `${vpFmt(cons, lang, 1)} ${unit}` : "—", diff != null ? t("vs_average", { v: `${diff > 0 ? "+" : diff < 0 ? "−" : ""}${vpFmt(Math.abs(diff), lang, 1)}` }) : "", diff != null && diff <= 0 ? "good" : ""),
    vpMini(t("distance"), `${vpFmt(m.distance, lang)} km`),
    vpMini(t("cost"), vpEsc(vpMoney(ctx, m.cost, 0, cur)), m.cost_per_km != null ? `${vpMoney(ctx, m.cost_per_km, 3, cur)}/km` : ""),
    vpMini("CO₂", m.co2 != null ? `${vpFmt(m.co2, lang)} kg` : "—", m.co2_per_km != null ? `${vpFmt(m.co2_per_km, lang)} g/km` : ""),
    vpMini(t("trips"), vpFmt(tripsMonth, lang)),
    service?.left != null
      ? vpMini(t("next_service"), `${vpFmt(Math.abs(service.left), lang)} km`, service.overdue ? t("overdue") : service.interval ? t("every_km", { n: vpFmt(service.interval, lang) }) : "", service.overdue ? "err" : "")
      : "",
  ].join("");
  const metric = ctx.metric || "consumption";
  const months = vpMonthly(card, metric);
  const values = months.map((x) => x.value);
  const known = months.filter((x) => x.value != null);
  const lowest = known.length ? known.reduce((a, b) => (b.value < a.value ? b : a)) : null;
  const since = card.total?.since ? new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(Date.parse(card.total.since)) : "";
  const foot = [since && avg != null ? t("average_since", { d: since, v: `${vpFmt(avg, lang, 1)} ${unit}` }) : "", metric === "consumption" && lowest ? t("lowest_in", { m: vpMonthName(lang, lowest.month, "long") }) : ""].filter(Boolean).join(" · ");
  const chart = `<div class="c"><div class="h"><b>${vpEsc(t("months_12"))}</b>${vpSeg(
    "metric",
    [
      ["consumption", t("consumption")],
      ["distance", t("distance")],
      ["cost", t("cost")],
      ["co2", "CO₂"],
    ],
    metric,
  )}</div>${known.length ? vpChart(values, months.map((x) => vpMonthName(lang, x.month))) : `<div class="note">${vpEsc(t("no_history"))}</div>`}${foot ? `<div class="s m">${vpEsc(foot)}</div>` : ""}</div>`;
  const trips = (card.trips || []).slice(0, 6).map((tr) => ({ ...tr, vehicle: v }));
  const tripsCard = `<div class="c"><div class="h"><b>${vpEsc(t("recent_trips"))}</b><span>${vpEsc(t("this_month_n", { n: tripsMonth }))}</span></div>${trips.length ? `<div class="list">${trips.map((tr) => vpTripRow(ctx, tr, false)).join("")}</div>` : `<div class="note">${vpEsc(t("no_trips"))}</div>`}</div>`;
  const charges = !card.refuels?.length && card.charges?.length;
  const events = (charges ? card.charges : card.refuels || []).slice(0, 5);
  const day = new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" });
  const refuels = `<div class="c"><div class="h"><b>${vpEsc(t(charges ? "charges" : "refuels"))}</b>${card.entry_id ? `<button class="btn accent" data-act="refuel" data-v="${vpEsc(v.id)}">${vpEsc(t(charges || card.kind === "electric" ? "log_charge" : "log_refuel"))}</button>` : ""}</div>
    ${
      events.length
        ? `<div class="list">${events
            .map((e) => {
              const amount = e.liters != null ? `${vpFmt(e.liters, lang, 1)} L` : `${vpFmt(e.energy, lang, 1)} kWh`;
              const sub = [e.odometer != null ? `${vpFmt(e.odometer, lang)} km` : "", e.price != null ? `${vpFmt(e.price, lang, 3)} ${e.liters != null ? "€/L" : "€/kWh"}` : ""].filter(Boolean).join(" · ");
              return `<div class="item"><span class="txt"><b>${vpEsc(day.format(Date.parse(e.time)))}</b> · ${amount}<span class="sub">${vpEsc(sub)}</span></span><b>${vpEsc(vpMoney(ctx, e.cost, 2, cur))}</b></div>`;
            })
            .join("")}</div>`
        : `<div class="note">${vpEsc(t("no_refuels"))}</div>`
    }</div>`;
  const bars = vpDailyBars(ctx, v);
  const week = `<div class="c"><div class="h"><b>${vpEsc(t("trips_7_days"))}</b><span>${bars.week != null ? `${vpFmt(bars.week, lang)} km` : ""}</span></div>${bars.html}</div>`;
  return `${pick}<div class="c"><div class="minis six">${tiles}</div></div>
    <div class="grid2"><div class="col">${chart}${tripsCard}</div><div class="col">${refuels}${week}</div></div>`;
};

/** A 30-day price line of a station (from the history of its price sensor). */
const vpSpark = (points) => {
  const values = (points || []).map((p) => Number(p.s)).filter(Number.isFinite);
  if (values.length < 2) return '<svg class="spark" viewBox="0 0 90 24"></svg>';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const d = values.map((v, i) => `${((i / (values.length - 1)) * 88 + 1).toFixed(1)},${(21 - ((v - min) / span) * 18).toFixed(1)}`).join(" ");
  const down = values.at(-1) < values[0];
  return `<svg class="spark ${down ? "down" : ""}" viewBox="0 0 90 24" aria-hidden="true"><polyline points="${d}"/></svg>`;
};

/** A station's opening, as the line under its name. */
const vpOpenText = (ctx, s) => {
  const { t } = ctx;
  if (!s.open) return "";
  if (s.open.always) return t("open_24");
  if (s.open.open) return s.open.closes ? t("open_until", { t: s.open.closes }) : t("open");
  if (s.open.opens) return s.open.days > 1 ? t("closed") : t("closed_opens", { t: s.open.opens });
  return t("closed");
};

/** The stations of a fuel of Carburants France, with the fuel switch and the best price's figures. */
const vpStationsCard = (ctx, data, fuel) => {
  const { hass, t, lang } = ctx;
  const list = vpStationsFor(data, fuel.key, ctx.now);
  const best = vpBest(hass, fuel);
  const rows = list
    .slice(0, 10)
    .map((s, i) => {
      const logo = s.logo ? `<img class="logo" src="${vpEsc(s.logo)}" alt="" loading="lazy">` : `<span class="logo">${vpEsc((s.brand || s.name).slice(0, 1).toUpperCase())}</span>`;
      if (!s.available) {
        const since = s.since ? new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" }).format(Date.parse(s.since)) : "";
        return `<div class="item warn station">${logo}<span class="txt"><b>${vpEsc(s.name)}</b><span class="sub">${vpEsc(since ? t("out_since", { f: fuel.name, d: since }) : t("out_of_stock"))}</span></span><b class="warn">${vpEsc(t("shortage"))}</b></div>`;
      }
      const sub = [vpOpenText(ctx, s), s.distance != null ? `${vpFmt(s.distance, lang, 1)} km` : ""].filter(Boolean).join(" · ");
      const sensor = vpPriceSensor(hass, s.id, fuel.name);
      return `<div class="item station ${i === 0 ? "best" : ""}">${logo}<span class="txt"><b>${vpEsc(s.name)}</b><span class="sub ${s.open && !s.open.open ? "m" : ""}">${vpEsc(sub)}</span></span>${vpSpark(ctx.history[sensor])}<b class="price ${i === 0 ? "good" : ""}">${s.price != null ? `${vpFmt(s.price, lang, 3)} €/L` : "—"}</b>${vpDirLink(ctx, s.lat, s.lon)}</div>`;
    })
    .join("");
  const foot = [
    best.change != null ? t("best_change", { v: `${best.change > 0 ? "+" : best.change < 0 ? "−" : ""}${vpFmt(Math.abs(best.change), lang, 3)} €` }) : "",
    best.average != null ? t("avg_30", { v: `${vpFmt(best.average, lang, 3)} €` }) : "",
    best.lowest != null ? t("lowest_30", { v: `${vpFmt(best.lowest, lang, 3)} €` }) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const seg = data.fuels.length > 1 ? vpSeg("fuel", data.fuels.map((f) => [f.key, f.name]), fuel.key) : "";
  return `<div class="c"><div class="h"><b>${vpEsc(t("stations_fuel", { f: fuel.name }))}</b>${seg}</div>${rows ? `<div class="list">${rows}</div>` : `<div class="note">${vpEsc(t("no_station_fuel"))}</div>`}${foot ? `<div class="s m">${vpEsc(foot)}</div>` : ""}</div>`;
};

/** When a charge ends: a timestamp sensor, or minutes left. */
const vpChargeEnd = (ctx, v) => {
  const s = ctx.hass.states[v.ent.charge_time];
  if (!s) return null;
  const at = Date.parse(s.state);
  if (s.attributes?.device_class === "timestamp" && Number.isFinite(at)) return at;
  const n = vpNum(s);
  if (n == null) return null;
  const u = String(s.attributes?.unit_of_measurement || "min");
  return ctx.now + n * (u === "h" ? 3600000 : u === "s" ? 1000 : 60000);
};

/** Charging: each electric or plug-in car, and the home charger's controls (switches, modes, current). */
const vpChargingCard = (ctx, v) => {
  const { hass, t, lang } = ctx;
  const battery = vpNum(hass.states[v.ent.battery_level]);
  const charging = hass.states[v.ent.charging]?.state === "on";
  const end = charging ? vpChargeEnd(ctx, v) : null;
  const time = new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit" });
  const minis = [];
  if (battery != null) minis.push(vpMini(t("battery"), `${vpFmt(battery, lang)} %`, end ? t("full_at", { t: time.format(end) }) : ""));
  if (hass.states[v.ent.charge_power]) minis.push(vpMini(t("power"), vpEsc(vpState(hass, v.ent.charge_power))));
  const ctrls = [];
  for (const id of v.charger) {
    const s = hass.states[id];
    const domain = id.split(".")[0];
    const name = vpName(hass, id, hass.devices?.[v.cfg.charger_device]?.name_by_user || hass.devices?.[v.cfg.charger_device]?.name);
    if (domain === "sensor" && minis.length < 6 && vpNum(s) != null) minis.push(vpMini(name, vpEsc(vpState(hass, id))));
    else if (domain === "switch" && ["on", "off"].includes(s.state))
      ctrls.push(`<button class="btn ${s.state === "on" ? "accent" : ""}" data-act="toggle" data-id="${vpEsc(id)}" data-label="${vpEsc(name)}">${vpEsc(name)} · ${vpEsc(t(s.state === "on" ? "on" : "off"))}</button>`);
    else if (domain === "select" && Array.isArray(s.attributes?.options))
      ctrls.push(`<span class="opts">${s.attributes.options.map((o) => `<button class="${o === s.state ? "on" : ""}" data-act="select" data-id="${vpEsc(id)}" data-o="${vpEsc(o)}">${vpEsc(o)}</button>`).join("")}</span>`);
    else if (domain === "number" && vpNum(s) != null)
      ctrls.push(`<span class="opts"><button data-act="number" data-id="${vpEsc(id)}" data-o="-1" aria-label="−">−</button><b>${vpEsc(vpState(hass, id))}</b><button data-act="number" data-id="${vpEsc(id)}" data-o="1" aria-label="+">+</button></span>`);
  }
  const pill = charging ? `<span class="tag ok">${vpEsc([t("charging"), hass.states[v.ent.charge_power] ? vpState(hass, v.ent.charge_power) : ""].filter(Boolean).join(" · "))}</span>` : hass.states[v.ent.plugged_in]?.state === "on" ? `<span class="tag">${vpEsc(t("plugged"))}</span>` : "";
  return `<div class="c"><div class="h"><b>${vpEsc(t("charging_title", { name: v.name }))}</b>${pill}</div>${minis.length ? `<div class="minis">${minis.join("")}</div>` : ""}${ctrls.length ? `<div class="acts">${ctrls.join("")}</div>` : ""}</div>`;
};

export const vpFuelTab = (ctx) => {
  const { hass, t, lang } = ctx;
  const data = vpFuelData(hass);
  const fuel = data.fuels.find((f) => f.key === ctx.fuel) || data.fuels[0];
  const legacy = vpStations(hass, ctx.settings.fuel_entities);
  let left = "";
  if (fuel) left = vpStationsCard(ctx, data, fuel);
  else if (legacy.length)
    left = `<div class="c"><div class="h"><b>${vpEsc(t("cheapest_fuel"))}</b><span>${vpEsc(t("stations", { n: legacy.length }))}</span></div><table><tbody>${legacy
      .map((s, i) => `<tr class="${i === 0 ? "best" : ""}"><td>${vpEsc(vpName(hass, s.id))}</td><td style="text-align:right"><b>${vpEsc(vpState(hass, s.id))}</b></td><td class="s m" style="text-align:right">${vpEsc(vpRelative(hass.states[s.id].last_changed, lang, ctx.now))}</td></tr>`)
      .join("")}</tbody></table></div>`;
  else left = vpNote(t("no_fuel"));
  const evs = ctx.vehicles.filter((v) => !v.missing && (v.ent.charging || v.ent.plugged_in || v.charger.length));
  left += evs.map((v) => vpChargingCard(ctx, v)).join("");
  const best = fuel ? vpBest(hass, fuel) : null;
  let right = "";
  if (best?.target != null && best.price != null) {
    const at = best.low && best.lowSince ? new Date(best.lowSince) : null;
    const since = at ? (at.toDateString() === new Date(ctx.now).toDateString() ? new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit" }) : new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" })).format(at) : "";
    right += `<div class="c"><div class="h"><b>${vpEsc(t("target_price"))}</b><span class="tag ${best.low ? "ok" : ""}">${vpEsc(t(best.low ? "below" : "above", { v: `${vpFmt(best.target, lang, 3)} €` }))}</span></div>
      <div class="s m">${vpEsc([`${fuel.name} · ${vpFmt(best.price, lang, 3)} €/L`, best.low ? (since ? t("under_target", { t: since }) : "") : t("over_target", { v: `${vpFmt(best.price - best.target, lang, 3)} €` })].filter(Boolean).join(" · "))}</div></div>`;
  }
  right += ctx.vehicles
    .filter((v) => !v.missing)
    .map((v) => {
      const level = vpLevel(hass, v);
      const range = vpRange(hass, v);
      const tank = Number(v.cfg.tank_l);
      const litres = level?.kind === "fuel" && tank > 0 ? (tank * (100 - level.pct)) / 100 : null;
      const low = range != null && range < ctx.settings.low_range;
      // The car's own fuel (from Vehicle Consumption), not the one picked above
      const carFuel = vpCarFuel(hass, v, data);
      const sells = carFuel ? vpStationsFor(data, carFuel.key, ctx.now).filter((s) => s.available && s.price != null) : [];
      const cheapest = sells[0]?.price ?? legacy[0]?.price ?? null;
      const nearest = sells.filter((s) => s.open?.open !== false && s.distance != null).sort((a, b) => a.distance - b.distance)[0];
      return `<div class="c"><div class="h"><b>${vpEsc(v.name)}</b><span class="${low ? "warn" : ""}">${range != null ? `${vpFmt(range, lang)} km` : ""}</span></div>
        ${level ? vpBar(level.pct, level.pct < 20 ? "var(--vp-warn)" : "var(--vp-accent)", "thick") : ""}
        ${litres != null ? `<div class="t r"><span>${vpEsc(t("fill_up", { v: `${vpFmt(litres, lang)} L` }))}</span><b>${cheapest != null ? `≈ ${vpEsc(vpMoney(ctx, litres * cheapest, 0))}` : "—"}</b></div>` : ""}
        ${low && nearest ? `<div class="t r"><span>${vpEsc(t("nearest_open"))}</span><b>${vpEsc(nearest.name)} · ${vpFmt(nearest.distance, lang, 1)} km</b></div>` : ""}</div>`;
    })
    .join("");
  return `<div class="grid2"><div class="col">${left}</div><div class="col">${right}</div></div>`;
};

/** The tyres of a car around a car seen from above, a low one in amber. */
const vpTyresCard = (ctx, v) => {
  const { hass, t, lang } = ctx;
  const ty = vpTyres(hass, v);
  if (!ty) return "";
  const at = (pos) => ty.list.find((x) => x.pos === pos);
  const cell = (pos) => {
    const x = at(pos);
    return x ? `<div class="t r ${x.bar < 1.9 ? "low" : ""}"><span>${vpEsc(t(VP_TYRE_KEYS[pos]))}</span><b>${vpFmt(x.bar, lang, 1)} bar</b></div>` : "<div></div>";
  };
  const lows = ty.list.filter((x) => x.bar < 1.9);
  const tag = lows.length === 1 && lows[0].pos >= 0 ? t("tyre_pos_low", { tyre: t(VP_TYRE_KEYS[lows[0].pos]) }) : t(ty.low ? "tyres_check" : "tyres_ok");
  const other = ty.list.filter((x) => x.pos < 0);
  return `<div class="c"><div class="h"><b>${vpEsc(t("tyres_title", { name: v.name }))}</b><span class="tag ${ty.low ? "warn" : "ok"}">${vpEsc(tag)}</span></div>
    <div class="tyremap">${cell(0)}<svg class="topcar" viewBox="0 0 60 120" aria-hidden="true"><rect x="6" y="4" width="48" height="112" rx="20"/><rect class="glass" x="13" y="28" width="34" height="20" rx="6"/><rect class="glass" x="13" y="84" width="34" height="14" rx="5"/></svg>${cell(1)}${cell(2)}${cell(3)}</div>
    ${other.length ? `<div class="list">${other.map((x) => `<div class="t r"><span>${vpEsc(vpName(hass, x.id))}</span><b>${vpFmt(x.bar, lang, 1)} bar</b></div>`).join("")}</div>` : ""}</div>`;
};

export const vpMaintenanceTab = (ctx) => {
  const { hass, t, lang } = ctx;
  const rows = [];
  for (const i of vpMaintenanceItems(hass)) {
    const tone = i.status === "overdue" ? "err" : i.status === "soon" ? "warn" : i.status === "ok" ? "good" : "";
    const due = i.due ? new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" }).format(Date.parse(i.due)) : "";
    const when =
      i.status === "overdue"
        ? i.due
          ? t("overdue_since", { d: due })
          : t("overdue")
        : i.days_left != null
          ? [t("in_days", { n: i.days_left }), due].join(" · ")
          : i.percent != null
            ? `${i.percent} %`
            : i.state === "ok"
              ? t("tyres_ok")
              : "";
    rows.push(
      `<div class="item ${tone}"><span class="dot"></span><span class="txt"><b>${vpEsc(i.device && i.short ? i.short : i.name)}</b>${i.device ? ` · ${vpEsc(i.device)}` : ""}<span class="sub">${vpEsc(when)}</span></span>${vpCanDone(i) ? `<button class="btn accent" data-act="done" data-id="${vpEsc(i.id)}" data-label="${vpEsc(i.name)}">${vpEsc(t("done"))}</button>` : ""}</div>`,
    );
  }
  for (const v of ctx.vehicles) {
    const s = vpService(hass, v);
    if (!s) continue;
    const sub =
      s.left == null
        ? t("service_unknown")
        : [s.overdue ? t("service_overdue", { n: vpFmt(-s.left, lang) }) : t("service_in", { n: vpFmt(s.left, lang) }), s.lastKm != null ? t("last_at", { n: vpFmt(s.lastKm, lang) }) : ""].filter(Boolean).join(" · ");
    rows.push(
      `<div class="item ${s.overdue ? "err" : "info"}"><span class="dot"></span><span class="txt"><b>${vpEsc(t("service"))}</b> · ${vpEsc(v.name)}<span class="sub">${vpEsc(sub)}</span></span><button class="btn accent" data-act="log" data-v="${vpEsc(v.id)}">${vpEsc(t("log"))}</button></div>`,
    );
  }
  for (const id of ctx.settings.maintenance_entities || []) {
    if (!hass.states[id]) continue;
    const u = vpUrgency(hass.states[id], ctx.now);
    rows.push(`<div class="item ${u === "overdue" ? "err" : u === "soon" ? "warn" : ""}"><span class="dot"></span><span class="txt"><b>${vpEsc(vpName(hass, id))}</b><span class="sub">${vpEsc(vpState(hass, id))}</span></span></div>`);
  }
  const list = rows.length
    ? `<div class="c"><div class="h"><b>${vpEsc(t("maintenance_title"))}</b><span>${vpEsc(t("tasks", { n: rows.length }))}</span></div><div class="list">${rows.join("")}</div></div>`
    : vpNote(t("no_maintenance"));
  const tyres = ctx.vehicles
    .filter((v) => !v.missing)
    .map((v) => vpTyresCard(ctx, v))
    .join("");
  return `<div class="grid2"><div class="col">${list}</div><div class="col">${tyres}</div></div>`;
};

/** The mileage against the contract: driven (solid), the allowance (grey dashes), the projection (amber dashes). */
const vpLeaseChart = (ctx, v, l) => {
  const { t } = ctx;
  const c = vpLeaseCurve(ctx.hass, v, l, ctx.stats, ctx.now);
  const W = 600;
  const H = 180;
  const top = Math.max(l.km, l.projection || 0) * 1.05 || 1;
  const x = (tm) => (((tm - l.start) / (l.end - l.start || 1)) * (W - 4) + 2).toFixed(1);
  const y = (km) => (H - 4 - (km / top) * (H - 10)).toFixed(1);
  const pts = (list) => list.map(([tm, km]) => `${x(tm)},${y(km)}`).join(" ");
  return `<div class="cap">${vpEsc(t("lease_chart"))}</div>
    <svg class="lchart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <polyline class="allow" points="${pts(c.allowance)}"/>${c.projection ? `<polyline class="proj" points="${pts(c.projection)}"/>` : ""}<polyline class="drive" points="${pts(c.driven)}"/></svg>
    <div class="legend"><span><i class="drive"></i>${vpEsc(t("legend_driven"))}</span><span><i class="allow"></i>${vpEsc(t("legend_allowance"))}</span>${c.projection ? `<span><i class="proj"></i>${vpEsc(t("legend_projection"))}</span>` : ""}</div>`;
};

/** The lease of a car: the gap to the pace, the allowance bar, what is left, the projection, the excess cost, the chart. */
const vpLeaseCard = (ctx, v, l) => {
  const { t, lang } = ctx;
  const km = (n) => `${vpFmt(n, lang)} km`;
  const above = l.balance > 0;
  const tag = l.ended ? t("lease_ended") : Math.abs(l.balance) < 1 ? t("lease_on_track") : t(above ? "lease_above" : "lease_below", { n: vpFmt(Math.abs(l.balance), lang) });
  const monthly = l.km / l.months;
  const driven = vpMonthDriven(ctx.hass, v, ctx.stats, ctx.now);
  const ends = new Intl.DateTimeFormat(lang, { month: "short", year: "numeric" }).format(l.end);
  const minis = [
    vpMini(t("expected_today"), km(l.expected), t("month_of", { m: l.month, t: l.months })),
    driven != null && !l.ended ? vpMini(t("left_month"), km(Math.max(0, monthly - driven)), t("of_v", { v: vpFmt(monthly, lang) }), monthly - driven < 0 ? "warn" : "") : "",
    l.perMonth != null ? vpMini(t("per_month_end"), km(l.perMonth)) : "",
    vpMini(t("lease_projection"), l.projection != null ? km(l.projection) : "—", l.pace != null ? t("pace", { v: km(l.pace) }) : "", l.projection > l.km ? "warn" : ""),
    l.overage > 0 && l.cost != null ? vpMini(t("excess_cost"), `≈ ${vpEsc(vpMoney(ctx, l.cost, 0))}`, `${km(l.overage)} × ${vpFmt(l.cost / l.overage, lang, 2)} €`, "warn") : "",
  ].join("");
  return `<div class="c"><div class="h"><b>${vpEsc(t("lease_title", { name: v.name }))}</b><span class="tag ${l.ended ? "" : above && l.projection > l.km ? "warn" : "ok"}">${vpEsc(tag)}</span></div>
    <div class="bar thick"><i style="width:${vpPct((l.driven / l.km) * 100).toFixed(1)}%"></i><span class="mark" style="left:${vpPct((l.expected / l.km) * 100).toFixed(1)}%"></span></div>
    <div class="r s m"><span>${vpEsc(t("lease_driven", { v: km(l.driven) }))}</span><span>${vpEsc(t("lease_ends", { v: km(l.km), d: ends }))}</span></div>
    <div class="minis">${minis}</div>
    ${vpLeaseChart(ctx, v, l)}</div>`;
};

/** The Lease tab: only the cars with a contract (the tab is hidden when none has one). */
export const vpLeaseTab = (ctx) => {
  const cards = ctx.vehicles
    .map((v) => [v, vpLeaseInfo(ctx.hass, v, ctx.now)])
    .filter(([, l]) => l)
    .map(([v, l]) => vpLeaseCard(ctx, v, l));
  if (!cards.length) return vpNote(ctx.t("no_lease"));
  return `<div class="cards" style="grid-template-columns:repeat(auto-fit, minmax(440px, 1fr))">${cards.join("")}</div>`;
};
