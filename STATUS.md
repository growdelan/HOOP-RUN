# Aktualny stan projektu

Ten plik jest krótką pamięcią operacyjną między sesjami. Zapisuj tylko informacje potrzebne do bezpiecznej kontynuacji pracy.

## Aktualny zakres

- Milestone: `Milestone 7: Walidacja hipotezy pełnego meczu`.
- Status: `done`; test zewnętrzny zakończył bramkę PRD 001 decyzją `proceed`.
- Bramka PRD 000: `proceed` na podstawie wewnętrznego playtestu.
- Bramka PRD 001: `proceed` na podstawie automatycznych, wewnętrznych i zewnętrznych dowodów.
- Aktywny zakres implementacyjny: brak; `prd/002-first-run-loop.md` jest gotowy do planowania.
- Poza zatwierdzonym zakresem: zbiórki, kontry, faule, wielu przeciwników, finalna oprawa, metaprogresja i zapis postępu.

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
- Utworzono przyrostowy `prd/001-full-match.md` dla meczu do 11 punktów, naprzemiennych posiadań, osobnych talii i aktywnej obrony.
- Rozszerzono `spec.md` oraz `docs/spec/full-match.md` o agregat meczu, cykle talii, defensywne posiadanie, plany przeciwnika i jeden kanoniczny przepływ RNG.
- Utworzono `docs/product-vision.md` jako trwałą gwiazdę północną produktu, oddzieloną od backlogu i zakresów zatwierdzanych przez PRD.
- Utworzono przyrostowy `prd/002-first-run-loop.md` dla liniowego runu trzech meczów, nagród kartowych, nowych kart, trzech przeciwników i jednego lokalnego zapisu między meczami.
- Zaplanowano Milestone'y 4–7 w `ROADMAP.md`; ukończoną roadmapę PRD 000 przeniesiono do `docs/archive/roadmap/prd-000.md`.
- Zaimplementowano deterministyczny `MatchState`, punktację 1/2, warunek `11 / +2 / limit 15`, ścisłą naprzemienność, statystyki oraz niezależne cykle talii z dobieraniem i przetasowaniem.
- Zaimplementowano headlessowe defensywne posiadanie z planami `Pick & Roll`, `Drive & Kick`, `Quick Three`, pięcioma mechanikami kart, stratą, końcem czasu i wspólnym modelem jakości rzutu.
- Połączono obie role w grywalny pełny mecz od `0:0` do wyniku końcowego, z podsumowaniem każdego posiadania, statystykami, rewanżem i nowym seedem.
- Ręce meczowe zachowują cykl talii i deterministycznie gwarantują prototypowe minimum potrzebne do ukończenia posiadania.

## Co jest następne

- Zamienić `prd/002-first-run-loop.md` w aktualizację `spec.md` i mierzalne milestone'y w `ROADMAP.md` za pomocą `$codex-flow-plan-from-prd`.
- Nie implementować runu, nagród, nowych kart ani zapisu przed zaplanowaniem PRD 002.
- Commit i push nadal wymagają jawnego polecenia.

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
| 2026-08-14 | Plan PRD 001 i kompakcja roadmapy | `./scripts/check-context-size.sh`, `./scripts/verify.sh`, `git diff --check` | zaliczona | Dokumenty mieszczą się w progach; lint, typecheck, 25 testów Vitest, build i Playwright E2E przeszły. Nie zmieniono kodu aplikacji. |
| 2026-08-14 | Milestone 4 | `./scripts/verify.sh`, read-only review i poprawki dowodowe | zaliczona | 41 testów Vitest, build i Playwright E2E przeszły; brak problemów blokujących. Playtest niewymagany dla headlessowego zakresu. |
| 2026-08-14 | Milestone 5 | `./scripts/verify.sh`, read-only review i ponowne review | zaliczona | 55 testów Vitest, build i Playwright E2E przeszły; poprawiono spójność planu `Drive & Kick` i dodano trzy intencje obronne. Playtest niewymagany. |
| 2026-08-14 | Milestone 6 | `./scripts/verify.sh`, `$codex-flow-playtest`, read-only review | zaliczona | 63 testy Vitest, build i E2E przeszły. Dwa pełne mecze (seedy 42 i 43) zakończyły się 8:11 po 18 i 24 posiadaniach; sprawdzono obie role, różne ręce, trzy plany, podsumowania i rewanż. Konsola bez ostrzeżeń i błędów; canvas mieści się w kontenerze 1280×720 oraz 1024×768. |
| 2026-08-14 | Milestone 7 — zakres lokalny | `./scripts/verify.sh`, końcowe read-only review | zaliczona | 63 testy Vitest, build i 4 testy Playwright przeszły w 2,7 min. E2E obejmuje pełne zwycięstwo, porażkę, rewanż i zwycięstwo 1024×768; brak problemów blokujących w kodzie. Bramka pozostaje zablokowana na dowodach zewnętrznych. |
| 2026-08-14 | GitHub Pages, commit `7ae3ce2` | GitHub Actions i `$codex-flow-playtest`, seed 42, 1280×720 i 1024×768 | zaliczona | Workflow `Verify and deploy GitHub Pages` zakończył się sukcesem. Publiczna wersja pokazuje pełny mecz; `Shot → Nova` dał `PUDŁO: Contested (36)` i podsumowanie ze zmianą roli na obronę. HTML, JS i CSS zwracają 200, konsola jest czysta, bez poziomego overflow. |
| 2026-08-14 | Pierwszy ręczny pełny mecz, publiczny build `7ae3ce2`, seed 42 | playtest właściciela projektu | częściowo zaliczona: provisional `iterate` | Mecz ukończono w około 10 minut z porażką 2:11. Przepływ działa, ale brak wyjaśnień skutków kart wymuszał częściowo ślepe wybory; z tego powodu nie było chęci rewanżu. |
| 2026-08-14 | Iteracja czytelności, wynik `0:11` i korekta balansu | `./scripts/verify.sh`, audyt 100 seedów, playtest seeda 42 w 1280×720 i 1024×768 | gotowa do retestu | 68 testów i 4 E2E przeszły. Strategia kontekstowa wygrała 82/100 seedów; seed 42 `12:6`. `Screen → Drive` bez pomocy daje 80%, `Switch` `-5 pp`, konsola czysta. |
| 2026-08-14 | Wizualizacja zasłony | `./scripts/verify.sh` i `$codex-flow-playtest`, seed 42, 1280×720 i 1024×768 | zaliczona | 68 testów i 4 E2E przeszły. Zasłaniający podchodzi do celu, pozostaje na pierwszym planie i ma etykietę `ZASŁONA`; `Drive` przenosi kozłującego do paint. Brak błędów konsoli i overflow. |
| 2026-08-14 | Zewnętrzny playtest i bramka PRD 001 | pierwszy pełny mecz osoby wcześniej nieznającej projektu | zaliczona: `proceed` | Mecz trwał 10 minut i zakończył się 8:11. Po pisemnym objaśnieniu zasad tester rozumiał role i decyzje oraz chciał rewanżu. |

## Blokery i ryzyka

- Pomyślny test zewnętrzny odbył się po pisemnym objaśnieniu zasad; samodzielność onboardingu należy ponownie sprawdzić po dodaniu przyszłego tutorialu.
- Startowe talie prototypu mają po 10 kart, po dwie kopie każdej z pięciu mechanik; wartości pozostają danymi balansowymi.
- Prototypowa macierz efektów kart została dostrojona po wyniku `0:11`; wartości nadal pozostają danymi balansowymi.
- Produkcyjny bundle zawierający Phaser ma około 1,38 MB przed kompresją i 359 KB gzip; Vite zgłasza ostrzeżenie rozmiaru. Optymalizować dopiero na podstawie pomiaru, nie przed pierwszym gameplayem.
- `actions/configure-pages@v5` zgłasza nieblokującą adnotację o wewnętrznym przejściu z Node.js 20 na Node.js 24; workflow i deployment przechodzą.

## Handoff

- Najkrótsze streszczenie: PRD 000 i PRD 001 są ukończone z decyzjami `proceed`; `prd/002-first-run-loop.md` opisuje pierwszy trzy-meczowy run i jest gotowy do planowania zgodnie z `docs/product-vision.md`.
- Decyzje, których nie wolno zgubić: do 11, przewaga 2, limit 15; punktacja 1/2; ścisła naprzemienność; osobne utrzymujące stan talie; `Dalej` po każdym posiadaniu; jeden kanoniczny RNG; Phaser tylko prezentuje model widoku.
- Pliki do przeczytania jako pierwsze: `STATUS.md`, `prd/002-first-run-loop.md`, `docs/product-vision.md` oraz wynik bramki w `docs/validation/prd-001-validation.md`.
- Następny bezpieczny krok: zaplanowanie PRD 002 za pomocą `$codex-flow-plan-from-prd`.
