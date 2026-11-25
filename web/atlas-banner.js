/* Decorative banner controls; independent of Planner and storage. */
(function(){
'use strict';
const banner=document.getElementById('atlasBanner'),button=document.getElementById('atlasMotion');
if(!banner||!button)return;
button.addEventListener('click',function(){const paused=banner.dataset.paused!=='true';banner.dataset.paused=String(paused);button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Animatie hervatten':'Animatie pauzeren';});
})();
