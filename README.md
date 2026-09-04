# Pokémon Champions Companion – v2.5

v2.5 uses the stable v1.9 application structure as its base and adds a clean bilingual data layer.

## Changes
- German / English language selector.
- Pokémon, moves, abilities, types, items and forms use language-specific PokéAPI data.
- English mode uses official English names instead of translating German text.
- Language switching is independent from application startup.
- Calculator initialization no longer waits for language CSVs or the item list.
- Pokémon API requests use a timeout so a stalled request cannot freeze the UI indefinitely.
- Existing v1.9 calculator, fields/weather, forms, stats and preliminary damage calculation are preserved.
- Standard 25 Pokémon Natures are corrected.

## Files
- `index.html`
- `app.js`
- `style.css`

No `.nojekyll` file is included.
