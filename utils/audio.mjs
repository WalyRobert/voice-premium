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
 if(/^audio\/wav(?:;|$)/i.test(mime)){if(sniffAudio(data)!=='audio/wav')throw Error('WAV inválido.');return data;}
 if(!/^audio\/(?:l16|pcm)(?:;|$)/i.test(mime))throw Error('Formato de áudio do provedor não suportado.');
 const rate=Number(/(?:^|;)\s*rate=(\d+)/i.exec(mime)?.[1]);
 if(!rate)throw Error('PCM sem taxa de amostragem.');
 return pcmToWav(data,rate);
}
