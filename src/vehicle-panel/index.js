// Entry point: the modules in their original order. scripts/build-frontend.mjs (scripts/bundle.mjs) concatenates them
// in this order into the single module the integration serves.
import "./core.js";
import "./discovery.js";
import "./model.js";
import "./rich.js";
import "./plate.js";
import "./scene.js";
import "./styles.js";
import "./views.js";
import "./tabs.js";
import "./panel.js";
// The assembled module's own exports (the other `export`s only join the modules)
export { VEHICLE_PANEL_VERSION, VP_EN, VP_LANGS, vpFmt, vpLang, vpT } from "./core.js";
export { vpTyrePos, vpVehicle } from "./discovery.js";
export { vpDaily, vpLease, vpLevel, vpLocked, vpRange, vpStations, vpStatus, vpUrgency, vpWeekly } from "./model.js";
export { vpBest, vpCard, vpCarFuel, vpChecks, vpDirections, vpFuelData, vpLeaseCurve, vpLeaseInfo, vpMaintenanceItems, vpMonthDriven, vpOpen, vpStationsFor, vpWeek } from "./rich.js";
export { vpPlateFormat, vpPlateOption, vpPlateSvg } from "./plate.js";
export { VehiclePanel } from "./panel.js";
