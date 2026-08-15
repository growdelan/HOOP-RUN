---
name: codex-flow-implement-milestone
description: Implementuj jeden konkretny milestone lub jasno ograniczone zadanie HOOP-RUN z ROADMAP.md. Użyj, gdy użytkownik wskazuje identyfikator albo nazwę milestone'u i oczekuje zmian w kodzie TypeScript/Phaser wraz z testami, buildem i odpowiednim playtestem, bez automatycznego commita lub pusha.
---

# Implementacja milestone'u

1. Przeczytaj `AGENTS.md`, `STATUS.md`, wskazany fragment `ROADMAP.md` oraz istotne sekcje lub odnośniki z `spec.md`.
2. Sprawdź kod i testy związane z zakresem. Nie czytaj niepowiązanych obszarów.
3. Dla większej lub niejasnej zmiany podaj krótko: cel, hipotezę, zakres, poza zakresem, kryteria akceptacji, walidację i warunki zatrzymania.
4. Jeśli użytkownik nie wskazał milestone'u, nie wybieraj spośród kilku sensownych kandydatów. Poproś o decyzję.
5. Zaimplementuj wyłącznie uzgodniony zakres małymi zmianami. Utrzymuj reguły gry poza scenami Phasera i nie ukrywaj losowości.
6. Dodaj deterministyczne testy odpowiadające ryzyku zmiany.
7. Uruchom walidację zmienionego obszaru i `./scripts/verify.sh`.
8. Jeśli zmiana dotyczy UI, sterowania, przepływu, animacji, zasobów lub buildu przeglądarkowego, wykonaj autonomiczny techniczny `$codex-flow-playtest` przed uznaniem kryteriów za spełnione. Nie czekaj na użytkownika ani zewnętrznego testera; ich feedback jest opcjonalny i nie stanowi bramki.
9. Zaktualizuj `STATUS.md`, a status milestone'u zmieniaj wyłącznie zgodnie z faktami.

Nie wykonuj commita ani pusha. Podaj zmienione pliki, walidacje, wynik playtestu, ograniczenia i problemy wymagające review.
