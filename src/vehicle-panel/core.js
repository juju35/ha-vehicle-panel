// ── Constants, strings and formatting ──
// The panel's English strings (the other languages are frontend/i18n/<lang>.json, loaded on demand), its
// colours, and the helpers every tab uses: escaping, numbers, dates, the language.

export const VEHICLE_PANEL_VERSION = "1.1.0";

// Languages with a file in frontend/i18n/ (English is built in)
export const VP_LANGS = ["en", "fr", "de", "es", "it", "nl", "pt", "pl", "sr", "sr-Latn", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"];

export const VP_TABS = ["overview", "trips", "consumption", "fuel", "maintenance", "lease", "settings"];

export const VP_EN = {
  title: "Vehicles",
  tab_overview: "Overview",
  tab_trips: "Trips",
  tab_consumption: "Consumption",
  tab_fuel: "Fuel",
  tab_maintenance: "Maintenance",
  tab_lease: "Lease",
  tab_settings: "Settings",
  vehicles_count: "Vehicles: {n}",
  all_locked: "All locked",
  unlocked: "Unlocked",
  unlocked_count: "Unlocked: {n}",
  low_range: "Low range",
  charging: "Charging",
  plugged: "Plugged in",
  locked: "Locked",
  at_home: "At home",
  away: "Away",
  no_vehicle: "No vehicle yet: pick your cars in Settings → Devices & services → Vehicle Panel → Configure.",
  vehicle_missing: "This vehicle is no longer in Home Assistant: pick it again in the integration's options.",
  range: "km range",
  mileage: "Mileage",
  tyres: "Tyres",
  tyres_ok: "OK",
  tyres_check: "Check",
  fuel_level: "Fuel",
  battery: "Battery",
  data_plan: "Data plan",
  updated: "Updated {t}",
  location: "Location",
  today: "Today",
  this_week: "This week",
  last_7_days: "Last 7 days",
  no_history: "No history yet for the mileage of this vehicle.",
  consumption_title: "Consumption · {name}",
  weeks_8: "8 weeks",
  this_week_avg: "this week",
  no_consumption: "No consumption figures for this vehicle: add the Vehicle Consumption integration and pick its device in Settings.",
  cheapest_fuel: "Cheapest fuel",
  stations: "Stations: {n}",
  no_fuel: "No fuel prices: pick the stations of the Carburants France integration in the integration's options.",
  maintenance_title: "Maintenance",
  no_maintenance: "No maintenance entity: pick those of the Maintenance integration in the integration's options.",
  tyre_fl: "Front left",
  tyre_fr: "Front right",
  tyre_rl: "Rear left",
  tyre_rr: "Rear right",
  lease_title: "Lease · {name}",
  lease_on_track: "On track",
  lease_driven: "Driven: {v}",
  lease_projection: "Projection at the end of the contract",
  lease_ended: "Contract ended",
  no_lease: "No lease contract for this vehicle: set its mileage, length and start date in Settings.",
  settings_vehicles: "Vehicles",
  settings_general: "General",
  s_name: "Name",
  s_lease_km: "Lease mileage (km)",
  s_lease_months: "Lease length (months)",
  s_lease_start: "Lease start",
  s_lease_start_km: "Mileage at the start (km)",
  s_tank: "Tank (L)",
  s_picture: "Picture",
  s_consumption: "Vehicle Consumption device",
  s_data: "Orange Internet On the move device",
  s_low_range: "Low range alert (km)",
  s_auto: "Automatic",
  save: "Save",
  saved: "Saved",
  save_failed: "Could not save the settings",
  admin_only: "Only an administrator can change the settings.",
  pick_vehicles: "The vehicles, the fuel stations and the maintenance entities are picked in the integration's options.",
  pressed: "Done",
  directions: "Directions",
  driving: "Driving",
  outside: "{v} outside",
  doors_open: "Doors open",
  doors_closed: "Doors closed",
  full_cost: "full ≈ {v}",
  renews: "renews {d}",
  lock: "Lock",
  unlock: "Unlock",
  cheapest_at: "cheapest station {v}, {d}",
  overdue: "overdue",
  overdue_since: "overdue since {d}",
  in_days: "in {n} days",
  soon: "soon",
  done: "Done",
  km_left: "{n} km left",
  station_at: "{s} at {v}",
  tyre_low: "{tyre} tyre at {v}",
  lease_above: "{n} km above the pace",
  lease_below: "{n} km below the pace",
  service: "Service",
  service_in: "service in {n} km",
  service_overdue: "service {n} km overdue",
  service_unknown: "log the last service to follow the next one",
  last_at: "last at {n} km",
  log: "Log",
  to_check: "To check",
  all_good: "Nothing to check",
  now: "Now",
  yesterday: "Yesterday",
  all_cars: "all cars",
  driven: "Driven",
  spent: "Spent",
  average: "Average",
  last_trips: "Last trips",
  where_cars: "Where are the cars",
  recent_trips: "Recent trips",
  no_trips: "No trip yet.",
  this_month: "This month",
  this_month_n: "This month: {n}",
  vs_average: "{v} vs average",
  consumption: "Consumption",
  distance: "Distance",
  cost: "Cost",
  trips: "Trips",
  next_service: "Next service",
  every_km: "every {n} km",
  average_since: "Average since {d}: {v}",
  lowest_in: "lowest in {m}",
  months_12: "12 months",
  refuels: "Refuels",
  charges: "Charges",
  log_refuel: "Log a refuel",
  log_charge: "Log a charge",
  no_refuels: "No refuel yet.",
  trips_7_days: "Trips · last 7 days",
  stations_fuel: "Stations · {f}",
  no_station_fuel: "No followed station sells this fuel.",
  open: "Open",
  open_24: "Open 24/7",
  open_until: "Open · closes {t}",
  closed: "Closed",
  closed_opens: "Closed · opens {t}",
  out_since: "{f} out of stock since {d}",
  out_of_stock: "Out of stock",
  shortage: "Shortage",
  best_change: "Best price {v} against the month",
  avg_30: "30-day average {v}",
  lowest_30: "lowest {v}",
  target_price: "Target price",
  below: "Below {v}",
  above: "Above {v}",
  under_target: "under your target since {t}",
  over_target: "{v} above your target",
  fill_up: "Fill up · {v}",
  nearest_open: "Nearest open station",
  charging_title: "Charging · {name}",
  full_at: "full at {t}",
  power: "Power",
  on: "on",
  off: "off",
  tyres_title: "Tyres · {name}",
  tyre_pos_low: "{tyre} low",
  tasks: "Tasks: {n}",
  lease_ends: "{v} · ends {d}",
  expected_today: "Expected today",
  month_of: "month {m} / {t}",
  left_month: "Left this month",
  of_v: "of {v}",
  per_month_end: "Per month to the end",
  pace: "at {v} a month",
  excess_cost: "Excess cost",
  lease_chart: "Mileage against the contract",
  legend_driven: "driven",
  legend_allowance: "allowance",
  legend_projection: "projection",
  ask_press: "Press “{name}” on {car}?",
  ask_lock: "Lock {car}?",
  ask_unlock: "Unlock {car}?",
  ask_done: "Mark “{name}” as done?",
  ask_toggle: "Switch “{name}”?",
  confirm: "Confirm",
  cancel: "Cancel",
  log_service: "Log a service",
  f_liters: "Litres",
  f_energy: "Energy (kWh)",
  f_cost: "Cost",
  f_price: "Price per unit",
  f_odometer: "Mileage (km)",
  f_interval: "Interval (km)",
  need_amount: "Enter the quantity.",
  action_failed: "That did not work: check the integration.",
  s_plate: "Plate",
  s_extra_km: "Price of an extra km",
  s_charger: "Home charger device",
};

// Colours of the ha-* charter: accent, and the states (good, warning, error)
export const VP_ACCENT = "#2F6FDE";
export const VP_OK = "#1E8E5A";
export const VP_WARN = "#C77700";
export const VP_ERR = "#D93838";

export const vpEsc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** The language of the panel: the full code when it has a file, then its base, then English (pt-BR → pt). */
export const vpLang = (code) => {
  const c = String(code || "en");
  if (VP_LANGS.includes(c)) return c;
  const base = c.split("-")[0];
  return VP_LANGS.includes(base) ? base : "en";
};

/** A string of `strings` (else English), its {placeholders} filled. */
export const vpT = (strings, key, vars) => {
  let s = strings?.[key] ?? VP_EN[key] ?? key;
  for (const [k, v] of Object.entries(vars || {})) s = s.replace(`{${k}}`, v);
  return s;
};

/** A state's number, null when it has none (unavailable, unknown, text). */
export const vpNum = (state) => {
  if (!state || ["unavailable", "unknown", ""].includes(state.state)) return null;
  const n = Number(state.state);
  return Number.isFinite(n) ? n : null;
};

/** A number in the language's format, with up to `digits` decimals; — when there is none. */
export const vpFmt = (n, lang, digits = 0) =>
  n == null || !Number.isFinite(n) ? "—" : Number(n).toLocaleString(lang, { maximumFractionDigits: digits, minimumFractionDigits: 0 });

/** Kilometres from a distance state in km, m or miles (the panel counts in km). */
export const vpKm = (state) => {
  const n = vpNum(state);
  if (n == null) return null;
  const u = String(state.attributes?.unit_of_measurement || "km").toLowerCase();
  return u === "mi" ? n * 1.609344 : u === "m" ? n / 1000 : n;
};

/** "5 min ago", "in 3 days"… in the language. */
export const vpRelative = (date, lang, now = Date.now()) => {
  const t = new Date(date).getTime();
  if (!Number.isFinite(t)) return "";
  const s = Math.round((t - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const a = Math.abs(s);
  if (a < 60) return rtf.format(Math.round(s), "second");
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86400), "day");
};

/** A state as Home Assistant shows it (its own formatting when the frontend gives one). */
export const vpState = (hass, id) => {
  const s = hass?.states?.[id];
  if (!s) return "—";
  if (hass.formatEntityState) return hass.formatEntityState(s);
  const u = s.attributes?.unit_of_measurement;
  return `${s.state}${u ? ` ${u}` : ""}`;
};

/** The friendly name of an entity, without the device's name in front of it when it starts with it. */
export const vpName = (hass, id, deviceName) => {
  const name = hass?.states?.[id]?.attributes?.friendly_name || id;
  if (deviceName && name.startsWith(`${deviceName} `)) return name.slice(deviceName.length + 1);
  return name;
};

// Language files already fetched (one request per language and page)
export const vpStringCache = new Map();
export const vpLoadStrings = (lang) => {
  if (lang === "en") return Promise.resolve(VP_EN);
  if (!vpStringCache.has(lang))
    vpStringCache.set(
      lang,
      fetch(`/vehicle_panel/i18n/${lang}.json`)
        .then((r) => (r.ok ? r.json() : VP_EN))
        .catch(() => VP_EN),
    );
  return vpStringCache.get(lang);
};
