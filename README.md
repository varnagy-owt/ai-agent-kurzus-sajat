# Plantbase

Parancssori AI agent, amely természetes nyelvű kérdéseket fordít SQL-re egy növénykatalógus (`products` tábla) felett, read-only lefuttatja, és magyar nyelvű választ ad. Az agent Anthropic Claude-ot használ, a lekérdezéseket a `runSql` és `listCategories` toollal hajtja végre.

---

## Gyors indítás

### 1. Környezeti változók

```bash
cp .env.example .env
```

Töltsd ki a `.env` értékeit:

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://plantbase_rw:<jelszo>@localhost:5432/plantbase
DATABASE_URL_READONLY=postgresql://plantbase_ro:<jelszo>@localhost:5432/plantbase
```

### 2. Adatbázis indítása

```bash
docker compose up -d
```

### 3. Függőségek telepítése

```bash
pnpm install
```

### 4. Prisma migráció és seed

```bash
pnpm nx run db:migrate   # schema alkalmazása
pnpm nx run db:seed      # ~30 növény betöltése
```

### 5. CLI használata

```bash
# Egyszeri kérdés
pnpm nx run cli:start -- ask "Milyen macskabiztos növény van raktáron 5000 Ft alatt?"

# Interaktív mód (kilépés: exit)
pnpm nx run cli:start -- ask

# Rendszer-prompt megjelenítése minden LLM-hívás előtt
pnpm nx run cli:start -- ask "Melyik kategóriák vannak?" --show-prompt
```

---

## Architektúra

```
apps/
  cli/          — Commander.js CLI, interaktív readline mód
packages/
  core/         — askAgent loop, runSql, listCategories, Logger, system prompt
  db/           — Prisma schema, migrációk, seed
```

### Biztonsági elv — két DB-kapcsolat

| Kapcsolat | Felhasználó | Jogosultság | Hol használják |
|-----------|-------------|-------------|----------------|
| `DATABASE_URL` | `plantbase_rw` | teljes írás-olvasás | Prisma migrációk, seed |
| `DATABASE_URL_READONLY` | `plantbase_ro` | csak SELECT | agent `runSql` / `listCategories` tool |

Az agent fizikailag nem tud adatot módosítani: a read-only DB-felhasználón kívül az alkalmazás is regex-guarddal blokkolja a nem-SELECT lekérdezéseket.

### Agent tool-use loop

```
felhasználó kérdés
  → LLM (claude-sonnet-4-6) tool_use döntés
    → runSql(query) | listCategories()
      → DB eredmény visszaküldve az LLM-nek
        → természetes nyelvű válasz
```

Minden lépés JSONL-be logolódik (`logs/<timestamp>.jsonl`).

---

## Naplózás

Minden agent-futás saját fájlba ír: `logs/2026-07-04T16-00-00.jsonl`.

Egy bejegyzés típusai:

| `type` | Tartalom |
|--------|----------|
| `user` | A felhasználó kérdése |
| `assistant_response` | LLM válasz, stop_reason, token-felhasználás |
| `tool_call` | Generált SQL vagy tool neve |
| `tool_result` | Visszaadott sorok száma |
| `tool_error` | Hibaüzenet (pl. rossz SQL) |
| `final_answer` | A végső természetes nyelvű válasz |

A log alapján visszakövethető: melyik SQL futott, hány tokent fogyasztott, és milyen végeredmény keletkezett.

---

## docs/ áttekintés

| Fájl | Tartalom |
|------|----------|
| `brs-plantbase.md` | Üzleti követelmény-leírás (scope, FR/NFR, KPI-k) |
| `roi.md` | ROI-levezetés 5 fős lakberendező irodára (~487 500 Ft/év megtakarítás) |
| `system-prompt.md` | Az agent system promptja + javítások és indoklás szekció |
| `stack.md` | Technológiai stack (Nx, Prisma, Anthropic SDK, pg, Vitest…) |
| `architektura.md` | Monorepo-struktúra, csomagok felelőssége, adat-folyam |
| `konvenciok.md` | TypeScript-konvenciók, XML prompt-struktúra, Git-szabályok |
| `dev-workflow.md` | Fejlesztési workflow, branch-stratégia, commit-üzenetek |
| `setup-instructions.md` | Lépésről lépésre telepítési útmutató |

---

## Telepített Claude Code pluginek

| Plugin | Indoklás |
|--------|----------|
| **superpowers** | Skill-alapú workflow: a fejlesztői sessionök strukturált skill-ekkel indulnak (brainstorming, systematic-debugging), ami megakadályozza az ad-hoc, fegyelmezetlen implementációt. |
| **commit-commands** | A `/commit` parancs egységes Conventional Commits üzeneteket generál; mivel a kurzus minden mérföldkőnél commitot vár, ez csökkenti a manuális üzenet-írás hibáit. |
| **skill-creator** | Lehetővé teszi új skill-ek írását a sessionön belül, ha a projekt során visszatérő workflow-minták kristályosodnak ki. |

---

## MCP-szerverek

| Szerver | Hatókör | Indoklás |
|---------|---------|----------|
| **github** | projekt (`.mcp.json`) | Issues, PR-ok és repository-kontextus elérése Claude Code-ból közvetlenül; a kurzus feladatai GitHub-alapúak. |
| **Context7** | felhasználói | Naprakész könyvtár-dokumentáció (Prisma, Anthropic SDK, Vitest stb.) lekérdezése; a training-adatnál frissebb API-referenciát ad, csökkentve a hallucináció kockázatát. |
