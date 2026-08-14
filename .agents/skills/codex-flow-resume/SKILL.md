---
name: codex-flow-resume
description: Odtwórz stan HOOP-RUN po rozpoczęciu nowej sesji lub powrocie do przerwanej pracy. Użyj, gdy użytkownik chce kontynuować projekt, poznać aktualny stan albo ustalić najbliższy bezpieczny krok bez modyfikowania plików.
---

# Wznowienie projektu

1. Uruchom `./scripts/check-context-size.sh`, a następnie przeczytaj `STATUS.md`.
2. Z `ROADMAP.md` odczytaj tylko milestone'y `in_progress`, `planned`, `blocked` oraz krótki indeks ukończonych prac. Nie czytaj archiwum domyślnie.
3. Potraktuj `spec.md` jako indeks. Doczytaj tylko sekcje lub dokumenty z `docs/spec/` i `docs/decisions/` potrzebne do najbliższej decyzji.
4. Doczytaj `AGENTS.md`, diff, `package.json` lub kod tylko wtedy, gdy są potrzebne do zweryfikowania bieżącego stanu.
5. Porównaj dokumentację z faktycznym stanem repozytorium. Nie zakładaj, że status ani zapisany wynik playtestu są aktualne.
6. Jeśli skrypt zgłasza przekroczenie limitu, uwzględnij `$codex-flow-compact-context` jako zalecany krok, ale nie modyfikuj plików podczas resume.

Zwróć krótki brief: cel projektu, aktualny zakres, co zrobiono, ostatnią walidację i playtest, blokery, najbliższy krok, pliki potrzebne do jego wykonania i ewentualną potrzebę kompakcji.
