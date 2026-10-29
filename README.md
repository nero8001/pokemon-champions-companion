# Pokémon Champions Companion v8.9

## Neu in v8.9 – Team-Links und Passwortverwaltung
- Im Team-Builder lassen sich geteilte Team-Links über **Team-Link** direkt einfügen und mit **Laden** importieren – auch in App-Umgebungen ohne direktes Öffnen eines Links.
- In **Mein Konto** gibt es zwischen **Abmelden** und **Konto löschen** die Funktion **Passwort ändern**.
- Im Anmeldefenster kann eine E-Mail zum Zurücksetzen des Passworts angefordert werden; der Wiederherstellungslink führt zur Eingabe eines neuen Passworts.

## Bereits in v8.8 – Itemnamen und Form-Sprites
- Geteilte Teamdaten enthalten, wenn verfügbar, den ausgeschriebenen Itemnamen und Item-Slug.
- Ältere Links versuchen, Itemnamen anhand der Item-ID nachzuladen.
- Bei alternativen Formen wird zuerst ein separater Form-Art-Sprite versucht; bei Fehler erfolgt ein Fallback auf den Basis-Sprite.

## Bereits in v8.7 – Vorschau: Wesen, Itemgrafiken und Formen
- Wesen werden über den gespeicherten Nature-Index korrekt lokalisiert dargestellt.
- Items zeigen ein Item-Sprite und weiterhin den ausgeschriebenen Itemnamen.
- Für Mega- und regionale Formen wird ein passender Form-Sprite geladen, soweit verfügbar.

## Einrichtung
- Die Supabase-Tabelle und RLS-Richtlinien müssen einmalig mit `SUPABASE_TEAMS_SETUP.sql` eingerichtet sein.
- Die App nutzt die vorhandene Supabase-Konfiguration; es werden keine geheimen Schlüssel in der Web-App benötigt.
- Passwort-Zurücksetzen benötigt eine korrekt konfigurierte Supabase-E-Mail-Vorlage und eine erlaubte Redirect-URL für diese App.
