# Walidacja PRD 001

## Stan bramki

- Data walidacji lokalnej: 2026-08-14.
- Zakres: pełny mecz 3 na 3 od `0:0` do zwycięstwa albo porażki.
- Stan decyzji: `iterate`, korekta gotowa do ponownego testu — po wyniku `0:11` właściwe wejście po zasłonie otrzymało otwarte wykończenie, a wyspecjalizowane kontry obronne zostały wzmocnione. Automatyczny audyt potwierdza sprawczość, ale nie zastępuje pełnego meczu gracza.
- Niedozwolony następny zakres: mapa runu, nagrody i metaprogresja pozostają wstrzymane do decyzji `proceed`, `iterate` albo `rethink`.

## Wyniki miar powodzenia

| Miara z PRD 001 | Stan | Dowód / brakujący dowód |
|---|---|---|
| Typowy mecz trwa 8–12 minut. | potwierdzona wewnętrznie | Pierwszy ręczny pełny mecz trwał około 10 minut. Wymagane jest jeszcze potwierdzenie na osobie wcześniej nieznającej projektu. |
| Gracz rozumie zmianę roli i wyniku. | potwierdzona funkcjonalnie, jakościowo nierozstrzygnięta | Nagłówek stale pokazuje `ATAK`/`OBRONA`, wynik i numer posiadania, a obowiązkowe podsumowanie pokazuje punkty i następną rolę. Wymagana obserwacja nowego gracza. |
| Wynik wpływa na wybór rzutu za 1 albo 2 w końcówce. | niepotwierdzona | W meczu zakończonym 2:11 decyzje były podejmowane częściowo na ślepo, ponieważ interfejs nie wyjaśniał skutków kart; nie dało się świadomie uzależnić strategii od wyniku. |
| Co najmniej dwa ataki wymagają różnych sekwencji. | potwierdzona wewnętrznie | Pełny playtest seeda 42 pokazał osiem różnych rąk ofensywnych; intencje obrony i dostępne karty zmieniały możliwe przygotowanie rzutu. |
| Co najmniej dwie obrony wymagają różnych odpowiedzi. | potwierdzona wewnętrznie | W jednym pełnym meczu wystąpiły `Pick & Roll`, `Drive & Kick` i `Quick Three`; macierz kart odróżnia zasłonę, wejście, podanie i rzut. |
| Gracz umie wskazać wpływ decyzji defensywnej. | gotowa do ponownego testu | `Switch` na Screen pokazuje i daje `-5 pp`, a `Help Defense` na Drive `-10 pp`; pozostaje potwierdzić odczuwalną sprawczość w ręcznym meczu. |
| Porażka jest wyjaśnialna bez ukrytego bonusu AI. | potwierdzona technicznie | Przeciwnik używa jawnego planu i bieżącej akcji, wspólnego modelu jakości oraz jednego seedowanego RNG; testy nie wykazały podglądu przyszłej ręki ani decyzji. |
| Po meczu istnieje chęć rewanżu lub zmiany strategii. | niepotwierdzona | Drugi mecz po poprawie informacji zakończył się `0:11`; brak realnej możliwości wygrania lub zatrzymania rywala nadal blokuje motywację do kolejnej próby. |

## Dowody lokalne

- `./scripts/verify.sh` obejmuje lint, TypeScript `strict`, 68 testów Vitest, produkcyjny build i Playwright.
- Testy domenowe obejmują regułę `11 / +2 / limit 15`, punktację 1/2, trzy plany, różne ręce, przetasowanie, stratę, koniec czasu i deterministyczny rewanż.
- Playwright wykonuje rzeczywiste kliknięcia w canvas dla pełnego zwycięstwa z seedem 2, pełnej porażki z seedem 42, zmian ról, podsumowań i rewanżu.
- Zwycięstwo jest automatyzowane w viewportach 1440×900 i 1024×768; canvas w węższym widoku mieści się w szerokości strony.
- Wewnętrzny playtest zakończył seed 42 wynikiem 8:11 po 18 posiadaniach i seed 43 wynikiem 8:11 po 24 posiadaniach. Wystąpiły trafienia, pudła, straty, różne ręce i wszystkie trzy plany przeciwnika.
- Produkcyjny preview działa pod `/HOOP-RUN/`; konsola nie zawierała błędów ani ostrzeżeń, a E2E nie wykryło błędnych odpowiedzi lub nieudanych żądań.
- Pierwszy ręczny pełny mecz na publicznym buildzie `7ae3ce2`, seed 42, zakończył się porażką 2:11 po około 10 minutach. Przepływ dało się ukończyć, ale gracz wybierał częściowo na ślepo z powodu braku liczbowych i porównawczych objaśnień kart i nie chciał rewanżu z tego samego powodu.
- Lokalna iteracja pokazuje przed wyborem zmianę `Advantage`, wpływ na rzut w punktach procentowych, szansę straty, odsłonięcie zawodnika oraz aktualny procent, kategorię i wartość `Shot`. Playtest seeda 7 potwierdził czytelne porównanie odpowiedzi na `Screen` w viewportach 1280×720 i 1024×768.
- Powtórny ręczny mecz po opublikowaniu prognoz zakończył się `0:11`. Gracz nadal nie był w stanie wygrać ani skutecznie bronić; wcześniejsza analiza wykazała również przypadek, w którym zamierzona kontra `Drive` miała niższą oczekiwaną wartość punktową niż natychmiastowy `Shot`.
- Po korekcie `Screen → Drive` przeciw `Deny Perimeter` zmienia prognozę z 36% za 2 na 80% za 1 i tworzy jawne otwarte wejście. Strategia oparta na intencjach wygrała 82/100 seedów, przegrała 18/100, a seed 42 zakończyła `12:6`; słabszy atak wygrał tylko 44/100. Produkcyjny playtest 1280×720 i 1024×768 był czytelny i bez błędów konsoli.

## Brakujące dowody obowiązkowe

1. Powtórny ręczny pełny mecz potwierdzający, że właściwe odczytanie intencji daje realną szansę na wyrównany wynik lub zwycięstwo.
2. Test z co najmniej jedną osobą, która wcześniej nie znała projektu, obejmujący pomiar czasu, rozpoznanie roli, rozumienie obrony, wpływ wyniku i chęć rewanżu.
3. Po korekcie i testach ostateczny wybór bramki `proceed`, `iterate` albo `rethink`.

## Scenariusz testu nowego gracza

- Nie objaśniaj optymalnych sekwencji ani kontr przed startem; pokaż tylko sterowanie z README.
- Zmierz czas od `0:0` do ekranu końcowego bez zatrzymywania zegara na pytania prowadzącego.
- Po pierwszej zmianie posiadania poproś testera o wskazanie aktualnej roli i przyczyny zmiany wyniku.
- W dwóch obronach poproś o głośne uzasadnienie wyboru karty przed kliknięciem.
- W końcówce zapytaj, czy aktualny wynik zmienia preferencję rzutu za 1 lub 2, bez sugerowania odpowiedzi.
- Po zakończeniu zapytaj, czy tester chce rewanżu, nowego seeda czy przerwania oraz dlaczego.
