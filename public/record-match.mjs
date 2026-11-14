import {playerAvatar} from './avatars.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const changeOpponentButton=()=>'<button type="button" class="record-replace" data-action="changeOpponent" aria-label="Change opponent" title="Change opponent"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/></svg></button>';
const at=value=>+(value?.toDate?.()||new Date(value||0));

export function suggestedOpponents(members,tickets,uid,{favorites=[],now=Date.now()}={}){
  const rows=members.filter(m=>m.id!==uid).map(m=>({...m,frequency:0,lastPlayed:0,favorite:favorites.includes(m.id)})),byId=new Map(rows.map(m=>[m.id,m]));
  for(const t of tickets){
    if(t.status!=='finalized'||![t.playerA,t.playerB].includes(uid))continue;
    const row=byId.get(t.playerA===uid?t.playerB:t.playerA),time=at(t.createdAt);if(!row||!time||time>now)continue;
    row.lastPlayed=Math.max(row.lastPlayed,time);if(time>=now-30*86400000)row.frequency++;
  }
  const recent=rows.filter(m=>m.lastPlayed).sort((a,b)=>b.lastPlayed-a.lastPlayed||a.id.localeCompare(b.id))[0]?.id;
  return rows.sort((a,b)=>Number(b.id===recent)-Number(a.id===recent)||b.frequency-a.frequency||Number(b.favorite)-Number(a.favorite)||b.lastPlayed-a.lastPlayed||String(a.displayName).localeCompare(String(b.displayName))||a.id.localeCompare(b.id));
}

export function standardGameScore(losingScore,winner='self'){
  if(losingScore===''||losingScore==null||!Number.isInteger(Number(losingScore))||Number(losingScore)<0||Number(losingScore)>198)throw new Error('Choose the losing score.');
  if(!['self','opponent'].includes(winner))throw new Error('Choose who won.');
  const losing=Number(losingScore),winning=losing<10?11:losing+2;
  return winner==='self'?{a:winning,b:losing}:{a:losing,b:winning};
}

export function renderMatchComposer({opponents,profile={},draft={},online=true}){
  if(!opponents.length)return '<div class="record-empty"><h2>Find your first opponent.</h2><p>Invite a coworker to your group to start playing.</p><button class="btn" data-action="accountInvite">Invite a friend</button></div>';
  const selected=opponents.find(m=>m.id===draft.opponentUid),full=draft.scoreMode==='full',winner=draft.winner||'self';
  let score;try{score=standardGameScore(draft.losingScore,winner);}catch{}
  return `<form id="newMatchForm" class="record-composer">
    ${selected?`<input type="hidden" name="opponentUid" value="${esc(selected.id)}"/>`:`<header class="record-heading"><h2>Who did you play?</h2></header>${opponents.length>7?`<label class="record-search"><span class="character-sr-only">Search group players</span><input class="input" type="search" name="opponentQuery" value="${esc(draft.opponentQuery||'')}" placeholder="Find a player" autocomplete="off" data-opponent-search/></label>`:''}<div class="record-opponents" aria-label="Group players">${opponents.map((m,i)=>`<div class="record-opponent-row" data-opponent-row data-name="${esc(m.displayName)}"><button type="button" class="record-opponent" data-action="chooseOpponent" data-id="${esc(m.id)}">${playerAvatar(m.avatarId)}<span><strong>${esc(m.displayName)}</strong><small>${i===0&&m.lastPlayed?'Last played':m.favorite?'Favorite':m.frequency?`${m.frequency} games this month`:''}</small></span></button><button type="button" class="record-favorite ${m.favorite?'is-favorite':''}" data-action="favoriteOpponent" data-id="${esc(m.id)}" aria-label="${m.favorite?'Remove favorite':'Favorite'} ${esc(m.displayName)}" aria-pressed="${m.favorite}">☆</button></div>`).join('')}</div><p class="record-no-results" hidden>No players found.</p>`}
    ${selected?`<input type="hidden" name="scoreMode" value="${full?'full':'standard'}"/>
    ${full?`<div class="record-full-scores"><label><span>You</span><input class="input score-input" type="number" inputmode="numeric" name="scoreSelf" aria-label="Your score" min="0" max="200" step="1" required value="${esc(draft.scoreSelf??score?.a??'')}"/></label><span>–</span><div class="record-full-opponent"><div class="record-full-name"><label for="fullOpponentScore" title="${esc(selected.displayName)}">${esc(selected.displayName)}</label>${changeOpponentButton()}</div><input id="fullOpponentScore" class="input score-input" type="number" inputmode="numeric" name="scoreOpponent" aria-label="Opponent score" min="0" max="200" step="1" required value="${esc(draft.scoreOpponent??score?.b??'')}"/></div></div><div class="record-format"><span>${full?'Custom game':'Singles · First to 11'}</span><button type="button" data-action="scoreMode" data-value="${full?'standard':'full'}">${full?'Quick score':'Full score'} <span aria-hidden="true">↗</span></button></div>`:`<fieldset class="record-winner"><legend>Who won?</legend><div class="record-winner-options">${[['self',profile.displayName||'You',profile.avatarId],['opponent',selected.displayName,selected.avatarId]].map(([id,name,avatar])=>`<div class="record-winner-option ${id==='opponent'?'has-replace':''}"><label><input type="radio" name="winner" value="${id}" aria-label="${esc(name)} won" ${id===winner?'checked':''}/><span>${playerAvatar(avatar)}<strong title="${esc(name)}">${id==='self'?'You':esc(name)}</strong><i aria-hidden="true">✓</i></span></label>${id==='opponent'?changeOpponentButton():''}</div>`).join('')}</div></fieldset><div class="record-format"><span>${full?'Custom game':'Singles · First to 11'}</span><button type="button" data-action="scoreMode" data-value="${full?'standard':'full'}">${full?'Quick score':'Full score'} <span aria-hidden="true">↗</span></button></div><div class="record-losing"><span id="losingLabel">Losing score</span><div class="score-drum" role="spinbutton" tabindex="0" aria-labelledby="losingLabel" aria-valuemin="0" aria-valuemax="198" ${draft.losingScore!=null?`aria-valuenow="${esc(draft.losingScore)}"`:''} aria-valuetext="${draft.losingScore!=null?esc(draft.losingScore):'Choose a score'}" data-score-drum><div class="score-drum-band" aria-hidden="true"></div><div class="score-drum-scroll" aria-hidden="true">${Array.from({length:597},(_,i)=>`<div data-drum-index="${i}">${i%199}</div>`).join('')}</div></div><input type="hidden" name="losingScore" value="${esc(draft.losingScore??'')}"/><small data-score-hint>${score?'Swipe to change':'Swipe or tap a score'}</small></div><p class="record-score-preview" aria-live="polite" data-score-preview>${score?`${score.a} <span>–</span> ${score.b}`:'<span>Choose the losing score</span>'}</p>`}
    <details class="match-note"><summary>Add a note</summary><textarea class="input" aria-label="Match note" name="note" maxlength="280" rows="2">${esc(draft.note||'')}</textarea></details><button class="btn record-send" type="submit" ${!full&&!score?'disabled':''}>Send for confirmation</button><p class="record-footnote">${online?'Your opponent confirms before points count.':'Saved on this device. Sends when you reconnect.'}</p>`:''}
  </form>`;
}

export function mountMatchComposer(root,onChange){
  const form=root.querySelector?.('#newMatchForm');if(!form)return;
  const search=form.querySelector('[data-opponent-search]');
  const filterPlayers=()=>{let visible=0;form.querySelectorAll('[data-opponent-row]').forEach(row=>{row.hidden=!row.dataset.name.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase());if(!row.hidden)visible++;});form.querySelector('.record-no-results').hidden=!!visible;};
  if(search){search.addEventListener('input',filterPlayers);if(search.value)filterPlayers();}
  const drum=form.querySelector('[data-score-drum]');if(!drum)return;
  const scroller=drum.querySelector('.score-drum-scroll'),input=form.elements.losingScore,rows=[...scroller.children],size=48;
  let active=Number(input.value||0),interacting=false,timer,painted=[];
  function paint(index){painted.forEach(i=>{rows[i]?.removeAttribute('style');});painted=[];for(let d=-4;d<=4;d++){const i=index+d;if(rows[i]){rows[i].style.cssText=`transform:rotateY(${Math.max(-65,Math.min(65,d*20))}deg) scale(${Math.max(.45,1-Math.abs(d)*.13)});opacity:${Math.max(.05,1-Math.abs(d)*.27)};color:${d?'#9c8cb4':'#4026b4'};font-weight:${d?500:800}`;painted.push(i);}}}
  function commit(value){active=(value+199)%199;input.value=String(active);drum.setAttribute('aria-valuenow',String(active));drum.setAttribute('aria-valuetext',String(active));onChange(active);syncMatchScore(form);}
  function scrollToValue(value){scroller.scrollLeft=(199+value)*size;paint(199+value);}
  scrollToValue(active);
  drum.addEventListener('pointerdown',()=>interacting=true);
  scroller.addEventListener('wheel',event=>{event.preventDefault();interacting=true;scroller.scrollLeft+=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;},{passive:false});
  scroller.addEventListener('scroll',()=>{const i=Math.round(scroller.scrollLeft/size);paint(i);if(!interacting)return;clearTimeout(timer);timer=setTimeout(()=>{if(!form.isConnected)return;commit(i%199);if(i<199||i>=398)scrollToValue(active);},90);},{passive:true});
  scroller.addEventListener('click',e=>{const row=e.target.closest('[data-drum-index]');if(row){interacting=true;commit(Number(row.dataset.drumIndex)%199);scrollToValue(active);}});
  drum.addEventListener('keydown',e=>{const steps={ArrowLeft:-1,ArrowRight:1,ArrowUp:1,ArrowDown:-1,PageUp:-10,PageDown:10};if(e.key in steps||['Home','End','Enter',' '].includes(e.key)){e.preventDefault();interacting=true;commit(e.key==='Home'?0:e.key==='End'?198:active+(steps[e.key]||0));scrollToValue(active);}});
  form.addEventListener('change',()=>syncMatchScore(form));
}
export function syncMatchScore(form){
  if(!form.querySelector('[data-score-preview]'))return;
  try{const score=standardGameScore(form.elements.losingScore.value,form.elements.winner.value);form.querySelector('[data-score-preview]').innerHTML=`${score.a} <span>–</span> ${score.b}`;form.querySelector('[data-score-hint]').textContent='Swipe to change';form.querySelector('[type="submit"]').disabled=false;}catch{}
}

export function bindQuickOpponents(document,{getOpponents,onChoose}){
  let gesture=null,tray=null,shade=null,anchor=null,items=[],highlight=-1,suppressUntil=0;
  function highlightAt(index){highlight=index;tray?.querySelectorAll('[data-quick-index]').forEach((button,i)=>button.classList.toggle('is-highlighted',i===index));if(tray)tray.querySelector('[role="status"]').textContent=index>=0?items[index].displayName:'';}
  function close(){tray?.remove();tray=null;shade?.remove();shade=null;anchor?.classList.remove('is-quick-open');anchor=null;if(gesture){clearTimeout(gesture.timer);gesture.button.classList.remove('is-quick-open');if(gesture.button.hasPointerCapture?.(gesture.id))gesture.button.releasePointerCapture(gesture.id);}gesture=null;highlight=-1;}
  function open(button){anchor=button;items=getOpponents().slice(0,5);if(!items.length)return false;tray=document.createElement('div');tray.className='quick-opponents';tray.setAttribute('role','dialog');tray.setAttribute('aria-label','Recent opponents');tray.setAttribute('style','--quick-count:'+items.length);shade=document.createElement('div');shade.className='quick-opponent-shade';shade.setAttribute('aria-hidden','true');tray.innerHTML=`<div role="status" aria-live="polite"></div><div class="quick-opponent-tray">${items.map((m,i)=>`<button type="button" data-quick-index="${i}" aria-label="Record match with ${esc(m.displayName)}" style="--quick-order:${i}">${playerAvatar(m.avatarId)}<span>${esc(m.displayName)}</span></button>`).join('')}</div>`;document.body.append(shade,tray);button.classList.add('is-quick-open');tray.addEventListener('click',e=>{const b=e.target.closest('[data-quick-index]');if(b){const id=items[Number(b.dataset.quickIndex)].id;close();onChoose(id);}});return true;}
  document.addEventListener('pointerdown',e=>{const button=e.target.closest?.('.leaderboard-fab');if(!button||e.button!==0||e.isPrimary===false)return;if(tray)close();gesture={button,id:e.pointerId,x:e.clientX,y:e.clientY,opened:false};gesture.timer=setTimeout(()=>{if(!gesture)return;gesture.opened=open(button);if(gesture.opened){button.setPointerCapture?.(e.pointerId);}},280);});
  document.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;if(!gesture.opened){if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>12)close();return;}e.preventDefault();let selected=-1;tray.querySelectorAll('[data-quick-index]').forEach((b,i)=>{const r=b.getBoundingClientRect();if(e.clientX>=r.left-6&&e.clientX<=r.right+6&&e.clientY>=r.top-14&&e.clientY<=r.bottom+14)selected=i;});highlightAt(selected);},{passive:false});
  document.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;const opened=gesture.opened,id=highlight>=0?items[highlight].id:null;if(opened)suppressUntil=Date.now()+500;close();if(opened&&id)onChoose(id);});
  document.addEventListener('pointercancel',()=>{if(gesture?.opened)suppressUntil=Date.now()+500;close();});
  document.addEventListener('click',e=>{if(e.target.closest?.('.leaderboard-fab')&&Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}else if(tray&&!e.target.closest?.('.quick-opponents')&&!e.target.closest?.('.leaderboard-fab'))close();},true);
  document.addEventListener('contextmenu',e=>{if(e.target.closest?.('.leaderboard-fab'))e.preventDefault();});
  document.addEventListener('keydown',e=>{const button=e.target.closest?.('.leaderboard-fab');if(button&&e.shiftKey&&e.key==='Enter'){e.preventDefault();close();open(button);highlightAt(0);}else if(tray){if(e.key==='Escape'){e.preventDefault();close();}else if(['ArrowLeft','ArrowRight','Enter'].includes(e.key)){e.preventDefault();if(e.key==='Enter'&&highlight>=0){const id=items[highlight].id;close();onChoose(id);}else highlightAt((highlight+(e.key==='ArrowLeft'?-1:1)+items.length)%items.length);}}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')close();});
  return close;
}
