# Walidacja PRD 001

## Stan bramki

- Data walidacji lokalnej: 2026-08-14.
- Zakres: pełny mecz 3 na 3 od `0:0` do zwycięstwa albo porażki.
- Stan decyzji: `pending` — lokalna poprawność jest potwierdzona, ale brakuje obowiązkowych dowodów jakościowych i wdrożeniowych.
- Niedozwolony następny zakres: mapa runu, nagrody i metaprogresja pozostają wstrzymane do decyzji `proceed`, `iterate` albo `rethink`.

## Wyniki miar powodzenia

| Miara z PRD 001 | Stan | Dowód / brakujący dowód |
|---|---|---|
| Typowy mecz trwa 8–12 minut. | nierozstrzygnięta | Pełne scenariusze mają 18–24 posiadania, ale czas automatyzacji i wewnętrznego klikania nie reprezentuje tempa nowego gracza. Wymagany pomiar bez prowadzenia testera. |
| Gracz rozumie zmianę roli i wyniku. | potwierdzona funkcjonalnie, jakościowo nierozstrzygnięta | Nagłówek stale pokazuje `ATAK`/`OBRONA`, wynik i numer posiadania, a obowiązkowe podsumowanie pokazuje punkty i następną rolę. Wymagana obserwacja nowego gracza. |
| Wynik wpływa na wybór rzutu za 1 albo 2 w końcówce. | nierozstrzygnięta | Silnik i UI rozróżniają strefy za 1 i 2, lecz dotychczasowe kontrolowane strategie nie zmieniały decyzji zależnie od wyniku. |
| Co najmniej dwa ataki wymagają różnych sekwencji. | potwierdzona wewnętrznie | Pełny playtest seeda 42 pokazał osiem różnych rąk ofensywnych; intencje obrony i dostępne karty zmieniały możliwe przygotowanie rzutu. |
| Co najmniej dwie obrony wymagają różnych odpowiedzi. | potwierdzona wewnętrznie | W jednym pełnym meczu wystąpiły `Pick & Roll`, `Drive & Kick` i `Quick Three`; macierz kart odróżnia zasłonę, wejście, podanie i rzut. |
| Gracz umie wskazać wpływ decyzji defensywnej. | potwierdzona funkcjonalnie, jakościowo nierozstrzygnięta | Podsumowania publikują nazwane efekty, contest, przewagę, stratę i koniec czasu. Wymagane wyjaśnienie własnymi słowami przez nowego gracza. |
| Porażka jest wyjaśnialna bez ukrytego bonusu AI. | potwierdzona technicznie | Przeciwnik używa jawnego planu i bieżącej akcji, wspólnego modelu jakości oraz jednego seedowanego RNG; testy nie wykazały podglądu przyszłej ręki ani decyzji. |
| Po meczu istnieje chęć rewanżu lub zmiany strategii. | nierozstrzygnięta | Rewanż działa i odtwarza seed, ale intencji gracza nie da się wywnioskować z automatyzacji. |

## Dowody lokalne

- `./scripts/verify.sh` obejmuje lint, TypeScript `strict`, 63 testy Vitest, produkcyjny build i Playwright.
- Testy domenowe obejmują regułę `11 / +2 / limit 15`, punktację 1/2, trzy plany, różne ręce, przetasowanie, stratę, koniec czasu i deterministyczny rewanż.
- Playwright wykonuje rzeczywiste kliknięcia w canvas dla pełnego zwycięstwa z seedem 2, pełnej porażki z seedem 42, zmian ról, podsumowań i rewanżu.
- Zwycięstwo jest automatyzowane w viewportach 1440×900 i 1024×768; canvas w węższym widoku mieści się w szerokości strony.
- Wewnętrzny playtest zakończył seed 42 wynikiem 8:11 po 18 posiadaniach i seed 43 wynikiem 8:11 po 24 posiadaniach. Wystąpiły trafienia, pudła, straty, różne ręce i wszystkie trzy plany przeciwnika.
- Produkcyjny preview działa pod `/HOOP-RUN/`; konsola nie zawierała błędów ani ostrzeżeń, a E2E nie wykryło błędnych odpowiedzi lub nieudanych żądań.

## Brakujące dowody obowiązkowe

1. Test z co najmniej jedną osobą, która wcześniej nie znała projektu, obejmujący pomiar czasu, rozpoznanie roli, rozumienie obrony, wpływ wyniku i chęć rewanżu.
2. Publikacja aktualnych zmian po osobnej zgodzie na commit i push oraz smoke test rzeczywistego GitHub Pages pod `/HOOP-RUN/`.
3. Na podstawie testu nowego gracza wybór bramki `proceed`, `iterate` albo `rethink` i zapisanie uzasadnienia w tym dokumencie oraz `STATUS.md`.

## Scenariusz testu nowego gracza

- Nie objaśniaj optymalnych sekwencji ani kontr przed startem; pokaż tylko sterowanie z README.
- Zmierz czas od `0:0` do ekranu końcowego bez zatrzymywania zegara na pytania prowadzącego.
- Po pierwszej zmianie posiadania poproś testera o wskazanie aktualnej roli i przyczyny zmiany wyniku.
- W dwóch obronach poproś o głośne uzasadnienie wyboru karty przed kliknięciem.
- W końcówce zapytaj, czy aktualny wynik zmienia preferencję rzutu za 1 lub 2, bez sugerowania odpowiedzi.
- Po zakończeniu zapytaj, czy tester chce rewanżu, nowego seeda czy przerwania oraz dlaczego.
