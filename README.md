# Pokémon Champions Companion v8.12

## Neu in v8.12 – Kontoanzeige, Hinweis und Letzte Ehre
- Unter **Mein Konto** wird die E-Mail-Adresse des angemeldeten Kontos angezeigt.
- Unter dem App-Namen steht jetzt **(Inofficial)** als Hinweis, dass es sich nicht um eine offizielle App von The Pokémon Company handelt.
- **Letzte Ehre** besitzt im Battle Calculator eine Stacks-Auswahl von 0 bis 5. Pro Stack steigt die Basisstärke um 50 (maximal 300).

## Bereits in v8.11 – Login-Komfort und Passwortbestätigung
- Nach einer erfolgreichen Passwortänderung erscheint eine kurze Bestätigung.
- Nach erfolgreicher Anmeldung wird das Passwort immer aus dem Feld gelöscht.
- Mit **E-Mail speichern** kann die E-Mail-Adresse für den nächsten Login lokal im Browser gemerkt werden. Ohne aktivierte Checkbox werden E-Mail und Passwort nach dem Login geleert.

## Bereits in v8.10 – Vorschau beim manuellen Team-Link und Passwort-Hinweis
- Teams, die über **Team-Link** eingefügt werden, öffnen jetzt dieselbe kompakte Vorschau wie direkt geöffnete Team-Links. Erst **Team übernehmen** lädt das Team in den Team-Builder.
- Nach einer erfolgreichen Anfrage zum Zurücksetzen des Passworts weist die Statusmeldung zusätzlich darauf hin, auch den Spam- bzw. Junk-Ordner zu prüfen.

## Einrichtung
- Die Supabase-Tabelle und RLS-Richtlinien müssen einmalig mit `SUPABASE_TEAMS_SETUP.sql` eingerichtet sein.
- Die App nutzt die vorhandene Supabase-Konfiguration; es werden keine geheimen Schlüssel in der Web-App benötigt.
- Passwort-Zurücksetzen benötigt eine korrekt konfigurierte Supabase-E-Mail-Vorlage und eine erlaubte Redirect-URL für diese App.
