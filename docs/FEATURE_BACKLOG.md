# Basewatch V2 - Feature Backlog

> Basierend auf der Analyse von Basewatch V1 (base_usage_tracker)

---

## Übersicht

Basewatch ist eine **Multi-Tenant Airtable Monitoring Plattform** mit folgenden Kernfunktionen:
- Schema-Überwachung (Änderungen an Tabellen, Feldern, Views)
- Usage-Tracking (Record-Counts, Automation-Runs)
- Alerting-System (Schwellenwerte, Benachrichtigungen)
- Multi-Tenant mit RBAC (Rollen-basierte Zugriffskontrolle)

---

## Feature Kategorien

### 1. Core Infrastructure

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| CORE-001 | Multi-Tenant Architecture | Organisationen mit isolierten Daten via RLS | P0 | ✅ Vorhanden |
| CORE-002 | Supabase Integration | PostgreSQL, Auth, Edge Functions, Realtime | P0 | ✅ Vorhanden |
| CORE-003 | Next.js App Router | Frontend mit Server Components | P0 | ✅ Vorhanden |
| CORE-004 | TypeScript Type Safety | Durchgängige Typisierung | P0 | ✅ Vorhanden |
| CORE-005 | Environment Configuration | Sichere Verwaltung von Secrets | P0 | ✅ Vorhanden |

---

### 2. Authentication & Authorization

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| AUTH-001 | Supabase Auth | Email/Password Login | P0 | ✅ Vorhanden |
| AUTH-002 | Airtable OAuth 2.0 | PKCE Flow für sichere Verbindung | P0 | ✅ Vorhanden |
| AUTH-003 | Token Refresh | Automatische Token-Erneuerung | P0 | ✅ Vorhanden |
| AUTH-004 | RBAC System | 5 Rollen (owner, admin, member, viewer, billing) | P0 | ✅ Vorhanden |
| AUTH-005 | Resource Grants | Fein-granulare Berechtigungen mit Ablaufdatum | P1 | ✅ Vorhanden |
| AUTH-006 | Permission Audit Log | Protokollierung aller Rechteänderungen | P1 | ✅ Vorhanden |
| AUTH-007 | SSO/SAML Integration | Enterprise Single Sign-On | P2 | ❌ Geplant |
| AUTH-008 | Magic Link Login | Passwordless Authentication | P2 | ❌ Neu |
| AUTH-009 | 2FA/MFA | Zwei-Faktor-Authentifizierung | P2 | ❌ Neu |

---

### 3. Airtable Integration

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| AT-001 | OAuth Connection | Sichere Verbindung zu Airtable Workspaces | P0 | ✅ Vorhanden |
| AT-002 | PAT Support | Personal Access Token als Alternative | P1 | ✅ Vorhanden |
| AT-003 | Base Discovery | Automatisches Erkennen aller Bases | P0 | ✅ Vorhanden |
| AT-004 | Workspace Sync | Import von Workspaces & Bases | P0 | ✅ Vorhanden |
| AT-005 | Webhook Registration | Real-time Change Notifications | P0 | ✅ Vorhanden |
| AT-006 | Multiple Connections | Mehrere Airtable Accounts pro Org | P1 | ✅ Vorhanden |
| AT-007 | Connection Health Check | Status-Monitoring der Verbindungen | P1 | ⚠️ Teilweise |
| AT-008 | Rate Limit Handling | Graceful Handling von API Limits | P1 | ❌ Neu |

---

### 4. Schema Monitoring

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| SM-001 | Schema Snapshots | Vollständige Schema-Captures mit Hash | P0 | ✅ Vorhanden |
| SM-002 | Change Detection | Erkennung von Table/Field/View Änderungen | P0 | ✅ Vorhanden |
| SM-003 | Webhook Real-time | Sofortige Benachrichtigung bei Änderungen | P0 | ✅ Vorhanden |
| SM-004 | Change Timeline | Chronologische Ansicht aller Änderungen | P0 | ✅ Vorhanden |
| SM-005 | Diff Visualization | Detaillierte Anzeige von Unterschieden | P1 | ✅ Vorhanden |
| SM-006 | Formula Change Tracking | Spezielle Darstellung für Formel-Änderungen | P1 | ✅ Vorhanden |
| SM-007 | Select Option Tracking | Tracking von Single/Multi-Select Optionen | P1 | ✅ Vorhanden |
| SM-008 | Schema History | Historische Schema-Versionen vergleichen | P2 | ❌ Neu |
| SM-009 | Schema Export | Export als JSON/CSV | P2 | ❌ Neu |
| SM-010 | Change Annotations | Kommentare zu Änderungen hinzufügen | P2 | ❌ Neu |

---

### 5. Usage Tracking

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| UT-001 | Record Count Snapshots | Tägliche Record-Zählung pro Base/Table | P0 | ✅ Vorhanden |
| UT-002 | Automation Usage | Tracking von Automation Runs | P0 | ✅ Vorhanden |
| UT-003 | Table-Level Granularity | Aufschlüsselung nach Tabellen | P0 | ✅ Vorhanden |
| UT-004 | 24h Rolling Window | Automation-Runs der letzten 24 Stunden | P1 | ✅ Vorhanden |
| UT-005 | Usage Trends | Graphische Darstellung über Zeit | P1 | ⚠️ Teilweise |
| UT-006 | Growth Predictions | Vorhersage von Wachstum | P2 | ❌ Neu |
| UT-007 | Quota Warnings | Warnungen bei Annäherung an Limits | P1 | ⚠️ Teilweise |
| UT-008 | Field-Level Metrics | Statistiken pro Feld | P3 | ❌ Neu |
| UT-009 | API Usage Tracking | Tracking der Airtable API Calls | P2 | ❌ Neu |

---

### 6. Alerting System

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| AL-001 | Alert Rules | Konfigurierbare Schwellenwerte | P0 | ✅ Vorhanden |
| AL-002 | Multiple Metrics | automation_pct, record_pct, runs_24h, etc. | P0 | ✅ Vorhanden |
| AL-003 | Operators | gte, lte, eq, changed | P0 | ✅ Vorhanden |
| AL-004 | Cooldown Periods | Vermeidung von Alert-Spam | P0 | ✅ Vorhanden |
| AL-005 | Alert Events | Log aller ausgelösten Alerts | P0 | ✅ Vorhanden |
| AL-006 | Acknowledgment | Bestätigung von Alerts | P0 | ✅ Vorhanden |
| AL-007 | Email Notifications | Benachrichtigung per E-Mail | P1 | ⚠️ DB vorhanden, Impl. fehlt |
| AL-008 | Slack Integration | Benachrichtigung in Slack Channels | P1 | ⚠️ DB vorhanden, Impl. fehlt |
| AL-009 | Webhook Delivery | Custom Webhooks für Alerts | P1 | ⚠️ DB vorhanden, Impl. fehlt |
| AL-010 | Alert Escalation | Eskalation bei wiederholten Alerts | P2 | ❌ Neu |
| AL-011 | Alert Templates | Vordefinierte Alert-Regeln | P2 | ❌ Neu |
| AL-012 | Alert Grouping | Gruppierung ähnlicher Alerts | P2 | ❌ Neu |
| AL-013 | PagerDuty Integration | Enterprise Incident Management | P3 | ❌ Neu |
| AL-014 | MS Teams Integration | Microsoft Teams Notifications | P2 | ❌ Neu |

---

### 7. Dashboard & UI

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| UI-001 | Overview Dashboard | Statistik-Karten & Activity Feed | P0 | ✅ Vorhanden |
| UI-002 | Bases List | Tabellenansicht aller Bases | P0 | ✅ Vorhanden |
| UI-003 | Base Detail Page | Einzelansicht mit Details | P0 | ✅ Vorhanden |
| UI-004 | Schema Timeline | Chronologische Change-Ansicht | P0 | ✅ Vorhanden |
| UI-005 | Alerts Page | Alert-Events mit Acknowledgment | P0 | ✅ Vorhanden |
| UI-006 | Settings Page | Org & Connection Management | P0 | ✅ Vorhanden |
| UI-007 | Admin Panel | Plan & Feature Management | P0 | ✅ Vorhanden |
| UI-008 | Dark Mode | Dunkles Theme | P1 | ✅ Vorhanden |
| UI-009 | Responsive Design | Mobile-freundliche UI | P1 | ⚠️ Teilweise |
| UI-010 | Real-time Updates | Live-Updates via Subscriptions | P1 | ✅ Vorhanden |
| UI-011 | Onboarding Wizard | Geführte Ersteinrichtung | P1 | ❌ Neu |
| UI-012 | Keyboard Shortcuts | Schnellzugriff per Tastatur | P2 | ❌ Neu |
| UI-013 | Custom Dashboards | Benutzerdefinierte Dashboards | P2 | ❌ Neu |
| UI-014 | Data Visualization | Charts & Graphs | P1 | ❌ Neu |
| UI-015 | Search & Filter | Globale Suche | P1 | ⚠️ Teilweise |

---

### 8. Team & Collaboration

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| TM-001 | Organization Management | Erstellen & Verwalten von Orgs | P0 | ✅ Vorhanden |
| TM-002 | Member Invitations | Einladen von Team-Mitgliedern | P0 | ⚠️ DB vorhanden, UI fehlt |
| TM-003 | Role Assignment | Zuweisung von Rollen | P0 | ✅ Vorhanden |
| TM-004 | Activity Log | Aktivitätsprotokoll pro Org | P1 | ⚠️ DB vorhanden, UI fehlt |
| TM-005 | Comments & Notes | Kommentare an Bases/Changes | P2 | ❌ Neu |
| TM-006 | Shared Views | Geteilte Dashboard-Ansichten | P2 | ❌ Neu |
| TM-007 | Team Notifications | Team-weite Benachrichtigungen | P2 | ❌ Neu |

---

### 9. Billing & Plans

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| BL-001 | Plan Management | Free, Pro, Enterprise Pläne | P0 | ✅ Vorhanden |
| BL-002 | Feature Entitlements | Feature-Limits pro Plan | P0 | ✅ Vorhanden |
| BL-003 | Feature Overrides | Custom Deals pro Org | P1 | ✅ Vorhanden |
| BL-004 | Usage Tracking | Feature-Nutzung gegen Limits | P0 | ✅ Vorhanden |
| BL-005 | Stripe Integration | Payment Processing | P1 | ❌ Neu |
| BL-006 | Invoicing | Rechnungserstellung | P1 | ❌ Neu |
| BL-007 | Usage-Based Billing | Abrechnung nach Nutzung | P2 | ❌ Neu |
| BL-008 | Trial Period | Kostenlose Testphase | P1 | ❌ Neu |

---

### 10. Export & Reporting

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| EX-001 | CSV Export | Export als CSV | P1 | ⚠️ UI vorhanden, Impl. fehlt |
| EX-002 | JSON Export | Export als JSON | P1 | ⚠️ UI vorhanden, Impl. fehlt |
| EX-003 | PDF Reports | Generierte PDF-Berichte | P2 | ❌ Neu |
| EX-004 | Scheduled Reports | Automatische Report-Generierung | P2 | ❌ Neu |
| EX-005 | Custom Report Builder | Benutzerdefinierte Berichte | P3 | ❌ Neu |
| EX-006 | Email Reports | Reports per E-Mail versenden | P2 | ❌ Neu |

---

### 11. API & Integrations

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| API-001 | REST API | Öffentliche API für Drittanbieter | P2 | ❌ Geplant |
| API-002 | API Keys | API-Key Management | P2 | ❌ Neu |
| API-003 | Rate Limiting | API Rate Limits | P2 | ❌ Neu |
| API-004 | Zapier Integration | Zapier Connector | P2 | ❌ Neu |
| API-005 | Make Integration | Make.com Connector | P2 | ❌ Neu |
| API-006 | n8n Integration | n8n Connector | P3 | ❌ Neu |

---

### 12. Security & Compliance

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| SEC-001 | Row Level Security | Datenisolierung via RLS | P0 | ✅ Vorhanden |
| SEC-002 | Encrypted Tokens | Sichere Token-Speicherung | P0 | ✅ Vorhanden |
| SEC-003 | Audit Logging | Protokollierung von Aktionen | P1 | ✅ Vorhanden |
| SEC-004 | Data Retention | Automatische Datenlöschung | P1 | ⚠️ Geplant, nicht impl. |
| SEC-005 | GDPR Compliance | EU-Datenschutz-Konformität | P1 | ⚠️ Teilweise |
| SEC-006 | SOC 2 Compliance | Enterprise Security Standards | P2 | ❌ Neu |
| SEC-007 | IP Whitelisting | Zugriffsbeschränkung nach IP | P2 | ❌ Neu |
| SEC-008 | Session Management | Aktive Sessions verwalten | P2 | ❌ Neu |

---

### 13. Enterprise Features

| ID | Feature | Beschreibung | Priorität | Status V1 |
|----|---------|--------------|-----------|-----------|
| ENT-001 | Custom Domains | White-Label Domain | P2 | ❌ Geplant |
| ENT-002 | White Labeling | Eigenes Branding | P2 | ❌ Geplant |
| ENT-003 | Dedicated Support | Premium Support | P2 | ❌ Geplant |
| ENT-004 | SLA Guarantees | Service Level Agreements | P2 | ❌ Neu |
| ENT-005 | On-Premise Option | Self-Hosted Deployment | P3 | ❌ Neu |

---

## Priorisierungs-Legende

| Priorität | Bedeutung |
|-----------|-----------|
| P0 | Must-Have für MVP |
| P1 | Wichtig für Launch |
| P2 | Nice-to-Have |
| P3 | Future/Backlog |

## Status-Legende

| Symbol | Bedeutung |
|--------|-----------|
| ✅ | Vollständig implementiert in V1 |
| ⚠️ | Teilweise implementiert oder DB-ready |
| ❌ | Nicht implementiert |

---

## Empfohlene MVP-Features für V2

### Phase 1: Core Platform (MVP)
1. CORE-001 bis CORE-005 - Basis-Infrastruktur
2. AUTH-001 bis AUTH-004 - Authentication & RBAC
3. AT-001 bis AT-005 - Airtable Integration
4. SM-001 bis SM-004 - Schema Monitoring Basics
5. UT-001 bis UT-003 - Usage Tracking Basics
6. AL-001 bis AL-006 - Alerting Basics
7. UI-001 bis UI-007 - Core Dashboard

### Phase 2: Notifications & Team
1. AL-007 bis AL-009 - Email/Slack/Webhook Notifications
2. TM-002, TM-004 - Member Invitations & Activity Log
3. UI-011 - Onboarding Wizard
4. BL-005, BL-008 - Stripe & Trial

### Phase 3: Advanced Features
1. SM-008, SM-009 - Schema History & Export
2. EX-001 bis EX-003 - Export Features
3. UI-014 - Data Visualization
4. AL-010 bis AL-012 - Advanced Alerting

### Phase 4: Enterprise
1. AUTH-007 - SSO/SAML
2. ENT-001, ENT-002 - White Label
3. API-001 bis API-003 - Public API
4. SEC-006 - SOC 2 Compliance

---

## Architektur-Entscheidungen für V2

### Beibehaltene Technologien
- **Supabase** - PostgreSQL, Auth, Edge Functions, Realtime
- **Next.js** - App Router mit Server Components
- **TypeScript** - Durchgängige Typisierung
- **Tailwind CSS** - Utility-first Styling

### Neue/Verbesserte Ansätze
- **shadcn/ui** - Konsistente UI-Komponenten (siehe [HOW_TO_USE_AGENTS.md](HOW_TO_USE_AGENTS.md))
- **Verbessertes Testing** - Jest, Vitest, Playwright
- **CI/CD Pipeline** - GitHub Actions
- **Monitoring** - Error Tracking, Performance Monitoring
- **Parallelisierte Polling** - Verbesserte Performance bei Usage-Polling

---

## Bekannte V1-Probleme zur Behebung

1. **Fehlende Tests** - Keine automatisierten Tests vorhanden
2. **Sequenzielles Polling** - poll-usage ist nicht parallelisiert
3. **Keine Pagination** - Schema Timeline begrenzt auf 100 Einträge
4. **Unvollständige Notifications** - DB-Struktur vorhanden, Impl. fehlt
5. **Fehlende Signup-Page** - Route existiert, Component fehlt
6. **Token Refresh** - Nicht event-driven, nur bei Abfrage
7. **Kein Rate Limiting** - API/Edge Functions ohne Limits

---

*Erstellt: 2026-02-01*
*Basierend auf: base_usage_tracker V1 Analyse*
