# Specyfikacja HOOP-RUN

## Status i źródła

- Status: aktualna specyfikacja pierwszego grywalnego pionowego przekroju.
- Źródło wymagań: `prd/000-initial-prd.md`.
- Data utworzenia: 2026-08-14.
- Ostatnia aktualizacja: 2026-08-14.
- Zakres obowiązywania: fundament produktu, architektura i reguły potrzebne do jednego ofensywnego posiadania.
- Walidacja zakresu: `docs/validation/prd-000-validation.md`; bramka PRD 000 zakończona wynikiem `proceed`.

## Cel produktu

HOOP-RUN jest taktycznym roguelite deckbuilderem o koszykówce 3 na 3. Gracz buduje akcje z kart reprezentujących rzeczywiste decyzje koszykarskie, odczytuje zamiary obrony i tworzy pozycję rzutową. Wynik meczu i liczba posiadań zastępują punkty życia, a zegar akcji zastępuje abstrakcyjną energię.

Docelowo jeden run prowadzi drużynę uliczną przez mecze, nagrody, rozwidlenia trasy, trening, rekrutację, elity i bossów. Każdy build powinien zmieniać sposób gry w koszykówkę, a nie tylko zwiększać wartości liczbowe.

## Aktualny zakres produktu

Pierwszy pionowy przekrój obejmuje jedno ofensywne posiadanie trwające około 30–60 sekund:

1. prezentacja półboiska, ustawienia 3 na 3, piłki i zamiaru obrony,
2. rozpoczęcie z pięcioma kartami i ograniczonym zegarem akcji,
3. zagrywanie legalnych kart `Pass`, `Screen`, `Drive`, `Kick Out` i `Shot`,
4. deterministyczna reakcja jednego profilu obrony,
5. budowanie `Advantage` i jakości rzutu,
6. rozstrzygnięcie trafienia albo pudła,
7. podsumowanie przyczyn wyniku i reset z tym samym seedem.

Hipoteza produktu:

> Sekwencja kart zależna od stanu boiska i zamiaru obrony tworzy czytelne oraz satysfakcjonujące posiadanie, które zachęca do sprawdzenia innej kolejności decyzji.

## Poza aktualnym zakresem

- pełny mecz i ostateczny warunek zwycięstwa,
- osobna talia i aktywna faza obrony gracza,
- zbiórki, kontry i tryb `Transition`,
- mapa runu, nagrody, trenerzy, sprzęt, draft i metaprogresja,
- wielu przeciwników, bossowie i finalny balans,
- zapis postępu, backend, konta, rankingi i multiplayer,
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

Każda zmiana `Advantage` generuje zdarzenie zawierające źródło i wartość zmiany. Jakość rzutu jest obliczana z listy nazwanych modyfikatorów, co najmniej:

- bazowej umiejętności strzelca,
- strefy,
- `Advantage`,
- otwartej albo krytej pozycji,
- sposobu otrzymania piłki, jeśli wynika z sekwencji.

Silnik przechowuje wartość liczbową potrzebną do deterministycznego rozstrzygnięcia. Interfejs pierwszego prototypu pokazuje kategorię `Bad`, `Contested`, `Decent`, `Open` albo `Perfect` oraz listę przyczyn; dokładny procent nie jest wymagany. Progi kategorii są danymi konfiguracyjnymi.

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

## Architektura i przepływ danych

Granice systemu:

1. `core` — czyste typy, stan, reguły kart, walidacja, reakcje obrony, jakość rzutu i RNG.
2. `content` — definicje kart, zawodników, profilu obrony, progów i scenariusza testowego.
3. `application` — inicjalizacja, reset, dispatch komend i publikacja aktualnego stanu.
4. `presentation` — sceny Phasera, plansza, tokeny, karty, teksty, animacje i wejście.
5. `platform` — konfiguracja Vite, ścieżka GitHub Pages i późniejsze integracje przeglądarkowe.

Przepływ:

```text
wejście gracza
  → komenda aplikacyjna
  → walidacja i redukcja stanu w core
  → nowy stan + zdarzenia domenowe
  → prezentacja i krótka informacja o przyczynie
```

Phaser nie importuje niejawnych mutowalnych singletonów domenowych. `core` nie importuje Phasera, DOM ani API przeglądarki.

## Decyzje techniczne

### Stos przeglądarkowy

- Decyzja: TypeScript `strict`, Phaser i Vite, zarządzane przez npm z wersjonowanym `package-lock.json`.
- Uzasadnienie: stos wspiera grę 2D, szybkie iteracje i statyczny deployment.
- Konsekwencje: repozytorium definiuje skrypty `lint`, `typecheck`, `test`, `build` i docelowo `test:e2e`.
- Dotyczy: PRD 000, wszystkie milestone'y.

### Testy

- Decyzja: Vitest dla logiki i Playwright dla krytycznego przepływu przeglądarkowego.
- Uzasadnienie: reguły wymagają szybkich deterministycznych testów, a UI rzeczywistego smoke testu.
- Konsekwencje: testy domenowe nie uruchamiają Phasera; `test:e2e` uruchamia build albo kontrolowany serwer preview.
- Decyzja: parametr `e2e=1` aktywuje wyłącznie odczytowy, serializowany snapshot modelu widoku; test nadal wykonuje akcje przez prawdziwe kliknięcia w canvas.
- Konsekwencje: most nie jest aktywny w zwykłym uruchomieniu i nie umożliwia zmiany stanu ani omijania reguł.
- Dotyczy: PRD 000, milestone'y 1–3.

### Dystrybucja statyczna

- Decyzja: pierwszy cel publikacji to GitHub Pages pod `/HOOP-RUN/`, bez backendu.
- Uzasadnienie: prototyp ma być dostępny bez instalacji i serwera aplikacyjnego.
- Konsekwencje: ścieżki zasobów i build są testowane z niekorzeniową bazą; push do `main` uruchamia wdrożenie dopiero po pełnej walidacji i przygotowaniu artefaktu Pages. Zgoda na automatyczne wdrożenie nie oznacza zgody na wykonywanie przyszłych pushów.
- Dotyczy: PRD 000, milestone'y 0 i 3.

### Deterministyczny silnik zasad

- Decyzja: RNG jest wstrzykiwane, stan serializowalny, a redukcja stanu nie mutuje wejścia.
- Uzasadnienie: odtwarzanie błędów, stabilne testy i przyszłe symulacje balansu.
- Konsekwencje: `Math.random()` jest niedozwolone w logice domenowej; seed i sekwencja komend wystarczają do reprodukcji.
- Dotyczy: wszystkie mechaniki rozgrywki.

## Dostępność i informacja zwrotna

- Kluczowy stan nie może być kodowany wyłącznie kolorem.
- Posiadacz piłki, aktywny wykonujący, legalne cele i intencja obrony mają tekstowy albo ikoniczny odpowiednik.
- Nielegalna karta pokazuje konkretny powód bez zmiany stanu.
- Zdarzenia `Advantage`, reakcji obrony i jakości rzutu są przedstawiane krótkimi komunikatami przyczynowymi.
- Podstawowe sterowanie działa myszą; pełna obsługa klawiatury pozostaje poza PRD 000, chyba że wynika bezpośrednio ze standardowych elementów HTML.

## Jakość i kryteria ukończenia

- Każdy milestone ma mierzalne kryteria, testy, build oraz jawny wymóg lub brak wymogu playtestu.
- Reguły `Pass`, `Screen`, `Drive`, `Kick Out`, `Shot`, zegara, legalności, obrony i RNG mają testy przypadków podstawowych oraz brzegowych.
- Grywalny milestone obejmuje playtest podstawowej sekwencji, alternatywnej ścieżki i nielegalnej akcji.
- Build produkcyjny działa z bazą `/HOOP-RUN/` bez brakujących zasobów.
- Problemy blokujące z niezależnego review muszą zostać rozwiązane przed oznaczeniem większego milestone'u jako `done`.

## TODO i bramki decyzji

Poniższe pytania nie blokują PRD 000. Nie wolno jednak planować wskazanych rozszerzeń bez decyzji:

- TODO przed pełnym meczem: wybrać grę do wyniku albo stałą liczbę posiadań.
- TODO przed obroną gracza: wybrać osobną talię defensywną albo system reakcji.
- TODO po playteście stref: zatwierdzić albo zmienić topologię boiska.
- TODO po playteście informacji o rzucie: zdecydować, czy finalnie pokazywać kategorię, procent czy oba.
- TODO przed runem: ustalić relację kapitana, trenera, archetypu drużyny i draftu zawodników.
- TODO przed zbiórkami: ustalić granicę posiadania oraz przejście do `Transition`.
- TODO przed metaprogresją: zdefiniować odblokowania bez trwałej przewagi statystycznej.

## Zasady ewolucji

- `spec.md` pozostaje indeksem aktualnej prawdy. Rozbudowane reguły przenoś do `docs/spec/`, gdy dokument zbliża się do limitu.
- Zmiana zachowania aktualizuje specyfikację i roadmapę; nowe funkcje poza PRD 000 wymagają osobnego zakresu.
- README zmieniaj tylko przy zmianie uruchamiania, konfiguracji lub użycia.
- Refaktory wykonuj w zakresie bieżącego milestone'u albo planuj oddzielnie.
