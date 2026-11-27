// ── The sidebar panel ──
import { VEHICLE_PANEL_VERSION, VP_TABS, vpEsc, vpLang, vpLoadStrings, vpT } from "./core.js";
import { vpPictureUrl, vpVehicle } from "./discovery.js";
import { vpBarScene } from "./scene.js";
import { VP_STYLE } from "./styles.js";
import { VP_ICON_CAR, vpConsumptionTab, vpFuelTab, vpHeadStatus, vpLeaseTab, vpMaintenanceTab, vpOverview, vpSettingsTab, vpTrips } from "./views.js";

const VP_VIEWS = { overview: vpOverview, trips: vpTrips, consumption: vpConsumptionTab, fuel: vpFuelTab, maintenance: vpMaintenanceTab, lease: vpLeaseTab, settings: vpSettingsTab };
// The history behind the charts is fetched again after this long
const VP_HISTORY_TTL = 10 * 60 * 1000;

export class VehiclePanel extends HTMLElement {
  constructor() {
    super();
    this._settings = null;
    this._strings = null;
    this._history = {};
    this._historyAt = 0;
    this._draft = null;
    this._uid = `vp${Math.random().toString(36).slice(2, 7)}`;
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._init();
    this._render();
  }

  get hass() {
    return this._hass;
  }

  set narrow(v) {
    this._narrow = v;
    this._render();
  }

  set route(route) {
    this._route = route;
    this._render();
  }

  set panel(panel) {
    this._panel = panel;
  }

  _lang() {
    return vpLang(this._hass?.locale?.language || this._hass?.language);
  }

  _t(key, vars) {
    return vpT(this._strings, key, vars);
  }

  _tab() {
    const seg = String(this._route?.path || "").split("/").filter(Boolean)[0];
    return VP_TABS.includes(seg) ? seg : "overview";
  }

  async _init() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
      this.shadowRoot.addEventListener("input", (ev) => this._onInput(ev));
      this.shadowRoot.addEventListener("change", (ev) => this._onInput(ev));
    }
    const lang = this._lang();
    const [strings, res] = await Promise.all([vpLoadStrings(lang), this._hass.callWS({ type: "vehicle_panel/settings" }).catch(() => null)]);
    this._strings = strings;
    this._settings = res?.settings || { vehicles: [], fuel_entities: [], maintenance_entities: [], low_range: 100 };
    this._sig = null;
    this._render();
    this._fetchHistory();
  }

  _vehicles() {
    return (this._settings?.vehicles || []).map((cfg) => vpVehicle(this._hass, this._draftOf(cfg)));
  }

  _draftOf(cfg) {
    return this._draft?.vehicles?.[cfg.device_id] ? { ...cfg, ...this._draft.vehicles[cfg.device_id] } : cfg;
  }

  /** The recorder's history behind the charts: the mileage (7 days) and the average consumption (8 weeks). */
  async _fetchHistory() {
    if (!this._hass?.callWS || Date.now() - this._historyAt < VP_HISTORY_TTL) return;
    this._historyAt = Date.now();
    const vs = this._vehicles().filter((v) => !v.missing);
    const now = Date.now();
    const ask = async (ids, days) => {
      if (!ids.length) return {};
      try {
        return await this._hass.callWS({
          type: "history/history_during_period",
          start_time: new Date(now - days * 86400000).toISOString(),
          end_time: new Date(now).toISOString(),
          entity_ids: ids,
          minimal_response: true,
          no_attributes: true,
          significant_changes_only: false,
        });
      } catch {
        return {};
      }
    };
    const [miles, cons] = await Promise.all([ask(vs.map((v) => v.ent.mileage).filter(Boolean), 8), ask(vs.map((v) => v.consumption?.average).filter(Boolean), 56)]);
    this._history = { ...miles, ...cons };
    this._sig = null;
    this._render();
  }

  _ctx() {
    return {
      hass: this._hass,
      lang: this._lang(),
      t: (k, vars) => this._t(k, vars),
      settings: { ...this._settings, ...(this._draft?.low_range != null ? { low_range: this._draft.low_range } : {}) },
      vehicles: this._vehicles(),
      history: this._history,
      night: !!this._hass?.themes?.darkMode,
      now: Date.now(),
      uid: this._uid,
      pressed: this._pressed,
      saveState: this._saveState,
    };
  }

  _render() {
    if (!this.shadowRoot || !this._hass || !this._settings) return;
    const tab = this._tab();
    const ctx = this._ctx();
    // The Settings tab is drawn again only when its tab, draft or vehicles change (not on every state), so that a
    // field being typed in keeps its focus.
    const body = tab === "settings" && this._settingsHtml && this._lastTab === "settings" && !this._settingsDirty ? this._settingsHtml : this._body(ctx, tab);
    if (tab === "settings") {
      this._settingsHtml = body;
      this._settingsDirty = false;
    }
    const html = this._frame(ctx, tab, body);
    if (html === this._sig) return;
    this._sig = html;
    this._lastTab = tab;
    this.shadowRoot.innerHTML = html;
  }

  _body(ctx, tab) {
    if (!ctx.vehicles.length && tab !== "settings") return `<div class="c"><div class="note">${vpEsc(this._t("no_vehicle"))}</div></div>`;
    return VP_VIEWS[tab](ctx);
  }

  _frame(ctx, tab, body) {
    const status = vpHeadStatus(ctx);
    const pics = ctx.vehicles.filter((v) => !v.missing).map((v) => vpPictureUrl(this._hass, v.picture));
    const names = ctx.vehicles.filter((v) => !v.missing).map((v) => v.name);
    const sub = [this._t("vehicles_count", { n: names.length }), names.join(", ")].filter(Boolean).join(" · ");
    const tabs = VP_TABS.map((k) => `<button class="tab ${k === tab ? "active" : ""}" data-tab="${k}">${vpEsc(this._t(`tab_${k}`))}</button>`).join("");
    return `<style>${VP_STYLE}</style>
      <div class="banner ${ctx.night ? "night" : ""}">${vpBarScene(pics)}<div class="road"></div>
        <div class="htext">${this._narrow ? '<ha-menu-button></ha-menu-button>' : ""}
          <div class="hicon" style="${status?.tone === "warn" ? "--vp-st:var(--vp-warn)" : status ? "--vp-st:var(--vp-ok)" : ""}">${VP_ICON_CAR}</div>
          <div class="tt"><div class="trow"><span class="htitle">${vpEsc(this._t("title"))}</span>${status ? `<span class="pill ${status.tone}"><span class="dot"></span>${vpEsc(status.text)}</span>` : ""}</div>
          <div class="hsub">${vpEsc(sub)}</div></div></div></div>
      <nav class="tabs" role="tablist">${tabs}</nav>
      <main>${body}</main>`;
  }

  _onClick(ev) {
    const el = ev.composedPath().find((n) => n?.dataset && (n.dataset.tab || n.dataset.press || n.dataset.save !== undefined));
    if (!el) return;
    if (el.dataset.tab) return this._go(el.dataset.tab);
    if (el.dataset.press) return this._press(el.dataset.press);
    if (el.dataset.save !== undefined) return this._save();
  }

  _go(tab) {
    const base = this._panel?.url_path || "vehicles";
    const path = `/${base}${tab === "overview" ? "" : `/${tab}`}`;
    history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    this._route = { path: tab === "overview" ? "" : `/${tab}` };
    this._settingsDirty = true;
    this._render();
  }

  async _press(id) {
    await this._hass.callService("button", "press", { entity_id: id });
    this._pressed = id;
    this._sig = null;
    this._render();
    clearTimeout(this._pressTimer);
    this._pressTimer = setTimeout(() => {
      this._pressed = null;
      this._sig = null;
      this._render();
    }, 2500);
  }

  _onInput(ev) {
    const el = ev.composedPath()[0];
    if (!el?.dataset) return;
    this._draft ||= { vehicles: {} };
    if (el.dataset.g === "low_range") this._draft.low_range = el.value === "" ? null : Number(el.value);
    else if (el.dataset.v && el.dataset.k) {
      const v = (this._draft.vehicles[el.dataset.v] ||= {});
      v[el.dataset.k] = el.value;
    }
    this._saveState = null;
  }

  /** The draft merged into the settings and sent; the panel follows the saved settings. */
  async _save() {
    const vehicles = (this._settings.vehicles || []).map((cfg) => {
      const merged = { ...cfg, ...(this._draft?.vehicles?.[cfg.device_id] || {}) };
      for (const k of Object.keys(merged)) if (merged[k] === "") delete merged[k];
      return merged;
    });
    const msg = { type: "vehicle_panel/update_settings", vehicles };
    if (this._draft?.low_range != null && Number.isFinite(this._draft.low_range)) msg.low_range = Math.round(this._draft.low_range);
    try {
      const res = await this._hass.callWS(msg);
      if (!res?.ok) throw new Error(res?.error || "failed");
      this._settings = res.settings;
      this._draft = null;
      this._saveState = "saved";
    } catch {
      this._saveState = "save_failed";
    }
    this._settingsDirty = true;
    this._historyAt = 0;
    this._fetchHistory();
    this._render();
  }
}

export const VEHICLE_PANEL_LOADED = VEHICLE_PANEL_VERSION;
if (!customElements.get("vehicle-panel")) customElements.define("vehicle-panel", VehiclePanel);
