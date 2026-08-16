# Aktualny stan projektu

Ten plik przechowuje wyłącznie informacje potrzebne do bezpiecznej kontynuacji pracy.

## Aktualny zakres

- PRD 000 i PRD 001 są ukończone z decyzjami bramek `proceed`.
- PRD 002: `prd/002-first-run-loop.md` został przekształcony w specyfikację i Milestone'y 8–12.
- Milestone 8: `Deterministyczny agregat runu i nagrody` jest ukończony (`done`).
- Milestone 9: `Karty nagród i tożsamość przeciwników` jest ukończony (`done`), a niezależne review zakończyło się decyzją `APPROVED`.
- Milestone 10: `Grywalny trzy-meczowy run` jest ukończony (`done`), a finalne niezależne review zakończyło się decyzją `APPROVED`.
- Aktywny zakres implementacyjny: brak; Milestone 12 `Walidacja hipotezy pierwszego runu` jest ukończony (`done`) po finalnym review `APPROVED`, a bramka PRD 002 ma wynik `proceed`.
- Pełne E2E są wyłącznie opcjonalną ręczną komendą użytkownika `npm run test:e2e:manual`; agent nigdy ich nie uruchamia ani nie traktuje jako bramki. Domyślne `./scripts/verify.sh` obejmuje szybkie walidacje bez Playwrighta, a CI Pages używa tylko krótkiego smoke.
- Poza zatwierdzonym zakresem: mapa, sklep, waluta, rzadkość, metaprogresja, wybór drużyny, zapis aktywnego meczu i zawartość ponad minimum PRD 002.

## Aktualna baza

- TypeScript `strict`, Phaser 4, Vite, ESLint, Vitest i Playwright działają przez npm oraz wersjonowany `package-lock.json`.
- `core`, `content`, `application`, `presentation` i `platform` rozdzielają reguły od Phasera i API przeglądarki.
- Zaimplementowano deterministyczne ofensywne posiadanie, aktywną obronę, pełny `MatchState`, osobne talie, punktację 1/2 i warunek `11 / +2 / limit 15`.
- Grywalny pełny mecz obsługuje obie role, trzy plany, podsumowania posiadań, statystyki, rewanż, seedy URL i responsywny canvas.
- Prognozy kart pokazują wpływ na `Advantage`, rzut, stratę i odsłonięcie; zasłona ma widoczną reprezentację na boisku.
- Build działa statycznie pod `/HOOP-RUN/`, a E2E steruje rzeczywistymi kliknięciami w canvas przez tylko do odczytu snapshot modelu widoku.

## Plan PRD 002

- Milestone 8: ukończony czysty agregat runu, fazy, trzy etapy, deterministyczne oferty i aktualizacja talii.
- Milestone 9 (`done`): `Backdoor Cut`, `Step Back`, `Hedge`, `Close Out` oraz profile `Fundamentals`, `Perimeter Crew`, `Paint Kings`; review `APPROVED`.
- Milestone 10 (`done`): `RunSession`, start, onboarding, trzy mecze, obowiązkowe nagrody, zmienione talie i podsumowania sukcesu/porażki są grywalne bez reloadu; snapshot E2E obejmuje stan runu; review `APPROVED`.
- Milestone 11 (`done`): wersjonowany `RunCheckpointV1`, jeden slot `localStorage`, integralność i wznowienie; finalne review `APPROVED`.
- Milestone 12 (`done`): kontrolowane szybkie testy, krótki agentowy smoke i dokument bramki zakończyły PRD 002 wynikiem `proceed`; pełne E2E i ludzki feedback pozostają opcjonalne oraz nieblokujące.

## Najbliższy krok

- Parametry czterech kart są ustalone w `docs/spec/first-run-loop.md`: koszty bazowe 2/3/2/2, `Hedge` kosztujący łącznie 3 po interakcji oraz mierzalne dobre i ryzykowne scenariusze.
- Polityka widoczności jest ustalona: nagroda należy do pierwszego cyklu talii, bez przypinania do pierwszej ręki.
- Profile są ustalone: istniejąca zawartość, wagi `1/1/1` dla `Fundamentals` oraz dominujące `3/1/1` dla specjalizacji `Perimeter Crew` i `Paint Kings`, bez nowych akcji.
- Następny krok: przygotować kolejny ograniczony PRD dopiero po jawnym wskazaniu nowego zakresu; mapa, sklep, ekonomia i metaprogresja nie zostały automatycznie zatwierdzone przez bramkę `proceed`.
- Decyzje wejściowe M11 są zatwierdzone: aktywny czas bez przerwy poza sesją, `elapsedActiveMs`, stały klucz `hoop-run:run-checkpoint`, dyskryminator `hoop-run.run-checkpoint`, `version: 1`, `contentVersion: 1` i kanoniczny snapshot wyłącznie fazy `intermission`.
- Commit i push nadal wymagają jawnego polecenia użytkownika.

## Ostatnia istotna walidacja

| Data | Zakres | Wynik |
|---|---|---|
| 2026-08-16 | Formalne zamknięcie M12 i PRD 002 po finalnym review `APPROVED` | Usunięto sztuczny pomiar `27:50`; smoke seeda 2 raportuje wyłącznie faktyczne `3:13` automatyzacji. Rozszerzony checkpoint porównał pełne trajektorie i przeszedł 1/1 przed ustanowieniem polityki manual-only. Końcowy `./scripts/verify.sh` przeszedł limity kontekstu, lint, typecheck, 123/123 Vitest i build, z jawnym pominięciem Playwrighta. Pełne E2E są opcjonalnym `test:e2e:manual`, którego agent nie uruchamia. Świeże re-review nie zgłosiło problemów blokujących; M12 ma status `done`, a bramka PRD 002 wynik `proceed`. |
| 2026-08-15 | Formalne zamknięcie M11 po finalnym review `APPROVED` | Ostatni `./scripts/verify.sh` jest zielony: limity kontekstu, lint, typecheck, 122/122 Vitest, build i 10/10 Playwright. Targeted Chromium 1/1 przy 1024×768 potwierdził canvas, bezpieczne odrzucenie głębokiego slotu, nowy mecz i brak błędów konsoli/sieci. Finalne świeże review nie zgłosiło problemów krytycznych, ważnych ani drobnych; M11 ma status `done`. |
| 2026-08-15 | Formalne zamknięcie M9 po review `APPROVED` | Ostatni `./scripts/verify.sh` zielony: limity kontekstu, lint, typecheck, 88 testów Vitest, build i 4/4 E2E. `git diff --check` bez błędów; playtest niewymagany. M9 `done`, M10 pozostaje `planned`, workflow zakończony po M9. |
| 2026-08-15 | Milestone 8 — deterministyczny agregat runu i nagrody | Lint, typecheck, 78 testów Vitest, build i 4 E2E przeszły; 10 testów zakresowych obejmuje trzy etapy, porażkę na każdym etapie, obie role nagród, wybór, reset, legalność, niemutowalność i reprodukcję. Playtest niewymagany, ponieważ nie zmieniono widocznego przepływu. Niezależne review nie zgłosiło problemów blokujących; dwie drobne niespójności dokumentacji poprawiono przed re-review. |
| 2026-08-14 | Ostatni pełny `./scripts/verify.sh` po iteracji PRD 001 | 68 testów Vitest, build i 4 E2E przeszły. |
| 2026-08-14 | Produkcyjny playtest pełnego meczu, 1280×720 i 1024×768 | Seed 42 działał bez błędów konsoli, brakujących zasobów i overflow; strategia kontekstowa wygrała 82/100 seedów. |
| 2026-08-14 | Zewnętrzny playtest i bramka PRD 001 | Mecz 10 minut, wynik `8:11`, zrozumienie decyzji po pisemnym objaśnieniu, chęć rewanżu; `proceed`. |

Pełny zapis dowodów PRD 001 znajduje się w `docs/validation/prd-001-validation.md`.

## Blokery i ryzyka

- Brak aktywnego blokera; Milestone'y 8–12 i PRD 002 są ukończone z bramką `proceed`.
- Onboarding przeszedł E2E i agentowy smoke techniczny; jego subiektywna jasność może być później poprawiana na podstawie opcjonalnego feedbacku, ale nie blokuje roadmapy.
- Nagroda może nie pojawić się przed szybkim końcem meczu mimo potwierdzonej obecności w pierwszym cyklu; nie jest przypinana do pierwszej ręki.
- Wartości czterech kart są prototypem do audytu; ewentualne strojenie musi pozostać w danych i nie może rozszerzać mechanik bez decyzji.
- Agregat M8 przechowuje kursor RNG wyłącznie w aktywnym `MatchState` albo poza meczem w `RunState`; dalsza integracja musi zachować tę własność.
- Checkpoint musi przechowywać kanoniczny stan, być wersjonowany i odrzucać niezgodne dane bez częściowego wznowienia.
- Bundle produkcyjny ma około 1,47 MB przed kompresją i 386 KB gzip; optymalizacja pozostaje odłożona do pomiaru.
- Wartości M9 pozostają strojalnym prototypem; review `APPROVED` potwierdziło brak dominanty kart, znaczenie ekspozycji i rozróżnialność profili.

## Handoff

- Przed kolejnym zakresem przeczytaj `STATUS.md`, bramkę w `docs/validation/prd-002-validation.md` i utwórz nowy PRD zamiast niejawnie rozszerzać PRD 002.
- Decyzje, których nie wolno zgubić: checkpoint tylko po wybranej nagrodzie między meczami; jeden wersjonowany slot przez port `application` i adapter `platform`; zapis kanonicznego RNG; bez zapisu aktywnego meczu lub nierozstrzygniętej oferty.
- Kontrakt M11 jest rozstrzygnięty w `docs/spec/first-run-loop.md`: checkpoint nie zawiera `activeMatch`, `rewardOffer`, `outcome`, `savedAt` ani modelu widoku; walidacja sprawdza także spójność etapu, wyników, nagród, talii i właściciela RNG. Nie czytaj archiwum podczas zwykłej implementacji.
