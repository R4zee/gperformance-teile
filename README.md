# G Performance – Handverlesene Teile

Deutsche Affiliate-Website: Fahrzeug wählen (Marke → Modell → Generation → Motor), Teile in 3D am Auto tauschen, über Partner-Links kaufen.
Das Design stammt aus Claude Design. Der Prototyp liegt unter [`design/`](design/), der Verlauf der Abstimmung unter `design/chats/`.

## Stack (bis auf die Domain kostenlos)

| | |
|---|---|
| Framework | [Astro](https://astro.build): alle Seiten werden beim Build als statisches HTML erzeugt (gut für Google) |
| 3D | React + [React Three Fiber](https://r3f.docs.pmnd.rs) (three.js), wird nur im Konfigurator nachgeladen |
| Inhalte | JSON-Dateien im Repo, gepflegt über [Keystatic](https://keystatic.com) unter `/keystatic`. Keine Datenbank. |
| Hosting | Cloudflare Workers, kostenloser Plan (statische Dateien + das Keystatic-Admin) |
| Affiliate | `/go/<teil>/` → 302 auf den Shop. Amazon- und eBay-Partner-IDs werden automatisch angehängt. |
| Schriften | Barlow / Barlow Condensed, selbst gehostet (keine Google-Fonts-Verbindung, DSGVO) |

## Lokal starten

```bash
npm install
npm run dev          # http://localhost:4321  ·  Admin: http://localhost:4321/keystatic
npm run build        # erzeugt dist/
npm run check        # Typprüfung
```

Lokal speichert Keystatic Änderungen direkt in `src/content/`.

## Projektstruktur

```
src/
  content/teile/*.json      ein Teil pro Datei (Preis, Shop, Link, G-Notiz, 3D-Darstellung)
  content/marken/*.json     Marken → Modelle → Generationen → Motoren (+ optional 3D-Modell)
  content/seiten/           Startseite: Build des Monats, beliebte Builds
  pages/                    /, /fahrzeuge/, /<marke>/<modell>/<gen>/[<kategorie>/[<teil>/]], …/build/, /go/<teil>/
  components/three/         3D-Bühne, stilisiertes Auto, GLB-Loader
  components/config/        Konfigurator (3D / Liste / Teil-Detail)
  lib/                      Typen, Katalog, Affiliate-Links, Browser-Speicher
keystatic.config.ts         Felder der Admin-Oberfläche
integrations/               schreibt beim Build die _redirects für /go/
docs/3D-MODELLE.md          Anforderungen an echte 3D-Modelle + Lizenz-Checkliste
```

Neues Fahrzeug anlegen: In Keystatic unter *Marken & Fahrzeuge* die Generation mit Motoren anlegen, dann unter *Teile* mindestens ein Serienteil je Kategorie mit Fahrzeug `marke/modell/generation` erfassen. Die Seiten entstehen beim nächsten Build automatisch.

## Deployment auf Cloudflare (kostenlos)

1. Cloudflare-Konto anlegen → *Workers & Pages* → *Create* → *Import a repository* → `R4zee/gperformance-teile`.
2. Build command `npm run build`, Deploy command `npx wrangler deploy --config dist/server/wrangler.json`.
3. Unter *Settings → Variables* eintragen: `PUBLIC_AMAZON_TAG` und `PUBLIC_EBAY_CAMPID` (echte Partner-IDs), danach die Keystatic-Variablen (siehe unten).
4. Eigene Domain unter *Settings → Domains* verbinden.

Jeder Push auf `main` (auch Speichern in Keystatic) baut die Seite neu.

### Keystatic in Produktion (GitHub-Modus)

In Produktion speichert Keystatic jede Änderung als Commit im GitHub-Repo. Einmalig einrichten:

1. Lokal `npm run build && npx wrangler dev --config dist/server/wrangler.json` starten, `/keystatic` öffnen und dem Assistenten folgen. Er legt eine GitHub-App an und gibt die Werte aus.
2. Die Werte `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` und `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` als Variablen in Cloudflare eintragen. Die Callback-URL der GitHub-App auf die Live-Domain setzen: `https://<domain>/api/keystatic/github/oauth/callback`.
3. Danach kann G Performance unter `https://<domain>/keystatic` mit dem eigenen GitHub-Account Teile pflegen.

## Vor dem Livegang offen

- [ ] **Echte Teile, Preise, Shop-Links**. Die aktuellen Daten sind Beispiele aus dem Prototyp. Felgenshop, BMW Teileshop und Tuning-Shop haben noch keinen Link („Link folgt“).
- [ ] **Partner-IDs** (`PUBLIC_AMAZON_TAG`, `PUBLIC_EBAY_CAMPID`). Aktuell sind es Platzhalter.
- [ ] **Amazon-Preise:** Laut Partnerbedingungen dürfen Preise nur angezeigt werden, wenn sie über die Amazon-API kommen. Bis dahin bei Amazon-Teilen das Preisfeld leer lassen; die Seite zeigt dann „Preis im Shop“.
- [ ] **Impressum und Datenschutz** ausfüllen (`src/pages/impressum.astro`, `datenschutz.astro`).
- [ ] **Produktbilder und Fahrzeugfotos**. Aktuell sind es Platzhalterflächen wie im Design.
- [ ] **Logo als SVG**. `public/assets/gp-logo.jpg` ist nur 160 × 160 px groß.
- [ ] **3D-Modell**, siehe [docs/3D-MODELLE.md](docs/3D-MODELLE.md).
- [ ] Optional: Cloudflare Web Analytics aktivieren (ohne Cookies, also kein Banner nötig).
