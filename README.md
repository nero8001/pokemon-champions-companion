# Pokémon Champions Companion v8.10

## Neu in v8.10 – Vorschau beim manuellen Team-Link und Passwort-Hinweis
- Teams, die über **Team-Link** eingefügt werden, öffnen jetzt dieselbe kompakte Vorschau wie direkt geöffnete Team-Links. Erst **Team übernehmen** lädt das Team in den Team-Builder.
- Nach einer erfolgreichen Anfrage zum Zurücksetzen des Passworts weist die Statusmeldung zusätzlich darauf hin, auch den Spam- bzw. Junk-Ordner zu prüfen.

## Bereits in v8.9 – Team-Links und Passwortverwaltung
- Geteilte Team-Links lassen sich über **Team-Link** direkt einfügen, auch in App-Umgebungen ohne direktes Öffnen eines Links.
- In **Mein Konto** gibt es zwischen **Abmelden** und **Konto löschen** die Funktion **Passwort ändern**.
- Im Anmeldefenster kann eine E-Mail zum Zurücksetzen des Passworts angefordert werden.

## Bereits in v8.8 – Itemnamen und Form-Sprites
- Geteilte Teamdaten enthalten, wenn verfügbar, den ausgeschriebenen Itemnamen und Item-Slug.
- Ältere Links versuchen, Itemnamen anhand der Item-ID nachzuladen.
- Bei alternativen Formen wird zuerst ein separater Form-Art-Sprite versucht; bei Fehler erfolgt ein Fallback auf den Basis-Sprite.

## Einrichtung
- Die Supabase-Tabelle und RLS-Richtlinien müssen einmalig mit `SUPABASE_TEAMS_SETUP.sql` eingerichtet sein.
- Die App nutzt die vorhandene Supabase-Konfiguration; es werden keine geheimen Schlüssel in der Web-App benötigt.
- Passwort-Zurücksetzen benötigt eine korrekt konfigurierte Supabase-E-Mail-Vorlage und eine erlaubte Redirect-URL für diese App.
