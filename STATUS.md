# Aktualny stan projektu

Ten plik jest krótką pamięcią operacyjną między sesjami. Zapisuj tylko informacje potrzebne do bezpiecznej kontynuacji pracy.

## Aktualny zakres

- Milestone: `Milestone 3: Walidacja hipotezy i gotowość do udostępnienia`.
- Status: `done`.
- Bramka PRD 000: `proceed` na podstawie wewnętrznego playtestu.
- Poza ukończonym zakresem: nowe mechaniki, pełny mecz, finalna oprawa, run i zapis postępu.

## Co zrobiono

- Zainicjalizowano npm z TypeScriptem `strict`, Phaserem 4, Vite, ESLint i Vitest.
- Dodano skrypty `dev`, `lint`, `typecheck`, `test`, `build` i `preview` oraz wersjonowany `package-lock.json`.
- Rozdzielono katalogi `core`, `content`, `application`, `presentation` i `platform`.
- Utworzono responsywną scenę Phasera z taktyczną planszą 3 na 3 bez reguł gameplayu.
- Skonfigurowano produkcyjny build pod bazą `/HOOP-RUN/` i test zabezpieczający tę wartość.
- Zaktualizowano README o rzeczywiste wymagania, komendy i strukturę aplikacji.
- Dodano niezależny od Phasera, serializowalny model posiadania z fazami, zegarem, sześcioma uczestnikami, kryciem, talią, ręką, historią i zdarzeniami.
- Zaimplementowano niemutujące reguły `Pass`, `Screen`, `Drive`, `Kick Out` i `Shot` oraz deterministyczną reakcję obrony i wyjaśnialną jakość rzutu.
- Dodano wstrzykiwany RNG xorshift32, reset z seedem, stabilne odrzucenia nielegalnych akcji i prototypowe dane jakości poza mechaniką.
- Dodano testowalną sesję aplikacyjną publikującą stan planszy, legalnych wykonawców i celów, komunikaty przyczynowe oraz podsumowanie rzutu.
- Zastąpiono statyczną scenę grywalną planszą Phasera z sześcioma tokenami, kryciem, piłką, intencją, ręką kart, zegarem, `Advantage`, seedem i resetem.
- Dodano parametry URL `seed` i testowy `clock`, sterowanie myszą oraz dokumentację rzeczywistego przepływu w README.
- Dodano Playwright E2E wykonujący rzeczywiste kliknięcia w canvas dla nielegalnej akcji, przygotowanego rzutu, podsumowania i resetu.
- Dodano ograniczony do `e2e=1`, tylko do odczytu snapshot modelu widoku używany przez asercje testu przeglądarkowego.
- Dodano workflow GitHub Actions, który uruchamia pełną walidację, przygotowuje artefakt i publikuje zweryfikowany build z `main` na GitHub Pages.
- Udokumentowano pięć miar PRD 000 i decyzję bramki `proceed` w `docs/validation/prd-000-validation.md`.

## Co jest następne

- Utworzyć przyrostowy PRD pełnego meczu przez `$codex-flow-create-prd` przed dalszą implementacją gameplayu.
- Nie projektować jeszcze mapy runu ani metaprogresji. Kolejne pushe wymagają jawnego polecenia, mimo że zaakceptowany workflow automatyzuje wdrożenie zawartości `main`.

## Ostatnia walidacja

| Data | Zakres | Komenda / sposób | Wynik | Uwagi |
|---|---|---|---|---|
| 2026-08-14 | Milestone 0 | `./scripts/verify.sh`, `npm audit --omit=dev` | zaliczona | Lint, typecheck, 1 test i build przeszły; 0 znanych podatności produkcyjnych. |
| 2026-08-14 | Produkcyjny preview | `$codex-flow-playtest`, `/HOOP-RUN/`, 1440×900 i 1024×768 | zaliczona | Plansza czytelna, brak błędów konsoli i overflow; HTML, JS i CSS zwracają 200; seed nie dotyczy. |
| 2026-08-14 | Review Milestone 0 | `$codex-flow-review` | zaliczona | Brak problemów blokujących; granice modułów i konfiguracja Pages zgodne z zakresem. |
| 2026-08-14 | Milestone 1 | `./scripts/verify.sh`, kontrola granicy `core` | zaliczona | Lint, typecheck, 15 testów i build przeszły; brak `Math.random()`, Phasera, DOM i zależności przeglądarkowych w `core`. |
| 2026-08-14 | Review Milestone 1 | `$codex-flow-review`, następnie `$codex-flow-address-review` i ponowne review | zaliczona | Poprawiono komplet zdarzeń i talii, limit `Advantage`, dane jakości oraz walidację kosztu; brak problemów blokujących. Playtest niewymagany dla headlessowego zakresu. |
| 2026-08-14 | Milestone 2 | `./scripts/verify.sh` | zaliczona | Lint, typecheck, 24 testy i produkcyjny build `/HOOP-RUN/` przeszły. |
| 2026-08-14 | Playtest Milestone 2 | `$codex-flow-playtest`, 1440×900 i 1024×768, seed 42, `clock=9` | zaliczona | `Screen → Drive → Kick Out → Shot` dał `Perfect 95`, `Pass → Shot` dał `Decent 58`, nielegalny `Kick Out` nie zmienił stanu, zegar wygasł bez rzutu, a reset odtworzył pikselowo identyczny wynik; konsola czysta, zasoby 200. |
| 2026-08-14 | Review Milestone 2 | `$codex-flow-review`, `$codex-flow-address-review`, ponowne review i playtest | zaliczona | Uzupełniono kontrakt modelu widoku, przyczynowy feedback `Screen` i README; brak problemów blokujących. |
| 2026-08-14 | Milestone 3 | `./scripts/verify.sh` | zaliczona | Lint, typecheck, 25 testów Vitest, produkcyjny build `/HOOP-RUN/` i Playwright E2E przeszły. |
| 2026-08-14 | Playtest i bramka PRD 000 | `$codex-flow-playtest`, seed 42, 1440×900 i 1024×768 | zaliczona: `proceed` | Natychmiastowy rzut dał `Contested 42`, `Pass → Shot` dał `Decent 58`, a przygotowany rzut `Perfect 95`; cztery karty były początkowo legalne, konsola czysta, zasoby 200 i brak overflow. Dowód jest wewnętrzny. |
| 2026-08-14 | Review Milestone 3 | `$codex-flow-review` | zaliczona | Brak problemów krytycznych, ważnych i drobnych; E2E, most testowy, workflow Pages, zakres i dokumentacja są zgodne z milestone'em. |
| 2026-08-14 | GitHub Pages, commit `ac07d8e` | GitHub Actions i `$codex-flow-playtest`, seed 42, 1440×900 i 1024×768 | zaliczona | Joby `verify` i `deploy` przeszły; publiczna gra wykonała `Screen → Drive → Kick Out → Shot` z `Perfect 95`, bez błędów konsoli, overflow ani brakujących zasobów. |

## Blokery i ryzyka

- Brak blokera dla utworzenia przyrostowego PRD pełnego meczu.
- Produkcyjny bundle zawierający Phaser ma około 1,38 MB przed kompresją i 359 KB gzip; Vite zgłasza ostrzeżenie rozmiaru. Optymalizować dopiero na podstawie pomiaru, nie przed pierwszym gameplayem.
- `actions/configure-pages@v5` zgłasza nieblokującą adnotację o wewnętrznym przejściu z Node.js 20 na Node.js 24; workflow i deployment przechodzą.
- Pięć miar PRD 000 potwierdzono wewnętrznie; zrozumiałość dla nowych graczy pozostaje do sprawdzenia przed większą produkcją zawartości.

## Handoff

- Najkrótsze streszczenie: PRD 000 i milestone'y 0–3 są ukończone; grywalne posiadanie ma automatyczny E2E, artefakt Pages i pozytywną bramkę `proceed`.
- Decyzje, których nie wolno zgubić: Phaser tylko prezentuje model widoku; `core` pozostaje niemutujący i deterministyczny; reset odtwarza przebieg z seedem; baza `/HOOP-RUN/`; `clock=9` jest wyłącznie scenariuszem testowym.
- Pliki do przeczytania jako pierwsze: `STATUS.md`, bramka w `ROADMAP.md` i `docs/validation/prd-000-validation.md`.
- Następny bezpieczny krok: `$codex-flow-create-prd` dla pełnego meczu; bez implementacji przed nowym planem.
