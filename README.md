# Pokémon Champions Companion

## Aktuelle Version: v7.7.11

### v7.7.11 – Mega-Espinodon / Champions-Attackenlisten
- Behoben: Mega-Espinodon konnte im Team-Builder ohne auswählbare Attacken erscheinen, wenn für die Mega-Form eine leere oder fehlende Form-Lernliste geliefert wurde.
- Die Attacken-Auswahl fällt bei leeren Form-Lernlisten nun auf die nichtleere Basisform-Lernliste zurück; falls nötig, wird anschließend die gefilterte API-Attackenliste verwendet.
- Die Fallback-Behandlung ist generisch und schützt damit auch andere Pokémon-Formen mit fehlenden oder leeren Spezial-Lernlisten.

### v7.7.10 – Wesen aktualisiert Statuswerte
- Statuswerte im Team-Builder werden nach einer Änderung des Wesens sofort neu gerendert.
- Die bearbeitete Pokémon-Karte bleibt geöffnet.

### v7.7.9 – Attacken per Checkbox auswählen
- Vor jedem der vier Attacken-Suchfelder gibt es eine Checkbox zur Auswahl der Kalkulationsattacke.
- Es kann immer nur eine Attacke ausgewählt sein; die vorherige Auswahl wird automatisch aufgehoben.
- Standardmäßig ist Attacke 1 ausgewählt.
