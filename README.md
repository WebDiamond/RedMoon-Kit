# RedMoon kit

![logo](logo.jpg)

Il flusso di redmoon (requisiti → piano → sviluppo → revisione → pull
request → anteprima → rilascio) portato dentro **Claude Code**: niente
container né chiave API, si lavora parlando con Claude.

Come installarlo e usarlo: **[GUIDA.md](GUIDA.md)**.

## Contenuto

| Percorso | Cosa |
|---|---|
| `CLAUDE.md` | scheda del progetto e regole di lavoro; Claude lo legge a ogni sessione. Come tutto il kit resta solo in locale (escluso con `.gitignore` nel progetto) |
| `stacks/` | 13 profili di stack: 12 per applicazioni (web / mobile / web + mobile × Firebase / Express + Supabase × con o senza agente AI) più `gioco-firebase-steam` (gioco 2D Phaser con asset da Blender, web e Steam) |
| `.claude/agents/` | subagenti di sviluppo (`pianificatore`, `backend`, `frontend`, `mobile`, `agente-ai`, `gioco`, `artista-2d`, `e2e-runner`), il `revisore` e sei revisori specializzati di sola lettura (`typescript-reviewer`, `react-reviewer`, `database-reviewer`, `security-reviewer`, `silent-failure-hunter`, `pr-test-analyzer`). I revisori specializzati, tranne `security-reviewer`, ed `e2e-runner` usano Sonnet per consumare meno abbonamento; gli altri il modello della sessione |
| `.claude/skills/` | comandi (`/nuovo-progetto`, `/pianifica`, `/prossima`, `/stato`, `/anteprima`, `/aggiorna-requisiti`, `/configura-deploy`, `/rilascia`, `/impara`), regole di lavoro e tutte le skill tecniche e di dominio |
| `.claude/settings.json` | impedisce a Claude di leggere file con segreti (`.env`, chiavi) e registra gli hook |
| `.claude/hooks/` | controlli automatici: blocco di commit su `main`, push forzati, commit con segreti e commit con file del kit; controllo dei tipi TypeScript a fine turno |
| `.mcp.json` | server MCP del progetto: vuoto, tranne nel profilo gioco (Blender) |
| `docs/` | modelli di `requisiti.md` e `piano.md` |
| `NOTICE.md` | provenienza e licenza del materiale preso da altri progetti (ECC, MIT) |
| `scripts/env-supabase-locale.mjs` | scrive i `.env` locali per Supabase in locale senza mostrare le chiavi |
| `scripts/asset/` | impacchetta e controlla gli asset del gioco prodotti con Blender |

## Skill incluse

Tutte quelle raccolte con redmoon, senza selezione: Claude carica quelle che
servono in base all'attività.

- **Flusso di lavoro**: git-workflow, planning, requisiti-da-codice, pr-review, local-preview, firebase-release, eas-release, impara
- **Web**: reactjs-web, security-reactjs-web, firebase-web, supabase-web, react-patterns, react-testing, react-performance, frontend-a11y, e2e-testing
- **Mobile**: expo-mobile, security-expo-mobile, firebase-mobile, supabase-mobile, mobile-store-compliance, react-native-patterns
- **Backend**: firebase-functions-backend, firebase-storage, security-firebase-deploy, firebase-deploy, express-supabase-backend, security-express-supabase, supabase-dev-pattern, postgres-patterns, database-migrations, nodejs-express-nosql, security-nodejs-nosql, api-design, error-handling, typescript-patterns
- **Agente AI nell'applicazione**: app-agent, agent-security-hardening
- **Dominio**: custom-app, saas-gestionale, data-charts, maps-geolocation, marketplace-escrow, ocr-document-intake, svg-assets, phaser-game, blender-assets-2d, steam-release, solidity-contracts, web3-dapp
- **Infrastruttura**: docker-containers, aws-ec2-deploy

Le skill e i subagenti presi da ECC sono in inglese e iniziano con una nota
sulle regole del kit, che hanno la precedenza (dettagli in `NOTICE.md`).

## Cosa non è verificato

Il kit è stato scritto e controllato nella struttura (formato di skill e
subagenti, profili, script; gli hook sono provati con casi di test e su un
progetto Vite reale), ma non ancora usato su un progetto reale con
Claude Code: il primo progetto va seguito da vicino e il kit corretto dove
serve. Le versioni delle librerie citate nelle skill sono di novembre 2026:
Claude le ricontrolla prima di usarle.

Per il profilo gioco: gli script degli asset e il modello `genera.py` sono
stati provati (render di Blender senza finestra, atlante, manifesto,
controlli); l'esempio dell'involucro Electron supera i suoi test. Non sono
stati provati dal vivo il collegamento MCP con un Blender aperto, il
caricamento su Steam dal flusso di GitHub e l'accesso con l'identità Steam.
