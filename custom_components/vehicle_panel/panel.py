"""Sidebar panel and its WebSocket commands.

The panel (``frontend/vehicle-panel.js``) finds each vehicle's entities itself, from the device and entity
registries the frontend already has (``hass.devices``, ``hass.entities``), and reads their states. It only needs
the settings kept in the config entry's options:

- ``vehicle_panel/settings``: the vehicles picked in the setup, their lease contract, tank and optional devices,
  the fuel prices and maintenance entities, and the low range threshold (every user: the panel is for everyone);
- ``vehicle_panel/update_settings``: the same, edited in the panel's Settings tab (administrators only).
"""

from __future__ import annotations

import re
from typing import Any

import voluptuous as vol
from homeassistant.components import panel_custom, websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback

from .const import (
    CONF_DEVICE_ID,
    CONF_FUEL_ENTITIES,
    CONF_LOW_RANGE,
    CONF_MAINTENANCE_ENTITIES,
    CONF_VEHICLES,
    DEFAULT_LOW_RANGE,
    DOMAIN,
    PANEL_ICON,
    PANEL_PATH,
    PANEL_TITLES,
    PANEL_URL,
    VEHICLE_KEYS,
    VERSION,
)

DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def panel_title(language: str | None) -> str:
    """The sidebar title in Home Assistant's language: the full code, then its base, then English."""
    lang = language or "en"
    return PANEL_TITLES.get(lang) or PANEL_TITLES.get(lang.split("-")[0]) or PANEL_TITLES["en"]


def clean_vehicle(raw: Any) -> dict[str, Any] | None:
    """A vehicle's settings with only the known keys, of the right type; None without a device."""
    if not isinstance(raw, dict) or not isinstance(raw.get(CONF_DEVICE_ID), str) or not raw[CONF_DEVICE_ID]:
        return None
    out: dict[str, Any] = {CONF_DEVICE_ID: raw[CONF_DEVICE_ID]}
    for key, kind in VEHICLE_KEYS.items():
        value = raw.get(key)
        if value in (None, ""):
            continue
        if kind in (int, float):
            try:
                number = kind(value)
            except (TypeError, ValueError):
                continue
            if number >= 0:
                out[key] = round(number, 3) if kind is float else number
        elif isinstance(value, str):
            if key == "lease_start" and not DATE.match(value):
                continue
            out[key] = value.strip()
    return out


def settings(entry: ConfigEntry | None) -> dict[str, Any]:
    """The settings, cleaned and with their defaults."""
    options = entry.options if entry else {}
    vehicles = [v for v in (clean_vehicle(x) for x in options.get(CONF_VEHICLES, [])) if v]
    low = options.get(CONF_LOW_RANGE, DEFAULT_LOW_RANGE)
    return {
        CONF_VEHICLES: vehicles,
        CONF_FUEL_ENTITIES: [e for e in options.get(CONF_FUEL_ENTITIES, []) if isinstance(e, str)],
        CONF_MAINTENANCE_ENTITIES: [e for e in options.get(CONF_MAINTENANCE_ENTITIES, []) if isinstance(e, str)],
        CONF_LOW_RANGE: low if isinstance(low, int) and low >= 0 else DEFAULT_LOW_RANGE,
    }


def merge_vehicles(device_ids: list[str], current: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """The vehicles picked, in that order, each keeping the settings it already had."""
    known = {v[CONF_DEVICE_ID]: v for v in current if isinstance(v, dict) and v.get(CONF_DEVICE_ID)}
    return [known.get(device_id, {CONF_DEVICE_ID: device_id}) for device_id in device_ids]


def _entry(hass: HomeAssistant) -> ConfigEntry | None:
    entries = hass.config_entries.async_entries(DOMAIN)
    return entries[0] if entries else None


async def async_register_panel(hass: HomeAssistant) -> None:
    """Add Vehicles to the sidebar, for every user."""
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="vehicle-panel",
        sidebar_title=panel_title(hass.config.language),
        sidebar_icon=PANEL_ICON,
        module_url=f"{PANEL_URL}?v={VERSION}",
        require_admin=False,
        config={"version": VERSION},
    )


@callback
def async_register_commands(hass: HomeAssistant) -> None:
    """The panel's WebSocket commands."""
    websocket_api.async_register_command(hass, _ws_settings)
    websocket_api.async_register_command(hass, _ws_update_settings)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/settings"})
@callback
def _ws_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    connection.send_result(msg["id"], {"settings": settings(_entry(hass))})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/update_settings",
        vol.Optional(CONF_VEHICLES): [dict],
        vol.Optional(CONF_FUEL_ENTITIES): [str],
        vol.Optional(CONF_MAINTENANCE_ENTITIES): [str],
        vol.Optional(CONF_LOW_RANGE): vol.All(int, vol.Range(min=0, max=2000)),
    }
)
@websocket_api.require_admin
@callback
def _ws_update_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    if (entry := _entry(hass)) is None:
        connection.send_result(msg["id"], {"ok": False, "error": "not_found"})
        return
    current = settings(entry)
    updated = {**current}
    if CONF_VEHICLES in msg:
        updated[CONF_VEHICLES] = [v for v in (clean_vehicle(x) for x in msg[CONF_VEHICLES]) if v]
    for key in (CONF_FUEL_ENTITIES, CONF_MAINTENANCE_ENTITIES, CONF_LOW_RANGE):
        if key in msg:
            updated[key] = msg[key]
    if updated != current:
        hass.config_entries.async_update_entry(entry, options=updated)
    connection.send_result(msg["id"], {"ok": True, "settings": updated})
