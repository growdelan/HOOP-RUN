# Aktualny stan projektu

Ten plik przechowuje wyłącznie informacje potrzebne do bezpiecznej kontynuacji pracy.

## Aktualny zakres

- PRD 000 i PRD 001 są ukończone z decyzjami bramek `proceed`.
- PRD 002: `prd/002-first-run-loop.md` został przekształcony w specyfikację i Milestone'y 8–12.
- Milestone 8: `Deterministyczny agregat runu i nagrody` jest ukończony (`done`).
- Milestone 9: `Karty nagród i tożsamość przeciwników` jest ukończony (`done`), a niezależne review zakończyło się decyzją `APPROVED`.
- Milestone 10: `Grywalny trzy-meczowy run` jest ukończony (`done`), a finalne niezależne review zakończyło się decyzją `APPROVED`.
- Aktywny zakres implementacyjny: brak; Milestone 11 pozostaje `planned`, a workflow kończy się po M10 zgodnie z poleceniem użytkownika.
- Playtesty użytkownika i innych osób są opcjonalnym feedbackiem poza kryteriami `done` i bramkami. Workflow wymaga testów, E2E oraz adekwatnego agentowego smoke testu technicznego i nigdy nie czeka na człowieka.
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
- Milestone 11 (`planned`): wersjonowany `RunCheckpointV1`, jeden slot `localStorage`, integralność i wznowienie.
- Milestone 12: kontrolowane testy, E2E, agentowy smoke techniczny i bramka `proceed / iterate / rethink`; ludzki feedback jest opcjonalny.

## Najbliższy krok

- Parametry czterech kart są ustalone w `docs/spec/first-run-loop.md`: koszty bazowe 2/3/2/2, `Hedge` kosztujący łącznie 3 po interakcji oraz mierzalne dobre i ryzykowne scenariusze.
- Polityka widoczności jest ustalona: nagroda należy do pierwszego cyklu talii, bez przypinania do pierwszej ręki.
- Profile są ustalone: istniejąca zawartość, wagi `1/1/1` dla `Fundamentals` oraz dominujące `3/1/1` dla specjalizacji `Perimeter Crew` i `Paint Kings`, bez nowych akcji.
- Następny możliwy krok produktowy: Milestone 11 dopiero po jawnym wznowieniu; obecny workflow kończy się po zatwierdzonym M10.
- Decyzje wejściowe M11 są zatwierdzone: aktywny czas bez przerwy poza sesją, `elapsedActiveMs`, stały klucz `hoop-run:run-checkpoint`, dyskryminator `hoop-run.run-checkpoint`, `version: 1`, `contentVersion: 1` i kanoniczny snapshot wyłącznie fazy `intermission`.
- Commit i push nadal wymagają jawnego polecenia użytkownika.

## Ostatnia istotna walidacja

| Data | Zakres | Wynik |
|---|---|---|
| 2026-08-15 | Rozdzielenie smoke CI i pełnego E2E po timeoutach runu `31887140634` | Push i PR uruchamiają 2-testowy smoke przeglądarkowy jako bramkę Pages; pełne 5 E2E pozostaje lokalną walidacją przed publikacją oraz niezależnym workflow ręcznym i cotygodniowym z 7-dniowymi artefaktami błędów. Smoke przeszedł 2/2 w 10 s, a końcowy `./scripts/verify.sh` przeszedł limity kontekstu, lint, typecheck, 93/93 Vitest, build i 5/5 E2E w 4,1 min. Nie zmieniono gameplayu ani UI; M10 pozostaje `done`. |
| 2026-08-15 | Formalne zamknięcie M9 po review `APPROVED` | Ostatni `./scripts/verify.sh` zielony: limity kontekstu, lint, typecheck, 88 testów Vitest, build i 4/4 E2E. `git diff --check` bez błędów; playtest niewymagany. M9 `done`, M10 pozostaje `planned`, workflow zakończony po M9. |
| 2026-08-15 | Druga runda review M9 — preview Backdoor, dynamiczny Close Out i status specyfikacji | Lint, typecheck, 88 testów Vitest i build przeszły. Pełny `./scripts/verify.sh` miał 3/4 E2E: pierwszy produkcyjny flow zakończył się timeoutem przy przejściu z podsumowania do obrony; ten sam test uruchomiony osobno przeszedł 1/1. `git diff --check` bez błędów. Playtest niewymagany, UI/config bez zmian. M9 pozostaje `in_progress`. |
| 2026-08-15 | Milestone 9 — poprawki review ekspozycji, preview, widoczności nagród i audytów profili | `./scripts/verify.sh` przeszedł: limity kontekstu, lint, typecheck, 88 testów Vitest, build i 4 E2E. `git diff --check` bez błędów. Playtest niewymagany, ponieważ nie zmieniono UI, sterowania ani konfiguracji przeglądarki. M9 pozostaje `in_progress` przed niezależnym re-review. |
| 2026-08-15 | Publikacja planu PRD 002, Milestone 8 i decyzji Milestone 9 | Lint, typecheck, 78 testów Vitest, build i 4 E2E przeszły; limity kontekstu i `git diff --check` bez błędów. Playtest niewymagany, ponieważ widoczny przepływ gry nie zmienił się. |
| 2026-08-15 | Milestone 8 — deterministyczny agregat runu i nagrody | Lint, typecheck, 78 testów Vitest, build i 4 E2E przeszły; 10 testów zakresowych obejmuje trzy etapy, porażkę na każdym etapie, obie role nagród, wybór, reset, legalność, niemutowalność i reprodukcję. Playtest niewymagany, ponieważ nie zmieniono widocznego przepływu. Niezależne review nie zgłosiło problemów blokujących; dwie drobne niespójności dokumentacji poprawiono przed re-review. |
| 2026-08-15 | Plan PRD 002 i kompakcja kontekstu | `./scripts/check-context-size.sh`, lint, typecheck, 68 testów Vitest, build i 4 E2E przeszły; `git diff --check` bez błędów. Nie zmieniono kodu aplikacji. |
| 2026-08-14 | Ostatni pełny `./scripts/verify.sh` po iteracji PRD 001 | 68 testów Vitest, build i 4 E2E przeszły. |
| 2026-08-14 | Produkcyjny playtest pełnego meczu, 1280×720 i 1024×768 | Seed 42 działał bez błędów konsoli, brakujących zasobów i overflow; strategia kontekstowa wygrała 82/100 seedów. |
| 2026-08-14 | Zewnętrzny playtest i bramka PRD 001 | Mecz 10 minut, wynik `8:11`, zrozumienie decyzji po pisemnym objaśnieniu, chęć rewanżu; `proceed`. |

Pełny zapis dowodów PRD 001 znajduje się w `docs/validation/prd-001-validation.md`.

## Blokery i ryzyka

- Brak aktywnego blokera; M10 jest `done`, a M11 pozostaje `planned` bez rozpoczętej implementacji.
- Onboarding przeszedł E2E i agentowy smoke techniczny; jego subiektywna jasność może być później poprawiana na podstawie opcjonalnego feedbacku, ale nie blokuje roadmapy.
- Nagroda może nie pojawić się przed szybkim końcem meczu mimo obecności w pierwszym cyklu; audyt seedów ma zmierzyć to ryzyko bez przypinania karty do pierwszej ręki.
- Wartości czterech kart są prototypem do audytu; ewentualne strojenie musi pozostać w danych i nie może rozszerzać mechanik bez decyzji.
- Agregat M8 przechowuje kursor RNG wyłącznie w aktywnym `MatchState` albo poza meczem w `RunState`; dalsza integracja musi zachować tę własność.
- Checkpoint musi przechowywać kanoniczny stan, być wersjonowany i odrzucać niezgodne dane bez częściowego wznowienia.
- Bundle Phasera ma około 1,38 MB przed kompresją i 359 KB gzip; optymalizacja pozostaje odłożona do pomiaru.
- Wartości M9 pozostają strojalnym prototypem; review `APPROVED` potwierdziło brak dominanty kart, znaczenie ekspozycji i rozróżnialność profili.

## Handoff

- Przed Milestone 11 przeczytaj `STATUS.md`, jego sekcję w `ROADMAP.md`, `docs/spec/first-run-loop.md` oraz kontrakty `src/core/run.ts` i `src/application/RunSession.ts`.
- Decyzje, których nie wolno zgubić: checkpoint tylko po wybranej nagrodzie między meczami; jeden wersjonowany slot przez port `application` i adapter `platform`; zapis kanonicznego RNG; bez zapisu aktywnego meczu lub nierozstrzygniętej oferty.
- Kontrakt M11 jest rozstrzygnięty w `docs/spec/first-run-loop.md`: checkpoint nie zawiera `activeMatch`, `rewardOffer`, `outcome`, `savedAt` ani modelu widoku; walidacja sprawdza także spójność etapu, wyników, nagród, talii i właściciela RNG. Nie czytaj archiwum podczas zwykłej implementacji.
