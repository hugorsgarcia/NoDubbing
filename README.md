<div align="center">
  <img src="icons/icon128.png" alt="TrueAudio Logo" width="128" />
  <h1>🎧 TrueAudio</h1>
  <p><strong>A Chrome Extension that forces YouTube videos to play in your preferred audio language.</strong></p>
</div>

---

## 🚀 O que é o TrueAudio?
O YouTube recentemente lançou a funcionalidade de **Dublagem Automática (AI Dubbing)**. Isso faz com que vídeos estrangeiros, especialmente tutoriais técnicos ou conteúdo original, sejam reproduzidos automaticamente com dublagens robóticas, muitas vezes difíceis de desabilitar de forma permanente. 

O **TrueAudio** soluciona isso! Ele reconhece *dinamicamente* quais são as faixas de áudio nativas de um vídeo e força o YouTube a usar sempre a sua escolhida (ex: Inglês, Espanhol, ou o Idioma Original do criador de conteúdo).

---

## ⚙️ Funcionalidades
- **Detecção Rica (Bottom-Up):** A extensão não conta mais com uma listagem "fingida" e fixa de idiomas; ela detecta os metadados do vídeo que está passando e mostra exatamente quais idiomas estão disponíveis no momento para você escolher (Hindi, Coreano, etc).
- **Extremamente Leve:** Não exige permissões invasivas de rede. Tudo é rodado estritamente na DOM da página do YouTube com *Event Dispatchers* assíncronos que não sobrecarregam sua aba.
- **Resiliência Anti-Atualização:** Ignora ofuscação de código do Google (Closure Compiler), encontrando os objetos de áudio através da busca em profundidade de instâncias. Isso significa que a extensão não vai parar de funcionar silenciosamente de uma semana para a outra!
- **Privacidade em 1º Lugar:** Nós respeitamos a LGPD/GDPR. Não injetamos iframes ou pixels de rastreamento estritos. O Analytics é totalmente `Desabilitado (Opt-out)` por padrão!

---

## 🛠️ Tutorial de Instalação (Fácil)

Como a versão está em desenvolvimento antes de ir para a Google Chrome Store, você pode instalar localmente no seu navegador em menos de 1 minuto:

1. Acesse o painel de **Releases** na aba à direita deste repositório.
2. Baixe a última versão compactada chamada `TrueAudioRelease.zip` e a extraia em uma pasta de sua escolha. (*Você também pode baixar diretamente o repositório como código-fonte*).
3. Abra o Google Chrome e digite na barra de endereços: `chrome://extensions/`
4. No canto superior direito da página, ative a opção **Modo do desenvolvedor** (Developer mode).
5. Clique no botão superior à esquerda **"Carregar sem compactação" (Load unpacked)**.
6. Selecione a pasta que você acabou de extrair!

Pronto! Acesse o YouTube e clique no botão do **TrueAudio** na sua de plugins para abrir o Popup de configurações. Mude para "Inglês" e ele será sempre lembrado!

---

## 💻 Para Desenvolvedores (Build & Deploy)

O ciclo de vida da aplicação é automatizado com maestria no **GitHub Actions**. Quando você estiver validado ou testado seus pacotes na branch `development`, realizar um sistema de *Git Tag* engatilhará uma release pronta para ZIP:

```bash
git checkout main
git tag v1.0.1
git push origin v1.0.1
```
Isto fará com que a nuvem gere um `.zip` apenas com os arquivos necessários, descartando as pastas `/tests`, configs do Github e arquivos md extras.

### Permissões e Segurança Pura
- `content_bridge.js` cria o token (`dataset.nonce`) e o injeta na camada main world antes de plugar o hook do Player Engine nativo (`player_main.js`).
- O popup utiliza cache efêmero de janela `chrome.storage.local` para hidratar sua UI interativa.
- Nenhuma permissão host indesejada: Acesso irrestrito a `https://www.youtube.com/*`.
