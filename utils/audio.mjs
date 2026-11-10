export function pcmToWav(pcm,sampleRate=24000){
 if(!(pcm instanceof Uint8Array)||!pcm.length||pcm.length%2||pcm.length>20*1024*1024)throw Error('PCM de 16 bits inválido.');
 if(![8000,16000,22050,24000,44100,48000].includes(sampleRate))throw Error('Taxa de áudio não suportada.');
 const bytes=new Uint8Array(44+pcm.length),v=new DataView(bytes.buffer),text=(offset,s)=>{for(let i=0;i<s.length;i++)v.setUint8(offset+i,s.charCodeAt(i));};
 text(0,'RIFF');v.setUint32(4,36+pcm.length,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,pcm.length,true);bytes.set(pcm,44);return bytes;
}
export function sniffAudio(bytes){
 const text=(a,b)=>String.fromCharCode(...bytes.subarray(a,b));
 if(bytes.length>=44&&text(0,4)==='RIFF'&&text(8,12)==='WAVE')return 'audio/wav';
 if(bytes.length>=3&&(text(0,3)==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224)))return 'audio/mpeg';
 throw Error('Use um WAV ou MP3 válido.');
}
export function audioResponseToWav(data,mime){
 if(typeof mime!=='string')throw Error('Resposta sem formato de áudio.');
 if(/^audio\/wav(?:;|$)/i.test(mime)){return validateWav(data);}
 if(!/^audio\/(?:l16|pcm)(?:;|$)/i.test(mime))throw Error('Formato de áudio do provedor não suportado.');
 const rate=Number(/(?:^|;)\s*rate=(\d+)/i.exec(mime)?.[1]);
 if(!rate)throw Error('PCM sem taxa de amostragem.');
 return pcmToWav(data,rate);
}

export function validateWav(bytes){
 if(sniffAudio(bytes)!=='audio/wav')throw Error('WAV inválido.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),tag=(offset)=>String.fromCharCode(...bytes.subarray(offset,offset+4));
 if(view.getUint32(4,true)+8!==bytes.length)throw Error('WAV truncado ou tamanho inconsistente.');
 let offset=12,format=false,data=false,alignment=0,length=0;
 while(offset+8<=bytes.length){const name=tag(offset),size=view.getUint32(offset+4,true),start=offset+8;if(start+size>bytes.length)throw Error('Bloco WAV incompleto.');
  if(name==='fmt '){if(format||size<16)throw Error('Formato WAV inválido.');const channels=view.getUint16(start+2,true),rate=view.getUint32(start+4,true);alignment=channels*2;if(view.getUint16(start,true)!==1||![1,2].includes(channels)||view.getUint16(start+14,true)!==16||rate<8000||rate>192000||view.getUint16(start+12,true)!==alignment||view.getUint32(start+8,true)!==rate*alignment)throw Error('WAV precisa ser PCM16 com taxa e canais válidos.');format=true;}
  if(name==='data'){if(data||!size)throw Error('WAV sem amostras válidas.');data=true;length=size;}
  offset=start+size+(size%2);
 }
 if(offset!==bytes.length||!format||!data||length%alignment)throw Error('Estrutura WAV inválida.');return bytes;
}
