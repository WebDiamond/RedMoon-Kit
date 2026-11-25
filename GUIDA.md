# Kit redmoon per Claude Code — guida (Windows)

Con questo kit sviluppi i progetti parlando con Claude dentro Claude Code:
tu dai requisiti e decisioni, Claude pianifica le attività,
scrive il codice con subagenti specializzati, lo fa revisionare, apre le pull
request e ti mostra l'app in locale. Niente Docker per gli agenti, niente
chiave API: si usa il tuo abbonamento Claude.

---

## 1. Cosa serve

- Abbonamento Claude **Pro, Max o Ultra** (Claude Code è incluso).
- Account GitHub. Tutto passa da lì: niente Jira o altri gestori di attività.
- Windows 10 (1809 o successivo) o Windows 11.

## 2. Programmi da installare (una volta)

Apri **PowerShell** e lancia, una riga alla volta:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id GitHub.cli -e
```

Poi, a seconda degli stack che userai:

| Per | Comando |
|---|---|
| Stack Firebase (emulatori in locale) | `winget install --id EclipseAdoptium.Temurin.21.JDK -e` poi `npm install -g firebase-tools` |
| Stack Express + Supabase (database in locale) | Docker Desktop, che hai già (va solo acceso quando serve) |
| App mobile | l'app **Expo Go** sul telefono |
| Test end-to-end dell'app web | niente da installare ora: la prima volta Claude lancia `npx playwright install` nella cartella del frontend (scarica i browser di prova, qualche centinaio di MB) |
| Gioco (profilo `gioco-firebase-steam`) | come lo stack Firebase, più Blender e uv (sotto, "Blender per il gioco"); Steam installato per provare la versione per PC |

### Blender per il gioco (solo profilo gioco)

```powershell
winget install --id BlenderFoundation.Blender -e
winget install --id astral-sh.uv -e
```

Chiudi e riapri PowerShell, poi installa l'addon che permette a Claude di
comandare Blender:

```powershell
uvx mcp-for-blender install-addon
```

In Blender: *Edit → Preferences → Add-ons*, attiva **MCP for Blender**.
Nelle preferenze dell'addon lascia **spenta** la condivisione dei contenuti
e, nel pannello laterale, spente le caselle Poly Haven, Sketchfab e Hyper3D
(il kit non le usa). Quando lavori sugli asset: apri Blender, premi `N` nella
vista 3D, scheda **MCP for Blender** → **Start MCP Server**. Claude si
collega da solo (server `blender` del progetto); se non trova Blender te lo
dice.

L'addon esegue il codice Python che Claude gli manda e risponde solo dal tuo
PC (localhost): non aprire la sua porta (9876) verso l'esterno. Git LFS, per
i file pesanti di Blender, è già compreso in Git per Windows.

### GitHub

Chiudi e riapri PowerShell, poi collega GitHub:

```powershell
gh auth login
```

(scegli GitHub.com → HTTPS → accesso con il browser).

## 3. Claude Code

```powershell
irm https://claude.ai/install.ps1 | iex
```

Chiudi e riapri PowerShell, poi `claude`: al primo avvio scegli l'accesso con
il tuo **account Claude** (abbonamento), non con una chiave API.

In alternativa puoi usare la scheda **Code** dell'app desktop di Claude: i
file del kit funzionano allo stesso modo.

## 4. Preparare un progetto

Ogni progetto = un repository GitHub privato (con almeno il README) + una
cartella sul PC.

```powershell
mkdir D:\progetti -Force
gh repo clone <utente>/<repository> D:\progetti\<repository>
robocopy D:\Claude\redmoon-kit D:\progetti\<repository> /E /XF README.md GUIDA.md .gitignore
```

`robocopy` copia anche le cartelle che iniziano con il punto (`.claude`) e
lascia il README e l'eventuale `.gitignore` del tuo repository. Al termine
scrive un riepilogo: è normale.

**Il kit resta solo sul tuo PC.** Al primo `/nuovo-progetto` Claude aggiunge
al `.gitignore` del progetto i file del kit (`CLAUDE.md`, `.claude\`,
`.mcp.json`, `stacks\`, `NOTICE.md`): su GitHub vanno solo il codice, i
documenti in `docs\` e le configurazioni del progetto. Se per sbaglio un file
del kit finisce in un commit, un controllo automatico lo blocca. Puoi
verificarlo con `git status`: i file del kit non devono comparire.

Due conseguenze da sapere:
- **Niente copia di sicurezza su GitHub** della scheda del progetto e delle
  decisioni (`CLAUDE.md`) né delle skill che Claude adatta al progetto:
  ogni tanto copia la cartella del progetto su un disco esterno o nel cloud.
- **Su un altro PC** clonando il repository il kit non c'è: lo ricopi con
  `robocopy` e riporti il tuo `CLAUDE.md` dalla copia di sicurezza.

La copia in `D:\Claude\redmoon-kit` resta il modello pulito: se un giorno
fai un altro progetto, parti da lì e non dalla copia dentro questo.

## 5. Inserire i requisiti

Cinque modi, scegli quello più comodo (D ed E servono a rifare un progetto
che esiste già).

**A. Scrivi il file prima di avviare Claude.** Nel repository c'è il modello
`docs\requisiti.md` con le sezioni (obiettivo, ruoli, entità, regole,
schermate, agente, fuori perimetro, domande aperte). Compilalo con un editor,
anche il Blocco note, togli le sezioni che non servono e salva. Poi `claude`
e `/nuovo-progetto`: lo legge da lì.

**B. Dai a Claude un file che hai già.** Durante `/nuovo-progetto`, quando
chiede i requisiti, scrivi dove si trova:

```
i requisiti sono in D:\Documenti\specifiche-cliente.pdf
```

Accetta `.md`, `.txt` e `.pdf`: Claude lo legge, lo riporta nel formato di
`docs\requisiti.md` e ti mostra i punti non chiari.

**C. Descrivili a parole in chat.** Anche appunti sparsi o il messaggio del
cliente incollato così com'è: Claude fa le domande che servono (ruoli,
regole, cosa resta fuori) e scrive lui `docs\requisiti.md`. È il modo
migliore se hai solo un'idea di massima.

**D. Parti da un progetto esistente.** Se stai rifacendo un progetto, dai a
Claude il vecchio codice come fonte dei requisiti:

```
i requisiti ricavali dal progetto in D:\progetti\_partenza\vecchio-gestionale
```

oppure un repository GitHub (`<utente>/<repo>`): lo scarica in
`D:\progetti\_partenza\`. Tieni il progetto di partenza **fuori** dalla
cartella del nuovo: Claude lo legge soltanto, senza modificarlo né avviarlo,
e non apre i suoi file con le chiavi. Ne ricava funzioni, ruoli, dati e
regole di business, ognuna con il file da cui viene, e ti mostra una tabella
"Da decidere" (codice morto, funzioni a metà, regole che si contraddicono):
per ogni voce scegli tieni, togli o cambia. Il nuovo progetto si scrive da
capo nello stack scelto, usando il vecchio solo come riferimento. Lo
spostamento dei dati dal vecchio al nuovo non è compreso. Per i progetti
della società, verifica prima che sia permesso usare Claude su quel codice.

**E. Rifare da zero un progetto nello stesso repository.** Se vuoi tenere lo
stesso repository e rifarne il contenuto da capo:

1. Clona il repository del progetto esistente e copiaci dentro il kit, come al
   passo 4 (`gh repo clone` e `robocopy`).
2. Avvia `claude` e lancia `/nuovo-progetto`: Claude vede che c'è già codice e
   ti chiede se è un rifacimento da zero. Rispondi di sì.
3. Claude mette un'etichetta `partenza` sulla versione attuale (resta per
   sempre nella cronologia) e ne crea una copia di sola consultazione fuori
   dal repository, in `D:\progetti\_partenza-<repository>`. Da lì ricava i
   requisiti come nel modo D, con la tabella "Da decidere".
4. Ti avvisa se il vecchio progetto si pubblica da solo a ogni modifica di
   `main` (per esempio con flussi di GitHub Actions, Vercel, Netlify): quei
   collegamenti vanno spenti, altrimenti il progetto nuovo a metà andrebbe
   online al posto di quello vecchio.
5. La prima pull request toglie il vecchio codice da `main` (ti mostra prima
   l'elenco) e prepara la struttura nuova. Il sito o l'app vecchia resta
   online com'è finché non pubblichi la nuova versione.
6. Se nel frattempo serve una correzione urgente al vecchio progetto, Claude
   la fa su un ramo `manutenzione` partito dall'etichetta `partenza`, separato
   dal lavoro nuovo.

In tutti i casi, prima di pianificare Claude ti mostra i requisiti e segna le
domande aperte: finché non le chiarisci, non inventa le risposte.

**Per un gioco** i requisiti sono diversi da un gestionale. Conviene
descrivere: genere e vista (piattaforme laterale, dall'alto, isometrico), cosa
fa il giocatore minuto per minuto, come si vince e si perde, livelli o
partite, personaggi e nemici, stile grafico (pixel art o disegnato, 2–3
giochi di riferimento, colori), comandi (tastiera, controller), cosa va
online (salvataggi, classifiche) e cosa no. Claude ne ricava anche la guida
di stile degli asset.

**Modifiche successive** (aggiungere, cambiare o togliere funzioni):
`/aggiorna-requisiti` e descrivi la modifica, oppure modifica tu il file e
diglielo. Claude confronta la nuova versione con quella già pianificata e
prepara attività solo per le differenze; togliere una funzione non cancella
mai dati senza la tua conferma.

## 6. Seguire l'avanzamento

Non serve nessun servizio esterno: il piano e lo stato delle attività stanno
nel file `docs\piano.md` del repository, che Claude aggiorna a ogni passo.

- **In Claude Code**: scrivi `/stato` (o "a che punto siamo?"). Claude ti
  mostra cosa è fatto, cosa è in corso o in revisione, cosa è bloccato e le
  prossime tre attività, con le pull request aperte.
- **Su GitHub**, anche dal telefono: apri `docs/piano.md` nel repository per
  la tabella completa; la scheda **Pull requests** mostra il lavoro in
  revisione, con la descrizione e l'esito dei controlli.

Ogni attività (Story) ha un riferimento S1, S2, S3… che ritrovi nel nome del
ramo (`S12-elenco-clienti`), nei commit e nel titolo della pull request.
Stati: *Da fare*, *In corso*, *In revisione*, *Fatta*, *Bloccata* (con il
motivo).

## 7. Primo giro

Nella stessa sessione di Claude Code:

| Scrivi | Cosa succede |
|---|---|
| `/nuovo-progetto` | scegli uno dei 13 profili (web, mobile o entrambi; Firebase o Express + Supabase; con o senza agente AI; oppure il gioco 2D per web e Steam), Claude compila `CLAUDE.md` e apre la prima pull request |
| `/pianifica` | il piano delle Story: lo approvi tu, poi Claude lo scrive in `docs\piano.md` |
| `/prossima` | sviluppa la Story successiva fino alla pull request e ti chiede se unirla |
| `/anteprima` | avvia l'app sul PC e ti dà gli indirizzi da aprire |
| `/stato` | a che punto siamo |
| `/aggiorna-requisiti` | aggiungere, cambiare o togliere funzioni |
| `/configura-deploy` | preparare una volta la pubblicazione con approvazione (sezione 8) |
| `/rilascia` | pubblicare online o sugli store, solo quando lo chiedi tu (sezione 8) |
| `/impara` | far crescere il kit di questo progetto: Claude propone cosa ricordare (tue correzioni, problemi risolti, regole del dominio) e dopo il tuo sì lo scrive nelle skill |

**Revisione.** Prima di ogni pull request lavorano il `revisore` e, quando
la modifica li riguarda, i revisori specializzati (tipi TypeScript, React,
database, sicurezza, errori silenziosi, copertura dei test), in parallelo.
Claude ti riporta i problemi trovati e li fa correggere prima di chiederti
di unire.

**Controlli automatici.** Alcuni blocchi scattano da soli: niente commit
diretti su `main`, niente push forzati, niente commit con file `.env`, chiavi
o token, né con i file del kit; a fine turno Claude controlla i tipi TypeScript delle app che ha
modificato e corregge gli errori prima di chiudere. Se vedi un messaggio
`[kit redmoon] … bloccato`, è uno di questi controlli: Claude deve correggere,
non aggirarlo. Servono Node.js e Git (passo 2).

I comandi sono scorciatoie: puoi anche scrivere normalmente ("andiamo avanti
con la prossima", "fammi vedere l'app").

**Il kit cresce con il progetto.** Claude non ricorda nulla da una sessione
all'altra: sa solo ciò che è scritto nei file della cartella. Per questo, a
fine Story o a fine giornata, scrivi `/impara` (o "ricordati questo"): Claude
ti propone le lezioni da salvare e dove, e scrive solo quelle che approvi.
Le regole del progetto finiscono in `.claude\skills\progetto\SKILL.md`, che
tutti i subagenti leggono per prima. Restano solo sul tuo PC, nella copia del
kit di quel progetto. Se una lezione vale per tutti i progetti, Claude te lo
segnala e, se glielo chiedi, la riporta nel modello `D:\Claude\redmoon-kit`.

Per riprendere un altro giorno: apri PowerShell nella cartella del progetto,
`claude`, e scrivi "riprendiamo". Claude rilegge `CLAUDE.md` e
`docs\piano.md` e ti dice dove eravate.

### Provare in locale (senza pubblicare)

Tutto quello che provi sul PC resta sul PC: non va online e non costa nulla
oltre all'abbonamento.

- Scrivi `/anteprima` (o "fammi vedere l'app"): Claude avvia tutto sul tuo PC
  e ti dà gli indirizzi da aprire nel browser.
- **Stack Firebase**: usa gli emulatori di Firebase (database, accessi e
  funzioni finti, solo locali). Serve il JDK 21 (passo 2).
- **Stack Express + Supabase**: usa Supabase in locale, quindi **Docker
  Desktop dev'essere acceso**.
- **App mobile**: la apri sul telefono con Expo Go (o con una build di
  sviluppo), collegato alla stessa rete Wi-Fi del PC.
- **Gioco**: nel browser su http://localhost:5173; la versione per PC si
  apre in una finestra a parte (con Steam aperto funzionano anche obiettivi e
  accesso con Steam; senza, il gioco parte lo stesso). Vale anche "pubblica":
  nel gioco devi dire dove, "pubblica web" o "pubblica steam", e su Steam la
  build arriva solo sul ramo di prova.

Anche **unire su `main` non pubblica nulla**: GitHub esegue solo i controlli
(sui repository privati usa un po' dei minuti gratuiti mensili di GitHub
Actions) e su expo.dev resta un'approvazione in sospeso, che puoi ignorare o
rifiutare. Si va online solo quando scrivi "pubblica" o `/rilascia`, premi
**Run workflow** su GitHub o approvi su expo.dev (sezione 8). Finché non hai
fatto `/configura-deploy`, i collegamenti ai servizi online non esistono
proprio, quindi una pubblicazione per sbaglio non è possibile.

### Lavorare a un gioco

Con il profilo `gioco-firebase-steam` il giro è lo stesso, con due
lavoratori in più: `gioco` (programma il gioco) e `artista-2d` (crea la
grafica in Blender).

1. **Guida di stile prima di tutto.** La prima Story degli asset scrive
   `assets-src\STILE.md` (colori, vista, dimensioni, contorni) e crea un
   asset di prova, di solito il personaggio principale. Guardi l'anteprima
   e dici cosa cambiare: tutti gli asset successivi seguono quella guida.
2. **Prima lo scheletro, poi la grafica.** Il gioco parte subito con forme
   colorate al posto delle immagini, così provi i comandi presto. Ogni asset
   è una Story a parte; quando è pronto, il gioco lo usa al posto del
   segnaposto.
3. **Blender aperto per le Story degli asset.** Prima di `/prossima` su una
   Story di grafica apri Blender e premi **Start MCP Server** (tasto `N` →
   scheda *MCP for Blender*). Puoi guardare Claude costruire il modello
   nella finestra di Blender; non chiudere Blender e non lavorare nella sua
   scena mentre lui lavora. Se Blender non risponde, Claude si ferma e te lo
   chiede.
4. **Revisione con le immagini.** Ogni asset ha un'anteprima (`anteprima.png`,
   su sfondo a scacchi); il revisore la confronta con la Story e la guida di
   stile, e nella pull request su GitHub vedi le immagini nella scheda dei
   file. Unisci solo se ti piacciono: se no dì cosa cambiare e Claude rigenera.
5. **Prova a mano.** Il divertimento non si controlla in automatico: dopo
   ogni Story di gioco Claude ti dice cosa provare, con tastiera e
   controller.

I file pesanti (Blender e immagini) vanno su GitHub con Git LFS, già
impostato da `/nuovo-progetto`: lo spazio gratuito è limitato (sezione 9),
quindi meglio poche versioni buone che tante prove.

## 8. Pubblicare (deploy)

Il kit usa il modo **unione + approvazione**:

| | Quando unisci una pull request su `main` | Va online quando |
|---|---|---|
| Web (sito, backend, database) | GitHub controlla che le parti cambiate si installino, compilino e superino i test. **Non pubblica nulla** | scrivi a Claude "pubblica" (o `/rilascia web`), oppure premi **Run workflow** su GitHub → Actions → *Pubblica web* |
| App mobile | se hai cambiato l'app, Expo prepara il flusso e si ferma su **Approvazione** | approvi su expo.dev; Expo compila e invia agli store di test, oppure pubblica un aggiornamento immediato se non serve una nuova build |

Unire non significa pubblicare: puoi unire dieci Story e pubblicarle tutte
insieme quando vuoi. Se cambi solo documenti non parte nessun controllo, e
le unioni che non toccano l'app mobile non creano approvazioni su expo.dev.

La configurazione si fa **una volta per progetto** con `/configura-deploy`:
Claude scrive i file dei flussi e ti dice passo passo cosa fare sui siti dei
servizi. Le chiavi le inserisci sempre tu, con comandi come questo (il
valore non compare a schermo e non passa dalla chat):

```powershell
gh secret set NOME_DEL_SEGRETO
```

### 8.1 Stack Firebase

Una volta sola (dentro `/configura-deploy`):

1. Crea il progetto su Firebase e attiva il piano **Blaze** (a consumo).
2. Su Google Cloud → IAM → *Account di servizio* crea `github-deploy` con i
   ruoli che Claude ti elenca, poi *Chiavi → Aggiungi chiave → JSON*.
3. Salva la chiave nei segreti di GitHub e cancella il file:

   ```powershell
   Get-Content C:\percorso\chiave.json -Raw | gh secret set FIREBASE_SERVICE_ACCOUNT
   Remove-Item C:\percorso\chiave.json
   ```

4. Di' a Claude l'ID del progetto Firebase e la configurazione dell'app web
   (Firebase → Impostazioni progetto → Le tue app): non sono segreti, li
   salva lui come variabili del repository.
5. Solo nei progetti con agente AI:
   `firebase functions:secrets:set ANTHROPIC_API_KEY`.

Ogni volta: "pubblica". Claude avvia il flusso, lo segue fino alla fine, apre
il sito per controllare che risponda e segna il rilascio in `docs\piano.md`.
Per tornare indietro: console di Firebase → Hosting → Cronologia dei rilasci.

### 8.2 Stack Express + Supabase

Il database va su **Supabase** online; backend e sito, salvo scelte diverse,
su **Render** (render.com). Una volta sola (dentro `/configura-deploy`):

1. **Supabase**: crea il progetto, annota la password del database, crea un
   *Access Token* (Account → Access Tokens) e salvali:

   ```powershell
   gh secret set SUPABASE_ACCESS_TOKEN
   gh secret set SUPABASE_DB_PASSWORD
   ```

   Il *Project ref* (l'identificativo del progetto) lo dai a Claude.
2. **Render**: collega il repository e crea un *Web Service* per il backend
   (cartella `app/backend`) e, se c'è il sito, uno *Static Site* (cartella
   `app/frontend`, pubblicazione `dist`). Claude ti dice i comandi di build
   e i nomi delle variabili d'ambiente; i valori li inserisci tu su Render.
3. Su entrambi imposta **Auto-Deploy: Off**, copia il *Deploy Hook* da
   Settings e salvalo:

   ```powershell
   gh secret set RENDER_DEPLOY_HOOK_BACKEND
   gh secret set RENDER_DEPLOY_HOOK_WEB
   ```

Ogni volta: "pubblica". Il flusso applica le migrazioni al database online e
poi aggiorna backend e sito su Render. Il piano gratuito di Render mette in
pausa i servizi poco usati: per un cliente conviene quello a pagamento.

### 8.3 App mobile (entrambi gli stack)

**Una volta sola, prima del primo invio agli store** (li fai tu, perché
servono password e verifica in due passaggi; Claude ti guida passo passo):

1. **Account**: Apple Developer Program e Google Play Console (a pagamento),
   più un account Expo (gratuito).
2. **Crea l'app negli store**: in App Store Connect (annota l'*Apple ID*
   numerico dell'app e dallo a Claude) e in Google Play Console.
3. **Chiave per Google Play**: in Google Cloud crea un *account di servizio*
   e scarica la sua chiave JSON; in Play Console → *Utenti e autorizzazioni*
   invita l'email dell'account di servizio con il permesso di rilasciare.
4. **Chiave per Apple**: in App Store Connect → *Utenti e accessi →
   Integrazioni → API App Store Connect* genera una chiave con ruolo *App
   Manager*; scarica il file `.p8` (si scarica una sola volta) e annota
   *Key ID* e *Issuer ID*.
5. **Carica tutto su Expo**, dalla cartella dell'app:

   ```powershell
   cd D:\progetti\<repository>\app\mobile
   npx eas-cli login
   npx eas-cli credentials
   ```

   Scegli Android → *Google Service Account Key* (il file JSON) e lascia che
   EAS generi il keystore; poi iOS → *App Store Connect API Key* (il file
   `.p8` con Key ID e Issuer ID) e lascia che EAS gestisca certificati e
   profili. Le chiavi restano sui server di Expo: dopo puoi spostare i file
   fuori dal progetto. Non vanno mai in chat né nel repository.
6. **Primo pacchetto Android a mano**: Google accetta gli invii automatici
   solo dal secondo in poi. Claude lancia la prima build Android, tu scarichi
   il file `.aab` dal link e lo carichi nel test interno di Play Console.

7. **Collega Expo a GitHub** (dentro `/configura-deploy`): su expo.dev →
   progetto → impostazioni *GitHub*, installa l'app di Expo e scegli il
   repository; se chiede una cartella di base, indica `app/mobile`.

**Ogni rilascio:**

1. Unisci le Story su `main`: su expo.dev → progetto → *Workflows* compare
   "Pubblica app" in attesa di approvazione.
2. Approvi. Se è cambiato codice nativo Expo compila e invia a **TestFlight**
   (iPhone) e al **test interno di Google Play**; altrimenti pubblica un
   aggiornamento immediato, che gli utenti ricevono alla prossima apertura.
3. Provi l'app sul telefono.
4. La pubblicazione al pubblico la fai tu dalle console di Apple e Google; la
   prima volta compili anche le schede dell'app (descrizione, screenshot,
   privacy).

Senza `/configura-deploy`, `/rilascia mobile` fa le stesse build a mano.

### 8.4 Gioco su Steam

Il gioco ha un solo flusso, *Pubblica gioco*, con tre destinazioni: `web`
(Firebase, come la sezione 8.1), `steam` o `tutto`. Scrivi a Claude
"pubblica web" o "pubblica steam", oppure premi **Run workflow** su GitHub e
scegli. Su Steam la build arriva su un **ramo beta**: la provi tu dal client
Steam (gioco → Proprietà → Beta) e la rendi pubblica da Steamworks.

**Una volta sola** (dentro `/configura-deploy`):

1. **Steamworks**: iscriviti come partner e paga Steam Direct per il gioco;
   crea l'app, il depot Windows e un ramo beta (es. `beta`, in *SteamPipe →
   Builds*). Dai a Claude AppID, ID del depot e nome del ramo (non segreti).
2. **Account di caricamento**: crea un account Steam nuovo, solo per
   caricare le build (non usare il tuo). In Steamworks → *Utenti e permessi*
   aggiungilo con i soli permessi *Modifica metadati dell'app* e *Pubblica
   modifiche su Steam*. Steam Guard via email.
3. **steamcmd** sul PC: scarica `steamcmd.zip` dalla documentazione di
   Steamworks (pagina *Caricamento su Steam*) ed estrailo in `C:\steamcmd`.
   Poi:

   ```powershell
   cd C:\steamcmd
   .\steamcmd.exe +login <account-di-caricamento> +quit
   ```

   Inserisci password e codice di Steam Guard quando li chiede. Poi, dalla
   cartella del progetto, salva l'accesso nei segreti di GitHub:

   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\steamcmd\config\config.vdf")) | gh secret set STEAM_CONFIG_VDF
   gh secret set STEAM_USERNAME
   ```

4. **Accesso dei giocatori con Steam**: in Steamworks → *Utenti e permessi →
   Gestisci gruppi* crea una chiave **Publisher Web API** e impostala nel
   backend:

   ```powershell
   firebase functions:secrets:set STEAM_WEB_API_KEY
   ```

   Su Google Cloud → IAM dai all'account di servizio delle funzioni il ruolo
   *Service Account Token Creator* (Claude ti dice quale account).

**Quando il caricamento smette di funzionare** con un errore di accesso o
"License expired": l'accesso salvato è scaduto. Ripeti il passo 3 (accesso
con steamcmd e nuovo `gh secret set STEAM_CONFIG_VDF`).

**Cosa resta a te su Steam**: pagina dello store (descrizione, immagini,
almeno 5 screenshot, trailer, questionario sui contenuti, compresa la
dichiarazione sull'uso dell'IA per gli asset), pagina "Coming Soon" pubblica
almeno 2 settimane prima dell'uscita, revisione di Valve, prezzo e uscita.
Dettagli nella skill `steam-release`.

## 9. Costi

- Lo sviluppo con Claude Code rientra nei **limiti del tuo abbonamento**
  (si azzerano ogni 5 ore e ogni settimana; `/usage` mostra a che punto sei).
  Per consumarne meno, i revisori specializzati (tipi, React, database,
  errori silenziosi, test) e chi scrive i test end-to-end usano Sonnet, un
  modello più leggero; chi programma, il revisore principale, il revisore
  di sicurezza e il pianificatore usano il modello della sessione. Per
  cambiarlo: riga `model:` in `.claude\agents\<nome>.md` (`sonnet`, `opus`,
  `haiku` o `inherit` = come la sessione).
- GitHub Actions: i controlli girano solo sulle parti cambiate e tengono in
  cache le dipendenze, così si consumano pochi minuti; nel gioco i file
  `.blend` non vengono mai scaricati nei controlli.
- I profili **"+ agente"** costruiscono un'applicazione che, quando gira
  davvero, chiama l'API di Claude: quello è consumo a **credito API** (Console
  di Anthropic), pagato da chi usa l'applicazione. In sviluppo e nei test
  l'agente usa un modello finto e non consuma nulla.
- **Gioco su Steam**: Steam Direct costa 100 USD per gioco, recuperati dopo
  1.000 USD di incassi; Valve trattiene il 30% delle vendite. Git LFS su
  GitHub Free include 10 GiB di spazio e 10 GiB di download al mese per i
  file pesanti di Blender (ogni versione conta).

## 10. Liberare spazio dal vecchio redmoon

Se non usi più i container di redmoon:

```powershell
cd D:\redmoon
docker compose down -v
docker system prune -a --volumes -f
```

La cartella resta: potrai riprenderla se un giorno vorrai agenti che lavorano
da soli.

## 11. Problemi comuni

| Problema | Soluzione |
|---|---|
| `claude` non riconosciuto | chiudi e riapri PowerShell; se persiste, reinstalla con il comando del passo 3 |
| `gh` chiede di accedere | `gh auth login` |
| Emulatori Firebase: errore Java | installa il JDK 21 (passo 2) e riapri PowerShell |
| `supabase start` non parte | apri Docker Desktop e aspetta "Engine running" |
| Il telefono non vede l'app | stessa Wi-Fi del PC; consenti Node.js nel firewall sulle reti private |
| Limite dell'abbonamento raggiunto | aspetta il reset indicato da `/usage`, oppure passa a un piano superiore |
| Claude dice che Blender non risponde | apri Blender, tasto `N` → *MCP for Blender* → **Start MCP Server**; se il server `blender` non compare in `/mcp`, chiudi e riapri Claude Code nella cartella del progetto |
| `uvx` non riconosciuto | `winget install --id astral-sh.uv -e`, poi chiudi e riapri PowerShell |
| Sul PC le immagini del gioco sono file di poche righe | mancano i file di Git LFS: `git lfs install` poi `git lfs pull` nella cartella del progetto |
| GitHub avvisa che lo spazio LFS è finito | troppe versioni di file pesanti: chiedi a Claude di vedere quali; si può acquistare spazio in più o ripulire la cronologia (operazione delicata, solo con te) |
| Pubblicazione su Steam fallita per l'accesso o "License expired" | l'accesso salvato è scaduto: ripeti il passo 3 della sezione 8.4 |
| La versione per PC si apre ma Steam non funziona | Steam dev'essere aperto e con l'account che possiede il gioco (o la chiave di prova); in sviluppo serve `STEAM_DEV_APP_ID=480` nel `.env` di `app\desktop` |
