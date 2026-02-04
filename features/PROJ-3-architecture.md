# PROJ-3: Organization Onboarding & Management - Architektur

## Erstellt: 2026-02-03
## Solution Architect: Claude

---

## 1. Übersicht - Was bauen wir?

Dieses Feature ergänzt das bestehende Basewatch-System um drei wesentliche Bereiche:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROJ-3: Neue Funktionen                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────┐ │
│  │  ONBOARDING       │  │  TEAM MANAGEMENT  │  │  BASE AUSWAHL   │ │
│  │  WIZARD           │  │                   │  │                 │ │
│  │                   │  │  Mitglieder       │  │  Welche Bases   │
│  │  4 Schritte       │  │  einladen und     │  │  werden         │
│  │  Einrichtung      │  │  verwalten        │  │  überwacht?    │
│  └───────────────────┘  └───────────────────┘  └─────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Bestehende Architektur (Was existiert bereits?)

### 2.1 Bereits vorhandene Bausteine

Aus PROJ-1 (User Authentication) und PROJ-2 (Airtable OAuth) existieren:

```
BESTEHENDE DATENBANK-TABELLEN
─────────────────────────────
organizations           → Organisationen mit Name, Plan, Slug
organization_members    → Wer gehört zu welcher Org (mit Rolle)
airtable_connections    → OAuth-Verbindungen zu Airtable
airtable_workspaces     → Verfügbare Workspaces pro Verbindung
airtable_bases          → Verfügbare Bases pro Workspace
oauth_states            → Temporäre OAuth-Zustände

BESTEHENDE API-ROUTES
─────────────────────
POST /api/organizations           → Org erstellen
GET  /api/organizations           → User's Orgs abrufen
GET  /api/airtable/connect        → OAuth-Flow starten
POST /api/airtable/callback       → OAuth-Callback
GET  /api/airtable/connections    → Verbindungen auflisten
DELETE /api/airtable/connections/[id]  → Verbindung trennen

BESTEHENDE SEITEN
─────────────────
/login, /signup         → Authentifizierung
/dashboard              → Startseite nach Login
/settings/connections   → Airtable-Verbindungen verwalten

BESTEHENDE UI-KOMPONENTEN
─────────────────────────
CreateOrganizationDialog  → Dialog zum Org erstellen
ConnectionList            → Liste der Airtable-Verbindungen
ConnectButton             → "Mit Airtable verbinden"
StatusBadge, ErrorBanner  → Verbindungs-Status anzeigen
```

### 2.2 Bestehender Datenfluss

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AKTUELLER FLOW (ohne Onboarding)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User registriert sich                                              │
│         │                                                           │
│         ▼                                                           │
│  Login → Dashboard (ohne Organisation!)                             │
│         │                                                           │
│         ▼                                                           │
│  Settings/Connections besuchen                                      │
│         │                                                           │
│         ▼                                                           │
│  "Org erstellen" Dialog erscheint (wenn keine Org)                  │
│         │                                                           │
│         ▼                                                           │
│  Airtable verbinden                                                 │
│                                                                     │
│  PROBLEM: Kein geführter Prozess, User muss alles selbst finden    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Neue Architektur - Komponenten-Übersicht

### 3.1 Gesamtbild der Module

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BASEWATCH ARCHITEKTUR                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     MIDDLEWARE                               │   │
│  │  Prüft bei JEDEM Seitenaufruf:                             │   │
│  │  • Ist User eingeloggt? → Wenn nein: /login                 │   │
│  │  • Hat User Onboarding abgeschlossen? → Wenn nein: /onboarding │ │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│         ┌────────────────────┼────────────────────┐                │
│         │                    │                    │                │
│         ▼                    ▼                    ▼                │
│  ┌────────────┐      ┌────────────┐      ┌────────────────┐       │
│  │ ONBOARDING │      │ DASHBOARD  │      │ SETTINGS       │       │
│  │            │      │            │      │                │       │
│  │ /onboarding│      │ /dashboard │      │ /settings/org  │       │
│  │   └── /org │      │            │      │ /settings/team │       │
│  │   └── /airtable   │            │      │ /settings/bases│       │
│  │   └── /bases      │            │      │ /settings/...  │       │
│  │   └── /team│      │            │      │                │       │
│  └────────────┘      └────────────┘      └────────────────┘       │
│         │                                        │                 │
│         └──────────────┬─────────────────────────┘                 │
│                        │                                           │
│                        ▼                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     API LAYER                               │   │
│  │  /api/onboarding/*  /api/organizations/*  /api/invitations/* │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                        │                                           │
│                        ▼                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     SUPABASE                                │   │
│  │  Datenbank + Auth + Row Level Security                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Onboarding Wizard - Aufbau

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ONBOARDING WIZARD                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│        Schritt 1          Schritt 2         Schritt 3   Schritt 4  │
│     ┌───────────┐      ┌───────────┐     ┌───────────┐ ┌─────────┐ │
│     │           │      │           │     │           │ │         │ │
│     │    ORG    │ ───► │  AIRTABLE │ ──► │   BASES   │►│  TEAM   │ │
│     │ ERSTELLEN │      │ VERBINDEN │     │ AUSWÄHLEN│ │ EINLADEN│ │
│     │           │      │           │     │           │ │         │ │
│     └───────────┘      └───────────┘     └───────────┘ └─────────┘ │
│                                                                     │
│  Fortschritt:  ●────────●────────●────────○                        │
│                                                                     │
│  REGELN:                                                            │
│  • Schritt 1 ist PFLICHT (ohne Org geht nichts)                    │
│  • Schritt 2 kann ÜBERSPRUNGEN werden (später einrichten)        │
│  • Schritt 3 nur möglich WENN Airtable verbunden                  │
│  • Schritt 4 ist OPTIONAL (Team später einladen)                  │
│                                                                     │
│  FORTSCHRITT WIRD GESPEICHERT:                                      │
│  → Browser schließen? Kein Problem, weitermachen möglich          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Settings-Bereich - Aufbau

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SETTINGS NAVIGATION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────────────────────────┐  │
│  │ SIDEBAR          │    │                                      │  │
│  │                  │    │           CONTENT AREA               │  │
│  │ ○ Profil         │    │                                      │  │
│  │ ● Organisation   │    │  Je nach Auswahl wird hier           │  │
│  │ ○ Team           │    │  die entsprechende Seite             │  │
│  │ ○ Bases          │    │  angezeigt                           │  │
│  │ ○ Verbindungen   │    │                                      │  │
│  │ ○ Abrechnung     │    │                                      │  │
│  │                  │    │                                      │  │
│  └──────────────────┘    └──────────────────────────────────────┘  │
│                                                                     │
│  NEUE SEITEN:                                                       │
│  • /settings/organization  → Org-Name ändern, Plan-Info           │
│  • /settings/team          → Mitglieder + Einladungen              │
│  • /settings/bases         → Welche Bases werden überwacht        │
│                                                                     │
│  BESTEHEND:                                                         │
│  • /settings/connections   → Airtable-Verbindungen (PROJ-2)        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Datenfluss - Wie bewegen sich Informationen?

### 4.1 Neuer User-Flow (mit Onboarding)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NEUER BENUTZER-FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐                                                       │
│  │ SIGNUP   │ User registriert sich                                │
│  └────┬─────┘                                                       │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────────────┐                                               │
│  │ MIDDLEWARE PRÜFT│ Hat User Onboarding abgeschlossen?            │
│  └────┬─────────────┘                                               │
│       │ NEIN                                                        │
│       ▼                                                             │
│  ┌──────────┐                                                       │
│  │ ONBOARD  │ Redirect zu /onboarding/organization                  │
│  │ STEP 1   │ User gibt Org-Namen ein                               │
│  └────┬─────┘                                                       │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────┐                                                       │
│  │ ONBOARD  │ Airtable verbinden (oder überspringen)              │
│  │ STEP 2   │                                                       │
│  └────┬─────┘                                                       │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────┐                                                       │
│  │ ONBOARD  │ Bases auswählen (wenn Airtable verbunden)           │
│  │ STEP 3   │                                                       │
│  └────┬─────┘                                                       │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────┐                                                       │
│  │ ONBOARD  │ Team einladen (optional)                              │
│  │ STEP 4   │                                                       │
│  └────┬─────┘                                                       │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────┐                                                       │
│  │DASHBOARD │ Onboarding abgeschlossen! Normale Nutzung             │
│  └──────────┘                                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Einladungs-Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EINLADUNGS-FLOW                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OWNER/ADMIN                           EINGELADENER                 │
│  ───────────                           ────────────                 │
│                                                                     │
│  ┌─────────────────┐                                                │
│  │ Öffnet /settings/team             │                             │
│  │ Klickt "Einladen"                  │                             │
│  │ Gibt E-Mail + Rolle ein            │                             │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ SYSTEM          │                                                │
│  │ • Erstellt Einladung in DB         │                             │
│  │ • Generiert Token (7 Tage gültig) │                             │
│  │ • Sendet E-Mail mit Link           │                             │
│  └────────┬────────┘                                                │
│           │                                                         │
│           │           ┌─────────────────────────────────────────┐   │
│           └──────────►│ E-MAIL                                  │   │
│                       │ "Du wurdest zu [Org] eingeladen"        │   │
│                       │ [Button: Einladung annehmen]            │   │
│                       └──────────────────┬──────────────────────┘   │
│                                          │                          │
│                                          ▼                          │
│                       ┌─────────────────────────────────────────┐   │
│                       │ EINGELADENER KLICKT LINK                │   │
│                       │                                         │   │
│                       │ FALL A: Bereits registriert             │   │
│                       │ → Direkt zur Einladungsseite           │   │
│                       │                                         │   │
│                       │ FALL B: Noch nicht registriert          │   │
│                       │ → Erst registrieren, dann Einladung    │   │
│                       └──────────────────┬──────────────────────┘   │
│                                          │                          │
│                                          ▼                          │
│                       ┌─────────────────────────────────────────┐   │
│                       │ /invite/accept?token=xxx                │   │
│                       │                                         │   │
│                       │ "Du wurdest zu [Org] eingeladen"        │   │
│                       │ "Rolle: Member"                         │   │
│                       │                                         │   │
│                       │ [Annehmen]  [Ablehnen]                  │   │
│                       └─────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 Base-Monitoring Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BASE-MONITORING AKTIVIEREN                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ SETTINGS/BASES SEITE                                         │  │
│  │                                                              │  │
│  │  "3 von 5 Bases überwacht (Pro-Plan)"                       │  │
│  │  ━━━━━━━━━━━━━━━━━━━░░░░░░░                                   │  │
│  │                                                              │  │
│  │  Workspace: Produkt-Team                                     │  │
│  │  ┌──────────────────────────────────────────────────────┐   │  │
│  │  │ Projektmanagement    [●] Überwacht                  │   │  │
│  │  │ Bug Tracker          [●] Überwacht                  │   │  │
│  │  │ Archiv 2024          [○] Inaktiv     [Aktivieren]    │   │  │
│  │  └──────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              │ User klickt "Aktivieren"             │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ SYSTEM PRÜFT                                                │  │
│  │                                                              │  │
│  │ 1. Plan-Limit ok? → 3 von 5 = JA                            │  │
│  │ 2. User hat Berechtigung? → Owner/Admin = JA                │  │
│  │ 3. Base existiert noch? → Airtable-Check                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ EINTRAG IN "monitored_bases"                                 │  │
│  │                                                              │  │
│  │ organization_id: [org-uuid]                                  │  │
│  │ airtable_base_id: [base-uuid]                                │  │
│  │ is_active: true                                              │  │
│  │ activated_at: [jetzt]                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  HINWEIS: Das eigentliche Schema-Monitoring (Webhooks, Snapshots)  │
│  wird in PROJ-4 und PROJ-5 implementiert.                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Daten-Model - Welche Informationen werden gespeichert?

### 5.1 Neue Datenbank-Tabellen

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NEUE TABELLEN                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TABELLE: user_onboarding_status                                    │
│  ─────────────────────────────────                                  │
│  Speichert den Fortschritt im Onboarding-Wizard                     │
│                                                                     │
│  Informationen:                                                     │
│  • Welcher User                                                     │
│  • Aktueller Schritt (1-4)                                          │
│  • Wann abgeschlossen (falls fertig)                                │
│  • Welche Organisation (nach Schritt 1)                             │
│                                                                     │
│  ───────────────────────────────────────────────────────────────── │
│                                                                     │
│  TABELLE: organization_invitations                                  │
│  ─────────────────────────────────────                              │
│  Speichert Team-Einladungen                                         │
│                                                                     │
│  Informationen:                                                     │
│  • Zu welcher Organisation                                          │
│  • E-Mail des Eingeladenen                                          │
│  • Zugewiesene Rolle (Admin, Member, Viewer)                        │
│  • Wer hat eingeladen                                               │
│  • Einladungs-Token (für Link)                                     │
│  • Ablaufdatum (7 Tage nach Erstellung)                             │
│  • Wann angenommen (falls angenommen)                               │
│                                                                     │
│  ───────────────────────────────────────────────────────────────── │
│                                                                     │
│  TABELLE: monitored_bases                                           │
│  ────────────────────────────                                       │
│  Speichert welche Bases überwacht werden                           │
│                                                                     │
│  Informationen:                                                     │
│  • Zu welcher Organisation                                          │
│  • Welche Airtable-Base                                             │
│  • Ist aktiv? (ja/nein)                                             │
│  • Wann aktiviert                                                   │
│  • Wann deaktiviert (falls deaktiviert)                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Beziehungen zwischen Tabellen

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATENBANK-BEZIEHUNGEN                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                        auth.users                                   │
│                            │                                        │
│              ┌─────────────┼─────────────┐                         │
│              │             │             │                         │
│              ▼             ▼             ▼                         │
│     user_onboarding   organization   organization                  │
│     _status           _members       _invitations                  │
│              │             │             │                         │
│              │             │             │                         │
│              └─────────────┼─────────────┘                         │
│                            │                                        │
│                            ▼                                        │
│                      organizations                                  │
│                            │                                        │
│              ┌─────────────┼─────────────┐                         │
│              │             │             │                         │
│              ▼             ▼             ▼                         │
│        airtable       monitored    organization                    │
│       _connections      _bases     _invitations                    │
│              │             │                                        │
│              ▼             │                                        │
│        airtable       ◄────┘                                       │
│          _bases                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Plan-Limits

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PLAN-LIMITS                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PLAN         VERBINDUNGEN    BASES    MITGLIEDER   HISTORIE       │
│  ─────────────────────────────────────────────────────────────────  │
│  Free         1               3        5            30 Tage        │
│  Pro          5               10       20           90 Tage        │
│  Enterprise   Unbegrenzt      Unbegrenzt Unbegrenzt  365 Tage      │
│                                                                     │
│  DURCHSETZUNG:                                                      │
│  • Bei Airtable verbinden → Verbindungs-Limit prüfen              │
│  • Bei Base aktivieren → Base-Limit prüfen                        │
│  • Bei Team einladen → Mitglieder-Limit prüfen                    │
│  • Wenn Limit erreicht → Upgrade-Hinweis zeigen                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Rollen und Berechtigungen

### 6.1 Rollen-Hierarchie

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BENUTZER-ROLLEN                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OWNER (Eigentümer)                                                │
│  ──────────────────                                                 │
│  • ALLE Rechte                                                      │
│  • Einziger der Org löschen kann                                  │
│  • Einziger der Ownership transferieren kann                       │
│  • Nur 1 Owner pro Organisation möglich                           │
│                                                                     │
│  ADMIN (Administrator)                                              │
│  ─────────────────────                                              │
│  • Airtable verbinden/trennen                                       │
│  • Team einladen (ausser Owner-Rolle)                              │
│  • Bases aktivieren/deaktivieren                                    │
│  • Mitglieder entfernen (ausser Owner)                             │
│                                                                     │
│  MEMBER (Mitglied)                                                  │
│  ─────────────────                                                  │
│  • Dashboard und Monitoring-Daten sehen                             │
│  • Kommentare schreiben (zukünftiges Feature)                     │
│  • Keine Verwaltungsrechte                                          │
│                                                                     │
│  VIEWER (Betrachter)                                                │
│  ───────────────────                                                │
│  • Nur Lesen                                                        │
│  • Kann nichts verändern                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Berechtigungs-Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WER DARF WAS?                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  AKTION                          OWNER   ADMIN   MEMBER   VIEWER   │
│  ─────────────────────────────────────────────────────────────────  │
│  Org-Name ändern                 ✓       -       -        -       │
│  Org löschen                     ✓       -       -        -       │
│  Ownership transferieren          ✓       -       -        -       │
│  ─────────────────────────────────────────────────────────────────  │
│  Airtable verbinden               ✓       ✓       -        -       │
│  Airtable trennen                 ✓       ✓       -        -       │
│  Bases aktivieren                 ✓       ✓       -        -       │
│  Bases deaktivieren               ✓       ✓       -        -       │
│  ─────────────────────────────────────────────────────────────────  │
│  Team einladen                    ✓       ✓       -        -       │
│  Mitglieder entfernen             ✓       -       -        -       │
│  Rollen ändern                   ✓       -       -        -       │
│  ─────────────────────────────────────────────────────────────────  │
│  Dashboard sehen                  ✓       ✓       ✓        ✓       │
│  Monitoring-Daten sehen           ✓       ✓       ✓        ✓       │
│  Team-Liste sehen                 ✓       ✓       ✓        ✓       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Kritische Entscheidungspunkte

### 7.1 Onboarding-Check: Wo und Wie?

```
┌─────────────────────────────────────────────────────────────────────┐
│  ENTSCHEIDUNG: Wie prüfen wir ob Onboarding nötig ist?           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OPTION A: In der Middleware (Server-seitig)                        │
│  ─────────────────────────────────────────────                      │
│  ✓ Zentrale Stelle, keine Doppelung                                │
│  ✓ Funktioniert bei direktem URL-Aufruf                            │
│  ✗ Middleware kann nicht auf Supabase zugreifen (ohne Workaround)  │
│                                                                     │
│  OPTION B: Im Protected Layout (Server Component)  ← EMPFOHLEN      │
│  ─────────────────────────────────────────────────                  │
│  ✓ Hat Zugriff auf Supabase                                        │
│  ✓ Wird bei allen geschützten Seiten ausgeführt                  │
│  ✓ Kann redirect() verwenden                                        │
│  ✓ Passt zum bestehenden Pattern                                   │
│                                                                     │
│  EMPFEHLUNG: Option B - Erweiterung des bestehenden                 │
│  /src/app/(protected)/layout.tsx                                    │
│                                                                     │
│  ABLAUF:                                                            │
│  1. User ist eingeloggt? (besteht bereits)                          │
│  2. Hat User Onboarding abgeschlossen?                              │
│     → Query auf user_onboarding_status                              │
│  3. Wenn nein UND nicht auf /onboarding/* → redirect               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Onboarding-State Management

```
┌─────────────────────────────────────────────────────────────────────┐
│  ENTSCHEIDUNG: Wie verwalten wir den Wizard-Fortschritt?           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LÖSUNG: Server-State in Datenbank                                │
│  ──────────────────────────────────                                 │
│                                                                     │
│  • Fortschritt wird in user_onboarding_status gespeichert          │
│  • Bei jedem Schritt-Abschluss: API-Call zum Update                │
│  • Bei Seitenbesuch: Aktuellen Schritt aus DB laden                │
│  • Kein lokaler State nötig (ausser für Form-Daten)              │
│                                                                     │
│  VORTEILE:                                                          │
│  ✓ Browser schließen = kein Datenverlust                          │
│  ✓ Gerätewechsel möglich                                         │
│  ✓ Einfache Debugging (Daten in DB sichtbar)                       │
│                                                                     │
│  API ENDPOINTS:                                                     │
│  GET  /api/onboarding/status       → Aktuellen Stand holen         │
│  POST /api/onboarding/complete-step → Schritt abschließen         │
│  POST /api/onboarding/skip          → Onboarding überspringen     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 E-Mail-Versand für Einladungen

```
┌─────────────────────────────────────────────────────────────────────┐
│  ENTSCHEIDUNG: Wie versenden wir Einladungs-E-Mails?               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LÖSUNG: Resend API                                                │
│  ──────────────────────                                             │
│                                                                     │
│  • Bereits in Spec vorgesehen                                       │
│  • Einfache Integration (npm package)                               │
│  • Gutes Preis-Leistungs-Verhältnis                               │
│                                                                     │
│  ABLAUF:                                                            │
│  1. User klickt "Einladen"                                          │
│  2. API erstellt Einladung in DB mit Token                         │
│  3. API ruft Resend auf mit:                                        │
│     - Empfänger: eingeladene E-Mail                               │
│     - Template: Einladungs-E-Mail (HTML)                           │
│     - Link: /invite/accept?token=[uuid]                            │
│  4. Erfolgs-Meldung an User                                         │
│                                                                     │
│  HINWEIS: Resend-Setup (API Key, Domain) wird als bestehend         │
│  angenommen. Falls nicht: Separate Setup-Task erforderlich.         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.4 Plan-Limit Durchsetzung

```
┌─────────────────────────────────────────────────────────────────────┐
│  ENTSCHEIDUNG: Wie setzen wir Plan-Limits durch?                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LÖSUNG: Server-seitige Prüfung bei jeder Aktion                 │
│  ──────────────────────────────────────────────────                 │
│                                                                     │
│  BEI BASE AKTIVIEREN:                                               │
│  1. Zähle aktive monitored_bases für Org                         │
│  2. Hole Plan-Limit aus organizations.plan                         │
│  3. Wenn limit erreicht → Fehler 403 + Upgrade-Hinweis            │
│  4. Wenn ok → Eintrag erstellen                                    │
│                                                                     │
│  BEI TEAM EINLADEN:                                                 │
│  1. Zähle organization_members für Org                           │
│  2. Zähle ausstehende organization_invitations                    │
│  3. Summe mit Plan-Limit vergleichen                               │
│  4. Wenn limit erreicht → Fehler 403 + Upgrade-Hinweis            │
│                                                                     │
│  UI-FEEDBACK:                                                       │
│  • Limit-Anzeige: "3 von 5 Bases überwacht"                       │
│  • Progress-Bar zur Visualisierung                                  │
│  • Upgrade-CTA wenn nahe am Limit                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Seiten-Struktur - Was wird wo angezeigt?

### 8.1 Neue Seiten

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NEUE SEITEN                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ONBOARDING (Wizard)                                                │
│  /onboarding                                                        │
│  ├── /onboarding/organization    → Schritt 1: Org erstellen        │
│  ├── /onboarding/airtable        → Schritt 2: Airtable verbinden   │
│  ├── /onboarding/bases           → Schritt 3: Bases auswählen     │
│  └── /onboarding/team            → Schritt 4: Team einladen        │
│                                                                     │
│  SETTINGS (Erweiterungen)                                           │
│  /settings                                                          │
│  ├── /settings/organization      → NEU: Org-Einstellungen          │
│  ├── /settings/team              → NEU: Team-Verwaltung            │
│  ├── /settings/bases             → NEU: Base-Auswahl               │
│  └── /settings/connections       → EXISTIERT (PROJ-2)              │
│                                                                     │
│  EINLADUNGEN                                                        │
│  /invite                                                            │
│  └── /invite/accept              → Einladung annehmen/ablehnen     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Komponenten-Hierarchie (Onboarding)

```
┌─────────────────────────────────────────────────────────────────────┐
│  /onboarding/organization                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OnboardingLayout                                                   │
│  └── Fortschrittsleiste (Schritt 1 von 4)                          │
│  └── OnboardingOrganizationPage                                     │
│      └── Willkommens-Text                                           │
│      └── OrganizationForm                                           │
│          └── Input: Organisationsname                               │
│          └── Validierung (min 2 Zeichen)                            │
│      └── WeiterButton                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  /onboarding/airtable                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OnboardingLayout                                                   │
│  └── Fortschrittsleiste (Schritt 2 von 4)                          │
│  └── OnboardingAirtablePage                                         │
│      └── Erklärungstext (Warum Airtable verbinden)                │
│      └── Berechtigungsliste (Was wir lesen, was nicht)             │
│      └── ConnectButton (bestehende Komponente!)                     │
│      └── ÜberspringenButton                                        │
│      └── [Falls verbunden: Verbindungsliste]                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  /onboarding/bases                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OnboardingLayout                                                   │
│  └── Fortschrittsleiste (Schritt 3 von 4)                          │
│  └── OnboardingBasesPage                                            │
│      └── LimitAnzeige ("2 von 3 Bases ausgewählt")                │
│      └── WorkspaceList                                              │
│          └── WorkspaceAccordion (pro Workspace)                     │
│              └── BaseCheckbox (pro Base)                            │
│      └── UpgradeHinweis (wenn Plan-Limit)                          │
│      └── WeiterButton (min 1 Base ausgewählt)                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  /onboarding/team                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OnboardingLayout                                                   │
│  └── Fortschrittsleiste (Schritt 4 von 4)                          │
│  └── OnboardingTeamPage                                             │
│      └── Erklärungstext                                            │
│      └── InviteForm                                                 │
│          └── EmailInput (kommagetrennt)                             │
│          └── RollenDropdown                                         │
│      └── EinladenButton                                             │
│      └── ÜberspringenButton                                        │
│      └── [Falls eingeladen: Bestätigung]                          │
│      └── AbschlussButton ("Zum Dashboard")                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3 Komponenten-Hierarchie (Settings)

```
┌─────────────────────────────────────────────────────────────────────┐
│  /settings (gemeinsames Layout)                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SettingsLayout                                                     │
│  └── Navbar (bestehend)                                             │
│  └── ContentWrapper                                                 │
│      └── SettingsSidebar                                            │
│          └── NavLink: Profil                                        │
│          └── NavLink: Organisation (NEU)                            │
│          └── NavLink: Team (NEU)                                    │
│          └── NavLink: Bases (NEU)                                   │
│          └── NavLink: Verbindungen                                  │
│      └── [Seiten-Content]                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  /settings/organization                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OrganizationSettingsPage                                           │
│  └── PageHeader ("Organisation")                                    │
│  └── OrgInfoCard                                                    │
│      └── OrgName (editierbar für Owner)                           │
│      └── OrgSlug (read-only)                                        │
│      └── Erstellungsdatum                                           │
│  └── PlanInfoCard                                                   │
│      └── Aktueller Plan                                             │
│      └── Nutzungs-Statistiken                                       │
│      └── UpgradeButton                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  /settings/team                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TeamSettingsPage                                                   │
│  └── PageHeader ("Team")                                            │
│  └── InviteButton (für Owner/Admin)                               │
│  └── Tabs                                                           │
│      └── Tab: Mitglieder                                            │
│          └── MemberList                                             │
│              └── MemberRow (pro Mitglied)                           │
│                  └── Avatar, Name, Email                            │
│                  └── RollenDropdown (nur Owner)                     │
│                  └── EntfernenButton (nur Owner)                    │
│      └── Tab: Ausstehende Einladungen                               │
│          └── InvitationList                                         │
│              └── InvitationRow (pro Einladung)                      │
│                  └── Email, Rolle, Ablaufdatum                      │
│                  └── ErneutSendenButton                             │
│                  └── WiderrufenButton                               │
│  └── InviteDialog (Modal)                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  /settings/bases                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BasesSettingsPage                                                  │
│  └── PageHeader ("Airtable Bases")                                  │
│  └── SyncButton ("Bases aktualisieren")                             │
│  └── LimitAnzeige + ProgressBar                                     │
│  └── WorkspaceList                                                  │
│      └── WorkspaceSection (pro Workspace)                           │
│          └── WorkspaceHeader (Name, Account)                        │
│          └── BaseList                                               │
│              └── BaseRow (pro Base)                                 │
│                  └── BaseName                                       │
│                  └── StatusToggle (Überwacht/Inaktiv)              │
│                  └── LetzteAktualisierung                           │
│  └── UpgradeHinweis (wenn Limit erreicht)                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 9. API-Struktur

### 9.1 Neue API Endpoints

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NEUE API ENDPOINTS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ONBOARDING                                                         │
│  ────────────────────────────────────────────────────────────────── │
│  GET  /api/onboarding/status                                        │
│       → Gibt aktuellen Schritt und Status zurück                  │
│                                                                     │
│  POST /api/onboarding/complete-step                                 │
│       Body: { step: 1|2|3|4, data: {...} }                         │
│       → Schritt abschließen, zum nächsten wechseln               │
│                                                                     │
│  POST /api/onboarding/skip                                          │
│       → Onboarding komplett überspringen                          │
│                                                                     │
│  ORGANIZATIONS (Erweiterung)                                        │
│  ────────────────────────────────────────────────────────────────── │
│  GET  /api/organizations              (EXISTIERT)                   │
│  POST /api/organizations              (EXISTIERT)                   │
│                                                                     │
│  PATCH /api/organizations/[id]        (NEU)                         │
│        Body: { name: "Neuer Name" }                                 │
│        → Org-Daten aktualisieren (nur Owner)                       │
│                                                                     │
│  DELETE /api/organizations/[id]       (NEU)                         │
│         → Organisation löschen (nur Owner)                        │
│                                                                     │
│  TEAM/MITGLIEDER                                                    │
│  ────────────────────────────────────────────────────────────────── │
│  GET    /api/organizations/[id]/members                             │
│         → Alle Mitglieder auflisten                                │
│                                                                     │
│  PATCH  /api/organizations/[id]/members/[userId]                    │
│         Body: { role: "admin"|"member"|"viewer" }                  │
│         → Rolle ändern (nur Owner)                                │
│                                                                     │
│  DELETE /api/organizations/[id]/members/[userId]                    │
│         → Mitglied entfernen (nur Owner)                           │
│                                                                     │
│  EINLADUNGEN                                                        │
│  ────────────────────────────────────────────────────────────────── │
│  GET  /api/organizations/[id]/invitations                           │
│       → Ausstehende Einladungen auflisten                          │
│                                                                     │
│  POST /api/organizations/[id]/invitations                           │
│       Body: { email: "...", role: "..." }                          │
│       → Neue Einladung erstellen + E-Mail senden                   │
│                                                                     │
│  DELETE /api/organizations/[id]/invitations/[invId]                 │
│         → Einladung widerrufen                                     │
│                                                                     │
│  GET  /api/invitations/[token]           (öffentlich)             │
│       → Einladungsdetails abrufen (Org-Name, Rolle)                │
│                                                                     │
│  POST /api/invitations/[token]/accept                               │
│       → Einladung annehmen                                          │
│                                                                     │
│  POST /api/invitations/[token]/decline                              │
│       → Einladung ablehnen                                          │
│                                                                     │
│  BASES                                                              │
│  ────────────────────────────────────────────────────────────────── │
│  GET  /api/organizations/[id]/bases                                 │
│       → Alle verfügbaren Bases (aus allen Verbindungen)           │
│                                                                     │
│  GET  /api/organizations/[id]/bases/monitored                       │
│       → Nur überwachte Bases                                      │
│                                                                     │
│  POST /api/organizations/[id]/bases/[baseId]/monitor                │
│       → Überwachung aktivieren                                    │
│                                                                     │
│  DELETE /api/organizations/[id]/bases/[baseId]/monitor              │
│         → Überwachung deaktivieren                                │
│                                                                     │
│  POST /api/organizations/[id]/bases/sync                            │
│       → Bases von Airtable neu laden                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. Wiederverwendbare Komponenten

### 10.1 Bestehende Komponenten (wiederverwenden)

```
┌─────────────────────────────────────────────────────────────────────┐
│  BESTEHENDE KOMPONENTEN ZUM WIEDERVERWENDEN                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  AUS PROJ-2 (Airtable):                                             │
│  • ConnectButton       → Im Onboarding Schritt 2                   │
│  • ConnectionList      → Referenz für BaseList                    │
│  • StatusBadge         → Für Monitoring-Status                    │
│  • PlanLimitBanner     → Für Base-Limits                          │
│                                                                     │
│  AUS shadcn/ui:                                                     │
│  • Dialog              → Für Einladungs-Modal                     │
│  • Tabs                → Für Team-Seite (Mitglieder/Einladungen)  │
│  • Switch/Checkbox     → Für Base-Toggle                          │
│  • Progress            → Für Limit-Anzeige                        │
│  • Accordion           → Für Workspace-Gruppierung                │
│  • Avatar              → Für Team-Liste                           │
│  • Badge               → Für Rollen-Anzeige                       │
│  • DropdownMenu        → Für Rollen-Änderung                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Neue Komponenten (zu erstellen)

```
┌─────────────────────────────────────────────────────────────────────┐
│  NEUE KOMPONENTEN                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ONBOARDING:                                                        │
│  • OnboardingLayout         → Gemeinsames Layout mit Fortschritt   │
│  • OnboardingProgress       → Schritt-Anzeige (1-2-3-4)            │
│  • OnboardingStep           → Wrapper für jeden Schritt           │
│                                                                     │
│  TEAM:                                                              │
│  • MemberList               → Liste der Mitglieder                 │
│  • MemberRow                → Einzelnes Mitglied                   │
│  • InviteDialog             → Modal zum Einladen                   │
│  • InvitationList           → Liste ausstehender Einladungen       │
│  • RoleBadge                → Farbige Rollen-Anzeige               │
│  • RoleSelector             → Dropdown zur Rollenauswahl           │
│                                                                     │
│  BASES:                                                             │
│  • BaseList                 → Liste der Bases                      │
│  • BaseRow                  → Einzelne Base mit Toggle             │
│  • WorkspaceGroup           → Gruppierung nach Workspace           │
│  • MonitoringToggle         → Switch für Aktiv/Inaktiv            │
│                                                                     │
│  SETTINGS:                                                          │
│  • SettingsSidebar          → Navigation links                     │
│  • SettingsSection          → Gruppierung von Einstellungen        │
│  • OrgNameEditor            → Inline-Editing für Org-Name         │
│  • UsageStats               → Nutzungs-Anzeige mit Bars            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 11. Abhängigkeiten und Dependencies

### 11.1 Neue Packages

```
┌─────────────────────────────────────────────────────────────────────┐
│  BENÖTIGTE NPM PACKAGES                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  resend                                                             │
│  ────────                                                           │
│  Für: E-Mail-Versand (Einladungen)                                │
│  Warum: Einfache API, gutes Pricing, React-Email Support           │
│                                                                     │
│  @react-email/components (optional)                                 │
│  ────────────────────────────────                                   │
│  Für: Schöne E-Mail-Templates                                    │
│  Warum: Wiederverwendbare Komponenten für E-Mails                 │
│                                                                     │
│  BEREITS VORHANDEN:                                                 │
│  • zod (Validierung)                                                │
│  • react-hook-form (Formulare)                                      │
│  • @supabase/ssr (Auth + DB)                                        │
│  • sonner (Toast-Nachrichten)                                       │
│  • lucide-react (Icons)                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 12. Implementierungs-Reihenfolge (Empfehlung)

```
┌─────────────────────────────────────────────────────────────────────┐
│  EMPFOHLENE REIHENFOLGE                                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PHASE 1: Grundlagen (Backend)                                      │
│  ───────────────────────────────                                    │
│  1. Datenbank-Tabellen erstellen (Migration)                        │
│  2. RLS Policies einrichten                                         │
│  3. API: /api/onboarding/* Endpoints                               │
│  4. Protected Layout erweitern (Onboarding-Check)                   │
│                                                                     │
│  PHASE 2: Onboarding Wizard (Frontend)                              │
│  ───────────────────────────────────────                            │
│  5. OnboardingLayout + Progress-Komponente                          │
│  6. Schritt 1: Organisation erstellen                               │
│  7. Schritt 2: Airtable verbinden (ConnectButton wiederverwenden)  │
│  8. Schritt 3: Bases auswählen                                    │
│  9. Schritt 4: Team einladen (ohne E-Mail erstmal)                 │
│                                                                     │
│  PHASE 3: Team Management                                           │
│  ────────────────────────                                           │
│  10. API: /api/organizations/[id]/members/*                        │
│  11. API: /api/organizations/[id]/invitations/*                    │
│  12. API: /api/invitations/[token]/*                               │
│  13. Resend Integration (E-Mail-Versand)                           │
│  14. /settings/team Seite                                           │
│  15. /invite/accept Seite                                           │
│                                                                     │
│  PHASE 4: Base Selection + Settings                                 │
│  ──────────────────────────────────                                 │
│  16. API: /api/organizations/[id]/bases/*                          │
│  17. /settings/bases Seite                                          │
│  18. /settings/organization Seite                                   │
│  19. Settings-Sidebar Navigation                                    │
│                                                                     │
│  PHASE 5: Polish + Edge Cases                                       │
│  ────────────────────────────                                       │
│  20. Edge Cases implementieren (siehe Spec)                         │
│  21. UI/UX Polish                                                   │
│  22. Testing                                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 13. Offene Fragen (vor Implementierung zu klären)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ZU KLÄRENDE PUNKTE                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. RESEND SETUP                                                    │
│     Ist Resend bereits konfiguriert (API Key, Domain)?             │
│     → Falls nein: Muss zuerst eingerichtet werden                  │
│                                                                     │
│  2. UPGRADE-CTA ZIEL                                                │
│     Wohin führt "Plan upgraden"?                                  │
│     → Aktuell: Placeholder-Link oder externe URL?                  │
│                                                                     │
│  3. MULTI-ORG SUPPORT                                               │
│     Soll ein User später mehreren Orgs angehören?               │
│     → Beeinflusst Datenmodell und Einladungs-Flow                  │
│                                                                     │
│  4. AUDIT LOG                                                       │
│     Sollen Aktionen wie Rollen-Änderungen geloggt werden?         │
│     → Zusätzliche Tabelle erforderlich                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Nächste Schritte

Nach Freigabe dieser Architektur:

1. **Review** - Passt das Design zu den Anforderungen?
2. **Offene Fragen klären** - Besonders Resend-Setup
3. **Frontend Developer beauftragen** - Mit Implementierung starten

---

*Architektur erstellt: 2026-02-03*
*Solution Architect: Claude*
*Basierend auf: PROJ-3-organization-onboarding-management.md*
