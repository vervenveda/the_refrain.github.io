// 🟣 Refrain local preservation envelope v1. Portable local backup primitive; no cloud authority.
// Lineage: Academy Sovereign Mini Cloud OS capsule, blob 59e663bca97f650304f1318b759d2f3977278f31.
// No transport, storage writes, identity authority or live keys.
// Source mirror: private Refrain Account Cloud Git blob 791a8312badd2b4bbbc1f99b832e57cae9bcbb7b.
const enc=new TextEncoder(),dec=new TextDecoder("utf-8",{fatal:true});
export const CHUNK=1024*1024,MAX=256*1024*1024,ITERATIONS=600000;
const MAGIC="RefrainEncryptedBackup", NS="refrain-music";
const random=n=>crypto.getRandomValues(new Uint8Array(n));
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,"0")).join("");
const unhex=(s,n)=>{if(typeof s!=="string"||s.length!==n*2||!/^[0-9a-f]+$/.test(s))throw Error("Invalid hex field");return Uint8Array.from(s.match(/../g),x=>parseInt(x,16))};
const id=x=>typeof x==="string"&&/^[a-zA-Z0-9_-]{1,96}$/.test(x);
const categories=new Set(["original","project","master","release-draft"]);
function context(c){if(!c||c.namespace!==NS||!id(c.owner)||!id(c.object)||!id(c.revision)||!categories.has(c.category))throw Error("Invalid context");return {namespace:NS,owner:c.owner,object:c.object,revision:c.revision,category:c.category}}
function pass(p){if(typeof p!=="string"||p.length<16||p.length>1024)throw Error("Use a strong passphrase of 16–1024 characters");return p}
async function derive(p,salt){const base=await crypto.subtle.importKey("raw",enc.encode(pass(p)),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:ITERATIONS,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
async function digest(bytes){return hex(await crypto.subtle.digest("SHA-256",bytes))}
function nonce(prefix,index){const iv=new Uint8Array(12);iv.set(prefix);new DataView(iv.buffer).setUint32(8,index,false);return iv}
function aad(h,index){return enc.encode(JSON.stringify([MAGIC,1,h.context.namespace,h.context.owner,h.context.object,h.context.revision,h.context.category,h.salt,h.prefix,h.length,h.count,index]))}
function validate(h,expected){if(!h||h.suite!==MAGIC||h.version!==1||h.iterations!==ITERATIONS||h.chunkSize!==CHUNK||!Number.isSafeInteger(h.length)||h.length<1||h.length>MAX||h.count!==Math.ceil(h.length/CHUNK))throw Error("Invalid envelope");const c=context(h.context),e=context(expected);if(JSON.stringify(c)!==JSON.stringify(e))throw Error("Context mismatch");unhex(h.salt,16);unhex(h.prefix,8);return {...h,context:c}}
export async function seal(blob,passphrase,scope,metadata={}){
 if(!(blob instanceof Blob)||blob.size<1||blob.size>MAX)throw Error("Invalid backup size");
 const c=context(scope),salt=random(16),prefix=random(8),key=await derive(passphrase,salt);
 const h={suite:MAGIC,version:1,iterations:ITERATIONS,chunkSize:CHUNK,context:c,salt:hex(salt),prefix:hex(prefix),length:blob.size,count:Math.ceil(blob.size/CHUNK)};
 const name=String(metadata.name||"song.refrain"),type=String(metadata.type||"application/octet-stream");if(name.length>180||type.length>150)throw Error("Invalid metadata");
 const parts=[],hashes=[];
 for(let i=0;i<h.count;i++){const bytes=await blob.slice(i*CHUNK,(i+1)*CHUNK).arrayBuffer();hashes.push(await digest(bytes));parts.push(await crypto.subtle.encrypt({name:"AES-GCM",iv:nonce(prefix,i),additionalData:aad(h,i),tagLength:128},key,bytes))}
 const manifest=enc.encode(JSON.stringify({name,type,hashes})),sealedManifest=await crypto.subtle.encrypt({name:"AES-GCM",iv:nonce(prefix,0xffffffff),additionalData:aad(h,0xffffffff),tagLength:128},key,manifest);
 const header=enc.encode(JSON.stringify({...h,manifestBytes:sealedManifest.byteLength})),prefixBytes=new Uint8Array(8);prefixBytes.set([82,77,67,49]);new DataView(prefixBytes.buffer).setUint32(4,header.length,false);
 return new Blob([prefixBytes,header,sealedManifest,...parts],{type:"application/octet-stream"})
}
export async function open(blob,passphrase,expected){
 if(!(blob instanceof Blob)||blob.size<8||blob.size>MAX+128*1024)throw Error("Invalid envelope size");
 const first=new Uint8Array(await blob.slice(0,8).arrayBuffer());if(String.fromCharCode(...first.slice(0,4))!=="RMC1")throw Error("Invalid magic");
 const n=new DataView(first.buffer).getUint32(4,false);if(n<2||n>4096||8+n>blob.size)throw Error("Invalid header");
 const h=validate(JSON.parse(dec.decode(await blob.slice(8,8+n).arrayBuffer())),expected);
 if(!Number.isSafeInteger(h.manifestBytes)||h.manifestBytes<16||h.manifestBytes>65536||blob.size!==8+n+h.manifestBytes+h.length+16*h.count)throw Error("Truncated or excess data");
 const key=await derive(passphrase,unhex(h.salt,16)),prefix=unhex(h.prefix,8);let at=8+n;
 const decrypt=(bytes,index)=>crypto.subtle.decrypt({name:"AES-GCM",iv:nonce(prefix,index),additionalData:aad(h,index),tagLength:128},key,bytes);
 const m=JSON.parse(dec.decode(await decrypt(await blob.slice(at,at+h.manifestBytes).arrayBuffer(),0xffffffff)));at+=h.manifestBytes;
 if(typeof m.name!=="string"||m.name.length>180||typeof m.type!=="string"||m.type.length>150||!Array.isArray(m.hashes)||m.hashes.length!==h.count||m.hashes.some(x=>typeof x!=="string"||!/^[a-f0-9]{64}$/.test(x)))throw Error("Invalid encrypted manifest");
 const parts=[];for(let i=0;i<h.count;i++){const len=Math.min(CHUNK,h.length-i*CHUNK)+16,bytes=await decrypt(await blob.slice(at,at+len).arrayBuffer(),i);if(await digest(bytes)!==m.hashes[i])throw Error("Integrity mismatch");parts.push(bytes);at+=len}
 if(at!==blob.size)throw Error("Envelope mismatch");return {blob:new Blob(parts,{type:m.type}),name:m.name,context:h.context}
}
