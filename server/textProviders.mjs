import {findProvider,validModel,providersFor} from '../utils/aiProviders.mjs';
import {providerFailure} from './provider.mjs';
export class AIError extends Error{constructor(status,message,code='AI_CONFIGURATION'){super(message);this.status=status;this.code=code;}}
export function resolveAI(ai,header,{key,model,env=process.env}={}){
 // Legacy clients keep their Gemini configuration; the new UI always sends explicit metadata.
 if(ai===undefined){if(!key)throw new AIError(503,'Configure a IA na interface ou a chave Gemini no servidor.');return {provider:'gemini',model,key};}
 if(!ai||Array.isArray(ai)||typeof ai!=='object'||Object.keys(ai).some(k=>!['provider','model','credential'].includes(k)))throw new AIError(400,'Configuração de IA inválida.');
 let provider;try{provider=findProvider(ai.provider);}catch{throw new AIError(400,'Provedor de texto não suportado.');}
 if(!validModel(ai.model)||!['user','server'].includes(ai.credential))throw new AIError(400,'Modelo ou origem da chave inválidos.');
 let secret;
 if(ai.credential==='user'){
  if(typeof header!=='string'||header.length<8||header.length>512||!/^[\x21-\x7e]+$/.test(header))throw new AIError(400,'Informe uma chave válida para este provedor.');
  secret=header;
 }else{
  if(header!==undefined)throw new AIError(400,'Não envie chave pessoal ao usar configuração do servidor.');
  secret=provider.id==='gemini'?key:env[provider.keyEnv];
  if(!secret)throw new AIError(503,'Não há chave deste provedor configurada no servidor. Use sua chave nesta aba.');
 }
 return {provider:provider.id,model:ai.model,key:secret};
}
export function checkOrigin(req,allowedOrigin){
 const host=req.headers.host||'';let configured;try{configured=new URL(allowedOrigin).host;}catch{return false;}
 const local=/^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host);
 if(!local&&host!==configured)return false;
 return !req.headers.origin||req.headers.origin===allowedOrigin||req.headers.origin===`http://${host}`||req.headers.origin===`https://${host}`;
}
export async function readJson(response){
 if(!response.body?.getReader)return response.json();
 const reader=response.body.getReader(),parts=[];let length=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>1024*1024)throw new AIError(502,'Resposta do provedor acima do limite.','AI_RESPONSE_LIMIT');parts.push(value);}}catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export function assertCapability(config,capability){
 if(!providersFor(capability).some(p=>p.id===config.provider))throw new AIError(422,'Este provedor não está integrado para esta função. Escolha outro perfil de IA.','AI_CAPABILITY');
 if(capability==='vision'&&config.provider==='deepseek'&&config.model==='deepseek-v4-pro')throw new AIError(422,'O modelo DeepSeek Pro selecionado não aceita imagens. Escolha um modelo com visão, como deepseek-flash.','AI_CAPABILITY');
}
export async function generateText(config,instruction,prompt,request=fetch,options={}){
 assertCapability(config,options.image?'vision':'text');
 if(options.audio&&config.provider!=='gemini')throw new AIError(422,'Referência de áudio para roteiro requer Gemini. Remova o áudio ou escolha Gemini.','AI_CAPABILITY');
 let url,headers,body;
 if(config.provider==='gemini'){
  url=`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`;
  headers={'content-type':'application/json','x-goog-api-key':config.key};
  body={systemInstruction:{parts:[{text:instruction}]},contents:[{role:'user',parts:[...(options.image?[{inlineData:options.image}]:[]),...(options.audio?[{inlineData:options.audio}]:[]),{text:prompt}]}],generationConfig:{temperature:.3,maxOutputTokens:4096,...(options.schema?{responseMimeType:'application/json',responseSchema:options.schema}:{})}};
 }else{
  url=config.provider==='deepseek'?'https://api.deepseek.com/chat/completions':'https://api.openai.com/v1/chat/completions';
  headers={'content-type':'application/json',Authorization:`Bearer ${config.key}`};
  body={model:config.model,messages:[{role:'system',content:instruction},{role:'user',content:options.image?[{type:'text',text:prompt},{type:'image_url',image_url:{url:`data:${options.image.mimeType};base64,${options.image.data}`}}]:prompt}],stream:false,...(config.provider==='deepseek'?{max_tokens:4096,thinking:{type:'disabled'}}:{max_completion_tokens:4096,store:false})};
 }
 let response;try{response=await request(url,{method:'POST',headers,body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(45000)});}catch{throw new AIError(504,'O provedor não respondeu no prazo ou recusou a conexão. Nenhuma repetição foi feita.','AI_TIMEOUT');}
 if(!response.ok){const failure=providerFailure(response.status);throw new AIError(failure.status,failure.body.error,failure.body.code);}
 try{
  const data=await readJson(response);let text,finish;
  if(config.provider==='gemini'){
   if(data.promptFeedback?.blockReason)throw new AIError(422,'O provedor bloqueou esta solicitação.','AI_BLOCKED');
   const candidate=data.candidates?.[0];finish=candidate?.finishReason;
   if(finish==='MAX_TOKENS')throw new AIError(502,'A resposta atingiu o limite de saída. Reduza o conteúdo da solicitação.','AI_OUTPUT_LIMIT');
   if(finish&&finish!=='STOP')throw new AIError(422,'O provedor não concluiu a resposta.','AI_BLOCKED');
   text=candidate?.content?.parts?.filter(p=>!p.thought).map(p=>p.text||'').join('');
  }else{
   const choice=data.choices?.[0];finish=choice?.finish_reason;
   if(finish==='length')throw new AIError(502,'A resposta atingiu o limite de saída. Reduza o conteúdo da solicitação.','AI_OUTPUT_LIMIT');
   if(choice?.message?.refusal||finish&&finish!=='stop')throw new AIError(422,'O provedor não concluiu a resposta de texto.','AI_BLOCKED');
   text=choice?.message?.content;
  }
  if(typeof text!=='string'||!text.trim()||text.length>25000)throw Error('invalid');
  return text.trim().split(config.key).join('[chave removida]');
 }catch(e){if(e instanceof AIError)throw e;throw new AIError(502,'O provedor retornou texto inválido. Nenhum resultado foi aplicado.','AI_INVALID_RESPONSE');}
}
