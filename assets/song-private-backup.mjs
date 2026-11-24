import {seal,open,MAX} from "./refrain-backup-envelope.mjs";
import {unpack} from "./song-project.mjs";
import {verifyProjectBinding} from "./song-ownership.mjs";
const encoder=new TextEncoder(),decoder=new TextDecoder("utf-8",{fatal:true});
const MAX_RECORD=128*1024,NS="refrain-music";
export async function encryptSong(project,record,password){
 await unpack(project);
 if(record&&!await verifyProjectBinding(record,project))throw Error("Declaration does not match this project");
 const meta=encoder.encode(JSON.stringify({suite:"RefrainPrivateSong",version:1,declaration:record||null}));
 if(meta.length>MAX_RECORD||8+meta.length+project.size>MAX)throw Error("Encrypted backup exceeds 256 MiB including metadata; export a smaller project.");
 const h=new Uint8Array(8);h.set([82,80,83,49]);new DataView(h.buffer).setUint32(4,meta.length,false);
 const scope={namespace:NS,owner:"local-"+crypto.randomUUID(),object:crypto.randomUUID(),revision:crypto.randomUUID(),category:"project"};
 return seal(new Blob([h,meta,project]),password,scope,{name:"private-song",type:"application/octet-stream"});
}
export async function decryptSong(file,password){
 // Local portable files carry their own opaque context; authentication is provided by GCM,
 // not by a trusted account identity. Never use this path for remote authorization.
 if(file.size<8||file.size>MAX+128*1024)throw Error("Invalid encrypted backup size");
 const h=new Uint8Array(await file.slice(0,8).arrayBuffer());if(String.fromCharCode(...h.slice(0,4))!=="RMC1")throw Error("Not a Refrain encrypted backup");
 const n=new DataView(h.buffer).getUint32(4,false);if(n<2||n>4096||8+n>file.size)throw Error("Invalid encrypted header");
 const outer=JSON.parse(decoder.decode(await file.slice(8,8+n).arrayBuffer()));
 if(outer.context?.namespace!==NS||outer.context.category!=="project"||!/^local-/.test(outer.context.owner))throw Error("Not a portable local song backup");
 const {blob}=await open(file,password,outer.context);
 if(blob.size<8)throw Error("Invalid private song");
 const head=new Uint8Array(await blob.slice(0,8).arrayBuffer());if(String.fromCharCode(...head.slice(0,4))!=="RPS1")throw Error("Invalid private song format");
 const len=new DataView(head.buffer).getUint32(4,false);if(len<2||len>MAX_RECORD||8+len>=blob.size)throw Error("Invalid private metadata");
 const meta=JSON.parse(decoder.decode(await blob.slice(8,8+len).arrayBuffer()));if(meta.suite!=="RefrainPrivateSong"||meta.version!==1||!("declaration" in meta))throw Error("Invalid private manifest");
 const project=blob.slice(8+len),data=await unpack(project);
 if(meta.declaration!==null&&!await verifyProjectBinding(meta.declaration,project))throw Error("Declaration binding failed");
 return {project,data,declaration:meta.declaration};
}
