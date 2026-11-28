// Mock data for the screenshots and the panel tests: two cars (a Renault Espace with its MyRenault picture, its
// Vehicle Consumption device (months, trips, refuels, lease, next service) and its Orange data plan, and a Renault
// Captur being driven, its range low and a rear tyre low), the stations of Carburants France, the vehicle tasks of
// Maintenance, and the older plain fuel and maintenance entities. Neutral names, no real place or person.

export const NOW = Date.parse("2026-11-26T17:30:00Z");
const iso = (minutesAgo) => new Date(NOW - minutesAgo * 60000).toISOString();

const st = (entity_id, state, attributes = {}, minutesAgo = 5) => ({ entity_id, state: String(state), attributes, last_changed: iso(minutesAgo), last_updated: iso(minutesAgo) });

export const devices = {
  espace: { id: "espace", name: "AB-123-CD", name_by_user: "Espace", manufacturer: "Renault", model: "Espace VI" },
  captur: { id: "captur", name: "EF-456-GH", name_by_user: "Captur", manufacturer: "Renault", model: "Captur II" },
  espace_conso: { id: "espace_conso", name: "Espace consumption", manufacturer: "Vehicle Consumption", model: "Espace" },
  espace_data: { id: "espace_data", name: "Espace data plan", manufacturer: "Orange", model: "Espace" },
  captur_conso: { id: "captur_conso", name: "Captur consumption", manufacturer: "Vehicle Consumption", model: "Captur" },
  carburants: { id: "carburants", name: "Carburants France" },
  maintenance: { id: "maintenance", name: "Maintenance" },
  stations: { id: "stations", name: "Carburants France" },
  maint: { id: "maint", name: "Maintenance" },
};

const ent = (entity_id, device_id, platform, translation_key) => ({ entity_id, device_id, platform, translation_key });

export const entities = Object.fromEntries(
  [
    ent("device_tracker.espace_location", "espace", "renault", "location"),
    ent("sensor.espace_mileage", "espace", "renault", "mileage"),
    ent("sensor.espace_fuel_autonomy", "espace", "renault", "fuel_autonomy"),
    ent("sensor.espace_fuel_quantity", "espace", "renault", "fuel_quantity"),
    ent("binary_sensor.espace_lock_status", "espace", "renault", "lock_status"),
    ent("sensor.espace_front_left_pressure", "espace", "renault", "front_left_pressure"),
    ent("sensor.espace_front_right_pressure", "espace", "renault", "front_right_pressure"),
    ent("sensor.espace_rear_left_pressure", "espace", "renault", "rear_left_pressure"),
    ent("sensor.espace_rear_right_pressure", "espace", "renault", "rear_right_pressure"),
    ent("button.espace_sound_horn", "espace", "renault", "sound_horn"),
    ent("button.espace_flash_lights", "espace", "renault", "flash_lights"),
    ent("sensor.espace_picture", "espace", "renault_picture", "picture"),
    ent("device_tracker.captur_location", "captur", "renault", "location"),
    ent("sensor.captur_mileage", "captur", "renault", "mileage"),
    ent("sensor.captur_fuel_autonomy", "captur", "renault", "fuel_autonomy"),
    ent("sensor.captur_fuel_quantity", "captur", "renault", "fuel_quantity"),
    ent("binary_sensor.captur_lock_status", "captur", "renault", "lock_status"),
    ent("sensor.captur_picture", "captur", "renault_picture", "picture"),
    ent("sensor.espace_outside_temperature", "espace", "renault", "outside_temperature"),
    ent("binary_sensor.espace_doors", "espace", "renault", "door_status"),
    ent("lock.captur_doors", "captur", "renault", "door_lock"),
    ent("button.captur_flash_lights", "captur", "renault", "flash_lights"),
    ent("sensor.captur_front_left_pressure", "captur", "renault", "front_left_pressure"),
    ent("sensor.captur_front_right_pressure", "captur", "renault", "front_right_pressure"),
    ent("sensor.captur_rear_left_pressure", "captur", "renault", "rear_left_pressure"),
    ent("sensor.captur_rear_right_pressure", "captur", "renault", "rear_right_pressure"),
    ent("sensor.espace_consumption", "espace_conso", "vehicle_consumption", "consumption"),
    ent("sensor.espace_next_service", "espace_conso", "vehicle_consumption", "next_service"),
    ent("sensor.captur_consumption", "captur_conso", "vehicle_consumption", "consumption"),
    ent("sensor.carburants_stations", "carburants", "carburants_france", "stations"),
    ent("sensor.carburants_best_price_sp95_e10", "carburants", "carburants_france", "best_price"),
    ent("number.carburants_target_price_sp95_e10", "carburants", "carburants_france", "target_price"),
    ent("binary_sensor.carburants_low_price_sp95_e10", "carburants", "carburants_france", "low_price"),
    ent("sensor.station_a_sp95_e10_price", "carburants", "carburants_france", "price"),
    ent("sensor.station_b_sp95_e10_price", "carburants", "carburants_france", "price"),
    ent("sensor.station_c_sp95_e10_price", "carburants", "carburants_france", "price"),
    ent("sensor.maintenance_overdue", "maintenance", "maintenance", "overdue"),
    ent("sensor.espace_consumption_average", "espace_conso", "vehicle_consumption", "average_consumption"),
    ent("sensor.espace_consumption_distance_week", "espace_conso", "vehicle_consumption", "distance_week"),
    ent("sensor.espace_consumption_trips_week", "espace_conso", "vehicle_consumption", "trips_week"),
    ent("sensor.espace_consumption_cost_week", "espace_conso", "vehicle_consumption", "cost_week"),
    ent("sensor.espace_data_left_data", "espace_data", "orange_internet_on_the_move", "left_data"),
    ent("sensor.espace_data_left_data_percentage", "espace_data", "orange_internet_on_the_move", "left_data_percentage"),
    ent("sensor.station_a_sp95_e10", "stations", "carburants_france", null),
    ent("sensor.station_b_sp95_e10", "stations", "carburants_france", null),
    ent("sensor.station_c_sp95_e10", "stations", "carburants_france", null),
    ent("sensor.oil_change_espace", "maint", "maintenance", null),
    ent("sensor.technical_inspection_captur", "maint", "maintenance", null),
    ent("sensor.winter_tyres", "maint", "maintenance", null),
    ent("sensor.wiper_blades", "maint", "maintenance", null),
  ].map((e) => [e.entity_id, e]),
);

const day = (n) => new Date(NOW - n * 86400000);
const at = (n, h, m) => {
  const d = day(n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const trip = (start, minutes, distance, cons, cost) => ({
  start,
  end: new Date(Date.parse(start) + minutes * 60000).toISOString(),
  distance,
  fuel: Math.round(distance * cons) / 100,
  energy: 0,
  fuel_consumption: cons,
  energy_consumption: null,
  cost,
  cost_per_km: Math.round((cost / distance) * 1000) / 1000,
  co2: Math.round(distance * cons * 0.0231 * 10) / 10,
  co2_per_km: Math.round(cons * 23.1),
  estimated: false,
});
const MONTHLY = [6.9, 7.2, 6.8, 6.5, 6.2, 6.1, 5.9, 6.1, 6.3, 6.6, 6.9, 6.2];
const MONTH_KM = [1210, 980, 1090, 1150, 1320, 1240, 1610, 1190, 1280, 1170, 1230, 1184];
const ESPACE_CARD = {
  vehicle: "Espace",
  entry_id: "vc_espace",
  kind: "fuel",
  currency: "EUR",
  odometer: 27840,
  fuel_level: 67.3,
  tank_capacity: 55,
  fuel_price: 1.739,
  driving: false,
  month: { month: "2026-11", distance: 1184, fuel: 73.4, fuel_consumption: 6.2, energy_consumption: null, cost: 129, cost_per_km: 0.109, co2: 172, co2_per_km: 145 },
  total: { since: "2025-03-04T09:00:00+01:00", distance: 25120, fuel: 1607, fuel_consumption: 6.4, cost: 2790 },
  months: MONTHLY.map((c, i) => {
    const d = new Date(Date.UTC(2025, 11 + i, 15));
    const km = MONTH_KM[i];
    return { month: d.toISOString().slice(0, 7), distance: km, fuel: (km * c) / 100, fuel_consumption: c, energy_consumption: null, cost: Math.round(km * c * 0.01739 * 100) / 100, co2: Math.round(km * c * 0.231) / 10, co2_per_km: Math.round(c * 23.1) };
  }),
  trips: [trip(at(0, 8, 5), 27, 22, 5.9, 2.2), trip(at(1, 18, 12), 24, 18, 6.8, 2.1), trip(at(1, 8, 2), 26, 22, 6.0, 2.3), trip(at(2, 17, 40), 92, 146, 6.1, 15.4), trip(at(3, 12, 10), 15, 9, 7.4, 1.2), trip(at(5, 9, 30), 41, 58, 6.3, 6.4)],
  refuels: [
    { time: at(5, 18, 20), odometer: 27412, liters: 38.2, cost: 66.4, price: 1.738, source: "auto" },
    { time: at(23, 12, 5), odometer: 26780, liters: 41.0, cost: 72.1, price: 1.759, source: "manual" },
    { time: at(42, 17, 45), odometer: 26120, liters: 39.6, cost: 69.8, price: 1.763, source: "auto" },
  ],
  charges: [],
  trip_count: 41,
  lease: {
    start: "2025-01-20",
    end: "2029-01-20",
    months: 48,
    month: 23,
    ended: false,
    allowance: 60000,
    driven: 27840,
    prorata: 27751,
    balance: 89,
    remaining: 32160,
    per_month_left: 1237,
    pace: 1250,
    projected: 60193,
    overage: 193,
    extra_price: 0.08,
    overage_cost: 15.44,
  },
};
const CAPTUR_CARD = {
  vehicle: "Captur",
  entry_id: "vc_captur",
  kind: "fuel",
  currency: "EUR",
  driving: true,
  trip: { ...trip(new Date(NOW - 18 * 60000).toISOString(), 18, 12, 7.1, 1.4), end: null },
  month: { month: "2026-11", distance: 640, fuel_consumption: 6.9, cost: 77, cost_per_km: 0.12, co2: 102, co2_per_km: 159 },
  total: { since: "2025-06-01T09:00:00+02:00", distance: 9100, fuel_consumption: 6.8 },
  months: [],
  trips: [trip(at(1, 7, 50), 31, 26, 6.7, 3.0)],
  refuels: [],
  charges: [],
};
// Followed stations of Carburants France: hours from Monday (1) to Sunday (7), one out of stock
const HOURS = (open, close) => [1, 2, 3, 4, 5, 6, 7].map((d) => ({ day: d, closed: false, ranges: [[open, close]] }));
const STATIONS = [
  { station_id: 101, station_name: "Station A", brand: "Leclerc", distance: 2.1, latitude: 48.11, longitude: -1.68, hours: HOURS("07:00", "21:00"), fuels: { e10: { price: 1.739, available: true }, gazole: { price: 1.689, available: true } } },
  { station_id: 102, station_name: "Station B", brand: "Total", distance: 3.4, latitude: 48.1, longitude: -1.65, automate_24_24: true, fuels: { e10: { price: 1.762, available: true }, gazole: { price: 1.702, available: true } } },
  { station_id: 103, station_name: "Station C", brand: "Intermarché", distance: 5.0, latitude: 48.13, longitude: -1.7, hours: HOURS("07:00", "12:00"), fuels: { e10: { price: 1.789, available: true } } },
  { station_id: 104, station_name: "Station D", brand: "Esso", distance: 4.2, latitude: 48.09, longitude: -1.71, hours: HOURS("06:00", "22:00"), fuels: { e10: { price: null, available: false, rupture: "temporaire", rupture_since: "2026-11-24T08:00:00+01:00" }, gazole: { price: 1.695, available: true } } },
];
// The vehicle items of Maintenance (tasks marked done from the panel)
const MAINTENANCE_ITEMS = [
  { id: "task:wipers", kind: "task", name: "Wiper blades", device: "Espace", category: "vehicle", status: "overdue", days_left: -6, due: "2026-11-20", every: 12, unit: "months", can_reset: false },
  { id: "task:inspection", kind: "task", name: "Technical inspection", device: "Captur", category: "vehicle", status: "soon", days_left: 21, due: "2026-12-17", every: 24, unit: "months", can_reset: false },
  { id: "task:oil", kind: "task", name: "Oil change", device: "Captur", category: "vehicle", status: "ok", days_left: 124, due: "2027-03-30", every: 12, unit: "months", can_reset: false },
  { id: "task:boiler", kind: "task", name: "Boiler service", category: "home", status: "overdue", days_left: -2, due: "2026-11-24", every: 12, unit: "months", can_reset: false },
];

export const states = Object.fromEntries(
  [
    st("device_tracker.espace_location", "home", { friendly_name: "Espace Location" }),
    st("sensor.espace_mileage", 27840, { friendly_name: "Espace Mileage", unit_of_measurement: "km", device_class: "distance", state_class: "total_increasing" }),
    st("sensor.espace_fuel_autonomy", 612, { friendly_name: "Espace Fuel autonomy", unit_of_measurement: "km", device_class: "distance" }),
    st("sensor.espace_fuel_quantity", 37, { friendly_name: "Espace Fuel quantity", unit_of_measurement: "L", device_class: "volume" }),
    st("binary_sensor.espace_lock_status", "off", { friendly_name: "Espace Lock status", device_class: "lock" }),
    st("sensor.espace_front_left_pressure", 2.5, { unit_of_measurement: "bar", device_class: "pressure" }),
    st("sensor.espace_front_right_pressure", 2.5, { unit_of_measurement: "bar", device_class: "pressure" }),
    st("sensor.espace_rear_left_pressure", 2.4, { unit_of_measurement: "bar", device_class: "pressure" }),
    st("sensor.espace_rear_right_pressure", 2.4, { unit_of_measurement: "bar", device_class: "pressure" }),
    st("button.espace_sound_horn", "unknown", { friendly_name: "Espace Sound horn" }),
    st("button.espace_flash_lights", "unknown", { friendly_name: "Espace Flash lights" }),
    st("sensor.espace_picture", "ok", { friendly_name: "Espace Picture", entity_picture: "/pictures/espace.webp" }),
    st("device_tracker.captur_location", "not_home", { friendly_name: "Captur Location", latitude: 48.12, longitude: -1.66 }),
    st("sensor.captur_mileage", 54210, { friendly_name: "Captur Mileage", unit_of_measurement: "km", device_class: "distance", state_class: "total_increasing" }),
    st("sensor.captur_fuel_autonomy", 84, { friendly_name: "Captur Fuel autonomy", unit_of_measurement: "km", device_class: "distance" }),
    st("sensor.captur_fuel_quantity", 7, { friendly_name: "Captur Fuel quantity", unit_of_measurement: "L", device_class: "volume" }),
    st("binary_sensor.captur_lock_status", "off", { friendly_name: "Captur Lock status", device_class: "lock" }),
    st("sensor.captur_picture", "ok", { friendly_name: "Captur Picture", entity_picture: "/pictures/captur.webp" }),
    st("sensor.espace_consumption_average", 6.4, { friendly_name: "Espace consumption Average", unit_of_measurement: "L/100 km" }),
    st("sensor.espace_consumption_distance_week", 412, { friendly_name: "Espace consumption Distance this week", unit_of_measurement: "km", device_class: "distance" }),
    st("sensor.espace_consumption_trips_week", 9, { friendly_name: "Espace consumption Trips this week" }),
    st("sensor.espace_consumption_cost_week", 41, { friendly_name: "Espace consumption Cost this week", unit_of_measurement: "€", device_class: "monetary" }),
    st("sensor.espace_data_left_data", 8.2, { friendly_name: "Espace data plan Left data", unit_of_measurement: "GB" }),
    st("sensor.espace_data_left_data_percentage", 61, { friendly_name: "Espace data plan Left data percentage", unit_of_measurement: "%" }),
    st("sensor.station_a_sp95_e10", 1.739, { friendly_name: "Station A · SP95-E10", unit_of_measurement: "€/L" }, 90),
    st("sensor.station_b_sp95_e10", 1.762, { friendly_name: "Station B · SP95-E10", unit_of_measurement: "€/L" }, 240),
    st("sensor.station_c_sp95_e10", 1.789, { friendly_name: "Station C · SP95-E10", unit_of_measurement: "€/L" }, 600),
    st("sensor.oil_change_espace", 2160, { friendly_name: "Oil change · Espace", unit_of_measurement: "km" }),
    st("sensor.technical_inspection_captur", 21, { friendly_name: "Technical inspection · Captur", unit_of_measurement: "d" }),
    st("sensor.winter_tyres", "Fitted", { friendly_name: "Winter tyres", status: "ok" }),
    st("sensor.wiper_blades", 0, { friendly_name: "Wiper blades", unit_of_measurement: "d" }),
    st("sensor.espace_outside_temperature", 8, { friendly_name: "Espace Outside temperature", unit_of_measurement: "°C", device_class: "temperature" }),
    st("binary_sensor.espace_doors", "off", { friendly_name: "Espace Doors", device_class: "door" }),
    st("lock.captur_doors", "locked", { friendly_name: "Captur Doors" }),
    st("button.captur_flash_lights", "unknown", { friendly_name: "Captur Flash lights" }),
    st("sensor.captur_front_left_pressure", 2.4, { unit_of_measurement: "bar", device_class: "pressure" }),
    st("sensor.captur_front_right_pressure", 2.4, { unit_of_measurement: "bar", device_class: "pressure" }),
    st("sensor.captur_rear_left_pressure", 1.8, { unit_of_measurement: "bar", device_class: "pressure" }),
    st("sensor.captur_rear_right_pressure", 2.3, { unit_of_measurement: "bar", device_class: "pressure" }),
    st("sensor.espace_consumption", 6.4, { friendly_name: "Espace consumption", unit_of_measurement: "L/100 km", ...ESPACE_CARD }),
    st("sensor.espace_next_service", 2160, { friendly_name: "Espace Next service", unit_of_measurement: "km", device_class: "distance", interval: 15000, last_service: "2025-12-02", last_service_odometer: 15000, overdue: false }),
    st("sensor.captur_consumption", 6.9, { friendly_name: "Captur consumption", unit_of_measurement: "L/100 km", ...CAPTUR_CARD }),
    st("sensor.carburants_stations", 4, { friendly_name: "Carburants France Stations", config_entry_id: "carb1", fuels: [{ key: "e10", name: "SP95-E10" }, { key: "gazole", name: "Gazole" }], stations: STATIONS }),
    st("sensor.carburants_best_price_sp95_e10", 1.739, { friendly_name: "Best price SP95-E10", unit_of_measurement: "€/L", fuel: "SP95-E10", average_30d: 1.752, lowest_30d: 1.731, highest_30d: 1.781, change_30d: -0.013 }),
    st("number.carburants_target_price_sp95_e10", 1.75, { friendly_name: "Target price SP95-E10", min: 0, max: 3, step: 0.001 }),
    st("binary_sensor.carburants_low_price_sp95_e10", "on", { friendly_name: "Low price SP95-E10" }, 540),
    ...STATIONS.slice(0, 3).map((x, i) => st(`sensor.station_${"abc"[i]}_sp95_e10_price`, x.fuels.e10.price, { friendly_name: `${x.station_name} SP95-E10`, unit_of_measurement: "€/L", station_id: x.station_id, fuel: "SP95-E10" })),
    st("sensor.maintenance_overdue", 1, { friendly_name: "Maintenance Overdue", maintenance: true, items: MAINTENANCE_ITEMS }),
  ].map((s) => [s.entity_id, s]),
);

export const settings = {
  vehicles: [
    { device_id: "espace", plate: "GH-512-KL", lease_km: 60000, lease_months: 48, lease_start: "2025-01-20", tank_l: 55, extra_km_price: 0.08 },
    { device_id: "captur", plate: "FT-208-QM", tank_l: 48 },
  ],
  fuel_entities: [],
  maintenance_entities: [],
  low_range: 100,
};

// The recorder's history: hourly mileage over 8 days, daily average consumption over 8 weeks
const DAILY_ESPACE = [38, 64, 12, 0, 96, 41, 58, 22];
const DAILY_CAPTUR = [18, 22, 9, 31, 14, 0, 26, 12];
const mileage = (end, daily) => {
  const out = [];
  let v = end - daily.reduce((a, b) => a + b, 0);
  for (let d = 0; d < 8; d++) {
    for (const h of [8, 18]) {
      v += daily[d] / 2;
      const day = new Date(NOW - (7 - d) * 86400000);
      day.setHours(h, 0, 0, 0);
      out.push({ s: String(Math.round(v)), lu: day.getTime() / 1000 });
    }
  }
  return out;
};
const WEEKLY = [6.1, 6.6, 6.2, 7.0, 6.3, 6.0, 6.5, 6.4];
const consumption = WEEKLY.flatMap((w, i) => [0, 2, 4].map((d) => ({ s: String(w), lu: (NOW - (7 - i) * 7 * 86400000 - d * 86400000) / 1000 }))).sort((a, b) => a.lu - b.lu);

// The older plain entities picked in the setup (before Carburants France and Maintenance had their own sources)
export const legacy = {
  fuel_entities: ["sensor.station_a_sp95_e10", "sensor.station_b_sp95_e10", "sensor.station_c_sp95_e10"],
  maintenance_entities: ["sensor.oil_change_espace", "sensor.technical_inspection_captur", "sensor.winter_tyres", "sensor.wiper_blades"],
};

// 30 days of a station's price, one reading a day
const prices = (end, drift) => Array.from({ length: 30 }, (_, i) => ({ s: String((end + drift * (29 - i) / 29 + (i % 7 === 3 ? 0.001 : 0)).toFixed(3)), lu: (NOW - (29 - i) * 86400000) / 1000 }));

export const history = {
  "sensor.espace_mileage": mileage(27840, DAILY_ESPACE),
  "sensor.captur_mileage": mileage(54210, DAILY_CAPTUR),
  "sensor.espace_consumption_average": consumption,
  "sensor.station_a_sp95_e10_price": prices(1.739, 0.02),
  "sensor.station_b_sp95_e10_price": prices(1.762, -0.004),
  "sensor.station_c_sp95_e10_price": prices(1.789, -0.012),
};

// The monthly statistics of the mileage (state at each month end) since the start of the Espace's lease
const monthStats = (startKm, endKm, from) => {
  const out = [];
  const first = new Date(from);
  const months = (new Date(NOW).getFullYear() - first.getFullYear()) * 12 + new Date(NOW).getMonth() - first.getMonth();
  for (let i = 0; i < months; i++) {
    const s = new Date(first.getFullYear(), first.getMonth() + i, 1).getTime();
    const e = new Date(first.getFullYear(), first.getMonth() + i + 1, 1).getTime();
    // A slower first year, then the pace of the second year
    const f = (i + 1) / months;
    out.push({ start: s, end: e, state: Math.round(startKm + (endKm - startKm) * (f < 0.5 ? f * 0.85 : 0.425 + (f - 0.5) * 1.15)) });
  }
  return out;
};
export const stats = {
  "sensor.espace_mileage": monthStats(0, 26656, "2025-01-01"),
  "sensor.captur_mileage": monthStats(41000, 53570, "2025-10-01"),
};
