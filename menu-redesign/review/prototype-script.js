
const panel=document.getElementById('panel'),body=document.getElementById('panelBody');
const state={music:true,sound:true,name:'ContemplativeEnhanced…'};
try{Object.assign(state,JSON.parse(localStorage.getItem('ootg-menu-preview')||'{}'))}catch{}
const labels={battle:'Battle',spells:'Spells',cards:'Cards',leaderboard:'The Crypt of Knights'};
function persist(){try{localStorage.setItem('ootg-menu-preview',JSON.stringify(state))}catch{}}
function sync(){document.getElementById('profileName').textContent=state.name;for(const k of ['music','sound']){document.getElementById(k+'Label').textContent=k.toUpperCase()+' '+(state[k]?'ON':'OFF');document.getElementById(k+'Toggle').setAttribute('aria-pressed',String(state[k]));const b=document.getElementById(k+'Setting');if(b){b.textContent=state[k]?'On':'Off';b.setAttribute('aria-pressed',String(state[k]))}}}
function notify(s){const e=document.getElementById('status');e.textContent=s;e.style.display='block';clearTimeout(window.noticeTimer);window.noticeTimer=setTimeout(()=>e.style.display='none',1800)}
function toggle(k){state[k]=!state[k];persist();sync();notify(k[0].toUpperCase()+k.slice(1)+(state[k]?' on':' off'))}
document.getElementById('musicToggle').onclick=()=>toggle('music');document.getElementById('soundToggle').onclick=()=>toggle('sound');
document.querySelector('.close').onclick=()=>panel.close();panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)panel.close()}});
document.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>{
 const action=button.dataset.action;
 if(action==='profile'){
  body.innerHTML='<h2>Your knight</h2><p>Edit your display name.</p><form id="profileForm"><label for="displayName">Player name</label><input id="displayName" maxlength="28" required autocomplete="off"><button class="action" type="submit">Save name</button></form>';
  document.getElementById('displayName').value=state.name;
  document.getElementById('profileForm').onsubmit=e=>{e.preventDefault();state.name=document.getElementById('displayName').value.trim()||'Knight';persist();sync();panel.close();notify('Player name updated')};
 }else if(action==='settings'){
  body.innerHTML='<h2>Settings</h2><p>Menu preview controls</p><div class="setting-row"><span>Music</span><button class="action" id="musicSetting"></button></div><div class="setting-row"><span>Sound effects</span><button class="action" id="soundSetting"></button></div><p class="preview-note">These controls demonstrate the proposed interaction. No game audio is included in this prototype.</p>';
  document.getElementById('musicSetting').onclick=()=>toggle('music');document.getElementById('soundSetting').onclick=()=>toggle('sound');sync();
 }else{
  body.innerHTML='<h2>'+labels[action]+'</h2><p class="preview-note">Destination preview using your supplied game capture.</p><img src="assets/preview-'+action+'.png" alt="Existing '+labels[action]+' screen"><button class="action" id="backToMenu">Back to menu</button>';
  document.getElementById('backToMenu').onclick=()=>panel.close();
 }
 panel.showModal();
});sync();
