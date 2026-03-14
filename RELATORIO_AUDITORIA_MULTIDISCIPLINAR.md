# 🛡️ Relatório de Auditoria e Teste de Software (Comitê Multidisciplinar)

## 1. Visão Geral do Sistema
O sistema "TrueAudio - YouTube Audio Language Controller" (NoDubbing) é uma extensão para Google Chrome baseada no Manifest V3 que tem como objetivo forçar a reprodução de vídeos do YouTube em um idioma de áudio preferencial pelo usuário, evitando a dublagem automática de IA que tem sido empurrada pela plataforma.

A arquitetura do software funciona com:
- Um Contexto Isolado (`content_bridge.js`) encarregado de injetar um script no *Main World* da página em questão. 
- Um Script Principal (`player_main.js`) no *Main World*, possuindo acesso irrestrito à API pública/ofuscada do player do YouTube (`window.movie_player`).
- A troca de mensagens entre os contextos ocorre exclusivamente através da escuta e processamento de um disparo local de `CustomEvent`, garantindo o mínimo acoplamento possível às APIs restritivas das extensões sobre a DOM. O estado da configuração é eficientemente sincronizado no `chrome.storage.sync`.


## 2. Relatório de Descobertas (Separado por Time)

### 🧑‍💻 Time de Desenvolvedores Seniores (Code Review e Arquitetura)
- **Issue/Melhoria Encontrada:** Há alta repetição de cadeias "hardcoded" e complexidade ciclomática inflacionada na função de correspondência de idiomas (`findTrackByLanguage()`). Além disso, o mecanismo de salvaguarda implementado na função `monitorAndForceAudioTrack` utiliza uma aproximação de polling rígido (`setInterval`) de verificação de áudio a cada 1.5s que onera levimente o event-loop da página.
- **Impacto:** Médio. Dificulta muito a escalabilidade e a manutenção rápida caso seja necessário acrescentar novos idiomas (como variações regionais ou novos dialetos documentados pelo usuário).
- **Plano de Ação/Correção:** 
  - Centralizar os Hardcodes (`languageCodeMap` e `languageNameMap`) em um JSON externo ou módulo constante abstraído, possivelmente mapeado via um algoritmo de dicionário reverso, por exemplo:
    ```javascript
    const getLanguageGroup = (code) => Object.entries(languageCodeMap).find(([_, codes]) => codes.includes(code))?.[0];
    ```
  - Substituir o monitoramento de tempo fixo (Polling) por hooks ou intercepções (*Monkey Patching* brando) na API original do YouTube voltados para detecção assíncrona da mudança de track, ou, sendo mantido o loop, atrelar a validação estritamente ao método `requestAnimationFrame`.

### 🔒 Time de Segurança (SecOps/AppSec)
- **Issue/Melhoria Encontrada:** Comunicação de canal global inseguro para o estado da UI. Como o manifesto é seguro (sem *unsafe-eval* e permissões curadas), a extensão brilha no quesito compliance. Contudo, o evento `trueaudio-config` lançado no objeto global `document` é puramente público no document tree e pode ser observado ou disparado falsamente por um script malicioso já existente na página vindo de outra extensão ou *Cross-Site Scripting* em outras sessões do YouTube.
- **Impacto:** Baixo. Uma injeção falsa apenas trocaria as preferências de idioma temporariamente dentro de um Toast que usa `textContent` (livre de XSS Injection ao renderizar a label).
- **Plano de Ação/Correção:** Criar um mecanismo de Autenticação Efêmera para os Canais Locais (*Local Event Nonce Validation*).
  O `content_bridge.js` na hora de injetar e disparar gera um UUID ou Token Randômico injetado através do `dataset` do script, de modo que eventos customizados só são processados pelo Main World se validos contra o Token: `if(event.detail.token !== INJECTED_NONCE) return;`.

### ☁️ Time de Infraestrutura/DevOps
- **Issue/Melhoria Encontrada:** O projeto não faz o provisionamento da automação de QA (*Continuous Integration* — CI) e do empacaotamento ágil para releases. Além disso, não há uma camada formal de *linting* (Prettier / ESLint) impedindo débito técnico precoce.
- **Impacto:** Médio. Dependência manual total para a rotina de publicações que pode esquecer arquivos desnecessários na Zipagem para a store.
- **Plano de Ação/Correção:** Subir esteiras GitHub Actions para validação e *Pack Release*:
  ```yaml
  name: Extension Build & Release
  on: [push, pull_request]
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Zip Production Asset
          run: zip -r NoDubbingRelease.zip . -x "*.git*" "check-icons.ps1" "TESTING.md" "SETUP.md"
        - name: Archive Artifact
          uses: actions/upload-artifact@v3
          with:
            name: extension-build
            path: NoDubbingRelease.zip
  ```

### 🗄️ Time de DBA (Database Administrators / Storage Management)
- **Issue/Melhoria Encontrada:** Transição rígida dos esquemas do Settings usando `chrome.storage`. A gravação é imediata em chaves expostas no objeto root do State, mas não possui nenhum controle de versão sintática ou *Schema Registry Mode*.
- **Impacto:** Baixo (mas de risco futuro). Num passo iminente, se for adicionado o suporte de lista múltipla de prioridades para idiomas em vez de um só campo string (`preferredLanguage: ['original', 'en', 'es']`), a migração quebra as configurações antigas ativas e lança exceções de NullPointer não tratadas.
- **Plano de Ação/Correção:** Inserir um modelo relacional e versionado de documento:
  ```json
  {
    "schemaVersion": 1,
    "preferences": {
      "language": {"primary": "original", "fallback": ["en"]},
      "ui": {"showToast": true},
      "core": {"enabled": true}
    }
  }
  ```
  Isso permitiria à função `loadSettings()` injetar uma rotina iterativa de Upgrades nos clientes migrados silenciosamente entre as diferentes *schemaVersion*.

### 🧪 Time de QA (Quality Assurance)
- **Issue/Melhoria Encontrada:** Há um documento rico (`TESTING.md`) instruindo os testes empíricos da aplicação, mas zero esforço em testes ponta a ponta (E2E Automated UI Testing) sobre a usabilidade na plataforma, bem como atributos deficientes de acessibilidade A11y na interface do Toast.
- **Impacto:** Alto. Alterações nos atributos ofuscados do YouTube ou modificações no DOM do SPA são comuns; sem um robô de testes E2E diário rodando, as falhas não serão capturadas nas atualizações dinâmicas do front end da Google e apenas sentidas pelos usuários como Breakout Crash.
- **Plano de Ação/Correção:** 
  - Construir um suite de testes no `Playwright`, carregando a pasta descompactada dinamicamente:
    `const context = await chromium.launchPersistentContext('', { headless: false, args: [\`--disable-extensions-except=\${extensionPath}\`, \`--load-extension=\${extensionPath}\`] });`
  - Incluir suporte de Acessibilidade no JavaScript inserindo atributos ricos no elemento de Toast Injetado para os Leitores de Tela. Ex: `toast.setAttribute('role', 'alert'); toast.setAttribute('aria-live', 'assertive');`.

### 💼 Time de Product Managers (PM)
- **Issue/Melhoria Encontrada:** Não há fluxo definido para captura real do engajamento e a monetização do produto (como se pretende remunerar o tempo estendido no suporte?). Limita-se apenas ao *core value* sem mapear o "Job to be Done" secundário: usuários reportando inconsistências em casos mais complexos.
- **Impacto:** Alto no escopo de negócios. Limita o ciclo de vida sustentável do Produto.
- **Plano de Ação/Correção:** Inserir um painel de Feedback *One-Click* na interface nativa (`popup.html`). Estudar a implantação de uma infraestrutura opt-in mínima (consentida de acordo com GDPR/LGPD) focada no Analytics do engajamento e métrica de retenção.

### 🎯 Time de Product Owners (PO)
- **Issue/Melhoria Encontrada:** O roadmap está inflacionado simultaneamente com dependências básicas bloqueantes (Go-to-Market trancado pela falta dos icones resolutos, reportado diretamente do `PROJECT_OVERVIEW.md`). Casos limites, como "Live Streams" e Autenticação que exigem Refresh, não contêm propostas curtas de refinamento.
- **Impacto:** Médio. Bloqueios triviais afetam a entrega na ponta para a Sprint corrente.
- **Plano de Ação/Correção:** 
  - **Fatiar as Entregas (Sprint 1 - Agora):** Executar imperativamente o script provido (`check-icons.ps1`) para sanar a pendência dos Assets Padrões (Icons) e publicar imediatamente o MVP v1.0.0.
  - **Entregas (Sprint 2 - Setup & Qualidade):** Tratar falhas do SPA com eventos e focar refinamento da limitação sobre Live Streaming e Content Premiums.

## 3. Gargalos e Redundâncias Cruzadas

- **A Ameaça de Dependência Extrema do Obfuscamento do YouTube (Devs + QA + PO):**
  Todos os relatórios destacam um nó central de fragilidade. O método `findTrackByLanguage()` assume inteiramente que a API interna da Google possui uma variável `track.xD.id` ou `track.xD.name`. Como essa sub-chave (`xD`) se trata do reflexo de processos de minificação do Google Compiler (Closure Compiler), esse nome mudará aleatoriamente num ciclo de redeploy futuro do JavaScript nativo do YouTube. Essa arquitetura irá quebrar silenciosamente (Devs), o time de Qualidade não perceberá imediatamente (QA) e o engajamento irá ruir num dia (PM/PO) sob centenas de Uninstalls desavisados.

- **Vulnerabilidade de Isolamento na API Local (Sec + DBA):** A não validação de schema antes da aceitação acoplada ao payload transitado no modelo sem Auth-Token cruzada entre o ambiente Local Storage Limits da aba e as extensões, demonstra possível lacuna para concorrência de desestabilização (Race Conditions) em hardware limitado ou abas pausadas no evento SPA.

## 4. Conclusão e Próximos Passos (Roadmap Executivo de Correção)

A arquitetura do **"TrueAudio"** é robusta na entrega de sua Promessa Principal (Core Value), limpa perante as regras punitivas da Web Store (sancionista pela Manifest V3) e possui desempenho razoável baseada em delegação SPA. Porém, necessitam-se ajustes fundamentais de proteção operacional e ciclo de vida de release (ALM - *Application Lifecycle Management*).

### 🚀 Plano Mestre de Mitigação:
1. **Curto Prazo (Próximos 2 dias):** [CONCLUÍDO]
   - Gerar os KITS visuais faltantes para a publicação do MVP na Loja Oficial (Desbloqueio do PO).
   - Inserir Atributos ARIA/Roles no Toast via JavaScript (`player_main.js`) (Resolução Rápida QA).
2. **Médio Prazo (Próxima Release):** [CONCLUÍDO]
   - Criar uma estratégia resiliente para recuperar o idioma do track ignorando minificações como o `.xD`, mas iterando nas chaves numéricas iteráveis passíveis do objeto de resposta do `getAvailableAudioTracks()`.
   - Implementar o Pipeline no GH Actions do ZIP de deploy (Correção de CI/CD).
   - Configurar Auth Token / Nonce Local em trânsito no `CustomEvent` (Fix de Segurança).
3. **Longo Prazo:** [CONCLUÍDO]
   - Montar um boilerplate com UI Testing Automatizado (Puppeteer/Playwright) e adicionar estrutura analítica nativa anônima perante permissão opt-in. Extrapolar modelo de dados JSON da Storage API.

### 🌟 Entregas Adicionais (Pós-Auditoria)
- **Sincronização Dinâmica (UI & Player API):** Substituição do Dropdown engessado do Popup por um gerador Bottom-Up reativo, que agrupa os códigos dinâmicos contidos no player de um vídeo ativo e injeta organicamente as opções no HTML, preenchendo o `chrome.storage.local`. Soluciona o tracking cego para idiomas sem suporte na listagem fallback anterior (ex: Hindi, Bengali, etc).
