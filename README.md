# Pokémon Champions Companion — v8.0

## Neu in Version 8.0
- Persönliche Teams können über Supabase im Konto gespeichert, geladen und gelöscht werden.
- Die bisherigen lokalen Teams, JSON-Importe und JSON-Exporte bleiben verfügbar.
- Kontoteams sind durch Row Level Security (RLS) auf den jeweiligen Besitzer beschränkt.
- Versionssprung auf 8.0, damit die Versionsnummer übersichtlich bleibt.

## Einmalige Supabase-Einrichtung
1. Öffne dein Supabase-Projekt und gehe zu **SQL Editor**.
2. Öffne `SUPABASE_TEAMS_SETUP.sql` aus diesem ZIP und kopiere den vollständigen Inhalt in eine neue SQL-Abfrage.
3. Führe das SQL aus. Es erstellt die Tabelle `public.saved_teams`, aktiviert RLS und richtet die Richtlinien ein.
4. Veröffentliche/hoste anschließend die App-Dateien wie gewohnt neu.
5. Melde dich in der App mit einem Testkonto an. Öffne den Team-Builder, erstelle ein Team und klicke auf **Im Konto speichern**. Danach kannst du mit **Konto-Teams laden** prüfen, ob es erscheint.

## Speicherung
- **Lokal speichern** speichert nur in diesem Browser/Gerät.
- **Im Konto speichern** speichert in Supabase und ist nach Anmeldung auf anderen Geräten abrufbar.
- Konto-Teams werden getrennt von lokalen Teams angezeigt.
- Beim Löschen eines Auth-Benutzers werden dessen Konto-Teams aufgrund des Fremdschlüssels `ON DELETE CASCADE` automatisch gelöscht.

## Sicherheitshinweise
- Die App verwendet nur den öffentlichen/publishable Supabase-Schlüssel. Es werden keine Service-Role-Schlüssel im Frontend benötigt oder enthalten.
- Die RLS-Regeln prüfen `auth.uid() = user_id` für Lesen, Einfügen, Bearbeiten und Löschen.
- Die SQL-Einrichtung muss im Supabase-Projekt einmal ausgeführt werden, bevor die Cloud-Teams funktionieren.
