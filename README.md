# Voice Premium

## Escolha de provedor e chave por aba

Roteiro de texto: Gemini, DeepSeek ou OpenAI. Síntese de voz: Gemini ou OpenAI, com catálogos próprios de vozes predefinidas. Referência de áudio para orientar roteiro está disponível somente no Gemini; outros provedores recebem apenas a descrição textual. Não há clonagem vocal.

Abra **Configurar provedores para roteiro e voz** e aplique cada perfil separadamente. É possível usar DeepSeek para o roteiro e OpenAI para a voz, por exemplo. O modelo TTS precisa ser de síntese, não um modelo de chat.

A chave pessoal permanece apenas na memória desta página, sem localStorage, sessionStorage, arquivos ou logs do aplicativo. Recarregar/fechar exige configurar novamente. O campo é limpo ao aplicar; apagar o perfil remove a chave e interrompe a espera local. A remoção não desfaz solicitações já enviadas. Alterar provedor invalida a configuração anterior; não há fallback, reaproveitamento automático da chave de outro serviço ou repetição após erro.

**Verificar configuração sem gerar** verifica somente formato, destino e presença da chave localmente. Não contata o provedor, não comprova validade, acesso ao modelo nem cota gratuita. A geração só ocorre por ação explícita e pode consumir créditos. Os modelos iniciais são exemplos editáveis; disponibilidade e limites dependem da conta.

Opcionalmente escolha a chave do servidor de forma explícita e configure a variável do provedor no `.env`: `GEMINI_API_KEY`, `DEEPSEEK_API_KEY` ou `OPENAI_API_KEY`. Modelos são selecionados pela interface. As variáveis Gemini de modelo continuam atendendo clientes antigos da API sem seleção de provedor. Não publique `.env` reais.

O backend usa destinos HTTPS fixos, valida origem e função, limita corpo/resposta e prazo, e encaminha a chave somente em header para o serviço escolhido. A chave não entra no prompt, URL ou resposta. Não são aceitas URLs arbitrárias. Hospedagem compartilhada exige HTTPS e autenticação de usuários; o servidor padrão é local.

Testes de integração usam transporte controlado, sem geração externa ou consumo de créditos. `store: false` na OpenAI não é uma garantia de retenção zero pelo provedor; consulte as políticas de cada serviço.

Referências: [visão DeepSeek](https://api-docs.deepseek.com/guides/vision/), [OpenAI áudio](https://developers.openai.com/api/docs/guides/audio), [OpenAI TTS/PCM](https://developers.openai.com/api/docs/guides/text-to-speech), [Gemini](https://ai.google.dev/gemini-api/docs).


Protótipo de roteiro curto, sugestão de voz e síntese de fala Gemini. Autor: Waly Robert. Derivado do projeto no Google AI Studio; esta edição protege a chave no servidor, valida áudio e monta arquivos WAV com cabeçalho real.

## Executar

Node.js 22.16 ou superior. Instale com `npm ci`, copie `.env.example` para `.env` e configure `GEMINI_API_KEY` somente no servidor. Execute `npm run server` e `npm run dev` em terminais separados. Para produção local: `npm run build` e `npm start`, em `http://127.0.0.1:3001`.

`GEMINI_MODEL` seleciona roteiro; `GEMINI_TTS_MODEL` seleciona síntese. Os padrões preservam a família Gemini 2.5 usada no projeto original. Disponibilidade, cota, preço e eventuais migrações dependem da conta/provedor. Não houve chamada paga na validação desta edição.

## Recursos e limites

- Descrição de até 4000 caracteres para gerar um diálogo e sugerir Zephyr, Puck, Charon, Kore ou Fenrir.
- Referência opcional WAV/MP3 de até 5 MB: o MIME é identificado pelos bytes e validado no servidor, sem rotular todo arquivo como MP3. A referência orienta estilo; não clona identidade vocal.
- Texto editável para TTS de até 2000 caracteres e voz predefinida. A velocidade sugerida pelo roteiro é apenas orientação, sem promessa de controle acústico exato.
- Reprodução e download de WAV. Resposta PCM16 mono com taxa explícita é encapsulada em RIFF/WAVE; WAV recebido do provedor é preservado após validação. Formatos desconhecidos ou PCM sem taxa são rejeitados.
- URLs de áudio são liberadas quando substituídas ou ao sair; não há reprodução automática.

Ao gerar roteiro, descrição e referência são enviados ao Gemini pelo servidor. Ao gerar fala, texto e voz são enviados. Use material autorizado e evite dados sensíveis. A chave nunca integra o bundle do navegador. O servidor de demonstração tem limite de tamanho, origem e uma chamada simultânea, timeout e loopback; antes de exposição pública são necessários autenticação, quotas e controle de custos.

## Testes

`npm test`, `npm run test:server` e `npm run build`. Testes verificam cabeçalho WAV/PCM, taxa, formatos inválidos, limpeza de URL e chamadas simuladas de roteiro/TTS. O CI repete esses comandos. São testes de contrato e regressão; não certificam naturalidade, sotaque, semelhança vocal ou suporte de todos os dispositivos.

Formato de áudio e geração: [documentação oficial Gemini](https://ai.google.dev/gemini-api/docs/speech-generation). Esta edição espera o contrato generateContent da família configurada; modelos com contrato diferente exigem adaptação.

A interface foi adaptada para execução fora do Studio; a versão no Studio não é sobrescrita. Licença de redistribuição do código ainda não definida pelo autor; dependências mantêm suas próprias licenças.


## Início e diagnóstico simplificados

Após `npm ci`, execute `npm run diagnostico` para verificar Node, dependências, build e presença de configuração sem revelar chaves ou consumir cota. Execute `npm run iniciar` para compilar a versão atual e abrir o servidor local em um único terminal. A faixa de estado da interface distingue configuração ausente e integração ainda não comprovada. Encontrar uma chave não confirma que ela é válida nem que existe cota gratuita. Nenhum teste de geração é iniciado automaticamente.

A síntese OpenAI solicita PCM16 mono a 24 kHz e o servidor monta WAV com cabeçalho real. A transcrição OpenAI envia multipart com MIME/extensão coerentes; o Gemini recebe áudio inline. Formatos inválidos e respostas incompletas são rejeitados, sem criar áudio fictício.
