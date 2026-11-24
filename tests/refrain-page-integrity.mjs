import fs from "node:fs";
import assert from "node:assert/strict";
const pages=["index.html","apps/song-project.html","apps/recording-booth.html","apps/audio-editing-desk.html","apps/vocal-transcription.html","apps/pro-keyboard_index.html","apps/the-staff_index.html","apps/composer_studio_index.html","apps/ARSHIF_Music_Hall_Resources_Updated_index.html","education/Music 101 Workshop_index.html","education/Music 201 Workshop_index.html"];
for(const path of pages){
 const s=fs.readFileSync(path,"utf8");
 const blocks=[...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
 const inline=blocks.filter(m=>!/\bsrc=/.test(m[1]));
 for(const m of inline)assert.doesNotThrow(()=>new Function(m[2]),path+" inline script syntax");
 const canonical=["vnv-333-ticker.js","vnv-ticker-autopopulate.js","vnv-header-autopopulate.js","refrain-core.js","vnv-class-tools-toolbar.js","vnv-ecosystem-toolbar.js","vnv-language.js","vnv-support.js"];
 for(const name of canonical){const actual=blocks.filter(m=>/\bsrc=/.test(m[1])&&m[1].includes(name));assert.equal(actual.length,1,path+" "+name);}
 const first=blocks.find(m=>m[1].includes("vnv-333-ticker.js"));assert(first.index>Math.max(-1,...inline.map(m=>m.index)),path+" chrome must follow application scripts");
 const markup=s.slice(s.indexOf("<body"),blocks[0].index);
 assert.equal([...markup.matchAll(/<h1\b/g)].length,1,path+" static title");
 assert.equal([...markup.matchAll(/class="rf-core-crumb"/g)].length,1,path+" breadcrumb");
 assert.equal([...markup.matchAll(/class="rf-core-grid"/g)].length,1,path+" feature grid");
 assert.equal([...markup.matchAll(/class="rf-core-about"/g)].length,1,path+" about");
 assert.equal([...markup.matchAll(/class="rf-core-actions"/g)].length,1,path+" access shortcuts");
 const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,path+" duplicate IDs");
 console.log("PASS",path);
}
new Function(fs.readFileSync("assets/refrain-core.js","utf8"));
console.log("PASS shared integration syntax");
