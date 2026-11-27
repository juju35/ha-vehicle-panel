// The sidebar panel: languages, what it finds of each vehicle, what the tabs compute and the HTML they draw.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { devices, entities, history, NOW, settings, states } from "../scripts/mock-states.mjs";
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
  assert.equal(vehicle("captur").consumption, null);
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
  assert.deepEqual(lib.vpStations(hass(), settings.fuel_entities).map((s) => s.id), settings.fuel_entities);
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
  return p;
};

test("every tab draws, and names from Home Assistant are escaped", () => {
  const evil = '<img src=x onerror="alert(1)">';
  const h = hass({
    states: { ...states, "sensor.winter_tyres": { ...states["sensor.winter_tyres"], attributes: { friendly_name: evil } } },
    devices: { ...devices, espace: { ...devices.espace, name_by_user: evil } },
  });
  const p = panelFor(h);
  for (const tab of ["overview", "trips", "consumption", "fuel", "maintenance", "lease", "settings"]) {
    const html = p._frame(p._ctx(), tab, p._body(p._ctx(), tab));
    assert.ok(!html.includes(evil), tab);
    assert.ok(html.includes('data-tab="settings"'), tab);
  }
});

test("without a vehicle the panel says where to pick them", () => {
  const p = panelFor(hass(), { vehicles: [], fuel_entities: [], maintenance_entities: [], low_range: 100 });
  assert.ok(p._body(p._ctx(), "overview").includes(lib.VP_EN.no_vehicle.slice(0, 20)));
});

test("a button press calls button.press; saving sends the draft", async () => {
  const calls = [];
  const p = panelFor(hass({ callService: async (...a) => calls.push(a), callWS: async (m) => {
      calls.push(m);
      return { ok: true, settings };
    }, }));
  await p._press("button.espace_sound_horn");
  clearTimeout(p._pressTimer);
  assert.deepEqual(calls[0], ["button", "press", { entity_id: "button.espace_sound_horn" }]);
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
