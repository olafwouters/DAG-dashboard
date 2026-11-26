/* Presentation only: centre the logged-out login card, keep banner controls in place and keep the card open while logged out. Sign-in logic untouched. */
(()=>{
'use strict';
const style=document.createElement('style');
style.textContent=`
html:not(.dag-authenticated) body>header .atlas-banner .header-information[open] .header-information-content{position:fixed!important;top:50%!important;left:50%!important;right:auto!important;transform:translate(-50%,-50%)!important;width:min(460px,calc(100vw - 32px))!important;max-width:calc(100vw - 32px)!important;max-height:calc(100vh - 48px)!important;margin:0!important;box-sizing:border-box;z-index:1000;background:#fffdf9;border:1px solid #e4dcd0;border-radius:22px;box-shadow:0 24px 60px rgba(30,46,40,.28);padding:28px!important;overflow:auto}
html:not(.dag-authenticated) body>header .atlas-banner .header-information-content .dag-sync-panel{text-align:center}
html:not(.dag-authenticated) body>header .atlas-banner .header-information-content #dagLogin{display:flex!important;flex-direction:column;align-items:stretch;gap:14px;text-align:left}
html:not(.dag-authenticated) body>header .atlas-banner .header-information-content #dagLogin label{width:100%}
html:not(.dag-authenticated) body>header .atlas-banner .header-information-content #dagLogin input{box-sizing:border-box;width:100%}
html:not(.dag-authenticated) body>header .atlas-banner .header-information-content #dagLogin button{align-self:center}
html:not(.dag-authenticated) body>header .dag-mockup-banner .header-information-actions{width:100%;margin:0;align-items:flex-end}
html:not(.dag-authenticated) body>header .dag-mockup-banner .header-information-row{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;width:auto}
html:not(.dag-authenticated) body>header .dag-mockup-banner .header-information>summary{width:auto;margin-left:0}
html body>header .dag-mockup-banner #dagStatus{text-align:right;max-width:100%}
@media(min-width:1001px){html body>header .atlas-banner.dag-mockup-banner{grid-template-rows:minmax(48px,auto) minmax(0,1fr)}html:not(.dag-authenticated) body>header .dag-mockup-banner .header-information-actions{grid-column:2;grid-row:1}}
@media(max-width:1000px) and (min-width:601px){html body>header .atlas-banner.dag-mockup-banner{grid-template-rows:minmax(58px,auto) minmax(0,1fr)}}
`;
document.head.append(style);
const menu=document.querySelector('.header-information');
if(!menu)return;
const summary=menu.querySelector(':scope>summary');
const loggedOut=()=>!document.documentElement.classList.contains('dag-authenticated');
let closedOnPurpose=false;
if(summary)summary.addEventListener('click',()=>{closedOnPurpose=menu.open;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open)closedOnPurpose=true;},true);
menu.addEventListener('toggle',()=>{if(menu.open){closedOnPurpose=false;return;}if(loggedOut()&&!closedOnPurpose)menu.open=true;});
})();
