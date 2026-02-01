# Basewatch - Projekt-Richtlinien

## Sprache & Lokalisierung

**WICHTIG:** Alle UI-Texte müssen auf Deutsch sein mit korrekten Umlauten:
- ä (nicht ae)
- ö (nicht oe)
- ü (nicht ue)
- ß (nicht ss)

Beispiele:
- "Willkommen zurück" ✓ (nicht "Willkommen zurueck")
- "Prüfe dein Postfach" ✓ (nicht "Pruefe dein Postfach")
- "Passwörter stimmen nicht überein" ✓ (nicht "Passwoerter stimmen nicht ueberein")
- "Wähle ein Passwort" ✓ (nicht "Waehle ein Passwort")
- "für" ✓ (nicht "fuer")
- "größer" ✓ (nicht "groesser")

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (IMMER zuerst prüfen!)
- **Backend:** Supabase (Auth, Database, Storage)
- **Forms:** react-hook-form + zod
- **State:** Server-first, keine Client-State-Bibliothek nötig

## Design

- **Primary Color:** #DA312A (HSL: 2 70% 51%)
- **Stil:** Modern/Minimalistisch

## Supabase Projekt

- **Project ID:** Siehe .env.local
- **Region:** eu-central-1
