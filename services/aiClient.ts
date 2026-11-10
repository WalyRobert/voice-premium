export type AISettings={provider:string;model:string;credential:'user'|'server';key:string};
export function aiRequest(settings:AISettings){const headers:Record<string,string>={};if(settings.credential==='user')headers['X-AI-Key']=settings.key;return {ai:{provider:settings.provider,model:settings.model,credential:settings.credential},headers};}
export async function requestAI(payload:object,settings:AISettings,signal?:AbortSignal){
 const {ai,headers}=aiRequest(settings);const response=await fetch('/api/analyze',{method:'POST',headers:{'content-type':'application/json',...headers},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(50000)]):AbortSignal.timeout(50000),body:JSON.stringify({...payload,ai})});
 let data;try{data=await response.json();}catch{throw Error('Resposta inválida do servidor local.');}
 if(!response.ok)throw Error(data.error||'Não foi possível consultar o provedor.');
 if(!data||typeof data!=='object')throw Error('Resposta inválida.');return data;
}


export async function analyzeText(payload:object,settings:AISettings,signal?:AbortSignal){const data=await requestAI(payload,settings,signal);if(typeof data.result!=='string'||!data.result.trim())throw Error('Resposta de texto inválida.');return data.result as string;}
