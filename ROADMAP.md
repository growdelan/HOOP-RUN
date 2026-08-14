# Roadmapa HOOP-RUN

Roadmapa obejmuje ukończone `prd/000-initial-prd.md` i `prd/001-full-match.md`. `prd/002-first-run-loop.md` jest gotowy do planowania, ale nie ma jeszcze zatwierdzonych milestone'ów. Dozwolone statusy: `planned`, `in_progress`, `done`, `blocked`.

Milestone można oznaczyć jako `done`, gdy wszystkie kryteria akceptacji są spełnione, wskazana walidacja i wymagany playtest przeszły, dokumentacja odpowiada faktom, a problemy blokujące z wymaganego review zostały rozwiązane.

## Aktualna kolejność

Milestone'y PRD 001 wykonano kolejno: `4 → 5 → 6 → 7`.

- Milestone 4 buduje deterministyczny agregat meczu i cykl dwóch talii.
- Milestone 5 dostarcza headlessowy silnik aktywnej obrony oraz jednego przeciwnika.
- Milestone 6 jest minimalnym grywalnym pionowym przekrojem pełnego meczu end-to-end.
- Milestone 7 waliduje główną hipotezę PRD 001 i stanowi bramkę przed projektowaniem runu.

## Milestone 4: Deterministyczny szkielet meczu i talii (`done`)

### Cel

Rozszerzyć czysty model domenowy o wynik, naprzemienne posiadania, warunek zwycięstwa, statystyki oraz niezależne cykle talii ataku i obrony, bez implementowania jeszcze grywalnej obrony.

### Hipoteza do zweryfikowania

Istniejący silnik posiadania można bezpiecznie osadzić w deterministycznym agregacie meczu, a utrzymujące stan talie generują różne ręce bez utraty odtwarzalności.

### Kryteria akceptacji

- Serializowalny `MatchState` reprezentuje seed i jeden kanoniczny przebieg RNG, wynik, aktywną stronę, rolę gracza, numer posiadania, fazę meczu, dwie talie, statystyki, historię i opcjonalne aktywne posiadanie.
- Fazy meczu rozróżniają aktywne posiadanie, podsumowanie posiadania i zakończony mecz.
- Trafiony rzut przyznaje 1 punkt z `paint` i 2 punkty ze stref obwodowych; pozostałe rezultaty dają 0 punktów.
- Warunek `do 11, przewaga 2, maksymalnie do 15` poprawnie obsługuje co najmniej wyniki `11:9`, `11:10`, `12:10`, `14:14` i `15:14`.
- Każdy rezultat posiadania przełącza atakującą drużynę dokładnie raz dopiero po zatwierdzeniu podsumowania.
- Talia ofensywna i defensywna mają niezależne stosy dobierania, ręce i stosy odrzuconych; dobieranie do pięciu oraz przetasowanie są deterministyczne.
- Niewykorzystane i zagrane karty wracają do właściwego stosu odrzuconych po posiadaniu.
- Ten sam seed i sekwencja kontrolowanych rezultatów dają identyczne ręce, wynik, historię i statystyki.
- Istniejące testy pojedynczego posiadania pozostają niezmiennie zaliczone.

### Zakres

- typy i reducer pełnego meczu,
- reguły punktacji, naprzemienności i zwycięstwa,
- generyczny cykl talii oraz deterministyczne tasowanie,
- kontrakt uruchamiania i zamykania posiadania,
- historia i podstawowe statystyki meczu,
- dane startowych talii jako prototypowe parametry,
- testy przypadków podstawowych, brzegowych i niemutowalności.

### Poza zakresem

- reguły kart defensywnych i plany przeciwnika,
- interfejs pełnego meczu,
- balans końcowych talii,
- zbiórki, kontry, faule, run i zapis postępu.

### Walidacja

- Testy automatyczne: Vitest dla punktacji, zwycięstwa, przełączania ról, dwóch talii, tasowania, statystyk, resetu i odtwarzalności.
- Build: pełne `./scripts/verify.sh`.
- Playtest: niewymagany, ponieważ milestone nie zmienia widocznego przepływu gry.
- Review: wymagane read-only review granic agregatu, niemutowalności i kanonicznego przepływu RNG.

### Zależności i ryzyka

- Zależność: ukończony Milestone 3 i działający reducer posiadania.
- Ryzyko: duplikacja RNG pomiędzy meczem i posiadaniem; stan losowości musi być przekazywany jednym kanonicznym strumieniem.
- Ryzyko: refaktor talii może zepsuć PRD 000; zachować kompatybilny scenariusz referencyjny.
- Ryzyko: dokładne liczby kart są balansem, nie kontraktem domenowym; nie kodować ich w reducerze.

## Milestone 5: Aktywna obrona i plany przeciwnika (`done`)

### Cel

Zaimplementować czysty, deterministyczny silnik defensywnego posiadania, pięć mechanik odpowiedzi oraz jedną drużynę przeciwną z trzema ujawnianymi planami ofensywnymi.

### Hipoteza do zweryfikowania

Jawny plan i najbliższa akcja przeciwnika wraz z kartami o kompromisach tworzą co najmniej dwie sensowne odpowiedzi, zamiast oczywistego kontrsystemu albo zgadywania.

### Kryteria akceptacji

- `DefensePossessionState` rozróżnia plan całego posiadania, aktualny krok, zegar, ustawienie, krycie, przewagę przeciwnika, rękę, historię, RNG i rezultat.
- Przeciwnik wybiera deterministycznie jeden z co najmniej trzech planów: `Pick & Roll`, `Drive & Kick` i `Quick Three` albo równoważnych zatwierdzonych danych.
- Plan ujawnia nazwę i bieżącą akcję, ale nie przyszłe kroki.
- Mechaniki `Pressure`, `Switch`, `Go Under`, `Help Defense` i `Double Team` mają typowane dane, legalność, koszt czasu, efekt i jawne ryzyko.
- Legalna odpowiedź aktualizuje zegar, ustawienie, krycie, przewagę lub statusy oraz generuje przyczynowe zdarzenia.
- Obrona może pogorszyć rzut, wymusić stratę albo doprowadzić do końca czasu; źle dobrana karta może obserwowalnie poprawić sytuację przeciwnika.
- Żadna karta nie jest bezwarunkowo najlepszą odpowiedzią na wszystkie trzy plany.
- Nielegalna odpowiedź nie zmienia stanu ani RNG i zwraca stabilny powód.
- Rzut przeciwnika używa wspólnego modelu jakości oraz seedowanego rozstrzygnięcia.
- AI nie odczytuje przyszłej ręki ani wyboru gracza i nie zmienia planu po fakcie bez jawnej reguły.

### Zakres

- typy, komendy, reducer i zdarzenia defensywnego posiadania,
- pięć współdzielonych mechanik kart defensywnych,
- definicje jednej drużyny i trzech planów jako dane,
- dane kilku defensywnych intencji przeciwnika dla ofensywy gracza,
- kontrakt jakości rzutu, straty i końca czasu,
- deterministyczne testy dobrych, ryzykownych i nielegalnych odpowiedzi.

### Poza zakresem

- rendering, sterowanie i animacje obrony,
- wielu przeciwników i adaptacyjne AI,
- pełna symetria z ofensywą gracza,
- zbiórki, kontry, faule i zmęczenie.

### Walidacja

- Testy automatyczne: Vitest dla planów, telegraphu, pięciu mechanik, legalności, kosztu czasu, jakości, straty, końca czasu, braku podglądu przyszłych decyzji i odtwarzalności.
- Build: pełne `./scripts/verify.sh`.
- Playtest: niewymagany, ponieważ milestone dostarcza headlessowe reguły i dane.
- Review: wymagane read-only review reguł, kompromisów kart, AI, deterministyczności i granicy z Phaserem.

### Zależności i ryzyka

- Zależność: Milestone 4.
- Ryzyko: macierz kontr może stać się kamień–papier–nożyce; każda akcja powinna dopuszczać więcej niż jedną kontekstową odpowiedź.
- Ryzyko: zbyt ukryte skutki stworzą zgadywanie; każde rozstrzygnięcie musi publikować nazwane modyfikatory.
- Ryzyko: mnożenie wyjątków per karta; mechaniki implementować wspólnie, a karty i plany składać jako dane.

## Milestone 6: Grywalny pełny mecz (`done`)

### Cel

Połączyć agregat meczu, ofensywę i aktywną obronę w kompletny przepływ od `0:0` do zwycięstwa albo porażki obsługiwany myszą.

### Hipoteza do zweryfikowania

Gracz potrafi płynnie przełączać się między atakiem i obroną, rozumie wpływ kart na wynik oraz kończy pełny mecz bez ślepej uliczki i bez wrażenia utraty kontroli.

### Kryteria akceptacji

- Ekran zawsze pokazuje wynik, cel meczu, rolę `ATAK` albo `OBRONA`, numer posiadania, zegar oraz właściwą rękę.
- Ofensywne posiadanie zachowuje czytelność i mechaniki PRD 000, ale korzysta z ręki dobranej z talii meczowej.
- Defensywne posiadanie pokazuje plan, bieżącą akcję, wykonującego i legalne odpowiedzi bez ujawniania przyszłej sekwencji.
- Gracz może rozegrać co najmniej dwa różne posiadania ofensywne i dwa defensywne wymagające różnych decyzji.
- Po każdym posiadaniu podsumowanie pokazuje rezultat, zdobyte punkty, przyczyny, nowy wynik i następną rolę; przejście wymaga `Dalej`.
- Mecz poprawnie kończy się zwycięstwem lub porażką, blokuje dalsze akcje i pokazuje wynik, podstawowe statystyki, rewanż z tym samym seedem oraz nowy mecz.
- Rewanż z tym samym seedem i identycznymi decyzjami odtwarza przebieg i wynik bez przeładowania strony.
- Widok nie polega wyłącznie na kolorze, nie ma blokujących błędów konsoli, brakujących zasobów ani ślepej uliczki.

### Zakres

- meczowa sesja aplikacyjna i model widoku,
- integracja obu typów posiadań oraz cykli talii,
- widoki ataku, obrony, podsumowania posiadania i podsumowania meczu,
- wynik, rola, talie i statystyki w istniejącej scenie albo minimalnym zestawie scen,
- sterowanie kartą, wykonującym, celem, `Dalej`, rewanżem i nowym seedem,
- rozszerzenie mostu E2E wyłącznie o odczytowy snapshot pełnego meczu.

### Poza zakresem

- finalne animacje i audio,
- osobny layout mobilny i pełne sterowanie klawiaturą,
- zbiórki, kontry, run, nagrody i zapis postępu,
- dodatkowe drużyny lub karty poza prototypowym minimum.

### Walidacja

- Testy automatyczne: istniejące testy core, testy sesji aplikacyjnej i deterministyczny scenariusz pełnego meczu.
- Build: pełne `./scripts/verify.sh`.
- Playtest: wymagany `$codex-flow-playtest` od `0:0` do końca meczu, obejmujący atak, obronę, różne ręce, `Dalej`, wynik, zakończenie i rewanż na dwóch viewportach desktopowych.
- Review: wymagane niezależne review przepływu stanu, granic Phasera, legalności wejścia i czytelności obu ról.

### Zależności i ryzyka

- Zależność: Milestone 5.
- Ryzyko: przeciążenie planszy wynikiem, planem i ręką; priorytet informacji zależy od aktualnej roli.
- Ryzyko: długi playtest spowalnia iterację; automatyczne scenariusze mogą używać kontrolowanych seedów, ale kryterium grywalności wymaga pełnego meczu.
- Ryzyko: istniejąca scena zakłada jedną sesję posiadania; integracja nie może przenieść reguł meczu do Phasera.

## Milestone 7: Walidacja hipotezy pełnego meczu (`done`)

### Cel

Ustabilizować pełny mecz, zautomatyzować krytyczne ścieżki i zebrać dowody do decyzji, czy można projektować pierwszą pętlę runu.

### Hipoteza do zweryfikowania

Naprzemienne posiadania, wynik i dwie talie tworzą napięty mecz trwający około 8–12 minut, a aktywna obrona daje poczucie wpływu bez powtarzalności i zgadywania.

### Kryteria akceptacji

- Playwright automatyzuje co najmniej jeden wygrany i jeden przegrany mecz, zmianę ról, podsumowania, warunek zwycięstwa oraz rewanż.
- Kontrolowane testy obejmują trzy plany przeciwnika, różne ręce obu talii, stratę, koniec czasu, rzut za 1 i rzut za 2.
- Pełny mecz działa w produkcyjnym preview i po publikacji pod `/HOOP-RUN/` bez blokujących błędów konsoli, sieci lub zasobów.
- Playtest potwierdza albo konkretnie obala wszystkie miary powodzenia PRD 001, w tym czas 8–12 minut i wpływ wyniku na końcowe decyzje.
- Wykonano co najmniej jeden test z osobą, która wcześniej nie znała projektu, i zapisano obserwacje dotyczące roli, obrony, wyniku i chęci rewanżu.
- Dokumentacja uruchomienia, reguł, walidacji, ograniczeń i wyniku bramki odpowiada działającemu repozytorium.
- Niezależne review nie zawiera nierozwiązanych problemów blokujących.

### Zakres

- stabilizacja i ograniczone poprawki problemów ujawnionych przez pełny playtest,
- E2E wygranej, porażki i rewanżu,
- kontrolowane seedy do scenariuszy planów i końcówek,
- pomiar czasu oraz walidacja jakościowa aktywnej obrony,
- dokument walidacji PRD 001 i decyzja bramki.

### Poza zakresem

- mapa runu, nagrody, draft, trening i metaprogresja,
- wielu przeciwników i szeroka produkcja kart,
- finalny balans, oprawa, audio i optymalizacja mobilna,
- publikacja zmian bez osobnej zgody na commit i push.

### Walidacja

- Testy automatyczne: `npm run test`, `npm run test:e2e` oraz referencyjne scenariusze deterministyczne.
- Build: pełne `./scripts/verify.sh` i weryfikacja artefaktu Pages.
- Playtest: wymagany pełny `$codex-flow-playtest` dla wygranej i porażki na dwóch viewportach oraz udokumentowany test nowego gracza.
- Review: wymagane końcowe read-only review diffu, testów, dowodów playtestu i zgodności dokumentacji.

### Zależności i ryzyka

- Zależność: Milestone 6.
- Ryzyko: automatyzacja potwierdza poprawność, ale nie napięcie; bramka wymaga obserwacji pełnego meczu.
- Ryzyko: jeden przeciwnik może zawyżać powtarzalność; oceniać różnorodność planów, nie ilość zawartości.
- Ryzyko: wynik wewnętrzny może nie reprezentować nowych graczy; test z osobą spoza projektu jest obowiązkowym dowodem jakościowym.

## Bramka po PRD 001

Po ukończeniu Milestone 7 należy wybrać wynik:

1. `proceed` — pełny mecz utrzymuje napięcie i różnorodność; utworzyć przyrostowy PRD pierwszej pętli runu,
2. `iterate` — mecz jest obiecujący, ale tempo, obrona albo talie wymagają ograniczonego PRD korekty,
3. `rethink` — seria posiadań jest powtarzalna albo obrona nie daje poczucia wpływu; zatrzymać projektowanie runu.

Nie planować mapy runu, nagród, metaprogresji ani szerokiej produkcji zawartości przed tą bramką.

## Ukończone milestone'y

Szczegółowy plan i walidacje PRD 000 znajdują się w `docs/archive/roadmap/prd-000.md`.

- 2026-08-14 — Milestone 0: fundament TypeScript + Phaser + Vite i build GitHub Pages (`done`).
- 2026-08-14 — Milestone 1: deterministyczny silnik pojedynczego posiadania (`done`).
- 2026-08-14 — Milestone 2: grywalne ofensywne posiadanie 3 na 3 (`done`).
- 2026-08-14 — Milestone 3: E2E, walidacja PRD 000 i bramka `proceed` (`done`).
- 2026-08-14 — Milestone 4: deterministyczny szkielet meczu i talii (`done`).
- 2026-08-14 — Milestone 5: aktywna obrona i pierwszy przeciwnik (`done`).
- 2026-08-14 — Milestone 6: grywalny pełny mecz end-to-end (`done`).
- 2026-08-14 — Milestone 7: walidacja pełnego meczu i bramka PRD 001 `proceed` (`done`).
