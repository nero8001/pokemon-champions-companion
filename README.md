# Pokémon Champions Companion

## Aktuelle Version: v7.7.12

### v7.7.12 – Mega-Entwicklungen übernehmen Basis-Moveset
- Im Team-Builder beziehen alle Mega-Formen ihre Attackenauswahl direkt aus dem Moveset der Basisform.
- Die Mega-Form behält weiterhin ihre eigenen Statuswerte, Typen und Fähigkeit; nur die Attackenliste kommt von der Basisform.
- Die Auswahl hängt dadurch nicht mehr von fehlenden oder fehlerhaften Mega-Lernsets externer Datensätze ab.

### v7.7.11 – Mega-Espinodon / Champions-Attackenlisten
- Bei leeren Form-Lernlisten greift der Fallback auf die Basisform-Lernliste und danach auf die gefilterte API-Attackenliste zurück.
- Die Fallback-Behandlung schützt auch andere Pokémon-Formen mit fehlenden oder leeren Spezial-Lernlisten.

### v7.7.10 – Wesen aktualisiert Statuswerte
- Statuswerte im Team-Builder werden nach einer Änderung des Wesens sofort neu gerendert.
- Die bearbeitete Pokémon-Karte bleibt geöffnet.
