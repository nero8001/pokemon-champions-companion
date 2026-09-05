# Pokémon Champions Companion v3.0

Stable v1.9 calculator core with bilingual localization.

## Root-cause fix
The calculator state object from v1.9 (`calcState`) was accidentally omitted during the bilingualization. The UI could render, but selecting a Pokémon then failed because calculator state did not exist. v3.0 restores the original v1.9 state object without changing the calculator selection logic.

## Language
German and English official localized data are kept separate from calculator state.
