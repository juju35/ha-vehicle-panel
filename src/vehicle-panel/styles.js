// ── The panel's stylesheet ──
// The ha-* charter: a 90 px illustrated bar, pill tabs, rounded tiles with a soft shadow, big figures, buttons
// outlined or tinted (never filled), light and dark themes.
import { VP_ACCENT, VP_ERR, VP_OK, VP_WARN } from "./core.js";
import { VP_SCENE_STYLE } from "./scene.js";

export const VP_STYLE = `
  :host { display:block; min-height:100%; color:var(--primary-text-color);
          --vp-accent:${VP_ACCENT}; --vp-ok:${VP_OK}; --vp-warn:${VP_WARN}; --vp-err:${VP_ERR};
          --vp-card:var(--card-background-color, #fff); --vp-muted:var(--secondary-text-color, #5b6470);
          --vp-soft:color-mix(in srgb, var(--primary-text-color, #1f2328) 5%, var(--vp-card));
          --vp-shadow:0 1px 2px rgba(31,35,40,.05), 0 6px 18px color-mix(in srgb, var(--vp-accent) 9%, transparent);
          background:color-mix(in srgb, var(--vp-accent) 4%, var(--primary-background-color, #f3f6fc)); }
  * { box-sizing:border-box; }
  button { font:inherit; }
  ${VP_SCENE_STYLE}
  /* The top bar: the sky, the scene on the right, the road at the bottom, the title on the left */
  .banner { position:relative; height:90px; overflow:hidden; color:#0d2a45; container:vp-bar / inline-size;
            background:linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 40%, #c3e2f9 75%, #a9d5f4 100%); }
  .banner.night { color:#fff; background:linear-gradient(90deg, #1b2f52 0%, #15284a 40%, #0f1f3d 75%, #0a1830 100%); }
  .vp-bscene { position:absolute; right:0; bottom:10px; height:80px; width:min(600px, 70%); overflow:visible; }
  .htext { position:absolute; left:8px; top:0; bottom:10px; right:120px; display:flex; align-items:center; gap:12px; min-width:0; }
  .htext ha-menu-button { flex:none; color:inherit; }
  .hicon { width:46px; height:46px; border-radius:50%; flex:none; display:grid; place-items:center; color:var(--vp-st, var(--vp-accent));
           background:#fff; box-shadow:0 2px 8px color-mix(in srgb, var(--vp-accent) 20%, transparent); }
  .night .hicon { background:rgba(255,255,255,.14); box-shadow:inset 0 0 0 1px rgba(255,255,255,.2); }
  .hicon svg { width:24px; height:24px; }
  .tt { min-width:0; display:flex; flex-direction:column; gap:2px; }
  .trow { display:flex; align-items:center; gap:8px; min-width:0; }
  .htitle { font-size:21px; font-weight:800; letter-spacing:-.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .hsub { font-size:13px; color:#3b5b78; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .night .hsub { color:rgba(255,255,255,.78); }
  .pill { --c:#6b7a89; display:inline-flex; align-items:center; gap:5px; flex:none; padding:3px 10px; border-radius:999px; font-size:12px; font-weight:700;
          background:#fff; color:color-mix(in srgb, var(--c) 70%, #0d2a45); box-shadow:0 1px 4px rgba(31,35,40,.1); }
  .night .pill { background:color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color:color-mix(in srgb, var(--c) 35%, #fff); box-shadow:none; }
  .pill .dot { width:7px; height:7px; border-radius:50%; background:var(--c); }
  .pill.ok { --c:var(--vp-ok); } .pill.warn { --c:var(--vp-warn); } .pill.err { --c:var(--vp-err); }
  @container vp-bar (max-width: 520px) { .vp-bscene { display:none; } .htext { right:8px; } .hsub { display:none; } }
  /* Pill tabs under the bar */
  .tabs { display:flex; gap:6px; padding:10px 16px; overflow-x:auto; scrollbar-width:none; background:var(--vp-card);
          border-bottom:1px solid var(--divider-color, rgba(0,0,0,.08)); position:sticky; top:0; z-index:2; }
  .tab { border:0; border-radius:999px; padding:8px 14px; font-size:13.5px; cursor:pointer; white-space:nowrap; background:transparent; color:var(--vp-muted); }
  .tab:hover { color:var(--primary-text-color); }
  .tab.active { color:color-mix(in srgb, var(--vp-accent) 80%, var(--primary-text-color)); font-weight:700; background:color-mix(in srgb, var(--vp-accent) 12%, transparent); }
  .tab:focus-visible, .btn:focus-visible, input:focus-visible, select:focus-visible { outline:2px solid var(--vp-accent); outline-offset:1px; }
  main { max-width:1200px; margin:0 auto; padding:18px 16px 32px; display:flex; flex-direction:column; gap:16px; }
  .grid2 { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(0,1fr); gap:16px; align-items:start; }
  .col { display:flex; flex-direction:column; gap:16px; min-width:0; }
  .cards { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; }
  @media (max-width: 860px) { .grid2 { grid-template-columns:minmax(0,1fr); } }
  .c { background:var(--vp-card); border-radius:20px; padding:16px; box-shadow:var(--vp-shadow); min-width:0; display:flex; flex-direction:column; gap:12px; }
  .h { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; }
  .h b { font-size:15px; } .h span { font-size:12px; color:var(--vp-muted); }
  .h span.good { color:var(--vp-ok); } .h span.warn { color:var(--vp-warn); } .h span.err { color:var(--vp-err); }
  .t { background:var(--vp-soft); border-radius:12px; padding:9px 12px; font-size:13px; }
  .r { display:flex; justify-content:space-between; align-items:center; gap:10px; }
  .m { color:var(--vp-muted); } .s { font-size:12px; }
  .note { font-size:14px; color:var(--vp-muted); }
  .good { color:var(--vp-ok); } .warn { color:var(--vp-warn); } .err { color:var(--vp-err); }
  .big { font-size:34px; font-weight:800; letter-spacing:-.02em; line-height:1; }
  .mid { font-size:22px; font-weight:800; letter-spacing:-.02em; }
  .bar { height:8px; border-radius:4px; background:color-mix(in srgb, var(--primary-text-color) 9%, transparent); overflow:hidden; position:relative; }
  .bar > i { display:block; height:100%; border-radius:4px; background:var(--vp-accent); }
  .bar.thick { height:12px; border-radius:6px; } .bar.thick > i { border-radius:6px; }
  .bar .mark { position:absolute; top:-4px; bottom:-4px; width:2px; background:var(--primary-text-color); }
  .minis { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px; }
  .mini { background:var(--vp-soft); border-radius:12px; padding:8px 10px; font-size:12px; min-width:0; }
  .mini b { display:block; font-size:13.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  /* A vehicle tile: the roadside scene on top, then its name, status and figures */
  .veh { padding:10px 10px 16px; }
  .scene { position:relative; height:104px; border-radius:14px; overflow:hidden; background:linear-gradient(180deg, #dcebfa, #eaf3fc); }
  .scene.night { background:linear-gradient(180deg, #13284a, #1b3358); }
  .vp-tscene { position:absolute; right:0; bottom:0; height:100%; width:100%; }
  .vrow { display:flex; align-items:center; gap:10px; padding:0 6px; }
  .vrow .n { font-size:16px; font-weight:700; } .vrow .st { font-size:12.5px; font-weight:600; }
  .vrow .dot { width:10px; height:10px; border-radius:50%; margin-left:auto; flex:none; }
  .vbody { padding:0 6px; display:flex; flex-direction:column; gap:12px; }
  .acts { display:flex; flex-wrap:wrap; gap:8px; }
  .btn { border:1px solid var(--divider-color, rgba(0,0,0,.14)); border-radius:999px; background:transparent; color:var(--primary-text-color);
         padding:6px 14px; min-height:34px; font-size:12.5px; font-weight:600; cursor:pointer; }
  .btn:hover { background:var(--vp-soft); }
  .btn.accent { color:var(--vp-accent); border-color:color-mix(in srgb, var(--vp-accent) 40%, transparent); background:color-mix(in srgb, var(--vp-accent) 8%, transparent); }
  .btn.done { color:var(--vp-ok); border-color:color-mix(in srgb, var(--vp-ok) 40%, transparent); }
  /* Bars of a chart: the last one in the accent, a peak in amber */
  .chart { display:flex; align-items:flex-end; gap:8px; height:110px; }
  .chart > div { flex:1; border-radius:6px 6px 2px 2px; background:color-mix(in srgb, var(--vp-accent) 22%, var(--vp-card)); min-height:3px; }
  .chart > div.now { background:var(--vp-accent); } .chart > div.peak { background:var(--vp-warn); opacity:.85; } .chart > div.none { background:var(--vp-soft); }
  .axis { display:flex; gap:8px; font-size:11px; color:var(--vp-muted); } .axis > span { flex:1; text-align:center; }
  .tyres { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { text-align:left; font-size:11.5px; color:var(--vp-muted); font-weight:600; text-transform:uppercase; letter-spacing:.04em; padding:8px 10px; border-bottom:1px solid var(--divider-color, rgba(0,0,0,.1)); }
  td { padding:9px 10px; border-bottom:1px solid color-mix(in srgb, var(--primary-text-color) 6%, transparent); }
  tr.best td { background:color-mix(in srgb, var(--vp-ok) 9%, transparent); }
  /* Settings */
  .form { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:12px; }
  label.f { display:flex; flex-direction:column; gap:4px; font-size:12.5px; color:var(--vp-muted); }
  label.f input, label.f select { font:inherit; font-size:14px; color:var(--primary-text-color); background:var(--vp-soft); border:1px solid var(--divider-color, rgba(0,0,0,.12));
           border-radius:10px; padding:8px 10px; min-height:38px; }
  /* Chips of a tile, the plate, the pulsing dot of a car being driven */
  .chips { display:flex; flex-wrap:wrap; gap:6px; }
  .chip { --c:var(--vp-muted); display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600;
          color:color-mix(in srgb, var(--c) 85%, var(--primary-text-color)); background:color-mix(in srgb, var(--c) 11%, transparent); }
  .chip.ok { --c:var(--vp-ok); } .chip.warn { --c:var(--vp-warn); } .chip.err { --c:var(--vp-err); } .chip.info { --c:var(--vp-accent); }
  .pulse { width:8px; height:8px; border-radius:50%; background:var(--vp-ok); box-shadow:0 0 0 0 color-mix(in srgb, var(--vp-ok) 60%, transparent); animation:vp-pulse 1.6s infinite; }
  @keyframes vp-pulse { 70% { box-shadow:0 0 0 7px transparent; } 100% { box-shadow:0 0 0 0 transparent; } }
  @media (prefers-reduced-motion: reduce) { .pulse { animation:none; } }
  .vrow .n { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .plate { height:26px; width:auto; max-width:48%; flex:none; display:block; filter:drop-shadow(0 1px 1px rgba(0,0,0,.25)); }
  .minis.two { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .minis.six { grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); }
  .mini > span.m { display:block; } .mini b + span.m { font-size:11.5px; margin-top:2px; }
  .mini .good { color:var(--vp-ok); }
  /* Lists of lines: what to check, trips, refuels, stations, maintenance */
  .list { display:flex; flex-direction:column; gap:8px; }
  .item { --c:var(--vp-accent); display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:12px; background:var(--vp-soft); font-size:13px; min-width:0; }
  .item .dot { width:9px; height:9px; border-radius:50%; flex:none; background:var(--c); }
  .item .txt { flex:1; min-width:0; } .item .txt .sub { display:block; font-size:12px; color:var(--vp-muted); }
  .item.err { --c:var(--vp-err); background:color-mix(in srgb, var(--vp-err) 9%, var(--vp-card)); } .item.err .txt > b:first-child { color:var(--vp-err); }
  .item.warn { --c:var(--vp-warn); background:color-mix(in srgb, var(--vp-warn) 10%, var(--vp-card)); } .item.warn .txt > b:first-child { color:var(--vp-warn); }
  .item.good { --c:var(--vp-ok); } .item.good .txt > b:first-child { color:var(--vp-ok); }
  .item.best { background:color-mix(in srgb, var(--vp-ok) 10%, var(--vp-card)); }
  .item .btn { flex:none; }
  .cap { font-size:11.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--vp-muted); }
  .tag { --c:var(--vp-muted); padding:3px 10px; border-radius:999px; font-size:12px !important; font-weight:700; color:color-mix(in srgb, var(--c) 85%, var(--primary-text-color)) !important;
         background:color-mix(in srgb, var(--c) 13%, transparent); white-space:nowrap; }
  .tag.ok { --c:var(--vp-ok); } .tag.warn { --c:var(--vp-warn); } .tag.err { --c:var(--vp-err); }
  /* A segmented switch (vehicle, fuel, chart metric) and the charger's options */
  .seg, .opts { display:inline-flex; flex-wrap:wrap; gap:4px; align-items:center; }
  .seg button, .opts button { border:0; border-radius:999px; background:transparent; color:var(--vp-muted); padding:5px 12px; font-size:12.5px; font-weight:600; cursor:pointer; min-height:30px; }
  .seg button:hover, .opts button:hover { color:var(--primary-text-color); }
  .seg button.on, .opts button.on { color:color-mix(in srgb, var(--vp-accent) 80%, var(--primary-text-color)); background:color-mix(in srgb, var(--vp-accent) 12%, transparent); }
  main > .seg { align-self:flex-start; }
  .opts { background:var(--vp-soft); border-radius:999px; padding:2px; } .opts b { padding:0 8px; font-size:13px; }
  /* Stations: the brand's logo (or its initial), the 30-day line */
  .logo { width:32px; height:32px; border-radius:9px; flex:none; display:grid; place-items:center; object-fit:contain; background:#fff; color:var(--vp-accent);
          font-weight:800; box-shadow:inset 0 0 0 1px var(--divider-color, rgba(0,0,0,.1)); }
  .spark { width:90px; height:24px; flex:none; } .spark polyline { fill:none; stroke:var(--vp-muted); stroke-width:1.6; stroke-linejoin:round; }
  .spark.down polyline { stroke:var(--vp-ok); }
  .station .price { white-space:nowrap; }
  @media (max-width: 600px) { .spark { display:none; } }
  /* Tyres around a car seen from above */
  .tyremap { display:grid; grid-template-columns:minmax(0,1fr) 64px minmax(0,1fr); grid-template-rows:auto auto; gap:12px 14px; align-items:center; }
  .tyremap .topcar { grid-column:2; grid-row:1 / span 2; width:64px; height:128px; }
  .tyremap > :nth-child(1) { grid-column:1; grid-row:1; } .tyremap > :nth-child(3) { grid-column:3; grid-row:1; }
  .tyremap > :nth-child(4) { grid-column:1; grid-row:2; } .tyremap > :nth-child(5) { grid-column:3; grid-row:2; }
  .topcar rect { fill:color-mix(in srgb, var(--vp-accent) 12%, var(--vp-card)); stroke:color-mix(in srgb, var(--vp-accent) 45%, transparent); stroke-width:2; }
  .topcar rect.glass { fill:color-mix(in srgb, var(--vp-accent) 25%, var(--vp-card)); stroke:none; }
  .t.low { background:color-mix(in srgb, var(--vp-warn) 12%, var(--vp-card)); color:var(--vp-warn); }
  /* The mileage against the lease contract */
  .lchart { width:100%; height:180px; display:block; }
  .lchart polyline { fill:none; stroke-width:2.5; vector-effect:non-scaling-stroke; stroke-linejoin:round; }
  .lchart .drive { stroke:var(--vp-accent); } .lchart .allow { stroke:var(--vp-muted); stroke-dasharray:6 5; opacity:.7; } .lchart .proj { stroke:var(--vp-warn); stroke-dasharray:4 4; }
  .legend { display:flex; gap:14px; flex-wrap:wrap; font-size:12px; color:var(--vp-muted); }
  .legend span { display:inline-flex; align-items:center; gap:5px; } .legend i { width:9px; height:9px; border-radius:50%; }
  .legend i.drive { background:var(--vp-accent); } .legend i.allow { background:var(--vp-muted); } .legend i.proj { background:var(--vp-warn); }
  .vp-map { border-radius:14px; overflow:hidden; min-height:240px; }
  /* The dialog asked before an action */
  .scrim { position:fixed; inset:0; background:rgba(10,18,30,.42); z-index:10; }
  .dialog { position:fixed; z-index:11; left:50%; top:50%; transform:translate(-50%,-50%); width:min(420px, calc(100vw - 32px)); background:var(--vp-card);
            border-radius:20px; padding:18px; box-shadow:0 18px 50px rgba(0,0,0,.28); display:flex; flex-direction:column; gap:12px; }
  .dialog .form { grid-template-columns:repeat(2, minmax(0,1fr)); }
  .acts.end { justify-content:flex-end; }
  .btn.err { color:var(--vp-err); border-color:color-mix(in srgb, var(--vp-err) 40%, transparent); }
  a.btn { display:inline-flex; align-items:center; text-decoration:none; }
  label.f input[type="number"] { width:100%; }
`;
