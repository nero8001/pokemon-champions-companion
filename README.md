# Pokémon Champions Companion v8.1

## Neu in v8.1
- Teamverwaltung in einen eigenen Menüpunkt **Meine Teams** verschoben; Konto-Teams und lokale Teams können über ein Quellen-Dropdown getrennt angezeigt werden.
- Im Team-Builder werden keine vollständigen Teamlisten mehr angezeigt. Stattdessen gibt es **Letzte Teams** mit den drei zuletzt verwendeten Teams und einer Auswahl zwischen Account und Lokal.
- Die lokale Speicheraktion heißt jetzt **Lokal Speichern**. Teamnutzung und Speicherung aktualisieren die Liste der zuletzt verwendeten Teams.

## Bereits in v8.0
- Supabase-Konto-Teams speichern, laden und löschen; Zugriff wird durch Row Level Security auf das eigene Konto begrenzt.
- Teams lokal speichern sowie importieren/exportieren.
- Kontolöschung über die bereitgestellte Supabase Edge Function.

## Einrichtung
- Die Supabase-Tabelle und RLS-Richtlinien müssen einmalig mit `SUPABASE_TEAMS_SETUP.sql` eingerichtet sein.
- Die App nutzt die vorhandene Supabase-Konfiguration; es werden keine geheimen Schlüssel in der Web-App benötigt.
