// Galion Voice — Perpetual Open MIT License. (c) 2026 Galion Labs.
// Excerpt of crates/galion-console/assets/v1-screen.html lines 323-393:
// productIsOne through playSound. The voice screen around that block is not copied.

function productIsOne(){
  const p=location.pathname;
  if(p==="/one"||p==="/one/") return true;
  return location.hostname==="one.galion.app";
}
// Galion OS tones. 432 Hz just intonation: 2:1, 3:2, 5:4. Warm hum at 216 and 108.
// boot, shutdown, notification, wake (Galion One wake), done (task done),
// approval (approval needed), error. Oscillators only. No audio files.

const FUND=432;
const HUM=[FUND/4, FUND/2];
const OS_SOUNDS=[
  {id:"boot", notes:[FUND/4, FUND/2, FUND]},
  {id:"shutdown", notes:[FUND, FUND/2, FUND/4]},
  {id:"notification", notes:[FUND, FUND*(5/4)]},
  {id:"wake", notes:[FUND/2, FUND, FUND*(3/2)]},
  {id:"done", notes:[FUND*(5/4), FUND*(3/2), FUND*2]},
  {id:"approval", notes:[FUND, FUND*(3/2)]},
  {id:"error", notes:[FUND/2, FUND/4]}
];
window.GALION_OS=OS_SOUNDS.map(s=>({id:s.id, notes:s.notes.slice(), hum:HUM.slice()}));
let silence=false, booted=false, approvalOn=false, haloHeard="", prevShown="";
function silenceRequested(){
  try{ if(localStorage.getItem("galion-one-silence")==="1") return true; }catch(e){}
  return new URLSearchParams(location.search).get("silence")==="1";
}
function setSilence(on){
  silence=!!on;
  document.body.dataset.silence=silence?"on":"off";
  document.body.dataset.resonance=silence?"off":"on";
  const btn=document.getElementById("silence");
  if(btn) btn.setAttribute("aria-pressed", silence?"true":"false");
  try{ localStorage.setItem("galion-one-silence", silence?"1":"0"); }catch(e){}
}
function toneContext(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return null;
    if(!micCtx) micCtx=new AC({latencyHint:"interactive"});
    if(micCtx.state==="suspended") micCtx.resume().catch(()=>{});
    return micCtx;
  }catch(e){ return null; }
}
function scheduleSine(ctx,hz,start,dur,peak){
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.type="sine"; o.frequency.value=hz;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start+Math.max(0.05,dur));
  o.connect(g); g.connect(ctx.destination);
  o.start(start); o.stop(start+dur+0.02);
}
function playSound(id){
  if(!productIsOne()||silence) return;
  const tone=OS_SOUNDS.find(s=>s.id===id);
  if(!tone) return;
  const ctx=toneContext();
  if(ctx){
    try{
      const t=ctx.currentTime, step=0.12;
      tone.notes.forEach((hz,i)=>scheduleSine(ctx,hz,t+i*step,step+0.04,0.05));
      const dur=tone.notes.length*step+0.36;
      for(const hz of HUM) scheduleSine(ctx,hz,t,dur,0.016);
    }catch(e){}
  }
  const log=(cv.dataset.cues||"").split(",").filter(Boolean);
  log.push(id);
  cv.dataset.cues=log.slice(-16).join(",");
  cv.dataset.cue=id;
  cv.dataset.resonance="on";
}
