# Pokémon Champions Companion v8.2

## Neu in v8.2
- Die obere Navigation bleibt sichtbar, auch wenn Team-Builder-Pokémon oder leere Slots ausgeklappt sind.
- In **Meine Teams** können Account-Teams jetzt über **Umbenennen** direkt in Supabase umbenannt werden; Name und Teamdaten bleiben synchron.

## Bereits in v8.1
- Teamverwaltung in einen eigenen Menüpunkt **Meine Teams** verschoben; Konto-Teams und lokale Teams können über ein Quellen-Dropdown getrennt angezeigt werden.
- Im Team-Builder gibt es **Letzte Teams** mit den drei zuletzt verwendeten Teams und einer Auswahl zwischen Account und Lokal.
- Die lokale Speicheraktion heißt **Lokal Speichern**.

## Bereits in v8.0
- Supabase-Konto-Teams speichern, laden und löschen; Zugriff wird durch Row Level Security auf das eigene Konto begrenzt.
- Teams lokal speichern sowie importieren/exportieren.
- Kontolöschung über die bereitgestellte Supabase Edge Function.

## Einrichtung
- Die Supabase-Tabelle und RLS-Richtlinien müssen einmalig mit `SUPABASE_TEAMS_SETUP.sql` eingerichtet sein.
- Die App nutzt die vorhandene Supabase-Konfiguration; es werden keine geheimen Schlüssel in der Web-App benötigt.
