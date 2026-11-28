"""Setup, the config and options flows, the sidebar panel and the WebSocket commands."""

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.vehicle_panel.const import DOMAIN, PANEL_ICON, PANEL_PATH
from custom_components.vehicle_panel.panel import clean_vehicle, merge_vehicles, panel_title, settings

OPTIONS = {
    "vehicles": [{"device_id": "car1", "lease_km": 60000, "lease_months": 48, "lease_start": "2025-01-20"}],
    "fuel_entities": ["sensor.station_a"],
    "maintenance_entities": [],
    "low_range": 100,
}


async def _setup(hass: HomeAssistant, options=None) -> MockConfigEntry:
    assert await async_setup_component(hass, "http", {})
    entry = MockConfigEntry(domain=DOMAIN, title="Vehicle Panel", data={}, options=options or dict(OPTIONS))
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def _car(hass: HomeAssistant, name: str) -> str:
    source = MockConfigEntry(domain="renault")
    source.add_to_hass(hass)
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=source.entry_id, identifiers={("renault", name)}, name=name
    )
    return device.id


async def test_config_flow_needs_a_vehicle_and_is_single(hass: HomeAssistant):
    car = _car(hass, "Espace")
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] == "form"
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"vehicles": []})
    assert result["type"] == "form"
    assert result["errors"] == {"vehicles": "no_vehicle"}
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"vehicles": [car], "low_range": 80})
    assert result["type"] == "create_entry"
    assert result["options"] == {
        "vehicles": [{"device_id": car}],
        "fuel_entities": [],
        "maintenance_entities": [],
        "low_range": 80,
    }
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    assert result["type"] == "abort"
    assert result["reason"] == "single_instance_allowed"


async def test_options_flow_keeps_each_vehicles_settings(hass: HomeAssistant):
    car1 = _car(hass, "Espace")
    car2 = _car(hass, "Captur")
    entry = await _setup(hass, {**OPTIONS, "vehicles": [{"device_id": car1, "lease_km": 60000}]})
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] == "form"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {"vehicles": [car2, car1], "low_range": 50}
    )
    assert result["type"] == "create_entry"
    assert entry.options["vehicles"] == [{"device_id": car2}, {"device_id": car1, "lease_km": 60000}]
    assert entry.options["low_range"] == 50


async def test_panel_for_everyone_and_removed_on_unload(hass: HomeAssistant):
    hass.config.language = "fr"
    entry = await _setup(hass)
    panel = hass.data["frontend_panels"][PANEL_PATH]
    assert panel.sidebar_icon == PANEL_ICON
    assert panel.sidebar_title == "Voitures"
    assert panel.require_admin is False
    await hass.config_entries.async_unload(entry.entry_id)
    assert PANEL_PATH not in hass.data["frontend_panels"]


async def test_settings_command_for_every_user(hass: HomeAssistant, hass_ws_client, hass_admin_user):
    await _setup(hass)
    hass_admin_user.groups = []
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": f"{DOMAIN}/settings"})
    res = await client.receive_json()
    assert res["success"]
    assert res["result"]["settings"] == {**OPTIONS, "location_admins_only": False}
    await client.send_json_auto_id({"type": f"{DOMAIN}/update_settings", "low_range": 50})
    res = await client.receive_json()
    assert not res["success"] and res["error"]["code"] == "unauthorized"


async def test_update_settings(hass: HomeAssistant, hass_ws_client):
    entry = await _setup(hass)
    client = await hass_ws_client(hass)
    await client.send_json_auto_id(
        {
            "type": f"{DOMAIN}/update_settings",
            "vehicles": [
                {"device_id": "car1", "lease_km": "50000", "tank_l": "55", "lease_start": "bad", "junk": 1},
                {"x": 1},
            ],
            "low_range": 120,
            "location_admins_only": True,
        }
    )
    res = await client.receive_json()
    assert res["success"] and res["result"]["ok"]
    assert entry.options["vehicles"] == [{"device_id": "car1", "lease_km": 50000, "tank_l": 55}]
    assert entry.options["low_range"] == 120
    assert entry.options["location_admins_only"] is True
    await client.send_json_auto_id({"type": f"{DOMAIN}/update_settings", "low_range": 5000})
    res = await client.receive_json()
    assert not res["success"]


def test_helpers():
    assert panel_title("fr-FR") == "Voitures"
    assert panel_title("sr-Latn") == "Vozila"
    assert panel_title("ja") == panel_title(None) == "Vehicles"
    assert clean_vehicle({"device_id": ""}) is None
    assert clean_vehicle("x") is None
    assert clean_vehicle({"device_id": "a", "name": " Car ", "lease_months": -1, "lease_start": "2025-02-01"}) == {
        "device_id": "a",
        "name": "Car",
        "lease_start": "2025-02-01",
    }
    assert clean_vehicle(
        {"device_id": "a", "plate": " AB-123-CD ", "extra_km_price": "0.0812", "charger_device": "w"}
    ) == {
        "device_id": "a",
        "plate": "AB-123-CD",
        "extra_km_price": 0.081,
        "charger_device": "w",
    }
    assert clean_vehicle({"device_id": "a", "extra_km_price": "x"}) == {"device_id": "a"}
    assert merge_vehicles(["b", "a"], [{"device_id": "a", "tank_l": 50}]) == [
        {"device_id": "b"},
        {"device_id": "a", "tank_l": 50},
    ]
    assert settings(None) == {
        "vehicles": [],
        "fuel_entities": [],
        "maintenance_entities": [],
        "low_range": 100,
        "location_admins_only": False,
    }
