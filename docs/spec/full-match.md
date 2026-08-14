# Pełny mecz 3 na 3

## Status

- Status: zaplanowane, jeszcze niezaimplementowane.
- Źródło: `prd/001-full-match.md`.
- Plan realizacji: Milestone'y 4–7 w `ROADMAP.md`.
- Zależność: zweryfikowany reducer ofensywnego posiadania z PRD 000.

Ten dokument rozwija kontrakt domenowy pełnego meczu. `spec.md` pozostaje indeksem aktualnej prawdy, a PRD opisuje intencję i miary produktu. Nie należy interpretować poniższych nazw typów jako obowiązku zachowania konkretnego układu plików.

## Niezmienne reguły meczu

- Mecz zaczyna się od `0:0`, a gracz rozpoczyna w ataku.
- Posiadania są ściśle naprzemienne niezależnie od trafienia, pudła, straty albo końca czasu.
- Trafienie z `paint` daje 1 punkt, a trafienie z obecnej strefy obwodowej 2 punkty.
- Drużyna wygrywa po zdobyciu co najmniej 11 punktów i przewagi co najmniej 2.
- Pierwsza drużyna, która osiągnie 15 punktów, wygrywa niezależnie od przewagi.
- Pudło, strata i koniec czasu dają 0 punktów i kończą posiadanie.
- Nie ma zbiórek, kontr, fauli ani przejścia do `Transition`.
- Każde posiadanie ma zatrzymane podsumowanie; kolejna akcja wymaga `Dalej`.

Referencyjne przypadki końca meczu:

| Wynik | Koniec meczu |
|---|---|
| `11:9` | tak |
| `11:10` | nie |
| `12:10` | tak |
| `14:14` | nie |
| `15:14` | tak |

## Agregat `MatchState`

Stan pełnego meczu zawiera logicznie:

- `initialSeed` do rewanżu,
- jeden aktualny kursor RNG,
- wynik obu drużyn,
- fazę meczu,
- numer posiadania i stronę atakującą,
- wynikającą z niej rolę gracza `offense` albo `defense`,
- stan talii ofensywnej i defensywnej gracza,
- opcjonalne aktywne posiadanie jako oznaczoną sumę typów,
- ostatnie rozstrzygnięcie wymagane przez podsumowanie,
- historię rezultatów i zagregowane statystyki,
- rezultat zakończonego meczu.

Stan nie przechowuje informacji pochodnych w kilku rozbieżnych formach. Rola gracza wynika ze strony atakującej, a zwycięzca z wyniku i reguły zakończenia.

## Fazy i przejścia

Dozwolone fazy:

```text
activePossession
  → possessionSummary
      → activePossession
      → completed
```

Reguły przejść:

1. Utworzenie meczu przygotowuje obie talie, dobiera rękę ofensywną i rozpoczyna ofensywne posiadanie gracza.
2. Aktywne posiadanie przyjmuje wyłącznie komendy właściwego typu.
3. Zakończenie posiadania zapisuje rezultat, punkty, historię, statystyki i zwrot kart, lecz nie rozpoczyna automatycznie kolejnego posiadania.
4. W `possessionSummary` wszystkie komendy gameplayowe są odrzucane; legalne jest `Dalej`.
5. `Dalej` przełącza stronę dokładnie raz i przygotowuje posiadanie drugiego typu albo przechodzi do `completed`, jeśli wynik kończy mecz.
6. W `completed` legalne są tylko rewanż z `initialSeed` i utworzenie nowego meczu.

Rozstrzygnięcie zwycięstwa jest wyliczane po zastosowaniu punktów, przed przygotowaniem kolejnego posiadania. Podsumowanie ostatniego posiadania może być częścią ekranu końcowego, ale nie wolno uruchomić następnego posiadania.

## Kontrakt rozstrzygnięcia posiadania

Wspólny rezultat obu reducerów zawiera co najmniej:

- typ `made`, `missed`, `turnover` albo `clockExpired`,
- stronę atakującą,
- strefę rzutu i liczbę punktów dla trafienia,
- końcową jakość rzutu i nazwane przyczyny, jeśli nastąpił rzut,
- istotne przyczyny straty albo końca czasu,
- użyte karty i końcową niewykorzystaną rękę,
- zwrócony kursor RNG,
- zdarzenia domenowe potrzebne prezentacji.

Agregat meczu sam nadaje punkty na podstawie typu rezultatu i strefy. Reducer posiadania nie modyfikuje bezpośrednio wyniku meczu.

## Cykl talii

`DeckState` ma oddzielne strefy `drawPile`, `hand` i `discardPile`. Talia ofensywna i defensywna są niezależnymi instancjami.

Początek posiadania:

1. Właściwa talia dobiera do pięciu kart.
2. Jeżeli stos dobierania nie wystarcza, stos odrzuconych jest tasowany wspólnym RNG meczu i staje się nowym stosem dobierania.
3. Dobieranie kończy się po osiągnięciu pięciu kart albo wyczerpaniu obu stosów.

Koniec posiadania:

1. Zagrane karty trafiają do właściwego stosu odrzuconych.
2. Wszystkie niewykorzystane karty z ręki trafiają do tego samego stosu.
3. Ręka jest pusta do czasu następnego posiadania tej roli.
4. Druga talia nie jest zmieniana.

Kolejność kart jest częścią serializowalnego stanu i dowodu deterministyczności. Prototypowe talie startowe mają po 10 kart: po dwie kopie każdej z pięciu mechanik właściwych dla roli. Wartość pozostaje parametrem zawartości, który może zostać skorygowany po playteście.

## Integracja ofensywy

- Istniejący `PossessionState` i jego reducer pozostają źródłem reguł `Pass`, `Screen`, `Drive`, `Kick Out`, `Shot`, legalności, zegara, `Advantage` i jakości rzutu.
- Agregat tworzy posiadanie z ręki talii meczowej zamiast zawsze używać stałej ręki scenariusza PRD 000.
- Każde nowe posiadanie zaczyna z ustawieniem startowym, pełnym zegarem i `Advantage` równym zero.
- Intencja defensywna przeciwnika jest wybierana deterministycznie z danych pierwszej drużyny.
- Scenariusz referencyjny PRD 000 pozostaje dostępny dla dotychczasowych testów i regresji.

## Reducer aktywnej obrony

`DefensePossessionState` przechowuje:

- wybrany plan przeciwnika i identyfikator aktualnego kroku,
- wyłącznie aktualnie ujawnioną akcję, wykonującego oraz istotny cel,
- zegar akcji przeciwnika,
- zawodników, strefy, posiadacza piłki i krycie,
- przewagę przeciwnika oraz nazwane modyfikatory,
- rękę defensywną i historię odpowiedzi,
- wynik końcowy i zdarzenia,
- aktualny kursor RNG przekazany przez mecz.

Jedna iteracja:

1. Reducer waliduje kartę, wykonującego i cel wobec ujawnionej akcji oraz stanu boiska.
2. Nielegalna odpowiedź zwraca stabilny powód i nie zmienia stanu ani RNG.
3. Legalna odpowiedź zużywa czas z zegara przeciwnika.
4. Mechanika odpowiedzi i krok planu wspólnie aktualizują krycie, ustawienie, przewagę, ryzyko straty albo jakość przyszłego rzutu.
5. Zdarzenia wyjaśniają koszt, korzyść i powstałe ryzyko.
6. Reducer rozstrzyga stratę, koniec czasu albo rzut; w przeciwnym razie ujawnia kolejny krok.

Przeciwnik nie zna przyszłej ręki, wyboru ani wyniku RNG gracza. Nie wolno zmienić planu po odpowiedzi, chyba że wcześniej ujawniona reguła planu jawnie przewiduje rozgałęzienie.

## Mechaniki defensywne

Prototyp zawiera pięć współdzielonych mechanik:

| Mechanika | Podstawowa korzyść | Jawne ryzyko |
|---|---|---|
| `Pressure` | zużywa czas i zwiększa presję na piłce | TODO w macierzy Milestone 5 |
| `Switch` | utrzymuje krycie po zasłonie | TODO w macierzy Milestone 5 |
| `Go Under` | ogranicza wejście i oszczędza zmianę krycia | przestrzeń do rzutu z obwodu |
| `Help Defense` | ogranicza wejście do `paint` | otwarty partner po odegraniu |
| `Double Team` | zwiększa szansę straty | wolny partner i ryzyko łatwego podania |

Tabela opisuje znaczenie produktu. Prototypowe koszty, progi i macierz interakcji są zapisane jako typowane dane zawartości i podlegają walidacji w pełnym meczu. Żadna karta nie może być bezwarunkowo najlepsza przeciw wszystkim planom.

## Plany przeciwnika

Pierwsza drużyna udostępnia co najmniej trzy rozpoznawalne plany. Planowane dane referencyjne to `Pick & Roll`, `Drive & Kick` i `Quick Three`; nazwy mogą zostać zastąpione równoważnymi przed ukończeniem Milestone 5.

Definicja planu zawiera:

- nazwę i krótki opis celu widoczny od początku posiadania,
- uporządkowane kroki albo jawne rozgałęzienia,
- aktualnie ujawnianą akcję, wykonującego i wymagany cel,
- modyfikatory bazowe, zegar i warunki przejścia,
- warunki rzutu, straty oraz końca planu.

Wybór planu i wszelkie dozwolone rozgałęzienia są deterministyczne. Wpływ aktualnego wyniku na wybór planu pozostaje TODO do walidacji przed końcem Milestone 7.

## RNG i reprodukcja

- Jeden logiczny kursor RNG jest przekazywany kolejno przez inicjalizację talii, tasowania, wybór planu, dozwolone rozgałęzienia i rzuty.
- Operacja, która nie wymaga losowości, nie przesuwa kursora.
- Nielegalna komenda nie przesuwa kursora.
- Aktywne posiadanie zwraca agregatowi zaktualizowany kursor przy każdym rozstrzygnięciu, które go używa.
- Rewanż odtwarza nowy stan z `initialSeed`; nie kopiuje końcowego układu talii.
- Test reprodukcji porównuje pełny stan domenowy, a nie tylko końcowy wynik.

## Warstwa aplikacyjna i prezentacja

`MatchSession` przyjmuje komendy UI, deleguje je do właściwego reducera i publikuje model widoku. Model widoku obejmuje co najmniej:

- wynik, cel, rolę, numer posiadania i zegar,
- stan planszy, rękę właściwej talii, legalnych wykonawców i cele,
- przewidywany liczbowy efekt każdej karty dla aktualnego stanu oraz konkretny powód blokady,
- aktualną szansę trafienia, kategorię i wartość punktową na karcie `Shot` oraz krótką legendę przeliczenia jakości,
- intencję obrony podczas ataku,
- plan i aktualną akcję przeciwnika podczas obrony,
- przyczynowe komunikaty po akcji,
- dane podsumowania posiadania albo meczu,
- dostępność `Dalej`, rewanżu i nowego meczu.

Phaser renderuje ten model i wysyła komendy. Nie oblicza punktów, legalności, odpowiedzi AI, przejść faz ani kolejności talii. Most E2E pozostaje tylko do odczytu i nie może wstrzykiwać rezultatu meczu.

## Walidacja i śledzenie wymagań

| Zakres | Milestone | Główny dowód |
|---|---|---|
| wynik, zwycięstwo, role, talie, RNG | 4 | deterministyczne testy Vitest i review core |
| aktywna obrona, trzy plany, pięć mechanik | 5 | testy headless i review kompromisów |
| pełny przepływ od `0:0` do wyniku | 6 | testy sesji, build i playtest w przeglądarce |
| wygrana, porażka, rewanż i hipoteza 8–12 minut | 7 | E2E, pełne playtesty i test nowego gracza |

Bramka PRD 001 może otrzymać wynik `proceed`, `iterate` albo `rethink`. Systemy runu nie są planowane przed tą decyzją.

## Otwarte decyzje

- Gwarancja użytecznej ręki dla przyjętych prototypowych talii 10-kartowych.
- Balans przyjętych kosztów i macierzy skutków kart defensywnych po pełnym playteście.
- Czy zakres przyjętej informacji predykcyjnej wymaga uproszczenia po teście nowego gracza.
- Wpływ wyniku na wybór planu AI.
- Zestaw statystyk podsumowania i referencyjnych seedów walidacyjnych.
- Przydatność obecnej topologii czterech stref w pełnym meczu.

Otwarte decyzje można stroić w granicach PRD 001. Jeżeli rozwiązanie wymaga zbiórek, kontr, dodatkowych drużyn, modyfikowania talii w trakcie meczu albo systemu runu, zakres musi wrócić do PRD.
