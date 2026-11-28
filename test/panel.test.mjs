// The sidebar panel: languages, what it finds of each vehicle, what the tabs compute and the HTML they draw.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { devices, entities, history, legacy, NOW, settings, states, stats } from "../scripts/mock-states.mjs";
import { element, lib } from "./load.mjs";

const i18n = new URL("../custom_components/vehicle_panel/frontend/i18n/", import.meta.url);
const placeholders = (s) => (String(s).match(/\{\w+\}/g) || []).sort();
const hass = (extra = {}) => ({ states, devices, entities, language: "en", ...extra });
const vehicle = (id, h = hass()) => lib.vpVehicle(h, settings.vehicles.find((v) => v.device_id === id));

test("every language file has one string per English key, with its placeholders", () => {
  const files = readdirSync(i18n).map((f) => f.replace(/\.json$/, ""));
  assert.deepEqual([...files].sort(), lib.VP_LANGS.filter((l) => l !== "en").sort());
  for (const lang of files) {
    const strings = JSON.parse(readFileSync(new URL(`${lang}.json`, i18n), "utf8"));
    assert.deepEqual(Object.keys(strings).sort(), Object.keys(lib.VP_EN).sort(), lang);
    for (const [k, v] of Object.entries(strings)) {
      assert.ok(v.trim(), `${lang}.${k}`);
      assert.deepEqual(placeholders(v), placeholders(lib.VP_EN[k]), `${lang}.${k}`);
    }
  }
});

test("the language resolves to the full code, then its base, then English", () => {
  for (const [code, lang] of [["fr-FR", "fr"], ["sr-Latn", "sr-Latn"], ["pt-BR", "pt"], ["ja", "en"], [undefined, "en"]]) assert.equal(lib.vpLang(code), lang);
  assert.equal(lib.vpT(null, "vehicles_count", { n: 2 }), "Vehicles: 2");
  assert.equal(lib.vpFmt(1234.5, "en", 1), "1,234.5");
  assert.equal(lib.vpFmt(null, "en"), "—");
});

test("a vehicle's entities are found from its device: range, mileage, lock, tyres, buttons, picture and devices", () => {
  const v = vehicle("espace");
  assert.equal(v.name, "Espace");
  assert.equal(v.model, "Renault Espace VI");
  assert.equal(v.ent.mileage, "sensor.espace_mileage");
  assert.equal(v.ent.fuel_range, "sensor.espace_fuel_autonomy");
  assert.equal(v.ent.lock_status, "binary_sensor.espace_lock_status");
  assert.deepEqual(v.tyres.map((t) => t.pos), [0, 1, 2, 3]);
  assert.deepEqual(v.buttons.sort(), ["button.espace_flash_lights", "button.espace_sound_horn"]);
  assert.equal(v.picture, "sensor.espace_picture");
  assert.equal(v.consumption.average, "sensor.espace_consumption_average");
  assert.ok(v.data);
  assert.equal(v.consumption.card, "sensor.espace_consumption");
  assert.equal(v.consumption.next_service, "sensor.espace_next_service");
  assert.equal(v.ent.outside_temperature, "sensor.espace_outside_temperature");
  assert.equal(v.ent.doors, "binary_sensor.espace_doors");
  assert.equal(vehicle("captur").consumption.card, "sensor.captur_consumption");
  assert.equal(lib.vpVehicle(hass(), { device_id: "captur", consumption_device: "none" }).consumption, null);
  assert.deepEqual(lib.vpVehicle(hass(), { device_id: "gone" }).missing, true);
});

test("range, level, lock and status", () => {
  const h = hass();
  const espace = vehicle("espace");
  const captur = vehicle("captur");
  assert.equal(lib.vpRange(h, espace), 612);
  assert.equal(Math.round(lib.vpLevel(h, espace).pct), 67);
  assert.equal(lib.vpLocked(h, espace), true);
  assert.equal(lib.vpStatus(h, espace, 100).key, "locked");
  assert.equal(lib.vpStatus(h, captur, 100).key, "low_range");
  const open = { ...states, "binary_sensor.espace_lock_status": { ...states["binary_sensor.espace_lock_status"], state: "on" } };
  assert.equal(lib.vpStatus(hass({ states: open }), espace, 100).key, "unlocked");
  assert.equal(lib.vpStatus(h, { missing: true }, 100).key, "vehicle_missing");
});

test("the lease: driven, expected at the date, projection and monthly allowance", () => {
  const l = lib.vpLease(hass(), vehicle("espace"), NOW);
  assert.equal(l.driven, 27840);
  assert.ok(Math.abs(l.elapsed - 22.2) < 0.1, String(l.elapsed));
  assert.ok(Math.abs(l.expected - 27750) < 150, String(l.expected));
  assert.ok(l.projection > 60000 && l.ahead);
  assert.ok(Math.abs(l.allowance - (60000 - 27840) / (48 - l.elapsed)) < 1e-6);
  assert.equal(lib.vpLease(hass(), vehicle("captur"), NOW), null);
});

test("daily distances and weekly averages come from the history", () => {
  const days = lib.vpDaily(history["sensor.espace_mileage"], 7, NOW);
  assert.equal(days.length, 7);
  assert.ok(days.every((d) => d.km == null || d.km >= 0));
  assert.ok(days.reduce((a, d) => a + (d.km || 0), 0) > 0);
  const weeks = lib.vpWeekly(history["sensor.espace_consumption_average"], 8, NOW);
  assert.equal(weeks.length, 8);
  assert.ok(weeks.every((w) => w == null || (w > 5 && w < 8)));
  assert.deepEqual(lib.vpWeekly([], 2, NOW), [null, null]);
});

test("fuel stations sorted by price, maintenance urgency", () => {
  assert.deepEqual(lib.vpStations(hass(), legacy.fuel_entities).map((s) => s.id), legacy.fuel_entities);
  assert.equal(lib.vpUrgency(states["sensor.wiper_blades"], NOW), "overdue");
  assert.equal(lib.vpUrgency(states["sensor.technical_inspection_captur"], NOW), "soon");
  assert.equal(lib.vpUrgency(states["sensor.winter_tyres"], NOW), "ok");
  assert.equal(lib.vpUrgency({ state: "2026-01-01T00:00:00Z", attributes: { device_class: "timestamp" } }, NOW), "overdue");
  assert.equal(lib.vpUrgency(null), "ok");
});

const panelFor = (h, s = settings) => {
  const Panel = element("vehicle-panel");
  const p = new Panel();
  p._hass = h;
  p._settings = s;
  p._history = history;
  p._stats = stats;
  return p;
};

test("Carburants France: stations by price, open now from the hours, shortages last, directions", () => {
  const data = lib.vpFuelData(hass());
  assert.deepEqual(data.fuels.map((f) => f.key), ["e10", "gazole"]);
  const list = lib.vpStationsFor(data, "e10", NOW);
  assert.deepEqual(list.map((s) => s.name), ["Station A", "Station B", "Station C", "Station D"]);
  assert.equal(list[3].rupture, true);
  assert.equal(list[1].open.always, true);
  const at = (h) => {
    const d = new Date(NOW);
    d.setHours(h, 30, 0, 0);
    return d.getTime();
  };
  const hours = { hours: [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, closed: false, ranges: [["07:00", "12:00"]] })) };
  assert.deepEqual(lib.vpOpen(hours, at(9)), { open: true, closes: "12:00" });
  assert.deepEqual(lib.vpOpen(hours, at(5)), { open: false, opens: "07:00" });
  assert.equal(lib.vpOpen(hours, at(13)).opens, "07:00");
  assert.equal(lib.vpOpen({}, NOW), null);
  assert.equal(lib.vpDirections(48.1, -1.68), "https://www.google.com/maps/dir/?api=1&destination=48.100000,-1.680000");
  assert.equal(lib.vpDirections(Number.NaN, 1), null);
});

test("each car's fuel and the entities of a fuel (SP95 is not SP95-E10)", () => {
  const data = lib.vpFuelData(hass());
  assert.equal(lib.vpCarFuel(hass(), vehicle("captur"), data).key, "e10");
  const diesel = { ...states, "sensor.espace_consumption": { ...states["sensor.espace_consumption"], attributes: { ...states["sensor.espace_consumption"].attributes, fuel_type: "diesel" } } };
  assert.equal(lib.vpCarFuel(hass({ states: diesel }), vehicle("espace"), data).key, "gazole");
  const h = hass({
    entities: { ...entities, "sensor.carburants_best_price_sp95": { entity_id: "sensor.carburants_best_price_sp95", platform: "carburants_france", translation_key: "best_price" } },
    states: { ...states, "sensor.carburants_best_price_sp95": { entity_id: "sensor.carburants_best_price_sp95", state: "1.801", attributes: {} } },
  });
  assert.equal(lib.vpBest(h, { key: "sp95", name: "SP95" }).price, 1.801);
  assert.equal(lib.vpBest(h, { key: "e10", name: "SP95-E10" }).price, 1.739);
  assert.equal(lib.vpT(null, "ask_lock", { car: "A$'B" }), "Lock A$'B?");
});

test("Vehicle Consumption: the lease status, this month, the week, the curve against the contract", () => {
  const h = hass();
  const espace = vehicle("espace");
  const l = lib.vpLeaseInfo(h, espace, NOW);
  assert.equal(l.km, 60000);
  assert.equal(l.balance, 89);
  assert.equal(l.perMonth, 1237);
  assert.equal(l.overage, 193);
  assert.ok(Math.abs(l.cost - 15.44) < 1e-9);
  assert.equal(lib.vpMonthDriven(h, espace, stats, NOW), 1184);
  // Without Vehicle Consumption: from the panel's settings, this month from the statistics
  const plain = lib.vpVehicle(h, { ...settings.vehicles[0], consumption_device: "none" });
  const p = lib.vpLeaseInfo(h, plain, NOW);
  assert.equal(p.driven, 27840);
  assert.ok(p.cost > 0 && p.month === 23, JSON.stringify(p));
  assert.equal(lib.vpMonthDriven(h, plain, stats, NOW), 27840 - 26656);
  assert.equal(lib.vpLeaseInfo(h, vehicle("captur"), NOW), null);
  const curve = lib.vpLeaseCurve(h, espace, l, stats, NOW);
  assert.ok(curve.driven.length > 10);
  assert.ok(curve.driven.every(([t, km], i) => i === 0 || (t >= curve.driven[i - 1][0] && km >= 0)));
  assert.equal(curve.projection[1][1], 60193);
  const week = lib.vpWeek(h, [espace, vehicle("captur")], NOW);
  assert.ok(week.distance > 200 && week.average > 5 && week.average < 8, JSON.stringify(week));
});

test("what to check: overdue maintenance of the vehicles first, low range, low tyre, lease, service", () => {
  const h = hass();
  const items = lib.vpMaintenanceItems(h);
  assert.deepEqual(items.map((i) => i.id), ["task:wipers", "task:inspection", "task:oil"]);
  const checks = lib.vpChecks(h, [vehicle("espace"), vehicle("captur")], settings, NOW);
  assert.deepEqual(checks.map((c) => c.kind), ["maintenance", "maintenance", "lease", "range", "tyre"]);
  assert.equal(checks[3].station.name, "Station A");
  assert.equal(checks[4].tyre.key, "tyre_rl");
});

test("the Lease tab lists only the cars with a contract and is hidden when none has one", () => {
  const p = panelFor(hass());
  const html = p._body(p._ctx(), "lease");
  assert.ok(html.includes("Espace") && !html.includes("Captur"));
  assert.ok(p._tabs(p._ctx()).includes("lease"));
  const noLease = { ...settings, vehicles: settings.vehicles.map((v) => ({ device_id: v.device_id, consumption_device: "none" })) };
  const q = panelFor(hass(), noLease);
  assert.ok(!q._tabs(q._ctx()).includes("lease"));
});

test("every tab draws, and names from Home Assistant are escaped", () => {
  const evil = '<img src=x onerror="alert(1)">';
  const h = hass({
    states: { ...states, "sensor.winter_tyres": { ...states["sensor.winter_tyres"], attributes: { friendly_name: evil } } },
    devices: { ...devices, espace: { ...devices.espace, name_by_user: evil } },
  });
  const p = panelFor(h);
  const tabs = ["overview", "trips", "consumption", "fuel", "maintenance", "lease", "settings"];
  for (const tab of tabs) {
    const html = p._frame(p._ctx(), tabs, tab, p._body(p._ctx(), tab));
    assert.ok(!html.includes(evil), tab);
    assert.ok(html.includes('data-tab="settings"'), tab);
  }
});

test("without a vehicle the panel says where to pick them", () => {
  const p = panelFor(hass(), { vehicles: [], fuel_entities: [], maintenance_entities: [], low_range: 100 });
  assert.ok(p._body(p._ctx(), "overview").includes(lib.VP_EN.no_vehicle.slice(0, 20)));
});

test("actions are asked first in the panel: a button, Done, a refuel; saving sends the draft", async () => {
  const calls = [];
  const p = panelFor(
    hass({
      callService: async (...a) => calls.push(a),
      callWS: async (m) => {
        calls.push(m);
        return { ok: true, settings };
      },
    }),
  );
  p.attachShadow({ mode: "open" });
  const el = (dataset) => ({ dataset });
  p._act(el({ act: "press", id: "button.espace_sound_horn", v: "espace", label: "Sound horn" }));
  assert.equal(calls.length, 0);
  assert.ok(p._dialogHtml().includes("Sound horn"));
  await p._confirm();
  clearTimeout(p._pressTimer);
  assert.deepEqual(calls[0], ["button", "press", { entity_id: "button.espace_sound_horn" }]);
  assert.equal(p._dialog, null);
  p._act(el({ act: "done", id: "task:wipers", label: "Wiper blades" }));
  p._act(el({ act: "cancel" }));
  assert.equal(p._dialog, null);
  p._act(el({ act: "done", id: "task:wipers", label: "Wiper blades" }));
  await p._confirm();
  assert.deepEqual(calls[1], ["maintenance", "done", { item: "task:wipers" }]);
  p._act(el({ act: "refuel", v: "espace" }));
  assert.equal(p._dialog.fields[0].label, "f_liters");
  p._dialog.fields[0].value = "";
  await p._confirm();
  assert.equal(p._dialog.error, "need_amount");
  p._dialog.fields[0].value = "40,5";
  p._dialog.fields[1].value = "70";
  await p._confirm();
  assert.deepEqual(calls[2], ["vehicle_consumption", "add_refuel", { config_entry_id: "vc_espace", liters: 40.5, cost: 70, price: 1.739, odometer: 27840 }]);
  p._act(el({ act: "log", v: "espace" }));
  await p._confirm();
  assert.deepEqual(calls[3], ["vehicle_consumption", "log_service", { config_entry_id: "vc_espace", odometer: 27840, interval: 15000 }]);
  p._onInput({ composedPath: () => [{ dataset: { v: "captur", k: "lease_km" }, value: "40000" }] });
  p._onInput({ composedPath: () => [{ dataset: { g: "low_range" }, value: "80" }] });
  p._historyAt = Date.now();
  await p._save();
  const msg = calls.find((c) => c.type === "vehicle_panel/update_settings");
  assert.equal(msg.low_range, 80);
  assert.equal(msg.vehicles.find((v) => v.device_id === "captur").lease_km, "40000");
  assert.equal(p._saveState, "saved");
});

test("the version is the same in the bundle and in package.json", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(lib.VEHICLE_PANEL_VERSION, pkg.version);
});
