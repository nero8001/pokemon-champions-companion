# Pokémon Champions Companion

## Letzte 3 größere Änderungen
- **v7.10.4:** Supabase-Anmeldung vorbereitet (Registrierung, Anmeldung und Abmeldung mit Publishable Key); Team-Speicherung bleibt bis zur Prüfung des Datenbankschemas lokal.
- **v7.10.4:** Zielbereich-Dropdown an die türkisblauen Eingabefelder angepasst; Text und Hintergrund sind wieder kontrastreich.
- **v7.10.3:** Zielbereich-Auswahl abhängig von Attacke und Feldstatus ergänzt, inklusive Mehrziel-Schadensberechnung.
- **v7.10.2:** Feld „Aufgeladen?“ für Dynamo und Ladevorgang; bei „Ja“ wird der Schaden von Elektroattacken verdoppelt.


## v7.10.6
- Konto-Löschung mit POST-Aufruf der Supabase-Edge-Function `delete-account` robuster angebunden.
- Verständlichere Fehlermeldungen bei fehlender Anmeldung oder nicht erreichbarer Funktion.
- Nach erfolgreicher Löschung wird die lokale Sitzung entfernt.
