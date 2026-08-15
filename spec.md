# Specyfikacja HOOP-RUN

## Status i źródła

- Status: zweryfikowane zakresy PRD 000 i PRD 001 oraz zaplanowany zakres PRD 002.
- Gwiazda północna produktu: `docs/product-vision.md`.
- Źródła wymagań: `prd/000-initial-prd.md`, `prd/001-full-match.md` i `prd/002-first-run-loop.md`.
- Data utworzenia: 2026-08-14.
- Ostatnia aktualizacja: 2026-08-15.
- Zakres obowiązywania: fundament produktu, zweryfikowany pełny mecz 3 na 3 oraz zaplanowany pierwszy trzy-meczowy run.
- Walidacja zakresu: `docs/validation/prd-000-validation.md` i `docs/validation/prd-001-validation.md`; obie bramki zakończone wynikiem `proceed`.

## Cel produktu

HOOP-RUN jest taktycznym roguelite deckbuilderem o koszykówce 3 na 3. Gracz buduje akcje z kart reprezentujących rzeczywiste decyzje koszykarskie, odczytuje zamiary obrony i tworzy pozycję rzutową. Wynik meczu i liczba posiadań zastępują punkty życia, a zegar akcji zastępuje abstrakcyjną energię.

Docelowo jeden run prowadzi drużynę uliczną przez mecze, nagrody, rozwidlenia trasy, trening, rekrutację, elity i bossów. Każdy build powinien zmieniać sposób gry w koszykówkę, a nie tylko zwiększać wartości liczbowe.

## Aktualny zakres produktu

Zaimplementowana i zweryfikowana baza obejmuje jedno ofensywne posiadanie trwające około 30–60 sekund:

1. prezentacja półboiska, ustawienia 3 na 3, piłki i zamiaru obrony,
2. rozpoczęcie z pięcioma kartami i ograniczonym zegarem akcji,
3. zagrywanie legalnych kart `Pass`, `Screen`, `Drive`, `Kick Out` i `Shot`,
4. deterministyczna reakcja jednego profilu obrony,
5. budowanie `Advantage` i jakości rzutu,
6. rozstrzygnięcie trafienia albo pudła,
7. podsumowanie przyczyn wyniku i reset z tym samym seedem.

Potwierdzona hipoteza PRD 000:

> Sekwencja kart zależna od stanu boiska i zamiaru obrony tworzy czytelne oraz satysfakcjonujące posiadanie, które zachęca do sprawdzenia innej kolejności decyzji.

Ukończony zakres PRD 001 rozszerza tę bazę do jednego kompletnego meczu 3 na 3: wynik `0:0`, ściśle naprzemienne posiadania, aktywny atak i uproszczona aktywna obrona, osobne talie obu ról oraz zwycięstwo do 11 punktów z przewagą 2 i limitem 15. Szczegółowy kontrakt znajduje się w `docs/spec/full-match.md`.

Główna hipoteza PRD 001:

> Seria naprzemiennych posiadań ofensywnych i defensywnych, połączona rzeczywistym wynikiem, tworzy napięty mecz trwający około 8–12 minut bez popadania w powtarzalność.

Bramka PRD 001 ma wynik `proceed`: zewnętrzny pierwszy mecz trwał 10 minut, zakończył się 8:11, a tester rozumiał decyzje po pisemnym objaśnieniu zasad i chciał rewanżu.

Zaplanowany zakres PRD 002 dodaje pierwszy zamknięty run: trzy mecze z `Fundamentals`, `Perimeter Crew` i `Paint Kings`, obowiązkowy wybór jednej z trzech kart po pierwszych dwóch zwycięstwach, cztery nowe karty, krótki onboarding oraz jeden ręczny lokalny checkpoint między meczami. Szczegółowy kontrakt znajduje się w `docs/spec/first-run-loop.md`.

Główna hipoteza PRD 002:

> Pętla `mecz → wybór jednej z trzech kart → trudniejszy mecz` sprawia, że gracz świadomie rozwija dwie talie, dostosowuje decyzje do kolejnych przeciwników i chce rozpocząć następny run z innym wyborem nagród.

## Poza aktualnym zakresem

- zbiórki, kontry i tryb `Transition`,
- mapa runu, rozgałęzienia, sklep, waluta, rzadkość i ulepszanie kart,
- trenerzy, sprzęt, draft, wybór drużyny i metaprogresja,
- przeciwnicy i karty poza minimum PRD 002, elity, wielu bossów i finalny balans,
- faule, rzuty wolne, zmęczenie, kontuzje i zmiany składu,
- zapis aktywnego meczu, wiele slotów, chmura, backend, konta, rankingi i multiplayer,
- finalne sprite'y, rozbudowane animacje, audio oraz osobna optymalizacja mobilna.

Rozszerzenie któregokolwiek z tych obszarów wymaga kolejnego PRD albo jawnej aktualizacji zakresu.

## Zasady projektowe

- Karta musi zależeć od co najmniej jednego elementu koszykarskiego: posiadacza piłki, strefy, krycia, czasu, zamiaru obrony albo poprzedniej akcji.
- Przygotowany rzut musi być obserwowalnie lepszy od natychmiastowego rzutu bez przygotowania.
- Gracz powinien mieć co najmniej dwie sensowne ścieżki przez testowe posiadanie.
- Stan i przyczyna jego zmiany muszą być czytelne bez znajomości zaawansowanej terminologii koszykarskiej.
- Pierwszy prototyp optymalizuje szybkość iteracji i ocenę decyzji, nie oprawę.

## Model domenowy pierwszego posiadania

### Stan posiadania

Stan jest typowany, serializowalny i niezależny od Phasera. Zawiera co najmniej:

- `seed` i stan generatora losowego,
- fazę posiadania,
- pozostały czas akcji,
- sześciu uczestników i ich stronę,
- strefę każdego uczestnika,
- identyfikator posiadacza piłki,
- przypisania obrońców albo równoważną relację krycia,
- aktywny zamiar obrony,
- `Advantage` i jawne modyfikatory jakości rzutu,
- rękę, talię testową i historię zagranych kart,
- rezultat końcowy oraz listę zdarzeń domenowych.

Dozwolone fazy pierwszego prototypu:

```text
setup → playerTurn → resolvingShot → completed
                   ↘ clockExpired → completed
```

Po fazie `completed` dozwolony jest tylko reset posiadania.

### Minimalny model stref

Pierwszy prototyp używa czterech logicznych stref:

- `leftPerimeter`,
- `topPerimeter`,
- `rightPerimeter`,
- `paint`.

Model jest decyzją prototypową, nie finalną topologią boiska. Musi umożliwiać odróżnienie wejścia pod kosz, odegrania na obwód i położenia trzech zawodników. Zmiana topologii po playteście nie może wymagać zmiany kontraktu renderera z regułami gry.

### Akcje i wyniki

Warstwa aplikacyjna przekazuje do silnika typowaną komendę opisującą kartę, wykonującego i wymagany cel. Silnik zwraca wynik zawierający:

- nowy stan utworzony bez mutacji stanu wejściowego,
- informację o legalności,
- kod i tekstowy powód odrzucenia dla nielegalnej akcji,
- listę zdarzeń domenowych dla prezentacji,
- zmianę zegara, `Advantage` i jakości rzutu.

Nielegalna akcja nie zmienia stanu ani stanu generatora losowego.

### Karty pierwszego prototypu

Mechaniki są zaimplementowane w silniku, a definicje kart pozostają danymi. Minimalny zestaw zachowań:

- `Pass`: wymaga posiadacza piłki i innego zawodnika ataku; przenosi piłkę.
- `Screen`: wymaga odpowiedniego wykonującego i celu; tworzy możliwość przewagi przeciw wskazanej reakcji obrony.
- `Drive`: wymaga piłki na obwodzie; przesuwa posiadacza do `paint` i uruchamia reakcję obrony.
- `Kick Out`: wymaga piłki w `paint` i celu na obwodzie; przenosi piłkę oraz może utworzyć otwartą pozycję po pomocy obrony.
- `Shot`: wymaga posiadacza piłki i kończy posiadanie po wyliczeniu jakości oraz rozstrzygnięciu rzutu.

Domyślny scenariusz rozpoczyna się ze stałą pięciokartową ręką obejmującą wszystkie powyższe mechaniki. Seed nadal kontroluje rozstrzygnięcie rzutu i pozwala odtworzyć cały przebieg. Losowe dobieranie talii pozostaje poza zakresem, aby nie mieszać testu decyzji z testem dostępności kart.

### Zegar akcji

- Każda definicja karty ma dodatni całkowity koszt czasu.
- Legalna karta odejmuje koszt przed przejściem do następnego stabilnego stanu.
- Karty droższej niż pozostały czas nie można zagrać.
- Osiągnięcie zera bez rozpoczętego legalnego rzutu kończy posiadanie wynikiem `clockExpired`.
- Konkretne koszty są parametrami prototypu i mogą być zmieniane bez modyfikacji mechanik.

### `Advantage` i jakość rzutu

`Advantage` jest jawną, ograniczoną liczbowo wartością opisującą przewagę nad obroną. Pierwszy model używa zakresu `0–3`; jest to parametr prototypu, a nie finalny balans.

Jeżeli `Screen` pozwoli pokonać presję, a ujawniona intencja nie wysyła pomocy do `paint`, następujący `Drive` tworzy otwarte wykończenie. Gdy pomoc zostaje wysłana, nagrodą pozostaje otwarty `Kick Out`; jedna sekwencja nie może otrzymać obu premii naraz.

Każda zmiana `Advantage` generuje zdarzenie zawierające źródło i wartość zmiany. Jakość rzutu jest obliczana z listy nazwanych modyfikatorów, co najmniej:

- bazowej umiejętności strzelca,
- strefy,
- `Advantage`,
- otwartej albo krytej pozycji,
- sposobu otrzymania piłki, jeśli wynika z sekwencji.

Silnik przechowuje wartość liczbową potrzebną do deterministycznego rozstrzygnięcia. Interfejs prototypu pokazuje kategorię `Bad`, `Contested`, `Decent`, `Open` albo `Perfect`, dokładny procent trafienia oraz listę przyczyn. Progi kategorii są danymi konfiguracyjnymi.

### Obrona

Pierwszy prototyp zawiera jeden stały profil obrony z czytelnie ujawnionymi intencjami. Profil może łączyć presję na piłce, ochronę `paint` i pomoc po `Drive`, ale każda reakcja musi:

- wynikać z intencji widocznej przed akcją,
- być deterministyczna,
- generować zdarzenie wyjaśniające skutek,
- umożliwiać co najmniej jedną kontrę poprzez właściwą sekwencję kart.

Obrona nie posiada talii i nie wykonuje osobnej tury.

### Rozstrzygnięcie i reset

`Shot` oblicza jakość, pobiera jedną wartość z seedowanego RNG i zapisuje `made` albo `missed` wraz z pełnym rozkładem modyfikatorów. Ten sam stan początkowy, seed i sekwencja komend muszą dawać identyczny stan końcowy.

Reset tworzy stan początkowy z wybranym seedem. Nie wymaga przeładowania strony.

## Model domenowy pełnego meczu

### Agregat meczu

`MatchState` jest jedynym źródłem prawdy o pełnym meczu. Jest typowany, serializowalny i zawiera co najmniej:

- seed oraz jeden kanoniczny stan RNG,
- wynik gracza i przeciwnika,
- fazę meczu, numer posiadania, drużynę atakującą i aktualną rolę gracza,
- niezależne stany talii ofensywnej i defensywnej,
- opcjonalne aktywne posiadanie oznaczone rodzajem `playerOffense` albo `playerDefense`,
- historię rozstrzygnięć i podstawowe statystyki obu drużyn,
- końcowy rezultat zwycięstwa albo porażki.

Fazy meczu:

```text
activePossession → possessionSummary → activePossession
                                      ↘ completed
```

Przejście z podsumowania następuje wyłącznie po komendzie `Dalej`. Po `completed` dozwolony jest rewanż z tym samym seedem albo utworzenie nowego meczu.

### Wynik i kolejność

- Gracz rozpoczyna prototyp w ataku, a każde zakończone posiadanie przełącza stronę dokładnie raz.
- Trafienie z `paint` daje 1 punkt, a trafienie z każdej obecnej strefy obwodowej 2 punkty.
- Pudło, strata i koniec czasu dają 0 punktów i kończą posiadanie.
- Wynik co najmniej 11 kończy mecz tylko przy przewadze co najmniej 2; osiągnięcie 15 kończy mecz niezależnie od przewagi.
- Posiadanie kończy się przed zbiórką albo kontrą; nowe posiadanie zaczyna się z ustawionego boiska i zerowej przewagi.

### Talie meczowe

Każda rola ma odrębny `DeckState` ze stosem dobierania, ręką i stosem odrzuconych. Na początku odpowiedniego posiadania gra dobiera do pięciu kart. Po rozstrzygnięciu zarówno karty zagrane, jak i niewykorzystane trafiają na właściwy stos odrzuconych. Brakujące karty są uzupełniane po deterministycznym przetasowaniu stosu odrzuconych.

Agregat meczu jest właścicielem cyklu obu talii. Aktywne posiadanie otrzymuje wyłącznie rękę potrzebną do bieżącej roli, a przy zamknięciu zwraca wynik użycia kart. Dokładny rozmiar talii i liczba kopii pozostają parametrami zawartości.

### Aktywna obrona

`DefensePossessionState` jest osobnym, prostszym reducerem. Przechowuje archetyp planu przeciwnika, bieżący krok i ujawnioną akcję, zegar przeciwnika, ustawienie, krycie, przewagę, rękę defensywną, historię oraz wynik.

Pętla defensywna ma stałą kolejność:

```text
ujawniona akcja przeciwnika
  → jedna legalna odpowiedź gracza
  → rozstrzygnięcie i wyjaśnialne zdarzenia
  → kolejna akcja albo koniec posiadania
```

Pierwszy zestaw mechanik obejmuje `Pressure`, `Switch`, `Go Under`, `Help Defense` i `Double Team`. Jedna drużyna przeciwnika udostępnia co najmniej trzy rozpoznawalne plany. Karty, plany, kroki i ich modyfikatory są danymi opartymi na współdzielonych mechanikach, a nie osobnymi ścieżkami kodu.

### Deterministyczność meczu

Mecz ma dokładnie jeden logiczny strumień losowości. Agregat przekazuje aktualny stan RNG do tasowania, wyboru planu i rozstrzygnięcia rzutu, a następnie zapisuje zwrócony stan. Aktywne posiadanie może czasowo przechowywać ten kursor, lecz nie może istnieć drugi rozbieżny stan RNG. Ten sam seed i identyczna sekwencja decyzji muszą odtworzyć ręce, plany, rozstrzygnięcia, wynik i statystyki.

## Model domenowy pierwszej pętli runu

Szczegółowy kontrakt znajduje się w `docs/spec/first-run-loop.md`.

`RunState` składa istniejący agregat meczu i jest jedynym źródłem prawdy o seedzie oraz RNG runu, etapie, obu składach talii, aktywnym meczu, ofercie, nagrodach, wynikach i rezultacie końcowym. Fazy rozróżniają aktywny mecz, wybór nagrody, przerwę przed następnym meczem oraz sukces albo porażkę.

Run prowadzi liniowo przez dokładnie trzy profile. Porażka kończy run, pierwsze dwa zwycięstwa generują po jednej deterministycznej ofercie, a trzecie zwycięstwo kończy run bez nagrody. Oferta jest przechowywana w stanie i zawiera co najmniej jedną kartę obu ról. Wybrana karta zostaje dopisana do właściwej talii na resztę runu; nowy run odtwarza talie startowe.

Wersjonowany checkpoint jest dozwolony wyłącznie po wyborze nagrody, przed następnym meczem. Czysty kodek waliduje dane, `application` definiuje port jednego slotu, a `platform` implementuje go w `localStorage`. Czas runu pochodzi z wstrzykniętego zegara aplikacyjnego i nie wpływa na gameplay ani RNG; sposób liczenia przerwy po zapisaniu pozostaje TODO przed Milestone 11.

## Architektura i przepływ danych

Granice systemu:

1. `core` — czyste typy, agregaty runu i meczu, oba reducery posiadania, cykle talii, nagrody, checkpoint, reguły kart, punktacja, walidacja, jakość rzutu i RNG.
2. `content` — definicje kart, talii, zawodników, ofert, profili przeciwników, intencji, planów, progów i scenariuszy testowych.
3. `application` — `RunSession`, składana `MatchSession`, port checkpointu i zegara, dispatch komend, reset lub wznowienie oraz publikacja modelu widoku.
4. `presentation` — sceny Phasera, plansza, tokeny, karty, teksty, animacje i wejście.
5. `platform` — konfiguracja Vite, ścieżka GitHub Pages, adapter `localStorage` i zegar przeglądarkowy.

Przepływ:

```text
wejście gracza
  → komenda aplikacyjna
  → walidacja i redukcja stanu w core
  → nowy stan + zdarzenia domenowe
  → prezentacja i krótka informacja o przyczynie
```

Phaser nie importuje niejawnych mutowalnych singletonów domenowych. `core` nie importuje Phasera, DOM ani API przeglądarki.

Istniejący reducer ofensywnego posiadania pozostaje niezależnym elementem składanym przez agregat meczu, a agregat meczu przez agregat runu. Reguły wyniku, faz, talii, nagród, przeciwników i zwycięstwa nie mogą zostać przeniesione do sesji aplikacyjnej ani sceny Phasera.

## Decyzje techniczne

### Stos przeglądarkowy

- Decyzja: TypeScript `strict`, Phaser i Vite, zarządzane przez npm z wersjonowanym `package-lock.json`.
- Uzasadnienie: stos wspiera grę 2D, szybkie iteracje i statyczny deployment.
- Konsekwencje: repozytorium definiuje skrypty `lint`, `typecheck`, `test`, `build` i docelowo `test:e2e`.
- Dotyczy: PRD 000–002, wszystkie milestone'y.

### Testy

- Decyzja: Vitest dla logiki i Playwright dla krytycznego przepływu przeglądarkowego.
- Uzasadnienie: reguły wymagają szybkich deterministycznych testów, a UI rzeczywistego smoke testu.
- Konsekwencje: testy domenowe nie uruchamiają Phasera; `test:e2e` uruchamia build albo kontrolowany serwer preview.
- Decyzja: parametr `e2e=1` aktywuje wyłącznie odczytowy, serializowany snapshot modelu widoku; test nadal wykonuje akcje przez prawdziwe kliknięcia w canvas.
- Konsekwencje: most nie jest aktywny w zwykłym uruchomieniu i nie umożliwia zmiany stanu ani omijania reguł.
- Dotyczy: PRD 000–002, milestone'y 1–12; snapshot może zostać rozszerzony o stan runu bez dodawania komend testowych.

### Dystrybucja statyczna

- Decyzja: pierwszy cel publikacji to GitHub Pages pod `/HOOP-RUN/`, bez backendu.
- Uzasadnienie: prototyp ma być dostępny bez instalacji i serwera aplikacyjnego.
- Konsekwencje: ścieżki zasobów i build są testowane z niekorzeniową bazą; push do `main` uruchamia wdrożenie dopiero po pełnej walidacji i przygotowaniu artefaktu Pages. Zgoda na automatyczne wdrożenie nie oznacza zgody na wykonywanie przyszłych pushów.
- Dotyczy: PRD 000–002, milestone'y 0, 3, 7 i 12.

### Deterministyczny silnik zasad

- Decyzja: RNG jest wstrzykiwane, stan serializowalny, a redukcja stanu nie mutuje wejścia.
- Uzasadnienie: odtwarzanie błędów, stabilne testy i przyszłe symulacje balansu.
- Konsekwencje: `Math.random()` jest niedozwolone w logice domenowej; seed i sekwencja komend wystarczają do reprodukcji.
- Dotyczy: wszystkie mechaniki rozgrywki.

### Zawartość pełnego meczu

- Decyzja: talie, karty defensywne, intencje i plany przeciwnika są typowanymi danymi składanymi ze współdzielonych mechanik.
- Uzasadnienie: prototyp wymaga szybkiego strojenia kompromisów bez mnożenia wyjątków w reducerach.
- Konsekwencje: dokładne liczby i kopie mogą się zmieniać w ramach balansu, ale kontrakty legalności, zdarzeń i deterministyczności pozostają stabilne.
- Dotyczy: PRD 001, milestone'y 4–7.

### Trwałość pierwszego runu

- Decyzja: checkpoint ma jeden wersjonowany format domenowy; dostęp do jednego slotu `localStorage` odbywa się przez port warstwy aplikacyjnej i adapter platformowy.
- Uzasadnienie: run musi działać statycznie na GitHub Pages, zachować testowalność bez przeglądarki i bezpiecznie odrzucać niezgodne dane.
- Konsekwencje: `core` nie importuje Web Storage ani DOM; zapis jest dostępny tylko między meczami, a nieobsługiwana wersja nie jest częściowo odtwarzana.
- Dotyczy: PRD 002, Milestone 11.

### Pomiar czasu runu

- Decyzja techniczna: czas pochodzi z wstrzykniętego zegara i jest rejestrowany przy kontrolowanych granicach sesji; reguły nie odczytują czasu bezpośrednio.
- Uzasadnienie: miara 25–35 minut ma opisywać rozgrywkę, a czas nie może wpływać na deterministyczność zasad.
- Konsekwencje: `core` nie wywołuje `Date.now()` i nie używa czasu jako źródła losowości; wybór między aktywnym czasem a pełnym czasem ściennym pozostaje TODO przed Milestone 11.
- Dotyczy: PRD 002, milestone'y 10–12.

## Dostępność i informacja zwrotna

- Kluczowy stan nie może być kodowany wyłącznie kolorem.
- Wynik, cel meczu, rola `ATAK` albo `OBRONA`, plan przeciwnika i bieżąca akcja mają jawne etykiety tekstowe.
- Posiadacz piłki, aktywny wykonujący, legalne cele i intencja obrony mają tekstowy albo ikoniczny odpowiednik.
- Nielegalna karta pokazuje konkretny powód bez zmiany stanu.
- Zdarzenia `Advantage`, reakcji obrony i jakości rzutu są przedstawiane krótkimi komunikatami przyczynowymi.
- Przed wyborem karta pokazuje przewidywany efekt liczbowy dla aktualnego stanu: zmianę `Advantage`, wpływ na szansę rzutu w punktach procentowych, szansę straty i warunkowe odsłonięcie zawodnika, jeśli dotyczą danej akcji.
- Karta `Shot` pokazuje aktualną szansę trafienia, kategorię jakości i wartość punktową; interfejs wyjaśnia, że liczba jakości jest procentem trafienia, a `Advantage +1` daje `+6 pp`.
- Podsumowanie posiadania zatrzymuje przepływ, pokazuje zmianę wyniku i następną rolę przed udostępnieniem `Dalej`.
- Ekran runu pokazuje etap, nazwę i opis przeciwnika; oferta pokazuje rolę, działanie i kompromis każdej karty przed wyborem.
- Start jednoznacznie rozróżnia nowy run, kontynuację i `Jak grać`; błędy checkpointu nie blokują rozpoczęcia od nowa.
- Podstawowe sterowanie działa myszą; pełna obsługa klawiatury pozostaje poza PRD 002, chyba że wynika bezpośrednio ze standardowych elementów HTML.

## Jakość i kryteria ukończenia

- Każdy milestone ma mierzalne kryteria, testy, build oraz jawny wymóg lub brak wymogu playtestu.
- Reguły `Pass`, `Screen`, `Drive`, `Kick Out`, `Shot`, zegara, legalności, obrony i RNG mają testy przypadków podstawowych oraz brzegowych.
- Reguły punktacji, zwycięstwa, przełączania ról, obu talii, aktywnej obrony, planów przeciwnika i wspólnego RNG mają deterministyczne testy bez Phasera.
- Grywalny milestone obejmuje playtest podstawowej sekwencji, alternatywnej ścieżki i nielegalnej akcji.
- Walidacja PRD 001 obejmuje pełny wygrany i przegrany mecz, rewanż, trzy plany przeciwnika, dwa viewporty oraz co najmniej jeden test z osobą nieznającą projektu.
- Reguły runu, ofert, nowych kart, profili przeciwników i checkpointu mają deterministyczne testy bez Phasera.
- Walidacja PRD 002 obejmuje pełny sukces, porażki etapów, obie nagrody, checkpoint, dwa viewporty i test osoby nieznającej nowych nagród ani przeciwników.
- Build produkcyjny działa z bazą `/HOOP-RUN/` bez brakujących zasobów.
- Problemy blokujące z niezależnego review muszą zostać rozwiązane przed oznaczeniem większego milestone'u jako `done`.

## TODO i bramki decyzji

Poniższe decyzje i pytania pozostają częścią kontrolowanego planu:

- Przyjęto w Milestone 4: startowe talie mają po 10 kart, po dwie kopie każdej mechaniki, a deterministyczne dobieranie gwarantuje minimalną legalną ścieżkę ukończenia posiadania.
- Przyjęto do playtestu prototypową macierz efektów pięciu mechanik defensywnych; wartości pozostają balansem w danych.
- Przyjęto plany `Pick & Roll`, `Drive & Kick`, `Quick Three` oraz trzy intencje defensywne pierwszego przeciwnika.
- Przyjęto po pierwszym pełnym playteście: karty pokazują dokładny przewidywany efekt liczbowy dla bieżącego stanu, a `Shot` także aktualną kategorię i procent trafienia.
- Przyjęto po audycie balansu Milestone 7: `Screen → Drive` bez pomocy tworzy otwarte wykończenie, `Switch` daje `5 pp` contestu na zasłonie, a `Help Defense` `10 pp` contestu na wejściu; są to strojalne wartości prototypu.
- Przyjęto w Milestone 7: podsumowanie pokazuje posiadania, trafienia, pudła, straty i końce czasu; seedy 2 i 42 zabezpieczają automatyczne ścieżki zwycięstwa i porażki, a audyt 100 seedów mierzy balans strategii.
- Przyjęto w Milestone 7: pierwszy przeciwnik nie zmienia planu na podstawie wyniku i nie otrzymuje ukrytej wiedzy ani bonusu; adaptację do wyniku można rozważyć dopiero w osobnym zakresie zawartości AI.
- TODO po playteście stref: zatwierdzić albo zmienić topologię boiska.
- Przyjęto dla prototypu: informacja o rzucie pokazuje jednocześnie kategorię i procent; dalsze uproszczenie zależy od testu nowego gracza.
- Przyjęto dla PRD 002: run rozpoczyna obecna drużyna i obecne talie; kapitan, trener, archetyp i draft pozostają poza zakresem.
- Przyjęto przed Milestone 9: `Backdoor Cut` kosztuje 2 sekundy i otwiera cuttera w paint wyłącznie przeciw agresywnej presji bez pomocy; `Step Back` kosztuje 3 sekundy i daje niekumulujące `+12 pp` do najbliższego rzutu tego wykonującego.
- Przyjęto przed Milestone 9: `Hedge` kosztuje łącznie 3 sekundy, daje `-2 Opponent Advantage` i `+6 contest` na zasłonie kosztem odsłonięcia screenera; `Close Out` kosztuje 2 sekundy i daje `+12 contest` na czysty rzut obwodowy albo tylko `+4 contest` oraz `+1 Opponent Advantage`, gdy atak ma już przewagę.
- Przyjęto przed Milestone 9: nagroda należy do pierwszego cyklu właściwej talii następnego meczu i jest dobierana przed pierwszym przetasowaniem, jeżeli cykl zostanie zużyty; nie jest przypinana do pierwszej ręki ani wyniku.
- Przyjęto przed Milestone 9: profile używają wyłącznie istniejących planów, akcji i intencji. `Fundamentals` ma wagi `1/1/1`; `Perimeter Crew` preferuje `Quick Three` i `Deny Perimeter` wagą 3; `Paint Kings` preferuje `Pick & Roll` i `Protect Paint` wagą 3; pozostałe wagi wynoszą 1.
- TODO przed Milestone 11: zatwierdzić finalny schemat `RunCheckpointV1`, klucz storage i znaczenie aktywnego czasu.
- TODO przed zbiórkami: ustalić granicę posiadania oraz przejście do `Transition`.
- TODO przed metaprogresją: zdefiniować odblokowania bez trwałej przewagi statystycznej.

## Zasady ewolucji

- `spec.md` pozostaje indeksem aktualnej prawdy. Rozbudowane reguły przenoś do `docs/spec/`, gdy dokument zbliża się do limitu.
- Zmiana zachowania aktualizuje specyfikację i roadmapę; nowe funkcje poza PRD 002 wymagają osobnego zakresu.
- README zmieniaj tylko przy zmianie uruchamiania, konfiguracji lub użycia.
- Refaktory wykonuj w zakresie bieżącego milestone'u albo planuj oddzielnie.
