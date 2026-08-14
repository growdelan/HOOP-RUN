---
name: codex-flow-compact-context
description: Bezpiecznie zmniejsz STATUS.md, ROADMAP.md lub spec.md HOOP-RUN po przekroczeniu limitów, archiwizując historię i dzieląc szczegóły bez zmiany aktualnych reguł gry. Użyj po ostrzeżeniu scripts/check-context-size.sh, przed resume dużego projektu albo na prośbę o uporządkowanie dokumentacji.
---

# Kompakcja kontekstu projektu

1. Uruchom `./scripts/check-context-size.sh` i sprawdź przekroczone progi.
2. Przed edycją ustal aktualny milestone, aktywne reguły, decyzje, blokery, ostatnią walidację i playtest. Porównaj dokumentację z repozytorium.
3. Kompaktuj tylko pliki wymagające porządkowania. Nie zmieniaj kodu, zachowania produktu ani statusów niezgodnie z faktami.

## `STATUS.md`

- Zachowaj aktualny zakres, stan, następny krok, aktywne blokery, ostatnią istotną walidację i playtest oraz krótki handoff.
- Usuń powtórzenia, pełne logi i zamkniętą historię. Historia pozostaje w Git.

## `ROADMAP.md`

- Zachowaj pełne szczegóły milestone'ów `planned`, `in_progress` i `blocked`.
- Przenieś starsze `done` do `docs/archive/roadmap/<wersja-lub-data>.md`; w roadmapie zostaw krótką listę z linkami.
- Nie zmieniaj kolejności ani zależności aktywnej pracy.

## `spec.md`

- Zachowaj cel, fundament rozgrywki, granice systemu, najważniejsze kontrakty i indeks dokumentów.
- Przenieś rozbudowane aktualne reguły do `docs/spec/<obszar>.md`, a samodzielne decyzje do `docs/decisions/<numer>-<nazwa>.md`.
- Nie przenoś aktualnej prawdy do archiwum i nie duplikuj pełnej treści.

Po zmianach sprawdź linki, uruchom oba skrypty w `scripts/`. Jeśli próg nadal jest przekroczony, wyjaśnij dlaczego. Nie wykonuj commita ani pusha bez jawnego polecenia.
