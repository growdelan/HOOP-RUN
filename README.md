# HOOP-RUN

Taktyczny roguelite deckbuilder o koszykówce 3 na 3, projektowany do uruchamiania bezpośrednio w przeglądarce. Projekt korzysta z TypeScriptu, Phasera i Vite, a build statyczny jest konfigurowany dla GitHub Pages.

Repozytorium zawiera grywalny prototyp pojedynczego posiadania. Gracz wybiera karty, wykonawców i cele na taktycznej planszy, odczytuje zamiar obrony oraz porównuje jakość przygotowanego i natychmiastowego rzutu. Zakres rozwoju opisują `spec.md` i `ROADMAP.md`.

Wynik walidacji pierwszego pionowego przekroju i ograniczenia dowodów opisuje `docs/validation/prd-000-validation.md`.

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

### Sterowanie prototypem

1. Kliknij kartę oznaczoną jako `DOSTĘPNA`.
2. Kliknij zawodnika z zielonym obramowaniem, aby wskazać wykonawcę.
3. Dla kart wymagających celu kliknij zawodnika z żółtym obramowaniem.
4. Przycisk `RESET` rozpoczyna nowe posiadanie z tym samym seedem; przyciski `−` i `+` zmieniają seed oraz resetują stan.

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

Skrypt sprawdza rozmiar kontekstu, lint, TypeScript, testy oraz produkcyjny build. Jeżeli zostanie zdefiniowany `test:e2e`, uruchomi również automatyczny smoke test przeglądarkowy.

Poszczególne komendy można uruchomić niezależnie:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Test E2E buduje aplikację, uruchamia produkcyjny preview pod `/HOOP-RUN/` i automatyzuje przygotowany rzut oraz reset w Chromium.

## CI i artefakt GitHub Pages

Workflow `.github/workflows/verify-pages.yml` uruchamia pełne `./scripts/verify.sh`, a następnie przygotowuje katalog `dist` jako artefakt GitHub Pages. Nie zawiera kroku `deploy-pages`, więc sam workflow nie publikuje strony. Wdrożenie wymaga osobnej, jawnej decyzji i zmiany workflow.

## Znane ograniczenia prototypu

- Walidacja hipotezy ma charakter wewnętrzny; nie zastępuje testów z nowymi graczami.
- Interfejs jest przeznaczony dla przeglądarek desktopowych; osobny layout mobilny pozostaje poza PRD 000.
- Produkcyjny bundle Phasera przekracza domyślny próg ostrzeżenia Vite, ale ładuje się poprawnie i nie blokuje pionowego przekroju.

## Struktura aplikacji

```text
src/
├── core/          # czyste, deterministyczne reguły gry
├── content/       # dane kart, zawodników i scenariuszy
├── application/   # sesja posiadania i model widoku
├── presentation/  # Phaser, plansza, karty i wejście myszą
└── platform/      # konfiguracja zależna od przeglądarki/hostingu
tests/              # testy automatyczne poza kodem aplikacji
public/             # statyczne zasoby kopiowane bez przetwarzania
```

## Zasady publikacji

Zakończenie implementacji nie oznacza zgody na commit ani push. Publikacja następuje wyłącznie na jawne polecenie użytkownika.
