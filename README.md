# Pokémon Champions Companion v5.0

## v5.0 – Champions-Pokédex
- Bei Pokémon, die in Pokémon Champions spielbar sind, gibt es im Pokédex über den Attacken ein Auswahlfeld zwischen „Normal erlernbare Attacken“ und „Verfügbare Attacken in Champions“.
- Die normale Attackenliste bleibt unverändert und verwendet weiterhin die PokéAPI-Learnsets.
- Die Champions-Ansicht verwendet Pokémon-spezifische Champions-Learnsets und zeigt nur die dort verfügbaren Attacken.
- Champions-Attacken werden nach Typ gruppiert und mit Typ-Symbolen sowie typbezogenen Markierungen dargestellt.
- Mega- und regionale Formen werden, sofern im Champions-Datensatz separat erfasst, mit ihrem eigenen Learnset verwendet.
- Champions-Daten werden beim Öffnen der Champions-Ansicht geladen und zwischengespeichert.

## Datenquelle für Champions-Learnsets
Die Champions-Learnsets und Move-Daten stammen aus dem öffentlich strukturierten Datensatz „Pokemon Champions Data“ von otterlyclueless/pokemon-champions-data. Der Datensatz enthält Pokémon-spezifische Learnsets sowie die Kennzeichnung, welche Attacken in Champions verfügbar sind.

Quelle: https://github.com/otterlyclueless/pokemon-champions-data
Lizenz laut Repository: CC BY 4.0.

## Vorherige Erweiterungen
- Battle Calculator mit Champions-Regelsatz M-C, Status-/Feld-/Wetterberechnung und Mehrfachtreffer-Auswahl.
- Pokédex-Fähigkeiten als anklickbare Info-Buttons.
- Verknüpfte Infofenster für Wetter, Felder und Status-Effekte inklusive Schadens-/Heilungswerten.
- Deutsche/englische Lokalisierung.
- Randomizer mit Champions-Roster und Mega-Entwicklungen.

Die Schadensformel bleibt bei nicht vollständig verifizierten Spezialfällen ausdrücklich vorläufig.


### v6.7 – Deutsche Champions-Move-Lokalisierung
- Die alte Wort-für-Wort-Übersetzung der englischen Move-Effekte wurde entfernt.
- Im deutschen Modus wird zuerst die deutsche Pokémon-Champions-Move-Seite von OP.GG als aktuelle Referenz geladen.
- Englische Effekttexte werden im deutschen Modus nicht mehr als Fallback angezeigt, damit kein Denglisch entsteht.
- Champions-Eigenschaft „Punch“ wird in der deutschen Anzeige als „Hieb“ dargestellt.
- Statusbegriffe wie Verbrennung und Eingefroren bleiben über die bestehende Effektverlinkung anklickbar.

Hinweis: Die deutsche OP.GG-Datenbank ist eine Drittanbieter-Referenz und nicht als offizieller Datendienst von The Pokémon Company gekennzeichnet. Die Spielanzeige von Pokémon Champions bleibt die maßgebliche Referenz.


## v6.7 – Move effects: original English Champions text
- Removed the unreliable OP.GG German move-effect scraping and the old German fallback/translation layer.
- Serebii's Pokémon Champions Available Moves page is now the primary move-effect reference.
- If Serebii cannot be fetched by the browser, the app falls back to the English effect already contained in the Champions move dataset.
- No automatic translation is performed, so German mode can show an English effect rather than Denglish or a missing-description placeholder.
- Existing Champions move properties such as Kontakt, Hieb and Schnitt remain unchanged.

## v7.2 Meta & Teams improvements
- Added concrete curated Pokémon Champions teams with player/record and six-Pokémon composition.
- Added expandable "Mehr Datensätze anzeigen" controls for most-used and best-performing team rankings.
- Added expandable "Weitere Teams anzeigen" control for the concrete team list.
- Concrete team examples are based on current Pikalytics Champions Reg M-C team pages; the full automatic team feed remains reserved for the later API integration.
