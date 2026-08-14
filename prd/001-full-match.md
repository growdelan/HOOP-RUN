# PRD 001 — Pełny mecz 3 na 3

- Status: gotowy do planowania, z otwartymi pytaniami balansowymi.
- Data: 2026-08-14.
- Typ: przyrostowy PRD funkcjonalności.
- Poprzedni zakres: `prd/000-initial-prd.md`.
- Źródło: pierwotna koncepcja HOOP-RUN, wynik bramki PRD 000 `proceed` oraz wywiad produktowy dotyczący pełnego meczu.

## 1. Kontekst

PRD 000 potwierdziło, że pojedyncze ofensywne posiadanie oparte na kartach może tworzyć czytelny taktyczny puzzle. Gracz potrafi odczytać zamiar obrony, zbudować korzystną sekwencję, otrzymać wyjaśnialną jakość rzutu i odtworzyć wynik dla tego samego seeda.

Pojedyncze posiadanie nie odpowiada jednak jeszcze na pytania właściwe dla koszykówki jako meczu:

- czy wynik tworzy napięcie większe niż abstrakcyjne punkty życia,
- czy naprzemienne role ataku i obrony utrzymują zaangażowanie,
- czy decyzje pozostają interesujące po kilku posiadaniach,
- czy gracz czuje odpowiedzialność za wynik po obu stronach boiska,
- czy osobne talie ataku i obrony tworzą różnorodność bez systemów runu.

PRD 001 rozszerza działające posiadanie do jednego kompletnego meczu przeciw jednej drużynie sterowanej przez grę. Nie wprowadza jeszcze mapy runu, nagród ani trwałej progresji.

## 2. Odbiorcy

Odbiorcy pozostają zgodni z PRD 000:

- gracze taktycznych deckbuilderów i roguelite'ów,
- gracze zainteresowani koszykówką bez zręcznościowego sterowania zawodnikami,
- osoby oczekujące krótkich sesji, czytelnych zamiarów przeciwnika i budowania synergii.

Gracz nie musi znać zaawansowanej terminologii koszykarskiej. Karty defensywne, plany przeciwnika i zmiany jakości muszą wyjaśniać swoje znaczenie w interfejsie.

## 3. Problem produktowy

Pełny mecz nie może być jedynie wielokrotnym uruchomieniem tego samego posiadania. Powinien tworzyć narastający kontekst:

- aktualny wynik wpływa na wartość bezpiecznego rzutu za 1 i ryzykownego rzutu za 2,
- role ataku i obrony regularnie się zmieniają,
- stan osobnych talii ogranicza powtarzanie identycznej kombinacji,
- przeciwnik ujawnia wystarczająco dużo planu, aby obrona była decyzją, a nie zgadywaniem,
- końcówka meczu ma tworzyć napięcie bez niekontrolowanego wydłużania rozgrywki.

## 4. Główna hipoteza

> Czy seria naprzemiennych posiadań ofensywnych i defensywnych, połączona rzeczywistym wynikiem meczu, tworzy napięty 8–12-minutowy mecz bez popadania w powtarzalność?

Hipoteza pomocnicza:

> Czy uproszczona aktywna obrona z osobną ręką kart daje graczowi poczucie wpływu na wynik, nie kopiując całego systemu ofensywnego jeden do jednego?

## 5. Cele

- Zbudować kompletny mecz od wyniku `0:0` do zwycięstwa albo porażki.
- Regularnie przełączać gracza między aktywnym atakiem i aktywną obroną.
- Wykorzystać wynik jako źródło napięcia oraz decyzji o wartości i ryzyku rzutu.
- Zweryfikować osobne, utrzymujące stan talie ataku i obrony.
- Zapewnić jednego czytelnego przeciwnika z kilkoma planami, do których można się dostosować.
- Zachować wyjaśnialność rezultatów, deterministyczność i szybkie powtarzanie meczu.
- Utrzymać typowy czas meczu w granicach 8–12 minut.

## 6. Poza zakresem

- mapa runu, rozgałęzienia trasy i kolejne regiony,
- nagrody po meczu, draft kart, trening, sklep i sprzęt,
- rekrutacja zawodników i budowanie składu,
- metaprogresja i zapis kampanii,
- wielu przeciwników, elity i bossowie,
- zbiórki ofensywne i defensywne jako osobna faza,
- kontry i tryb `Transition`,
- faule, rzuty wolne i dogrywka czasowa,
- zmęczenie, kontuzje, morale i zmiany składu,
- pełna symetria zasad ataku gracza i ataku przeciwnika,
- finalny balans talii, statystyk i prawdopodobieństw,
- finalna oprawa, rozbudowane animacje i audio,
- backend, multiplayer, rankingi i zapis w chmurze,
- osobny layout mobilny.

## 7. Format meczu

### 7.1. Punktacja

- Mecz zaczyna się od wyniku `0:0`.
- Rzut z `paint` albo przyszłej strefy wewnątrz łuku jest wart 1 punkt.
- Rzut ze strefy obwodowej za łukiem jest wart 2 punkty.
- Drużyna wygrywa po zdobyciu co najmniej 11 punktów i uzyskaniu przewagi co najmniej 2 punktów.
- Mecz ma twardy limit 15 punktów: pierwsza drużyna, która osiągnie 15, wygrywa niezależnie od przewagi.

Przykłady:

- `11:9` kończy mecz,
- `11:10` nie kończy meczu,
- `12:10` kończy mecz,
- `14:14` nie kończy meczu,
- `15:14` kończy mecz.

### 7.2. Kolejność posiadań

- Posiadania są ściśle naprzemienne.
- Po każdym rzucie, pudle, trafieniu, stracie albo końcu czasu piłka przechodzi do drugiej drużyny.
- Trafienie nie pozwala zachować piłki.
- W pierwszym prototypie pełnego meczu gracz rozpoczyna w ataku.
- Rola gracza jest zawsze jawna: `ATAK` albo `OBRONA`.

### 7.3. Koniec posiadania

Posiadanie kończy się przez:

- trafiony rzut,
- niecelny rzut,
- stratę,
- wyczerpanie zegara akcji.

Pudło nie uruchamia walki o zbiórkę. Strata ani zbiórka nie uruchamiają kontry. Następuje podsumowanie, a później kolejne ustawione posiadanie.

## 8. Struktura meczu

1. Gra tworzy deterministyczny stan meczu z wybranego seeda.
2. Wynik zaczyna się od `0:0`, a gracz rozpoczyna w ataku.
3. Gra przygotowuje odpowiednią talię, rękę, ustawienie boiska i zegar akcji.
4. Gracz rozgrywa ofensywne albo defensywne posiadanie.
5. Gra rozstrzyga posiadanie i aktualizuje wynik.
6. Ekran podsumowania pokazuje rezultat, przyczyny, nowy wynik i następną rolę.
7. Gracz wybiera `Dalej`.
8. Rola zmienia się, a gra rozpoczyna kolejne posiadanie.
9. Kroki 3–8 powtarzają się do spełnienia warunku zwycięstwa.
10. Gra pokazuje podsumowanie wygranego albo przegranego meczu i pozwala rozpocząć rewanż z tym samym seedem lub nowy mecz.

## 9. Ofensywne posiadanie gracza

- Podstawą pozostaje działający system z PRD 000.
- Gracz odczytuje intencję defensywną przeciwnika, zagrywa legalne karty, płaci czasem i tworzy `Advantage`.
- Posiadanie kończy się rzutem, stratą albo końcem czasu.
- Jakość rzutu i wynik pozostają wyjaśnialne przez nazwane modyfikatory.
- Wynik rzutu przekłada się na 0, 1 albo 2 punkty zgodnie ze strefą.
- Kolejne ofensywne posiadania korzystają z utrzymującego się stanu talii ofensywnej, ale zaczynają z nowym ustawieniem posiadania, zegarem i zerowym `Advantage`.

PRD nie wymaga nowych ofensywnych mechanik poza tymi, które są niezbędne do utworzenia działającej talii meczowej i różnych rąk.

## 10. Defensywne posiadanie gracza

### 10.1. Model reakcji

Obrona jest aktywna, ale prostsza od ofensywy:

1. Przeciwnik ujawnia archetyp planu całego posiadania.
2. Przeciwnik ujawnia swoją najbliższą akcję.
3. Gracz wybiera jedną legalną kartę defensywną i wymagany cel.
4. Silnik rozstrzyga relację akcji przeciwnika i odpowiedzi gracza.
5. Stan boiska, zegar, przewaga przeciwnika i informacja zwrotna są aktualizowane.
6. Jeśli posiadanie się nie zakończyło, przeciwnik ujawnia kolejną akcję i cykl się powtarza.
7. Posiadanie kończy się rzutem przeciwnika, stratą albo końcem czasu.

### 10.2. Informacja o planie

Gracz widzi:

- nazwę archetypu planu, np. `Pick & Roll`,
- krótki opis celu planu,
- najbliższą akcję przeciwnika, np. `Screen`,
- wykonującego i istotny cel, jeśli jest to potrzebne do podjęcia decyzji.

Gracz nie widzi od początku kompletnej przyszłej sekwencji przeciwnika.

### 10.3. Minimalne mechaniki defensywne

Pierwsza talia defensywna powinna pozwalać wyrazić co najmniej następujące rodzaje decyzji:

- `Pressure` — presja na zawodniku z piłką i zwiększanie kosztu czasu,
- `Switch` — zmiana krycia po zasłonie,
- `Go Under` — ograniczenie wejścia kosztem ryzyka rzutu z obwodu,
- `Help Defense` — pomoc przy wejściu do `paint` kosztem pozostawienia innego zawodnika,
- `Double Team` — zwiększenie szansy straty kosztem otwarcia partnera.

Nazwy, dokładne wartości i liczba kopii są parametrami prototypu. Każda karta musi mieć czytelny koszt, warunek legalności, przewidywany efekt i ryzyko.

### 10.4. Zegar i rezultat obrony

- Karta defensywna zużywa czas z zegara akcji przeciwnika.
- Skuteczna presja może zwiększyć koszt następnej akcji albo bezpośrednio zużyć dodatkowy czas.
- Osiągnięcie zera kończy posiadanie przeciwnika bez punktów.
- Reakcja obrony może zmniejszyć przewagę przeciwnika, pogorszyć jakość rzutu albo wymusić stratę.
- Ryzykowna albo źle dobrana reakcja może poprawić pozycję przeciwnika.
- Rzut przeciwnika używa tego samego wyjaśnialnego modelu jakości i seedowanej losowości co rzut gracza.

## 11. Przeciwnik

Zakres obejmuje jedną drużynę przeciwną z:

- trzema rozróżnialnymi zawodnikami,
- co najmniej trzema rozpoznawalnymi planami ofensywnymi,
- kilkoma intencjami defensywnymi używanymi podczas ataku gracza,
- deterministycznym wyborem planu i akcji dla podanego seeda,
- logiką, która nie zna przyszłych wyborów gracza i nie zmienia planu po fakcie bez jawnej reguły.

Plany powinny testować różne odpowiedzi, np. ochronę przed wejściem, zasłoną albo rzutem z obwodu. Dokładna tożsamość drużyny, nazwy zawodników i balans pozostają do ustalenia podczas planowania zawartości prototypowej.

## 12. Talie i ręce

### 12.1. Osobne talie

Gracz ma dwie niezależne talie:

- talię ofensywną używaną tylko podczas własnych posiadań,
- talię defensywną używaną tylko podczas posiadań przeciwnika.

### 12.2. Cykl kart

- Stan obu talii utrzymuje się przez cały mecz.
- Każda talia ma własny stos dobierania, rękę i stos odrzuconych.
- Na początku odpowiedniego posiadania gracz dobiera do pięciu kart.
- Zagrane karty trafiają na stos odrzuconych po rozstrzygnięciu.
- Niewykorzystane karty trafiają na stos odrzuconych po zakończeniu posiadania.
- Gdy stos dobierania nie wystarcza, właściwy stos odrzuconych jest tasowany deterministycznie z użyciem RNG meczu.
- Talia nie jest modyfikowana pomiędzy posiadaniami w zakresie PRD 001.

Dokładny rozmiar talii oraz liczba kopii kart są parametrami balansowymi, ale talia musi być wystarczająco duża, aby kolejne ręce nie były zawsze identyczne.

## 13. Podsumowanie między posiadaniami

Po każdym posiadaniu gra zatrzymuje przepływ i pokazuje:

- rezultat: trafienie, pudło, strata albo koniec czasu,
- zdobyte punkty,
- poprzedni i aktualny wynik,
- najważniejsze przyczyny rezultatu,
- następną rolę gracza,
- przycisk `Dalej`.

Przejście nie jest automatyczne. Podsumowanie nie może wymagać przeładowania strony i nie może resetować stanu meczu ani talii.

## 14. Podsumowanie meczu

Po spełnieniu warunku zwycięstwa gra pokazuje:

- `ZWYCIĘSTWO` albo `PORAŻKA`,
- końcowy wynik,
- liczbę posiadań obu drużyn,
- liczbę trafień, pudeł, strat i końców czasu,
- podstawowe porównanie skuteczności ataku i obrony,
- możliwość rewanżu z tym samym seedem,
- możliwość rozpoczęcia nowego meczu z nowym seedem.

Nagrody i przejście do mapy runu pozostają poza zakresem.

## 15. Wymagania funkcjonalne

### FR-101 — Stan meczu

Gra przechowuje serializowalny stan wyniku, aktywnej drużyny, numeru posiadania, roli gracza, talii, RNG i historii rezultatów.

### FR-102 — Warunek zwycięstwa

Gra poprawnie rozstrzyga regułę `do 11, przewaga 2, maksymalnie do 15` dla wszystkich wyników brzegowych.

### FR-103 — Naprzemienne posiadania

Każde zakończenie posiadania przełącza stronę atakującą dokładnie raz, niezależnie od rezultatu.

### FR-104 — Punktacja stref

Trafiony rzut dodaje 1 albo 2 punkty zgodnie ze strefą rzutu; pudło, strata i koniec czasu nie zmieniają wyniku.

### FR-105 — Talia ofensywna

Ofensywne posiadania korzystają z osobnego, utrzymującego stan cyklu dobierania i odrzucania.

### FR-106 — Talia defensywna

Defensywne posiadania korzystają z osobnego, utrzymującego stan cyklu dobierania i odrzucania.

### FR-107 — Plan przeciwnika

Przed decyzją defensywną widoczny jest archetyp planu oraz aktualna akcja przeciwnika, ale nie cała przyszła sekwencja.

### FR-108 — Reakcja defensywna

Gracz wybiera legalną kartę odpowiedzi, a gra wyjaśnia jej wpływ na zegar, stan boiska, przewagę przeciwnika i jakość możliwego rzutu.

### FR-109 — Rozstrzygnięcie przeciwnika

Przeciwnik może zakończyć posiadanie trafieniem, pudłem, stratą albo końcem czasu, a wynik jest deterministyczny dla seeda i decyzji gracza.

### FR-110 — Podsumowanie posiadania

Po każdym posiadaniu gra pokazuje wynik i przyczynę, a kolejne posiadanie zaczyna się dopiero po wybraniu `Dalej`.

### FR-111 — Podsumowanie meczu

Po zwycięstwie albo porażce gra blokuje dalsze akcje meczowe i pokazuje statystyki oraz opcje rewanżu lub nowego meczu.

### FR-112 — Powtarzalność

Ten sam seed oraz identyczne decyzje ofensywne i defensywne dają identyczny przebieg, ręce, plany przeciwnika, wynik i statystyki końcowe.

## 16. Sterowanie i informacja zwrotna

- Podstawowe sterowanie nadal działa myszą.
- Interfejs zawsze pokazuje wynik, cel punktowy, aktywną rolę i zegar posiadania.
- Gracz może odróżnić własną rękę ofensywną od defensywnej bez polegania wyłącznie na kolorze.
- Aktualna akcja przeciwnika i możliwe konsekwencje odpowiedzi są czytelne przed wyborem karty.
- Nielegalna karta podaje stabilny, konkretny powód i nie zmienia stanu ani RNG.
- Zmiana wyniku jest pokazana przed rozpoczęciem następnego posiadania.
- Animacje nie mogą ukrywać ręki, wyniku, planu przeciwnika ani informacji o rezultacie.

## 17. Kryteria akceptacji

1. Gracz może przejść od `0:0` do legalnie rozstrzygniętego zwycięstwa albo porażki bez przeładowania strony.
2. Wyniki `11:9`, `11:10`, `12:10`, `14:14` i `15:14` są rozstrzygane zgodnie z ustalonymi regułami.
3. Po każdym posiadaniu rola przełącza się dokładnie raz, również po trafieniu, pudle, stracie i końcu czasu.
4. Trafienia z `paint` i obwodu przyznają odpowiednio 1 i 2 punkty.
5. Co najmniej dwa ofensywne posiadania gracza mogą rozpocząć się z różnymi rękami bez modyfikowania talii podczas meczu.
6. Co najmniej dwa defensywne posiadania mogą wymagać różnych odpowiedzi ze względu na ujawniony plan albo akcję przeciwnika.
7. Przeciwnik używa co najmniej trzech rozpoznawalnych planów ofensywnych w kontrolowanych testach.
8. Gracz może użyć defensywy do pogorszenia rzutu, wymuszenia straty albo doprowadzenia do końca czasu.
9. Źle dobrana karta defensywna może obserwowalnie poprawić sytuację przeciwnika.
10. Stan talii ofensywnej i defensywnej utrzymuje się niezależnie przez cały mecz i odtwarza się dla tego samego seeda.
11. Podsumowanie każdego posiadania pokazuje rezultat, punkty, przyczyny i następną rolę przed przejściem dalej.
12. Podsumowanie meczu pokazuje końcowy wynik, podstawowe statystyki oraz działający rewanż z tym samym seedem.
13. Krytyczne reguły meczu, talii, przeciwnika, obrony, punktacji i deterministyczności mają testy bez uruchamiania Phasera.
14. Produkcyjny build i przepływ E2E działają pod `/HOOP-RUN/` bez blokujących błędów konsoli lub brakujących zasobów.
15. Pełny playtest obejmuje co najmniej jeden wygrany i jeden przegrany mecz oraz dwa istotne viewporty desktopowe.

## 18. Miary powodzenia hipotezy

Pełny mecz uzasadnia przejście do projektowania runu, jeśli playtest potwierdzi, że:

- typowy ukończony mecz trwa około 8–12 minut,
- gracz rozumie, kiedy jest w ataku, kiedy w obronie i dlaczego zmienił się wynik,
- wynik wpływa na decyzję między rzutem za 1 i rzutem za 2 przynajmniej w końcówce meczu,
- co najmniej dwa ofensywne posiadania wymagają różnych sekwencji ze względu na rękę albo intencję obrony,
- co najmniej dwa defensywne posiadania wymagają różnych odpowiedzi na plan przeciwnika,
- gracz potrafi wskazać, jak jego decyzja defensywna poprawiła albo pogorszyła rezultat,
- porażka jest wyjaśnialna decyzjami, jakością pozycji i jawną losowością, a nie ukrytym bonusem AI,
- po pierwszym meczu istnieje chęć rewanżu albo zmiany sposobu gry.

Pierwsza walidacja może być wewnętrzna, ale przed rozpoczęciem szerokiej produkcji przeciwników, kart i systemów runu potrzebny jest co najmniej jeden test z osobą nieznającą projektu.

## 19. Ograniczenia techniczne

- Obowiązuje stos TypeScript `strict`, Phaser, Vite, npm, Vitest i Playwright.
- Reguły pełnego meczu, obrony i przeciwnika pozostają niezależne od Phasera.
- Stan meczu, talii i przeciwnika jest typowany, serializowalny i niemutujący na granicy redukcji domenowej.
- Wszystkie tasowania, wybory planów AI i rozstrzygnięcia używają wstrzykiwanego RNG.
- Logika domenowa nie używa bezpośrednio `Math.random()`.
- Build pozostaje statyczny i działa na GitHub Pages pod `/HOOP-RUN/` bez backendu.
- Nowe karty i plany przeciwnika powinny być definiowane jako dane oparte na współdzielonych mechanikach.
- Implementacja nie może zepsuć deterministycznego pionowego przekroju PRD 000.

## 20. Ryzyka

### R-101 — Powtarzalność posiadań

Mecz może wyglądać jak wielokrotne rozwiązanie tego samego puzzla. Ograniczenie: utrzymujące stan talie, różne ręce, kilka planów przeciwnika i zmienne intencje defensywne.

### R-102 — Obrona jako oczywisty kontr

Jeżeli każda akcja przeciwnika ma jedną bezwarunkowo poprawną odpowiedź, obrona stanie się testem pamięci. Ograniczenie: karty z kosztami i kompromisami oraz plany, które mogą mieć więcej niż jedną rozsądną odpowiedź.

### R-103 — Obrona jako zgadywanie

Zbyt mała ilość informacji odbierze graczowi poczucie wpływu. Ograniczenie: jawny archetyp planu, aktualna akcja, wykonujący i czytelne ryzyko karty.

### R-104 — Zbyt długi mecz

Reguła przewagi dwóch punktów może przedłużać końcówkę. Ograniczenie: twardy limit 15 punktów i pomiar czasu pełnych playtestów.

### R-105 — Losowość talii dominuje wynik

Zła ręka może być odbierana jako automatycznie przegrane posiadanie. Ograniczenie: minimalna liczba legalnych odpowiedzi, deterministyczne testy rozkładu rąk i brak kart całkowicie martwych poza świadomym ryzykiem buildów.

### R-106 — Zakres rośnie do pełnej symulacji

Zbiórki, kontry, faule i pełna symetria AI mogą opóźnić walidację podstawowego meczu. Ograniczenie: każde posiadanie kończy się przed zbiórką lub przejściem do `Transition`.

### R-107 — Wynik przesłania przyczyny

Szybkie przejście może utrudnić zrozumienie, dlaczego padły punkty. Ograniczenie: obowiązkowe podsumowanie posiadania i ręczne `Dalej`.

## 21. Fakty ustalone z użytkownikiem

- Główna hipoteza dotyczy napięcia i różnorodności serii naprzemiennych posiadań.
- Mecz ma zawierać aktywny atak i aktywną, uproszczoną obronę gracza.
- Atak i obrona korzystają z osobnych talii i rąk.
- Mecz jest rozgrywany do 11 punktów, z wymaganą przewagą 2 i twardym limitem 15.
- Punktacja uliczna przyznaje 1 punkt za rzut wewnątrz łuku i 2 punkty za rzut zza łuku.
- Posiadania są ściśle naprzemienne niezależnie od rezultatu.
- Stan obu talii utrzymuje się przez cały mecz.
- Na początku posiadania gracz dobiera do pięciu kart, a niewykorzystana ręka jest odrzucana po posiadaniu.
- Podczas obrony gracz widzi archetyp planu przeciwnika i jego najbliższą akcję, ale nie całą sekwencję.
- Zakres obejmuje jedną drużynę przeciwną z co najmniej trzema planami ofensywnymi i kilkoma intencjami defensywnymi.
- Pudło, strata i koniec czasu kończą posiadanie bez zbiórki i kontry.
- Pomiędzy posiadaniami występuje zatrzymane podsumowanie z przyciskiem `Dalej`.
- Defensywne posiadanie składa się z kolejnych ujawnionych akcji przeciwnika i pojedynczych odpowiedzi kartami gracza.
- Karty defensywne zużywają czas z zegara przeciwnika, a presja może doprowadzić do końca czasu.

## 22. Założenia do zweryfikowania

- Gracz rozpoczyna pierwszy prototyp pełnego meczu w ataku.
- Ręka pięciu kart pozostaje czytelna także przy regularnym przełączaniu talii.
- Jedna drużyna z trzema planami wystarczy do oceny różnorodności całego meczu.
- Uproszczona obrona może dać poczucie wpływu bez własnego systemu budowania sekwencji tak głębokiego jak ofensywa.
- Odrzucanie całej niewykorzystanej ręki po posiadaniu zapewni różnorodność bez nadmiernej losowości.
- Uliczna punktacja 1/2 i limit 15 utrzymają typowy mecz w granicach 8–12 minut.
- Dotychczasowa topologia stref wystarczy do rozróżnienia rzutów za 1 i 2 w pierwszym pełnym meczu.

## 23. Otwarte pytania

Pytania powinny zostać rozstrzygnięte podczas planowania albo balansu prototypu i nie wymagają ponownego wywiadu produktowego, o ile nie zmienią ustalonego zakresu:

1. Ile kart i kopii poszczególnych mechanik zawierają startowe talie ataku i obrony?
2. Jak dokładnie karty defensywne modyfikują zegar, przewagę, krycie, stratę i jakość rzutu przeciwnika?
3. Jakie trzy plany ofensywne najlepiej reprezentują pierwszą drużynę przeciwną?
4. Jakie intencje defensywne przeciwnika zapewnią różne ofensywne posiadania bez dodawania drugiej drużyny?
5. Jak silnie wynik i aktualna faza końcówki powinny wpływać na wybór planu przez przeciwnika?
6. Czy interfejs defensywny pokazuje przewidywany kierunek zmiany jakości, czy również przybliżoną kategorię przed zagraniem?
7. Jakie statystyki podsumowania najlepiej wyjaśniają wynik bez przeciążania ekranu?
8. Jaki kontrolowany zestaw seedów zapewni test wygranej, porażki, wyrównanej końcówki i wszystkich planów przeciwnika?

## 24. Bramka po PRD 001

Po implementacji i playteście pełnego meczu należy wybrać jeden z wyników:

1. `proceed` — pełny mecz utrzymuje napięcie i różnorodność; można przygotować PRD pierwszej pętli runu,
2. `iterate` — mecz jest obiecujący, ale tempo, obrona albo talie wymagają ograniczonej korekty,
3. `rethink` — seria posiadań jest powtarzalna albo obrona nie daje poczucia wpływu; nie rozpoczynać systemów runu.

Pozytywny wynik nie zatwierdza automatycznie dużej produkcji kart, przeciwników ani metaprogresji. Zakres runu wymaga osobnego PRD.
