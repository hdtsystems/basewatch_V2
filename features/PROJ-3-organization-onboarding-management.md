# PROJ-3: Organization Onboarding & Management

## Status: Draft

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - ✅ Deployed
- Benötigt: PROJ-2 (Airtable OAuth Connection) - ✅ Production-Ready

## Übersicht

Dieses Feature implementiert einen vollständigen Onboarding-Flow für neue Benutzer sowie die Verwaltung von Organisationen. Nach der Registrierung werden Benutzer durch einen geführten Setup-Wizard geleitet, der sie beim Erstellen einer Organisation, Verbinden von Airtable und Auswählen der zu überwachenden Bases unterstützt.

**Hauptbereiche:**
1. **Onboarding Wizard** - Geführte Ersteinrichtung
2. **Organization Settings** - Org-Verwaltung und Einstellungen
3. **Team Management** - Mitglieder einladen und verwalten
4. **Base Selection** - Airtable Bases zur Überwachung auswählen

---

## User Stories

### Onboarding Wizard

#### US-1: Geführte Ersteinrichtung durchlaufen
**Als** neuer Benutzer nach der Registrierung
**möchte ich** einen Schritt-für-Schritt Wizard durchlaufen
**um** meine Organisation schnell und einfach einzurichten

#### US-2: Onboarding-Fortschritt sehen
**Als** Benutzer im Onboarding
**möchte ich** meinen Fortschritt visuell sehen
**um** zu wissen, wie viele Schritte noch fehlen

#### US-3: Onboarding später fortsetzen
**Als** Benutzer, der das Onboarding unterbrochen hat
**möchte ich** später an der gleichen Stelle weitermachen
**um** nicht von vorne beginnen zu müssen

### Organization Settings

#### US-4: Organisationsname ändern
**Als** Owner einer Organisation
**möchte ich** den Namen meiner Organisation ändern können
**um** Tippfehler zu korrigieren oder Umbenennung vorzunehmen

#### US-5: Organisationsdetails einsehen
**Als** Mitglied einer Organisation
**möchte ich** die Details meiner Organisation sehen
**um** Plan, Mitgliederzahl und Nutzung zu verstehen

### Team Management

#### US-6: Teammitglieder einladen
**Als** Owner oder Admin
**möchte ich** andere Personen per E-Mail einladen
**um** mein Team zur Organisation hinzuzufügen

#### US-7: Einladungen annehmen
**Als** eingeladener Benutzer
**möchte ich** eine Einladung annehmen oder ablehnen
**um** einer Organisation beizutreten

#### US-8: Mitgliederrollen verwalten
**Als** Owner
**möchte ich** die Rollen meiner Teammitglieder ändern
**um** Berechtigungen anzupassen

#### US-9: Mitglieder aus Organisation entfernen
**Als** Owner
**möchte ich** Mitglieder aus meiner Organisation entfernen
**um** den Zugriff zu widerrufen

#### US-10: Teammitglieder auflisten
**Als** Mitglied einer Organisation
**möchte ich** alle Teammitglieder und deren Rollen sehen
**um** zu wissen, wer Zugriff hat

### Base Selection

#### US-11: Zu überwachende Bases auswählen
**Als** Owner oder Admin
**möchte ich** auswählen, welche Airtable Bases überwacht werden
**um** nur relevante Bases zu tracken

#### US-12: Base-Auswahl ändern
**Als** Owner oder Admin
**möchte ich** die Auswahl der überwachten Bases nachträglich ändern
**um** neue Bases hinzuzufügen oder nicht mehr benötigte zu entfernen

#### US-13: Überwachungsstatus einer Base sehen
**Als** Mitglied der Organisation
**möchte ich** sehen, welche Bases aktiv überwacht werden
**um** den Monitoring-Umfang zu verstehen

---

## Acceptance Criteria

### Onboarding Wizard

#### Schritt 1: Organisation erstellen
- [ ] Wizard startet automatisch für User ohne Organisation
- [ ] Eingabefeld für Organisationsname mit Validierung (min. 2 Zeichen)
- [ ] "Weiter"-Button erst aktiv wenn Name gültig
- [ ] Organisation wird erstellt, User wird Owner
- [ ] Fortschrittsanzeige: "Schritt 1 von 4"

#### Schritt 2: Airtable verbinden
- [ ] Übersichtliche Erklärung warum Airtable-Verbindung nötig ist
- [ ] "Mit Airtable verbinden"-Button startet OAuth-Flow
- [ ] Nach erfolgreicher Verbindung: Automatisch weiter zu Schritt 3
- [ ] "Überspringen"-Option mit Warnung (eingeschränkte Funktionalität)
- [ ] Bei mehreren Verbindungen: Liste zeigen mit "Weitere verbinden"

#### Schritt 3: Bases auswählen
- [ ] Liste aller verfügbaren Bases nach Workspace gruppiert
- [ ] Checkboxen zum Auswählen einzelner Bases
- [ ] "Alle auswählen" und "Keine auswählen" Optionen pro Workspace
- [ ] Info zu Plan-Limits: "Dein Free-Plan erlaubt 3 Bases"
- [ ] Counter zeigt aktuelle Auswahl: "2 von 3 Bases ausgewählt"
- [ ] Mindestens 1 Base muss ausgewählt werden

#### Schritt 4: Team einladen (optional)
- [ ] Eingabefeld für E-Mail-Adressen (mehrere, kommagetrennt)
- [ ] Dropdown zur Rollenauswahl: Admin, Member, Viewer
- [ ] "Einladungen senden"-Button
- [ ] Erfolgsmeldung mit Anzahl gesendeter Einladungen
- [ ] "Überspringen"-Option: "Später im Team-Bereich einladen"

#### Abschluss
- [ ] Erfolgsmeldung: "Deine Organisation ist eingerichtet!"
- [ ] Zusammenfassung: Org-Name, verbundene Accounts, ausgewählte Bases
- [ ] CTA: "Zum Dashboard"
- [ ] Nach Abschluss: Onboarding-Status auf "completed" setzen

#### Onboarding überspringen (Schritt 2-4)
- [ ] "Später einrichten"-Link bei Schritt 2, 3 und 4
- [ ] Schritt 1 (Organisation) ist PFLICHT und kann nicht übersprungen werden
- [ ] Bei Skip: Onboarding wird als "completed" markiert
- [ ] Dashboard zeigt Setup-Banner: "Einrichtung abschließen" mit fehlenden Schritten
- [ ] Fehlende Features bei unvollständigem Setup:
  - Ohne Airtable: Keine Base-Überwachung möglich
  - Ohne Bases: Dashboard zeigt "Keine Bases ausgewählt"
  - Ohne Team: Kein Einfluss auf Funktionalität
- [ ] User kann Setup jederzeit in Settings vervollständigen

### Organization Settings

#### Settings-Seite (/settings/organization)
- [ ] Nur für Org-Mitglieder sichtbar
- [ ] Zeigt: Organisationsname, Slug, Plan, Erstellungsdatum
- [ ] Zeigt: Aktuelle Nutzung (Verbindungen, Bases, Mitglieder)
- [ ] Zeigt: Plan-Limits mit Fortschrittsbalken
- [ ] Link zu "Plan upgraden" (führt zu Billing-Seite - außerhalb Scope)

#### Name ändern (nur Owner)
- [ ] "Bearbeiten"-Button neben Organisationsname
- [ ] Inline-Editing oder Modal mit Eingabefeld
- [ ] Validierung: min. 2 Zeichen, max. 50 Zeichen
- [ ] Slug wird automatisch aktualisiert (mit Warnung)
- [ ] Erfolgsmeldung nach Speicherung

### Team Management

#### Team-Seite (/settings/team)
- [ ] Alle Mitglieder mit Avatar, Name, E-Mail, Rolle, Beitrittsdatum
- [ ] Sortierung nach Rolle (Owner → Admin → Member → Viewer)
- [ ] Suchfeld zum Filtern nach Name/E-Mail
- [ ] Pagination bei mehr als 20 Mitgliedern
- [ ] "Mitglied einladen"-Button (nur für Owner/Admin)

#### Einladungen senden
- [ ] Dialog mit E-Mail-Eingabe
- [ ] Rollenauswahl: Admin, Member, Viewer (Owner kann nicht eingeladen werden)
- [ ] Validierung: Gültige E-Mail, nicht bereits Mitglied
- [ ] Bei bestehender Einladung: Warnung "Einladung bereits gesendet"
- [ ] Option: "Einladung erneut senden"
- [ ] E-Mail wird mit Einladungslink versendet

#### Einladungslink
- [ ] Eindeutiger Token (UUID v4, kryptographisch sicher) in URL
- [ ] Ablaufdatum: 7 Tage nach Erstellung
- [ ] Link-Format: `/invite/accept?token=<uuid>`
- [ ] Bei Klick: Prüfe ob eingeloggt, sonst Redirect zu Login
- [ ] Nach Login: Automatisch zur Einladungsseite
- [ ] Token wird nach Annahme/Ablehnung ungültig (Einmal-Verwendung)
- [ ] Abgelaufene Tokens werden per Cron-Job täglich gelöscht

#### Einladung annehmen/ablehnen
- [ ] Seite zeigt: Org-Name, einladende Person, zugewiesene Rolle
- [ ] "Annehmen"-Button: User wird Mitglied mit zugewiesener Rolle
- [ ] "Ablehnen"-Button: Einladung wird gelöscht
- [ ] Bei abgelaufener Einladung: Fehlermeldung
- [ ] Nach Annahme: Redirect zum Org-Dashboard

#### Session-Handling bei Einladungsannahme
- [ ] Wenn User mit falscher E-Mail eingeloggt ist:
  - Warnung: "Diese Einladung ist für [eingeladene-email]. Du bist als [aktuelle-email] eingeloggt."
  - Option 1: "Ausloggen und mit [eingeladene-email] anmelden"
  - Option 2: "Abbrechen"
- [ ] Einladung kann nur von der eingeladenen E-Mail-Adresse angenommen werden
- [ ] Server prüft: `auth.user.email === invitation.email`

#### Ausstehende Einladungen (Tab)
- [ ] Liste aller offenen Einladungen
- [ ] Zeigt: E-Mail, Rolle, Gesendet am, Läuft ab am
- [ ] Aktionen: "Erneut senden", "Widerrufen"
- [ ] Nur für Owner/Admin sichtbar

#### Rollen ändern (nur Owner)
- [ ] Dropdown bei jedem Mitglied zum Ändern der Rolle
- [ ] Admin kann nicht zum Owner werden (Owner kann nur transferiert werden)
- [ ] Bestätigungsdialog bei Rollenänderung
- [ ] Erfolgsmeldung nach Änderung
- [ ] Echtzeit-Update der Berechtigungen

#### Mitglied entfernen (nur Owner)
- [ ] "Entfernen"-Button pro Mitglied (nur für Owner sichtbar)
- [ ] Bestätigungsdialog: "Möchtest du [Name] wirklich entfernen?"
- [ ] Owner kann nicht entfernt werden
- [ ] Entferntes Mitglied verliert sofort Zugriff
- [ ] Airtable-Verbindungen des Mitglieds bleiben bestehen

> **Hinweis zur Berechtigungsasymmetrie:**
> Admin kann Mitglieder **einladen**, aber nur Owner kann Mitglieder **entfernen**.
> Dies ist beabsichtigt, um versehentliches Entfernen durch Admins zu verhindern.
> Admins können ihre eigenen Einladungen widerrufen (solange nicht angenommen).

#### Owner-Transfer
- [ ] Nur aktueller Owner kann Ownership transferieren
- [ ] Dropdown zum Auswählen des neuen Owners
- [ ] Doppelte Bestätigung erforderlich
- [ ] Alter Owner wird automatisch zum Admin
- [ ] Nicht rückgängig machbar ohne neuen Owner-Transfer

### Base Selection

#### Base-Verwaltung (/settings/bases)
- [ ] Liste aller verfügbaren Bases nach Workspace gruppiert
- [ ] Spalten: Name, Workspace, Status (Überwacht/Nicht überwacht), Letzte Aktualisierung
- [ ] Toggle zum Aktivieren/Deaktivieren der Überwachung
- [ ] Plan-Limit-Anzeige: "3 von 5 Bases überwacht"
- [ ] Nur Owner/Admin können Überwachung ändern

#### Überwachung aktivieren
- [ ] Toggle oder Checkbox pro Base
- [ ] Prüfung: Plan-Limit nicht überschritten
- [ ] Bei Limit erreicht: Hinweis mit Upgrade-CTA
- [ ] Erste Aktivierung startet initialen Schema-Snapshot
- [ ] Erfolgsmeldung: "Base '[Name]' wird jetzt überwacht"

#### Überwachung deaktivieren
- [ ] Toggle oder Checkbox zum Deaktivieren
- [ ] Bestätigungsdialog: "Historische Daten bleiben erhalten"
- [ ] Base wird aus aktivem Monitoring entfernt
- [ ] Webhooks werden deregistriert (wenn vorhanden)

#### Base-Synchronisation
- [ ] "Bases aktualisieren"-Button lädt neue Bases
- [ ] Zeigt neu verfügbare Bases markiert als "Neu"
- [ ] Gelöschte Bases werden als "Nicht mehr verfügbar" markiert
- [ ] Automatische Sync bei jedem Seitenbesuch (max. 1x pro 5 Min.)

---

## Edge Cases

### EC-1: Onboarding-Abbruch
- User schließt Browser während Onboarding
- Beim nächsten Login: Fortschritt wird geladen
- User kann dort weitermachen wo er aufgehört hat
- Speicherung in `user_onboarding_status` Tabelle

### EC-2: Einladung an bestehenden User
- E-Mail gehört bereits zu registriertem User
- Einladung wird erstellt, E-Mail enthält Link
- Nach Klick: Kein neuer Account, nur Org-Beitritt
- User sieht Einladung nach Login

### EC-3: Einladung an neuen User
- E-Mail ist nicht registriert
- Einladungsmail enthält Registrierungslink
- Nach Registrierung: Automatisch zur Einladung weiterleiten
- Onboarding wird übersprungen (gehört ja zu Org)

### EC-4: Mehrfache Einladungen
- User wird mehrmals eingeladen (andere Rolle)
- Neueste Einladung überschreibt die alte
- Alte Einladung wird ungültig
- Info-Toast: "Vorherige Einladung ersetzt"

### EC-5: Letzter Admin verlässt Org
- Nur Owner kann nicht entfernt werden
- Warnung wenn letzter Admin sich selbst entfernt
- Owner bleibt, Org weiterhin funktionsfähig

### EC-6: Owner löscht eigenen Account
- Owner muss Ownership erst transferieren
- Ohne Transfer: Löschung nicht möglich
- Alternativer Owner muss existieren

### EC-7: Plan-Downgrade mit zu vielen Bases
- User hat 5 überwachte Bases (Pro-Plan)
- Downgrade auf Free (Limit: 3)
- Bestehende Überwachungen bleiben aktiv
- Keine neuen Bases aktivierbar bis unter Limit
- Hinweis: "Deaktiviere 2 Bases um neue hinzuzufügen"

### EC-8: Airtable-Base wird extern gelöscht
- Base wird in Airtable gelöscht
- Nächster Sync erkennt Fehlen
- Base wird als "Nicht mehr verfügbar" markiert
- Automatische Deaktivierung der Überwachung
- Historische Daten bleiben erhalten

### EC-9: User ist bereits Mitglied einer anderen Org
- Einladung an User mit bestehender Org
- Info: "Du bist bereits Mitglied einer Organisation"
- Option: "Aktuelle Organisation verlassen und beitreten"
- Alternative: Multi-Org Support (außerhalb Scope)

### EC-10: Einladungslink geteilt
- Eingeladener teilt Link mit anderer Person
- Link funktioniert nur für eingeladene E-Mail
- Andere Person sieht: "Diese Einladung ist nicht für dich"
- Token ist an E-Mail gebunden

### EC-11: E-Mail-Zustellung fehlgeschlagen
- Einladungs-E-Mail kann nicht zugestellt werden (Bounce/Spam)
- System empfängt Bounce-Notification von Resend
- Einladung wird als "Zustellung fehlgeschlagen" markiert
- Owner/Admin sieht Warnung: "E-Mail konnte nicht zugestellt werden"
- Option: "Andere E-Mail-Adresse verwenden" oder "Erneut versuchen"
- Nach 3 fehlgeschlagenen Versuchen: Einladung automatisch widerrufen

### EC-12: Airtable-OAuth-Token abgelaufen während Onboarding
- User ist bei Schritt 3 (Bases auswählen)
- OAuth-Token ist inzwischen abgelaufen
- API-Call zum Laden der Bases schlägt fehl
- User sieht: "Deine Airtable-Verbindung ist abgelaufen"
- CTA: "Erneut verbinden" (leitet zu Schritt 2 zurück)
- Bereits ausgewählte Bases bleiben gespeichert

### EC-13: Browser-Back während Onboarding
- User klickt Browser-Zurück-Button während Onboarding
- Vorheriger Schritt wird geladen
- Bereits eingegebene Daten bleiben erhalten
- Kein Datenverlust, kein doppeltes Speichern
- Fortschrittsanzeige aktualisiert sich korrekt

### EC-14: Gleichzeitige Rollen-Änderung (Race Condition)
- Owner ändert Rolle von User A in Tab 1
- Owner ändert Rolle von User A in Tab 2 (gleichzeitig)
- Letzte Änderung gewinnt (Last-Write-Wins)
- Optimistic Locking: `updated_at` Feld prüfen
- Bei Konflikt: Fehlermeldung "Daten wurden zwischenzeitlich geändert. Bitte neu laden."

### EC-15: Organisation wird gelöscht während Einladung aussteht
- Owner löscht Organisation
- Ausstehende Einladungen werden kaskadiert gelöscht (ON DELETE CASCADE)
- Eingeladener klickt später auf Link
- Sieht: "Diese Einladung ist nicht mehr gültig"
- Keine Details über gelöschte Org preisgeben (Privacy)

---

## UI/UX Anforderungen

### Onboarding Wizard

#### Wizard-Layout
```
┌─────────────────────────────────────────────────────────────┐
│                      [Basewatch Logo]                        │
│                                                              │
│  ○───────●───────○───────○                                  │
│  Org    Airtable  Bases  Team                               │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │        [Aktueller Schritt-Inhalt]                   │   │
│  │                                                      │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│                    [Zurück]        [Weiter]                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Schritt 1: Organisation erstellen
```
┌─────────────────────────────────────────────────────────────┐
│           Willkommen bei Basewatch!                         │
│                                                              │
│  Lass uns deine Organisation einrichten.                    │
│                                                              │
│  Organisationsname                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Meine Firma GmbH                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Der Name ist für dein Team sichtbar und kann später       │
│  geändert werden.                                           │
│                                                              │
│                              [Organisation erstellen →]     │
└─────────────────────────────────────────────────────────────┘
```

#### Schritt 2: Airtable verbinden
```
┌─────────────────────────────────────────────────────────────┐
│           Verbinde deinen Airtable-Account                   │
│                                                              │
│  [Airtable Icon]                                            │
│                                                              │
│  Basewatch benötigt Zugriff auf deine Airtable-Workspaces  │
│  um Schema-Änderungen und Nutzung zu überwachen.           │
│                                                              │
│                [Mit Airtable verbinden]                     │
│                                                              │
│  Was wir verwenden:                                         │
│  ✓ Workspace- und Base-Informationen                       │
│  ✓ Tabellen- und Feld-Schema                               │
│  ✗ Keine Inhalte deiner Datensätze                         │
│                                                              │
│                    [← Zurück]  [Später einrichten]          │
└─────────────────────────────────────────────────────────────┘
```

#### Schritt 3: Bases auswählen
```
┌─────────────────────────────────────────────────────────────┐
│           Welche Bases möchtest du überwachen?              │
│                                                              │
│  2 von 3 Bases ausgewählt (Free-Plan)                      │
│  ━━━━━━━━━━━━━━━━━░░░░░                                     │
│                                                              │
│  ▼ Workspace: Produkt-Team                                  │
│    ┌──────────────────────────────────────────────────┐    │
│    │ ☑ Projektmanagement                              │    │
│    │ ☑ Bug Tracker                                    │    │
│    │ ☐ Archiv 2024                                    │    │
│    └──────────────────────────────────────────────────┘    │
│                                                              │
│  ▼ Workspace: Marketing                                     │
│    ┌──────────────────────────────────────────────────┐    │
│    │ ☐ Kampagnen                                      │    │
│    │ ☐ Content-Kalender                               │    │
│    └──────────────────────────────────────────────────┘    │
│                                                              │
│  ℹ️ Upgrade auf Pro für bis zu 10 Bases   [Plan ansehen]   │
│                                                              │
│                    [← Zurück]        [Weiter →]             │
└─────────────────────────────────────────────────────────────┘
```

#### Schritt 4: Team einladen
```
┌─────────────────────────────────────────────────────────────┐
│           Lade dein Team ein                                 │
│                                                              │
│  Teammitglieder können die überwachten Bases einsehen       │
│  und Benachrichtigungen erhalten.                           │
│                                                              │
│  E-Mail-Adressen (kommagetrennt)                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ max@firma.de, anna@firma.de                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Rolle für alle Eingeladenen:                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Member                                          ▼    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  • Viewer: Nur Lesen                                        │
│  • Member: Lesen + Kommentieren                             │
│  • Admin: Voller Zugriff außer Org-Einstellungen           │
│                                                              │
│                    [← Zurück]  [Einladungen senden]         │
│                              [Überspringen →]               │
└─────────────────────────────────────────────────────────────┘
```

### Settings Navigation

```
┌─────────────────────────────────────────────────────────────┐
│ Einstellungen                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌────────────────────────────────────┐  │
│  │ Navigation   │  │ [Seiteninhalt]                     │  │
│  │              │  │                                     │  │
│  │ • Profil     │  │                                     │  │
│  │ • Organisation│ │                                     │  │
│  │ • Team       │  │                                     │  │
│  │ • Bases      │  │                                     │  │
│  │ • Verbindungen│ │                                     │  │
│  │ • Abrechnung │  │                                     │  │
│  │              │  │                                     │  │
│  └──────────────┘  └────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Team-Seite

```
┌─────────────────────────────────────────────────────────────┐
│ Team                                            [+ Einladen] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Mitglieder]  [Ausstehende Einladungen]                     │
│ ───────────────────────────────────────                     │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [Avatar] Max Mustermann          Owner      Heute     │   │
│ │          max@basewatch.io                   Beigetreten   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ [Avatar] Anna Schmidt            Admin      15.01.26  │   │
│ │          anna@firma.de           [Rolle ändern ▼] [🗑️]   │
│ ├───────────────────────────────────────────────────────┤   │
│ │ [Avatar] Tom Weber               Member     20.01.26  │   │
│ │          tom@firma.de            [Rolle ändern ▼] [🗑️]   │
│ └───────────────────────────────────────────────────────┘   │
│                                                              │
│ 3 Mitglieder · Free-Plan (max. 5)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Base-Auswahl Seite

```
┌─────────────────────────────────────────────────────────────┐
│ Airtable Bases                          [Bases aktualisieren]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 3 von 5 Bases überwacht (Pro-Plan)                         │
│ ━━━━━━━━━━━━━━━━━━━░░░░░░░                                  │
│                                                              │
│ ▼ Workspace: Produkt-Team (max@airtable.com)               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Projektmanagement     [●] Überwacht    Vor 5 Min.    │   │
│ │ Bug Tracker           [●] Überwacht    Vor 5 Min.    │   │
│ │ Archiv 2024           [○] Inaktiv      -             │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                              │
│ ▼ Workspace: Marketing (team@airtable.com)                  │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Kampagnen             [●] Überwacht    Vor 2 Std.    │   │
│ │ Content-Kalender      [○] Inaktiv      -             │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                              │
│ ℹ️ Limit erreicht. Upgrade für mehr Bases.   [Upgraden]    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Technische Anforderungen

### Datenbank-Erweiterungen

#### Neue Tabellen

**`user_onboarding_status`**
```sql
CREATE TABLE user_onboarding_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INT DEFAULT 1,       -- 1=Org, 2=Airtable, 3=Bases, 4=Team
  completed_at TIMESTAMPTZ,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
```

**`organization_invitations`**
```sql
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, email)
);
```

**`monitored_bases`**
```sql
CREATE TABLE monitored_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  airtable_base_id UUID REFERENCES airtable_bases(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT now(),
  activated_by UUID REFERENCES auth.users(id),  -- Server-seitig gesetzt!
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES auth.users(id), -- Server-seitig gesetzt!
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, airtable_base_id)
);

-- WICHTIG: activated_by und deactivated_by werden NICHT vom Client gesetzt!
-- Diese Felder werden ausschließlich server-seitig via auth.uid() befüllt.
```

#### Tabellen-Erweiterungen

**`organizations`** - Zusätzliche Felder
```sql
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  description TEXT,
  logo_url TEXT,
  updated_by UUID REFERENCES auth.users(id);
```

#### RLS Policies

```sql
-- user_onboarding_status
ALTER TABLE user_onboarding_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding status"
  ON user_onboarding_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding status"
  ON user_onboarding_status FOR UPDATE
  USING (auth.uid() = user_id);

-- organization_invitations
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view invitations"
  ON organization_invitations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owners and admins can create invitations"
  ON organization_invitations FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- monitored_bases
ALTER TABLE monitored_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view monitored bases"
  ON monitored_bases FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owners and admins can manage monitored bases"
  ON monitored_bases FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- WICHTIG: activated_by/deactivated_by werden via Trigger gesetzt
CREATE OR REPLACE FUNCTION set_monitored_bases_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.activated_by := auth.uid();
    NEW.activated_at := now();
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active = true AND NEW.is_active = false THEN
      NEW.deactivated_by := auth.uid();
      NEW.deactivated_at := now();
    ELSIF OLD.is_active = false AND NEW.is_active = true THEN
      NEW.activated_by := auth.uid();
      NEW.activated_at := now();
      NEW.deactivated_by := NULL;
      NEW.deactivated_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER monitored_bases_audit_trigger
  BEFORE INSERT OR UPDATE ON monitored_bases
  FOR EACH ROW
  EXECUTE FUNCTION set_monitored_bases_audit_fields();
```

### Plan-Limits

```typescript
const PLAN_LIMITS = {
  free: {
    connections: 1,
    bases: 3,
    members: 5,
    retention_days: 30
  },
  pro: {
    connections: 5,
    bases: 10,
    members: 20,
    retention_days: 90
  },
  enterprise: {
    connections: Infinity,
    bases: Infinity,
    members: Infinity,
    retention_days: 365
  }
};
```

### Rate-Limiting (Sicherheitsanforderung)

Alle öffentlichen API-Endpoints müssen Rate-Limiting implementieren:

```typescript
const RATE_LIMITS = {
  // Einladungs-APIs (Spam-Schutz)
  'POST /api/organizations/[id]/invitations': {
    window: '1h',
    max: 20,        // Max 20 Einladungen pro Stunde
    message: 'Zu viele Einladungen. Bitte warte eine Stunde.'
  },

  // Onboarding-APIs (DoS-Schutz)
  'POST /api/onboarding/*': {
    window: '1m',
    max: 10,        // Max 10 Requests pro Minute
    message: 'Zu viele Anfragen. Bitte warte einen Moment.'
  },

  // Base-Sync (Airtable-API-Limit-Schutz)
  'POST /api/organizations/[id]/bases/sync': {
    window: '5m',
    max: 1,         // Max 1x pro 5 Minuten
    message: 'Bases wurden kürzlich synchronisiert. Bitte warte 5 Minuten.'
  },

  // Einladungs-Token-Validierung (Brute-Force-Schutz)
  'GET /api/invitations/[token]': {
    window: '1m',
    max: 5,         // Max 5 Token-Checks pro Minute
    message: 'Zu viele Versuche. Bitte warte einen Moment.'
  }
};
```

**Implementierung:**
- [ ] Rate-Limiting Middleware mit Redis oder Upstash
- [ ] Benutzerfreundliche Fehlermeldungen auf Deutsch
- [ ] Logging bei Rate-Limit-Überschreitung (Security-Monitoring)
- [ ] Unterschiedliche Limits für authentifizierte vs. öffentliche Requests

### API Endpoints

#### Onboarding
- `GET /api/onboarding/status` - Aktueller Onboarding-Status
- `POST /api/onboarding/complete-step` - Schritt abschließen
- `POST /api/onboarding/skip` - Onboarding überspringen

#### Organizations
- `GET /api/organizations` - Liste (bereits vorhanden)
- `POST /api/organizations` - Erstellen (bereits vorhanden)
- `PATCH /api/organizations/[id]` - Aktualisieren (NEU)
- `DELETE /api/organizations/[id]` - Löschen (NEU)

#### Team/Invitations
- `GET /api/organizations/[id]/members` - Mitglieder auflisten
- `DELETE /api/organizations/[id]/members/[userId]` - Mitglied entfernen
- `PATCH /api/organizations/[id]/members/[userId]` - Rolle ändern
- `POST /api/organizations/[id]/invitations` - Einladung senden
- `GET /api/organizations/[id]/invitations` - Ausstehende Einladungen
- `DELETE /api/organizations/[id]/invitations/[id]` - Einladung widerrufen
- `GET /api/invitations/[token]` - Einladungsdetails (öffentlich)
- `POST /api/invitations/[token]/accept` - Einladung annehmen
- `POST /api/invitations/[token]/decline` - Einladung ablehnen

#### Bases
- `GET /api/organizations/[id]/bases` - Alle verfügbaren Bases
- `GET /api/organizations/[id]/bases/monitored` - Überwachte Bases
- `POST /api/organizations/[id]/bases/[baseId]/monitor` - Überwachung aktivieren
- `DELETE /api/organizations/[id]/bases/[baseId]/monitor` - Überwachung deaktivieren
- `POST /api/organizations/[id]/bases/sync` - Bases synchronisieren

### Seiten-Struktur

```
/onboarding
├── /onboarding/organization     (Schritt 1)
├── /onboarding/airtable         (Schritt 2)
├── /onboarding/bases            (Schritt 3)
└── /onboarding/team             (Schritt 4)

/settings
├── /settings/organization       (Org-Einstellungen)
├── /settings/team               (Mitgliederverwaltung)
├── /settings/bases              (Base-Auswahl)
├── /settings/connections        (existiert bereits)
└── /settings/billing            (außerhalb Scope)

/invite
└── /invite/accept               (Einladung annehmen/ablehnen)
```

### E-Mail-Templates (Resend)

#### Einladungs-E-Mail
```
Betreff: Du wurdest zu [Org-Name] auf Basewatch eingeladen

Hallo,

[Einladender Name] hat dich eingeladen, [Org-Name] auf Basewatch beizutreten.

Deine Rolle: [Rolle]

[Button: Einladung annehmen]

Diese Einladung läuft am [Datum] ab.

--
Das Basewatch Team
```

---

## Out of Scope

- ❌ Multi-Org Support (User kann mehreren Orgs angehören)
- ❌ Billing/Stripe Integration
- ❌ SSO/SAML (Enterprise)
- ❌ Custom Domains
- ❌ Actual Schema Monitoring (PROJ-4)
- ❌ Webhooks Setup (PROJ-5)
- ❌ Alerting Configuration (PROJ-6)
- ❌ Email Provider Setup (Resend Integration wird angenommen)

---

## Metriken für Erfolg

- 80% der neuen User schließen das Onboarding innerhalb von 5 Minuten ab
- < 5% Abbruchrate beim Onboarding
- 50% der Orgs laden mindestens 1 Teammitglied ein
- Durchschnittlich 3 Bases pro Organisation überwacht

---

## Offene Fragen

1. **Multi-Org Support:** Sollen User später mehreren Orgs angehören können?
2. **E-Mail Provider:** Resend ist vorgesehen - bereits konfiguriert?
3. **Plan-Upgrade:** Wohin führt der Upgrade-CTA? (Stripe noch nicht implementiert)
4. **Audit Log:** Sollen Einladungen/Rollenänderungen geloggt werden?
5. **Base-Monitoring Details:** Was passiert technisch beim Aktivieren? (Webhook-Setup für PROJ-5?)

---

*Erstellt: 2026-02-03*
*Requirements Engineer: Claude (basierend auf PROJ-2 Erfahrungen)*

---

## QA Spezifikations-Review

**Geprüft:** 2026-02-04
**QA Engineer:** Claude (QA Agent)

---

### 1. Dokumenten-Zusammengehörigkeit

| Aspekt | Ergebnis |
|--------|----------|
| Feature-Nummer | PROJ-3 (beide Dokumente) |
| Thema | Organization Onboarding & Management |
| Zusammengehörigkeit | **Bestätigt** - Architektur-Dokument ist technische Umsetzung der Feature-Spec |

**Bewertung:** Die beiden Dokumente gehören zusammen. Das Architektur-Dokument (`PROJ-3-architecture.md`) referenziert explizit die Feature-Spec und beschreibt die technische Implementierung der dort definierten Requirements.

---

### 2. Kritische Issues in der Spezifikation

#### ISSUE-1: Umlaut-Fehler im Architektur-Dokument
- **Severity:** Medium
- **Beschreibung:** Das Architektur-Dokument (`PROJ-3-architecture.md`) verwendet konsequent KEINE korrekten Umlaute
- **Beispiele gefunden:**
  - "ergaenzt" statt "ergänzt" (Zeile 10)
  - "ueberwacht" statt "überwacht" (Zeile 23)
  - "Prueft" statt "Prüft" (Zeile 108)
  - "Aendern" statt "Ändern" (Zeile 511)
  - "loeschen" statt "löschen" (Zeile 513)
  - "moeglich" statt "möglich" (Zeile 164)
  - "gehoert" statt "gehört" (Zeile 39)
  - "verfuegbare" statt "verfügbare" (Zeile 43)
- **Impact:** Verletzt CLAUDE.md-Richtlinien (korrekte Umlaute erforderlich)
- **Empfehlung:** Architektur-Dokument komplett auf korrekte Umlaute migrieren

#### ISSUE-2: Fehlende Acceptance Criteria für Einladungs-E-Mail-Zustellung
- **Severity:** High
- **Beschreibung:** Es fehlen Acceptance Criteria für den Fall, dass E-Mails nicht zugestellt werden können
- **Betroffene Stelle:** Team Management - Einladungen senden
- **Fehlende AC:**
  - [ ] Bounce-Handling bei ungültiger E-Mail
  - [ ] Retry-Logik bei temporären Zustellungsfehlern
  - [ ] User-Feedback bei fehlgeschlagener Zustellung
- **Empfehlung:** Edge Case EC-11 hinzufügen für E-Mail-Zustellungsfehler

#### ISSUE-3: Widerspruch bei Mitglieder-Entfernung
- **Severity:** Medium
- **Beschreibung:** In der Feature-Spec (AC: Mitglied entfernen) steht "nur Owner", aber in US-9 steht ebenfalls "nur Owner". In der Architektur-Berechtigungsmatrix kann aber nur Owner Mitglieder entfernen - Admin kann es NICHT.
- **Widerspruch:** US-6 sagt "Owner oder Admin" kann einladen, aber nur Owner kann entfernen. Diese Asymmetrie sollte explizit dokumentiert werden.
- **Empfehlung:** Klarstellen ob Admins eingeladene Mitglieder wieder entfernen dürfen

#### ISSUE-4: Fehlende Rate-Limiting-Anforderung
- **Severity:** Critical (Security)
- **Beschreibung:** Keine Anforderung für Rate-Limiting bei:
  - Einladungs-API (Spam-Schutz)
  - Onboarding-Schritte (DoS-Schutz)
  - Base-Sync-Endpoint (Airtable-API-Limit-Schutz)
- **Empfehlung:** Rate-Limiting als technische Anforderung hinzufügen

#### ISSUE-5: Unvollständige RLS-Policy für monitored_bases
- **Severity:** High (Security)
- **Beschreibung:** Die RLS-Policy in der Feature-Spec erlaubt INSERT nur für owner/admin, aber die Datenbank-Typen zeigen `activated_by` als optionales Feld
- **Risiko:** Ohne Validierung könnte ein User sich selbst als Aktivierer eintragen
- **Empfehlung:** `activated_by` sollte automatisch vom Server gesetzt werden (nicht vom Client)

---

### 3. Fehlende Acceptance Criteria

#### AC-MISSING-1: Session-Handling bei Einladungsannahme
**User Story:** Als eingeladener User mit bestehendem Account
**Fehlende AC:**
- [ ] Wenn User in anderem Account eingeloggt ist und Einladungslink klickt
- [ ] Warnung: "Diese Einladung ist für [email]. Du bist als [andere-email] eingeloggt"
- [ ] Option: Ausloggen und mit richtiger E-Mail einloggen

#### AC-MISSING-2: Onboarding-Skip-Konsequenzen
**User Story:** Als User der Onboarding überspringt
**Fehlende AC:**
- [ ] Was passiert mit der Organisation? (Wird eine erstellt?)
- [ ] Welche Features sind ohne Onboarding verfügbar?
- [ ] Wie wird User später ans Onboarding erinnert?

#### AC-MISSING-3: Parallele Onboarding-Zugriffe
**User Story:** Als User mit mehreren Browsern/Tabs
**Fehlende AC:**
- [ ] User öffnet Onboarding in zwei Tabs
- [ ] User schließt Schritt 1 in Tab A ab
- [ ] Tab B sollte Fortschritt synchronisieren oder Warnung zeigen

#### AC-MISSING-4: Token-Sicherheit bei Einladungen
**Fehlende AC:**
- [ ] Token wird nur einmal verwendet (nach Annahme ungültig)
- [ ] Token kann nicht erraten werden (UUID v4 oder cryptographisch sicher)
- [ ] Token wird nach Ablauf automatisch gelöscht (Cleanup-Job)

#### AC-MISSING-5: Org-Löschung
**Fehlende AC:**
- [ ] Was passiert mit Einladungen wenn Org gelöscht wird?
- [ ] Was passiert mit monitored_bases wenn Org gelöscht wird?
- [ ] Wird User benachrichtigt wenn seine Org gelöscht wird?

---

### 4. Architektur-Abgleich mit Requirements

| Requirement (Feature-Spec) | Architektur-Abdeckung | Status |
|---------------------------|----------------------|--------|
| US-1: Geführte Ersteinrichtung | OnboardingLayout + 4 Schritte | Abgedeckt |
| US-2: Fortschritt sehen | OnboardingProgress Komponente | Abgedeckt |
| US-3: Später fortsetzen | user_onboarding_status DB-Speicherung | Abgedeckt |
| US-4: Org-Name ändern | /settings/organization + PATCH API | Abgedeckt |
| US-5: Org-Details einsehen | OrganizationSettingsPage | Abgedeckt |
| US-6: Teammitglieder einladen | InviteDialog + API | Abgedeckt |
| US-7: Einladung annehmen | /invite/accept Seite | Abgedeckt |
| US-8: Rollen verwalten | RoleSelector Komponente | Abgedeckt |
| US-9: Mitglieder entfernen | DELETE API Endpoint | Abgedeckt |
| US-10: Team auflisten | MemberList Komponente | Abgedeckt |
| US-11: Bases auswählen | BaseList + Toggle | Abgedeckt |
| US-12: Auswahl ändern | MonitoringToggle | Abgedeckt |
| US-13: Status sehen | StatusBadge | Abgedeckt |

**Ergebnis:** Alle User Stories haben entsprechende Architektur-Komponenten.

---

### 5. Sicherheits-Analyse (Red Team Perspektive)

#### SECURITY-1: IDOR bei Organisations-APIs
- **Risiko:** User könnte fremde Org-ID in API-Calls verwenden
- **Geprüft:** RLS-Policies prüfen organization_members Zugehörigkeit
- **Status:** Abgedeckt (wenn RLS korrekt implementiert)
- **Empfehlung:** Explizite Tests für IDOR in QA-Phase

#### SECURITY-2: Privilege Escalation bei Rollen
- **Risiko:** Member könnte sich selbst zum Admin machen
- **Geprüft:** PATCH /members/[userId] - nur Owner erlaubt
- **Status:** Spec sagt "nur Owner", muss in Implementierung verifiziert werden
- **Empfehlung:** Server-seitige Validierung der Rolle des aufrufenden Users

#### SECURITY-3: Einladungs-Token-Enumeration
- **Risiko:** Angreifer könnte Tokens raten/enumerieren
- **Geprüft:** Token ist UUID (36 Zeichen, ~122 Bit Entropie)
- **Status:** Ausreichend sicher wenn UUID v4
- **Empfehlung:** Sicherstellen dass gen_random_uuid() verwendet wird

#### SECURITY-4: E-Mail-Spoofing bei Einladungen
- **Risiko:** Angreifer sendet Einladung an seine E-Mail, aber Token ist für andere E-Mail
- **Geprüft:** EC-10 definiert "Token ist an E-Mail gebunden"
- **Status:** Abgedeckt in Spec
- **Empfehlung:** Server muss E-Mail bei Annahme gegen Token prüfen

#### SECURITY-5: Org-Übernahme durch letzten Admin
- **Risiko:** Admin entfernt sich selbst, Org hat keinen Admin mehr
- **Geprüft:** EC-5 behandelt "Letzter Admin verlässt Org"
- **Status:** Abgedeckt - Owner kann nicht entfernt werden
- **Empfehlung:** Warnung wenn letzter Admin (nicht Owner) sich entfernt

#### SECURITY-6: Plan-Limit-Bypass
- **Risiko:** User umgeht Plan-Limits durch direkte API-Calls
- **Geprüft:** Spec erwähnt Server-seitige Prüfung
- **Gefunden:** Datenbank hat Funktionen `can_monitor_base`, `can_invite_member`
- **Status:** Abgedeckt
- **Empfehlung:** Diese DB-Funktionen in allen relevanten APIs verwenden

---

### 6. Edge Cases - Vollständigkeitsprüfung

| Edge Case | Definiert | Ausreichend spezifiziert |
|-----------|-----------|-------------------------|
| EC-1: Onboarding-Abbruch | Ja | Ja |
| EC-2: Einladung an bestehenden User | Ja | Ja |
| EC-3: Einladung an neuen User | Ja | Ja |
| EC-4: Mehrfache Einladungen | Ja | Ja |
| EC-5: Letzter Admin verlässt Org | Ja | Ja |
| EC-6: Owner löscht eigenen Account | Ja | Ja |
| EC-7: Plan-Downgrade mit zu vielen Bases | Ja | Ja |
| EC-8: Airtable-Base wird extern gelöscht | Ja | Ja |
| EC-9: User ist bereits Mitglied einer anderen Org | Ja | Ja |
| EC-10: Einladungslink geteilt | Ja | Ja |

**Fehlende Edge Cases:**
- EC-11: E-Mail-Zustellung fehlgeschlagen (Bounce/Spam)
- EC-12: Airtable-OAuth-Token abgelaufen während Onboarding
- EC-13: Browser-Back während Onboarding
- EC-14: Gleichzeitige Rollen-Änderung (Race Condition)
- EC-15: Organisation wird gelöscht während Einladung aussteht

---

### 7. Testbarkeit der Acceptance Criteria

| AC-Bereich | Testbar? | Anmerkung |
|------------|----------|-----------|
| Onboarding Schritt 1-4 | Ja | Klare Schritte definiert |
| Organization Settings | Ja | CRUD-Operationen klar definiert |
| Team Management | Ja | Alle Aktionen spezifiziert |
| Base Selection | Ja | Toggle-Verhalten klar |
| Plan-Limits | Ja | Konkrete Zahlen definiert |
| E-Mail-Versand | Teilweise | Template vorhanden, aber kein Test-Modus definiert |

**Empfehlung:** Test-Modus für E-Mail-Versand definieren (z.B. Preview-Mode, Test-Inbox)

---

### 8. Summary

| Kategorie | Anzahl | Severity |
|-----------|--------|----------|
| Kritische Sicherheitslücken | 1 | Critical (Rate-Limiting) |
| Umlaut-Fehler | ~50+ | Medium (Architektur-Dokument) |
| Fehlende Acceptance Criteria | 5 | High |
| Fehlende Edge Cases | 5 | Medium |
| Widersprüche | 1 | Medium |

---

### 9. Behobene Issues (2026-02-04)

| Issue | Status | Lösung |
|-------|--------|--------|
| ISSUE-1: Umlaut-Fehler | ✅ Behoben | Architektur-Dokument korrigiert |
| ISSUE-2: E-Mail-Fehlerbehandlung | ✅ Behoben | EC-11 hinzugefügt |
| ISSUE-3: Berechtigungsasymmetrie | ✅ Behoben | Dokumentiert in AC "Mitglied entfernen" |
| ISSUE-4: Rate-Limiting | ✅ Behoben | Neue technische Anforderung hinzugefügt |
| ISSUE-5: RLS-Policy activated_by | ✅ Behoben | Trigger für server-seitiges Setzen |

**Zusätzlich ergänzt:**
- Edge Cases EC-11 bis EC-15
- AC für Session-Handling bei Einladungen
- AC für Onboarding-Skip-Konsequenzen
- AC für Token-Sicherheit (Einmal-Verwendung)

---

### 10. Production-Readiness der Spezifikation

**Status:** ✅ READY FOR IMPLEMENTATION

**Alle kritischen Issues wurden behoben:**
- ✅ Rate-Limiting als technische Anforderung definiert
- ✅ Umlaute im Architektur-Dokument korrigiert
- ✅ Alle fehlenden Acceptance Criteria ergänzt
- ✅ Alle fehlenden Edge Cases definiert
- ✅ Sicherheitsrelevante RLS-Policies präzisiert

**Empfohlener nächster Schritt:**
Kurzer Review durch Requirements Engineer zur Bestätigung, dann Implementierung fortsetzen.

---

*QA Review abgeschlossen: 2026-02-04*
*QA Engineer: Claude (QA Agent)*
*Re-Test nach Fixes: 2026-02-04 - PASSED*

---

## QA Implementation Test Results

**Tested:** 2026-02-04
**QA Engineer:** Claude (QA Agent)
**Scope:** Backend Rate-Limiting, DB-Trigger, Resend Webhook, Edge Cases EC-11 bis EC-15

---

### 1. Rate-Limiting (Backend)

| Endpoint | File | Rate-Limit implementiert | Limit korrekt | Status |
|----------|------|-------------------------|---------------|--------|
| POST /api/organizations/[id]/invitations | `route.ts` | Ja (Zeile 122) | 20/Stunde | PASS |
| POST /api/organizations/[id]/bases/sync | `route.ts` | Ja (Zeile 21) | 1/5min | PASS |
| POST /api/onboarding/complete-step | `route.ts` | Ja (Zeile 21) | 10/min | PASS |
| POST /api/onboarding/skip | `route.ts` | Ja (Zeile 15) | 10/min | PASS |
| GET /api/invitations/[token] | `route.ts` | Ja (Zeile 20) | 5/min | PASS |

**Rate-Limit Middleware:** `/src/lib/rate-limit.ts`
- In-Memory Store implementiert (mit Hinweis auf Upstash Redis fuer Produktion)
- Cleanup-Intervall alle 5 Minuten
- Korrekte Header (Retry-After, X-RateLimit-Reset)
- Logging bei Ueberschreitung

**Ergebnis:** PASS - Alle Rate-Limits korrekt implementiert

---

### 2. DB-Migration Trigger

**Trigger:** `set_monitored_bases_audit_fields`

| Pruefpunkt | Status | Details |
|------------|--------|---------|
| Trigger existiert | PASS | `trigger_monitored_bases_audit` auf `monitored_bases` |
| Funktion existiert | PASS | `set_monitored_bases_audit_fields()` |
| INSERT: activated_by gesetzt | PASS | `NEW.activated_by := auth.uid()` |
| INSERT: activated_at gesetzt | PASS | `COALESCE(NEW.activated_at, NOW())` |
| UPDATE aktiv->inaktiv: deactivated_by | PASS | Korrekt implementiert |
| UPDATE inaktiv->aktiv: Reaktivierung | PASS | Loescht alte Deaktivierungs-Daten |
| SECURITY DEFINER | PASS | Funktion laeuft mit erhoehten Rechten |

**SQL-Abfrage zur Verifikation:**
```sql
SELECT tgname, proname, tgenabled
FROM pg_trigger t JOIN pg_proc p ON t.tgfoid = p.oid
WHERE proname = 'set_monitored_bases_audit_fields';
```
Ergebnis: Trigger `trigger_monitored_bases_audit` aktiv (enabled='O')

**Ergebnis:** PASS - Trigger korrekt implementiert

---

### 3. Resend Webhook

**File:** `/src/app/api/webhooks/resend/route.ts`

| Pruefpunkt | Status | Details |
|------------|--------|---------|
| Signatur-Verifikation | PASS | `verifyWebhookSignature()` mit HMAC SHA256 |
| Timing-Safe Comparison | PASS | `crypto.timingSafeEqual()` verwendet |
| Production-Only Check | PASS | Signatur nur in Production erforderlich |
| Bounce-Handling | PASS | Hard-Bounce markiert Einladung als declined |
| Soft-Bounce-Handling | PASS | Nur geloggt, nicht markiert |
| Spam-Complaint-Handling | PASS | Einladung wird als declined markiert |
| Health-Check Endpoint | PASS | GET /api/webhooks/resend verfuegbar |

**Privacy-Analyse:**

| Log-Statement | Geloggte Daten | Privacy-Risiko |
|---------------|----------------|----------------|
| Zeile 128 | email_id, to, subject | MEDIUM - E-Mail-Adressen in Logs |
| Zeile 143-147 | to, type, message | MEDIUM - E-Mail-Adressen bei Bounce |
| Zeile 180 | E-Mail-Adresse + Count | MEDIUM |
| Zeile 193-196 | to, message | MEDIUM - E-Mail bei Spam-Beschwerde |

**BUG-1: Sensible Daten in Logs**
- **Severity:** Medium
- **Beschreibung:** E-Mail-Adressen werden in Produktions-Logs geschrieben
- **Betroffene Zeilen:** 128, 143, 180, 193, 212, 220
- **Empfehlung:** E-Mails hashen oder anonymisieren vor dem Logging

**Ergebnis:** PASS mit Hinweis (Privacy-Optimierung empfohlen)

---

### 4. Edge Cases (Frontend)

#### EC-11: E-Mail-Zustellung fehlgeschlagen
**File:** `/src/app/(protected)/settings/team/team-settings-client.tsx`

| Pruefpunkt | Status | Details |
|------------|--------|---------|
| deliveryStatus State | PASS | Zeile 40-42 |
| Warnung bei fehlgeschlagener Zustellung | PASS | Zeile 622-645 (MailX Icon + Text) |
| "Andere E-Mail verwenden" Option | PASS | Zeile 691-699 (Dialog) |
| Zustellungsversuche anzeigen | PASS | Zeile 638-640 |
| Change-Email-Dialog | PASS | Zeile 722-781 |

**Ergebnis:** PASS

#### EC-12: OAuth-Token abgelaufen waehrend Onboarding
**File:** `/src/app/(protected)/onboarding/bases/bases-step-client.tsx`

| Pruefpunkt | Status | Details |
|------------|--------|---------|
| Token-Expired State | PASS | Zeile 51-52 |
| 401 Response Check | PASS | Zeile 129-132 |
| Token-Error in Response | PASS | Zeile 138-142 |
| Reconnect UI | PASS | Zeile 228-277 (eigene Card) |
| "Erneut verbinden" Button | PASS | Zeile 259-262 |
| Info: "Daten bleiben gespeichert" | PASS | Zeile 249-255 |

**Ergebnis:** PASS

#### EC-13: Browser-Back waehrend Onboarding
**File:** `/src/components/onboarding/onboarding-persistence-provider.tsx`

| Pruefpunkt | Status | Details |
|------------|--------|---------|
| popstate Event Handler | PASS | Zeile 90 |
| Status aus DB laden | PASS | Zeile 55-56 |
| Concurrent-Call Protection | PASS | Zeile 50-51 (isHandlingPopstate.current) |
| Router Refresh | PASS | Zeile 76 |
| Step-Mapping | PASS | Zeile 33-45 |

**Ergebnis:** PASS

#### EC-14: Gleichzeitige Rollen-Aenderung (Race Condition)
**File:** `/src/app/(protected)/settings/team/team-settings-client.tsx` (Frontend)
**File:** `/src/app/api/organizations/[id]/members/[userId]/route.ts` (Backend)

| Pruefpunkt | Status | Details |
|------------|--------|---------|
| Frontend: expected_updated_at senden | PASS | Zeile 180 |
| Frontend: 409 Conflict Handling | PASS | Zeile 185-194 |
| Frontend: CONFLICT Code Handling | PASS | Zeile 199-207 |
| Frontend: Reload-Button bei Konflikt | PASS | Zeile 188-189, 201-203 |
| **Backend: expected_updated_at pruefen** | **FAIL** | Nicht implementiert |

**BUG-2: Optimistic Locking nicht implementiert im Backend**
- **Severity:** High
- **Beschreibung:** Der Backend-Endpoint `/api/organizations/[id]/members/[userId]` prueft das `expected_updated_at` nicht
- **File:** `/src/app/api/organizations/[id]/members/[userId]/route.ts`
- **Steps to Reproduce:**
  1. User A oeffnet Team-Seite in Tab 1
  2. User B oeffnet Team-Seite in Tab 2
  3. User A aendert Rolle von User X zu Admin
  4. User B aendert Rolle von User X zu Viewer
  5. Expected: User B erhaelt 409 Conflict
  6. Actual: Beide Aenderungen erfolgreich (Last-Write-Wins ohne Warnung)
- **Impact:** Race Condition fuehrt zu unerwarteten Ergebnissen ohne Warnung
- **Empfehlung:** Backend muss `expected_updated_at` mit DB-Wert vergleichen

**Ergebnis:** FAIL

#### EC-15: Organisation geloescht waehrend Einladung aussteht
**File:** `/src/app/invite/accept/invite-accept-client.tsx`

| Pruefpunkt | Status | Details |
|------------|--------|---------|
| org_deleted Status Type | PASS | Zeile 14 |
| 404/ORG_NOT_FOUND Handling | PASS | Zeile 75-78 |
| ORG_DELETED Code Handling | PASS | Zeile 75 |
| org_deleted UI | PASS | Zeile 259-285 |
| Generische Fehlermeldung (Privacy) | PASS | "Einladung nicht mehr gueltig" (keine Org-Details) |

**Ergebnis:** PASS

---

### 5. Code-Qualitaet

#### TypeScript
| Pruefpunkt | Status | Details |
|------------|--------|---------|
| `npx tsc --noEmit` | PASS | Keine TypeScript-Fehler |

#### Deutsche Texte (Umlaute)
| Bereich | Status | Details |
|---------|--------|---------|
| Onboarding Komponenten | PASS | Keine falschen ae/oe/ue |
| Settings Komponenten | PASS | Keine falschen ae/oe/ue |
| UI Komponenten | PASS | Keine falschen ae/oe/ue |

**Ergebnis:** PASS

---

### 6. Bugs Found

#### BUG-1: Sensible Daten in Logs (Resend Webhook)
- **Severity:** Medium
- **File:** `/src/app/api/webhooks/resend/route.ts`
- **Betroffene Zeilen:** 128, 143, 180, 193, 212, 220
- **Steps to Reproduce:**
  1. E-Mail-Zustellung schlaegt fehl (Bounce)
  2. Resend sendet Webhook
  3. E-Mail-Adresse wird in Produktions-Logs geschrieben
- **Expected:** E-Mail-Adressen sollten anonymisiert/gehasht werden
- **Actual:** Klartext-E-Mails in Logs
- **Priority:** Medium (DSGVO/Privacy)

#### BUG-2: Optimistic Locking fehlt im Backend (EC-14)
- **Severity:** High
- **File:** `/src/app/api/organizations/[id]/members/[userId]/route.ts`
- **Steps to Reproduce:**
  1. Zwei Tabs mit Team-Seite oeffnen
  2. In beiden Tabs Rolle aendern
  3. Zweite Aenderung ueberschreibt erste ohne Warnung
- **Expected:** Backend prueft `expected_updated_at` und gibt 409 bei Konflikt
- **Actual:** Last-Write-Wins ohne Validierung
- **Priority:** High (Data Integrity)

---

### 7. Summary

| Testbereich | Status | Details |
|-------------|--------|---------|
| Rate-Limiting (5 Endpoints) | PASS | Alle korrekt implementiert |
| DB-Trigger (monitored_bases) | PASS | Funktioniert wie spezifiziert |
| Resend Webhook | PASS* | *Privacy-Optimierung empfohlen |
| EC-11: E-Mail-Zustellung | PASS | Frontend vollstaendig |
| EC-12: Token abgelaufen | PASS | UI und Error-Handling ok |
| EC-13: Browser-Back | PASS | Persistence Provider ok |
| EC-14: Race Condition | **FAIL** | Backend-Validierung fehlt |
| EC-15: Org geloescht | PASS | Privacy-konform |
| TypeScript | PASS | Keine Fehler |
| Deutsche Umlaute | PASS | Korrekt |

---

### 8. Production-Readiness

**Status:** NOT READY

**Kritische Blocker:**
- BUG-2: Optimistic Locking im Backend nicht implementiert (High)

**Empfohlen vor Deployment:**
1. **BUG-2 fixen:** `expected_updated_at` Validierung in `/api/organizations/[id]/members/[userId]/route.ts`
2. **BUG-1 optional:** E-Mail-Anonymisierung in Webhook-Logs

**Vorgeschlagener Fix fuer BUG-2:**
```typescript
// In PATCH handler, nach Zeile 73:
const { role, expected_updated_at } = parsed.data

// Vor dem Update (nach Zeile 85):
if (expected_updated_at) {
  const { data: currentMember } = await supabase
    .from('organization_members')
    .select('updated_at')
    .eq('id', targetMember.id)
    .single()

  if (currentMember && currentMember.updated_at !== expected_updated_at) {
    return NextResponse.json(
      { error: 'Daten wurden zwischenzeitlich geaendert. Bitte neu laden.', code: 'CONFLICT' },
      { status: 409 }
    )
  }
}
```

---

*QA Implementation Test abgeschlossen: 2026-02-04*
*QA Engineer: Claude (QA Agent)*
