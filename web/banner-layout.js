/* Presentation only: retain the live pause button and its event handler. */
(()=>{
'use strict';
const banner=document.getElementById('atlasBanner');if(!banner)return;
const art=banner.querySelector('.atlas-banner-art'),row=banner.querySelector('.header-information-row'),motion=banner.querySelector('.atlas-motion');
if(!art||!row)return;
if(motion)row.prepend(motion);
banner.classList.add('dag-wide-banner');
const style=document.createElement('style');style.textContent=`
html body>header .atlas-banner.dag-wide-banner{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px 28px;padding:28px 34px;overflow:visible}
html body>header .dag-wide-banner .atlas-banner-copy{grid-column:1;grid-row:1}
html body>header .dag-wide-banner .header-information-actions{grid-column:2;grid-row:1;max-width:none;width:auto;margin:0;align-items:flex-end}
html body>header .dag-wide-banner .header-information-row{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:9px;width:auto}
html body>header .dag-wide-banner .atlas-banner-art{grid-column:1/-1;grid-row:2;display:flex;align-items:center;justify-content:center;width:100%;min-width:0;flex-basis:auto;margin:-14px 0 -22px}
html body>header .dag-wide-banner .dag-banner-scene{display:block;width:min(100%,1000px);max-width:100%;height:auto;max-height:440px}
html body>header .dag-wide-banner .header-information-row :is(.atlas-motion,#dagLogout),html body>header .dag-wide-banner .header-information>summary{box-sizing:border-box;min-height:38px;padding:8px 12px;border:1px solid #e4dcd0;border-radius:11px;background:#fffdf9;color:#303540;font-family:inherit;font-size:12px;font-weight:500;line-height:20px;white-space:nowrap;cursor:pointer;box-shadow:0 3px 9px rgba(29,46,38,.08)}
html body>header .dag-wide-banner .header-information-row :is(.atlas-motion,#dagLogout):hover,html body>header .dag-wide-banner .header-information>summary:hover{background:#f5f2ec}
html body>header .dag-wide-banner .header-information-row :is(.atlas-motion,#dagLogout):focus-visible,html body>header .dag-wide-banner .header-information>summary:focus-visible{outline:3px solid #f5a23e;outline-offset:3px}
html:not(.dag-authenticated) body>header .dag-wide-banner .header-information{position:relative;width:auto}
html:not(.dag-authenticated) body>header .dag-wide-banner .header-information[open] .header-information-content{position:absolute;top:calc(100% + 9px);right:0;left:auto;width:min(460px,calc(100vw - 40px));max-width:calc(100vw - 40px);max-height:75vh;overflow:auto;margin:0;padding:24px}
html:not(.dag-authenticated) body>header .atlas-banner.dag-wide-banner:has(.header-information[open]){background:radial-gradient(ellipse at 100% 100%,rgba(211,119,44,.46),transparent 63%),linear-gradient(115deg,#203532,#3c5550);border:1px solid rgba(255,255,255,.45);box-shadow:0 12px 30px rgba(29,46,38,.13);isolation:isolate}
html:not(.dag-authenticated) body>header .dag-wide-banner:has(.header-information[open]):after{display:none}
@media(max-width:800px){html body>header .atlas-banner.dag-wide-banner{grid-template-columns:1fr;padding:24px;gap:18px}html body>header .dag-wide-banner .header-information-actions{grid-column:1;grid-row:3;align-items:flex-start;width:100%}html body>header .dag-wide-banner .header-information-row{justify-content:flex-start;width:100%}html body>header .dag-wide-banner .atlas-banner-art{margin:-8px 0 -12px}html body>header .dag-wide-banner .dag-banner-scene{width:100%;max-height:none}html:not(.dag-authenticated) body>header .dag-wide-banner .header-information[open] .header-information-content{left:0;right:auto}}
@media(prefers-reduced-motion:reduce){html body>header .dag-wide-banner .atlas-motion{display:none}}
@media print{html body>header .atlas-banner.dag-wide-banner{display:none}}
`;document.head.append(style);
})();
