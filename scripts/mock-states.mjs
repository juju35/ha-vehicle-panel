// Mock data for the screenshots and the panel tests: two cars (a Renault Espace with its MyRenault picture, its
// Vehicle Consumption device and its Orange data plan, and a Renault Captur), three fuel stations and four
// maintenance entities. Neutral names, no real place or person.

export const NOW = Date.parse("2026-11-26T17:30:00Z");
const iso = (minutesAgo) => new Date(NOW - minutesAgo * 60000).toISOString();

const st = (entity_id, state, attributes = {}, minutesAgo = 5) => ({ entity_id, state: String(state), attributes, last_changed: iso(minutesAgo), last_updated: iso(minutesAgo) });

export const devices = {
  espace: { id: "espace", name: "AB-123-CD", name_by_user: "Espace", manufacturer: "Renault", model: "Espace VI" },
  captur: { id: "captur", name: "EF-456-GH", name_by_user: "Captur", manufacturer: "Renault", model: "Captur II" },
  espace_conso: { id: "espace_conso", name: "Espace consumption", manufacturer: "Vehicle Consumption", model: "Espace" },
  espace_data: { id: "espace_data", name: "Espace data plan", manufacturer: "Orange", model: "Espace" },
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
    st("device_tracker.captur_location", "not_home", { friendly_name: "Captur Location" }),
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
  ].map((s) => [s.entity_id, s]),
);

export const settings = {
  vehicles: [
    { device_id: "espace", lease_km: 60000, lease_months: 48, lease_start: "2025-01-20", tank_l: 55 },
    { device_id: "captur", tank_l: 48 },
  ],
  fuel_entities: ["sensor.station_a_sp95_e10", "sensor.station_b_sp95_e10", "sensor.station_c_sp95_e10"],
  maintenance_entities: ["sensor.oil_change_espace", "sensor.technical_inspection_captur", "sensor.winter_tyres", "sensor.wiper_blades"],
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

export const history = {
  "sensor.espace_mileage": mileage(27840, DAILY_ESPACE),
  "sensor.captur_mileage": mileage(54210, DAILY_CAPTUR),
  "sensor.espace_consumption_average": consumption,
};
