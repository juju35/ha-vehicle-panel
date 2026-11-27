"""Config flow: one entry; the vehicles to show, the fuel prices and the maintenance entities.

The lease contracts, tanks and optional devices of each vehicle are set in the panel's Settings tab.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    CONF_FUEL_ENTITIES,
    CONF_LOW_RANGE,
    CONF_MAINTENANCE_ENTITIES,
    CONF_VEHICLES,
    DEFAULT_LOW_RANGE,
    DOMAIN,
    FUEL_DOMAIN,
    MAINTENANCE_DOMAIN,
)
from .panel import merge_vehicles

# A vehicle is a device with a device_tracker (every connected car integration has one)
VEHICLE_SELECTOR = selector.DeviceSelector(
    selector.DeviceSelectorConfig(multiple=True, entity=[selector.EntityFilterSelectorConfig(domain="device_tracker")])
)


def _schema(current: dict[str, Any]) -> vol.Schema:
    vehicles = [v["device_id"] for v in current.get(CONF_VEHICLES, []) if isinstance(v, dict) and v.get("device_id")]
    return vol.Schema(
        {
            vol.Required(CONF_VEHICLES, default=vehicles): VEHICLE_SELECTOR,
            vol.Optional(CONF_FUEL_ENTITIES, default=current.get(CONF_FUEL_ENTITIES, [])): selector.EntitySelector(
                selector.EntitySelectorConfig(multiple=True, domain="sensor", integration=FUEL_DOMAIN)
            ),
            vol.Optional(
                CONF_MAINTENANCE_ENTITIES, default=current.get(CONF_MAINTENANCE_ENTITIES, [])
            ): selector.EntitySelector(selector.EntitySelectorConfig(multiple=True, integration=MAINTENANCE_DOMAIN)),
            vol.Optional(
                CONF_LOW_RANGE, default=current.get(CONF_LOW_RANGE, DEFAULT_LOW_RANGE)
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0, max=1000, step=10, unit_of_measurement="km", mode=selector.NumberSelectorMode.BOX
                )
            ),
        }
    )


def _options(user_input: dict[str, Any], current: dict[str, Any]) -> dict[str, Any]:
    return {
        **current,
        CONF_VEHICLES: merge_vehicles(list(user_input.get(CONF_VEHICLES, [])), current.get(CONF_VEHICLES, [])),
        CONF_FUEL_ENTITIES: list(user_input.get(CONF_FUEL_ENTITIES, [])),
        CONF_MAINTENANCE_ENTITIES: list(user_input.get(CONF_MAINTENANCE_ENTITIES, [])),
        CONF_LOW_RANGE: int(user_input.get(CONF_LOW_RANGE, DEFAULT_LOW_RANGE)),
    }


class VehiclePanelConfigFlow(ConfigFlow, domain=DOMAIN):
    """Add the Vehicles panel to the sidebar."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            if user_input.get(CONF_VEHICLES):
                return self.async_create_entry(title="Vehicle Panel", data={}, options=_options(user_input, {}))
            errors[CONF_VEHICLES] = "no_vehicle"
        return self.async_show_form(step_id="user", data_schema=_schema({}), errors=errors)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return VehiclePanelOptionsFlow()


class VehiclePanelOptionsFlow(OptionsFlow):
    """Pick the vehicles and the other entities again (each vehicle keeps its lease settings)."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        current = dict(self.config_entry.options)
        errors: dict[str, str] = {}
        if user_input is not None:
            if user_input.get(CONF_VEHICLES):
                return self.async_create_entry(data=_options(user_input, current))
            errors[CONF_VEHICLES] = "no_vehicle"
        return self.async_show_form(step_id="init", data_schema=_schema(current), errors=errors)
