# Roadmapa HOOP-RUN

Roadmapa obejmuje zaplanowane `prd/002-first-run-loop.md`. PRD 000 i PRD 001 zakończyły się bramkami `proceed`, a szczegóły ukończonych prac znajdują się w `docs/archive/roadmap/`. Dozwolone statusy: `planned`, `in_progress`, `done`, `blocked`.

Milestone można oznaczyć jako `done`, gdy wszystkie kryteria akceptacji są spełnione, wskazana walidacja i wymagany playtest przeszły, dokumentacja odpowiada faktom, a problemy blokujące z wymaganego review zostały rozwiązane.

## Aktualna kolejność

Milestone'y PRD 002 należy wykonywać kolejno: `8 → 9 → 10 → 11 → 12`.

- Milestone 8 buduje czysty, deterministyczny agregat runu oraz wybór nagrody.
- Milestone 9 dostarcza cztery nowe karty i trzy odróżnialne profile przeciwników jako typowaną zawartość.
- Milestone 10 jest minimalnym grywalnym pionowym przekrojem całego trzy-meczowego runu.
- Milestone 11 dodaje wersjonowany checkpoint przeglądarkowy i automatyzuje wznowienie.
- Milestone 12 waliduje hipotezę progresji runu i stanowi bramkę przed mapą, ekonomią albo metaprogresją.

## Milestone 8: Deterministyczny agregat runu i nagrody (`done`)

### Cel

Zbudować niezależny od Phasera model trzy-meczowego runu, który składa istniejący `MatchState`, prowadzi przez zwycięstwo, porażkę i wybór nagrody oraz zachowuje jeden kanoniczny przebieg RNG.

### Hipoteza do zweryfikowania

Pełny mecz można osadzić w nadrzędnym agregacie bez duplikowania reguł i losowości, a deterministyczna oferta jednej z trzech kart może trwale zmienić właściwą talię następnego meczu.

### Kryteria akceptacji

- Serializowalny `RunState` reprezentuje seed początkowy, jeden logiczny kursor RNG, fazę, indeks przeciwnika, obie talie runu, aktywny mecz, wyniki meczów, wybrane nagrody i wynik końcowy.
- Fazy rozróżniają aktywny mecz, nierozstrzygniętą nagrodę, przerwę przed następnym meczem oraz ukończony sukces albo porażkę.
- Run uruchamia dokładnie trzech przeciwników w kolejności `Fundamentals → Perimeter Crew → Paint Kings`, przekazując aktualne talie do nowego `MatchState`.
- Porażka na dowolnym etapie kończy run, zwycięstwo w pierwszym lub drugim meczu tworzy ofertę, a trzecie zwycięstwo kończy run bez nagrody.
- Oferta ma dokładnie trzy stabilnie uporządkowane pozycje, zawiera co najmniej jedną kartę ataku i jedną obrony oraz jest generowana tylko raz dla danego stanu.
- Wybór dokładnie jednej pozycji dodaje kartę do właściwej talii; odrzucone karty nie zmieniają stanu talii.
- Nielegalna komenda nie zmienia stanu ani RNG, a ten sam seed i sekwencja kontrolowanych wyników oraz wyborów odtwarzają pełny stan runu.
- Nowy run resetuje talie, nagrody, wyniki i etap do zatwierdzonego stanu początkowego PRD 001.

### Zakres

- typy, fazy, komendy, reducer i zdarzenia agregatu runu,
- składanie istniejącego agregatu meczu bez kopiowania jego reguł,
- generyczny katalog kart nagród i deterministyczny generator oferty,
- aktualizacja talii między meczami,
- historia wyników i nagród oraz zakończenie runu,
- testy podstawowe, brzegowe, niemutowalności i reprodukcji.

### Poza zakresem

- efekty czterech nowych kart i finalne profile przeciwników,
- UI runu, onboarding, zapis przeglądarkowy i pomiar czasu,
- mapa, sklep, waluta, rzadkość, usuwanie kart i metaprogresja.

### Walidacja

- Testy automatyczne: Vitest dla faz, trzech etapów, porażki na każdym etapie, obu ofert, wyboru, resetu, legalności i pełnej reprodukcji.
- Build: pełne `./scripts/verify.sh` wraz z dotychczasowymi testami PRD 000–001.
- Playtest: niewymagany, ponieważ milestone nie zmienia widocznego przepływu.
- Review: wymagane read-only review własności stanu, składania `MatchState`, niemutowalności i jednego kanonicznego RNG.

### Zależności i ryzyka

- Zależność: ukończony Milestone 7 i stabilny kontrakt `MatchState`.
- Ryzyko: run i aktywny mecz mogą przechowywać rozbieżne kursory RNG; w każdej fazie istnieje tylko jedno kanoniczne źródło kursora.
- Ryzyko: ponowne wejście do oferty może przerzucać nagrody; wygenerowana oferta jest częścią stanu, nie pochodną renderowania.
- Ryzyko: agregat runu może kopiować wynik i fazy meczu; stan pochodny należy wyliczać, a rezultat meczu przyjmować przez jeden kontrakt zakończenia.

## Milestone 9: Karty nagród i tożsamość przeciwników (`done`)

### Cel

Zaimplementować cztery nowe mechaniki kart oraz trzy jawnie różne konfiguracje przeciwników jako strojalną, deterministyczną zawartość używaną przez agregat runu.

### Hipoteza do zweryfikowania

Cztery karty o przestrzennych kompromisach oraz różne wagi planów i intencji wystarczą, aby nagroda mogła zmienić późniejszą decyzję, a kolejni przeciwnicy wymagali zauważalnie innych odpowiedzi bez ukrytych premii.

### Kryteria akceptacji

- `Backdoor Cut` kosztuje 2 sekundy, przenosi zawodnika bez piłki z obwodu do paint i otwiera go tylko przeciw intencji `onBallPressure >= 8` bez pomocy.
- `Step Back` kosztuje 3 sekundy i daje obwodowemu posiadaczowi jednorazowe `+12 pp` do najbliższego `Shot`; inna karta kasuje status, a premia nie kumuluje się.
- `Hedge` odpowiada wyłącznie na `Screen`, kosztuje łącznie 3 sekundy, daje `-2 Opponent Advantage` i `+6 contest`, lecz odsłania screenera oraz może oddać `+1 Advantage` w następnym kroku.
- `Close Out` kosztuje 2 sekundy i odpowiada wyłącznie na rzut z obwodu: przy zerowej przewadze daje `+12 contest`, a przy istniejącej przewadze tylko `+4 contest` i dodatkowe `+1 Opponent Advantage`.
- Żadna nowa karta nie jest legalna ani najlepsza bezwarunkowo; kontrolowane scenariusze pokazują co najmniej jeden korzystny i jeden ryzykowny kontekst każdej mechaniki.
- Wybrana nagroda należy do pierwszego cyklu właściwej talii następnego meczu i, jeżeli cykl zostanie zużyty, jest dobierana przed pierwszym przetasowaniem bez przypinania do pierwszej ręki lub gwarantowania zwycięstwa.
- `Fundamentals`, `Perimeter Crew` i `Paint Kings` mają osobne identyfikatory, opisy, jawne profile planów oraz intencji i nie używają ukrytego mnożnika trafienia.
- `Fundamentals` używa wag planów i intencji `1/1/1`; `Perimeter Crew` używa `1/1/3` dla planów z dominującym `Quick Three` i intencji z dominującym `Deny Perimeter`; `Paint Kings` używa `3/1/1` dla planów z dominującym `Pick & Roll` oraz `1/3/1` dla intencji z dominującym `Protect Paint`.
- Milestone korzysta wyłącznie z istniejących planów, akcji i intencji; dodanie nowej akcji przeciwnika wymaga osobnej decyzji po nieudanym audycie rozróżnialności.
- Te same seedy odtwarzają plany, intencje, ręce, działanie kart i rozstrzygnięcia dla każdego profilu.

### Zakres

- współdzielone mechaniki i dane czterech kart,
- legalność, prognozy liczbowe i zdarzenia przyczynowe nowych efektów,
- konfiguracje talii, planów, intencji i wag trzech przeciwników,
- kontrolowane scenariusze synergii, kontr i ryzyk,
- audyt seedów dla widoczności nagrody i odróżnialności profili.

### Poza zakresem

- więcej niż cztery nowe karty lub trzy profile przeciwników,
- ukryte skalowanie trudności, adaptacyjne AI i bossowskie wyjątki zasad,
- rendering ekranów runu, zapis, mapa, ekonomia i metaprogresja.

### Walidacja

- Testy automatyczne: Vitest dla legalności, kosztów, efektów, kompromisów, prognoz, trzech profili i deterministycznego audytu seedów.
- Build: pełne `./scripts/verify.sh`.
- Playtest: niewymagany, ponieważ milestone kończy się na regułach i danych headlessowych.
- Review: read-only review koszykarskiego znaczenia kart, braku dominanty, danych przeciwników i granicy `core`/`content` zakończone decyzją `APPROVED`.
- Wynik końcowy: `./scripts/verify.sh` zielony — 88 testów Vitest, build i 4/4 E2E; playtest niewymagany, ponieważ milestone nie zmienił widocznego przepływu.

### Zależności, decyzje i ryzyka

- Zależność: Milestone 8.
- Przyjęto: koszty, cele, efekty, statusy i kontrolowane scenariusze czterech kart opisane w `docs/spec/first-run-loop.md` są prototypem wejściowym Milestone 9.
- Przyjęto: nagroda jest częścią pierwszego cyklu właściwej talii i nie jest przypinana do pierwszej ręki.
- Przyjęto: profile używają wyłącznie istniejącej zawartości z wagami `1/1/1` dla `Fundamentals`, dominującym `3/1/1` dla specjalizacji `Perimeter Crew` i `Paint Kings` oraz bez nowej akcji przeciwnika.
- Ryzyko: wartości kart są strojalnym prototypem; audyt musi wykryć dominantę, martwe konteksty i pozorny wybór bez niejawnego rozszerzania mechanik.

## Milestone 10: Grywalny trzy-meczowy run (`done`)

### Cel

Połączyć agregat runu, nowe karty i profile przeciwników w minimalny grywalny pionowy przekrój od ekranu startowego do sukcesu albo porażki, bez zapisu między sesjami.

### Hipoteza do zweryfikowania

Przepływ `mecz → wybór jednej z trzech kart → trudniejszy mecz` jest czytelny end-to-end, a gracz może zobaczyć i wykorzystać wpływ nagrody bez mapy, sklepu i metaprogresji.

### Kryteria akceptacji

- Ekran startowy pozwala rozpocząć nowy run i otworzyć `Jak grać`; onboarding wyjaśnia role, sterowanie, wynik, intencje, trzy etapy i utrzymywanie nagród bez podawania kontr.
- Gracz może bez przeładowania rozegrać kolejno trzy mecze z postępem `1/3`, `2/3`, `3/3`, nazwą i opisem bieżącego przeciwnika.
- Pierwsze i drugie zwycięstwo otwierają czytelną ofertę trzech kart, blokują dalszy przepływ do wyboru jednej karty i potwierdzają talię, do której karta trafiła.
- Następny mecz korzysta ze zmodyfikowanych talii, a zdobyta karta może pojawić się w ręce, pokazać prognozę i zostać legalnie zagrana.
- Porażka na dowolnym etapie i trzecie zwycięstwo kończą run odpowiednim podsumowaniem wyników, nagród, końcowych talii i osiągniętego etapu.
- Nowy run z podsumowania przywraca czyste talie i etap pierwszy.
- Widoki startu, onboardingu, nagrody, meczu i podsumowania działają myszą, nie kodują kluczowego stanu wyłącznie kolorem i mieszczą się w dwóch viewportach desktopowych.

### Zakres

- `RunSession`, komendy UI i model widoku runu,
- ekran startowy, `Jak grać`, nagroda, przerwa między meczami i podsumowanie runu,
- integracja istniejącej sceny meczu z fazami runu,
- postęp, opisy przeciwników, talie i historia nagród,
- rozszerzenie tylko do odczytu snapshotu E2E o stan runu.

### Poza zakresem

- zapis i wznowienie po przeładowaniu strony,
- finalna oprawa, audio, pełna klawiatura i osobny layout mobilny,
- mapa, sklep, waluta, rzadkość i metaprogresja.

### Walidacja

- Testy automatyczne: testy `RunSession` oraz Playwright dla startu, onboardingu, jednej nagrody, zmienionej talii, przejścia do kolejnego meczu i zakończenia runu.
- Build: pełne `./scripts/verify.sh` i produkcyjny preview pod `/HOOP-RUN/`.
- Playtest: wymagany agentowy `$codex-flow-playtest` jako techniczny smoke reprezentatywnych ekranów i rzeczywistych kliknięć na 1280×720 i 1024×768, z kontrolą konsoli, sieci, zasobów, layoutu i obserwowalnego użycia nagrody. Pełny sukces i kontrolowaną porażkę pokrywa E2E; nie trzeba ręcznie powtarzać tej macierzy.
- Review: wymagane niezależne review przepływu faz, granic Phasera, sterowania i zgodności z PRD 002.

### Zależności i ryzyka

- Zależność: Milestone 9.
- Ryzyko: wiele nowych ekranów przeciąży jedną scenę; Phaser ma prezentować model, a nawigacja faz pozostaje w sesji aplikacyjnej.
- Ryzyko: pełny run spowalnia iterację; kontrolowane seedy i E2E pokrywają macierz, a smoke techniczny sprawdza reprezentatywny rzeczywisty przepływ bez jej ręcznego dublowania.
- Ryzyko: onboarding może pozostać niejasny mimo poprawnej treści i layoutu; subiektywny feedback gracza jest mile widziany, ale nie blokuje milestone'u.

## Milestone 11: Checkpoint przeglądarkowy i odporne wznowienie (`planned`)

### Cel

Dodać jeden ręczny, wersjonowany checkpoint pomiędzy meczami oraz odtworzyć z niego identyczny dalszy przebieg bez przerzucania nagrody lub częściowo uszkodzonego stanu.

### Hipoteza do zweryfikowania

Zapis kompletnego stanu domenowego po wyborze nagrody pozwala bezpiecznie przerwać dłuższy run, a jawna walidacja wersji chroni gracza przed niezgodnym lub uszkodzonym checkpointem.

### Kryteria akceptacji

- Wersjonowany `RunCheckpointV1` zawiera stan potrzebny do identycznego wznowienia: seed i kanoniczny RNG, następny etap, obie talie, wyniki, nagrody oraz czas zakumulowany według zatwierdzonej polityki pomiaru.
- Checkpoint można utworzyć wyłącznie w przerwie po wybranej nagrodzie; aktywny mecz i nierozstrzygnięta oferta odrzucają zapis bez zmiany stanu.
- `Zapisz i wyjdź` zapisuje jeden lokalny slot i wraca do startu, a `Kontynuuj run` odtwarza ten sam następny mecz bez ponownego generowania oferty.
- Rozpoczęcie nowego runu przy istniejącym slocie wymaga potwierdzenia i zastępuje zapis dopiero po potwierdzeniu.
- Niepoprawny JSON, brak wymaganych pól i nieobsługiwana wersja nie uruchamiają runu; UI pozwala odrzucić zapis i rozpocząć od nowa.
- Porażka lub trzecie zwycięstwo usuwa aktywny slot po utworzeniu podsumowania.
- Przerwany i nieprzerwany przebieg z tym samym checkpointem i dalszymi decyzjami daje identyczne oferty, ręce, plany, wyniki i podsumowanie poza wartością czasu wynikającą z zatwierdzonej polityki pomiaru.

### Zakres

- czysty kodek i walidacja wersjonowanego checkpointu,
- port repozytorium zapisu w `application` i adapter jednego klucza `localStorage` w `platform`,
- komendy zapisu, kontynuacji, zastąpienia i odrzucenia,
- pomiar czasu przez wstrzyknięty zegar bez użycia czasu ściennego w regułach gameplayu,
- widoki oraz testy błędów zapisu i wznowienia.

### Poza zakresem

- zapis aktywnego meczu lub nierozstrzygniętej nagrody,
- wiele slotów, autosave, eksport, chmura, konto i backend,
- migracja między wersjami checkpointu poza bezpiecznym odrzuceniem nieobsługiwanej wersji.

### Walidacja

- Testy automatyczne: Vitest kodeka, integralności, dozwolonej fazy, adaptera i równoważności wznowienia; Playwright dla zapisu, reloadu, kontynuacji, potwierdzenia nowego runu i uszkodzonego slotu.
- Build: pełne `./scripts/verify.sh` i preview pod `/HOOP-RUN/`.
- Playtest: wymagany agentowy `$codex-flow-playtest` reprezentatywnego zapisu i wznowienia na 1280×720 i 1024×768, z kontrolą konsoli, sieci, layoutu i trwałości slotu; warianty obu nagród oraz równoważność dalszego przebiegu pokrywa E2E.
- Review: wymagane read-only review granicy `core`/`application`/`platform`, kompletności checkpointu, walidacji danych i braku możliwości przerzucania oferty.

### Zależności, ryzyka i TODO

- Zależność: Milestone 10.
- `TODO: [przed implementacją Milestone 11]` zatwierdzić dokładny klucz storage, dyskryminator wersji i listę pól `RunCheckpointV1` na podstawie finalnego `RunState`.
- `TODO: [przed implementacją Milestone 11]` zatwierdzić, czy łączny czas podsumowania oznacza wyłącznie aktywny czas gry, czy również przerwę między zapisem i wznowieniem; rekomendowany wariant wyklucza czas poza sesją.
- Ryzyko: zapis częściowego albo pochodnego stanu odtworzy inną kolejność RNG; checkpoint przechowuje kanoniczne dane, nie model widoku.
- Ryzyko: bezpośrednie użycie `localStorage` w domenie złamie testowalność; dostęp jest wyłącznie przez port i adapter platformowy.

## Milestone 12: Walidacja hipotezy pierwszego runu (`planned`)

### Cel

Ustabilizować pełny run, zautomatyzować krytyczne ścieżki i zebrać dowody do decyzji, czy nagrody oraz trzej przeciwnicy uzasadniają projektowanie kolejnego systemu roguelite.

### Hipoteza do zweryfikowania

Pętla `mecz → nagroda → trudniejszy mecz` tworzy obserwowalny build: co najmniej jedna nagroda legalnie wpływa na późniejszą decyzję, profile przeciwników są mierzalnie różne, a pełny run ma zarejestrowany orientacyjny czas względem celu 25–35 minut.

### Kryteria akceptacji

- Kontrolowane testy obejmują sukces, porażkę na każdym z trzech etapów, obie role nagród, wszystkie nowe karty i trzy profile przeciwników.
- Playwright automatyzuje pełny zwycięski run, co najmniej jedną porażkę, dwa wybory nagród, reset nowego runu oraz zapis i wznowienie bez zmiany dalszego przebiegu.
- Pełny przepływ działa w produkcyjnym preview i po publikacji pod `/HOOP-RUN/` bez blokujących błędów konsoli, sieci, zasobów lub poziomego overflow.
- Deterministyczny scenariusz rejestruje orientacyjny czas pełnego runu, obserwowalny efekt co najmniej jednej nagrody oraz różnice profili przeciwników; cel 25–35 minut jest miarą diagnostyczną, nie ręczną bramką `done`.
- Agentowy techniczny smoke sprawdza onboarding, reprezentatywną nagrodę, checkpoint i podsumowanie na dwóch viewportach przez rzeczywiste kliknięcia, bez błędów konsoli, sieci, zasobów lub layoutu.
- Ewentualny feedback użytkownika lub innej osoby można zapisać jako dodatkowy sygnał jakościowy, ale jego brak ani deklarowana chęć kolejnego runu nie blokują milestone'u lub bramki.
- Zapis i wznowienie są porównane z nieprzerwanym przebiegiem dla tego samego checkpointu i dalszych decyzji.
- Dokument walidacji rozstrzyga wszystkie miary PRD 002 wynikiem `proceed`, `iterate` albo `rethink`.
- Końcowe niezależne review nie zawiera nierozwiązanych problemów blokujących.

### Zakres

- stabilizacja i ograniczone poprawki ujawnione przez testy, E2E lub agentowy smoke techniczny,
- referencyjne seedy i audyty balansu nagród oraz przeciwników,
- E2E sukcesu, porażki, obu nagród, resetu i checkpointu,
- pomiar czasu oraz techniczna walidacja onboardingu i pełnego runu,
- `docs/validation/prd-002-validation.md` oraz decyzja bramki.

### Poza zakresem

- mapa, rozgałęzienia, sklep, waluta, rzadkość i metaprogresja,
- nowe karty lub przeciwnicy poza minimum PRD 002,
- finalna oprawa, audio, osobny layout mobilny i optymalizacje bez pomiaru,
- commit, push i publikacja bez osobnej jawnej zgody użytkownika.

### Walidacja

- Testy automatyczne: `npm run test`, `npm run test:e2e`, kontrolowane seedy i audyt deterministyczności całego runu.
- Build: pełne `./scripts/verify.sh` oraz weryfikacja artefaktu GitHub Pages.
- Playtest: wymagany agentowy `$codex-flow-playtest` jako techniczny smoke reprezentatywnego sukcesu lub porażki oraz checkpointu na dwóch viewportach; pełną macierz sukcesu, porażek i wznowienia pokrywają E2E. Zewnętrzny test gracza jest opcjonalnym feedbackiem poza bramką.
- Review: wymagane końcowe read-only review diffu, testów, zapisu, dowodów playtestu, zakresu PRD i dokumentacji.

### Zależności i ryzyka

- Zależność: Milestone 11.
- Ryzyko: automatyzacja potwierdzi poprawność i obserwowalny efekt nagrody, ale nie subiektywne odczucie rozwoju buildu; taki feedback użytkownik może zgłosić później bez blokowania bramki.
- Ryzyko: zwycięski run może przekroczyć 35 minut; najpierw mierzyć, a zasady meczu zmieniać tylko przez jawną iterację zakresu.
- Ryzyko: poprawna treść i techniczny smoke nie gwarantują subiektywnej jasności onboardingu; późniejszy feedback może uruchomić osobną iterację.

## Bramka po PRD 002

Po ukończeniu Milestone 12 należy wybrać wynik:

1. `proceed` — testy pokazują wpływ nagród na późniejsze decyzje, profile przeciwników są różne, a reset umożliwia kolejny run z innym wyborem; można przygotować PRD mapy albo kolejnego ograniczonego systemu runu,
2. `iterate` — pętla jest obiecująca, ale nagrody, czas, przeciwnicy, zapis albo onboarding wymagają ograniczonej korekty,
3. `rethink` — kontrolowane scenariusze nie pokazują wpływu dwóch nagród na późniejsze decyzje albo trzy profile nie tworzą funkcjonalnie różnego przebiegu.

Pozytywny wynik nie zatwierdza automatycznie sklepu, waluty, metaprogresji ani szerokiej produkcji zawartości.

## Ukończone milestone'y

- PRD 000 — Milestone'y 0–3: pierwsze posiadanie, grywalny pionowy przekrój, E2E i bramka `proceed`; szczegóły w `docs/archive/roadmap/prd-000.md`.
- PRD 001 — Milestone'y 4–7: pełny mecz, aktywna obrona, E2E i bramka `proceed`; szczegóły w `docs/archive/roadmap/prd-001.md`.
