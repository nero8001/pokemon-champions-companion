# Pokémon Champions Companion v8.22

## Neu in v8.22 – Modal-Positionierung
- Entwicklungs- und Detailfenster beginnen jetzt zuverlässig unterhalb der tatsächlichen Unterkante der Kopfzeile, mit zusätzlichem Abstand.
- Das Fenster bleibt vollständig im verfügbaren Bildschirmbereich und besitzt einen eigenen Scrollbereich.

## Neu in v8.20 – Modal-Darstellung
- Entwicklungs- und Detailfenster werden unterhalb der festen Kopfzeile angezeigt und überlappen diese nicht mehr.
- Die Fensterhöhe passt sich dynamisch an die tatsächliche Kopfzeilenhöhe an; der Inhalt bleibt im eigenen Fenster scrollbar.

## Neu in v8.19 – Bedienkomfort
- Der „Tauschen“-/„Switch“-Button verwendet eine kompaktere Schrift und passt nun vollständig in seine Schaltfläche.
- Das „Mein Konto“-/„My Account“-Dropdown schließt sich automatisch bei einem Klick außerhalb des Menüs.







## v8.30
- Moved the Evolutions action from its own top row to a compact button beside the Shiny toggle in the Pokémon detail header, reducing unnecessary modal height.

## v8.29
- Increased the information panel's maximum height to the viewport minus 24px, so the panel visibly overlaps the sticky navigation instead of starting just below it.

## v8.28
- Information dialog now uses the browser Popover API top layer, which renders above sticky/fixed navigation regardless of z-index stacking contexts.
