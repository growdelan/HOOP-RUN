# HOOP-RUN

Taktyczny roguelite deckbuilder o koszykówce 3 na 3, projektowany do uruchamiania bezpośrednio w przeglądarce. Projekt korzysta z TypeScriptu, Phasera i Vite, a build statyczny jest konfigurowany dla GitHub Pages.

Repozytorium zawiera grywalny pierwszy run złożony z trzech kolejnych meczów. Gracz naprzemiennie atakuje i aktywnie broni, korzysta z osobnych talii, odczytuje profile przeciwników oraz gra do 11 punktów z przewagą 2 i limitem 15. Po zwycięstwach w pierwszym i drugim meczu obowiązkowo wybiera nagrodę rozwijającą jedną z talii; porażka kończy run, a trzecie zwycięstwo prowadzi do sukcesu. Zakres rozwoju opisują `spec.md` i `ROADMAP.md`.

Wynik walidacji pierwszego pionowego przekroju opisuje `docs/validation/prd-000-validation.md`. Bieżące dowody i brakujące warunki bramki pełnego meczu opisuje `docs/validation/prd-001-validation.md`.

## Wymagania

- Node.js `^20.19.0` albo `>=22.12.0`,
- npm,
- Chromium Playwrighta dla testów E2E: `npx playwright install chromium`.

## Uruchomienie

```bash
npm install
npm run dev
```

Vite pokaże lokalny adres serwera. Gra jest budowana z bazą `/HOOP-RUN/`, zgodną z docelowym adresem repozytorium na GitHub Pages.

### Przebieg runu

1. Na ekranie startowym wybierz `ROZPOCZNIJ NOWY RUN`. Przycisk `JAK GRAĆ` otwiera krótkie objaśnienie ról, punktacji, procentowej szansy trafienia i przebiegu trzech meczów.
2. Kliknij kartę oznaczoną jako `DOSTĘPNA`.
   Karta pokazuje koszt czasu i przewidywany efekt dla bieżącego stanu; `PP` oznacza punkty procentowe szansy trafienia.
3. Kliknij zawodnika z zielonym obramowaniem, aby wskazać wykonawcę. Dla kart wymagających celu kliknij zawodnika z żółtym obramowaniem.
4. W obronie kliknij kartę odpowiedzi, a następnie zawodnika z żółtym obramowaniem.
5. Po każdym posiadaniu kliknij `DALEJ`, aby przełączyć rolę.
6. Po zwycięstwie w meczu 1 lub 2 wybierz jedną z trzech obowiązkowych nagród, zatwierdź ją i przejdź do kolejnego przeciwnika. Wybrana karta pozostaje w odpowiedniej talii do końca runu.
7. Porażka kończy run niepowodzeniem, a zwycięstwo w trzecim meczu — sukcesem. Końcowe podsumowanie pokazuje wyniki, nagrody, talie i czas runu.
8. `NOWY RUN · CZYSTE TALIE` wraca do pierwszego meczu i usuwa nagrody poprzedniego runu.

Seed można ustawić bezpośrednio w adresie, na przykład `?seed=42`. Kontrolowany scenariusz końca czasu jest dostępny przez `?seed=42&clock=9`; parametr `clock` służy do testowania prototypu i domyślnie wynosi `14`.

Produkcyjny build i jego lokalny preview:

```bash
npm run build
npm run preview
```

## Codex Flow

Projekt korzysta z lekkiego harnessu współpracy z Codexem:

- `AGENTS.md` zawiera trwałe reguły repozytorium,
- `spec.md` opisuje aktualną prawdę produktową i techniczną,
- `ROADMAP.md` dzieli rozwój na mierzalne przyrosty,
- `STATUS.md` jest krótkim handoffem między sesjami,
- `prd/` przechowuje dokumenty wymagań,
- `.agents/skills/` zawiera powtarzalne workflow,
- `.codex/agents/` zawiera read-only profile planisty i reviewera.

## Zalecany początek pracy

1. Użyj `$codex-flow-create-prd`, aby przeprowadzić wywiad dotyczący pierwszego grywalnego zakresu.
2. Użyj `$codex-flow-plan-from-prd`, aby przygotować specyfikację i roadmapę.
3. Zrealizuj jeden uzgodniony milestone przez `$codex-flow-implement-milestone`.
4. Zweryfikuj grywalny rezultat przez `$codex-flow-playtest`.
5. Dla większej lub ryzykownej zmiany wykonaj `$codex-flow-review`.

Pozostałe workflow:

| Skill | Zastosowanie |
|---|---|
| `codex-flow-resume` | Odtworzenie stanu projektu bez zmian w plikach |
| `codex-flow-create-prd` | Wywiad produktowy i utworzenie PRD |
| `codex-flow-plan-from-prd` | PRD do specyfikacji i roadmapy |
| `codex-flow-implement-milestone` | Implementacja jednego milestone'u |
| `codex-flow-playtest` | Test przepływu i prezentacji gry w przeglądarce |
| `codex-flow-review` | Niezależne, read-only review zmian |
| `codex-flow-address-review` | Minimalne poprawki po review |
| `codex-flow-run-roadmap` | Kontrolowana realizacja wszystkich wykonalnych milestone'ów |
| `codex-flow-compact-context` | Porządkowanie przerośniętych plików kontekstu |
| `codex-flow-publish` | Przygotowanie, commit lub push zgodnie z jawną autoryzacją |

## Walidacja

Uruchom:

```bash
./scripts/verify.sh
```

Skrypt sprawdza rozmiar kontekstu, lint, TypeScript, testy i produkcyjny build. Nie uruchamia pełnych E2E; pipeline Pages wybiera wyłącznie krótki zestaw smoke przez `HOOP_RUN_E2E_SCRIPT=test:e2e:smoke`.

Poszczególne komendy można uruchomić niezależnie:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e:manual # wyłącznie ręcznie przez użytkownika
npm run test:e2e:smoke
HOOP_RUN_E2E_SCRIPT=test:e2e:smoke ./scripts/verify.sh
```

Testy E2E budują aplikację, uruchamiają produkcyjny preview pod `/HOOP-RUN/` i automatyzują prawdziwe kliknięcia w canvas. Pełny `test:e2e:manual` obejmuje całą kosztowną macierz i jest wyłącznie opcjonalną komendą użytkownika — agent jej nie uruchamia i nie czeka na jej wynik. `test:e2e:smoke` ogranicza się do startu, pierwszego meczu, bazowej ścieżki Pages i layoutu 1024×768.

## CI i GitHub Pages

Workflow `.github/workflows/verify-pages.yml` uruchamia lint, typecheck, testy domenowe, build i smoke E2E przez `./scripts/verify.sh`, przygotowuje katalog `dist` jako artefakt GitHub Pages, a po sukcesie publikuje go z gałęzi `main`. Pull requesty przechodzą tę samą walidację, ale nie uruchamiają joba wdrożeniowego.

Pełny zestaw przeglądarkowy działa niezależnie w `.github/workflows/full-e2e.yml` wyłącznie po ręcznym `workflow_dispatch`. Nie ma harmonogramu i nie blokuje deploymentu Pages ani pracy agenta. Przy porażce workflowy przechowują dostępne pliki `test-results` przez 7 dni, w tym trace'y, screenshoty i kontekst błędu Playwrighta.

Opublikowana gra jest dostępna pod adresem `https://growdelan.github.io/HOOP-RUN/`.

## Znane ograniczenia prototypu

- Walidacja hipotezy ma charakter wewnętrzny; nie zastępuje testów z nowymi graczami.
- Interfejs jest przeznaczony dla przeglądarek desktopowych; osobny layout mobilny pozostaje poza bieżącym zakresem.
- Produkcyjny bundle Phasera przekracza domyślny próg ostrzeżenia Vite, ale ładuje się poprawnie i nie blokuje pionowego przekroju.

## Struktura aplikacji

```text
src/
├── core/          # czyste, deterministyczne reguły gry
├── content/       # dane kart, zawodników i scenariuszy
├── application/   # sesje posiadania, meczu i runu oraz modele widoku
├── presentation/  # Phaser, plansza, karty i wejście myszą
└── platform/      # konfiguracja zależna od przeglądarki/hostingu
tests/              # testy automatyczne poza kodem aplikacji
public/             # statyczne zasoby kopiowane bez przetwarzania
```

## Zasady publikacji

Zakończenie implementacji nie oznacza zgody na commit ani push. Po jawnym wypchnięciu zmiany na `main` skonfigurowany workflow automatycznie publikuje zweryfikowany build na GitHub Pages.
