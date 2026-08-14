# Roadmapa HOOP-RUN

Roadmapa realizuje `prd/000-initial-prd.md`. Dozwolone statusy: `planned`, `in_progress`, `done`, `blocked`.

Milestone można oznaczyć jako `done`, gdy wszystkie kryteria akceptacji są spełnione, wskazana walidacja i wymagany playtest przeszły, dokumentacja odpowiada faktom, a problemy blokujące z wymaganego review zostały rozwiązane.

## Kolejność i bramka zakresu

Milestone'y wykonuje się kolejno: `0 → 1 → 2 → 3`. Milestone 2 jest pierwszym właściwym pionowym przekrojem gameplayu. Milestone 3 kończy PRD 000 i stanowi bramkę decyzji: rozwój pełnego meczu albo runu wymaga oceny hipotezy oraz nowego lub przyrostowego PRD.

## Milestone 0: Fundament aplikacji przeglądarkowej (`done`)

### Cel

Utworzyć minimalną, powtarzalną bazę TypeScript + Phaser + Vite, na której można bezpiecznie implementować i testować posiadanie.

### Hipoteza do zweryfikowania

Wybrany stos pozwala uruchamiać, testować i budować statyczny prototyp Phasera pod niekorzeniową ścieżką GitHub Pages bez backendu.

### Kryteria akceptacji

- `package.json` i `package-lock.json` definiują projekt npm oraz skrypty `dev`, `lint`, `typecheck`, `test`, `build` i `preview`.
- TypeScript działa w trybie `strict`.
- Minimalna scena Phasera uruchamia się w przeglądarce i renderuje rozpoznawalną planszę testową.
- Struktura rozdziela `core`, `content`, `application`, `presentation` i `platform` albo równoważne jednoznaczne granice.
- Produkcyjny build działa z bazową ścieżką `/HOOP-RUN/` i nie zgłasza brakujących zasobów.
- `./scripts/verify.sh` przechodzi.

### Zakres

- konfiguracja npm, TypeScriptu, Vite, Phasera, lintera i Vitest,
- minimalne entrypointy i scena startowa bez reguł gry,
- konfiguracja bazy GitHub Pages,
- jeden test potwierdzający działanie środowiska testowego,
- aktualizacja README o prawdziwe komendy uruchomienia.

### Poza zakresem

- model posiadania i karty,
- UI ręki i interakcje gameplayowe,
- Playwright i workflow publikacji,
- finalny layout, grafika i audio.

### Walidacja

- Testy automatyczne: test środowiska przez `npm run test`.
- Build: `npm run typecheck`, `npm run lint`, `npm run build`, `./scripts/verify.sh`.
- Playtest: wymagany smoke test uruchomienia sceny w przeglądarce pod lokalnym preview z bazą `/HOOP-RUN/`; sprawdzić konsolę i zasoby.
- Review: wymagane sprawdzenie granic modułów i konfiguracji przed `done`.

### Zależności i ryzyka

- Zależność: dostępne Node.js i npm.
- Ryzyko: nadmiar bibliotek przed pierwszą mechaniką; instalować tylko zależności potrzebne do kryteriów.
- Ryzyko: konfiguracja działająca wyłącznie pod `/`; testować niekorzeniową bazę od początku.

## Milestone 1: Deterministyczny silnik posiadania (`done`)

### Cel

Zaimplementować czystą, testowalną bez Phasera logikę pojedynczego posiadania wraz z kartami, zegarem, obroną i rozstrzygnięciem rzutu.

### Hipoteza do zweryfikowania

Pięć podstawowych mechanik i jeden jawny profil obrony wystarczą, aby co najmniej dwie sekwencje decyzji prowadziły do różnych, wyjaśnialnych jakości rzutu.

### Kryteria akceptacji

- Serializowalny stan obsługuje fazy `setup`, `playerTurn`, `resolvingShot` i `completed` oraz wynik `clockExpired`.
- Stan reprezentuje sześciu uczestników, cztery prototypowe strefy, piłkę, krycie, zegar, intencję, `Advantage`, rękę i historię.
- Mechaniki `Pass`, `Screen`, `Drive`, `Kick Out` i `Shot` mają typowane definicje danych i działające reguły.
- Nielegalna akcja zwraca stabilny powód i nie zmienia stanu ani RNG.
- Obrona zapowiada i wykonuje deterministyczną reakcję, którą można skontrować właściwą sekwencją.
- Natychmiastowy `Shot` i przygotowany `Shot` dają różne rozkłady modyfikatorów lub kategorie jakości.
- Ten sam seed i sekwencja komend dają identyczny stan końcowy; różne seedy mogą zmienić wynik bez zmiany wyliczonej jakości.
- `core` nie importuje Phasera, DOM ani API przeglądarki.

### Zakres

- typy i fabryka stanu początkowego,
- wstrzykiwany seedowany RNG,
- walidacja i niemutująca redukcja stanu,
- dane pięciu podstawowych kart i stałej ręki testowej,
- zegar, `Advantage`, modyfikatory jakości, kategorie rzutu i wynik,
- jeden profil obrony oraz zdarzenia domenowe,
- testy podstawowe, brzegowe i odtwarzalności.

### Poza zakresem

- renderowanie i sterowanie,
- losowe dobieranie kart,
- pełny balans statystyk,
- wiele profili obrony, talia defensywna, zbiórki i pełny mecz.

### Walidacja

- Testy automatyczne: pełny zestaw Vitest dla legalności, kosztu czasu, pięciu mechanik, obrony, jakości, RNG, resetu i braku mutacji wejścia.
- Build: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `./scripts/verify.sh`.
- Playtest: niewymagany, ponieważ milestone nie zmienia grywalnego interfejsu; dowodem są testy scenariuszy domenowych.
- Review: wymagane read-only review kontraktów, deterministyczności i kompletności przypadków brzegowych.

### Zależności i ryzyka

- Zależność: Milestone 0.
- Ryzyko: przeprojektowanie silnika przed dowodem gameplayu; implementować tylko reguły PRD 000.
- Ryzyko: jedna wymuszona kombinacja; testy muszą wykazać co najmniej dwie legalne ścieżki o różnych skutkach.
- Ryzyko: arbitralne liczby mogą wyglądać jak finalny balans; trzymać je jako dane prototypowe.

## Milestone 2: Grywalne posiadanie 3 na 3 (`done`)

### Cel

Połączyć silnik z Phaserem w kompletny, powtarzalny przepływ jednego ofensywnego posiadania obsługiwany myszą.

### Hipoteza do zweryfikowania

Gracz potrafi odczytać stan i intencję obrony, zbudować akcję z kart oraz zrozumieć, dlaczego przygotowany rzut jest lepszy od natychmiastowego.

### Kryteria akceptacji

- Ekran pokazuje półboisko, sześć rozróżnialnych tokenów, cztery strefy, krycie, piłkę, zegar, `Advantage`, intencję i pięć kart.
- Posiadacz piłki, wykonujący, legalne cele i akcje są jednoznaczne bez polegania wyłącznie na kolorze.
- Gracz może przeprowadzić `Screen → Drive → Kick Out → Shot` oraz co najmniej jedną alternatywną legalną ścieżkę.
- Zagrana karta aktualizuje widoczny stan, koszt czasu i komunikat przyczynowy zgodnie z wynikiem `core`.
- Nielegalna karta nie zmienia stanu i pokazuje konkretny powód.
- `Shot` pokazuje kategorię i modyfikatory, rozstrzyga wynik i przechodzi do podsumowania.
- Reset z tym samym seedem nie przeładowuje strony i odtwarza wynik dla tej samej sekwencji.
- Podstawowy przepływ nie ma błędów konsoli, brakujących zasobów ani ślepej uliczki.

### Zakres

- jedna scena lub minimalny zestaw scen Phasera dla posiadania i podsumowania,
- taktyczna plansza z prostymi tokenami i etykietami,
- ręka kart, wybór celu, stan legalności i komunikaty przyczynowe,
- adapter pomiędzy `application/core` a prezentacją,
- prosty feedback ruchu i zmiany stanu bez docelowych animacji,
- reset i możliwość jawnego ustawienia seeda do testu.

### Poza zakresem

- finalna oprawa, audio i długie animacje akcji,
- pełna obsługa klawiatury i osobny layout mobilny,
- pełny mecz, obrona gracza, run i zapis postępu,
- dodawanie kart poza mechanikami PRD 000.

### Walidacja

- Testy automatyczne: istniejące testy core oraz testy adaptera aplikacyjnego; bez dublowania logiki przez testy renderera.
- Build: pełne `./scripts/verify.sh`.
- Playtest: wymagany `$codex-flow-playtest` dla przygotowanego rzutu, alternatywnej ścieżki, nielegalnej karty, wyczerpania zegara i resetu z seedem na podstawowym desktopowym viewporcie.
- Review: wymagane niezależne review rozdzielenia Phasera od reguł oraz obsługi stanu UI.

### Zależności i ryzyka

- Zależność: Milestone 1.
- Ryzyko: przeciążenie informacją; priorytetem są posiadacz piłki, intencja, legalność i przyczyna zmiany.
- Ryzyko: UI może maskować jedyną sensowną sekwencję; playtest musi jawnie sprawdzić alternatywę.
- Ryzyko: animacje mogą spowalniać iteracje; ograniczyć je do krótkiego feedbacku.

## Milestone 3: Walidacja hipotezy i gotowość do udostępnienia (`done`)

### Cel

Ustabilizować pionowy przekrój, zautomatyzować krytyczny smoke test i zebrać dowody potrzebne do decyzji o dalszym rozwoju gameplayu.

### Hipoteza do zweryfikowania

Pionowy przekrój jest zrozumiały, odtwarzalny i wystarczająco interesujący, aby uzasadnić projektowanie pełnego meczu zamiast przebudowy podstawowej pętli.

### Kryteria akceptacji

- Playwright automatyzuje uruchomienie, co najmniej jedną legalną sekwencję, rzut, podsumowanie i reset.
- Produkcyjny build działa pod `/HOOP-RUN/`; konsola i sieć nie pokazują blokujących błędów ani brakujących zasobów.
- Playtest potwierdza pięć miar powodzenia z PRD albo dokumentuje konkretnie, które nie zostały spełnione.
- Gracz może przed pierwszą akcją wskazać intencję obrony, a po rzucie odczytać przyczyny jego jakości.
- Dwie sensowne sekwencje prowadzą do różnych stanów lub jakości, a gracz nie jest prowadzony jedyną legalną ścieżką.
- Konfiguracja GitHub Actions buduje i przygotowuje artefakt Pages; faktyczne wdrożenie wymaga osobnej zgody na publikację.
- Dokumentacja uruchomienia, walidacji i znanych ograniczeń odpowiada działającemu repozytorium.
- Niezależne review nie zawiera nierozwiązanych problemów blokujących.

### Zakres

- konfiguracja Playwright i jeden stabilny scenariusz E2E,
- poprawki czytelności oraz błędów odkrytych w playteście, bez nowych mechanik,
- test produkcyjnej bazy i ładowania zasobów,
- workflow GitHub Actions dla testów/builda oraz przygotowania GitHub Pages,
- udokumentowanie wyniku hipotezy i bramki następnej decyzji.

### Poza zakresem

- publikacja bez jawnego polecenia użytkownika,
- pełny mecz i system runu,
- nowe karty, przeciwnicy i rozbudowane animacje,
- przebudowa pętli wykraczająca poza problemy ujawnione przez PRD 000.

### Walidacja

- Testy automatyczne: `npm run test`, `npm run test:e2e` oraz test deterministycznego scenariusza referencyjnego.
- Build: `npm run lint`, `npm run typecheck`, `npm run build`, pełne `./scripts/verify.sh`; walidacja workflow bez wykonywania pushu.
- Playtest: wymagany pełny `$codex-flow-playtest` na produkcyjnym preview, obejmujący kryteria i miary powodzenia PRD 000 oraz co najmniej dwa istotne viewporty desktopowe.
- Review: wymagane końcowe read-only review diffu, testów, dowodów playtestu i zgodności dokumentacji.

### Zależności i ryzyka

- Zależność: Milestone 2.
- Ryzyko: automatyczny E2E może potwierdzić poprawność, ale nie frajdę; decyzja produktowa wymaga obserwacji playtestu.
- Ryzyko: poprawki czytelności mogą przerodzić się w redesign; większą zmianę zaplanować osobno.
- Ryzyko: pozytywny wewnętrzny playtest może nie reprezentować nowych graczy; zapisać ograniczenie dowodów.

## Bramka po PRD 000

Wynik z 2026-08-14: `proceed`. Wszystkie pięć miar zostało potwierdzonych w wewnętrznym playteście, a szczegóły i ograniczenia opisuje `docs/validation/prd-000-validation.md`. Następny zakres wymaga przyrostowego PRD pełnego meczu.

Po ukończeniu Milestone 3 należy wybrać jeden z wyników:

1. `proceed` — hipoteza potwierdzona; utworzyć przyrostowy PRD dla pełnego meczu,
2. `iterate` — rdzeń obiecujący, ale konkretne miary nieprzechodzące; utworzyć ograniczony PRD korekty posiadania,
3. `rethink` — sekwencje nie tworzą interesujących decyzji; zatrzymać rozwój runu i wrócić do modelu podstawowej pętli.

Nie planować mapy runu, metaprogresji ani dużej produkcji zawartości przed tą bramką.

## Ukończone milestone'y

- 2026-08-14 — Milestone 0: fundament TypeScript + Phaser + Vite, test, produkcyjny build `/HOOP-RUN/`, playtest i review zakończone bez problemów blokujących.
- 2026-08-14 — Milestone 1: deterministyczny silnik posiadania, pięć mechanik kart, zegar, reakcja obrony, jakość rzutu, seedowany RNG i 14 testów domenowych zakończone bez problemów blokujących.
- 2026-08-14 — Milestone 2: grywalne posiadanie 3 na 3, adapter aplikacyjny, wybór kart i celów, podsumowanie rzutu, reset z seedem oraz playtest wymaganych scenariuszy zakończone bez problemów blokujących.
- 2026-08-14 — Milestone 3: Playwright, workflow przygotowujący artefakt Pages bez publikacji, walidacja pięciu miar PRD i bramka `proceed` zakończone bez problemów blokujących.

Szczegóły starszych ukończonych milestone'ów będą przenoszone do `docs/archive/roadmap/`, gdy roadmapa będzie wymagała kompakcji.
