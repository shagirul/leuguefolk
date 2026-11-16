import {CHARACTERS} from './characters.mjs';
export const AVATARS=CHARACTERS;
export const DEFAULT_AVATAR_ID=AVATARS[0].id;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const validAvatar=id=>AVATARS.some(a=>a.id===id);
export const avatarFor=id=>AVATARS.find(a=>a.id===id)||AVATARS[0];
export const randomAvatar=()=>AVATARS[Math.floor(Math.random()*AVATARS.length)];
export function adjacentAvatar(id,step){
  const index=AVATARS.indexOf(avatarFor(id));
  return AVATARS[(index+step%AVATARS.length+AVATARS.length)%AVATARS.length];
}
export function characterArt(id){
  const a=avatarFor(id);
  return `<img class="character-art" src="${a.src}" width="512" height="512" alt="" decoding="async" draggable="false"/>`;
}
function characterFigure(id){
  const {artScale}=avatarFor(id),style=`--figure-width:${(artScale*100).toFixed(2)}%;--figure-left:${((1-artScale)*50).toFixed(2)}%;--figure-bottom:0%`;
  return `<span class="character-figure" style="${style}" aria-hidden="true">${characterArt(id)}</span><span class="character-head" style="${style}" aria-hidden="true">${characterArt(id)}</span>`;
}
export function characterCard(id){
  const avatar=avatarFor(id);
  return `<span class="character-card" role="img" aria-label="${esc(avatar.name)} avatar"><span class="character-tile" aria-hidden="true"></span>${characterFigure(avatar.id)}</span>`;
}
// Picker tiles stay square; compact player avatars default to circles.
export function playerAvatar(id,extra='',shape='circle'){
  const a=avatarFor(id);
  return `<span class="avatar character-avatar is-${shape==='square'?'square':'circle'} ${extra}" role="img" aria-label="${esc(a.name)} avatar">${characterArt(a.id)}</span>`;
}
export function profileAvatar(uid,avatarId,name='Player',art=false){
  return `<button type="button" class="player-profile-link" data-action="openPlayer" data-id="${esc(uid)}" aria-label="View ${esc(name)}’s profile">${art?characterCard(avatarId):playerAvatar(avatarId)}</button>`;
}
function arcPosition(index,selected){
  const count=AVATARS.length,offset=(index-selected+count+count/2)%count-count/2;
  const distance=Math.abs(offset);
  return {visible:distance<=2.5,style:`--arc-orbit:${offset*22}deg;--arc-angle:${offset*18}deg;--arc-scale:${Math.max(.55,1-distance*.14)};--arc-opacity:${Math.max(.2,1-distance*.3)};z-index:${count-Math.round(distance)}`};
}
function paintAvatarArc(picker,selected){
  picker.querySelectorAll('.character-option').forEach((option,i)=>{
    const position=arcPosition(i,selected);
    option.style.cssText=position.style;option.dataset.visible=String(position.visible);
  });
}
export function avatarPicker(id){
  const selected=avatarFor(id),index=AVATARS.indexOf(selected);
  return `<fieldset class="character-picker" data-selected="${selected.id}" aria-label="Choose avatar"><div class="character-arc" role="radiogroup" aria-label="Characters" aria-describedby="characterDescription">${AVATARS.map((a,i)=>{const position=arcPosition(i,index);return `<label class="character-option" title="${esc(a.name)}" data-visible="${position.visible}" style="${position.style}"><input type="radio" name="avatarId" value="${a.id}" aria-label="${esc(a.name)}" ${a.id===selected.id?'checked':''} aria-posinset="${i+1}" aria-setsize="${AVATARS.length}" required/><span class="character-tile" aria-hidden="true"></span>${characterFigure(a.id)}<span class="character-check" aria-hidden="true">✓</span></label>`;}).join('')}</div><div class="character-navigation"><button type="button" class="character-arrow" data-action="avatarPrevious" aria-label="Previous character">‹</button><div class="character-caption" aria-hidden="true"><strong data-character-name>${esc(selected.name)}</strong><span data-character-count>${String(index+1).padStart(2,'0')} / ${AVATARS.length}</span></div><button type="button" class="character-arrow" data-action="avatarNext" aria-label="Next character">›</button></div><p id="characterDescription" class="character-description" data-character-description>“${esc(selected.description)}”</p><p class="character-direction-hint">Swipe to explore</p><span class="character-sr-only" data-character-announcement role="status" aria-live="polite" aria-atomic="true"></span></fieldset>`;
}
export function updateAvatarPicker(picker,id,{focus=false}={}){
  if(!picker)return;
  const avatar=avatarFor(id),index=AVATARS.indexOf(avatar);
  picker.dataset.selected=avatar.id;
  paintAvatarArc(picker,index);
  picker.querySelectorAll('.character-option').forEach(option=>{
    const radio=option.querySelector('input');
    radio.checked=radio.value===avatar.id;
  });
  if(focus)picker.querySelector('input:checked')?.focus({preventScroll:true});
  picker.querySelector('[data-character-name]').textContent=avatar.name;
  picker.querySelector('[data-character-count]').textContent=`${String(index+1).padStart(2,'0')} / ${AVATARS.length}`;
  picker.querySelector('[data-character-description]').textContent=`“${avatar.description}”`;
  picker.querySelector('[data-character-announcement]').textContent=`${avatar.name}. ${avatar.description} ${index+1} of ${AVATARS.length}`;
}
export function stepAvatarPicker(picker,step,options){
  const avatar=adjacentAvatar(picker.dataset.selected,step);
  updateAvatarPicker(picker,avatar.id,options);return avatar.id;
}
// Delegated gestures survive app renders and never replace the username input.
export function bindAvatarGestures(target,onSelect){
  let drag=null,suppressClick=null,lastWheel=0;
  const disabled=picker=>picker.disabled||picker.closest('form')?.querySelector('[type="submit"]')?.disabled;
  function commit(picker,id,focus=false){updateAvatarPicker(picker,id,{focus});onSelect(id);}
  function clearDrag(settle=true){
    if(!drag)return;
    const previous=drag;drag=null;
    previous.picker.classList.remove('is-dragging');
    // Enable the settling transition at the current angle before changing its target.
    previous.picker.getBoundingClientRect();
    if(settle)paintAvatarArc(previous.picker,AVATARS.indexOf(avatarFor(previous.picker.dataset.selected)));
    if(previous.stage.hasPointerCapture?.(previous.pointerId))previous.stage.releasePointerCapture(previous.pointerId);
  }
  target.addEventListener('keydown',event=>{
    const picker=event.target.closest?.('.character-picker');
    if(!picker||disabled(picker)||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const avatar=event.key==='Home'?AVATARS[0]:event.key==='End'?AVATARS.at(-1):adjacentAvatar(picker.dataset.selected,event.key==='ArrowRight'?1:-1);
    commit(picker,avatar.id,true);
  });
  target.addEventListener('pointerdown',event=>{
    const stage=event.target.closest?.('.character-arc'),picker=stage?.closest('.character-picker');
    if(!picker||disabled(picker)||event.button!==0||event.isPrimary===false)return;
    clearDrag();drag={stage,picker,pointerId:event.pointerId,x:event.clientX,y:event.clientY,dx:0,started:Date.now(),moved:false,index:AVATARS.indexOf(avatarFor(picker.dataset.selected)),stepWidth:Math.max(123,Math.min(202,stage.getBoundingClientRect().width*.4))};
  });
  target.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.moved){
      if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){clearDrag();return;}
      if(Math.abs(dx)<8)return;
      drag.moved=true;drag.picker.classList.add('is-dragging');drag.stage.setPointerCapture?.(event.pointerId);
    }
    event.preventDefault();drag.dx=dx;
    paintAvatarArc(drag.picker,drag.index-Math.max(-1,Math.min(1,dx/drag.stepWidth)));
  },{passive:false});
  target.addEventListener('pointerup',event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    const {picker,dx,started,moved}=drag;
    clearDrag(false);if(!moved)return;
    suppressClick={picker,time:Date.now()};
    if(Math.abs(dx)>30||(Math.abs(dx)>12&&Math.abs(dx)/(Date.now()-started+1)>.45))commit(picker,adjacentAvatar(picker.dataset.selected,dx<0?1:-1).id);
    else paintAvatarArc(picker,AVATARS.indexOf(avatarFor(picker.dataset.selected)));
  });
  target.addEventListener('pointercancel',event=>{if(drag?.pointerId===event.pointerId)clearDrag();});
  // Touch initially captures the card. Transferring that capture to the stage
  // emits a bubbling loss from the card; only losing the stage cancels our drag.
  target.addEventListener('lostpointercapture',event=>{if(drag?.pointerId===event.pointerId&&event.target===drag.stage)clearDrag();});
  target.addEventListener('click',event=>{
    if(!suppressClick)return;
    const suppress=suppressClick;suppressClick=null;
    if(event.detail!==0&&Date.now()-suppress.time<250&&event.target.closest?.('.character-picker')===suppress.picker){event.preventDefault();event.stopPropagation();}
  },true);
  target.addEventListener('wheel',event=>{
    const picker=event.target.closest?.('.character-arc')?.closest('.character-picker');
    const delta=event.shiftKey?event.deltaY:event.deltaX;
    if(!picker||disabled(picker)||Math.abs(delta)<3||(!event.shiftKey&&Math.abs(event.deltaY)>=Math.abs(delta)))return;
    event.preventDefault();if(Date.now()-lastWheel<220)return;lastWheel=Date.now();
    commit(picker,adjacentAvatar(picker.dataset.selected,delta>0?1:-1).id);
  },{passive:false});
}
