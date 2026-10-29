# Pokémon Champions Companion v8.4

## Neu in v8.4
- Beim lokalen Speichern und beim Speichern im Konto erscheint eine Bestätigung mit dem Teamnamen.
- Die Bestätigung verwendet jeweils den vorhandenen Statusbereich und ersetzt die vorherige Meldung, statt Meldungen zu stapeln.
- Die Erfolgsmeldung beim Speichern im Konto bleibt nach dem Aktualisieren der Teamliste sichtbar.

## Bereits in v8.2
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


## Version 8.5 – Team-Sharing per Link
- Teams können aus dem Team-Builder sowie aus lokalen und Account-Teamkarten über einen Link geteilt werden.
- Der Link enthält die Teamkonfiguration direkt im URL-Fragment; keine zusätzliche Supabase-Tabelle oder SQL-Änderung nötig.
- Beim Öffnen kann das Team in den Team-Builder geladen und anschließend lokal oder im Konto als eigene Kopie gespeichert werden.


## Version 8.6 – Kompakte Team-Vorschau
- Geteilte Team-Links öffnen eine kompakte Vorschauseite mit sechs Pokémon-Slots, Form, Item, Fähigkeit, Wesen und Attacken.
- Nutzer können das Team erst nach Auswahl von „Team übernehmen“ in den Team-Builder laden.
- Beim Erstellen eines Links erscheint eine kurze Bestätigung „Link in der Zwischenablage gespeichert“.
\n\n## Version 8.7 – Vorschau: Wesen, Itemgrafiken und Formen\n- Wesen werden über den gespeicherten Nature-Index korrekt lokalisiert dargestellt.\n- Items zeigen das offizielle PokeAPI-Item-Sprite plus weiterhin den Itemnamen.\n- Für Mega- und regionale Formen wird zunächst ein passender Form-Sprite geladen, mit Fallback auf den Basis-Sprite.\n