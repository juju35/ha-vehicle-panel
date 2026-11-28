// ── Each vehicle's entities ──
// Found in the registries the frontend already has (hass.devices, hass.entities): by translation key first (the
// keys of the connected-car integrations), then by the end of the entity ID (English and French slugs), then by
// device class. Renamed entities and entity IDs in another language are found the same way.

const vpDc = (v) => (s) => s?.attributes?.device_class === v;

export const VP_ROLES = {
  mileage: {
    domain: "sensor",
    keys: ["mileage", "vehicle_state_odometer", "odometer", "odometer_km"],
    id: /(mileage|kilometrage|odometer|odometer_km)$/,
    test: (s) => s?.attributes?.device_class === "distance" && s?.attributes?.state_class === "total_increasing",
  },
  fuel_range: {
    domain: "sensor",
    keys: ["fuel_autonomy", "distance_to_empty_tank", "fuel_driving_range", "fuel_range", "combustion_range_km"],
    id: /(fuel_autonomy|autonomie_en_carburant|autonomie_carburant|range_liquid|fuel_range|range_gas|driving_range_gas)$/,
  },
  battery_range: {
    domain: "sensor",
    keys: ["battery_autonomy", "charge_state_battery_range", "charge_state_est_battery_range", "distance_to_empty_battery", "ev_range", "ev_driving_range", "battery_range", "electric_range_km", "autonomy"],
    id: /(battery_autonomy|autonomie_de_la_batterie|autonomie_batterie|range_electric|ev_range|electric_range)$/,
  },
  fuel_quantity: { domain: "sensor", keys: ["fuel_quantity", "fuel_amount", "fuel_level_liters"], id: /(fuel_quantity|quantite_de_carburant)$/, test: vpDc("volume") },
  fuel_level: { domain: "sensor", keys: ["fuel_level", "fuel"], id: /(fuel_level|tanklevelpercent)$/ },
  battery_level: {
    domain: "sensor",
    keys: ["battery_level", "charge_state_battery_level", "charge_state_usable_battery_level", "battery_charge_level", "ev_battery_level", "ev_battery_percentage", "battery_soc", "battery"],
    id: /(battery_level|niveau_de_batterie|niveau_de_la_batterie|state_of_charge|ev_battery_level|hvbattery_charge)$/,
    test: vpDc("battery"),
  },
  location: { domain: "device_tracker", keys: ["location", "vehicle", "parking_location", "position"], test: () => true },
  location_last_activity: { domain: "sensor", keys: ["location_last_activity"], id: /(location_last_activity|derniere_activite_de_localisation)$/ },
  plugged_in: { domain: "binary_sensor", keys: ["plugged_in", "charge_state_conn_charge_cable", "ev_is_plugged_in", "battery_plugged", "ev_battery_is_plugged_in"], id: /(plugged_in|branche)$/, test: vpDc("plug") },
  charging: { domain: "binary_sensor", keys: ["charging", "is_charging", "battery_charging", "ev_battery_is_charging", "chargingactive"], id: /(_charging|en_charge)$/, test: vpDc("battery_charging") },
  lock_status: { domain: "binary_sensor", keys: ["lock_status"], id: /(lock_status|verrouillage)$/, test: vpDc("lock") },
  lock: { domain: "lock", keys: ["vehicle_state_locked", "lock", "door_locks", "door_lock"], test: () => true },
  outside_temperature: {
    domain: "sensor",
    keys: ["outside_temperature", "outside_temp", "external_temperature", "ambient_temperature", "climate_state_outside_temp"],
    id: /(outside_temperature|outside_temp|temperature_exterieure|external_temperature)$/,
  },
  doors: { domain: "binary_sensor", keys: ["doors", "door_status", "doors_status", "door_lock_status"], id: /(doors?_status|_doors|portes)$/, test: vpDc("door") },
  charge_time: {
    domain: "sensor",
    keys: ["charging_remaining_time", "charge_state_minutes_to_full_charge", "time_to_full_charge", "estimated_charging_finish_time", "charging_end_time"],
    id: /(charging_remaining_time|time_to_full_charge|temps_de_charge_restant)$/,
  },
  charge_power: { domain: "sensor", keys: ["charging_power", "charge_state_charger_power", "charging_power_kw"], id: /(charging_power|puissance_de_charge)$/, test: vpDc("power") },
};

export const VP_TYRES = ["front_left_pressure", "front_right_pressure", "rear_left_pressure", "rear_right_pressure"];
export const VP_TYRE_IDS = [/front_left|avant_gauche/, /front_right|avant_droit/, /rear_left|arriere_gauche/, /rear_right|arriere_droit/];
// Bar per unit of the pressure units Home Assistant converts to
export const VP_BAR = { pa: 1e-5, hpa: 1e-3, kpa: 0.01, cbar: 0.01, mbar: 1e-3, bar: 1, psi: 0.0689476 };
// Integrations whose image entities are not pictures of the car
export const VP_PICTURE_SKIP = ["kia_uvo"];

/** Position of a tyre pressure sensor (index in VP_TYRES), -1 when neither its key nor its ID tells. */
export const vpTyrePos = (reg, id) => {
  const k = VP_TYRES.indexOf(reg?.translation_key);
  return k >= 0 ? k : VP_TYRE_IDS.findIndex((re) => re.test(id));
};

/** The registry entries of a device (hidden ones left out). */
export const vpDeviceEntities = (hass, deviceId) =>
  deviceId && hass?.entities ? Object.values(hass.entities).filter((e) => e.device_id === deviceId && !e.hidden) : [];

/** The entity of a role among a device's entries: by translation key, then entity ID, then state. */
export const vpFindRole = (hass, list, m) => {
  const inDomain = list.filter((e) => e.entity_id.split(".")[0] === m.domain);
  let hit = inDomain.find((e) => m.keys.includes(e.translation_key));
  if (!hit && m.id) hit = inDomain.find((e) => m.id.test(e.entity_id));
  if (!hit && m.test) hit = inDomain.find((e) => hass.states?.[e.entity_id] && m.test(hass.states[e.entity_id]));
  return hit?.entity_id;
};

/** The devices with an entity of an integration. */
export const vpDevicesOf = (hass, platform) => {
  const ids = [];
  for (const e of Object.values(hass?.entities || {})) if (e.platform === platform && e.device_id && !ids.includes(e.device_id)) ids.push(e.device_id);
  return ids;
};

/** The device of an optional integration that matches a vehicle: its name or model word in the device's texts. */
export const vpMatchDevice = (hass, platform, device) => {
  const words = [device?.name_by_user, device?.name, String(device?.model || "").split(" ")[0]].filter(Boolean).map((w) => w.toLowerCase());
  if (!words.length) return undefined;
  return vpDevicesOf(hass, platform).find((id) => {
    const d = hass.devices?.[id];
    const text = [d?.model, d?.name, d?.name_by_user].join(" ").toLowerCase();
    return words.some((w) => text.includes(w));
  });
};

/** The picture of the car: the Renault Picture sensor, an image entity of the car, or its tracker's picture. */
export const vpPictureEntity = (hass, deviceId) => {
  const mine = vpDeviceEntities(hass, deviceId);
  const renault = mine.filter((e) => e.platform === "renault_picture");
  const r = renault.find((e) => e.entity_id.startsWith("sensor.")) || renault[0];
  if (r) return r.entity_id;
  const images = mine.filter((e) => e.entity_id.startsWith("image.") && !VP_PICTURE_SKIP.includes(e.platform) && !e.disabled_by);
  const image = images.find((e) => /render|picture|image|vehicle|car/.test(`${e.translation_key || ""} ${e.entity_id}`)) || images[0];
  if (image) return image.entity_id;
  const tracker = mine.find((e) => e.entity_id.startsWith("device_tracker.") && hass.states?.[e.entity_id]?.attributes?.entity_picture);
  return tracker?.entity_id || null;
};

export const vpPictureUrl = (hass, id) => {
  const s = id ? hass?.states?.[id] : null;
  if (!s || s.state === "unavailable" || s.state === "unknown") return null;
  return s.attributes?.picture_large || s.attributes?.entity_picture || null;
};

/** The sensors of a Vehicle Consumption device, by what they measure. */
export const vpConsumption = (hass, deviceId) => {
  const list = vpDeviceEntities(hass, deviceId).filter((e) => e.entity_id.startsWith("sensor.") && hass.states?.[e.entity_id]);
  if (!list.length) return null;
  const unit = (e) => String(hass.states[e.entity_id].attributes?.unit_of_measurement || "");
  const dc = (e) => hass.states[e.entity_id].attributes?.device_class;
  // The sensor whose attributes carry the months, trips, refuels and lease (translation key "consumption")
  const card = list.find((e) => e.translation_key === "consumption") || list.find((e) => Array.isArray(hass.states[e.entity_id].attributes?.months));
  const avg = list.find((e) => e !== card && /average/.test(`${e.translation_key || ""} ${e.entity_id}`) && /\/\s?100/.test(unit(e))) || list.find((e) => /\/\s?100/.test(unit(e)));
  return {
    device: deviceId,
    card: card?.entity_id,
    next_service: list.find((e) => e.translation_key === "next_service")?.entity_id,
    average: avg?.entity_id,
    cost: list.find((e) => dc(e) === "monetary")?.entity_id,
    distance: list.find((e) => dc(e) === "distance" && !/total|odometer|mileage/.test(e.entity_id))?.entity_id,
    trips: list.find((e) => /trip|trajet/.test(`${e.translation_key || ""} ${e.entity_id}`) && !unit(e))?.entity_id,
    all: list.map((e) => e.entity_id),
  };
};

/** The sensors of an Orange Internet On the move device: data left (and its percentage), expiry. */
export const vpDataPlan = (hass, deviceId) => {
  const list = vpDeviceEntities(hass, deviceId).filter((e) => e.entity_id.startsWith("sensor.") && hass.states?.[e.entity_id]);
  if (!list.length) return null;
  const by = (re) => list.find((e) => re.test(`${e.translation_key || ""} ${e.entity_id}`))?.entity_id;
  return {
    device: deviceId,
    left: by(/left_data$|donnees_restantes$/),
    percent: by(/left_data_percentage|pourcentage/) || list.find((e) => hass.states[e.entity_id].attributes?.unit_of_measurement === "%")?.entity_id,
    expiry: by(/expiry_date|date_d_?expiration/),
  };
};

/** Everything the panel shows of a vehicle, from its settings (device id, optional devices and name). */
export const vpVehicle = (hass, cfg) => {
  const id = cfg?.device_id;
  const device = hass?.devices?.[id];
  if (!device) return { id, missing: true, cfg: cfg || {} };
  const list = vpDeviceEntities(hass, id);
  const ent = {};
  for (const [role, m] of Object.entries(VP_ROLES)) ent[role] = vpFindRole(hass, list, m);
  const tyres = list
    .filter((e) => e.entity_id.startsWith("sensor.") && (VP_TYRES.includes(e.translation_key) || hass.states?.[e.entity_id]?.attributes?.device_class === "pressure"))
    .map((e) => ({ id: e.entity_id, pos: vpTyrePos(e, e.entity_id) }))
    .sort((a, b) => (a.pos < 0 ? 9 : a.pos) - (b.pos < 0 ? 9 : b.pos));
  const buttons = list.filter((e) => e.entity_id.startsWith("button.") && !e.disabled_by).map((e) => e.entity_id);
  const consumptionDevice = cfg.consumption_device || vpMatchDevice(hass, "vehicle_consumption", device);
  const dataDevice = cfg.data_device || vpMatchDevice(hass, "orange_internet_on_the_move", device);
  const picture = cfg.picture_entity || vpPictureEntity(hass, id);
  const charger = cfg.charger_device && hass.devices?.[cfg.charger_device] ? vpDeviceEntities(hass, cfg.charger_device).map((e) => e.entity_id).filter((e) => hass.states?.[e]) : [];
  return {
    id,
    cfg,
    name: cfg.name || device.name_by_user || device.name || id,
    model: [device.manufacturer, device.model].filter(Boolean).join(" "),
    ent,
    tyres,
    buttons,
    picture,
    consumption: consumptionDevice ? vpConsumption(hass, consumptionDevice) : null,
    data: dataDevice ? vpDataPlan(hass, dataDevice) : null,
    charger,
  };
};

/** The Stations sensors of Carburants France (one per config entry): their stations and fuels in the attributes. */
export const vpStationSources = (hass) =>
  Object.values(hass?.entities || {})
    .filter((e) => e.platform === "carburants_france" && e.entity_id.startsWith("sensor.") && Array.isArray(hass.states?.[e.entity_id]?.attributes?.stations))
    .map((e) => e.entity_id);

/**
 * The Carburants France entities of a fuel ({key, name}), by translation key (best price, target price, low price):
 * by their fuel attribute, else by the fuel's key at the end of the entity ID (sp95 is not sp95_e10).
 */
export const vpFuelEntities = (hass, fuel) => {
  const out = {};
  if (!fuel?.key) return out;
  const tail = new RegExp(`_${fuel.key}(?:_\\d+)?$`);
  const list = Object.values(hass?.entities || {}).filter(
    (e) => e.platform === "carburants_france" && ["best_price", "target_price", "low_price"].includes(e.translation_key) && hass.states?.[e.entity_id],
  );
  for (const e of list) if (hass.states[e.entity_id].attributes?.fuel === fuel.name) out[e.translation_key] ||= e.entity_id;
  for (const e of list) if (tail.test(e.entity_id)) out[e.translation_key] ||= e.entity_id;
  return out;
};

/** The sensors of the Maintenance integration that carry its items (attribute maintenance: true). */
export const vpMaintenanceSources = (hass) =>
  Object.values(hass?.entities || {})
    .filter((e) => e.platform === "maintenance" && hass.states?.[e.entity_id]?.attributes?.maintenance === true)
    .map((e) => e.entity_id);
