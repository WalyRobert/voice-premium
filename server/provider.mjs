export function providerFailure(status){
 if([400,422].includes(status))return {status:422,body:{code:'PROVIDER_INPUT',error:'Modelo ou formato incompatível com a função selecionada. Confira o modelo e seus parâmetros.'}};
 if([401,403].includes(status))return {status:503,body:{code:'PROVIDER_AUTH',error:'O provedor recusou o acesso. Confira chave, permissões e restrições da conta do provedor selecionado.'}};
 if(status===402)return {status:402,body:{code:'PROVIDER_BALANCE',error:'O provedor informou saldo ou créditos insuficientes. Nenhuma repetição ou troca de provedor foi feita.'}};
 if(status===404)return {status:503,body:{code:'MODEL_UNAVAILABLE',error:'Modelo indisponível para esta conta. Confira o modelo selecionado nas configurações de IA.'}};
 if(status===429)return {status:429,body:{code:'PROVIDER_QUOTA',error:'Cota ou limite de frequência atingido. Aguarde e verifique a cota gratuita; não há repetição automática.'}};
 return {status:502,body:{code:'PROVIDER_FAILURE',error:'O provedor não concluiu a geração. Tente novamente mais tarde; nenhuma repetição automática foi feita.'}};
}
