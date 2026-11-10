# Segurança

Não publique `.env`, chaves ou gravações pessoais. Roteiro e TTS transmitem conteúdo ao provedor; use dados e áudios autorizados. O servidor de demonstração é local e não substitui autenticação, quotas ou políticas de retenção numa implantação pública. Relate problemas com exemplos sintéticos sem credenciais.


Chaves pessoais da interface são temporárias e não são gravadas pelo aplicativo. Não registre headers de autenticação no proxy. Cada perfil usa seu provedor e não tem fallback para outra chave. Apagar a configuração não desfaz consultas já enviadas. Em hospedagem pública, proteja o gateway com autenticação e limites de uso.
