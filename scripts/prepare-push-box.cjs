const sharp = require('sharp');
const fs = require('fs');
const source = 'assets/player/jeong-suho-push-box-source.png';
const out = 'assets/player';
async function main() {
  const frames = [], transforms = [];
  for (let k = 0; k < 6; k++) {
    const cell = await sharp(source).extract({left: (k%3)*512, top: Math.floor(k/3)*512, width:512, height:512}).png().toBuffer();
    const {data,info} = await sharp(cell).raw().toBuffer({resolveWithObject:true});
    let right = 0, bottom = 0;
    for (let y=300;y<490;y++) for (let x=270;x<512;x++) {
      const i=(y*info.width+x)*4;
      if(data[i+3]>200 && data[i]>70 && data[i]>data[i+1]*1.12 && data[i+1]>data[i+2]*1.1) {right=Math.max(right,x);bottom=Math.max(bottom,y);}
    }
    const dx=500-right, dy=480-bottom;
    const left=Math.max(0,-dx), top=Math.max(0,-dy);
    const clipped=await sharp(cell).extract({left,top,width:512-Math.abs(dx),height:512-Math.abs(dy)}).png().toBuffer();
    const alignedLarge=await sharp({create:{width:512,height:512,channels:4,background:'#00000000'}}).composite([{input:clipped,left:Math.max(dx,0),top:Math.max(dy,0)}]).png().toBuffer();
    const aligned=await sharp(alignedLarge).resize(256,256,{kernel:'nearest'}).png().toBuffer();
    frames.push(aligned); transforms.push({frame:k,translateSourcePixels:{x:dx,y:dy},boxRightSource:right,boxBottomSource:bottom});
  }
  await sharp({create:{width:1536,height:256,channels:4,background:'#00000000'}}).composite(frames.map((input,k)=>({input,left:k*256,top:0}))).png().toFile(`${out}/jeong-suho-push-box.png`);
  const rawFrames=await Promise.all(frames.map(b=>sharp(b).raw().toBuffer()));
  fs.mkdirSync('docs/previews',{recursive:true});
  await sharp(Buffer.concat(rawFrames),{raw:{width:256,height:1536,channels:4,pageHeight:256}}).gif({delay:[130,130,130,130,130,130],loop:0,effort:7}).toFile('docs/previews/suho-push-box.gif');
  const atlas={image:'jeong-suho-push-box.png',frameWidth:256,frameHeight:256,columns:6,rows:1,frameCount:6,frameDurationMs:130,loop:true,facing:'right',includesBox:true,footBaseline:244,boxAnchor:{right:250,bottom:240},frames:Array.from({length:6},(_,k)=>({index:k,x:k*256,y:0,width:256,height:256})),sourceLayout:{columns:3,rows:2,cellWidth:512,cellHeight:512},normalization:transforms};
  fs.writeFileSync(`${out}/jeong-suho-push-box.json`,JSON.stringify(atlas,null,2)+'\n');
  console.log(JSON.stringify(atlas));
  console.log(await sharp('docs/previews/suho-push-box.gif',{animated:true}).metadata());
}
main().catch(e=>{console.error(e);process.exit(1);});
