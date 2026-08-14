---
name: codex-flow-create-prd
description: Przeprowadź wywiad produktowy dla HOOP-RUN i utwórz pierwszy albo kolejny plik PRD w katalogu prd, bez implementowania kodu i bez aktualizowania spec.md lub ROADMAP.md. Użyj dla nowego zakresu gameplayu, UI, progresji, zawartości lub infrastruktury, który wymaga dopracowania przed planowaniem.
---

# Tworzenie PRD

## Rozpoznanie

1. Przyjmij opis użytkownika i aktualną koncepcję gry jako punkt wyjścia, nie jako kompletną specyfikację.
2. Sprawdź katalog `prd/`, aby rozpoznać istniejące dokumenty i kolejny numer. Nie czytaj kodu, jeśli nie jest potrzebny do pytania o istniejące zachowanie.
3. Ustal, czy powstaje pierwszy PRD projektu, czy przyrostowy PRD funkcjonalności.

## Wywiad

1. Zadawaj dokładnie jedno krótkie pytanie naraz i czekaj na odpowiedź użytkownika.
2. Najpierw ustal problem, odbiorców, oczekiwany rezultat, granice zakresu i hipotezę gameplayową. Następnie doprecyzuj tylko istotne: przepływ gracza, stan boiska, reguły, informację zwrotną, sterowanie, kryteria akceptacji i ryzyka.
3. Nie pytaj ponownie o informacje już podane. Nie przeciągaj wywiadu dla opcjonalnej zawartości, balansu liczbowego lub oprawy, które nie są potrzebne do bieżącego prototypu.
4. Nie wymuszaj decyzji technicznych, które lepiej podjąć podczas specyfikacji. Zachowaj ustalony stos i ograniczenia z `spec.md`.
5. Dla pierwszego zakresu preferuj hipotezę możliwą do zweryfikowania w krótkim, grywalnym pionowym przekroju.
6. Zakończ wywiad, gdy dokument jednoznacznie określa cel, zachowanie i kryteria akceptacji.

## Zapis dokumentu

1. Dla pierwszego PRD wypełnij `prd/000-initial-prd.md`. Dla kolejnego utwórz następny numer i krótką nazwę w `kebab-case`; nie zmieniaj wcześniejszych PRD.
2. Zapisz co najmniej: kontekst, odbiorców, cele, poza zakresem, hipotezę, przepływ, wymagania, kryteria akceptacji, ograniczenia, ryzyka i otwarte pytania.
3. Oddziel fakty ustalone z użytkownikiem od założeń. Nie wymyślaj wymagań, aby sztucznie domknąć dokument.
4. Nie implementuj kodu, nie aktualizuj `spec.md`, `ROADMAP.md` ani `STATUS.md` i nie uruchamiaj innych skilli planistycznych w tym samym kroku.

Podaj ścieżkę PRD, krótkie podsumowanie, otwarte pytania i wskaż `$codex-flow-plan-from-prd` jako następny opcjonalny krok.
