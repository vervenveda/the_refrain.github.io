/* Refrain Studio Highway v1: browser-local recoverable editor sessions.
   IndexedDB is best-effort local storage, not a substitute for exported backups. */
(function(global){
"use strict";
const DB="refrain-studio-highway-v1",STORE="projects",VERSION=1;
function open(){
 return new Promise((resolve,reject)=>{
  if(!global.indexedDB){reject(Error("IndexedDB unavailable"));return;}
  const request=indexedDB.open(DB,VERSION);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE);};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error("Cannot open local vault"));
  request.onblocked=()=>reject(Error("Local vault blocked by another tab"));
 });
}
async function transact(mode,fn){
 const db=await open();
 return new Promise((resolve,reject)=>{
  let settled=false,req,result;
  try{
   const tx=db.transaction(STORE,mode);req=fn(tx.objectStore(STORE));
   req.onsuccess=()=>{result=req.result;};
   req.onerror=()=>{};
   tx.oncomplete=()=>{settled=true;db.close();resolve(result);};
   tx.onabort=tx.onerror=()=>{if(!settled){settled=true;db.close();reject(tx.error||req?.error||Error("Local save failed"));}};
  }catch(e){db.close();reject(e);}
 });
}
function key(id,room){if(!/^[a-zA-Z0-9_-]{1,90}$/.test(id)||!/^[a-z-]{2,30}$/.test(room))throw Error("Invalid project key");return id+":"+room;}
const api={
 async save(id,room,payload){const k=key(id,room);await transact("readwrite",store=>store.put({payload,savedAt:new Date().toISOString()},k));return true;},
 async load(id,room){return (await transact("readonly",store=>store.get(key(id,room))))||null;},
 async remove(id,room){await transact("readwrite",store=>store.delete(key(id,room)));},
 projectId(){return "default-song";} // Named-project switching follows after migration.
};
Object.defineProperty(global,"RefrainHighway",{value:api,writable:false,configurable:false});
})(window);
