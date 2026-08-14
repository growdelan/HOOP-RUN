# Walidacja PRD 000

## Wynik

- Data: 2026-08-14.
- Zakres: pionowy przekrój jednego ofensywnego posiadania.
- Decyzja bramki: `proceed`.
- Następny zakres: przyrostowy PRD pełnego meczu; bez projektowania runu przed zatwierdzeniem tego PRD.

Wewnętrzny playtest potwierdził hipotezę, że kolejność kart zależna od stanu boiska tworzy czytelne, różniące się jakościowo posiadania. Dowód nie obejmuje jeszcze obserwacji nowych graczy, dlatego zrozumiałość pierwszego kontaktu pozostaje ryzykiem do sprawdzenia przed szerszą produkcją zawartości.

## Pięć miar powodzenia

| Miara z PRD | Wynik | Dowód |
|---|---|---|
| Gracz rozumie intencję obrony przed pierwszą kartą. | potwierdzona wewnętrznie | Przed pierwszą akcją panel pokazuje `PRESSURE & HELP` oraz opis nacisku na piłkę i pomocy po wejściu w paint. |
| Gracz potrafi wyjaśnić, dlaczego przygotowany rzut jest lepszy od natychmiastowego. | potwierdzona wewnętrznie | Natychmiastowy rzut A1 miał `Contested 42` z karami za krycie i presję. Sekwencja `Screen → Drive → Kick Out → Shot` dała `Perfect 95` oraz jawne premie za `Advantage` i otwartą pozycję. |
| Co najmniej dwie sensowne sekwencje prowadzą do różnych stanów lub jakości. | potwierdzona | `Shot` dał jakość 42, `Pass → Shot` jakość 58, a przygotowana sekwencja jakość 95. Sekwencje zmieniały posiadacza, pozycje, reakcję obrony i `Advantage`. |
| Gracz nie jest prowadzony jedyną legalną ścieżką. | potwierdzona | W stanie początkowym dostępne były cztery karty: `Pass`, `Screen`, `Drive` i `Shot`; `Kick Out` był zablokowany z konkretnym powodem. |
| Powtórzenie zachęca do sprawdzenia innej kolejności. | potwierdzona wewnętrznie | Reset bez przeładowania zachowuje seed i odtwarza wynik tej samej sekwencji, a różnica 42/58/95 daje natychmiastową, wyjaśnialną informację zwrotną dla alternatyw. Brakuje jeszcze obserwacji zachowania nowych graczy. |

## Dowody techniczne

- `./scripts/verify.sh` przeszedł: lint, TypeScript, 25 testów Vitest, produkcyjny build i test Playwright.
- Playwright wykonał rzeczywiste kliknięcia w canvas dla nielegalnej akcji, pełnej sekwencji, rzutu, podsumowania i resetu z seedem 42.
- Produkcyjny preview działał pod `/HOOP-RUN/`; HTML, JavaScript i CSS zwróciły HTTP 200.
- Konsola przeglądarki nie zawierała ostrzeżeń ani błędów.
- Viewport 1024×768 miał `scrollWidth = clientWidth` i `scrollHeight = clientHeight`; canvas miał 976×549 px.
- Workflow CI ma wyłącznie uprawnienie odczytu, weryfikuje projekt i przygotowuje `dist` przez `upload-pages-artifact`; nie zawiera joba publikującego.

## Znane ograniczenia

- Wyniki jakości są parametrami prototypu, a nie finalnym balansem.
- Ocena pięciu miar jest wewnętrzna. Przed inwestycją w onboarding i większą zawartość potrzebny jest test z osobami, które nie znają reguł.
- Interfejs desktopowy nie jest osobnym layoutem mobilnym.
- Bundle Phasera przekracza domyślny próg ostrzeżenia Vite, ale nie blokuje działania prototypu.

## Uzasadnienie bramki

Wybrano `proceed`, ponieważ wszystkie pięć miar ma pozytywny dowód w aktualnym pionowym przekroju, krytyczny przepływ jest deterministyczny i automatycznie odtwarzalny, a alternatywne sekwencje tworzą widoczną różnicę jakości. Decyzja pozwala opracować przyrostowy PRD pełnego meczu, lecz nie zatwierdza jeszcze mapy runu, metaprogresji ani dużej produkcji kart.
