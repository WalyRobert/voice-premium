
import {resolveAI,AIError,checkOrigin,assertCapability} from './textProviders.mjs';
export async function handleAIConfig(req,res,{key,model,allowedOrigin,capabilities}){
 const send=(status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));};
 if(!checkOrigin(req,allowedOrigin))return send(403,{error:'Origem não autorizada.'});
 if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Envie JSON.'});
 try{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>2048)return send(413,{error:'Configuração muito grande.'});chunks.push(chunk);}const data=JSON.parse(Buffer.concat(chunks).toString('utf8')),capability=data.capability||capabilities[0];if(!capabilities.includes(capability)||!data.ai)throw new AIError(400,'Configuração ou função inválida.');const selected=resolveAI(data.ai,req.headers['x-ai-key'],{key,model});assertCapability(selected,capability);return send(200,{configured:true,provider:selected.provider,model:selected.model,capability,verified:false});}catch(e){return send(e instanceof AIError?e.status:400,{error:e instanceof AIError?e.message:'Configuração inválida.'});}
}
