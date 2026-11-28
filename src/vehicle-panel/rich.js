// ── What the richer tabs compute ──
// The figures of the integrations the panel builds on: Vehicle Consumption (months, trips, refuels, lease),
// Carburants France (stations, opening hours, shortages, best price) and Maintenance (its items), and the list of
// what to check on the overview.
import { vpKm, vpNum } from "./core.js";
import { vpFuelEntities, vpMaintenanceSources, vpStationSources } from "./discovery.js";
import { vpLease, vpRange, vpTyres } from "./model.js";

const VP_DAY_MS = 86400000;
// Labels of the tyre positions (index of VP_TYRES)
export const VP_TYRE_KEYS = ["tyre_fl", "tyre_fr", "tyre_rl", "tyre_rr"];

/** The attributes of a vehicle's Vehicle Consumption sensor (months, trips, refuels, lease…), null without one. */
export const vpCard = (hass, v) => (v?.consumption?.card ? hass.states?.[v.consumption.card]?.attributes || null : null);

/** Whether the car is driving now (Vehicle Consumption sees its odometer move). */
export const vpDriving = (hass, v) => vpCard(hass, v)?.driving === true;

const vpHm = (s) => {
  const [h, m] = String(s || "").split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : null;
};

/** Whether a station is open now, from its hours (day 1 = Monday): when it closes, or when it opens next. */
export const vpOpen = (station, now = Date.now()) => {
  if (station?.automate_24_24) return { open: true, always: true };
  const hours = station?.hours;
  if (!Array.isArray(hours) || !hours.length) return null;
  const d = new Date(now);
  const day = ((d.getDay() + 6) % 7) + 1;
  const min = d.getHours() * 60 + d.getMinutes();
  const today = hours.find((h) => h.day === day);
  if (today && !today.closed) {
    for (const [o, c] of today.ranges || []) {
      const a = vpHm(o);
      const b = vpHm(c);
      if (a == null || b == null) continue;
      if (b - a >= 1439 && min >= a) return { open: true, always: true };
      if (min >= a && min < b) return { open: true, closes: c };
    }
    const next = (today.ranges || []).find(([o]) => vpHm(o) > min);
    if (next) return { open: false, opens: next[0] };
  }
  for (let i = 1; i <= 7; i++) {
    const h = hours.find((x) => x.day === ((day - 1 + i) % 7) + 1);
    if (h && !h.closed && h.ranges?.length) return { open: false, opens: h.ranges[0][0], days: i };
  }
  return { open: false };
};

/** The fuels and stations of every Carburants France entry (a station followed twice counted once). */
export const vpFuelData = (hass) => {
  const fuels = [];
  const stations = new Map();
  for (const id of vpStationSources(hass)) {
    const a = hass.states[id].attributes;
    for (const f of a.fuels || []) if (f?.key && !fuels.some((x) => x.key === f.key)) fuels.push(f);
    for (const s of a.stations || []) if (s?.station_id != null && !stations.has(s.station_id)) stations.set(s.station_id, s);
  }
  return { fuels, stations: [...stations.values()] };
};

/** The stations selling a fuel: in stock by price (cheapest first), then those out of stock. */
export const vpStationsFor = (data, fuel, now = Date.now()) =>
  data.stations
    .filter((s) => s.fuels?.[fuel])
    .map((s) => {
      const f = s.fuels[fuel];
      const lat = Number(s.latitude);
      const lon = Number(s.longitude);
      return {
        id: s.station_id,
        name: s.station_name || s.brand || s.address || String(s.station_id),
        brand: s.brand || "",
        logo: /^https:\/\//.test(String(s.logo || "")) ? s.logo : null,
        distance: Number.isFinite(Number(s.distance)) && s.distance != null ? Number(s.distance) : null,
        lat: Number.isFinite(lat) ? lat : null,
        lon: Number.isFinite(lon) ? lon : null,
        price: Number.isFinite(Number(f.price)) && f.price != null ? Number(f.price) : null,
        available: f.available !== false && !f.rupture,
        rupture: !!f.rupture || f.available === false,
        since: f.rupture_since || null,
        open: vpOpen(s, now),
      };
    })
    .sort((a, b) => (a.available !== b.available ? (a.available ? -1 : 1) : (a.price ?? 99) - (b.price ?? 99)));

/** The price sensor of a station and a fuel (for its 30-day line), from its station_id and fuel attributes. */
export const vpPriceSensor = (hass, stationId, fuelName) =>
  Object.values(hass?.entities || {}).find((e) => {
    if (e.platform !== "carburants_france" || e.translation_key !== "price") return false;
    const a = hass.states?.[e.entity_id]?.attributes;
    return a && String(a.station_id) === String(stationId) && a.fuel === fuelName;
  })?.entity_id;

/** The best price of a fuel and its 30-day figures, the target price and whether the price is under it. */
export const vpBest = (hass, fuelName) => {
  const ids = vpFuelEntities(hass, fuelName);
  const best = hass.states?.[ids.best_price];
  const target = vpNum(hass.states?.[ids.target_price]);
  const a = best?.attributes || {};
  return {
    price: vpNum(best),
    average: a.average_30d ?? null,
    lowest: a.lowest_30d ?? null,
    change: a.change_30d ?? null,
    target,
    targetId: ids.target_price,
    low: ids.low_price ? hass.states?.[ids.low_price]?.state === "on" : target != null && vpNum(best) != null && vpNum(best) <= target,
    lowSince: ids.low_price ? hass.states?.[ids.low_price]?.last_changed : null,
  };
};

/** A link to the directions to a point in Google Maps (numbers only, so never anything else than an https URL). */
export const vpDirections = (lat, lon) =>
  Number.isFinite(lat) && Number.isFinite(lon) ? `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)},${lon.toFixed(6)}` : null;

/** The Maintenance items of the vehicle category, the most urgent first, without duplicates across entries. */
export const vpMaintenanceItems = (hass) => {
  const out = [];
  for (const id of vpMaintenanceSources(hass))
    for (const item of hass.states[id].attributes.items || [])
      if (item?.category === "vehicle" && !item.ignored && !out.some((x) => x.id === item.id)) out.push(item);
  const rank = { overdue: 0, soon: 1, ok: 2, unavailable: 3 };
  return out.sort((a, b) => (rank[a.status] ?? 3) - (rank[b.status] ?? 3) || (a.days_left ?? 1e6) - (b.days_left ?? 1e6));
};

/** Whether an item can be marked done from the panel (a task, or a consumable with a reset). */
export const vpCanDone = (item) => !!item && (String(item.id).startsWith("task:") || item.can_reset === true);

/** The next service of Vehicle Consumption: km left (negative once overdue), interval, last service. */
export const vpService = (hass, v) => {
  const s = hass.states?.[v?.consumption?.next_service];
  if (!s) return null;
  const a = s.attributes || {};
  return { left: vpNum(s), interval: a.interval ?? null, last: a.last_service ?? null, lastKm: a.last_service_odometer ?? null, overdue: a.overdue === true || (vpNum(s) ?? 1) < 0 };
};

const vpMonthsBetween = (from, to) => (to - from) / (VP_DAY_MS * 30.4375);

/**
 * The lease of a vehicle: the status of Vehicle Consumption when it has the lease, else computed from the panel's
 * settings. Null without a contract (such a car is not on the Lease tab).
 */
export const vpLeaseInfo = (hass, v, now = Date.now()) => {
  if (!v || v.missing) return null;
  const vc = vpCard(hass, v)?.lease;
  const price = Number(v.cfg?.extra_km_price);
  if (vc && vc.allowance > 0 && vc.driven != null) {
    const start = Date.parse(`${vc.start}T00:00:00`);
    const end = Date.parse(`${vc.end}T00:00:00`);
    const overage = vc.overage ?? (vc.projected != null ? Math.max(0, vc.projected - vc.allowance) : null);
    return {
      km: vc.allowance,
      months: vc.months,
      month: vc.month,
      start,
      end,
      driven: vc.driven,
      expected: vc.prorata,
      balance: vc.balance ?? vc.driven - vc.prorata,
      projection: vc.projected,
      pace: vc.pace,
      perMonth: vc.per_month_left,
      overage,
      cost: vc.overage_cost ?? (price > 0 && overage != null ? overage * price : null),
      ended: vc.ended === true,
    };
  }
  const l = vpLease(hass, v, now);
  if (!l) return null;
  const start = Date.parse(`${v.cfg.lease_start}T00:00:00`);
  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + l.months);
  const overage = l.projection != null ? Math.max(0, l.projection - l.km) : null;
  return {
    km: l.km,
    months: l.months,
    month: Math.min(l.months, Math.floor(l.elapsed) + 1),
    start,
    end: endDate.getTime(),
    driven: l.driven,
    expected: l.expected,
    balance: l.driven - l.expected,
    projection: l.projection,
    pace: l.elapsed > 0.5 ? l.driven / l.elapsed : null,
    perMonth: l.ended ? null : l.allowance,
    overage,
    cost: price > 0 && overage != null ? overage * price : null,
    ended: l.ended,
  };
};

/** The month key YYYY-MM of a date (local time). */
export const vpMonthKey = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Kilometres driven this month: Vehicle Consumption's month, else the mileage statistics (the month's first
 * reading). Null when neither tells.
 */
export const vpMonthDriven = (hass, v, stats, now = Date.now()) => {
  const card = vpCard(hass, v);
  if (card?.month && card.month.month === vpMonthKey(now) && card.month.distance != null) return card.month.distance;
  const rows = stats?.[v.ent?.mileage];
  const mileage = vpKm(hass.states?.[v.ent?.mileage]);
  if (!rows?.length || mileage == null) return null;
  const startOfMonth = new Date(now);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const before = rows.filter((r) => Number(r.start) < startOfMonth.getTime()).at(-1);
  return before?.state != null ? Math.max(0, mileage - Number(before.state)) : null;
};

/**
 * The mileage against the contract, for the chart: the driven km at each month end (from the monthly statistics of
 * the mileage sensor), the allowance line and the projection to the end. Points as [time, km driven].
 */
export const vpLeaseCurve = (hass, v, lease, stats, now = Date.now()) => {
  const rows = (stats?.[v.ent?.mileage] || []).filter((r) => r.state != null && Number(r.start) >= lease.start - 31 * VP_DAY_MS);
  const startKm = Number(v.cfg?.lease_start_km);
  const mileage = vpKm(hass.states?.[v.ent?.mileage]);
  const origin = Number.isFinite(startKm) && startKm > 0 ? startKm : mileage != null ? mileage - lease.driven : null;
  const driven = [[lease.start, 0]];
  if (origin != null)
    for (const r of rows) {
      const t = Number(r.end ?? Number(r.start) + 30 * VP_DAY_MS);
      if (t > lease.start && t < now) driven.push([t, Math.max(0, Number(r.state) - origin)]);
    }
  driven.push([Math.min(now, lease.end), lease.driven]);
  const projection = lease.projection != null && now < lease.end ? [[now, lease.driven], [lease.end, lease.projection]] : null;
  return { driven, projection, allowance: [[lease.start, 0], [lease.end, lease.km]] };
};

/** Months elapsed between two times (for the axis of the lease chart). */
export const vpSpanMonths = (from, to) => Math.max(1, Math.round(vpMonthsBetween(from, to)));

/** The trips of every vehicle with Vehicle Consumption, newest first, the one being driven marked live. */
export const vpAllTrips = (hass, vehicles) => {
  const out = [];
  for (const v of vehicles) {
    const card = vpCard(hass, v);
    if (!card) continue;
    const live = card.driving && card.trip && !card.trip.end ? card.trip : null;
    if (live) out.push({ ...live, vehicle: v, live: true });
    for (const t of card.trips || []) if (!live || t.start !== live.start) out.push({ ...t, vehicle: v });
  }
  return out.sort((a, b) => (b.live ? 1 : 0) - (a.live ? 1 : 0) || String(b.start).localeCompare(String(a.start)));
};

/** The last 7 days of the trips of every vehicle: distance, cost and average consumption. */
export const vpWeek = (hass, vehicles, now = Date.now()) => {
  const from = now - 7 * VP_DAY_MS;
  let distance = 0;
  let fuel = 0;
  let cost = null;
  let n = 0;
  for (const t of vpAllTrips(hass, vehicles)) {
    if (Date.parse(t.start) < from) continue;
    n++;
    distance += Number(t.distance) || 0;
    fuel += Number(t.fuel) || 0;
    if (t.cost != null) cost = (cost || 0) + Number(t.cost);
  }
  return n ? { distance, cost, average: distance >= 5 && fuel > 0 ? (fuel / distance) * 100 : null, trips: n } : null;
};

/** The values of the 12-month chart for a metric: consumption, distance, cost or CO₂ (oldest first). */
export const vpMonthly = (card, metric) =>
  (card?.months || []).slice(-12).map((m) => ({
    month: m.month,
    value:
      metric === "distance" ? m.distance : metric === "cost" ? m.cost : metric === "co2" ? m.co2 : (m.fuel_consumption ?? m.energy_consumption ?? null),
  }));

/** The position of a low tyre (key of its label), the first one under 1.9 bar. */
export const vpLowTyre = (hass, v) => {
  const ty = vpTyres(hass, v);
  const low = ty?.list.find((t) => t.bar < 1.9);
  return low ? { key: low.pos >= 0 ? VP_TYRE_KEYS[low.pos] : null, bar: low.bar, id: low.id } : null;
};

/**
 * What to check, the most urgent first: overdue and soon maintenance (with Done), a car with a low range (with the
 * directions to the cheapest open station), an unlocked car (with Lock), a low tyre, a lease above the pace and the
 * next service (with Log).
 */
export const vpChecks = (hass, vehicles, settings, now = Date.now()) => {
  const out = [];
  for (const item of vpMaintenanceItems(hass))
    if (item.status === "overdue" || item.status === "soon") out.push({ tone: item.status === "overdue" ? "err" : "warn", kind: "maintenance", item });
  const data = vpFuelData(hass);
  for (const v of vehicles) {
    if (v.missing) continue;
    const range = vpRange(hass, v);
    const charging = hass.states?.[v.ent.charging]?.state === "on";
    if (range != null && range < settings.low_range && !charging) {
      const fuel = data.fuels[0]?.key;
      const station = fuel ? vpStationsFor(data, fuel, now).find((s) => s.available && s.open?.open !== false) : null;
      out.push({ tone: "warn", kind: "range", v, range, station });
    }
    if (hass.states?.[v.ent.lock]?.state === "unlocked") out.push({ tone: "warn", kind: "unlocked", v });
    const tyre = vpLowTyre(hass, v);
    if (tyre) out.push({ tone: "warn", kind: "tyre", v, tyre });
    const lease = vpLeaseInfo(hass, v, now);
    if (lease && !lease.ended && lease.balance > 0 && lease.projection > lease.km) out.push({ tone: "warn", kind: "lease", v, lease });
    const service = vpService(hass, v);
    if (service?.left != null && (service.overdue || service.left < 1500)) out.push({ tone: service.overdue ? "err" : "info", kind: "service", v, service });
  }
  const rank = { err: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]);
};
