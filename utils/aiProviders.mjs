export const PROVIDER_LIST=Object.freeze([
 {id:'gemini',name:'Google Gemini',defaultModel:'gemini-2.5-flash',keyEnv:'GEMINI_API_KEY',modelEnv:'GEMINI_MODEL'},
 {id:'deepseek',name:'DeepSeek',defaultModel:'deepseek-flash',keyEnv:'DEEPSEEK_API_KEY',modelEnv:'DEEPSEEK_MODEL'},
 {id:'openai',name:'OpenAI',defaultModel:'gpt-4.1-mini',keyEnv:'OPENAI_API_KEY',modelEnv:'OPENAI_MODEL'},
]);
export const validModel=model=>typeof model==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(model);
export function findProvider(id){const provider=PROVIDER_LIST.find(p=>p.id===id);if(!provider)throw Error('Provedor de texto não suportado.');return provider;}

export function providersFor(capability){if(!['text','vision','speech','transcription'].includes(capability))throw Error('Função não suportada.');return PROVIDER_LIST.filter(p=>!['speech','transcription'].includes(capability)||p.id!=='deepseek');}
export function modelFor(id,capability){findProvider(id);if(capability==='speech')return id==='gemini'?'gemini-2.5-flash-preview-tts':'gpt-4o-mini-tts';if(capability==='transcription'&&id==='openai')return 'gpt-4o-mini-transcribe';return findProvider(id).defaultModel;}
export const GOOGLE_VOICES=['Zephyr','Puck','Charon','Kore','Fenrir'];
export const OPENAI_VOICES=['alloy','echo','fable','onyx','nova','shimmer'];
export function voicesFor(id){return id==='openai'?OPENAI_VOICES:GOOGLE_VOICES;}
