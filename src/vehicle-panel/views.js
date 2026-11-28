// ── The overview and the settings ──
// Each view returns the HTML of its tab from a context: hass, the resolved vehicles, the settings, the history
// fetched for the charts, the language (lang) and its strings (t). The other tabs are in tabs.js.
import { vpEsc, vpFmt, vpKm, vpName, vpNum, vpRelative, vpState } from "./core.js";
import { vpPictureUrl } from "./discovery.js";
import { vpLevel, vpLocked, vpRange, vpStatus, vpWhere } from "./model.js";
import { vpAllTrips, vpBest, vpCanDone, vpCard, vpChecks, vpDirections, vpDriving, vpFuelData, vpStationsFor, vpWeek } from "./rich.js";
import { vpTileScene } from "./scene.js";

export const VP_ICON_CAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 16v-4l2-5h14l2 5v4Z"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/></svg>';

export const vpPct = (n) => Math.max(0, Math.min(100, n));
export const vpBar = (pct, color, extra = "") => `<div class="bar ${extra}"><i style="width:${vpPct(pct).toFixed(1)}%;background:${color}"></i></div>`;

/** A chart of bars (values may be null): the last bar in the accent, the highest in amber when it stands out. */
export const vpChart = (values, labels) => {
  const known = values.filter((v) => v != null);
  const max = Math.max(...known, 0) || 1;
  const peak = values.indexOf(Math.max(...known));
  const bars = values
    .map((v, i) => {
      if (v == null) return '<div class="none" style="height:3px"></div>';
      const cls = i === values.length - 1 ? "now" : i === peak && v > max * 0.98 && values.length > 2 ? "peak" : "";
      return `<div class="${cls}" style="height:${Math.max(3, (v / max) * 100).toFixed(1)}%"></div>`;
    })
    .join("");
  return `<div class="chart">${bars}</div>${labels ? `<div class="axis">${labels.map((l) => `<span>${vpEsc(l)}</span>`).join("")}</div>` : ""}`;
};

/** A link button to the directions to a point (only built from coordinates: always an https link). */
export const vpDirLink = (ctx, lat, lon) => {
  const url = vpDirections(lat, lon);
  return url ? `<a class="btn" href="${vpEsc(url)}" target="_blank" rel="noopener noreferrer" data-stop>${vpEsc(ctx.t("directions"))}</a>` : "";
};

/** A money amount with the currency of Vehicle Consumption (or the euro). */
export const vpMoney = (ctx, n, digits = 2, currency = "EUR") => {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  try {
    return new Intl.NumberFormat(ctx.lang, { style: "currency", currency: currency || "EUR", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
  } catch {
    return `${vpFmt(n, ctx.lang, digits)} €`;
  }
};

/** The label of a vehicle's button: its friendly name without the device's name in front. */
const vpButtonLabel = (ctx, v, id) => {
  const d = ctx.hass.devices?.[v.id];
  return vpName(ctx.hass, id, d?.name_by_user || d?.name).replace(/^./, (c) => c.toUpperCase());
};

/** A French-style plate badge (blue bands), only when the plate is set in the settings. */
const vpPlate = (plate) => (plate ? `<span class="plate"><i></i>${vpEsc(plate)}<i></i></span>` : "");

/** A tile's status chips: lock, place and last update, driving, outside temperature, doors, charging. */
const vpChips = (ctx, v) => {
  const { hass, t, lang } = ctx;
  const chips = [];
  const locked = vpLocked(hass, v);
  if (locked != null) chips.push(`<span class="chip ${locked ? "ok" : "warn"}">${vpEsc(t(locked ? "locked" : "unlocked"))}</span>`);
  const card = vpCard(hass, v);
  if (vpDriving(hass, v))
    chips.push(`<span class="chip info"><span class="pulse"></span>${vpEsc(t("driving"))}${card?.trip?.distance != null ? ` · ${vpFmt(card.trip.distance, lang)} km` : ""}</span>`);
  const where = vpWhere(hass, v);
  const last = hass.states[v.ent.location_last_activity]?.state || hass.states[v.ent.location]?.last_updated;
  if (where) chips.push(`<span class="chip">${vpEsc([where.home ? t("at_home") : where.zone || t("away"), last ? vpRelative(last, lang, ctx.now) : ""].filter(Boolean).join(" · "))}</span>`);
  const temp = vpNum(hass.states[v.ent.outside_temperature]);
  if (temp != null) chips.push(`<span class="chip">${vpEsc(t("outside", { v: `${vpFmt(temp, lang)} ${hass.states[v.ent.outside_temperature].attributes?.unit_of_measurement || "°C"}` }))}</span>`);
  const doors = hass.states[v.ent.doors]?.state;
  if (doors === "on" || doors === "off") chips.push(`<span class="chip ${doors === "on" ? "warn" : ""}">${vpEsc(t(doors === "on" ? "doors_open" : "doors_closed"))}</span>`);
  if (hass.states[v.ent.charging]?.state === "on") {
    const kw = hass.states[v.ent.charge_power] ? vpState(hass, v.ent.charge_power) : "";
    chips.push(`<span class="chip ok">${vpEsc([t("charging"), kw].filter(Boolean).join(" · "))}</span>`);
  } else if (hass.states[v.ent.plugged_in]?.state === "on") chips.push(`<span class="chip ok">${vpEsc(t("plugged"))}</span>`);
  return chips.length ? `<div class="chips">${chips.join("")}</div>` : "";
};

/** The cheapest station selling the first fuel followed (open now when the hours tell), for the low range line. */
const vpCheapest = (ctx) => {
  const data = vpFuelData(ctx.hass);
  const fuel = data.fuels[0];
  if (!fuel) return null;
  const s = vpStationsFor(data, fuel.key, ctx.now).find((x) => x.available && x.price != null && x.open?.open !== false);
  return s ? { ...s, fuel } : null;
};

/** A vehicle tile of the overview: its scene, name and plate, chips, range and gauge, figures and buttons. */
export const vpVehicleTile = (ctx, v) => {
  const { hass, t, lang } = ctx;
  if (v.missing) return `<div class="c"><div class="note err">${vpEsc(t("vehicle_missing"))}</div></div>`;
  const st = vpStatus(hass, v, ctx.settings.low_range);
  const range = vpRange(hass, v);
  const level = vpLevel(hass, v);
  const mileage = vpKm(hass.states[v.ent.mileage]);
  const low = st.key === "low_range";
  const cheapest = low ? vpCheapest(ctx) : null;
  const best = cheapest ? cheapest.price : vpBest(hass, vpFuelData(hass).fuels[0]?.name).price;
  const tank = Number(v.cfg.tank_l);
  const full = level?.kind === "fuel" && tank > 0 && best != null ? (tank * (100 - level.pct) * best) / 100 : null;
  const minis = [`<div class="mini"><span class="m">${vpEsc(t("mileage"))}</span><b>${mileage != null ? `${vpFmt(mileage, lang)} km` : "—"}</b></div>`];
  if (level)
    minis.push(
      `<div class="mini"><span class="m">${vpEsc(t(level.kind === "fuel" ? "fuel_level" : "battery"))}</span><b class="${level.pct < 20 ? "warn" : ""}">${vpFmt(level.pct, lang)} %</b>${full != null ? `<span class="m">${vpEsc(t("full_cost", { v: vpMoney(ctx, full, 0) }))}</span>` : ""}</div>`,
    );
  if (v.data?.left) {
    const pct = v.data.percent ? `${vpFmt(vpNum(hass.states[v.data.percent]), lang)} %` : "";
    const exp = Date.parse(hass.states[v.data.expiry]?.state || "");
    const renews = Number.isFinite(exp) ? t("renews", { d: new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" }).format(exp) }) : "";
    minis.push(`<div class="mini"><span class="m">${vpEsc(t("data_plan"))}</span><b>${vpEsc(vpState(hass, v.data.left))}</b>${pct || renews ? `<span class="m">${vpEsc([pct, renews].filter(Boolean).join(" · "))}</span>` : ""}</div>`);
  }
  const lockState = hass.states[v.ent.lock]?.state;
  const acts = [];
  if (lockState === "unlocked") acts.push(`<button class="btn err" data-act="lock" data-id="${vpEsc(v.ent.lock)}" data-v="${vpEsc(v.id)}">${vpEsc(t("lock"))}</button>`);
  else if (lockState === "locked") acts.push(`<button class="btn" data-act="unlock" data-id="${vpEsc(v.ent.lock)}" data-v="${vpEsc(v.id)}">${vpEsc(t("unlock"))}</button>`);
  for (const id of v.buttons) {
    const label = vpButtonLabel(ctx, v, id);
    acts.push(`<button class="btn accent" data-act="press" data-id="${vpEsc(id)}" data-v="${vpEsc(v.id)}" data-label="${vpEsc(label)}">${vpEsc(ctx.pressed === id ? t("pressed") : label)}</button>`);
  }
  const levelColor = level && level.pct < 20 ? "var(--vp-warn)" : "var(--vp-accent)";
  return `<div class="c veh" data-vehicle="${vpEsc(v.id)}">
    <div class="scene ${ctx.night ? "night" : ""}">${vpTileScene(vpPictureUrl(hass, v.picture), `${ctx.uid}-${vpEsc(v.id)}`)}</div>
    <div class="vrow"><div class="n">${vpEsc(v.name)}</div>${vpPlate(v.cfg.plate)}</div>
    <div class="vbody">
      ${vpChips(ctx, v)}
      ${range != null ? `<div class="r" style="justify-content:flex-start;align-items:baseline;gap:6px"><span class="big">${vpFmt(range, lang)}</span><span class="m">${vpEsc(t("range"))}</span></div>` : ""}
      ${level ? vpBar(level.pct, levelColor) : ""}
      ${low ? `<div class="s warn">${vpEsc([t("low_range"), cheapest ? t("cheapest_at", { v: `${vpFmt(cheapest.price, lang, 3)} €/L`, d: cheapest.distance != null ? `${vpFmt(cheapest.distance, lang, 1)} km` : cheapest.name }) : ""].filter(Boolean).join(" · "))}</div>` : ""}
      <div class="minis two">${minis.join("")}</div>
      ${acts.length ? `<div class="acts">${acts.join("")}</div>` : ""}
    </div>
  </div>`;
};

/** One line of the list of what to check, with its action. */
const vpCheckRow = (ctx, c) => {
  const { t, lang } = ctx;
  let text = "";
  let act = "";
  if (c.kind === "maintenance") {
    const i = c.item;
    const when = i.status === "overdue" ? t("overdue") : i.days_left != null ? t("in_days", { n: i.days_left }) : i.percent != null ? `${i.percent} %` : t("soon");
    text = `<b>${vpEsc(i.name)}</b>${i.device ? ` · ${vpEsc(i.device)}` : ""} · ${vpEsc(when)}`;
    if (vpCanDone(i)) act = `<button class="btn accent" data-act="done" data-id="${vpEsc(i.id)}" data-label="${vpEsc(i.name)}">${vpEsc(t("done"))}</button>`;
  } else if (c.kind === "range") {
    const s = c.station;
    text = `<b>${vpEsc(c.v.name)}</b> · ${vpEsc(t("km_left", { n: vpFmt(c.range, lang) }))}${s ? ` · ${vpEsc(t("station_at", { s: s.name, v: `${vpFmt(s.price, lang, 3)} €/L` }))}` : ""}`;
    if (s) act = vpDirLink(ctx, s.lat, s.lon);
  } else if (c.kind === "unlocked") {
    text = `<b>${vpEsc(c.v.name)}</b> · ${vpEsc(t("unlocked"))}`;
    act = `<button class="btn err" data-act="lock" data-id="${vpEsc(c.v.ent.lock)}" data-v="${vpEsc(c.v.id)}">${vpEsc(t("lock"))}</button>`;
  } else if (c.kind === "tyre") {
    text = `<b>${vpEsc(c.v.name)}</b> · ${vpEsc(t("tyre_low", { tyre: c.tyre.key ? t(c.tyre.key) : t("tyres"), v: `${vpFmt(c.tyre.bar, lang, 1)} bar` }))}`;
    act = `<button class="btn" data-tab="maintenance">${vpEsc(t("tab_maintenance"))}</button>`;
  } else if (c.kind === "lease") {
    text = `<b>${vpEsc(c.v.name)}</b> · ${vpEsc(t("lease_above", { n: vpFmt(c.lease.balance, lang) }))}`;
    act = `<button class="btn" data-tab="lease">${vpEsc(t("tab_lease"))}</button>`;
  } else if (c.kind === "service") {
    text = `<b>${vpEsc(c.v.name)}</b> · ${vpEsc(c.service.overdue ? t("service_overdue", { n: vpFmt(-c.service.left, lang) }) : t("service_in", { n: vpFmt(c.service.left, lang) }))}`;
    act = `<button class="btn accent" data-act="log" data-v="${vpEsc(c.v.id)}">${vpEsc(t("log"))}</button>`;
  }
  return `<div class="item ${c.tone}"><span class="dot"></span><span class="txt">${text}</span>${act}</div>`;
};

/** What to check, with its actions; a quiet line when there is nothing. */
export const vpChecksCard = (ctx) => {
  const list = vpChecks(ctx.hass, ctx.vehicles, ctx.settings, ctx.now);
  return `<div class="c"><div class="h"><b>${vpEsc(ctx.t("to_check"))}</b><span>${list.length || ""}</span></div>
    ${list.length ? `<div class="list">${list.map((c) => vpCheckRow(ctx, c)).join("")}</div>` : `<div class="note good">${vpEsc(ctx.t("all_good"))}</div>`}</div>`;
};

/** A trip as a line: when, distance, then its duration, consumption and cost. */
export const vpTripRow = (ctx, trip, withCar) => {
  const { t, lang } = ctx;
  const start = Date.parse(trip.start);
  const end = trip.end ? Date.parse(trip.end) : ctx.now;
  const minutes = Math.max(1, Math.round((end - start) / 60000));
  const dur = minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}` : `${minutes} min`;
  const day = new Date(start);
  const today = new Date(ctx.now);
  const yesterday = new Date(ctx.now - 86400000);
  const time = new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit" }).format(day);
  const same = (a, b) => a.toDateString() === b.toDateString();
  const when = trip.live ? t("now") : same(day, today) ? `${t("today")} ${time}` : same(day, yesterday) ? `${t("yesterday")} ${time}` : `${new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric" }).format(day)} ${time}`;
  const cons = trip.fuel_consumption ?? trip.energy_consumption;
  const unit = trip.fuel_consumption != null ? "L/100 km" : "kWh/100 km";
  const sub = [trip.live ? t("driving") : "", dur, cons != null ? `${vpFmt(cons, lang, 1)} ${unit}` : ""].filter(Boolean).join(" · ");
  const currency = vpCard(ctx.hass, trip.vehicle)?.currency;
  return `<div class="item ${trip.live ? "info" : ""}">${withCar ? '<span class="dot"></span>' : ""}<span class="txt">${withCar ? `<b>${vpEsc(trip.vehicle.name)}</b> · ` : ""}<b>${vpEsc(when)}</b> · ${vpFmt(trip.distance, lang, trip.distance < 10 ? 1 : 0)} km<span class="sub">${vpEsc(sub)}</span></span><b>${trip.live || trip.cost == null ? "—" : vpEsc(vpMoney(ctx, trip.cost, 2, currency))}</b></div>`;
};

/** The last 7 days of every car (distance, spending, average) and the last trips. */
const vpWeekCard = (ctx) => {
  const { t, lang } = ctx;
  const week = vpWeek(ctx.hass, ctx.vehicles, ctx.now);
  const trips = vpAllTrips(ctx.hass, ctx.vehicles).slice(0, 4);
  if (!week && !trips.length) return "";
  const many = ctx.vehicles.filter((v) => vpCard(ctx.hass, v)).length > 1;
  return `<div class="c"><div class="h"><b>${vpEsc(t("last_7_days"))}</b><span>${many ? vpEsc(t("all_cars")) : ""}</span></div>
    ${week ? `<div class="minis"><div class="mini"><span class="m">${vpEsc(t("driven"))}</span><b>${vpFmt(week.distance, lang)} km</b></div><div class="mini"><span class="m">${vpEsc(t("spent"))}</span><b>${vpEsc(vpMoney(ctx, week.cost, 0))}</b></div><div class="mini"><span class="m">${vpEsc(t("average"))}</span><b>${week.average != null ? `${vpFmt(week.average, lang, 1)} L/100` : "—"}</b></div></div>` : ""}
    ${trips.length ? `<div class="cap">${vpEsc(t("last_trips"))}</div><div class="list">${trips.map((tr) => vpTripRow(ctx, tr, true)).join("")}</div>` : ""}</div>`;
};

/** Where the cars are: Home Assistant's own map card (mounted by the panel), then each car's place and directions. */
const vpMapCard = (ctx) => {
  const { hass, t, lang } = ctx;
  const cars = ctx.vehicles.filter((v) => !v.missing && hass.states[v.ent.location]);
  if (!cars.length) return "";
  const rows = cars
    .map((v) => {
      const s = hass.states[v.ent.location];
      const where = vpWhere(hass, v);
      const lat = Number(s.attributes?.latitude);
      const lon = Number(s.attributes?.longitude);
      const range = vpRange(hass, v);
      return `<div class="item"><span class="txt"><b>${vpEsc(v.name)}</b> · ${vpEsc(where ? (where.home ? t("at_home") : where.zone || t("away")) : "—")}<span class="sub">${vpEsc([range != null ? `${vpFmt(range, lang)} km` : "", vpRelative(s.last_updated, lang, ctx.now)].filter(Boolean).join(" · "))}</span></span>${where?.home ? "" : vpDirLink(ctx, lat, lon)}</div>`;
    })
    .join("");
  return `<div class="c"><div class="h"><b>${vpEsc(t("where_cars"))}</b></div>${ctx.maps ? '<div class="vp-map"></div>' : ""}<div class="list">${rows}</div></div>`;
};

export const vpOverview = (ctx) => {
  const vs = ctx.vehicles;
  const tiles = `<div class="cards" style="grid-template-columns:repeat(auto-fill, minmax(${vs.length > 1 ? 290 : 400}px, 1fr))">${vs.map((v) => vpVehicleTile(ctx, v)).join("")}</div>`;
  return `<div class="grid2"><div class="col">${tiles}${vpMapCard(ctx)}</div><div class="col">${vpChecksCard(ctx)}${vpWeekCard(ctx)}</div></div>`;
};

const vpOptions = (list, current, autoLabel) =>
  `<option value="">${vpEsc(autoLabel)}</option>${list.map(([value, label]) => `<option value="${vpEsc(value)}" ${value === current ? "selected" : ""}>${vpEsc(label)}</option>`).join("")}`;

/** The Settings tab: each vehicle's name, plate, lease, tank and optional devices, and the low range alert. */
export const vpSettingsTab = (ctx) => {
  const { hass, t } = ctx;
  if (!hass.user?.is_admin) return `<div class="c"><div class="note">${vpEsc(t("admin_only"))}</div></div>`;
  const devicesOf = (test) =>
    Object.values(hass.devices || {})
      .filter((d) => Object.values(hass.entities || {}).some((e) => e.device_id === d.id && test(e)))
      .map((d) => [d.id, d.name_by_user || d.name || d.id]);
  const images = Object.keys(hass.states)
    .filter((id) => id.startsWith("image.") || hass.states[id].attributes?.entity_picture)
    .map((id) => [id, hass.states[id].attributes?.friendly_name || id]);
  const field = (v, key, label, type = "number", extra = "") =>
    `<label class="f">${vpEsc(t(label))}<input type="${type}" ${type === "number" ? 'min="0" inputmode="decimal"' : ""} ${extra} data-v="${vpEsc(v.id)}" data-k="${key}" value="${vpEsc(v.cfg[key] ?? "")}"></label>`;
  const select = (v, key, label, list) => `<label class="f">${vpEsc(t(label))}<select data-v="${vpEsc(v.id)}" data-k="${key}">${vpOptions(list, v.cfg[key], t("s_auto"))}</select></label>`;
  // A home charger: a device with an entity of an EV charger integration, or any device with a charging sensor
  const chargers = devicesOf((e) => /charg|wallbox|easee|zaptec|ocpp|go_e|tesla_wall|ohme|myenergi|alfen|peblar/.test(`${e.platform} ${e.translation_key || ""}`));
  const forms = ctx.vehicles
    .map(
      (v) => `<div class="c"><div class="h"><b>${vpEsc(v.missing ? v.id : v.name)}</b><span>${vpEsc(v.model || "")}</span></div><div class="form">
      ${field(v, "name", "s_name", "text")}${field(v, "plate", "s_plate", "text", 'maxlength="12" autocapitalize="characters"')}
      ${field(v, "lease_km", "s_lease_km")}${field(v, "lease_months", "s_lease_months")}
      ${field(v, "lease_start", "s_lease_start", "date")}
      ${field(v, "lease_start_km", "s_lease_start_km")}${field(v, "extra_km_price", "s_extra_km", "number", 'step="0.01"')}${field(v, "tank_l", "s_tank")}
      ${select(v, "picture_entity", "s_picture", images)}
      ${select(v, "consumption_device", "s_consumption", devicesOf((e) => e.platform === "vehicle_consumption"))}
      ${select(v, "data_device", "s_data", devicesOf((e) => e.platform === "orange_internet_on_the_move"))}
      ${select(v, "charger_device", "s_charger", chargers)}
    </div></div>`,
    )
    .join("");
  return `<div class="h"><b>${vpEsc(t("settings_vehicles"))}</b></div>${forms}
    <div class="c"><div class="h"><b>${vpEsc(t("settings_general"))}</b></div><div class="form">
      <label class="f">${vpEsc(t("s_low_range"))}<input type="number" min="0" max="2000" data-g="low_range" value="${vpEsc(ctx.settings.low_range)}"></label></div>
      <div class="note">${vpEsc(t("pick_vehicles"))}</div>
      <div class="acts"><button class="btn accent" data-save>${vpEsc(ctx.saveState ? t(ctx.saveState) : t("save"))}</button></div></div>`;
};

/** The header's status: unlocked first, then low range, then all locked; the worst tone for the pill. */
export const vpHeadStatus = (ctx) => {
  const { hass, t } = ctx;
  const vs = ctx.vehicles.filter((v) => !v.missing);
  const unlocked = vs.filter((v) => vpLocked(hass, v) === false).length;
  if (unlocked) return { tone: "warn", text: vs.length > 1 ? t("unlocked_count", { n: unlocked }) : t("unlocked") };
  if (vs.some((v) => vpStatus(hass, v, ctx.settings.low_range).key === "low_range")) return { tone: "warn", text: t("low_range") };
  if (vs.some((v) => vpDriving(hass, v))) return { tone: "ok", text: t("driving") };
  if (vs.some((v) => hass.states[v.ent.charging]?.state === "on")) return { tone: "ok", text: t("charging") };
  if (vs.length && vs.every((v) => vpLocked(hass, v))) return { tone: "ok", text: t("all_locked") };
  return null;
};
