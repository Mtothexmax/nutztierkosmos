# Design-Brief: „Nutztierkosmos" – Click-Dummy

**Für:** Claude Design (oder jedes andere Design-Tool, das ein einzelnes HTML-File liefert)
**Ziel:** Ein klickbarer, hochwertiger **Design-Prototyp** der gesamten Plattform – Spielerbereich **und** simulierter Adminbereich (CMS). Danach wird das HTML 1:1 nach SvelteKit portiert.

---

## 0. Deine Aufgabe in einem Satz

Baue **eine einzelne, in sich geschlossene HTML-Datei** mit allen Screens einer Lernplattform zum Thema Nutztierwissenschaften: eine moderne, freundliche Wissenschafts-Marke für Schüler:innen – plus ein professionelles Redaktions-CMS, in dem man Quizze ohne Code und Spiele als HTML-Code pflegt.

**Wichtig:** Es ist ein **Click-Dummy**. Es gibt kein Backend. Alle Aktionen dürfen rein visuell reagieren (Screen wechseln, Toast zeigen, Modal öffnen). Kein Login, keine echte Datenbank, keine echten Uploads.

---

## 1. Output-Format (verbindlich)

Liefere **genau einen** Codeblock mit einer vollständigen HTML-Datei:

```html
<!doctype html>
<html lang="de"> ... </html>
```

Regeln:

1. **Tailwind per CDN:** `<script src="https://cdn.tailwindcss.com"></script>` und direkt darunter ein `tailwind.config` mit den Tokens aus §2.
2. **Material Symbols Outlined** per Google-Fonts-Link: `<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">`. Icons als `<span class="material-symbols-outlined">pets</span>`.
3. **Fonts:** `Bitter` (Überschriften, Serif) + `Inter` (Fließtext) via Google Fonts.
4. **Keine externen Bilder.** Nutze Emojis, CSS-Verläufe, Inline-SVG oder graue Bild-Platzhalter mit Material-Icon.
5. **Kein Build-Schritt**, kein Framework, keine npm-Pakete. Vanilla JS nur für: Screen-Wechsel, Tabs, Modals, Toasts, Accordions, simuliertes Speichern.
6. **Alle Screens in einer Datei.** Jeder Screen ist ein `<section id="screen-…" data-screen="…">`, standardmäßig `hidden`, per JS umschaltbar.
7. **Screen-Switcher unten fixiert** (nur für die Präsentation, mit `data-dev-only` markiert), damit man alle Screens direkt anklicken kann. Er darf das Design nicht überdecken.
8. **Interaktions-Hooks im Markup:**
   - Navigation: `data-nav="screen-s03"` oder `href="#screen-s03"`
   - Aktionen: `data-action="save-quiz"`, `data-action="add-question"` usw.
   - Tabs: `data-tab-group="question-type" data-tab="mc"`
   Diese Attribute bleiben beim Portieren erhalten.
9. **Deutsch**, Sie-Form vermeiden, Du-Form im Spielerbereich, sachliche Sie-Form im Adminbereich.
10. Responsive: Desktop 1440 px ist die Referenz, aber alles muss bei **390 px** und **768 px** sauber stapeln.

---

## 2. Design-Tokens

**Marke:** „Nutztierkosmos" – ein Forschungsinstitut (FBN) erklärt Nutztierhaltung. Wissenschaftlich, aber warm und zugänglich. Kein Kinder-Kitsch, keine Corporate-Kälte.

### Farben (in `tailwind.config` erweitern)

| Token | Hex | Verwendung |
|---|---|---|
| `brand-900` | `#0B2E22` | Admin-Sidebar, dunkle Flächen |
| `brand-800` | `#11402F` | Hover auf dunkel |
| `brand-700` | `#16543D` | Überschriften |
| `brand-600` | `#1C6B4C` | **Primärfarbe**, Buttons |
| `brand-500` | `#2A8560` | Hover, Links |
| `brand-100` | `#DCEFE5` | Badges, Chips |
| `brand-50` | `#F1F8F4` | Hintergründe |
| `lime-500` | `#8DBF3F` | Akzent, Fortschritt, Erfolg |
| `sand-50` | `#FBF9F3` | Seitenhintergrund hell |
| `sand-100` | `#F4F0E4` | Karten auf Sand |
| `sand-200` | `#E7E0CE` | Rahmen |
| `ink-900` | `#101915` | Text primär |
| `ink-700` | `#2C3A33` | Text sekundär |
| `ink-500` | `#5B6B63` | Text tertiär, Labels |
| `amber-500` | `#D98A2B` | Warnung, „In Bearbeitung" |
| `sky-500` | `#3E7CA6` | Themenfarbe Modul 3 |
| `berry-500` | `#A6486B` | Themenfarbe Modul 4 |
| `danger-500` | `#B4372C` | Löschen, Fehler |

**Semantische Paare:** Richtig = `#1C6B4C` auf `#E8F5EE` · Falsch = `#B4372C` auf `#FBEAE8` · Neutral = `ink-500` auf `sand-100`.

### Typografie

| Rolle | Font | Größe / Line-Height | Gewicht |
|---|---|---|---|
| Display (Hero) | Bitter | 48/1.1 (mobil 34) | 700 |
| H1 Seite | Bitter | 34/1.2 | 700 |
| H2 Abschnitt | Bitter | 24/1.3 | 600 |
| H3 Karte | Inter | 17/1.4 | 600 |
| Body | Inter | 15/1.6 | 400 |
| Small / Meta | Inter | 13/1.5 | 400–500 |
| Label / Overline | Inter | 11/1.2, `tracking-[0.14em]`, uppercase | 600 |
| Zahl / Score | Bitter | 40/1 | 700 |

### Form & Tiefe

- Radien: Karten `rounded-2xl` (16 px), Buttons/Inputs `rounded-xl` (12 px), Pills `rounded-full`.
- Schatten: `shadow-[0_1px_2px_rgba(16,25,21,.06),0_8px_24px_-12px_rgba(16,25,21,.18)]` für Karten, Hover leicht verstärkt.
- Fokus: `ring-2 ring-brand-500 ring-offset-2`.
- Abstände: 4er-Raster (4/8/12/16/24/32/48/64).
- Keine harten schwarzen Rahmen. Trennlinien `border-sand-200`.
- Ecken nie komplett eckig – alles mindestens `rounded-lg`.

### Icons

Material Symbols **Outlined**, `font-variation-settings: 'wght' 400, 'FILL' 0`. Aktiv/FILL nur für ausgewählte Zustände (z. B. gefülltes Lesezeichen).

---

## 3. Informationsarchitektur

### Spielerbereich (Du-Form)

| ID | Screen | Titel im Switcher |
|---|---|---|
| `s01` | Anmeldung / Name + Avatar | Anmelden |
| `s02` | Dashboard mit Modulen & Bestenliste | Lernen |
| `s03` | Modul-Detail mit Stationen | Modul |
| `s04` | Quiz-Player (4 Fragetypen, Feedback) | Quiz |
| `s05` | Ergebnis / Punkte / Badges | Ergebnis |
| `s06` | Spiel-Host (iframe) | Spiel |

### Adminbereich (Sie-Form, immer eingeloggt)

| ID | Screen | Titel im Switcher |
|---|---|---|
| `s07` | Admin-Dashboard (KPIs, letzte Änderungen) | CMS |
| `s08` | Quiz-Liste | Quizze |
| `s09` | Quiz-Editor | Quiz-Editor |
| `s10` | Spiel-Editor (Code + Preview + Bridge-Log) | Spiel-Editor |
| `s11` | HTML-Import | Import |
| `s12` | Spieler & Scores | Spieler |
| `s13` | Mediathek | Mediathek |
| `s14` | Einstellungen | Einstellungen |

### Overlays (auf beliebigem Screen zeigbar, als eigener Switcher-Punkt)

| ID | Overlay |
|---|---|
| `m01` | Modal „Löschen bestätigen" |
| `m02` | Modal „Ungespeicherte Änderungen" |
| `m03` | Toast-Sammlung (Erfolg / Fehler / Info) |
| `m04` | Leerer Zustand (Empty State) als Vollbild-Variante |

---

## 4. Screens im Detail

### S01 – Anmelden

**Ziel:** Einstieg ohne Passwort. Wirkt wie ein echter Login, ist aber nur eine Namenseingabe.

Layout: Zwei Spalten (Desktop 55/45). Links eine Markenfläche mit weichem Verlauf `brand-900 → brand-600`, großem Bitter-Titel, einer abstrakten Illustration aus Kreisen/Linien (Inline-SVG, Kuh-Silhouette optional) und drei kurzen Fakten-Chips („4 Module", „12 Spiele & Quizze", „Forschen & punkten"). Rechts eine weiße Karte.

Inhalt der Karte:

- Overline: `WILLKOMMEN`
- H1: `Wie heißt du?`
- Sub: `Dein Name erscheint in der Bestenliste. Kein Passwort, keine E-Mail.`
- Input-Label `Dein Name`, Placeholder `z. B. Lena`, Hilfetext `2–20 Zeichen`
- Avatar-Auswahl: 6 runde Buttons mit Emojis 🦊 🐻 🦉 🐺 🐰 🐴, ausgewählt = `ring-2 ring-brand-600 bg-brand-50`, darunter Label `Wähle deinen Avatar`
- Primärbutton (volle Breite): `Los geht's` mit Icon `arrow_forward`
- Sekundärbutton darunter: `Als Redaktion anmelden` (Ghost, Icon `admin_panel_settings`) → führt zu S07
- Fußnote klein: `Demo-Modus · Daten bleiben nur in diesem Browser.`

---

### S02 – Lernen (Dashboard)

**Struktur:** Sticky Topbar → Begrüßung + Fortschritt → Modul-Grid → Bestenliste.

**Topbar:** links Logo (kleiner Kreis mit `pets`-Icon + Wortmarke `Nutztierkosmos`), rechts: Punkte-Pill `480 Punkte` mit `stars`-Icon, Avatar + Name `Lena`, Chevron mit Dropdown (Profil, Abmelden – nur visuell).

**Hero-Karte** (`brand-900`, weiße Schrift, dekorativer Kreis-Verlauf):
- Overline `DEIN FORTSCHRITT`
- H1 `Weiter so, Lena!`
- Sub `3 von 4 Modulen begonnen · Level „Forscherin"`
- Rechts ein **Progress Ring** (72 px, `lime-500` auf `white/15`), innen `62 %`
- Zwei Buttons: `Weiterlernen` (weiß, `brand-900`-Text) und `Bestenliste ansehen` (Ghost, weiße Border)

**Abschnitt „Deine Module"** mit Filter-Pills: `Alle` (aktiv) · `Neu` · `Angefangen` · `Abgeschlossen`.

Modul-Karten (4, 2×2 auf Desktop, 1 Spalte mobil). Jede Karte: farbige Icon-Fläche (Emoji groß), Status-Badge oben rechts, H3, 2-zeilige Beschreibung, Meta-Zeile `3 Stationen · 60 Punkte`, Fortschrittsbalken, Fußzeile mit `Weiter` / `Starten` + Chevron.

Karten-Inhalte:

| Modul | Emoji | Farbe | Status | Meta |
|---|---|---|---|---|
| Milchkuh & Klima | 🐄 | forest | `Angefangen` | 3 Stationen · 60 P. · 62 % |
| Schwein & Stallklima | 🐖 | amber | `Neu` | 2 Stationen · 40 P. |
| Geflügel & Verhalten | 🐔 | sky | `Neu` | noch keine Inhalte (gedämpft, Badge `Bald verfügbar`) |
| Präzisionslandwirtschaft | 🛰️ | berry | `Abgeschlossen` | 1 Station · 20 P. · 100 % |

**Abschnitt „Bestenliste"** (Karte, 6 Zeilen): Rang, Avatar, Name, Level, Punkte. Lena auf Platz 1 mit `lime`-Hervorhebung und Label `Du`. Plätze 2–5: Jonas 420, Mia 390, Emre 210, Frau Weber 100 (Lehrkraft-Badge). Rechts Link `Alle ansehen`.

Footer: `Ein Demo-Projekt · FBN-Forschung zum Anfassen` + Links `Impressum` `Datenschutz` (nur Text).

---

### S03 – Modul-Detail

- Breadcrumb `Lernen / Milchkuh & Klima`
- Hero: Emoji-Kachel, H1 `Milchkuh & Klima`, Sub `Wie aus Gras Milch wird – und was das mit Methan zu tun hat.`, Meta-Chips `3 Stationen` `60 Punkte` `ca. 15 Min.`
- Progress-Card rechts: Ring 62 %, `2 von 3 Stationen`
- **Stationsliste** (vertikale Karte, 3 Einträge):
  1. Quiz · `Was weißt du über Methan?` · 6 Fragen · 60 P. · Status `Abgeschlossen` (Häkchen, gedämpft) · Button `Nochmal`
  2. Spiel · `Pansen-Puzzle` · 5 Min. · 20 P. · Status `Offen` · Button `Starten` (primär)
  3. Bilderrätsel · `Futter oder Falle?` · 4 Bilder · 20 P. · `Gesperrt` (Schloss, Tooltip-Text klein `Schalte zuerst das Quiz frei`)
- Seitenleiste: Karte `Das steckt dahinter` mit 3 Bullet-Fakten und Quelle `FBN, Institut für Nutztierbiologie` (klein, seriös).

---

### S04 – Quiz-Player

Vier Varianten im selben Screen, per Switcher/Tabs innerhalb der Seite zeigbar (`data-tab-group="quiz-type"`): **MC**, **Richtig/Falsch**, **Bilderrätsel**, **Zuordnung**. Bitte alle vier ausgestalten – sie sind das Herzstück.

**Rahmen (alle Varianten):**
- Kopfzeile: `Zurück`-Icon-Button, Quiz-Titel klein, Fortschritt `Frage 3 von 6`, Punkte-Pill `20 P.`, Timer-Chip `02:14` (optional, dezent), Button `Beenden` (Ghost)
- Fortschrittsbalken unter der Kopfzeile (`lime-500` auf `sand-200`)
- Karte zentriert, max. 760 px: Overline `FRAGE 3`, Frage in Bitter 28 px, optional Bildbereich
- Antwortbereich
- Feedback-Zone (siehe unten), zunächst unsichtbar
- Fußzeile: links `Punkte: 20`, rechts Button `Weiter` (deaktiviert bis Antwort), bei letzter Frage `Auswerten`

**Varianten:**

1. **Multiple Choice:** 3–4 Antwortkarten, volle Breite, je Buchstaben-Badge (A/B/C/D), Hover `border-brand-500`, ausgewählt `border-brand-600 bg-brand-50 ring-2`.
2. **Richtig/Falsch:** Zwei große Karten nebeneinander mit Icons `check_circle` / `cancel`, gleich groß, mobil untereinander.
3. **Bilderrätsel:** 16:9-Bildfläche (Platzhalter mit Icon `image` und Text `Bild folgt`), darunter 3 Antwort-Chips + optional Eingabefeld-Variante (`Antwort eingeben…` + `Prüfen`).
4. **Zuordnung:** Zwei Spalten (Links Begriffe, rechts Kategorien). Klick auf links markiert (Pill, `brand-600`), Klick auf rechts zieht eine Verbindungslinie/Nummer. Bereits zugeordnet: Zahl-Badge + `close` zum Lösen. Mobil: erst links wählen, dann rechts, gleiche Optik.

**Feedback-Zustände (unbedingt alle zeigen):**
- Richtig: Karte `bg-[#E8F5EE] border-[#1C6B4C]`, Icon `check_circle`, Titel `Richtig!`, Erklärtext (2 Zeilen), `+20 Punkte`-Pill, Button `Weiter`.
- Falsch: `bg-[#FBEAE8] border-[#B4372C]`, Icon `cancel`, Titel `Nicht ganz.`, Erklärung `Richtig wäre: „Raps- und Leinsaat"`, Button `Weiter`.
- Zeit abgelaufen / übersprungen: neutral sand, Icon `schedule`, `Keine Antwort – 0 Punkte`.

---

### S05 – Ergebnis

- Große zentrierte Karte auf Sand-Hintergrund, dezente Konfetti-Punkte (CSS, keine Animation nötig).
- Score-Ring 140 px, `480` in Bitter, darunter `von 600 Punkten`.
- H1 `Stark, Lena!` + Sub `Du hast 8 von 10 Fragen richtig beantwortet.`
- Drei Stat-Karten: `Richtig 8` · `Falsch 2` · `Zeit 04:32`
- Badge-Reihe: 3 Medaillen (freigeschaltet farbig, eine gesperrt grau) mit Tooltip-Text: `Methan-Profi`, `Schnelldenker`, `Serie 3`
- Buttons: primär `Nochmal spielen`, sekundär `Zurück zum Modul`, Ghost `Bestenliste`
- Kleine Liste `Deine Antworten` (aufklappbar, 3 Beispielzeilen mit Häkchen/Kreuz).

---

### S06 – Spiel-Host (iframe)

Der wichtigste Screen für die spätere Technik – bitte so gestalten, dass er zeigt: **Die Plattform umrahmt das Spiel, das Spiel läuft isoliert.**

- **Kopfzeile:** Zurück-Pfeil, Spieltitel `Pansen-Puzzle`, Badge `Demo-Modus` (amber, outline), rechts Spieler-Chip `🦊 Lena` und Punkte-Chip `120 P.`
- **Hauptfläche:** große Karte mit dem iframe-Inhalt (16:9 bzw. füllend). Der iframe-Inhalt ist ein **fake Mini-Spiel**: eine Wiese mit 6 Kreisen („Futterbausteine"), davon 3 richtig; Klick auf einen Kreis färbt ihn grün/rot, oben im Spiel ein kleiner Fortschritt `2 / 3 gefunden` und ein Button `Fertig`.
  - Wichtig: Der Spielbereich muss optisch **eingebettet** wirken (eigener Hintergrund, eigene kleine Typo), damit klar ist: das ist eine andere Umgebung.
  - Unten links im Spiel ein kleiner Hinweis: `Spiel erhält: Lena · api v1` (monospace, 11 px, grau) – das visualisiert die Bridge.
- **Fußleiste der Plattform:** links Status `● Bridge verbunden` (grün, 8-px-Punkt), mittig Live-Score `Score 120 / 200`, rechts Buttons `Neu starten` (`refresh`), `Vollbild` (`fullscreen`), `Beenden`.
- **Einklappbares Panel „Bridge-Konsole"** (Debug, `data-dev-only`): dunkle Fläche `brand-900`, Monospace-Zeilen mit Zeitstempel:
  ```
  14:02:11  host → game   INIT      { player: "Lena", game: "Pansen-Puzzle" }
  14:02:11  game → host   READY
  14:02:19  game → host   SCORE     120
  14:02:36  game → host   COMPLETE  { points: 180, maxPoints: 200 }
  ```
- Bei Verbindungsfehler: gelbe Warnkarte `Das Spiel antwortet nicht. Prüfe das Bridge-Skript.` + Button `Erneut senden`.

---

### S07 – CMS-Dashboard

**Admin-Shell (gilt für S07–S14):**
- Links **Sidebar** 260 px, `brand-900`, weiße Schrift: Logo + `Nutztierkosmos` / `Redaktion`. Navigation mit Icons: `Dashboard`, `Quizze`, `Spiele`, `HTML-Import`, `Spieler`, `Mediathek`, `Einstellungen`. Aktiv = `bg-white/10` + linker 3-px-Balken `lime-500`. Unten Nutzerkarte `Redaktion (Demo)` mit Avatar-Initiale, Badge `Demo`, Logout-Icon (nur visuell).
- **Topbar** 64 px, weiß, Border unten: Breadcrumb, Suche (`Suchen…` mit `search`-Icon, nur Optik), Button `Vorschau ansehen` (Ghost) und primär `+ Neu`.
- **Mobile:** Sidebar als Drawer, Hamburger in der Topbar.

**Dashboard-Inhalt:**
- H1 `Willkommen zurück` + Sub `Stand: 6. November 2026 · Demo-Daten`
- 4 KPI-Karten: `Module 4` (+0), `Quizze 3`, `Spiele 2`, `Spieler 5` – je mit Icon, kleiner Trendzeile (`+1 diese Woche`) und Mini-Sparkline (Inline-SVG).
- Zwei Spalten: links **„Zuletzt bearbeitet"** Tabelle (Titel, Typ-Badge, geändert von, Datum, Aktion `Bearbeiten`), rechts **„Schnellaktionen"** als 3 große Buttons: `Neues Quiz` (`quiz`), `Neues Spiel` (`sports_esports`), `HTML importieren` (`upload_file`).
- Darunter schmale Karte `Hinweis` (brand-50): `Diese Demo speichert alle Inhalte ausschließlich im Browser (localStorage).`

Tabellenzeilen:
| Titel | Typ | Geändert | Von |
|---|---|---|---|
| Was weißt du über Methan? | Quiz | 06.11.2026, 09:12 | Redaktion |
| Pansen-Puzzle | Spiel (Code) | 05.11.2026, 16:40 | Redaktion |
| Stallklima-Simulator | Spiel (HTML) | 04.11.2026, 11:05 | Redaktion |
| Futter oder Falle? | Bilderrätsel | 03.11.2026, 14:22 | Redaktion |

---

### S08 – Quiz-Liste

- H1 `Quizze` + Sub `3 Einträge`, rechts primär `+ Neues Quiz`
- Toolbar: Suchfeld, Filter-Select `Alle Module`, Select `Status: Alle`, Ansicht-Toggle (Liste/Karten, Liste aktiv)
- Tabelle: Auswahl-Checkbox, Titel (mit Icon-Kreis), Modul, Fragetypen als kleine Icon-Reihe, `Fragen` (Zahl), `Punkte`, Status-Badge (`Veröffentlicht` grün / `Entwurf` amber), `Geändert`, Aktionsmenü `⋮` (Bearbeiten, Duplizieren, Löschen)
- Zeilen-Hover `bg-brand-50/50`, Klick auf Titel → S09
- Fußzeile: `1–3 von 3` + Pagination (deaktiviert)

Beispielzeilen:
| Titel | Modul | Fragen | Punkte | Status |
|---|---|---|---|---|
| Was weißt du über Methan? | Milchkuh & Klima | 6 | 60 | Veröffentlicht |
| Stallklima-Check | Schwein & Stallklima | 4 | 40 | Entwurf |
| Futter oder Falle? | Milchkuh & Klima | 4 | 20 | Entwurf |

---

### S09 – Quiz-Editor (das No-Code-Herzstück)

**Dreispaltig auf Desktop (320 / flex / 380), mobil gestapelt mit Tabs.**

**Linke Spalte – Quiz-Einstellungen (Karte):**
- H2 `Einstellungen`
- Feld `Titel` (Wert: `Was weißt du über Methan?`)
- Feld `Modul` (Select: `Milchkuh & Klima`)
- Feld `Beschreibung` (Textarea, 3 Zeilen)
- Feld `Punkte gesamt` (readonly, berechnet: `60`)
- Toggle `Veröffentlicht` (an)
- Toggle `Timer verwenden` (aus) + Feld `Sekunden` (deaktiviert)
- Button `Vorschau` (sekundär), `Quiz löschen` (danger ghost, klein)

**Mitte – Fragenliste:**
- Kopf: `Fragen (6)` + Button `+ Frage hinzufügen`
- Jede Frage als kompakte Karte: Drag-Handle (`drag_indicator`), Nummer, Typ-Badge (`Multiple Choice` / `Richtig/Falsch` / `Bilderrätsel` / `Zuordnung`), Fragetext (1 Zeile, truncate), Punkte, Icon-Buttons `duplizieren`, `löschen`. **Frage 1 aktiv** (`ring-2 ring-brand-500`).
- Unten gestrichelte Drop-Zone `Frage hierher ziehen`

**Rechte Spalte – Fragen-Editor:**
- Tabs `Multiple Choice` · `Richtig/Falsch` · `Bilderrätsel` · `Zuordnung` (`data-tab-group="question-type"`)
- Je Typ die passenden Felder:
  - **MC:** `Frage` (Textarea), `Erklärung` (Textarea, optional), Antwortoptionen als 3 Zeilen mit Drag-Handle, Radio `Richtig`, Textfeld, `löschen`-Icon; darunter `+ Antwort hinzufügen`; Toggle `Mehrfachauswahl erlauben`; Feld `Punkte` (Zahl, `10`).
  - **Richtig/Falsch:** `Aussage` (Textarea), Segmented Control `Richtig | Falsch`, `Erklärung`, `Punkte`.
  - **Bilderrätsel:** Bild-Dropzone (gestrichelt, `Bild auswählen oder hierher ziehen`, Hinweis `PNG/JPG, max. 300 KB`), `Frage`, Segmented `Auswahl | Eingabe`, bei Auswahl 3 Antwortzeilen mit Radio, bei Eingabe Feld `Korrekte Antwort` + `Toleranz`-Select, `Punkte`.
  - **Zuordnung:** Zwei Spalten-Listen `Links (Begriffe)` / `Rechts (Kategorien)` mit `+`-Buttons, darunter `Lösungen verbinden` als 4 Zeilen mit zwei Selects (`Pansen → Verdauungsorgan`), `Punkte`.
- Fußleiste sticky: `Abbrechen` (Ghost) · `Änderungen speichern` (primär) · Status-Text `Nicht gespeichert` (amber) bzw. `Gespeichert 09:12` (grün).

Bitte **eine der vier Tabs vollständig ausgefüllt** zeigen (MC mit den Beispieldaten aus §6) und die anderen drei ebenfalls anklickbar/ausgefüllt gestalten.

---

### S10 – Spiel-Editor (Code + Live-Preview + Bridge-Log)

**Dreigeteilt:**

1. **Links – Metadaten (Karte, 300 px):**
   - `Titel` (`Pansen-Puzzle`)
   - `Modul` (Select)
   - `Beschreibung` (Textarea)
   - `Max. Punkte` (`200`)
   - `API-Version` (readonly Chip `v1`)
   - Toggle `Veröffentlicht`
   - Danger-Zone: `Spiel löschen`

2. **Mitte – Code (flex):**
   - Tabs `HTML` (aktiv) · `Code-Snippet`
   - Hinweiszeile (klein, grau): `Das Spiel läuft isoliert im iframe. Kommunikation nur über postMessage.`
   - **Code-Editor-Optik:** dunkle Fläche `#0E1A15`, Monospace (ui-monospace/JetBrains Mono Fallback), Zeilennummern-Spalte, dezente Syntaxfarben (Tags `#8DBF3F`, Attribute `#D98A2B`, Strings `#A9C7EC`, Text hellgrau). Zeige ~22 Zeilen echtes Beispiel-HTML (Ausschnitt aus §7).
   - Fußzeile: Zeichenzahl `4.812 Zeichen`, Buttons `Formatieren` (Ghost), `Vorschau aktualisieren` (sekundär)

3. **Rechts – Preview + Bridge (flex):**
   - Geräte-Toggle `Desktop | Tablet | Mobil`
   - iframe-Vorschau (weiß, gerundet, Schatten) mit dem Mini-Spiel aus S06
   - darunter **Bridge-Panel**: Titel `Bridge-Konsole`, Badge `● verbunden`, Buttons `INIT erneut senden` und `Test-SCORE`; Log-Liste wie in S06, plus Filter-Select `Alle Nachrichten`.
   - Warnzustand: gelbe Karte bei `Kein READY vom Spiel`.

---

### S11 – HTML-Import

- H1 `HTML importieren` + Sub `Fügen Sie ein komplettes HTML-Dokument ein oder ziehen Sie es hierher.`
- **Dropzone** groß (Höhe 220 px): gestrichelter Rahmen, Icon `upload_file`, `HTML-Datei hierher ziehen`, Link `oder Datei auswählen`, Hinweis `max. 500 KB · .html`.
- **ODER-Trenner**
- **Textarea** `HTML-Code einfügen…` (Monospace, 12 Zeilen, Zeichenzähler)
- Rechte Spalte **„Prüfergebnis"** Karte:
  - Checkliste mit Häkchen: `DOCTYPE vorhanden`, `Bridge-Skript gefunden`, `Keine externen Skripte`, `Größe ok (4,8 KB)`
  - Warnung (amber): `Das Skript nutzt localStorage – im iframe nicht verfügbar.`
  - Metadaten-Formular: `Titel`, `Modul`, `Max. Punkte`
  - Buttons: `Abbrechen`, primär `Importieren & öffnen`
- Nach Import: Toast `Spiel importiert` + Weiterleitung zu S10.

---

### S12 – Spieler & Scores

- H1 `Spieler` + Sub `5 Spieler · 1.600 Punkte gesamt`
- Toolbar: Suche, Select `Sortierung: Punkte`, Button `CSV exportieren` (Ghost, nur Optik)
- Tabelle: Avatar, Name (Lena mit Badge `Du`), Level, `Quizze` (Zahl), `Spiele`, `Punkte`, `Zuletzt aktiv`, Aktionen `Punkte zurücksetzen` (`restart_alt`, Ghost), `Löschen`.
- Detail-Drawer rechts (statisch offen zeigen): Lena, 480 Punkte, Verlauf als kleine Balken (7 Tage), letzte Aktivitäten (3 Zeilen), Button `Score manuell anpassen`.
- Leerer Zustand als Alternative: Icon `group_off`, `Noch keine Spieler`, Button `Spieler anlegen`.

---

### S13 – Mediathek

- H1 `Mediathek` + Sub `12 Dateien · 2,4 MB (Demo)`
- Dropzone oben (kompakt)
- Grid 4 Spalten (mobil 2): Bild-Platzhalter mit Verlauf + Emoji, darunter Dateiname (`methan-quelle.jpg`), Maße (`1200×800`), Größe, Hover mit Icons `edit`, `delete`
- Rechts Filterleiste: `Alle`, `Bilder`, `Verwendet in`, Suche.

---

### S14 – Einstellungen

Karten-Stapel, max. 820 px:

1. **Branding:** `Plattformname` (`Nutztierkosmos`), `Untertitel`, Farbwähler (3 Swatches), Logo-Dropzone (Platzhalter).
2. **Punkte & Level:** `Punkte pro richtiger Antwort` (`10`), `Level-Schwellen` als 3 Zahlenfelder (`Forscherin ab 300`), Toggle `Bestenliste öffentlich`.
3. **Bridge:** Info-Karte mit `API-Version v1`, `Erlaubte Nachrichten: INIT, SCORE, COMPLETE, RESIZE, STATE, LOG`, Link `Protokoll ansehen` (öffnet Modal mit Codeblock).
4. **Demo-Daten:** Danger-Zone `Alle Daten zurücksetzen` mit Bestätigungsmodal `m01`.

---

## 5. Overlays

- **M01 Löschen bestätigen:** kleines Modal 420 px, Icon `delete` in rotem Kreis, Titel `Quiz löschen?`, Text `„Was weißt du über Methan?" wird dauerhaft entfernt. Das kann nicht rückgängig gemacht werden.`, Buttons `Abbrechen` (Ghost) / `Endgültig löschen` (danger).
- **M02 Ungespeicherte Änderungen:** Modal, Titel `Änderungen verwerfen?`, 3 Buttons: `Weiter bearbeiten`, `Verwerfen`, `Speichern & verlassen`.
- **M03 Toasts:** 3 Varianten gestapelt oben rechts: Erfolg (`check_circle`, grün, `Quiz gespeichert`), Fehler (`error`, rot, `Speichern fehlgeschlagen – Speicher voll`), Info (`info`, brand, `Demo-Modus: nichts wird hochgeladen`). Mit Schließen-Icon und 4-s-Fortschrittsbalken.
- **M04 Empty State:** zentriert, Icon `science` groß in `brand-100`-Kreis, H2 `Hier ist noch nichts`, Text, Button `Erstes Quiz anlegen`.

---

## 6. Mock-Daten (verbindlich verwenden)

**Spieler:** Lena 🦊 (480 P., Level „Forscherin"), Jonas 🐻 (420), Mia 🦉 (390), Emre 🐺 (210), Frau Weber 👩‍🏫 (100, Badge `Lehrkraft`).

**Quiz „Was weißt du über Methan?"**

1. **MC** – „Wodurch entsteht im Pansen der Kühe vor allem Methan?"
   - A: „Durch Mikroorganismen beim Abbau von Fasern" ✅
   - B: „Durch die Atmung der Kuh"
   - C: „Durch das Wasser im Tränkebecken"
   - Erklärung: „Methan entsteht, wenn Archaeen im Pansen Kohlenstoff und Wasserstoff zusammenbauen – vor allem bei faserreichem Futter." · 10 P.
2. **Richtig/Falsch** – „Eine Milchkuh produziert pro Tag mehr Treibhausgas als ein Kleinwagen auf 100 km." → **Falsch**. Erklärung: „Die Aussage ist stark vereinfacht: Pro Kilogramm Milch ist die Bilanz heute deutlich besser als ihr Ruf – Vergleiche hängen von Bezugsgröße und Futter ab." · 10 P.
3. **Bilderrätsel** – „Welches Futter kann die Methanbildung im Pansen reduzieren?" (Bild-Platzhalter: grüner Futterhaufen mit Icon)
   - „Mais" · „Heu" · „Raps- und Leinsaat" ✅ · Erklärung: „Ungesättigte Fettsäuren aus Ölsaaten hemmen die Methanbildner im Pansen." · 10 P.
4. **Zuordnung** – 4 Paare: `Pansen → Verdauungsorgan`, `Archaeen → Methanbildner`, `Futterzusatz → Senkt Emissionen`, `Messkammer → Erfasst Ausatemluft` · 10 P.
5. **MC (Mehrfach)** – „Welche Faktoren beeinflussen die Methanemission? (2 Antworten)" – `Fütterung` ✅, `Leistung der Kuh` ✅, `Farbe des Stalls`, `Mondphase` · 10 P.
6. **Richtig/Falsch** – „Wiederkäuer können Pflanzenfasern verwerten, die Menschen nicht verdauen können." → **Richtig** · 10 P.

**Spiele:**
- `Pansen-Puzzle` · Typ Code · 200 P. · veröffentlicht
- `Stallklima-Simulator` · Typ HTML importiert · 150 P. · Entwurf

**Stats fürs Ergebnis:** 8/10 richtig, 480 von 600 Punkten, 04:32.

---

## 7. Beispiel-Inhalt für den Code-Editor (S10)

Diesen Ausschnitt (gekürzt, glaubwürdig) im Code-Pane anzeigen:

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>Pansen-Puzzle</title>
  <style>
    :root { --green:#1C6B4C; --lime:#8DBF3F; }
    body { font-family: Inter, sans-serif; background:#F1F8F4; margin:0; }
    .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding:24px; }
    .tile { aspect-ratio:1; border-radius:16px; background:#fff;
            border:2px solid #DCEFE5; cursor:pointer; }
  </style>
</head>
<body>
  <header id="hud">0 / 3 gefunden</header>
  <main class="grid" id="board"></main>
  <script>
    const send = (type, payload = {}) =>
      parent.postMessage({ source: 'ntk-game', type, payload }, '*');

    window.addEventListener('message', (e) => {
      if (e.data?.source !== 'ntk-platform') return;
      if (e.data.type === 'INIT') start(e.data.payload);
    });

    function start({ player }) {
      document.getElementById('hud').textContent = `Hallo ${player.name}!`;
      send('READY');
    }
  </script>
</body>
</html>
```

Und daneben im Bridge-Log die passenden vier Zeilen (siehe S06).

---

## 8. Komponenten-Checkliste

Bitte alle einmal sichtbar einsetzen:

| Komponente | Varianten |
|---|---|
| Button | primary, secondary (weiß + Border), ghost, danger, icon-only, disabled |
| Input / Textarea / Select | default, focus, error, disabled, mit Hilfetext |
| Toggle | an / aus / disabled |
| Checkbox & Radio | default, checked, indeterminate |
| Segmented Control | 2–4 Optionen |
| Tabs | underline, mit Badge |
| Badge / Pill | grün, amber, rot, blau, neutral, outline |
| Card | default, hover, aktiv (ring), dunkel |
| Progress | Balken, Ring, Segmente |
| Table | Header, Zeile, Hover, Checkbox-Spalte, Aktionsmenü |
| Modal | klein, Bestätigung, Formular |
| Toast | Erfolg, Fehler, Info |
| Empty State | Vollbild + Inline |
| Dropzone | leer, gefüllt, Fehler |
| Avatar | Emoji, Initiale, Größen 24/32/40/56 |
| Tooltip | dunkel, klein |

---

## 9. Tonalität & Details

- **Spielerbereich:** motivierend, klar, nie bevormundend. Kurze Sätze. Du-Form.
- **Adminbereich:** ruhig, präzise, sachlich. Sie-Form.
- **Zahlen & Wissenschaft:** seriös belegen („FBN, Institut für Nutztierbiologie"), keine falschen Studien.
- **Klima-/Tierhaltungsthemen:** differenziert, keine Polemik, keine Schuldzuweisungen.
- **Keine** Stockfoto-Optik, **keine** Regenbogen-Verläufe, **kein** Glassmorphism.
- Animationen nur subtil (150–200 ms, `prefers-reduced-motion` respektieren).
- Zustände müssen ohne Farbe allein erkennbar sein (Icon + Text).

---

## 10. Abnahme-Checkliste

- [ ] Eine HTML-Datei, öffnet lokal ohne Server, keine Konsolenfehler.
- [ ] Alle 14 Screens + 4 Overlays über den Switcher erreichbar.
- [ ] Spieler-Dashboard, Quiz (alle 4 Typen), Ergebnis und Admin-Editor vollständig gefüllt – keine „Lorem ipsum"-Reste.
- [ ] Admin wirkt wie eingeloggt (Sidebar, Nutzerkarte, Badge `Demo`).
- [ ] Bridge-Konsole in S06 und S10 sichtbar und plausibel.
- [ ] 390 px: nichts abgeschnitten, Tabellen scrollen horizontal, Sidebar wird Drawer.
- [ ] Fokus-Ringe sichtbar, Kontrast mindestens WCAG AA für Text.
- [ ] `data-screen`, `data-nav`, `data-action`, `data-tab-group` sind gesetzt.
- [ ] Material Symbols laden korrekt (keine Textplatzhalter wie „arrow_forward").

---

## 11. Rückgabe

Antworte mit **einem** Codeblock:

```html
<!-- design.html – vollständig, self-contained -->
```

Kein weiterer Fließtext außer einer kurzen Liste der Design-Entscheidungen (max. 5 Bullets). Der Code wird anschließend nach SvelteKit portiert – deshalb sind klare, wiederkehrende Strukturen und die `data-*`-Hooks wichtiger als clevere Einmal-Lösungen.
