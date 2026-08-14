---
name: codex-flow-review
description: Wykonaj niezależne, read-only review zmian HOOP-RUN pod kątem błędów reguł gry, regresji, deterministyczności, wydajności Phasera, buildu GitHub Pages, testów, zakresu milestone'u i zgodności z dokumentacją. Użyj po większej lub ryzykownej implementacji albo na prośbę o przegląd kodu.
---

# Niezależne review

1. Ustal bazę porównania i zakres diffu. Sprawdź `git status`, zmienione pliki, właściwy milestone i wykonane walidacje.
2. Przeczytaj zmienione pliki w zakresie potrzebnym do oceny zachowania.
3. Oceń poprawność reguł, przepływu stanu, przypadków brzegowych, deterministyczności, obsługi błędów, regresji, bezpieczeństwa zapisu oraz wydajności pętli aktualizacji/renderowania.
4. Sprawdź, czy logika domenowa nie została ukryta w scenach Phasera, a zasoby i adresy działają z bazową ścieżką GitHub Pages.
5. Oceń, czy testy sprawdzają istotne zachowanie, a widoczna zmiana ma adekwatny dowód playtestu.
6. Sprawdź zgodność z `AGENTS.md`, `spec.md`, `ROADMAP.md`, `STATUS.md` oraz `README.md`, jeśli zmieniło się użycie.
7. Nie modyfikuj żadnych plików.

Najpierw podaj problemy pogrupowane jako krytyczne, ważne i drobne. Dla każdego wskaż plik lub obszar, wpływ, minimalną poprawkę i informację, czy mieści się w bieżącym zakresie. Jeśli nie ma problemów blokujących, napisz: `Review zakończony — brak problemów blokujących.`
