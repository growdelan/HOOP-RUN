# Aktualny stan projektu

Ten plik jest krótką pamięcią operacyjną między sesjami. Zapisuj tylko informacje potrzebne do bezpiecznej kontynuacji pracy.

## Aktualny zakres

- Milestone: `Milestone 7: Walidacja hipotezy pełnego meczu`.
- Status: `blocked`; lokalna część Milestone 7 jest ukończona, lecz bramka wymaga testu nowego gracza i publikacji aktualnego buildu.
- Bramka PRD 000: `proceed` na podstawie wewnętrznego playtestu.
- Aktywny zakres: `prd/001-full-match.md`, realizowany kolejno przez Milestone'y 4–7.
- Poza aktywnym zakresem: zbiórki, kontry, faule, wielu przeciwników, finalna oprawa, run, metaprogresja i zapis postępu.

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
- Zaplanowano Milestone'y 4–7 w `ROADMAP.md`; ukończoną roadmapę PRD 000 przeniesiono do `docs/archive/roadmap/prd-000.md`.
- Zaimplementowano deterministyczny `MatchState`, punktację 1/2, warunek `11 / +2 / limit 15`, ścisłą naprzemienność, statystyki oraz niezależne cykle talii z dobieraniem i przetasowaniem.
- Zaimplementowano headlessowe defensywne posiadanie z planami `Pick & Roll`, `Drive & Kick`, `Quick Three`, pięcioma mechanikami kart, stratą, końcem czasu i wspólnym modelem jakości rzutu.
- Połączono obie role w grywalny pełny mecz od `0:0` do wyniku końcowego, z podsumowaniem każdego posiadania, statystykami, rewanżem i nowym seedem.
- Ręce meczowe zachowują cykl talii i deterministycznie gwarantują prototypowe minimum potrzebne do ukończenia posiadania.

## Co jest następne

- Przeprowadzić scenariusz z `docs/validation/prd-001-validation.md` z osobą nieznającą projektu i zapisać czas oraz obserwacje.
- Po autoryzowanym commitcie i pushu sprawdzić aktualny build na GitHub Pages, a po teście nowego gracza wybrać bramkę `proceed`, `iterate` albo `rethink`.
- Nie projektować mapy runu ani metaprogresji przed bramką Milestone 7. Commit i push nadal wymagają jawnego polecenia.

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

## Blokery i ryzyka

- Milestone 7 jest zablokowany przez obowiązkowy test osoby wcześniej nieznającej projektu: bez niego nie da się rzetelnie ocenić czasu 8–12 minut, wpływu wyniku i chęci rewanżu.
- Weryfikacja aktualnego buildu na GitHub Pages pozostaje oczekującym krokiem po pushu i zakończeniu workflow wdrożeniowego.
- Startowe talie prototypu mają po 10 kart, po dwie kopie każdej z pięciu mechanik; wartości pozostają danymi balansowymi.
- Prototypowa macierz efektów kart i trzy plany są przyjęte do playtestu; zakres informacji predykcyjnej pozostaje decyzją UI Milestone 6.
- Produkcyjny bundle zawierający Phaser ma około 1,38 MB przed kompresją i 359 KB gzip; Vite zgłasza ostrzeżenie rozmiaru. Optymalizować dopiero na podstawie pomiaru, nie przed pierwszym gameplayem.
- `actions/configure-pages@v5` zgłasza nieblokującą adnotację o wewnętrznym przejściu z Node.js 20 na Node.js 24; workflow i deployment przechodzą.
- Przed bramką PRD 001 wymagany jest co najmniej jeden pełny test z osobą nieznającą projektu.

## Handoff

- Najkrótsze streszczenie: PRD 000 oraz milestone'y 4–6 PRD 001 są ukończone; grywalny pełny mecz działa lokalnie, a Milestone 7 zbiera automatyczne i jakościowe dowody do bramki.
- Decyzje, których nie wolno zgubić: do 11, przewaga 2, limit 15; punktacja 1/2; ścisła naprzemienność; osobne utrzymujące stan talie; `Dalej` po każdym posiadaniu; jeden kanoniczny RNG; Phaser tylko prezentuje model widoku.
- Pliki do przeczytania jako pierwsze: `STATUS.md`, Milestone 7 w `ROADMAP.md`, `docs/spec/full-match.md` i `prd/001-full-match.md`.
- Następny bezpieczny krok: wykonać test nowego gracza według `docs/validation/prd-001-validation.md`; nie projektować runu przed rozstrzygnięciem bramki.
