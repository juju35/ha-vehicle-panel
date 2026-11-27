// ── What the tabs compute ──
// A vehicle's status (locked, charging, low range), its range and level, the lease projection, and the daily and
// weekly figures drawn from the recorder's history.
import { VP_ERR, VP_OK, VP_WARN, vpKm, vpNum } from "./core.js";
import { VP_BAR } from "./discovery.js";

/** The range in km: the fuel range plus the battery range (a plug-in hybrid has both), null when neither. */
export const vpRange = (hass, v) => {
  const f = vpKm(hass.states?.[v.ent.fuel_range]);
  const b = vpKm(hass.states?.[v.ent.battery_range]);
  return f == null && b == null ? null : (f || 0) + (b || 0);
};

/** The level shown under the range, in %: the fuel level, else the battery level; its kind for the label. */
export const vpLevel = (hass, v) => {
  const fuel = vpNum(hass.states?.[v.ent.fuel_level]);
  if (fuel != null) return { kind: "fuel", pct: fuel };
  const tank = Number(v.cfg?.tank_l);
  const litres = vpNum(hass.states?.[v.ent.fuel_quantity]);
  if (litres != null && tank > 0) return { kind: "fuel", pct: Math.min(100, (litres / tank) * 100) };
  const battery = vpNum(hass.states?.[v.ent.battery_level]);
  return battery != null ? { kind: "battery", pct: battery } : null;
};

/** Locked: the lock entity (locked), else the lock binary sensor (off is locked); null when unknown. */
export const vpLocked = (hass, v) => {
  const lock = hass.states?.[v.ent.lock]?.state;
  if (lock === "locked") return true;
  if (lock === "unlocked" || lock === "open") return false;
  const bin = hass.states?.[v.ent.lock_status]?.state;
  return bin === "off" ? true : bin === "on" ? false : null;
};

/** The vehicle's status: its key, colour and whether something needs looking at. */
export const vpStatus = (hass, v, lowRange) => {
  if (v.missing) return { key: "vehicle_missing", tone: "err", color: VP_ERR };
  const range = vpRange(hass, v);
  const charging = hass.states?.[v.ent.charging]?.state === "on";
  const locked = vpLocked(hass, v);
  if (locked === false) return { key: "unlocked", tone: "warn", color: VP_WARN };
  if (range != null && range < lowRange && !charging) return { key: "low_range", tone: "warn", color: VP_WARN };
  if (charging) return { key: "charging", tone: "ok", color: VP_OK };
  if (hass.states?.[v.ent.plugged_in]?.state === "on") return { key: "plugged", tone: "ok", color: VP_OK };
  if (locked) return { key: "locked", tone: "ok", color: VP_OK };
  return { key: "", tone: "idle", color: "#6b7a89" };
};

/** Where the car is: its zone (home first), else away; null without a tracker. */
export const vpWhere = (hass, v) => {
  const s = hass.states?.[v.ent.location];
  if (!s || ["unavailable", "unknown"].includes(s.state)) return null;
  if (s.state === "home") return { home: true, zone: null };
  if (s.state === "not_home") return { home: false, zone: null };
  const zone = Object.values(hass.states).find((z) => z.entity_id.startsWith("zone.") && z.entity_id.slice(5) === s.state);
  return { home: false, zone: zone?.attributes?.friendly_name || s.state };
};

/** The tyres: each pressure in bar with its position, and whether one is low (attribute or under 1.9 bar). */
export const vpTyres = (hass, v) => {
  const list = v.tyres
    .map((t) => {
      const s = hass.states?.[t.id];
      const n = vpNum(s);
      return { ...t, bar: n == null ? null : n * (VP_BAR[String(s.attributes?.unit_of_measurement || "bar").toLowerCase()] || 1) };
    })
    .filter((t) => t.bar != null);
  if (!list.length) return null;
  return { list, low: list.some((t) => t.bar < 1.9) };
};

const VP_DAY = 86400000;
const vpMonths = (from, to) => (to - from) / (VP_DAY * 30.4375);

/** The lease contract at a date: driven, expected at that date, projection at the end, allowance per month. */
export const vpLease = (hass, v, now = Date.now()) => {
  const km = Number(v.cfg?.lease_km);
  const months = Number(v.cfg?.lease_months);
  const start = Date.parse(`${v.cfg?.lease_start || ""}T00:00:00`);
  const mileage = vpKm(hass.states?.[v.ent.mileage]);
  if (!(km > 0) || !(months > 0) || !Number.isFinite(start) || mileage == null) return null;
  const driven = Math.max(0, mileage - (Number(v.cfg?.lease_start_km) || 0));
  const elapsed = Math.min(months, Math.max(0, vpMonths(start, now)));
  const expected = (km * elapsed) / months;
  const projection = elapsed > 0.5 ? (driven / elapsed) * months : null;
  const left = months - elapsed;
  return {
    km,
    months,
    driven,
    elapsed,
    expected,
    projection,
    ended: left <= 0,
    ahead: projection != null && projection > km,
    allowance: left > 0 ? Math.max(0, (km - driven) / left) : 0,
  };
};

/** Daily distances (km) over the last `days` days, from the mileage history [{s, lu}] (oldest first). */
export const vpDaily = (points, days, now = Date.now()) => {
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const out = [];
  const values = (points || []).map((p) => ({ v: Number(p.s), t: (p.lu ?? 0) * 1000 })).filter((p) => Number.isFinite(p.v));
  const at = (t) => {
    let last = null;
    for (const p of values) if (p.t <= t) last = p.v;
    return last;
  };
  for (let i = days; i > 0; i--) {
    const to = end.getTime() - (i - 1) * VP_DAY;
    const from = to - VP_DAY;
    const a = at(from) ?? values.find((p) => p.t >= from && p.t < to)?.v ?? null;
    const b = at(to);
    out.push({ day: new Date(from), km: a != null && b != null ? Math.max(0, b - a) : null });
  }
  return out;
};

/** Weekly averages of a sensor over the last `weeks` weeks (oldest first), from its history [{s, lu}]. */
export const vpWeekly = (points, weeks, now = Date.now()) => {
  const out = [];
  const values = (points || []).map((p) => ({ v: Number(p.s), t: (p.lu ?? 0) * 1000 })).filter((p) => Number.isFinite(p.v));
  for (let i = weeks; i > 0; i--) {
    const to = now - (i - 1) * 7 * VP_DAY;
    const from = to - 7 * VP_DAY;
    const inWeek = values.filter((p) => p.t >= from && p.t < to).map((p) => p.v);
    out.push(inWeek.length ? inWeek.reduce((a, b) => a + b, 0) / inWeek.length : null);
  }
  return out;
};

/** The fuel stations sorted by price (cheapest first), those without a price left out. */
export const vpStations = (hass, ids) =>
  (ids || [])
    .map((id) => ({ id, price: vpNum(hass.states?.[id]) }))
    .filter((s) => s.price != null)
    .sort((a, b) => a.price - b.price);

/** A maintenance entity's urgency: overdue, soon or ok, from its status attribute or its date or remaining value. */
export const vpUrgency = (state, now = Date.now()) => {
  if (!state) return "ok";
  const a = state.attributes || {};
  const status = String(a.status || a.state || "").toLowerCase();
  if (/overdue|late|expired|retard/.test(status)) return "overdue";
  if (/soon|due|warn|bientot|bientôt/.test(status)) return "soon";
  const t = a.device_class === "timestamp" || a.device_class === "date" ? Date.parse(state.state) : Number.NaN;
  if (Number.isFinite(t)) return t < now ? "overdue" : t - now < 30 * VP_DAY ? "soon" : "ok";
  const n = vpNum(state);
  if (n != null && /^(d|days?|jours?|km)$/i.test(String(a.unit_of_measurement || ""))) {
    if (n <= 0) return "overdue";
    if (n <= (/km/i.test(a.unit_of_measurement) ? 1000 : 30)) return "soon";
  }
  return "ok";
};
