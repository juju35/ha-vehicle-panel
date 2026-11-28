"""Constants for the Vehicle Panel integration."""

DOMAIN = "vehicle_panel"
VERSION = "1.3.2"

# Files served by the integration, and the sidebar panel (its own path, not /vehicle_panel,
# so the frontend's panel route never shadows the files)
URL_BASE = f"/{DOMAIN}"
PANEL_URL = f"{URL_BASE}/vehicle-panel.js"
I18N_URL = f"{URL_BASE}/i18n"
PANEL_PATH = "vehicles"
PANEL_ICON = "mdi:car-multiple"
# The sidebar title, in Home Assistant's language (the sidebar has one title for every user)
PANEL_TITLES = {
    "en": "Vehicles",
    "fr": "Voitures",
    "de": "Fahrzeuge",
    "es": "Vehículos",
    "it": "Veicoli",
    "nl": "Voertuigen",
    "pt": "Veículos",
    "pl": "Pojazdy",
    "sr": "Возила",
    "sr-Latn": "Vozila",
    "ro": "Vehicule",
    "da": "Køretøjer",
    "sv": "Fordon",
    "bg": "Превозни средства",
    "ru": "Автомобили",
    "uk": "Автомобілі",
    "hu": "Járművek",
    "sk": "Vozidlá",
    "cs": "Vozidla",
    "sl": "Vozila",
    "lv": "Transportlīdzekļi",
    "el": "Οχήματα",
}

# Integrations whose entities the setup offers (the panel also reads Vehicle Consumption, Renault Picture and
# Orange Internet On the move devices, found from the vehicle's device)
FUEL_DOMAIN = "carburants_france"
MAINTENANCE_DOMAIN = "maintenance"

# Options of the config entry: the vehicles (one dict each, keyed by device id) and the panel's settings
CONF_VEHICLES = "vehicles"
CONF_FUEL_ENTITIES = "fuel_entities"
CONF_MAINTENANCE_ENTITIES = "maintenance_entities"
CONF_LOW_RANGE = "low_range"
# The vehicles' location (place, map, directions) shown to administrators only
CONF_LOCATION_ADMINS_ONLY = "location_admins_only"
CONF_DEVICE_ID = "device_id"
# Per vehicle (all optional): a name, plate and its department, the lease contract (and the price of a kilometre
# over it), the tank, and the devices of the optional integrations (consumption, data plan, home charger)
VEHICLE_KEYS = {
    "name": str,
    "plate": str,
    "plate_department": str,
    "lease_km": int,
    "lease_months": int,
    "lease_start": str,
    "lease_start_km": int,
    "extra_km_price": float,
    "tank_l": int,
    "picture_entity": str,
    "consumption_device": str,
    "data_device": str,
    "charger_device": str,
}
DEFAULT_LOW_RANGE = 100
