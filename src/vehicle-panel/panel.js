// ── The sidebar panel ──
import { VEHICLE_PANEL_VERSION, VP_TABS, vpEsc, vpKm, vpLang, vpNum, vpLoadStrings, vpT } from "./core.js";
import { vpPictureUrl, vpVehicle } from "./discovery.js";
import { vpCard, vpFuelData, vpLeaseInfo, vpPriceSensor, vpService, vpStationsFor } from "./rich.js";
import { vpBarScene } from "./scene.js";
import { VP_STYLE } from "./styles.js";
import { vpConsumptionTab, vpFuelTab, vpLeaseTab, vpMaintenanceTab, vpTrips } from "./tabs.js";
import { VP_ICON_CAR, vpHeadStatus, vpOverview, vpSettingsTab } from "./views.js";

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
    this._menu();
  }

  get hass() {
    return this._hass;
  }

  set narrow(v) {
    this._narrow = v;
    this._menu();
  }

  /** Home Assistant's menu button (shown on a narrow screen or with the sidebar hidden) needs hass and narrow. */
  _menu() {
    const menu = this.shadowRoot?.querySelector?.("ha-menu-button");
    if (!menu) return;
    menu.hass = this._hass;
    menu.narrow = this._narrow;
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
      this.shadowRoot.addEventListener("keydown", (ev) => {
        if (!this._dialog) return;
        if (ev.key === "Escape") this._close();
        else if (ev.key === "Enter" && ev.composedPath()[0]?.tagName === "INPUT") this._confirm();
      });
    }
    const lang = this._lang();
    const [strings, res] = await Promise.all([vpLoadStrings(lang), this._hass.callWS({ type: "vehicle_panel/settings" }).catch(() => null)]);
    this._strings = strings;
    this._settings = res?.settings || { vehicles: [], fuel_entities: [], maintenance_entities: [], low_range: 100 };
    this._sig = null;
    this._render();
    this._fetchHistory();
  }

  /**
   * The vehicles of the settings. When their location is for administrators only, another user's panel drops the
   * trackers (no place, map or directions to the cars): the panel only, the trackers stay readable elsewhere.
   */
  _vehicles() {
    const hide = this._settings?.location_admins_only === true && !this._hass?.user?.is_admin;
    return (this._settings?.vehicles || []).map((cfg) => {
      const v = vpVehicle(this._hass, this._draftOf(cfg));
      return hide && !v.missing ? { ...v, ent: { ...v.ent, location: undefined, location_last_activity: undefined } } : v;
    });
  }

  _draftOf(cfg) {
    return this._draft?.vehicles?.[cfg.device_id] ? { ...cfg, ...this._draft.vehicles[cfg.device_id] } : cfg;
  }

  /**
   * The recorder's data behind the charts: the mileage (8 days), the average consumption (8 weeks), the 30-day price
   * of the stations of the fuel shown, and the monthly mileage statistics (this month, and the lease contracts).
   */
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
    const data = vpFuelData(this._hass);
    const fuel = data.fuels.find((f) => f.key === this._fuel) || data.fuels[0];
    const prices = fuel ? vpStationsFor(data, fuel.key, now).map((s) => vpPriceSensor(this._hass, s.id, fuel.name)).filter(Boolean) : [];
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const from = Math.min(monthStart.getTime() - 86400000, ...vs.map((v) => vpLeaseInfo(this._hass, v, now)?.start).filter(Number.isFinite));
    const mileages = vs.map((v) => v.ent.mileage).filter(Boolean);
    const stats = mileages.length
      ? this._hass
          .callWS({ type: "recorder/statistics_during_period", start_time: new Date(from - 31 * 86400000).toISOString(), period: "month", statistic_ids: mileages, types: ["state"], units: { distance: "km" } })
          .catch(() => ({}))
      : Promise.resolve({});
    const [miles, cons, price, st] = await Promise.all([ask(mileages, 8), ask(vs.map((v) => v.consumption?.average).filter(Boolean), 56), ask(prices, 30), stats]);
    this._history = { ...miles, ...cons, ...price };
    this._stats = st || {};
    this._sig = null;
    this._render();
  }

  _ctx() {
    return {
      hass: this._hass,
      lang: this._lang(),
      t: (k, vars) => this._t(k, vars),
      settings: {
        ...this._settings,
        ...(this._draft?.low_range != null ? { low_range: this._draft.low_range } : {}),
        ...(this._draft?.location_admins_only != null ? { location_admins_only: this._draft.location_admins_only } : {}),
      },
      vehicles: this._vehicles(),
      history: this._history,
      night: !!this._hass?.themes?.darkMode,
      now: Date.now(),
      uid: this._uid,
      pressed: this._pressed,
      saveState: this._saveState,
      stats: this._stats || {},
      maps: typeof window.loadCardHelpers === "function",
      cveh: this._cveh,
      metric: this._metric,
      fuel: this._fuel,
    };
  }

  /** The tabs shown: Lease only when a car has a contract. */
  _tabs(ctx) {
    const lease = ctx.vehicles.some((v) => vpLeaseInfo(this._hass, v, ctx.now));
    return VP_TABS.filter((k) => k !== "lease" || lease);
  }

  _render() {
    if (!this.shadowRoot || !this._hass || !this._settings) return;
    // A dialog with fields stays as it is while it is open, so that what is typed in it is kept
    if (this._dialog?.fields && this._sig && this.shadowRoot.querySelector?.(".dialog")) return;
    const ctx = this._ctx();
    const tabs = this._tabs(ctx);
    const tab = tabs.includes(this._tab()) ? this._tab() : "overview";
    // The Settings tab is drawn again only when its tab, draft or vehicles change (not on every state), so that a
    // field being typed in keeps its focus.
    let body;
    if (tab === "settings" && this._settingsHtml && this._lastTab === "settings" && !this._settingsDirty) body = this._settingsHtml;
    else body = this._body(ctx, tab);
    if (tab === "settings") {
      this._settingsHtml = body;
      this._settingsDirty = false;
    }
    const html = this._frame(ctx, tabs, tab, body);
    if (html !== this._sig) {
      this._sig = html;
      this._lastTab = tab;
      this.shadowRoot.innerHTML = html;
      this._menu();
      this.shadowRoot.querySelector?.(".dialog [data-autofocus]")?.focus?.();
    }
    this._mountMap(ctx);
  }

  /** Home Assistant's own map card with every car's tracker, in the overview's slot. */
  async _mountMap(ctx) {
    const slot = this.shadowRoot.querySelector?.(".vp-map");
    if (!slot || !ctx.maps) return;
    const ids = ctx.vehicles.filter((v) => !v.missing && v.ent.location).map((v) => v.ent.location);
    const key = ids.join(",");
    if (!this._map || this._mapKey !== key) {
      if (this._mapLoading) return;
      this._mapLoading = true;
      try {
        const helpers = await window.loadCardHelpers();
        this._map = helpers.createCardElement({ type: "map", entities: ids, hours_to_show: 0, theme_mode: "auto" });
        this._mapKey = key;
      } catch {
        this._mapLoading = false;
        return;
      }
      this._mapLoading = false;
    }
    this._map.hass = this._hass;
    const current = this.shadowRoot.querySelector?.(".vp-map");
    if (current && this._map.parentNode !== current) current.appendChild(this._map);
  }

  _body(ctx, tab) {
    if (!ctx.vehicles.length && tab !== "settings") return `<div class="c"><div class="note">${vpEsc(this._t("no_vehicle"))}</div></div>`;
    return VP_VIEWS[tab](ctx);
  }

  _frame(ctx, tabs, tab, body) {
    const status = vpHeadStatus(ctx);
    const pics = ctx.vehicles.filter((v) => !v.missing).map((v) => vpPictureUrl(this._hass, v.picture));
    const names = ctx.vehicles.filter((v) => !v.missing).map((v) => v.name);
    const sub = [this._t("vehicles_count", { n: names.length }), names.join(", ")].filter(Boolean).join(" · ");
    const nav = tabs.map((k) => `<button class="tab ${k === tab ? "active" : ""}" data-tab="${k}" role="tab" aria-selected="${k === tab}">${vpEsc(this._t(`tab_${k}`))}</button>`).join("");
    return `<style>${VP_STYLE}</style>
      <div class="banner ${ctx.night ? "night" : ""}">${vpBarScene(pics)}<div class="road"></div>
        <div class="htext"><ha-menu-button></ha-menu-button>
          <div class="hicon" style="${status?.tone === "warn" ? "--vp-st:var(--vp-warn)" : status ? "--vp-st:var(--vp-ok)" : ""}">${VP_ICON_CAR}</div>
          <div class="tt"><div class="trow"><span class="htitle">${vpEsc(this._t("title"))}</span>${status ? `<span class="pill ${status.tone}"><span class="dot"></span>${vpEsc(status.text)}</span>` : ""}</div>
          <div class="hsub">${vpEsc(sub)}</div></div></div></div>
      <nav class="tabs" role="tablist">${nav}</nav>
      <main>${body}</main>${this._dialogHtml()}`;
  }

  /** The dialog asked before an action: a question, or a small form (refuel, service). */
  _dialogHtml() {
    const d = this._dialog;
    if (!d) return "";
    const fields = (d.fields || [])
      .map(
        (f, i) =>
          `<label class="f">${vpEsc(this._t(f.label))}<input type="number" min="0" step="any" inputmode="decimal" name="${vpEsc(f.name)}" value="${vpEsc(f.value ?? "")}" ${i === 0 ? "data-autofocus" : ""}></label>`,
      )
      .join("");
    return `<div class="scrim" data-act="cancel"></div><div class="dialog" role="dialog" aria-modal="true" aria-label="${vpEsc(d.title || d.text)}">
      ${d.title ? `<b>${vpEsc(d.title)}</b>` : ""}${d.text ? `<div class="s">${vpEsc(d.text)}</div>` : ""}
      ${fields ? `<div class="form">${fields}</div>` : ""}${d.error ? `<div class="s err">${vpEsc(this._t(d.error))}</div>` : ""}
      <div class="acts end"><button class="btn" data-act="cancel">${vpEsc(this._t("cancel"))}</button><button class="btn ${d.danger ? "err" : "accent"}" data-act="ok" ${fields ? "" : "data-autofocus"}>${vpEsc(this._t(d.ok || "confirm"))}</button></div></div>`;
  }

  _onClick(ev) {
    const path = ev.composedPath();
    const el = path.find((n) => n?.dataset && (n.dataset.tab || n.dataset.act || n.dataset.save !== undefined || n.dataset.cveh || n.dataset.metric || n.dataset.fuel || n.dataset.stop !== undefined));
    if (!el || el.dataset.stop !== undefined) return;
    if (el.dataset.tab) return this._go(el.dataset.tab);
    if (el.dataset.save !== undefined) return this._save();
    if (el.dataset.cveh) return this._set("_cveh", el.dataset.cveh);
    if (el.dataset.metric) return this._set("_metric", el.dataset.metric);
    if (el.dataset.fuel) {
      this._set("_fuel", el.dataset.fuel);
      this._historyAt = 0;
      return this._fetchHistory();
    }
    return this._act(el);
  }

  _set(key, value) {
    this[key] = value;
    this._sig = null;
    this._render();
  }

  _vehicle(id) {
    return this._vehicles().find((v) => v.id === id);
  }

  /** An action of a button: asked first in the panel, then run. */
  _act(el) {
    const { act, id, v: vid, label, o } = el.dataset;
    const t = (k, vars) => this._t(k, vars);
    const v = vid ? this._vehicle(vid) : null;
    const call = (domain, service, data) => () => this._hass.callService(domain, service, data);
    if (act === "cancel") return this._close();
    if (act === "ok") return this._confirm();
    if (act === "press") return this._open({ text: t("ask_press", { name: label, car: v?.name || "" }), run: () => this._press(id) });
    if (act === "lock") return this._open({ text: t("ask_lock", { car: v?.name || "" }), ok: "lock", run: call("lock", "lock", { entity_id: id }) });
    if (act === "unlock") return this._open({ text: t("ask_unlock", { car: v?.name || "" }), ok: "unlock", danger: true, run: call("lock", "unlock", { entity_id: id }) });
    if (act === "done") return this._open({ text: t("ask_done", { name: label }), ok: "done", run: call("maintenance", "done", { item: id }) });
    if (act === "toggle") return this._open({ text: t("ask_toggle", { name: label }), run: call("switch", "toggle", { entity_id: id }) });
    if (act === "select") return call("select", "select_option", { entity_id: id, option: o })();
    if (act === "number") {
      const s = this._hass.states[id];
      if (vpNum(s) == null) return;
      const step = Number(s?.attributes?.step) || 1;
      const next = Math.min(Number(s?.attributes?.max ?? Infinity), Math.max(Number(s?.attributes?.min ?? -Infinity), vpNum(s) + Number(o) * step));
      return call("number", "set_value", { entity_id: id, value: next })();
    }
    if (act === "refuel" && v) {
      const card = vpCard(this._hass, v);
      const charge = !card?.refuels?.length && (card?.charges?.length || card?.kind === "electric");
      const mileage = vpKm(this._hass.states[v.ent.mileage]);
      return this._open({
        title: t(charge ? "log_charge" : "log_refuel"),
        text: v.name,
        ok: "save",
        fields: [
          { name: "amount", label: charge ? "f_energy" : "f_liters" },
          { name: "cost", label: "f_cost" },
          { name: "price", label: "f_price", value: charge ? card?.electricity_price : card?.fuel_price },
          { name: "odometer", label: "f_odometer", value: mileage != null ? Math.round(mileage) : "" },
        ],
        run: (f) => {
          if (!(f.amount > 0)) throw new Error("need_amount");
          const data = { config_entry_id: card.entry_id, [charge ? "energy" : "liters"]: f.amount };
          for (const k of ["cost", "price", "odometer"]) if (f[k] != null) data[k] = f[k];
          return this._hass.callService("vehicle_consumption", charge ? "add_charge" : "add_refuel", data);
        },
      });
    }
    if (act === "log" && v) {
      const card = vpCard(this._hass, v);
      const service = vpService(this._hass, v);
      const mileage = vpKm(this._hass.states[v.ent.mileage]);
      return this._open({
        title: t("log_service"),
        text: v.name,
        ok: "save",
        fields: [
          { name: "odometer", label: "f_odometer", value: mileage != null ? Math.round(mileage) : "" },
          { name: "interval", label: "f_interval", value: service?.interval ?? "" },
        ],
        run: (f) => {
          if (!card?.entry_id) throw new Error("save_failed");
          const data = { config_entry_id: card.entry_id };
          if (f.odometer != null) data.odometer = f.odometer;
          if (f.interval != null) data.interval = f.interval;
          return this._hass.callService("vehicle_consumption", "log_service", data);
        },
      });
    }
  }

  _open(dialog) {
    this._dialog = dialog;
    this._sig = null;
    this._render();
  }

  _close() {
    this._dialog = null;
    this._sig = null;
    this._render();
  }

  /** The dialog's fields as numbers (empty ones left out), then its action; an error keeps it open. */
  async _confirm() {
    const d = this._dialog;
    if (!d || d.busy) return;
    const values = {};
    for (const f of d.fields || []) {
      const input = this.shadowRoot.querySelector?.(`.dialog input[name="${f.name}"]`);
      const raw = input ? input.value : f.value;
      f.value = raw;
      const n = raw === "" || raw == null ? null : Number(String(raw).replace(",", "."));
      if (n != null && Number.isFinite(n)) values[f.name] = n;
    }
    d.busy = true;
    try {
      await d.run(values);
      this._dialog = null;
    } catch (err) {
      d.error = err?.message === "need_amount" ? "need_amount" : "action_failed";
      d.busy = false;
    }
    this._sig = null;
    this._render();
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
    clearTimeout(this._pressTimer);
    this._pressTimer = setTimeout(() => {
      this._pressed = null;
      this._sig = null;
      this._render();
    }, 2500);
  }

  _onInput(ev) {
    const el = ev.composedPath()[0];
    if (!el?.dataset || el.closest?.(".dialog")) return;
    this._draft ||= { vehicles: {} };
    if (el.dataset.g === "low_range") this._draft.low_range = el.value === "" ? null : Number(el.value);
    else if (el.dataset.g === "location_admins_only") this._draft.location_admins_only = el.checked === true;
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
    if (typeof this._draft?.location_admins_only === "boolean") msg.location_admins_only = this._draft.location_admins_only;
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
