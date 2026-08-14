# PRD 000 — HOOP-RUN i pierwszy grywalny pionowy przekrój

- Status: gotowy do planowania, z jawnymi otwartymi pytaniami dla późniejszych zakresów.
- Data: 2026-08-14.
- Źródło: dotychczasowa rozmowa koncepcyjna oraz zaakceptowany fundament projektu.

## 1. Kontekst i problem

Koszykówka naturalnie zawiera krótkie sekwencje decyzji, role zawodników, spacing, tempo, ryzyko i synergie drużynowe, ale nie ma rozpoznawalnego roguelite deckbuildera, który wykorzystywałby te elementy jako główny system rozgrywki.

HOOP-RUN ma połączyć taktyczną koszykówkę 3 na 3 z budowaniem talii i runem roguelite. Gra nie ma być standardowym deckbuilderem z koszykarskimi nazwami ataków ani symulacją pokroju NBA 2K z losowymi perkami. Karty mają reprezentować rzeczywiste decyzje koszykarskie, a każdy run ma zmieniać sposób rozgrywania akcji, nie tylko zwiększać statystyki.

Roboczy opis produktu:

> Buduj akcję. Rozbij obronę. Każde posiadanie jest taktycznym puzzlem, a podczas runu tworzysz coraz bardziej niezwykły playbook.

## 2. Odbiorcy

Główni odbiorcy:

- gracze lubiący deckbuildery i roguelite'y, szczególnie gry o czytelnych intencjach przeciwnika i budowaniu synergii,
- gracze zainteresowani koszykówką, którzy oczekują taktycznych decyzji bez konieczności zręcznościowego sterowania zawodnikiem,
- gracze lubiący krótkie, powtarzalne sesje i odkrywanie odmiennych buildów.

Projekt nie zakłada, że gracz zna zaawansowaną terminologię koszykarską. Znaczenie pozycji, przewag i kart musi być możliwe do zrozumienia z interfejsu oraz informacji zwrotnej.

## 3. Wizja produktu

Gracz prowadzi drużynę ulicznej koszykówki przez turniej. Jeden run prowadzi od lokalnego boiska przez kolejne regiony lub dystrykty aż do finału.

Docelowa pętla runu:

1. Wybór kapitana, trenera albo archetypu startowego.
2. Mecze taktyczne 3 na 3.
3. Wybór nagrody, karty, treningu, zawodnika lub sprzętu.
4. Wybór dalszej trasy na mapie.
5. Spotkania normalne, elitarne, wydarzenia i bossowie zmieniający reguły meczu.
6. Rozwój talii, składu i synergii.
7. Finał runu albo porażka i powrót do lekkiej metaprogresji odblokowującej nowe możliwości.

Wizja pełnej gry wyznacza kierunek, ale nie jest zakresem pierwszego prototypu.

## 4. Cele

### Cele produktu

- Stworzyć nowy, rozpoznawalny rodzaj taktycznego deckbuildera oparty na koszykówce zamiast na walce i punktach życia.
- Sprawić, aby pozycje zawodników, posiadanie piłki, czas akcji i zamiary obrony miały znaczenie przy każdym zagraniu karty.
- Dawać satysfakcję z konstruowania sekwencji prowadzącej do dobrej pozycji rzutowej.
- Pozwalać budować jakościowo odmienne style gry, np. pick and roll, rzuty za trzy, izolacje, zespołowy ruch piłki, obronę lub kontry.
- Utrzymać krótkie mecze i runy odpowiednie dla struktury roguelite.

### Cel pierwszego pionowego przekroju

Zweryfikować najważniejszą hipotezę bez budowania pełnego meczu i runu:

> Czy ułożenie kilku kart koszykarskich w sekwencję, która reaguje na stan boiska i zamiar obrony, tworzy czytelne oraz satysfakcjonujące 30–60-sekundowe posiadanie?

## 5. Poza zakresem pierwszego pionowego przekroju

- kompletny mecz do 11, 15 lub 21 punktów,
- grywalna obrona i osobna talia defensywna,
- mapa runu, nagrody, draft, trening, sklep i wydarzenia,
- bossowie i wiele archetypów przeciwników,
- ofensywne zbiórki i przejście do kontry,
- trwały zapis progresji,
- konta, backend, cloud save, rankingi, daily challenge i multiplayer,
- finalny balans liczbowy,
- finalna oprawa graficzna, rozbudowane animacje, audio i efekty,
- urządzenia mobilne jako osobno zoptymalizowana platforma.

Elementy te pozostają częścią wizji produktu i mogą otrzymać osobne PRD po zweryfikowaniu podstawowego posiadania.

## 6. Fundament rozgrywki

### 6.1. Mecz i drużyny

- Rozgrywka przedstawia koszykówkę 3 na 3.
- Wynik meczu zastępuje klasyczne punkty życia.
- Docelowy mecz ma składać się z ograniczonej liczby kluczowych posiadań albo trwać do ustalonego wyniku.
- Pierwszy pionowy przekrój obejmuje wyłącznie jedno ofensywne posiadanie gracza.

### 6.2. Jedno posiadanie

- Posiadanie zaczyna się od ustawienia trzech zawodników ataku, trzech obrońców, piłki i zamiaru obrony.
- Gracz otrzymuje rękę kart i ograniczony czas akcji.
- Gracz zagrywa legalne karty kolejno, płacąc czasem z zegara akcji zamiast abstrakcyjną energią.
- Karty zmieniają stan boiska, właściciela piłki, pozycje, przewagę i jakość możliwego rzutu.
- Posiadanie kończy się rzutem, stratą albo wyczerpaniem czasu.
- Po zakończeniu gracz otrzymuje wyjaśnienie, jak sekwencja i obrona wpłynęły na rezultat.

### 6.3. Stan boiska

Na ekranie muszą być fizycznie widoczne:

- trzy postacie lub tokeny ataku,
- trzy postacie lub tokeny obrony,
- zawodnik posiadający piłkę,
- logiczne strefy boiska, co najmniej rozróżniające okolice kosza i obwód,
- krycie albo relacja atakujący–obrońca,
- stan `Advantage`, zegar akcji i aktualna jakość pozycji rzutowej.

Dokładna liczba i geometria stref pozostają decyzją planistyczną. Pierwszy prototyp może używać prostych tokenów i planszy taktycznej bez docelowych sprite'ów.

### 6.4. Karty i czas

Karty przedstawiają akcje koszykarskie, nie obrażenia. Podstawowy zestaw mechanik pierwszego prototypu obejmuje:

- `Pass` — przekazanie piłki innemu zawodnikowi,
- `Screen` — ustawienie zasłony tworzącej możliwość przewagi,
- `Drive` — wejście z piłką w kierunku kosza,
- `Kick Out` — podanie z pomalowanego do zawodnika na obwodzie,
- `Shot` — zakończenie sekwencji rzutem.

W docelowej grze zestaw może obejmować m.in. crossover, pick and roll, backdoor cut, pump fake, post up, lob, step back, corner three i eurostep.

Każda karta musi określać:

- wykonującego albo warunki wyboru wykonującego,
- koszt czasu,
- warunki legalności,
- zmianę stanu boiska,
- efekt zrozumiały przed zagraniem,
- zdarzenia potrzebne warstwie prezentacji.

Karty i zawodnicy docelowo powinny być w dużej mierze definiowane jako dane oparte na współdzielonych mechanikach, a nie jako osobna logika dla każdej karty.

### 6.5. `Advantage`

`Advantage` jest głównym uproszczonym opisem przewagi stworzonej nad obroną.

- Sekwencje zgodne ze stanem boiska mogą tworzyć lub zwiększać `Advantage`.
- Reakcje obrony mogą zmniejszać przewagę albo wymuszać inny kierunek akcji.
- `Advantage` wpływa na jakość rzutu lub legalność korzystnych kontynuacji.
- Interfejs musi pokazać źródło zmiany przewagi, nie tylko nową wartość.

Dokładna skala i sposób wygaszania `Advantage` wymagają późniejszego balansu.

### 6.6. Zamiary obrony

Przeciwnik pokazuje swój plan przed decyzją gracza, podobnie do telegraphowanych intencji w deckbuilderach.

Przykładowe intencje:

- presja na zawodniku z piłką,
- ochrona pomalowanego,
- odcięcie strzelca,
- przejście pod lub nad zasłoną,
- pomoc przy wejściu pod kosz.

W pierwszym pionowym przekroju obrona nie rozgrywa własnej ręki. Jeden prosty, czytelnie pokazany profil defensywny reaguje deterministycznie na akcje gracza.

### 6.7. Jakość i rozstrzygnięcie rzutu

Rzut nie może być oderwanym losowaniem bazowego procentu. Jego jakość wynika z całej wcześniejszej sekwencji.

Na rozstrzygnięcie mogą wpływać:

- bazowa umiejętność zawodnika,
- strefa rzutu,
- `Advantage`,
- status otwartej lub krytej pozycji,
- sposób otrzymania piłki,
- reakcja i odległość obrońcy,
- przyszłe statusy, zmęczenie i synergie.

Pierwszy prototyp musi pokazywać składniki wpływające na rzut. Losowanie wyniku ma być deterministyczne dla podanego seeda. Dokładny sposób prezentacji — procent albo kategoria jakości — pozostaje otwarty.

## 7. Przepływ gracza w pierwszym pionowym przekroju

1. Gracz uruchamia prototyp w przeglądarce.
2. Widzi pół boiska, ustawienie 3 na 3, piłkę, zegar i zamiar obrony.
3. Rozpoczyna posiadanie i dobiera pięć kart z małej, ustalonej talii testowej.
4. Wybiera legalną kartę i wymagany cel lub zawodnika.
5. Stan boiska oraz zegar aktualizują się, a interfejs wyjaśnia efekt i reakcję obrony.
6. Gracz buduje sekwencję, np. `Screen → Drive → Kick Out → Shot`.
7. Gra pokazuje wynikową jakość rzutu i jej składniki.
8. Rzut zostaje deterministycznie rozstrzygnięty jako trafiony albo niecelny.
9. Gra pokazuje krótkie podsumowanie posiadania i umożliwia jego ponowne uruchomienie, również z tym samym seedem.

## 8. Wymagania funkcjonalne pierwszego pionowego przekroju

### FR-001 — Uruchomienie

Gra uruchamia się bez instalatora w obsługiwanej przeglądarce desktopowej i nie wymaga backendu.

### FR-002 — Czytelny stan początkowy

Przed pierwszą decyzją widoczne są wszystkie postacie, położenie piłki, strefy, zegar akcji, ręka oraz zamiar obrony.

### FR-003 — Ręka kart

Gracz dobiera pięć kart z małej talii zawierającej podstawowe mechaniki podania, zasłony, wejścia, odegrania i rzutu.

### FR-004 — Legalność akcji

Gra pozwala zagrywać tylko akcje zgodne z aktualnym stanem. Niedozwolona karta pozostaje rozpoznawalna i wyjaśnia powód blokady.

### FR-005 — Koszt czasu

Zagranie karty odejmuje jej koszt od zegara akcji. Brak czasu kończy posiadanie nieudanym rezultatem.

### FR-006 — Aktualizacja boiska

Każda zagrana karta aktualizuje właściwe elementy stanu: piłkę, zawodników, krycie, `Advantage`, statusy i potencjalną jakość rzutu.

### FR-007 — Reakcja obrony

Obrona wykonuje zapowiedzianą reakcję zgodnie z czytelną, deterministyczną regułą.

### FR-008 — Rzut

Legalny `Shot` kończy posiadanie, pokazuje składniki jakości i rozstrzyga trafienie lub pudło przy użyciu seedowanej losowości.

### FR-009 — Podsumowanie

Po zakończeniu posiadania gracz widzi rezultat, końcową jakość rzutu i najważniejsze modyfikatory powstałe podczas sekwencji.

### FR-010 — Powtarzalność

Gracz może zresetować posiadanie. Ten sam seed i ta sama sekwencja decyzji dają ten sam rezultat.

## 9. Wymagania dotyczące sterowania i czytelności

- Podstawowa obsługa pierwszego prototypu działa myszą.
- Karta przed zagraniem pokazuje koszt, wykonującego, legalne cele i przewidywany podstawowy efekt.
- Stan nie może polegać wyłącznie na kolorze; kluczowe informacje wymagają również tekstu, ikony albo kształtu.
- Gracz musi odróżnić: aktualnego posiadacza piłki, aktywnego zawodnika, legalne cele, intencję obrony i możliwość zakończenia akcji rzutem.
- Informacja zwrotna po karcie ma wskazywać przyczynę zmiany, np. „zasłona pokonała presję: +1 Advantage”.
- Animacja nie może blokować odczytania nowego stanu ani wymuszać długiego oczekiwania podczas powtarzania prototypu.

## 10. Kryteria akceptacji pierwszego pionowego przekroju

1. Produkcyjny build uruchamia się lokalnie oraz pod bazową ścieżką zgodną z GitHub Pages.
2. Na ekranie widoczne jest ustawienie 3 na 3, piłka, zegar akcji, zamiar obrony i pięć kart.
3. Gracz może bez błędu przeprowadzić legalną sekwencję `Screen → Drive → Kick Out → Shot` albo równoważną sekwencję z dostępnej ręki.
4. Każda karta w sekwencji zmienia obserwowalny stan i odejmuje koszt czasu.
5. Co najmniej jedna akcja staje się legalna lub silniejsza dzięki wcześniejszej karcie, potwierdzając istnienie synergii sekwencyjnej.
6. Próba zagrania nielegalnej karty nie zmienia stanu i pokazuje zrozumiałą przyczynę.
7. Obrona pokazuje intencję i reaguje zgodnie z nią na co najmniej jeden typ akcji.
8. Jakość rzutu różni się pomiędzy nieprzygotowanym rzutem a rzutem po korzystnej sekwencji, a interfejs wyjaśnia różnicę.
9. Rzut kończy posiadanie wynikiem trafienie/pudło i czytelnym podsumowaniem.
10. Ten sam seed oraz identyczna sekwencja dają identyczny stan końcowy i wynik rzutu w teście automatycznym.
11. Czysta logika posiadania przechodzi testy bez uruchamiania Phasera.
12. Playtest w przeglądarce nie wykazuje blokujących błędów konsoli, brakujących zasobów ani ślepych uliczek w podstawowym przepływie.

## 11. Miary powodzenia hipotezy

Pierwszy pionowy przekrój jest obiecujący produktowo, jeśli podczas playtestu można potwierdzić, że:

- gracz rozumie najważniejszą intencję obrony przed zagraniem pierwszej karty,
- gracz potrafi wskazać, dlaczego przygotowany rzut jest lepszy od natychmiastowego,
- co najmniej dwie sensowne sekwencje prowadzą do różnych stanów lub jakości rzutu,
- decyzja nie sprowadza się zawsze do zagrania jedynej dostępnej legalnej karty,
- powtórzenie posiadania zachęca do wypróbowania innej kolejności kart.

PRD nie ustala jeszcze liczbowego progu badań z użytkownikami. Pierwsze testy mogą mieć charakter wewnętrzny i służyć wykryciu oczywistych problemów przed poszerzeniem zakresu.

## 12. Ograniczenia techniczne

- Język: TypeScript w trybie `strict`.
- Prezentacja: Phaser.
- Build: Vite.
- Package manager: npm z wersjonowanym `package-lock.json`.
- Testy logiki: Vitest.
- Docelowy smoke test przeglądarkowy: Playwright.
- Hosting pierwszych wersji: GitHub Pages pod ścieżką `/HOOP-RUN/`.
- Backend: brak w pierwszym zakresie.
- Reguły gry pozostają niezależne od Phasera i możliwe do przetestowania jako czyste operacje na stanie.
- Losowość jest wstrzykiwana i odtwarzalna dla seeda; logika domenowa nie wywołuje bezpośrednio `Math.random()`.
- Stan domenowy i definicje zawartości są typowane oraz możliwie serializowalne.

## 13. Ryzyka

### R-001 — Koszykarska fasada zamiast koszykarskich decyzji

Karty mogą działać jak zwykłe ataki i buffy z innymi nazwami. Ograniczenie ryzyka: każda podstawowa karta musi zależeć od właściciela piłki, pozycji, krycia, czasu albo wcześniejszej akcji.

### R-002 — Jedna oczywista kombinacja

Jeżeli korzystna sekwencja jest zawsze taka sama, posiadanie szybko stanie się automatyczne. Ograniczenie ryzyka: nawet mały prototyp powinien oferować co najmniej dwie sensowne ścieżki i obronę premiującą odczytanie intencji.

### R-003 — Nadmiar informacji

Pozycje, krycie, karta, czas, przewaga i jakość rzutu mogą przeciążyć ekran. Ograniczenie ryzyka: stopniowe ujawnianie szczegółów, proste tokeny i jednoznaczna informacja o zmianie stanu.

### R-004 — Losowość odbierana jako niesprawiedliwa

Pudło po dobrej sekwencji może być frustrujące. Ograniczenie ryzyka: wyjaśnienie modyfikatorów, silny wpływ przygotowania pozycji i deterministyczne odtwarzanie przebiegu.

### R-005 — Zbyt wczesne budowanie runu

Mapa, nagrody i duża liczba kart mogą ukryć słaby fundament posiadania. Ograniczenie ryzyka: nie rozpoczynać tych systemów przed zaliczeniem hipotezy pierwszego pionowego przekroju.

### R-006 — Sprzężenie logiki z Phaserem

Umieszczenie reguł w scenach utrudni testowanie i balans. Ograniczenie ryzyka: czysty silnik posiadania zwracający zdarzenia prezentacyjne.

## 14. Fakty ustalone

- Kierunek produktu to `Basketball × Slay the Spire`, a nie zręcznościowa symulacja meczu.
- Podstawowy format to koszykówka 3 na 3.
- Akcje są wykonywane kartami, a stan zawodników i piłki jest widoczny na boisku.
- Zegar akcji pełni rolę podstawowego kosztu zagrywania kart.
- Wynik i posiadania zastępują punkty życia.
- Obrona pokazuje zamiary przed decyzją gracza.
- `Advantage` i jakość rzutu opisują efekt budowania akcji.
- Pierwszy cel to pionowy przekrój jednego posiadania, nie kompletna gra.
- Gra działa w przeglądarce i ma być możliwa do publikacji przez GitHub Pages.
- Stos technologiczny to TypeScript, Phaser i Vite bez backendu w pierwszym zakresie.

## 15. Założenia do zweryfikowania

- Pięć kart na ręce zapewni wystarczający wybór bez przeciążenia interfejsu.
- Koszt wyrażony w sekundach będzie bardziej intuicyjny niż standardowa energia deckbuildera.
- Jeden jawny profil obrony wystarczy do przetestowania podstawowej pętli.
- Proste strefy i tokeny wystarczą, aby ocenić decyzje bez docelowej animacji.
- Kategoria jakości rzutu może być czytelniejsza niż eksponowanie dokładnego procentu.
- `Advantage` będzie wystarczająco pojemnym, ale zrozumiałym statusem dla pierwszych kombinacji.

## 16. Otwarte pytania

Pytania nie blokują przygotowania pierwszego pionowego przekroju, o ile plan zachowa wskazane założenia. Wymagają decyzji przed odpowiednim późniejszym zakresem:

1. Czy pełne mecze będą rozgrywane do 11/15/21 punktów, czy przez stałą liczbę posiadań?
2. Czy po pierwszym prototypie gracz ma aktywnie rozgrywać obronę z osobnej talii, czy obrona pozostanie systemem reakcji i wyborów między posiadaniami?
3. Jaka dokładnie liczba i topologia stref boiska najlepiej równoważy czytelność z taktyką?
4. Czy interfejs ma pokazywać dokładne prawdopodobieństwo rzutu, kategorię jakości, czy oba poziomy informacji?
5. Jak `Advantage` jest skalowane, przenoszone między akcjami i konsumowane przez rzut?
6. Czy pierwszym wyborem runu jest kapitan, trener, archetyp drużyny, czy kombinacja tych elementów?
7. Kiedy podczas runu gracz kompletuje pozostałych dwóch zawodników i jak talie zawodników łączą się w talię drużyny?
8. Czy ofensywna zbiórka przedłuża to samo posiadanie, a strata automatycznie tworzy tryb `Transition`?
9. Jak długa ma być docelowa animacja rozegranej sekwencji i które jej fragmenty gracz może pomijać?
10. Jaki zakres lekkiej metaprogresji odblokowuje możliwości bez trwałego zwiększania podstawowej siły drużyny?
