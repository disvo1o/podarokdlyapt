import test from 'node:test';
import assert from 'node:assert/strict';
import {processFiles, arrangePhotos, insertPhotoPages} from '../src/batch.js';
test('batch keeps input order and imports remaining files after a failure with bounded concurrency', async () => {
 let active=0,peak=0;const progress=[];
 const results=await processFiles([25,2,10,1,5,3],async(n)=>{active++;peak=Math.max(peak,active);try{await new Promise(r=>setTimeout(r,n));if(n===10)throw Error('unreadable');return n}finally{active--}},n=>progress.push(n),3);
 assert.deepEqual(results.filter(r=>r.status==='fulfilled').map(r=>r.value),[25,2,1,5,3]);
 assert.equal(results[2].status,'rejected');assert.equal(results[2].file,10);
 assert.equal(peak,3);assert.deepEqual(progress,[1,2,3,4,5,6]);
});
test('large photo batch creates pages without replacing existing content or covers',()=>{
 const pages=[{id:'front',cover:true},{id:'existing',photos:[{id:'old'}]},{id:'back',cover:true}];
 const photos=Array.from({length:103},(_,i)=>({id:'photo-'+i,src:'original-'+i}));let id=0;
 const result=insertPhotoPages(pages,photos,1,4,()=>String(++id));
 assert.equal(result.count,26);assert.equal(result.first,2);assert.equal(result.pages[1],pages[1]);assert.equal(result.pages.at(-1),pages[2]);
 assert.deepEqual(result.pages.slice(2,-1).flatMap(p=>p.photos).map(p=>p.src),photos.map(p=>p.src));
 assert.equal(result.pages.at(-2).photos.length,3);
 for(const p of result.pages.slice(2,-1))for(const f of p.photos){assert.ok(f.x>=0&&f.y>=0&&f.w>0&&f.h>0&&f.x+f.w<=100&&f.y+f.h<=100)}
});
test('one, two and four photos remain inside paper and keep original source',()=>{
 for(const n of [1,2,4]){const photos=Array.from({length:n},(_,i)=>({id:i,src:'data:'+i}));const arranged=arrangePhotos(photos);assert.deepEqual(arranged.map(p=>p.src),photos.map(p=>p.src));for(const p of arranged)assert.ok(p.x+p.w<=100&&p.y+p.h<=100)}
});
