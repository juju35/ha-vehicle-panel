// Renders the sidebar panel with mock data (scripts/mock-states.mjs) and saves the README screenshots, light and dark.
// Usage: npm run screenshots (CHROMIUM_PATH=/path/to/chrome to use an installed browser)
// The car pictures of scripts/pictures/ are only used here, for the mock vehicles' Renault Picture sensors.
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { devices, entities, history, NOW, settings, states, stats } from "./mock-states.mjs";
import { writeIfChanged } from "./screenshot-write.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const ORIGIN = "http://ha.test";
const WIDTH = 1280;

// The captures: one per tab, each in the light and the dark theme (screenshots/<file>[-dark].png). The names are
// written out so that scripts/check_screenshots.py finds them before their first render.
const TABS = {
  overview: "panel-overview",
  trips: "panel-trips",
  consumption: "panel-consumption",
  fuel: "panel-fuel",
  maintenance: "panel-maintenance",
  lease: "panel-lease",
  settings: "panel-settings",
};
export const shots = Object.entries(TABS).flatMap(([tab, file]) =>
  ["light", "dark"].map((theme) => ({ tab, theme, file: `${file}${theme === "dark" ? "-dark" : ""}` })),
);

const THEMES = {
  light: {
    "--primary-background-color": "#e8eaed",
    "--secondary-background-color": "#ececec",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#212121",
    "--secondary-text-color": "#5f6368",
    "--divider-color": "rgba(0,0,0,.12)",
  },
  dark: {
    "--primary-background-color": "#111111",
    "--secondary-background-color": "#282828",
    "--card-background-color": "#1c1c1c",
    "--primary-text-color": "#e1e1e1",
    "--secondary-text-color": "#a0a0a0",
    "--divider-color": "rgba(225,225,225,.12)",
  },
};

const pageHtml = (theme) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { --primary-color: #03a9f4; ${Object.entries(THEMES[theme])
    .map(([k, v]) => `${k}:${v};`)
    .join("")} }
  body { margin: 0; background: var(--primary-background-color); font-family: Roboto, "Segoe UI", Helvetica, Arial, sans-serif; width: ${WIDTH}px; }
</style></head><body><div id="root"></div></body></html>`;

// The folder is not in the repository until the first captures are committed
mkdirSync(`${root}screenshots`, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let failed = false;

for (const s of shots) {
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: WIDTH, height: 900 } });
  await page.clock.setFixedTime(NOW);
  page.on("pageerror", (err) => {
    console.error(`${s.file}: ${err.message}`);
    failed = true;
  });
  await page.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/vehicle_panel/vehicle-panel.js")
      return route.fulfill({ contentType: "text/javascript", body: readFileSync(`${root}custom_components/vehicle_panel/frontend/vehicle-panel.js`, "utf8") });
    if (path.startsWith("/pictures/")) return route.fulfill({ contentType: "image/webp", body: readFileSync(`${root}scripts${path}`) });
    if (path.startsWith("/vehicle_panel/i18n/")) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ contentType: "text/html", body: pageHtml(s.theme) });
  });
  await page.goto(`${ORIGIN}/`);
  await page.addScriptTag({ url: "/vehicle_panel/vehicle-panel.js", type: "module" });
  await page.evaluate(
    async ({ s, devices, entities, states, settings, history, stats }) => {
      await customElements.whenDefined("vehicle-panel");
      const hass = {
        states,
        devices,
        entities,
        language: "en",
        locale: { language: "en" },
        user: { is_admin: true },
        themes: { darkMode: s.theme === "dark" },
        callWS: async (msg) =>
          msg.type === "vehicle_panel/settings"
            ? { settings }
            : msg.type === "history/history_during_period"
              ? history
              : msg.type === "recorder/statistics_during_period"
                ? stats
                : { ok: true, settings },
        callService: async () => {},
      };
      const el = document.createElement("vehicle-panel");
      el.panel = { url_path: "vehicles", config: { version: "test" } };
      el.route = { path: s.tab === "overview" ? "" : `/${s.tab}` };
      document.getElementById("root").appendChild(el);
      el.hass = hass;
    },
    { s, devices, entities, states, settings, history, stats },
  );
  // The pictures loaded and the history drawn
  await page.waitForTimeout(900);
  const box = await page.locator("#root").boundingBox();
  const png = await page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: WIDTH, height: Math.ceil(box.height) }, animations: "disabled" });
  const written = writeIfChanged(`${root}screenshots/${s.file}.png`, png);
  console.log(`screenshots/${s.file}.png${written ? "" : " (unchanged)"}`);
  await page.close();
}

await browser.close();
if (failed) process.exit(1);
