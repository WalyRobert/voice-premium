export function providerFailure(status){
 if([401,403].includes(status))return {status:503,body:{code:'PROVIDER_AUTH',error:'O provedor recusou o acesso. Confira chave, permissões e restrições da conta no servidor.'}};
 if(status===404)return {status:503,body:{code:'MODEL_UNAVAILABLE',error:'Modelo indisponível para esta conta. Confira GEMINI_MODEL ou GEMINI_TTS_MODEL no servidor.'}};
 if(status===429)return {status:429,body:{code:'PROVIDER_QUOTA',error:'Cota ou limite de frequência atingido. Aguarde e verifique a cota gratuita; não há repetição automática.'}};
 return {status:502,body:{code:'PROVIDER_FAILURE',error:'O provedor não concluiu a geração. Tente novamente mais tarde; nenhuma repetição automática foi feita.'}};
}
