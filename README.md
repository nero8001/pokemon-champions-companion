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



## v8.26
- Fixed information-dialog layering above the sticky navigation and added CSS cache-busting so browsers load the updated modal styles.

## v8.25
- Information dialogs now render above the sticky navigation/status bar as a full-screen modal layer, keeping the dialog centered and fully accessible.

## v8.24
- Corrected the actual information dialog position with a direct 24px vertical translation; reduced its maximum height to preserve the viewport boundary.
