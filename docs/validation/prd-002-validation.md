# Walidacja PRD 002 — pierwsza pętla runu

## Decyzja bramki

**Wynik: `proceed`.** Kontrolowane scenariusze pokazują obserwowalny wpływ nagrody na późniejszą decyzję, mierzalne różnice trzech profili przeciwników, deterministyczny dalszy przebieg po checkpointcie oraz poprawny reset do czystych talii. Wynik pozwala przygotować kolejny ograniczony PRD runu, ale nie zatwierdza automatycznie mapy, sklepu, ekonomii ani metaprogresji.

Milestone 12 jest `done`; końcowe niezależne review zakończyło się decyzją `APPROVED` bez problemów blokujących. Brak ludzkiego playtestu nie jest blokerem; subiektywne odczucie rozwoju buildu pozostaje opcjonalnym sygnałem do późniejszej iteracji.

## Zakres i środowisko

- Data: 2026-08-16.
- Produkcyjny build Vite pod `http://127.0.0.1:4173/HOOP-RUN/`.
- Referencyjny zwycięski seed: `2`; referencyjny seed porażki: `42`.
- Viewporty technicznego smoke: `1024×768` i `1280×720`.
- Zasady pozostały bez zmian: trzy mecze, dwie obowiązkowe nagrody, punktacja `11 / +2 / limit 15`, jeden logiczny strumień RNG.

## Wyniki mierzalne

| Miara PRD 002 | Dowód | Wynik |
|---|---|---|
| Pełny sukces | RunSession, Playwright i techniczny smoke seeda 2 | `Fundamentals 11:1`, `Perimeter Crew 12:8`, `Paint Kings 11:9`; `3/3`, sukces |
| Porażka na każdym etapie | parametryzowany test agregatu dla etapów `0`, `1`, `2` | każda porażka kończy run bez oferty nagrody |
| Dwie nagrody i obie role | testy agregatu, RunSession, E2E i smoke | wybrane `Step Back` — atak oraz `Close Out` — obrona; talie końcowe po 11 kart |
| Obserwowalny wpływ nagrody | RunSession, E2E i smoke | `Step Back` pojawił się w ręce, został legalnie zagrany, podniósł prognozę rzutu o dokładnie `+12 pp`, a podsumowanie posiadania zawierało `Step Back +12` |
| Widoczność nagrody | audyt 20 seedów dla obu ról | karta zawsze pozostaje w pierwszym cyklu właściwej talii; występują seedy bez przypięcia jej do pierwszej ręki |
| Cztery nowe karty | kontrolowane scenariusze core | `Backdoor Cut`, `Step Back`, `Hedge` i `Close Out` mają osobne dobre, ryzykowne i brzegowe efekty |
| Trzy profile | deterministyczny audyt 1000 seedów na profil | `Fundamentals` zachowuje rozkład zbalansowany; dominujący plan i intencja `Perimeter Crew` oraz `Paint Kings` mieszczą się między 50% a 70%; powtórzenie daje identyczne wyniki |
| Czas pełnego runu | kontrolowany smoke przeglądarkowy, seed 2, rzeczywiste kliknięcia oraz zapis i wznowienie | `3:13` aktywnego czasu automatyzacji; wynik jest zapisany względem celu 25–35 min, ale nie estymuje tempa człowieka i nie stanowi ręcznej bramki |
| Checkpoint i dalszy przebieg | RunSession oraz Playwright na produkcyjnym preview | identyczny stan drugiego meczu i identyczny końcowy stan dla przebiegu nieprzerwanego oraz wznowionego przy tych samych decyzjach |
| Reset | E2E po sukcesie i test agregatu | etap `1/3`, czyste talie po 10 kart, brak wyników i nagród |

Automatyczny smoke przeglądarkowy zakończył pełny run w `3:13`. Jest to kontrolowany pomiar technicznej automatyzacji obejmujący wybory nagród, checkpoint i podsumowanie, a nie estymacja czasu człowieka. Cel 25–35 minut pozostaje sygnałem do przyszłego opcjonalnego pomiaru gracza i zgodnie z roadmapą nie blokuje technicznej decyzji bramki.

## Walidacja automatyczna

- `./scripts/verify.sh`: limity kontekstu, lint, typecheck, `123/123` Vitest i produkcyjny build — zaliczone; Playwright pominięty zgodnie z polityką manual-only.
- Historyczna pełna macierz Playwright przeszła `10/10` przed poprawkami review. Po poprawkach rozszerzony checkpoint przeszedł `1/1` w `9,3 min` i porównał całe dalsze trajektorie oraz terminalne podsumowanie; kolejna pełna macierz została przerwana na polecenie użytkownika i nie jest wymagana.
- Pełny zestaw pozostaje dostępny wyłącznie użytkownikowi jako opcjonalne `npm run test:e2e:manual`. Agent go nie uruchamia, a wynik lub brak wyniku nie jest bramką M12, review ani publikacji.
- Diagnostyka E2E: brak błędów konsoli, nieudanych żądań i odpowiedzi HTTP `>=400` w sprawdzanych ścieżkach.
- Build zachowuje bazową ścieżkę `/HOOP-RUN/`; ostrzeżenie o dużym chunku Phasera pozostaje znanym, nieblokującym ryzykiem.

## Agentowy techniczny smoke

**Decyzja: zaliczony.**

1. Przy `1024×768` odrzucono zastany wadliwy checkpoint i sprawdzono ekran `Jak grać`; trzy sekcje onboardingu były czytelne, canvas mieścił się w widoku, a dokument nie miał poziomego overflow.
2. Przy `1280×720`, seed `2`, rzeczywistymi kliknięciami rozegrano pierwszy mecz, wybrano `Step Back`, zapisano checkpoint, przeładowano stronę, wznowiono etap 2 i ukończono run.
3. Oferta pokazała role, koszty, działanie i kompromis `Hedge`, `Step Back` oraz `Backdoor Cut`. Po wyborze ekran przerwy jawnie potwierdził nową kartę i następnego przeciwnika.
4. Podsumowanie pokazało etap `3/3`, trzy wyniki, dwie nagrody, obie końcowe talie i czas sesji. `scrollWidth` był równy szerokości viewportu; canvas mieścił się poziomo i pionowo.
5. Dziennik przeglądarki nie zawierał błędów ani ostrzeżeń. Kontrolę nieudanych żądań, statusów HTTP i zasobów powtórzył pełny Playwright.

## Ograniczenia i ryzyka po bramce

- Testy potwierdzają funkcjonalny wpływ buildu, ale nie dowodzą subiektywnej chęci kolejnego runu; późniejszy feedback gracza może uruchomić ograniczoną iterację.
- Kontrolowany smoke rejestruje `3:13` aktywnego czasu automatyzacji, lecz nie rozstrzyga, czy człowiek zmieści się w diagnostycznym celu 25–35 minut.
- Szybko zakończony mecz może skończyć się przed dobraniem nagrody mimo obecności karty w pierwszym cyklu. Ryzyko jest jawne i nie uzasadnia przypinania karty do pierwszej ręki.
- Wartości kart oraz wagi `3/1/1` pozostają strojalnym prototypem. Dalsze strojenie powinno wynikać z osobnej decyzji i pozostać w danych.
- Bundle produkcyjny ma około `1,47 MB` przed kompresją i `386 KB` gzip; optymalizacja pozostaje odłożona do osobnego pomiaru.
- Końcowe niezależne review nie zgłosiło problemów blokujących; pełne E2E pozostają opcjonalnym ręcznym narzędziem użytkownika.
