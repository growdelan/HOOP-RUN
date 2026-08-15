---
name: codex-flow-playtest
description: Uruchom i oceń HOOP-RUN w prawdziwej przeglądarce po zmianie gameplayu, UI, sterowania, animacji, zasobów, responsywności albo konfiguracji Vite/GitHub Pages. Użyj do smoke testu gry, sprawdzenia konkretnego scenariusza, błędów konsoli i sieci oraz udokumentowania wizualnego dowodu bez zmiany zakresu produktu.
---

# Playtest przeglądarkowy

Ten playtest jest autonomicznym, technicznym smoke testem wykonywanym przez agenta. Nie zastępuje badania użytkownika, nie udaje zewnętrznego testera i nie wymaga czekania na człowieka. Ludzkie playtesty są opcjonalnym feedbackiem poza kryteriami `done` i bramkami roadmapy.

1. Przeczytaj kryteria akceptacji bieżącego milestone'u i ustal najkrótszy scenariusz, który je weryfikuje. Nie zastępuj mierzalnych kryteriów ogólnym stwierdzeniem, że gra wygląda dobrze.
   Jeśli deterministyczne E2E pokrywa pełną macierz długich ścieżek, nie powtarzaj jej ręcznie; wybierz reprezentatywne stany potrzebne do oceny przeglądarki.
2. Uruchom wskazaną przez repo komendę dev lub preview. Dla walidacji GitHub Pages preferuj produkcyjny build i preview z właściwą bazową ścieżką.
3. Otwórz grę w przeglądarce przy użyciu dostępnego narzędzia browser/computer use.
4. Sprawdź scenariusz od wejścia do obserwowalnego wyniku. Jeśli gra obsługuje seed, zanotuj go, aby przebieg dało się odtworzyć.
5. Sprawdź co najmniej:
   - błędy i ostrzeżenia konsoli związane ze zmianą,
   - nieudane żądania i brakujące zasoby,
   - czytelność wyniku, posiadania, zamiarów obrony, legalnych akcji i skutku zagranej karty,
   - poprawność wejścia myszą oraz klawiaturą, jeśli jest w zakresie,
   - podstawowy viewport desktopowy oraz drugi istotny rozmiar, jeśli layout jest responsywny.
6. Wykonaj zrzut kluczowego stanu tylko wtedy, gdy stanowi dowód walidacji lub ujawnia problem. Nie generuj galerii bez celu.
7. Jeśli playtest jest częścią autoryzowanego zadania implementacyjnego, napraw błąd mieszczący się w tym zakresie i powtórz scenariusz. Przy samodzielnym zleceniu diagnostycznym tylko zgłoś problem. Nie rozszerzaj zakresu dla nowej decyzji produktowej.
8. Zatrzymaj lokalny serwer po zakończeniu, jeśli został uruchomiony wyłącznie do testu.
9. Zapisz w `STATUS.md` datę, build lub commit/diff, scenariusz, viewport, seed, wynik oraz znane ograniczenia, jeśli playtest jest walidacją milestone'u.

Podaj wynik jako: scenariusz, środowisko, obserwowany rezultat, błędy konsoli/sieci, dowody, problemy i decyzja `zaliczony` albo `niezaliczony`. Playtest nie zastępuje testów jednostkowych ani `./scripts/verify.sh`; brak ludzkiego feedbacku nie jest wynikiem `niezaliczony` ani blokerem.
