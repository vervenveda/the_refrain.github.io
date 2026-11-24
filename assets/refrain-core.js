/* Refrain integration only: no ticker, header, menu, translator or toolbar reimplementation. */
(()=>{"use strict";if(window.RefrainCore)return;window.RefrainCore=true;
const body=document.body,home=new URL(body.dataset.refrainRoot||"./",location.href),url=p=>new URL(p,home).href,title=body.dataset.refrainTitle||"The Refrain";
const routes=[["Record","apps/recording-booth.html","Capture, review and save original takes."],["Edit","apps/audio-editing-desk.html","Split, trim, move and mix audio clips."],["Arrange","apps/pro-keyboard_index.html","Compose and arrange instrumental tracks."],["Melody","apps/vocal-transcription.html","Review and export detected musical notes."],["Notation","apps/the-staff_index.html","Write and play musical notation."],["Learn","education/Music%20101%20Workshop_index.html","Study music fundamentals."]];
const featureSets={
 "Recording Booth":[["Audio inputs","Test available microphones and audio interfaces.","#testInput"],["Recording controls","Record, pause, resume and stop a take.","#record"],["Local recovery","Restore available recording checkpoints.","#restoreRecovery"],["Review and save","Review takes and save audio to your drive.","#save"]],
 "Audio Editing Desk":[["Clip editing","Split, trim, crop and mend audio.","#split"],["Voice lanes","Arrange and layer vocal clips.","#modeMove"],["Vocal mixer","Adjust volume, pan, mute and solo.","#mixer"],["Project export","Save editing decisions and export WAV.","#save"]],
 "Vocal Transcription Studio":[["Original recording","Load your original audio.","#file"],["Melody detection","Analyze and review candidate notes.","#analyze"],["Compare","Listen to voice and melody together.","#comparePlay"],["Melody export","Save and restore your melody.","#export"]],
 "Harmony’s Haven":[["Piano","Play the keyboard and choose instruments.","#hhArranger"],["Arrangement","Build independent musical tracks.","#hhArranger"],["Staff","Review recorded notes.","#staffMain"],["Project","Import or export your composition.","#importMixBtn"]]
};
const features=featureSets[title]||routes.slice(0,4).map(([n,p,d])=>[n,d,url(p)]);
const localActions=features.filter(f=>f[2].startsWith("#")&&document.querySelector(f[2])).map(([label,sub,href])=>({type:"link",label,sub,href}));
window.KhaemenesClassToolsConfigV1={id:"refrain-tools",toggleLabel:"Tools",ariaLabel:"Refrain music tools",tools:[...localActions,...routes.slice(0,4).map(([label,p,sub])=>({type:"link",label,sub,href:url(p)}))].slice(0,8),help:{title:"Music tools",paragraphs:["These shortcuts open creative workspaces. Save your local project before leaving a page. No Refrain account is required."]}};
const crumb=document.querySelector(".rf-core-crumb");if(crumb){const a=crumb.querySelector("a");if(a)a.href=home.href}
const grid=document.querySelector(".rf-core-grid"),dialog=document.querySelector(".rf-core-dialog");if(grid&&dialog){for(const [label,desc,href] of features){const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=()=>{dialog.querySelector("h2").textContent=label;dialog.querySelector("p").textContent=desc;const a=dialog.querySelector("a");a.href=href;a.onclick=()=>dialog.close();dialog.showModal()};grid.append(b)}dialog.querySelector("button").onclick=()=>dialog.close()}
const existing=()=>document.getElementById("vnvHeaderAutoPopulate");
window.VNV333Ticker?.mount();window.VNV_HEADER?.mount({title:"The Refrain",subtitle:"",icon:"TR",home:home.href,actions:[],replaceLegacy:false});
window.VNV_TICKER?.autoPopulate({before:"#vnvHeaderAutoPopulate",label:"The Refrain · Explore",links:routes.map(([label,p])=>({label,href:url(p)})),cleanLegacy:false});
const header=existing(),auto=document.getElementById("vnvTickerAutoPopulate"),ticker=document.getElementById("vnv333NetworkTicker");if(ticker&&auto&&header){body.prepend(header);body.prepend(auto);body.prepend(ticker);header.after(crumb||document.createComment("Refrain breadcrumb"))}
document.addEventListener("DOMContentLoaded",()=>{const lang=document.getElementById("vnv-language-switch");if(lang&&crumb)crumb.after(lang);},{once:true});
})();
