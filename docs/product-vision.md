# HOOP-RUN — Gwiazda północna produktu

## Status dokumentu

- Rola: trwały opis docelowej wizji produktu i kryterium spójności kolejnych decyzji.
- Źródła: pierwotna rozmowa koncepcyjna, zaakceptowany kierunek `Basketball × Slay the Spire`, PRD 000–002 oraz wyniki dotychczasowych playtestów.
- Dokument nie jest backlogiem ani zgodą na implementację wszystkich opisanych systemów.
- Każdy nowy zakres nadal wymaga osobnego PRD, planu, mierzalnej hipotezy i walidacji.

## 1. Jednozdaniowa wizja

> HOOP-RUN to taktyczny roguelite deckbuilder o ulicznej koszykówce 3 na 3, w którym każde posiadanie jest puzzlem, a podczas runu gracz buduje coraz bardziej niezwykły playbook zmieniający sposób gry w koszykówkę.

Hasło produktu:

> **Build the play. Break the defense.**

## 2. Fantazja gracza

Gracz prowadzi własną drużynę ulicznej koszykówki od lokalnego boiska do finału wielkiego turnieju. Nie wygrywa dzięki zręcznościowemu sterowaniu każdym krokiem zawodnika ani przez bezpośrednie zwiększanie statystyk. Wygrywa, ponieważ:

- czyta ustawienie i zamiar przeciwnika,
- konstruuje akcję z prawdziwych decyzji koszykarskich,
- świadomie wybiera ryzyko i wartość rzutu,
- rozwija talię, zawodników i synergie drużyny,
- dostosowuje styl do kolejnych rywali,
- podczas każdego runu odkrywa inny sposób „łamania” zasad koszykówki.

Docelowe uczucie gracza brzmi:

> „Zobaczyłem problem w obronie, zbudowałem właściwą sekwencję i sam stworzyłem tę pozycję”.

Nie:

> „Kliknąłem kartę rzutu i miałem szczęście”.

## 3. Tożsamość produktu

### 3.1. Kierunek zaakceptowany

HOOP-RUN rozwija kierunek `Basketball × Slay the Spire` z elementami balatro-podobnego naginania reguł:

- gra jest turowa i taktyczna,
- akcje wykonuje się kartami,
- pozycje zawodników i piłki są widoczne na boisku,
- przeciwnik ujawnia zamiary,
- wynik meczu zastępuje punkty życia,
- zegar akcji zastępuje abstrakcyjną energię,
- build może zmieniać reguły, a nie tylko liczby.

### 3.2. Kierunki odrzucone jako fundament

Gra nie jest:

- zręcznościową symulacją w stylu NBA 2K,
- grą akcji `NBA Jam × Hades`,
- klasycznym RPG z koszykarską warstwą wizualną,
- kopią Slay the Spire, w której obrażenia nazwano punktami,
- generatorem procentów bez przestrzennego stanu boiska,
- grindem trwałych bonusów statystycznych.

Animacje i widowiskowość mogą później wzmacniać rezultat decyzji, ale nie zastępują taktycznego rdzenia.

## 4. Obietnica doświadczenia

HOOP-RUN ma konsekwentnie spełniać pięć obietnic.

### 4.1. Każde posiadanie jest małą zagadką

Gracz widzi intencję, zegar, pozycje, krycie, piłkę i rękę kart. Musi zbudować sekwencję, a nie wybrać pojedynczy „atak”.

### 4.2. Koszykówka ma znaczenie mechaniczne

`Screen`, `Drive`, `Kick Out`, `Backdoor Cut`, `Switch` albo `Help Defense` mają zachowywać się jak decyzje koszykarskie. Nazwa i grafika nie mogą być jedynie tematyczną nakładką na obrażenia i blok.

### 4.3. Dobry rzut jest wypracowany

Rzut jest rezultatem całej akcji. Jego jakość wynika między innymi z pozycji, presji, przewagi, podań, zasłon i reakcji obrony. Losowość rozstrzyga próbę, ale przyczyny prawdopodobieństwa są jawne.

### 4.4. Każdy run zmienia sposób gry

Najlepszy build nie daje po prostu `+20% do wszystkiego`. Powinien prowadzić do rozpoznawalnej tożsamości, na przykład:

- gry opartej wyłącznie na Pick & Roll i lobach,
- ruchu bez piłki i wielu podaniach,
- izolacjach jednego zawodnika,
- serii rzutów z dystansu,
- obrony generującej przechwyty i kontry,
- dominacji paint i zbiórek,
- ryzykownego stylu zmieniającego wartość punktów.

### 4.5. Przeciwnik jest problemem do rozwiązania

Każda drużyna i boss mają własny styl, który zmusza do adaptacji. Trudność powinna pochodzić z jawnych reguł, planów i synergii, a nie z ukrytego bonusu AI.

## 5. Docelowy rdzeń meczu

### 5.1. Format

- koszykówka 3 na 3,
- krótkie mecze uliczne,
- wynik zamiast HP,
- aktywny atak i aktywna obrona,
- osobne talie obu ról,
- około 8–12 minut na mecz,
- około 10–20 istotnych posiadań zamiast symulacji pełnego wyniku NBA.

Aktualnie zweryfikowany format to `do 11`, przewaga 2 i twardy limit 15, z punktacją 1/2. Jest to działająca reguła produktu, ale przyszły specjalny przeciwnik lub wydarzenie może jawnie ją naginać.

### 5.2. Jedno posiadanie

Kanoniczny rytm posiadania:

```text
odczytaj intencję i ustawienie
  → dobierz właściwą sekwencję kart
  → przesuń piłkę i zawodników
  → wywołaj reakcję obrony
  → stwórz albo strać przewagę
  → wybierz wartość i ryzyko rzutu
  → zobacz wyjaśnialny rezultat
```

Przykład akcji oddającej istotę gry:

```text
Screen
  → Reject Screen
  → Drive
  → Help Defense
  → Kick Out
  → Extra Pass
  → Corner Shot
```

### 5.3. Zasoby meczu

- `Shot Clock` — czas jako koszt decyzji i odpowiednik energii.
- `Advantage` — jawna przewaga stworzona przez sekwencję.
- `Shot Quality` — wyjaśnialna jakość końcowej pozycji.
- wynik — kontekst decyzji o bezpiecznym 1 punkcie albo ryzykownych 2 punktach.
- pozycje i krycie — przestrzenny stan, bez którego karty tracą znaczenie.

### 5.4. Obrona

Obrona nie jest biernym blokiem. Gracz widzi plan i bieżącą akcję przeciwnika, a następnie reaguje między innymi przez:

- presję na piłkę,
- zmianę krycia,
- przejście pod zasłoną,
- pomoc z innej strefy,
- podwojenie,
- contest rzutu,
- przyszłe decyzje dotyczące zbiórki i powrotu do obrony.

Każda odpowiedź ma kompromis. Podwojenie może wymusić stratę, ale odsłania partnera. Pomoc zatrzymuje wejście, ale otwiera odegranie. Przejście pod zasłoną chroni paint, ale oddaje przestrzeń do rzutu.

## 6. Drużyna i build

### 6.1. Zawodnicy

Docelowo każdy zawodnik ma:

- rozpoznawalną rolę i archetyp,
- własne mocne oraz słabe strony,
- zestaw kart albo wpływ na talię drużyny,
- pasywną zdolność wspierającą określony styl,
- wartość wynikającą z synergii, nie tylko sumy statystyk.

Przykładowe archetypy:

- `Playmaker` — podania, tempo, tworzenie pozycji,
- `Sniper` — rzuty za 2 i serie trafień,
- `Slasher` — wejścia, wykończenia i wymuszanie pomocy,
- `Big Man` — zasłony, paint, bloki i zbiórki,
- `Defender` — presja, przechwyty i kontry,
- `Wildcard` — nietypowe reguły i hybrydowe buildy.

### 6.2. Skład podczas runu

Aspiracyjny model zakłada rozpoczęcie runu kapitanem, a następnie draft albo rekrutację pozostałych zawodników. Sam wybór składu ma być częścią budowania talii:

- Playmaker może wspierać ruch piłki,
- Shooter nagradzać tworzenie czystych pozycji,
- Center otwierać Pick & Roll, zbiórki albo ochronę obręczy.

Dokładny moment draftu i sposób łączenia talii zawodników pozostają przyszłą decyzją produktową.

### 6.3. Trener jako klasa runu

Trener może docelowo pełnić rolę zbliżoną do klasy lub postaci startowej w deckbuilderze:

- trener ruchu — podania, cięcia i gra bez piłki,
- trener tempa — szybkie akcje, transition i rzuty z dystansu,
- trener defensywny — presja, zbiórki, paint i kontrola wyniku.

Trener powinien zmieniać reguły budowania akcji, a nie tylko przyznawać bazowe statystyki.

## 7. Karty, synergie i naginanie reguł

### 7.1. Karty jako playbook

Karty reprezentują elementy koszykarskiego playbooka:

- ruch i kozłowanie,
- podania,
- zasłony,
- cięcia bez piłki,
- wejścia i wykończenia,
- rzuty,
- reakcje defensywne,
- zbiórki i transition w przyszłych zakresach.

Kod powinien implementować współdzielone mechaniki, a zawartość składać je w wiele kart. Dzięki temu duża pula kart nie wymaga osobnej logiki dla każdego egzemplarza.

### 7.2. Przykładowe tożsamości buildów

- `Pick & Roll`: `Screen → Drive → Roll → Lob`.
- `Beautiful Game`: wielu różnych zawodników uczestniczy w akcji i zwiększa jakość rzutu.
- `Iso`: kolejne karty jednego zawodnika budują potężne zakończenie.
- `Three Point`: relokacja, catch-and-shoot, serie trafień i zwiększanie wartości rzutu.
- `Paint`: wejścia, post play, wsady i presja na obręcz.
- `Defense to Offense`: blok albo przechwyt uruchamiający szybką kontrę.

### 7.3. Efekty zmieniające reguły

Najbardziej pamiętne nagrody mogą naginać koszykówkę w stylu Balatro, na przykład:

- seria trafionych rzutów zwiększa ich wartość, ale pudło resetuje premię,
- piłka dotykająca wszystkich trzech zawodników daje dodatkowy punkt,
- wsady wytwarzają `Hype`, który uruchamia specjalny efekt,
- ryzykowny build wzmacnia rzuty z dystansu kosztem obrony,
- bloki albo zbiórki odnawiają część zegara,
- określona sekwencja kart tworzy wyjątkowy finisher.

Takie efekty muszą pozostać czytelne, testowalne i mieć koszt albo warunek. Nie mogą zamieniać meczu w nieprzewidywalny chaos.

## 8. Docelowa pętla runu

Pełna aspiracyjna struktura:

```text
wybór kapitana, trenera albo archetypu
  → mecz
  → nagroda i rozwój playbooka
  → wybór trasy
  → trening, rekrutacja, sklep albo wydarzenie
  → kolejny mecz lub elita
  → boss regionu
  → następny dystrykt
  → finały
```

Jeden run prowadzi drużynę od lokalnego boiska przez kolejne dzielnice lub regiony do finału turnieju.

### 8.1. Potencjalne węzły mapy

- `Match` — standardowe spotkanie.
- `Elite Match` — trudniejszy rywal i lepsza nagroda.
- `Training Court` — rozwój karty albo zawodnika.
- `Street Recruiter` — rekrutacja lub wymiana członka składu.
- `Shop` — sprzęt i inne zasoby runu.
- `Sponsor` — mocna korzyść związana z warunkiem lub zobowiązaniem.
- `Locker Room` — regeneracja, rozmowa albo zarządzanie drużyną.
- `Random Event` — decyzja narracyjna albo zmiana reguł.
- `Boss` — specjalny przeciwnik zamykający region.

### 8.2. Aktualny krok w stronę wizji

PRD 002 celowo testuje tylko liniowy wariant:

```text
mecz
  → wybór 1 z 3 kart
  → trudniejszy mecz
  → wybór 1 z 3 kart
  → finałowy mecz
```

Brak mapy, sklepu i metaprogresji w tym prototypie jest kontrolowanym ograniczeniem, a nie zmianą docelowej wizji.

## 9. Przeciwnicy i bossowie

### 9.1. Drużyny jako encountery

Przeciwnik ma być mechanicznym problemem, nie tylko innym kolorem tokenów. Przykładowe kierunki:

- wysoka drużyna dominująca paint i zbiórki,
- strzelcy budujący serię rzutów za 2,
- obrońcy specjalizujący się w przechwytach,
- widowiskowa drużyna zasilająca własny `Hype`,
- szybka drużyna karząca każde pudło transition.

### 9.2. Bossowie zmieniający reguły

Boss powinien wymagać zmiany planu gry. Przykłady aspiracyjne:

- `The Wall` — pierwszy Drive każdego posiadania ma specjalną ochronę.
- `Run & Gun` — pudło gracza natychmiast uruchamia groźny fast break.
- `Iso King` — gwiazda rośnie w siłę z kolejnymi posiadaniami.
- `The Giant` — jeden dominujący zawodnik, wokół którego działa cała drużyna.
- `The Twins` — dwóch graczy wzmacniających się, gdy pozostają blisko.
- `The GOAT` — wielofazowy finał zmieniający styl między playmakingiem, rzutem, wejściem i obroną.

Reguła bossa jest ujawniona albo możliwa do jednoznacznego odczytania. Boss nie oszukuje przez niewidoczny bonus do RNG.

## 10. Przyszłe warstwy koszykówki

Poniższe systemy należą do wizji, lecz każdy wymaga osobnego PRD i dowodu, że wzmacnia rdzeń.

### 10.1. Zbiórki

Po pudle posiadanie nie musi zawsze się kończyć. Decyzja o walce na tablicy może zwiększać szansę ofensywnej zbiórki, ale odsłaniać drużynę na kontrę.

### 10.2. Transition

Przechwyt albo zbiórka może uruchamiać krótszy, odmienny tryb posiadania z ograniczonym zegarem i nieustawioną obroną. Karty transition mogą obejmować outlet pass, sprint, lob, eurostep, chase-down block i pull-up shot.

### 10.3. Hype i Takeover

Widowiskowe zagrania mogą generować `Hype`. Zapełnienie zasobu uruchamia krótką zdolność zależną od archetypu. System ma nagradzać charakter stylu, ale nie może przesłonić wyniku i `Advantage`.

### 10.4. Kondycja, morale i relacje

Zmęczenie, morale lub chemia drużyny mogą później wiązać decyzje meczu z zarządzaniem składem. Nie należy ich dodawać, dopóki prostsze systemy runu nie potwierdzą swojej wartości.

## 11. Progresja

### 11.1. Progresja w runie

Może obejmować:

- nowe karty,
- rozwidlone treningi kart zamiast jednego oczywistego `Card+`,
- rekrutację zawodników,
- trenerów i ich zasady,
- sprzęt działający jak relikty,
- sponsorów z korzyścią i warunkiem,
- zmiany składu i synergii.

### 11.2. Metaprogresja

Po porażce gracz może docelowo wracać do własnego boiska lub klubu. Metaprogresja powinna przede wszystkim odblokowywać:

- nowych zawodników i archetypy,
- nowe karty i style buildów,
- trenerów, sprzęt i wydarzenia,
- nowych przeciwników i boiska,
- wyzwania oraz alternatywne możliwości startowe.

Nie powinna opierać się na dużym trwałym zwiększaniu podstawowej siły drużyny. Gracz odblokowuje szersze możliwości, a nie obowiązkowy grind do `+20%`.

## 12. Prezentacja i ton

### 12.1. Czytelność przede wszystkim

Podstawowym widokiem jest taktyczne półboisko 2D z widocznymi:

- zawodnikami i piłką,
- strefami oraz liniami krycia,
- intencją i aktualną akcją,
- ręką kart,
- zegarem, wynikiem i przewagą,
- przewidywanymi skutkami decyzji.

Gra może zaczynać od stylizowanych tokenów. Czytelność relacji jest ważniejsza niż realizm grafiki.

### 12.2. Nagroda audiowizualna

Docelowo zatwierdzona sekwencja może przechodzić na kilka sekund z widoku taktycznego w płynną animację całej akcji. Gracz ogląda własny highlight będący rezultatem wcześniejszych decyzji.

Animacja:

- nie zmienia wyniku po fakcie,
- nie ukrywa przyczyn rezultatu,
- może zostać przyspieszona albo pominięta,
- wzmacnia satysfakcję, lecz nie stanowi osobnej zręcznościowej minigry.

### 12.3. Świat

Ton gry łączy uliczną koszykówkę, turniejową drogę od lokalnego boiska do finału oraz lekko przesadzoną energię roguelite. Kolejne dzielnice, drużyny i bossowie powinny mieć silną tożsamość wizualną i mechaniczną.

## 13. Zasady projektowe, których nie wolno zgubić

1. Karta musi zależeć od stanu koszykarskiego, nie tylko od liczby.
2. Pozycja piłki i zawodników musi mieć znaczenie.
3. Przygotowany rzut musi być obserwowalnie lepszy od rzutu bez przygotowania.
4. Losowość musi być jawna, deterministyczna dla seeda i wyjaśnialna.
5. Obrona musi dawać graczowi aktywną sprawczość.
6. Przeciwnik nie otrzymuje ukrytej wiedzy ani bonusu po fakcie.
7. Każda silna karta, relikt lub reguła ma warunek, koszt albo podatność.
8. Build powinien zmieniać sekwencje i priorytety, nie tylko procenty.
9. Nowa warstwa musi wzmacniać podstawowy puzzle posiadania.
10. Krótkie, mierzalne pionowe przekroje poprzedzają szeroką produkcję zawartości.
11. Interfejs wyjaśnia system bez podawania graczowi gotowego rozwiązania.
12. Mecz zachowuje napięcie prawdziwego wyniku zamiast abstrakcyjnego HP.

## 14. Antywzorce

Należy zatrzymać albo przeprojektować rozwiązanie, jeśli prowadzi do:

- kart typu „zadaj 6 obrażeń” przebranych za koszykówkę,
- decyzji, w której jedna karta jest zawsze poprawna,
- rzutu zależnego głównie od niewyjaśnionego RNG,
- drużyn różniących się jedynie statystykami,
- bossów z ukrytym mnożnikiem skuteczności,
- talii rosnącej bez kontroli i bez szansy użycia nagród,
- metaprogresji wymaganej do uczciwej wygranej,
- ekranu przeciążonego liczbami bez hierarchii informacji,
- animacji utrudniających odczytanie stanu,
- budowania mapy, ekonomii lub setek kart przed walidacją poprzedniej warstwy.

## 15. Horyzonty produktu

| Horyzont | Cel | Status |
|---|---|---|
| Posiadanie | Potwierdzić, że sekwencja kart tworzy koszykarski puzzle. | Zweryfikowany, PRD 000 `proceed`. |
| Pełny mecz | Potwierdzić napięcie wyniku, naprzemienne role i aktywną obronę. | Zweryfikowany, PRD 001 `proceed`. |
| Pierwszy run | Potwierdzić, że dwie nagrody zmieniają późniejsze decyzje w trzech meczach. | PRD 002 gotowy do planowania. |
| Mapa i ekonomia | Potwierdzić znaczenie trasy, treningu, sklepu i wydarzeń. | Aspiracja; brak PRD. |
| Drużyna | Potwierdzić draft, trenerów, archetypy i łączenie talii zawodników. | Aspiracja; brak PRD. |
| Głębszy mecz | Ocenić zbiórki, transition, Hype, kondycję i morale. | Aspiracja; brak PRD. |
| Metagra | Odblokowywać nowe możliwości bez trwałego grindu siły. | Aspiracja; brak PRD. |
| Produkcja | Rozbudować zawartość, oprawę, audio i dystrybucję. | Po walidacji systemów. |

## 16. Kryterium zgodności przyszłych decyzji

Nowy PRD albo system jest zgodny z gwiazdą północną, jeśli odpowiada pozytywnie na większość pytań:

- Czy wzmacnia fantazję budowania akcji i drużyny?
- Czy wykorzystuje prawdziwą relację koszykarską?
- Czy tworzy nową decyzję albo rozpoznawalny build?
- Czy skutek jest wyjaśnialny przed lub po wyborze?
- Czy przeciwnik daje się odczytać i skontrować?
- Czy system można zweryfikować w ograniczonym pionowym przekroju?
- Czy pozostawia miejsce na inne style gry?
- Czy nie wymaga ukrytego bonusu lub trwałego grindu?

Jeżeli odpowiedź brzmi głównie „nie”, pomysł może być atrakcyjny sam w sobie, ale nie wzmacnia HOOP-RUN.

## 17. Hierarchia dokumentów

- `docs/product-vision.md` odpowiada na pytanie: **dlaczego i w jakim kierunku rozwijamy grę?**
- `prd/*.md` odpowiadają: **jaki ograniczony problem i hipotezę sprawdzamy teraz?**
- `spec.md` oraz `docs/spec/` odpowiadają: **jakie reguły są aktualnie przyjętą prawdą produktu i architektury?**
- `ROADMAP.md` odpowiada: **w jakiej kolejności i po czym poznamy ukończenie pracy?**
- `STATUS.md` odpowiada: **gdzie jesteśmy, co ostatnio zweryfikowano i jaki jest najbliższy krok?**

Wizja nie rozszerza automatycznie bieżącego zakresu. Gdy aspiracja koliduje z wynikiem zweryfikowanego PRD, obowiązuje aktualna decyzja produktowa, a gwiazda północna powinna zostać świadomie zaktualizowana.

## 18. Otwarte decyzje wizji

Poniższe pytania są celowo nierozstrzygnięte i wymagają przyszłych PRD:

1. Czy run zaczyna się kapitanem, pełną drużyną czy wyborem trenera?
2. Jak talie zawodników łączą się w talię drużyny?
3. Kiedy i jak rekrutuje się pozostałych zawodników?
4. Czy pierwszą dużą warstwą po liniowym runie jest mapa, trening czy skład?
5. Jaką rolę pełnią sprzęt, sponsorzy i waluta?
6. Czy `Hype` i `Takeover` wzmacniają taktykę, czy przeciążają mecz?
7. Jak zbiórki i transition zmieniają granicę posiadania?
8. Które reguły mogą naginać zwykłe mecze, a które powinny należeć tylko do bossów?
9. Jak szeroka metaprogresja daje różnorodność bez trwałej przewagi statystycznej?
10. Jak połączyć taktyczny interfejs z widowiskową animacją rozegranej akcji?

Odpowiedzi nie powinny być ustalane jednocześnie. Każda kolejna decyzja ma wynikać z dowodów z poprzedniego grywalnego zakresu.
