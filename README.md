# Voice Premium

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
