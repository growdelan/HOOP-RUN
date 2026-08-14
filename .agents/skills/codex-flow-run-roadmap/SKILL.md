---
name: codex-flow-run-roadmap
description: Wykonaj w kontrolowanej pętli wszystkie wykonalne milestone'y ze statusem planned w ROADMAP.md HOOP-RUN. Użyj, gdy użytkownik jawnie prosi o realizację całej roadmapy, wszystkich zaplanowanych milestone'ów albo autonomiczną pracę aż do ukończenia planu lub napotkania blokera.
---

# Wykonanie roadmapy

## Przygotowanie

1. Uruchom `./scripts/check-context-size.sh`. Przeczytaj `AGENTS.md`, `STATUS.md`, aktywne milestone'y w `ROADMAP.md` oraz istotne części `spec.md`; nie czytaj archiwum domyślnie.
2. Sprawdź stan repozytorium i nie włączaj do pracy niepowiązanych zmian użytkownika.
3. Zbierz milestone'y `planned` w kolejności zależności. Pomiń wpisy szablonowe i zablokowane.
4. Przed implementacją pokaż krótki plan kolejności. Nie czekaj na dodatkowe potwierdzenie, jeśli polecenie jest jednoznaczne.
5. Używaj subagentów tylko wtedy, gdy użytkownik lub aktywne instrukcje zezwalają na delegację i zadanie jest niezależne. Implementację i wspólne pliki prowadź sekwencyjnie.

## Pętla milestone'ów

Dla każdego milestone'u:

1. Potwierdź cel, hipotezę, zakres, poza zakresem, kryteria, walidację i warunki zatrzymania.
2. Oznacz milestone jako `in_progress` i zaktualizuj krótki stan w `STATUS.md`.
3. Zaimplementuj jego zakres zgodnie z `$codex-flow-implement-milestone`.
4. Uruchom walidację obszaru oraz `./scripts/verify.sh`.
5. Dla widocznej zmiany wykonaj `$codex-flow-playtest`.
6. Wykonaj read-only review zgodnie z `$codex-flow-review`; użyj profilu `reviewer`, gdy jest to dozwolone i daje niezależne spojrzenie.
7. Popraw problemy mieszczące się w zakresie zgodnie z `$codex-flow-address-review`, ponów walidację i playtest.
8. Oznacz milestone jako `done` dopiero po spełnieniu kryteriów, pozytywnej walidacji, wymaganym playteście i usunięciu problemów blokujących.
9. Zaktualizuj `STATUS.md`, sprawdź rozmiar kontekstu i przejdź do następnego `planned`.

## Warunki zatrzymania

Zatrzymaj pętlę i zachowaj bezpieczny stan, gdy wymaganie istotnie zmienia produkt, walidacja lub playtest nie przechodzi i naprawa wykracza poza zakres, review wykryje nierozwiązany problem blokujący, brakuje zależności, występują nieoczekiwane zmiany albo użytkownik zmieni zadanie.

Oznacz milestone jako `blocked` tylko dla rzeczywistej blokady i zapisz konkretną decyzję potrzebną do wznowienia. Po wyczerpaniu milestone'ów uporządkuj dokumentację, uruchom pełną walidację i podsumuj testy, playtesty, review i ryzyka. Nie wykonuj commita ani pusha bez osobnego polecenia.
