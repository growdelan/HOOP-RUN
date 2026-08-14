# AGENTS.md

## Język

- Komunikuj się z użytkownikiem wyłącznie po polsku.
- Komentarze w kodzie dodawaj tylko wtedy, gdy wyjaśniają nieoczywistą logikę lub regułę gry.

## Kontekst projektu

- Trwałe decyzje produktowe i techniczne zapisuj w `spec.md`.
- Plan i statusy prac utrzymuj w `ROADMAP.md`.
- Bieżący stan, ostatnią walidację, blokery i następny krok zapisuj w `STATUS.md`.
- Przy kontynuacji zacznij od `STATUS.md` i właściwego fragmentu `ROADMAP.md`; czytaj tylko pliki potrzebne do aktualnej decyzji.
- Traktuj limity kontekstu jako progi ostrzegawcze: `STATUS.md` 150 linii / 12 KB, `ROADMAP.md` 350 linii / 30 KB, `spec.md` 500 linii / 40 KB.
- Gdy dokument przekracza próg, użyj `$codex-flow-compact-context` przed dalszym rozbudowywaniem go.
- Nie czytaj `docs/archive/` podczas zwykłego resume, planowania ani implementacji, chyba że bieżąca decyzja wymaga historii.
- Ukończone szczegóły roadmapy archiwizuj w `docs/archive/roadmap/`; szczegóły aktualnej specyfikacji dziel między `docs/spec/` i `docs/decisions/`, zachowując `spec.md` jako indeks aktualnej prawdy.

## Środowisko TypeScript

- Używaj Node.js, TypeScriptu, Vite i Phasera oraz `npm` z wersjonowanym `package-lock.json`.
- Zależności dodawaj przez `npm install <pakiet>` albo `npm install --save-dev <pakiet>`; nie zmieniaj package managera bez jawnej decyzji technicznej.
- Nie dodawaj zależności na zapas. Uzasadniaj istotne nowe zależności w `spec.md` w sekcji `## Decyzje techniczne`.
- Kod aplikacji trzymaj w `src/`, testy automatyczne w `tests/`, a statyczne zasoby publiczne w `public/`.
- Używaj trybu `strict` TypeScriptu. Formatowanie i konwencje kodu podporządkuj skonfigurowanym narzędziom repozytorium.
- Stosuj `camelCase` dla zmiennych i funkcji oraz `PascalCase` dla typów i klas.

## Architektura gry

- Oddziel czystą logikę zasad gry od scen, renderowania, wejścia i animacji Phasera.
- Stan rozgrywki oraz akcje domenowe utrzymuj jako typowane i możliwie serializowalne dane.
- Losowość rozgrywki musi być wstrzykiwana i deterministyczna dla podanego seeda; nie używaj `Math.random()` bezpośrednio w logice domenowej.
- Najważniejsze reguły kart, posiadań, wyniku i zachowania przeciwnika testuj bez uruchamiania renderera.
- Phaser odpowiada za prezentację stanu i interakcję, a nie za przechowywanie jedynej kopii reguł gry.
- Build produkcyjny musi działać pod bazową ścieżką GitHub Pages, nie tylko pod `/` w lokalnym dev serverze.

## Implementacja

- Ustal zakres i kryteria akceptacji przed większą lub niejasną zmianą.
- Wprowadzaj małe, precyzyjne zmiany bez szerokich refaktorów przy okazji.
- Nie rozszerzaj zakresu milestone'u bez uzasadnienia i aktualizacji planu.
- Dla pierwszych milestone'ów preferuj grywalne pionowe przekroje, które weryfikują jedną hipotezę gameplayową end-to-end.
- Nie przechowuj sekretów w repozytorium. Używaj zmiennych środowiskowych i dokumentuj je w `README.md`.

## Walidacja i playtest

- Używaj komend zdefiniowanych przez repozytorium. Podstawowa komenda to `./scripts/verify.sh`.
- Testy i smoke testy nie mogą wymagać prawdziwych sekretów ani niestabilnych usług zewnętrznych.
- Po zmianie zasad gry dodaj test deterministyczny obejmujący jej efekt i przypadki brzegowe.
- Po zmianie widocznego przepływu, UI, sterowania lub konfiguracji buildu wykonaj adekwatny playtest w przeglądarce zgodnie z `$codex-flow-playtest`.
- Po istotnej zmianie zapisz w `STATUS.md` wykonaną walidację i jej wynik.
- Nie używaj `STATUS.md` jako dziennika. Zachowuj bieżący stan, ostatnią istotną walidację, aktywne ryzyka i następny krok.
- Dla ryzykownych lub większych zmian wykonaj niezależne review diffu przed publikacją.
- Nie ukrywaj nieprzechodzącej walidacji ani problemów blokujących.

## Git i dokumentacja

- Nie wykonuj commita ani pusha bez jawnego polecenia użytkownika.
- Przed publikacją sprawdź `git status --short`, diff i wynik walidacji.
- Aktualizuj `README.md` tylko wtedy, gdy zmienia się uruchamianie, konfiguracja, użycie lub ważne zachowanie systemu.
- Nie nadpisuj zmian użytkownika ani nie włączaj do commita zmian spoza uzgodnionego zakresu.
