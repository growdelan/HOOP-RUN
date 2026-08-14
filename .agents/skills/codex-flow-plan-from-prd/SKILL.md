---
name: codex-flow-plan-from-prd
description: Utwórz lub zaktualizuj spec.md i ROADMAP.md HOOP-RUN na podstawie pierwszego albo przyrostowego PRD, bez implementowania kodu. Użyj, gdy wskazany PRD ma zostać zamieniony w architekturę, mierzalne milestone'y, hipotezy gameplayowe, ryzyka i walidacje.
---

# Planowanie z PRD

1. Ustal wskazany plik PRD. Jeśli użytkownik go nie podał, wybierz go tylko wtedy, gdy istnieje jeden oczywisty kandydat.
2. Uruchom `./scripts/check-context-size.sh`. Przeczytaj PRD, `STATUS.md`, aktywne milestone'y w `ROADMAP.md` oraz istotne części `spec.md`. Nie czytaj archiwum ani niepowiązanych dokumentów.
3. Jeśli plik do rozszerzenia przekracza próg, uporządkuj go zgodnie z `$codex-flow-compact-context`, nie zmieniając znaczenia.
4. Rozpoznaj, czy PRD inicjuje projekt, czy rozszerza istniejący zakres.
5. Zaktualizuj `spec.md` i ewentualne `docs/spec/`: zachowanie, granice domeny, przepływ danych i tylko uzasadnione decyzje techniczne. Zachowaj oddzielenie czystej logiki od Phasera i deterministyczną losowość.
6. Zaktualizuj `ROADMAP.md`. Każdy milestone musi mieć cel, weryfikowaną hipotezę, kryteria akceptacji, zakres, poza zakresem, testy, build, wymagany playtest oraz ryzyka lub zależności.
7. Dla nowych mechanik preferuj minimalny grywalny pionowy przekrój, który sprawdza najważniejsze założenie end-to-end.
8. Nie zgaduj brakujących decyzji produktowych. Zapisz konkretne `TODO: [pytanie]` albo poproś o decyzję, jeśli istotnie zmienia ona grę lub zakres.
9. Nie zmieniaj kodu aplikacji.

Podsumuj użyty PRD, zmienione dokumenty, milestone'y, hipotezy, ryzyka, TODO i rekomendowany następny krok.
