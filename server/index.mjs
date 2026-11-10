import {providerFailure} from './provider.mjs';
import {createServer} from 'node:http';import {readFile,stat} from 'node:fs/promises';import {resolve,sep,extname} from 'node:path';import {fileURLToPath} from 'node:url';
import {audioResponseToWav,sniffAudio} from '../utils/audio.mjs';
const dist=fileURLToPath(new URL('../dist/',import.meta.url));
export const voices=['Zephyr','Puck','Charon','Kore','Fenrir'];
export function validateInput(input){
 if(!input||!['script','speech'].includes(input.action))throw Error('Ação inválida.');
 if(input.action==='speech'){if(typeof input.text!=='string'||!input.text.trim()||input.text.length>2000||!voices.includes(input.voice))throw Error('Texto (até 2000 caracteres) ou voz inválidos.');}
 else {if(typeof input.description!=='string'||!input.description.trim()||input.description.length>4000)throw Error('Descreva personagem e cena em até 4000 caracteres.');}
 if(input.reference){
  if(input.action!=='script'||typeof input.reference.data!=='string'||input.reference.data.length>7000000||!/^[A-Za-z0-9+/]*={0,2}$/.test(input.reference.data))throw Error('Referência inválida.');
  const bytes=Buffer.from(input.reference.data,'base64');if(bytes.toString('base64')!==input.reference.data||!bytes.length||bytes.length>5*1024*1024||sniffAudio(bytes)!==input.reference.mimeType)throw Error('Referência: use WAV ou MP3 de até 5 MB, com formato correto.');
 }
 return input;
}
export function parseScript(text){
 const r=JSON.parse(text);if(!r||typeof r.script!=='string'||!r.script.trim()||r.script.length>2000||!voices.includes(r.recommendedVoice)||typeof r.reasoning!=='string'||r.reasoning.length>3000||!Number.isFinite(r.suggestedStyle?.speed)||r.suggestedStyle.speed<.5||r.suggestedStyle.speed>1.5)throw Error('Roteiro inválido.');return r;
}
export function createApp({key=process.env.GEMINI_API_KEY,model=process.env.GEMINI_MODEL||'gemini-2.5-flash',ttsModel=process.env.GEMINI_TTS_MODEL||'gemini-2.5-flash-preview-tts',request=fetch,allowedOrigin=process.env.ALLOWED_ORIGIN||'http://127.0.0.1:5173'}={}){
 if(![model,ttsModel].every(m=>/^[a-zA-Z0-9._-]+$/.test(m)))throw Error('Modelo inválido.');let busy=false;
 return createServer(async(req,res)=>{
  const send=(status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));},route=(req.url||'/').split('?')[0];
  if(route==='/api/health'&&req.method==='GET')return send(200,{configured:Boolean(key)});
  if(route==='/api/analyze'&&req.method==='POST'){
   if(req.headers.origin&&![allowedOrigin,`http://${req.headers.host}`,`https://${req.headers.host}`].includes(req.headers.origin))return send(403,{error:'Origem não autorizada.'});
   if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Envie JSON.'});if(busy)return send(429,{error:'Uma geração já está em andamento.'});busy=true;
   try{
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024)return send(413,{error:'Solicitação muito grande.'});chunks.push(chunk);}
    let input;try{input=validateInput(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch(e){return send(400,{error:e instanceof SyntaxError?'JSON inválido.':e.message});}
    if(!key)return send(503,{error:'Configure GEMINI_API_KEY no .env do servidor e reinicie.'});
    const speech=input.action==='speech';
    const parts=speech?[{text:input.text}]:[{text:'Crie um diálogo de até 50 palavras e recomende uma voz dentre Zephyr, Puck, Charon, Kore, Fenrir. Não prometa clonagem nem identidade vocal. Descrição: '+input.description},...(input.reference?[{inlineData:input.reference}]:[])];
    const generationConfig=speech?{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:input.voice}}}}:{responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{script:{type:'STRING'},recommendedVoice:{type:'STRING',enum:voices},reasoning:{type:'STRING'},suggestedStyle:{type:'OBJECT',properties:{speed:{type:'NUMBER'}},required:['speed']}},required:['script','recommendedVoice','reasoning','suggestedStyle']},temperature:.5};
    let response;try{response=await request(`https://generativelanguage.googleapis.com/v1beta/models/${speech?ttsModel:model}:generateContent`,{method:'POST',signal:AbortSignal.timeout(45000),headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts}],generationConfig})});}catch{return send(504,{error:'O provedor não respondeu no prazo.'});}
    if(!response.ok){const failure=providerFailure(response.status);return send(failure.status,failure.body);}
    try{
     const data=await response.json(),parts=data.candidates?.[0]?.content?.parts;
     if(!Array.isArray(parts))throw Error();
     if(!speech)return send(200,{result:parseScript(parts.map(p=>p.text||'').join(''))});
     const inline=parts.find(p=>p.inlineData)?.inlineData;
     if(!inline||typeof inline.data!=='string'||inline.data.length>28000000||!/^[A-Za-z0-9+/]*={0,2}$/.test(inline.data))throw Error();
     const pcm=Buffer.from(inline.data,'base64');if(pcm.toString('base64')!==inline.data)throw Error();
     const wav=audioResponseToWav(pcm,inline.mimeType);return send(200,{audio:Buffer.from(wav).toString('base64'),mimeType:'audio/wav'});
    }catch{return send(502,{error:'Resposta de roteiro ou áudio inválida. Nenhum arquivo foi gerado.'});}
   }finally{busy=false;}
  }
  if(route.startsWith('/api/'))return send(404,{error:'Rota não encontrada.'});if(!['GET','HEAD'].includes(req.method))return send(405,{error:'Método não permitido.'});
  try{const path=resolve(dist,'.'+decodeURIComponent(route==='/'?'/index.html':route));if(!path.startsWith(resolve(dist)+sep)||!(await stat(path)).isFile())return send(404,{error:'Arquivo não encontrado.'});const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','x-content-type-options':'nosniff'});res.end(req.method==='HEAD'?undefined:await readFile(path));}catch{return send(404,{error:'Execute npm run build.'});}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))createApp().listen(Number(process.env.PORT||3001),'127.0.0.1',()=>console.log('Aplicação: http://127.0.0.1:'+(process.env.PORT||3001)));
