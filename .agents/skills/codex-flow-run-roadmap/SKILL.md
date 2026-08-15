---
name: codex-flow-run-roadmap
description: Wykonaj w kontrolowanej pętli wszystkie wykonalne milestone'y ze statusem planned w ROADMAP.md HOOP-RUN przez sekwencyjną implementację agentem sol_implementer i niezależne review świeżym agentem sol_reviewer. Użyj, gdy użytkownik jawnie prosi o realizację całej roadmapy, wszystkich zaplanowanych milestone'ów albo autonomiczną pracę aż do ukończenia planu lub napotkania blokera.
---

# Wykonanie roadmapy

## Przygotowanie

1. Uruchom `./scripts/check-context-size.sh`. Przeczytaj `AGENTS.md`, `STATUS.md`, aktywne milestone'y w `ROADMAP.md` oraz istotne części `spec.md`; nie czytaj archiwum domyślnie.
2. Sprawdź stan repozytorium i nie włączaj do pracy niepowiązanych zmian użytkownika.
3. Zbierz milestone'y `planned` w kolejności zależności. Pomiń wpisy szablonowe i zablokowane.
4. Przed implementacją pokaż krótki plan kolejności. Nie czekaj na dodatkowe potwierdzenie, jeśli polecenie jest jednoznaczne.
5. Główny wątek pełni rolę koordynatora. Nie implementuje kodu; deleguje pracę agentom opisanym poniżej i scala ich wyniki.
6. Nigdy nie zatrzymuj pętli w oczekiwaniu na playtest użytkownika, znajomego lub zewnętrznego testera. Obowiązkowy playtest oznacza autonomiczny techniczny smoke agenta; ludzki feedback pozostaje opcjonalny poza bramką.

## Agenci i kolejność

- Używaj Custom Agenta `sol_implementer` do implementacji i wszystkich późniejszych poprawek. Jego konfiguracja wymusza `gpt-5.6-sol` z `model_reasoning_effort = "medium"`.
- Używaj Custom Agenta `sol_reviewer` do niezależnego review. Jego konfiguracja wymusza `gpt-5.6-sol` z `model_reasoning_effort = "high"` i tryb read-only.
- Agenci pracują sekwencyjnie. Nie uruchamiaj implementacji i review równolegle.
- Dla każdego milestone'u utwórz jeden wątek `sol_implementer` i zachowaj go do końca pracy nad tym milestone'em.
- Po implementacji oraz po każdej rundzie poprawek utwórz nowy, świeży wątek `sol_reviewer`. Nie wznawiaj wcześniejszego reviewera.
- Nie zastępuj wskazanych Custom Agents agentami wbudowanymi ani pracą głównego wątku.

## Pętla milestone'ów

Dla każdego milestone'u:

1. Potwierdź cel, hipotezę, zakres, poza zakresem, kryteria, walidację i warunki zatrzymania.
2. Utwórz wątek `sol_implementer`. Przekaż pełny zakres milestone'u, kryteria akceptacji, właściwy kontekst z dokumentacji, stan bazowy repozytorium, wcześniejsze zmiany użytkownika, ryzyka i wymagane walidacje.
3. Poleć implementerowi oznaczyć milestone jako `in_progress`, zaktualizować zwięzły stan w `STATUS.md` i wykonać `$codex-flow-implement-milestone`. Poczekaj na zakończenie implementacji, testów i wymaganego playtestu.
4. Zbierz aktualny diff, podsumowanie implementera oraz wyniki walidacji. Utwórz świeży wątek `sol_reviewer` i poleć mu wykonać `$codex-flow-review` dla całego diffu.
5. Wymagaj raportu zakończonego dokładnie jedną decyzją: `DECISION: APPROVED` albo `DECISION: CHANGES_REQUIRED`.
6. Gdy decyzja to `CHANGES_REQUIRED`, przekaż pełny raport do tego samego wątku implementera. Poleć wykonać `$codex-flow-address-review`, ponowić walidację oraz wymagany playtest i odpowiedzieć na każde znalezisko.
7. Po poprawkach utwórz kolejny świeży wątek `sol_reviewer`. Przekaż pierwotne kryteria, wcześniejsze znaleziska i odpowiedzi implementera, pełny aktualny diff oraz aktualne wyniki walidacji. Reviewer ponownie ocenia cały diff.
8. Powtarzaj sekwencję `ten sam sol_implementer -> świeży sol_reviewer` do `APPROVED`, maksymalnie przez trzy rundy poprawek. Jeśli po trzeciej rundzie nadal jest `CHANGES_REQUIRED`, zatrzymaj workflow i zgłoś nierozwiązane problemy.
9. Po `APPROVED` poleć temu samemu implementerowi oznaczyć milestone jako `done` wyłącznie po spełnieniu kryteriów, pozytywnej walidacji i wymaganym playteście oraz zaktualizować `STATUS.md` bez innych zmian kodu.
10. Sprawdź końcowy diff, status repozytorium i rozmiar kontekstu, po czym przejdź do następnego `planned`.

## Warunki zatrzymania

Zatrzymaj pętlę i zachowaj bezpieczny stan, gdy wymaganie istotnie zmienia produkt, walidacja lub playtest nie przechodzi i naprawa wykracza poza zakres, review wykryje nierozwiązany problem blokujący, limit trzech rund poprawek zostanie wyczerpany, brakuje zależności, występują nieoczekiwane zmiany albo użytkownik zmieni zadanie.

Oznacz milestone jako `blocked` tylko dla rzeczywistej blokady i zapisz konkretną decyzję potrzebną do wznowienia. Nie ogłaszaj sukcesu bez `DECISION: APPROVED`, spełnionych kryteriów i pozytywnej walidacji. Po wyczerpaniu milestone'ów uporządkuj dokumentację, uruchom pełną walidację i podsumuj testy, playtesty, liczbę rund review, końcowe decyzje i ryzyka. Nie wykonuj commita ani pusha bez osobnego polecenia.
