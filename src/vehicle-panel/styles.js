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
  .h { display:flex; justify-content:space-between; align-items:center; gap:10px; }
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
`;
