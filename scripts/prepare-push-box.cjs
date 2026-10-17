const sharp = require('sharp');
const fs = require('fs');
const assert = require('node:assert/strict');
const source = 'assets/player/jeong-suho-push-no-box-source.png';
const out = 'assets/player';
async function main() {
  const metadata = await sharp(source).metadata();
  assert.equal(metadata.width, 1536);
  assert.equal(metadata.height, 256);
  assert.ok(metadata.hasAlpha, 'Pushing sprites require a transparent background');
  const frames = [];
  for (let k = 0; k < 6; k++) {
    frames.push(await sharp(source).extract({left:k*256,top:0,width:256,height:256}).png().toBuffer());
  }
  fs.copyFileSync(source, `${out}/jeong-suho-push-box.png`);
  const rawFrames=await Promise.all(frames.map(b=>sharp(b).raw().toBuffer()));
  fs.mkdirSync('docs/previews',{recursive:true});
  await sharp(Buffer.concat(rawFrames),{raw:{width:256,height:1536,channels:4,pageHeight:256}}).gif({delay:[130,130,130,130,130,130],loop:0,effort:7}).toFile('docs/previews/suho-push-box.gif');
  const atlas={image:'jeong-suho-push-box.png',frameWidth:256,frameHeight:256,columns:6,rows:1,frameCount:6,frameDurationMs:130,loop:true,facing:'right',includesBox:false,footBaseline:244,frames:Array.from({length:6},(_,k)=>({index:k,x:k*256,y:0,width:256,height:256})),sourceLayout:{columns:6,rows:1,cellWidth:256,cellHeight:256}};
  fs.writeFileSync(`${out}/jeong-suho-push-box.json`,JSON.stringify(atlas,null,2)+'\n');
  console.log(JSON.stringify(atlas));
  console.log(await sharp('docs/previews/suho-push-box.gif',{animated:true}).metadata());
}
main().catch(e=>{console.error(e);process.exit(1);});
