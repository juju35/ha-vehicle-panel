// ── The tabs ──
// Each view returns the HTML of its tab from a context: hass, the resolved vehicles, the settings, the history
// fetched for the charts, the language (lang) and its strings (t).
import { vpEsc, vpFmt, vpKm, vpName, vpNum, vpRelative, vpState } from "./core.js";
import { vpPictureUrl } from "./discovery.js";
import { vpDaily, vpLease, vpLevel, vpLocked, vpRange, vpStations, vpStatus, vpTyres, vpUrgency, vpWeekly, vpWhere } from "./model.js";
import { vpTileScene } from "./scene.js";

export const VP_ICON_CAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 16v-4l2-5h14l2 5v4Z"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/></svg>';

const vpPct = (n) => Math.max(0, Math.min(100, n));
const vpBar = (pct, color, extra = "") => `<div class="bar ${extra}"><i style="width:${vpPct(pct).toFixed(1)}%;background:${color}"></i></div>`;

/** A chart of bars (values may be null): the last bar in the accent, the highest in amber when it stands out. */
export const vpChart = (values, labels) => {
  const max = Math.max(...values.filter((v) => v != null), 0) || 1;
  const peak = values.indexOf(Math.max(...values.filter((v) => v != null)));
  const bars = values
    .map((v, i) => {
      if (v == null) return '<div class="none" style="height:3px"></div>';
      const cls = i === values.length - 1 ? "now" : i === peak && v > max * 0.98 && values.length > 2 ? "peak" : "";
      return `<div class="${cls}" style="height:${Math.max(3, (v / max) * 100).toFixed(1)}%"></div>`;
    })
    .join("");
  return `<div class="chart">${bars}</div>${labels ? `<div class="axis">${labels.map((l) => `<span>${vpEsc(l)}</span>`).join("")}</div>` : ""}`;
};

const vpStatusText = (ctx, st) => (st.key ? ctx.t(st.key) : "");

/** A vehicle tile of the overview: its scene, name and status, range, level and three small figures. */
export const vpVehicleTile = (ctx, v) => {
  const { hass, t, lang } = ctx;
  if (v.missing) return `<div class="c"><div class="note err">${vpEsc(t("vehicle_missing"))}</div></div>`;
  const st = vpStatus(hass, v, ctx.settings.low_range);
  const where = vpWhere(hass, v);
  const range = vpRange(hass, v);
  const level = vpLevel(hass, v);
  const tyres = vpTyres(hass, v);
  const mileage = vpKm(hass.states[v.ent.mileage]);
  const third = v.data?.left
    ? `<div class="mini"><span class="m">${vpEsc(t("data_plan"))}</span><b>${vpEsc(vpState(hass, v.data.left))}</b></div>`
    : level
      ? `<div class="mini"><span class="m">${vpEsc(t(level.kind === "fuel" ? "fuel_level" : "battery"))}</span><b>${vpFmt(level.pct, lang)} %</b></div>`
      : "";
  const sub = [vpStatusText(ctx, st), where ? (where.home ? t("at_home") : where.zone || t("away")) : ""].filter(Boolean).join(" · ");
  const levelColor = level && level.pct < 20 ? "var(--vp-warn)" : "var(--vp-accent)";
  const acts = v.buttons
    .map((id) => ({ id, key: /horn|klaxon/.test(id) ? "sound_horn" : /light|phare|flash/.test(id) ? "flash_lights" : /ac|clim|hvac|precond/.test(id) ? "start_ac" : null }))
    .filter((b) => b.key)
    .slice(0, 3);
  return `<div class="c veh" data-vehicle="${vpEsc(v.id)}">
    <div class="scene ${ctx.night ? "night" : ""}">${vpTileScene(vpPictureUrl(hass, v.picture), `${ctx.uid}-${vpEsc(v.id)}`)}</div>
    <div class="vrow"><div><div class="n">${vpEsc(v.name)}</div><div class="st" style="color:${st.color}">${vpEsc(sub)}</div></div><span class="dot" style="background:${st.color}"></span></div>
    <div class="vbody">
      ${range != null ? `<div class="r" style="justify-content:flex-start;align-items:baseline;gap:6px"><span class="big">${vpFmt(range, lang)}</span><span class="m">${vpEsc(t("range"))}</span></div>` : ""}
      ${level ? vpBar(level.pct, levelColor) : ""}
      <div class="minis">
        <div class="mini"><span class="m">${vpEsc(t("mileage"))}</span><b>${mileage != null ? `${vpFmt(mileage, lang)} km` : "—"}</b></div>
        <div class="mini"><span class="m">${vpEsc(t("tyres"))}</span><b class="${tyres?.low ? "warn" : tyres ? "good" : ""}">${tyres ? vpEsc(t(tyres.low ? "tyres_check" : "tyres_ok")) : "—"}</b></div>
        ${third}
      </div>
      ${acts.length ? `<div class="acts">${acts.map((b) => `<button class="btn" data-press="${vpEsc(b.id)}">${vpEsc(ctx.pressed === b.id ? t("pressed") : t(b.key))}</button>`).join("")}</div>` : ""}
    </div>
  </div>`;
};

/** The 8-week consumption chart of a vehicle with a Vehicle Consumption device. */
export const vpConsumptionCard = (ctx, v) => {
  const { hass, t, lang } = ctx;
  const c = v.consumption;
  if (!c?.average) return "";
  const weeks = vpWeekly(ctx.history[c.average], 8, ctx.now);
  const unit = hass.states[c.average]?.attributes?.unit_of_measurement || "";
  const peakIdx = weeks.indexOf(Math.max(...weeks.filter((w) => w != null)));
  const extra = [c.distance ? vpState(hass, c.distance) : "", c.trips ? `${vpState(hass, c.trips)}` : "", c.cost ? vpState(hass, c.cost) : ""].filter(Boolean).join(" · ");
  return `<div class="c"><div class="h"><b>${vpEsc(t("consumption_title", { name: v.name }))}</b><span>${vpEsc(t("weeks_8"))}</span></div>
    <div style="display:flex;gap:18px;align-items:flex-end"><div style="flex:1">${vpChart(weeks)}</div>
      <div style="width:150px;display:flex;flex-direction:column;gap:8px"><div><span class="mid">${vpFmt(vpNum(hass.states[c.average]), lang, 1)}</span> <span class="m s">${vpEsc(unit)}</span><div class="s m">${vpEsc(t("this_week_avg"))}</div></div>
      ${extra ? `<div class="s">${vpEsc(extra)}</div>` : ""}</div></div>
    ${peakIdx >= 0 && peakIdx < weeks.length - 1 && weeks.filter((w) => w != null).length > 2 ? `<div class="s warn">${vpEsc(t("peak", { v: `${vpFmt(weeks[peakIdx], lang, 1)} ${unit}`, weeks: weeks.length - 1 - peakIdx }))}</div>` : ""}
  </div>`;
};

/** The lease card of a vehicle: driven against the contract, the pace marker, the projection and allowance. */
export const vpLeaseCard = (ctx, v) => {
  const { t, lang } = ctx;
  const l = vpLease(ctx.hass, v, ctx.now);
  if (!l) return "";
  const km = (n) => `${vpFmt(n, lang)} km`;
  const tone = l.ended ? "" : l.ahead ? "warn" : "good";
  return `<div class="c"><div class="h"><b>${vpEsc(t("lease_title", { name: v.name }))}</b><span class="${tone}" style="font-weight:700">${vpEsc(t(l.ended ? "lease_ended" : l.ahead ? "lease_ahead" : "lease_on_track"))}</span></div>
    <div class="bar thick">${`<i style="width:${vpPct((l.driven / l.km) * 100).toFixed(1)}%"></i>`}<span class="mark" style="left:${vpPct((l.expected / l.km) * 100).toFixed(1)}%"></span></div>
    <div class="r s m"><span>${vpEsc(t("lease_driven", { v: km(l.driven) }))}</span><span>${vpEsc(t("lease_contract", { v: km(l.km) }))}</span></div>
    <div class="minis" style="grid-template-columns:repeat(2,minmax(0,1fr))">
      <div class="mini"><span class="m">${vpEsc(t("lease_expected", { m: vpFmt(l.elapsed, lang), t: vpFmt(l.months, lang) }))}</span><b>${km(l.expected)}</b></div>
      <div class="mini"><span class="m">${vpEsc(t("lease_projection"))}</span><b class="${l.ahead ? "warn" : ""}">${l.projection != null ? km(l.projection) : "—"}</b></div>
    </div>
    ${l.ended ? "" : `<div class="s">${vpEsc(t("lease_allowance", { v: km(l.allowance) }))}</div>`}
  </div>`;
};

/** The cheapest stations (`count` of them), with the fill-up cost of the vehicles that know their tank. */
export const vpFuelCard = (ctx, count) => {
  const { hass, t } = ctx;
  const stations = vpStations(hass, ctx.settings.fuel_entities);
  if (!stations.length) return "";
  const rows = stations
    .slice(0, count)
    .map((s, i) => `<div class="t r" ${i === 0 ? 'style="background:color-mix(in srgb, var(--vp-ok) 10%, transparent)"' : ""}><span>${vpEsc(vpName(hass, s.id))}</span><b class="${i === 0 ? "good" : ""}">${vpEsc(vpState(hass, s.id))}</b></div>`)
    .join("");
  return `<div class="c"><div class="h"><b>${vpEsc(t("cheapest_fuel"))}</b><span>${vpEsc(t("stations", { n: stations.length }))}</span></div><div style="display:flex;flex-direction:column;gap:8px">${rows}</div></div>`;
};

/** The maintenance entities, the most urgent first (`count` of them). */
export const vpMaintenanceCard = (ctx, count) => {
  const { hass, t } = ctx;
  const order = { overdue: 0, soon: 1, ok: 2 };
  const items = (ctx.settings.maintenance_entities || [])
    .filter((id) => hass.states[id])
    .map((id) => ({ id, u: vpUrgency(hass.states[id], ctx.now) }))
    .sort((a, b) => order[a.u] - order[b.u]);
  if (!items.length) return "";
  const rows = items
    .slice(0, count)
    .map((i) => `<div class="r" style="font-size:13px"><span>${vpEsc(vpName(hass, i.id))}</span><span class="${i.u === "overdue" ? "err" : i.u === "soon" ? "warn" : "m"}" style="font-weight:600">${vpEsc(vpState(hass, i.id))}</span></div>`)
    .join("");
  return `<div class="c"><div class="h"><b>${vpEsc(t("maintenance_title"))}</b></div><div style="display:flex;flex-direction:column;gap:8px">${rows}</div></div>`;
};

export const vpOverview = (ctx) => {
  const vs = ctx.vehicles;
  const first = vs.find((v) => v.consumption?.average);
  const lease = vs.find((v) => !v.missing && vpLease(ctx.hass, v, ctx.now));
  const right = [lease ? vpLeaseCard(ctx, lease) : "", vpFuelCard(ctx, 2), vpMaintenanceCard(ctx, 3)].join("");
  const tiles = `<div class="cards" style="grid-template-columns:repeat(auto-fill, minmax(${vs.length > 1 ? 280 : 400}px, 1fr))">${vs.map((v) => vpVehicleTile(ctx, v)).join("")}</div>`;
  const left = `<div class="col">${tiles}${first ? vpConsumptionCard(ctx, first) : ""}</div>`;
  return right.trim() ? `<div class="grid2">${left}<div class="col">${right}</div></div>` : left;
};

export const vpTrips = (ctx) => {
  const { hass, t, lang } = ctx;
  const days = new Intl.DateTimeFormat(lang, { weekday: "short" });
  return `<div class="cards">${ctx.vehicles
    .filter((v) => !v.missing)
    .map((v) => {
      const where = vpWhere(hass, v);
      const last = hass.states[v.ent.location_last_activity]?.state || hass.states[v.ent.location]?.last_updated;
      const daily = v.ent.mileage ? vpDaily(ctx.history[v.ent.mileage], 7, ctx.now) : [];
      const known = daily.filter((d) => d.km != null);
      const week = known.reduce((a, d) => a + d.km, 0);
      const chart = known.length
        ? `${vpChart(
            daily.map((d) => d.km),
            daily.map((d) => days.format(d.day)),
          )}<div class="r s"><span>${vpEsc(t("today"))} <b>${vpFmt(daily.at(-1)?.km, lang)} km</b></span><span>${vpEsc(t("this_week"))} <b>${vpFmt(week, lang)} km</b></span></div>`
        : `<div class="note">${vpEsc(t("no_history"))}</div>`;
      return `<div class="c"><div class="h"><b>${vpEsc(v.name)}</b><span>${vpEsc(t("last_7_days"))}</span></div>
        ${where ? `<div class="t r"><span>${vpEsc(t("location"))}</span><b>${vpEsc(where.home ? t("at_home") : where.zone || t("away"))}</b></div>` : ""}
        ${last ? `<div class="s m">${vpEsc(t("updated", { t: vpRelative(last, lang, ctx.now) }))}</div>` : ""}
        ${chart}</div>`;
    })
    .join("")}</div>`;
};

export const vpConsumptionTab = (ctx) => {
  const { hass, t } = ctx;
  const with_ = ctx.vehicles.filter((v) => v.consumption);
  if (!with_.length) return `<div class="c"><div class="note">${vpEsc(t("no_consumption"))}</div></div>`;
  return with_
    .map((v) => {
      const dev = hass.devices?.[v.consumption.device];
      const tiles = v.consumption.all
        .map((id) => `<div class="mini"><span class="m">${vpEsc(vpName(hass, id, dev?.name_by_user || dev?.name))}</span><b>${vpEsc(vpState(hass, id))}</b></div>`)
        .join("");
      return `${vpConsumptionCard(ctx, v)}<div class="c"><div class="h"><b>${vpEsc(v.name)}</b></div><div class="minis" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">${tiles}</div></div>`;
    })
    .join("");
};

export const vpFuelTab = (ctx) => {
  const { hass, t, lang } = ctx;
  const stations = vpStations(hass, ctx.settings.fuel_entities);
  const cheapest = stations[0]?.price;
  const vehicles = ctx.vehicles
    .filter((v) => !v.missing)
    .map((v) => {
      const level = vpLevel(hass, v);
      const range = vpRange(hass, v);
      const tank = Number(v.cfg.tank_l);
      const cost = level?.kind === "fuel" && tank > 0 && cheapest != null ? (tank * (100 - level.pct) * cheapest) / 100 : null;
      const unit = String(hass.states[stations[0]?.id]?.attributes?.unit_of_measurement || "€").split("/")[0];
      return `<div class="c"><div class="h"><b>${vpEsc(v.name)}</b><span>${range != null ? `${vpFmt(range, lang)} km` : ""}</span></div>
        ${level ? `${vpBar(level.pct, level.pct < 20 ? "var(--vp-warn)" : "var(--vp-accent)", "thick")}<div class="r s"><span>${vpEsc(t(level.kind === "fuel" ? "fuel_level" : "battery"))}</span><b>${vpFmt(level.pct, lang)} %</b></div>` : ""}
        ${cost != null ? `<div class="s">${vpEsc(t("fill_cost", { v: `${vpFmt(cost, lang)} ${unit}` }))}</div>` : ""}</div>`;
    })
    .join("");
  const table = stations.length
    ? `<div class="c"><div class="h"><b>${vpEsc(t("cheapest_fuel"))}</b><span>${vpEsc(t("stations", { n: stations.length }))}</span></div><table><tbody>${stations
        .map((s, i) => `<tr class="${i === 0 ? "best" : ""}"><td>${vpEsc(vpName(hass, s.id))}</td><td style="text-align:right"><b>${vpEsc(vpState(hass, s.id))}</b></td><td class="s m" style="text-align:right">${vpEsc(vpRelative(hass.states[s.id].last_changed, lang, ctx.now))}</td></tr>`)
        .join("")}</tbody></table></div>`
    : `<div class="c"><div class="note">${vpEsc(t("no_fuel"))}</div></div>`;
  return `<div class="grid2"><div class="col">${table}</div><div class="col">${vehicles}</div></div>`;
};

export const vpMaintenanceTab = (ctx) => {
  const { hass, t, lang } = ctx;
  const list = vpMaintenanceCard(ctx, 50) || `<div class="c"><div class="note">${vpEsc(t("no_maintenance"))}</div></div>`;
  const names = ["tyre_fl", "tyre_fr", "tyre_rl", "tyre_rr"];
  const tyres = ctx.vehicles
    .filter((v) => !v.missing)
    .map((v) => {
      const ty = vpTyres(hass, v);
      if (!ty) return "";
      return `<div class="c"><div class="h"><b>${vpEsc(t("tyre_pressure", { name: v.name }))}</b><span class="${ty.low ? "warn" : "good"}" style="font-weight:700">${vpEsc(t(ty.low ? "tyres_check" : "tyres_ok"))}</span></div><div class="tyres">${ty.list
        .map((x) => `<div class="t r"><span>${vpEsc(x.pos >= 0 ? t(names[x.pos]) : vpName(hass, x.id))}</span><b class="${x.bar < 1.9 ? "warn" : ""}">${vpFmt(x.bar, lang, 1)} bar</b></div>`)
        .join("")}</div></div>`;
    })
    .join("");
  return `<div class="grid2"><div class="col">${list}</div><div class="col">${tyres}</div></div>`;
};

export const vpLeaseTab = (ctx) => {
  const { t } = ctx;
  return `<div class="cards">${ctx.vehicles
    .filter((v) => !v.missing)
    .map((v) => vpLeaseCard(ctx, v) || `<div class="c"><div class="h"><b>${vpEsc(v.name)}</b></div><div class="note">${vpEsc(t("no_lease"))}</div></div>`)
    .join("")}</div>`;
};

const vpOptions = (list, current, autoLabel) =>
  `<option value="">${vpEsc(autoLabel)}</option>${list.map(([value, label]) => `<option value="${vpEsc(value)}" ${value === current ? "selected" : ""}>${vpEsc(label)}</option>`).join("")}`;

/** The Settings tab: each vehicle's name, lease, tank and optional devices, and the low range alert. */
export const vpSettingsTab = (ctx) => {
  const { hass, t } = ctx;
  if (!hass.user?.is_admin) return `<div class="c"><div class="note">${vpEsc(t("admin_only"))}</div></div>`;
  const devicesOf = (platform) =>
    Object.values(hass.devices || {})
      .filter((d) => Object.values(hass.entities || {}).some((e) => e.device_id === d.id && e.platform === platform))
      .map((d) => [d.id, d.name_by_user || d.name || d.id]);
  const images = Object.keys(hass.states)
    .filter((id) => id.startsWith("image.") || hass.states[id].attributes?.entity_picture)
    .map((id) => [id, hass.states[id].attributes?.friendly_name || id]);
  const num = (v, key, label) => `<label class="f">${vpEsc(t(label))}<input type="number" min="0" inputmode="numeric" data-v="${vpEsc(v.id)}" data-k="${key}" value="${vpEsc(v.cfg[key] ?? "")}"></label>`;
  const forms = ctx.vehicles
    .map(
      (v) => `<div class="c"><div class="h"><b>${vpEsc(v.missing ? v.id : v.name)}</b><span>${vpEsc(v.model || "")}</span></div><div class="form">
      <label class="f">${vpEsc(t("s_name"))}<input type="text" data-v="${vpEsc(v.id)}" data-k="name" value="${vpEsc(v.cfg.name ?? "")}"></label>
      ${num(v, "lease_km", "s_lease_km")}${num(v, "lease_months", "s_lease_months")}
      <label class="f">${vpEsc(t("s_lease_start"))}<input type="date" data-v="${vpEsc(v.id)}" data-k="lease_start" value="${vpEsc(v.cfg.lease_start ?? "")}"></label>
      ${num(v, "lease_start_km", "s_lease_start_km")}${num(v, "tank_l", "s_tank")}
      <label class="f">${vpEsc(t("s_picture"))}<select data-v="${vpEsc(v.id)}" data-k="picture_entity">${vpOptions(images, v.cfg.picture_entity, t("s_auto"))}</select></label>
      <label class="f">${vpEsc(t("s_consumption"))}<select data-v="${vpEsc(v.id)}" data-k="consumption_device">${vpOptions(devicesOf("vehicle_consumption"), v.cfg.consumption_device, t("s_auto"))}</select></label>
      <label class="f">${vpEsc(t("s_data"))}<select data-v="${vpEsc(v.id)}" data-k="data_device">${vpOptions(devicesOf("orange_internet_on_the_move"), v.cfg.data_device, t("s_auto"))}</select></label>
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
  if (vs.some((v) => hass.states[v.ent.charging]?.state === "on")) return { tone: "ok", text: t("charging") };
  if (vs.length && vs.every((v) => vpLocked(hass, v))) return { tone: "ok", text: t("all_locked") };
  return null;
};
