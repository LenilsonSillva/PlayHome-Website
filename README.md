# PlayHome Website

Versão web do PlayHome (Vite + React + Socket.io).

## Jogos

| Jogo | Local | Online |
|---|---|---|
| 🕵️ Impostor | ✅ | ✅ |
| 🔐 Criptografia | ✅ | ✅ (novo) |

## Criptografia Online

Rota do lobby: `/games/secretWord/lobby` (toggle **Jogo Local / Jogo Online**).
Rota da partida: `/games/secretWord/online`.

A partida é 100% controlada pelo backend (`crypto:*`), que envia uma **visão
personalizada por jogador** (`crypto:game-update`) com permissões e
visibilidade de palavras já resolvidas. O site apenas renderiza e emite
intenções.

### Papéis

- 👑 **Host** — cria a sala, configura (modo, grupos, tempos, categorias e as
  flags de visibilidade) e arbitra (operadores, auditoria, próxima rodada).
- 🎖️ **subHost** — cria/lidera um grupo; define o operador do grupo.
- 👤 **Jogadores online** + 🏠 **presenciais** (sem celular, adicionados pelo
  host/subHost) — os 3 cenários convivem na mesma sala.
- 👀 **Espectador** — entra com a partida em andamento.

### Arquivos novos

```
src/types/cryptoOnline.ts                  — tipos do contrato crypto:*
src/pages/games/secretWord/Lobby/index.tsx — wrapper Local/Online
src/pages/games/secretWord/Lobby/OnlineCryptoLobby.tsx — lobby online
src/pages/games/secretWord/OnlineCryptoGame/           — partida online
  ├─ index.tsx                             — roteador de fases
  └─ components/
     ├─ OnlineTeamReveal.tsx               — operadores + quem começa
     ├─ OnlineInfiltrationAction.tsx       — infiltração (aguarde sua vez)
     ├─ OnlineInterceptionAction.tsx       — interceptação (fique atento)
     ├─ OnlineRoundResult.tsx              — ranking + auditoria (host)
     └─ shared.tsx                         — countdown, HUD, scoreboard
```

### Configuração do servidor

```bash
# produção (padrão): https://playhome-backend.onrender.com
# dev local:
VITE_SOCKET_URL=http://localhost:3000 npm run dev
```

> ⚠️ O backend precisa aceitar a origem do site no CORS do Socket.io
> (`server.js`). Ao trocar o domínio do site, adicione-o à lista
> `allowedOrigins` (ou use `EXTRA_CORS_ORIGIN` no backend).

## Rodando

```bash
npm install
npm run dev      # vite
npm run build    # tsc + vite build (verificação de tipos)
```

## Deploy (Vercel)

Build: `npm run build` · Output: `dist/`.

## Publicando no PlayHome-Website

```bash
./sync-website-to-playhome.sh                       # push para o main
WEBSITE_BRANCH=feature/nova-branch ./sync-website-to-playhome.sh   # branch nova
```

O script copia este conteúdo para o repositório
`LenilsonSillva/PlayHome-Website`, commita e faz push **com a sua conta GitHub**
(a branch é criada a partir do `main` quando não existe).

## Criptografia offline (paridade com o PlayHome-RN)

O modo local usa o mesmo motor do app: reducers portados 1:1 em
`src/pages/games/secretWord/GameLogistic/` (infiltração/interceptação,
cronômetro bomba-relógio, pulos, ranking oficial, auditoria com limites,
persistência das palavras usadas).

### Componentes compartilhados (offline ↔ online)

`src/pages/games/secretWord/components/`:

- `WordRevealBox` — palavra "segure para revelar"
- `CryptoHud` — cabeçalho das ações (time da vez + stats + cronômetro)
- `ResultCard` — card de relatório do esquadrão (ranking oficial)
- `RoundAudit` — auditoria/reatribuição de palavras da rodada
- `ranking.ts` — desempate Acertos → Eficiência → Tempo médio

A partida online (`OnlineCryptoGame/`) consome esses mesmos componentes,
renderizando a visão autoritativa do servidor (`crypto:game-update`).
