# PRD 002 — Pierwsza pętla runu

## 1. Kontekst

PRD 000 potwierdziło taktyczne posiadanie oparte na kartach, a PRD 001 rozszerzyło je do pełnego meczu 3 na 3. Bramka PRD 001 zakończyła się wynikiem `proceed`: zewnętrzny pierwszy mecz trwał 10 minut, zakończył się 8:11, a tester rozumiał decyzje po pisemnym objaśnieniu zasad i chciał rewanżu.

Projekt nie sprawdził jeszcze najważniejszej hipotezy roguelite: czy nagroda zmieniająca talię po meczu tworzy wystarczającą motywację i różnorodność, aby gracz chciał rozegrać kolejne, trudniejsze spotkanie. PRD 002 buduje pierwszy zamknięty run bez mapy, sklepu i metaprogresji.

## 2. Odbiorcy

- gracze taktycznych deckbuilderów i roguelite'ów,
- gracze zainteresowani koszykówką bez zręcznościowego sterowania zawodnikami,
- nowi gracze, którzy potrzebują krótkiego objaśnienia zasad, ale nie gotowego rozwiązania decyzji,
- dotychczasowi gracze pełnego meczu, których ewentualny feedback może dodatkowo opisać wpływ nagrody na późniejszy sposób gry.

## 3. Problem produktowy

Pojedynczy pełny mecz jest grywalny i zachęca do rewanżu, ale rewanż z niezmienioną talią nie tworzy jeszcze progresji charakterystycznej dla roguelite. Pierwszy run powinien odpowiedzieć na pytania:

- czy wybór jednej z trzech kart jest znaczącą nagrodą po zwycięstwie,
- czy dodana karta obserwowalnie zmienia decyzje w następnym meczu,
- czy trzech różnych przeciwników tworzy narastającą trudność bez ukrytych bonusów,
- czy trzy mecze utrzymują motywację przez sesję trwającą około 25–35 minut,
- czy ręczny zapis między meczami pozwala bezpiecznie przerwać dłuższą sesję.

## 4. Główna hipoteza

> Pętla `mecz → wybór jednej z trzech kart → trudniejszy mecz` sprawia, że gracz świadomie rozwija dwie talie, dostosowuje decyzje do kolejnych przeciwników i chce rozpocząć następny run z innym wyborem nagród.

Hipoteza pomocnicza:

> Trzy liniowo ułożone mecze wystarczą do zweryfikowania progresji runu bez mapy, sklepu, waluty, rzadkości kart i metaprogresji.

## 5. Cele

- Zbudować kompletny run składający się z trzech kolejnych meczów.
- Po pierwszym i drugim zwycięstwie zaoferować znaczący wybór jednej z trzech kart.
- Zachować wybraną kartę w odpowiedniej talii do końca bieżącego runu.
- Wprowadzić cztery nowe karty i trzech rozróżnialnych przeciwników.
- Zakończyć run natychmiast po dowolnej porażce albo sukcesem po trzecim zwycięstwie.
- Zapewnić krótki onboarding bez ujawniania optymalnych kontr.
- Umożliwić ręczne zapisanie i późniejsze wznowienie runu między meczami.
- Zachować deterministyczność całego runu dla podanego seeda.

## 6. Poza zakresem

- mapa runu, rozgałęzienia trasy i wybór kolejnego węzła,
- sklep, waluta, ceny, usuwanie kart i płatne usługi,
- rzadkość kart, ulepszanie kart i warianty poziomów,
- metaprogresja, trwałe odblokowania i premie pomiędzy runami,
- wybór kapitana, archetypu drużyny, składu albo początkowego buildu,
- draft zawodników, trenerzy, sprzęt, trening i wydarzenia,
- wielu bossów, elity i szeroka produkcja przeciwników,
- więcej niż cztery nowe karty,
- zapis w trakcie meczu, wiele slotów, synchronizacja chmurowa i konta,
- backend, rankingi i multiplayer,
- finalna oprawa, audio i osobny layout mobilny,
- zmiana podstawowych reguł meczu `do 11 / +2 / limit 15`.

## 7. Format runu

### 7.1. Struktura

Run składa się dokładnie z trzech meczów rozgrywanych liniowo:

1. `Fundamentals` — zbalansowany przeciwnik wprowadzający do runu.
2. `Perimeter Crew` — przeciwnik koncentrujący się na rzutach za 2 i agresywnym kryciu obwodu.
3. `Paint Kings` — finałowy przeciwnik oparty na `Pick & Roll`, wejściach i ochronie paint.

Pierwszy i drugi mecz po zwycięstwie prowadzą do wyboru nagrody. Trzecie zwycięstwo natychmiast kończy run sukcesem. Porażka w dowolnym meczu natychmiast kończy run niepowodzeniem.

### 7.2. Czas

Docelowy czas pełnego zwycięskiego runu wynosi około 25–35 minut, łącznie z onboardingiem i dwoma wyborami nagrody. Gra nie skraca zasad pojedynczego meczu tylko po to, aby osiągnąć ten cel.

### 7.3. Początek

Każdy nowy run rozpoczyna się:

- obecną drużyną gracza,
- obecnymi startowymi taliami ataku i obrony,
- wynikiem pierwszego meczu `0:0`,
- nowym albo jawnie wybranym seedem runu,
- bez premii wynikających z poprzednich runów.

## 8. Przepływ gracza

1. Gracz otwiera ekran startowy.
2. Jeżeli istnieje zapis, może wybrać `Kontynuuj run` albo rozpocząć nowy run po potwierdzeniu zastąpienia zapisu.
3. Przed nowym runem gra pokazuje krótki ekran `Jak grać`.
4. Gracz rozpoczyna mecz z aktualnym przeciwnikiem.
5. Porażka prowadzi do podsumowania nieudanego runu.
6. Zwycięstwo w pierwszym lub drugim meczu prowadzi do wyboru jednej z trzech kart.
7. Wybrana karta trafia do właściwej talii na resztę runu.
8. Gra pokazuje stan runu oraz opcje `Dalej` i `Zapisz i wyjdź`.
9. `Dalej` rozpoczyna następny mecz, a `Zapisz i wyjdź` zapisuje checkpoint i wraca do ekranu startowego.
10. Trzecie zwycięstwo prowadzi do podsumowania ukończonego runu.
11. Z podsumowania gracz może rozpocząć nowy run z czystymi taliami.

## 9. Ekran „Jak grać”

Onboarding przed pierwszym meczem wyjaśnia zwięźle:

- naprzemienne role `ATAK` i `OBRONA`,
- wybór karty, wykonawcy i celu,
- procent trafienia, `Advantage` oraz punktację 1/2,
- intencję obrony i aktualną akcję przeciwnika,
- warunek zwycięstwa `do 11 / +2 / limit 15`,
- strukturę trzech meczów i utrzymywanie kart w bieżącym runie.

Ekran nie podaje optymalnych sekwencji, gotowych kontr ani rozwiązania konkretnych planów. Gracz może wrócić do niego z ekranu startowego.

## 10. Nagrody i talie

### 10.1. Oferta

Po pierwszym i drugim zwycięstwie gra generuje deterministyczną ofertę trzech kart:

- co najmniej jedna karta należy do talii ataku,
- co najmniej jedna karta należy do talii obrony,
- trzecia karta może należeć do dowolnej z tych talii,
- oferta zależy od seeda i stanu runu,
- ponowne otwarcie tego samego stanu nie może przerzucić oferty.

### 10.2. Wybór

- Gracz musi wybrać dokładnie jedną kartę.
- Wybrana karta jest dodawana do odpowiedniej talii bez usuwania ani zastępowania innych kart.
- Dwie odrzucone karty nie trafiają do talii.
- Dodana karta pozostaje dostępna do końca bieżącego runu.
- Nowy run zawsze odtwarza startowe talie i usuwa nagrody poprzedniego runu.

### 10.3. Brak dodatkowej ekonomii

Wszystkie nagrody są równorzędne systemowo. PRD nie wprowadza rzadkości, cen, waluty ani ulepszania kart. Różnica wartości wynika z dopasowania karty do buildu, przeciwnika i aktualnych talii.

## 11. Nowe karty

Pierwsza pula zawiera dokładnie cztery nowe karty. Ich liczby pozostają parametrami balansowymi do ustalenia podczas planowania i implementacji.

### 11.1. Atak

- `Backdoor Cut` — ruch zawodnika bez piłki karzący agresywne krycie obwodu i tworzący możliwość zakończenia w paint.
- `Step Back` — przygotowanie rzutu za 2 przez stworzenie przestrzeni kosztem czasu albo innego jawnego kompromisu.

### 11.2. Obrona

- `Hedge` — agresywna odpowiedź na zasłonę, która ogranicza prowadzącego piłkę, ale może odsłonić stawiającego zasłonę.
- `Close Out` — mocny contest rzutu z obwodu kosztem ryzyka minięcia albo innej jawnej podatności na następną akcję.

Każda karta musi tworzyć nową decyzję lub synergię, pozostać oparta na stanie boiska i mieć czytelny kompromis. Karta nie może być bezwarunkowo najlepszą odpowiedzią przeciw wszystkim intencjom lub planom.

## 12. Przeciwnicy i trudność

Każdy przeciwnik ma jawną tożsamość gameplayową wynikającą z planów, intencji, talii lub strojalnych danych widocznych w zachowaniu. Gra nie używa ukrytego mnożnika trafienia ani ukrytej przewagi przyznawanej tylko dlatego, że jest to późniejszy mecz.

### 12.1. Fundamentals

- zbalansowany zestaw planów i intencji,
- bazuje na zachowaniu obecnego przeciwnika,
- pozwala nowemu graczowi zastosować zasady z onboardingu.

### 12.2. Perimeter Crew

- preferuje `Quick Three`, podania na obwodzie i rzuty za 2,
- w obronie częściej ogranicza obwód,
- nagradza karty i decyzje odpowiadające na agresywne krycie oraz rzuty dystansowe.

### 12.3. Paint Kings

- jest finałowym sprawdzianem runu,
- preferuje `Pick & Roll`, wejścia i zakończenia w paint,
- w obronie mocno chroni paint,
- wymaga wykorzystania wcześniejszych nagród bez otrzymywania ukrytych bonusów.

Dokładne plany, ręce, wagi i wartości są danymi prototypu. Różnice muszą być rozpoznawalne w interfejsie i możliwe do odtworzenia dla tego samego seeda.

## 13. Zapis i wznowienie

### 13.1. Zakres zapisu

- Gra udostępnia jeden lokalny slot zapisu w przeglądarce.
- Zapis jest ręczny i dostępny wyłącznie po wyborze nagrody, przed rozpoczęciem następnego meczu.
- `Zapisz i wyjdź` utrwala co najmniej seed i RNG runu, indeks następnego przeciwnika, obie talie wraz z nagrodami oraz informacje potrzebne do identycznego wznowienia.
- `Kontynuuj run` odtwarza dokładnie zapisany checkpoint bez ponownego losowania nagrody.
- Rozpoczęcie nowego runu przy istniejącym zapisie wymaga potwierdzenia i zastępuje jeden slot.
- Porażka albo trzecie zwycięstwo usuwa aktywny zapis po pokazaniu podsumowania.

### 13.2. Ograniczenia

- Nie można zapisać aktywnego meczu ani ekranu nierozstrzygniętej nagrody.
- Zapis pozostaje lokalny dla konkretnej przeglądarki i urządzenia.
- Brak zapisu nie blokuje przejścia bezpośrednio do następnego meczu.
- Format musi pozwalać wykryć niezgodny albo uszkodzony zapis i bezpiecznie zaproponować nowy run.

## 14. Podsumowania runu

Podsumowanie sukcesu albo porażki pokazuje co najmniej:

- rezultat runu i osiągnięty etap,
- wyniki rozegranych meczów,
- wybrane nagrody i talie końcowe,
- łączny czas runu,
- akcję rozpoczęcia nowego runu.

Podsumowanie nie przyznaje trwałej waluty, doświadczenia ani odblokowań.

## 15. Wymagania funkcjonalne

### FR-201 — Stan runu

Gra przechowuje serializowalny stan seeda i RNG, bieżącego etapu, przeciwników, obu talii, wybranych nagród, wyników meczów, czasu oraz fazy runu.

### FR-202 — Trzy mecze

Run prowadzi kolejno przez `Fundamentals`, `Perimeter Crew` i `Paint Kings`, rozpoczynając każdy mecz zgodnie z istniejącymi regułami PRD 001.

### FR-203 — Koniec po porażce

Porażka w dowolnym meczu kończy run bez nagrody i bez przejścia do kolejnego przeciwnika.

### FR-204 — Nagroda po zwycięstwie

Pierwsze i drugie zwycięstwo generują ofertę trzech kart i blokują przejście dalej do chwili wyboru dokładnie jednej nagrody.

### FR-205 — Skład oferty

Każda oferta zawiera co najmniej jedną kartę ofensywną i jedną defensywną, a wszystkie trzy pozycje są deterministyczne dla stanu runu.

### FR-206 — Aktualizacja talii

Wybrana karta trafia do właściwej talii i może zostać dobrana w późniejszych meczach tego samego runu.

### FR-207 — Nowe karty

`Backdoor Cut`, `Step Back`, `Hedge` i `Close Out` mają typowane definicje, legalne cele, jawne kompromisy i testowalne efekty.

### FR-208 — Różni przeciwnicy

Każdy z trzech przeciwników ujawnia własną tożsamość i używa odróżnialnej konfiguracji planów oraz intencji bez ukrytej premii do wyniku.

### FR-209 — Sukces runu

Trzecie zwycięstwo kończy run sukcesem bez kolejnego ekranu nagrody.

### FR-210 — Reset

Nowy run odtwarza drużynę i talie startowe oraz nie zachowuje kart, wyników ani premii poprzedniego runu.

### FR-211 — Onboarding

Przed nowym runem dostępny jest ekran `Jak grać`, który wyjaśnia reguły bez podawania optymalnych sekwencji.

### FR-212 — Ręczny zapis

Po wyborze pierwszej lub drugiej nagrody gracz może zapisać jeden lokalny checkpoint i wyjść do ekranu startowego.

### FR-213 — Wznowienie

Gra wykrywa zapis, pozwala kontynuować od następnego meczu i odtwarza seed, RNG, etap, talie oraz historię nagród.

### FR-214 — Integralność zapisu

Nieprawidłowy lub niezgodny zapis nie uruchamia częściowo uszkodzonego runu i nie blokuje rozpoczęcia nowego.

### FR-215 — Podsumowanie

Sukces i porażka pokazują etap, wyniki meczów, nagrody, końcowe talie oraz łączny czas.

## 16. Sterowanie i informacja zwrotna

- Wszystkie nowe ekrany działają myszą i korzystają z istniejącego responsywnego kontenera gry.
- Ekran startowy jednoznacznie rozróżnia `Nowy run`, `Kontynuuj run` i `Jak grać`.
- Ekran nagrody pokazuje nazwę, talię, działanie i kompromis każdej karty przed wyborem.
- Po wyborze interfejs potwierdza kartę i talię, do której została dodana.
- Nagłówek runu pokazuje bieżący mecz, przeciwnika i postęp `1/3`, `2/3` albo `3/3`.
- Przeciwnik jest rozpoznawalny nazwą, krótkim opisem stylu i zachowaniem, nie wyłącznie kolorem.
- Zapis, zastąpienie zapisu, wznowienie i odrzucenie uszkodzonego zapisu mają jednoznaczne komunikaty.
- Interfejs nie może sugerować, że nagrody albo postęp przetrwają nowy run.

## 17. Wymagania niefunkcjonalne

- Cały run, oferty nagród i konfiguracje przeciwników pozostają deterministyczne dla tego samego seeda i identycznych decyzji.
- Reguły runu, nagród, talii, nowych kart i zapisu pozostają niezależne od Phasera oraz testowalne headlessowo.
- Stan runu i checkpoint są typowane, serializowalne i wersjonowane.
- Logika domenowa nie używa bezpośrednio `Math.random()`.
- Phaser prezentuje model widoku i wysyła komendy, ale nie jest jedynym źródłem stanu runu.
- Produkcyjny build pozostaje statyczny i działa na GitHub Pages pod `/HOOP-RUN/` bez backendu.
- Zapis nie zawiera sekretów ani danych osobowych.
- Nowe funkcje nie mogą zepsuć deterministycznych scenariuszy PRD 000 i PRD 001.

## 18. Kryteria akceptacji

1. Gracz może rozpocząć nowy run i rozegrać trzy mecze w ustalonej kolejności bez przeładowania strony.
2. Porażka w pierwszym, drugim lub trzecim meczu kończy run właściwym podsumowaniem.
3. Pierwsze i drugie zwycięstwo prowadzą do deterministycznej oferty trzech kart, a trzecie zwycięstwo nie pokazuje nagrody.
4. Każda oferta zawiera co najmniej jedną kartę ataku i jedną obrony.
5. Wybranie dokładnie jednej karty dodaje ją do właściwej talii i nie dodaje dwóch pozostałych.
6. Nagroda może zostać dobrana i legalnie zagrana w późniejszym meczu tego samego runu.
7. `Backdoor Cut`, `Step Back`, `Hedge` i `Close Out` tworzą nowe, wyjaśnialne decyzje i nie są bezwarunkowo najlepsze.
8. `Fundamentals`, `Perimeter Crew` i `Paint Kings` mają obserwowalnie różne style oraz kontrolowane testy swoich planów i intencji.
9. Ten sam seed i identyczne decyzje odtwarzają oferty, talie, przeciwników, wyniki i końcowe podsumowanie.
10. Nowy run resetuje talie, nagrody, wyniki i etap bez zachowania metaprogresji.
11. `Jak grać` wyjaśnia podstawowe informacje potrzebne do samodzielnego rozpoczęcia runu bez gotowych kontr.
12. `Zapisz i wyjdź` tworzy jeden checkpoint wyłącznie po wybranej nagrodzie i wraca do ekranu startowego.
13. `Kontynuuj run` odtwarza następny mecz, talie, nagrody, seed i RNG identycznie jak nieprzerwany przebieg.
14. Nowy run przy istniejącym zapisie wymaga potwierdzenia, a uszkodzony zapis można bezpiecznie odrzucić.
15. Podsumowanie sukcesu i porażki pokazuje etap, wyniki, nagrody, końcowe talie i czas.
16. Reprezentatywny deterministyczny przebieg rejestruje orientacyjny czas pełnego zwycięskiego runu względem diagnostycznego celu 25–35 minut.
17. Kontrolowany scenariusz pokazuje obserwowalny wpływ co najmniej jednej nagrody na późniejszą prognozę, legalną akcję lub historię; reset umożliwia nowy run z innym wyborem.
18. Krytyczne reguły runu, nagród, zapisu, nowych kart i przeciwników mają deterministyczne testy bez Phasera.
19. Produkcyjny build, zapis lokalny i pełny przepływ E2E działają pod `/HOOP-RUN/` bez blokujących błędów konsoli, sieci lub zasobów.
20. Widoki startu, onboardingu, nagrody, checkpointu i podsumowania są czytelne w dwóch istotnych viewportach desktopowych.

## 19. Miary powodzenia hipotezy

Pierwsza pętla runu uzasadnia dalsze projektowanie mapy i ekonomii, jeśli testy, E2E i agentowy smoke techniczny potwierdzą, że:

- reprezentatywny przebieg rejestruje czas względem diagnostycznego celu 25–35 minut,
- onboarding i stan UI jawnie komunikują postęp trzech meczów oraz konsekwencję porażki,
- każda oferta jawnie pokazuje role i kompromisy, a kontrolowane scenariusze obejmują dobre oraz ryzykowne użycie kart,
- co najmniej jedna zdobyta karta zostaje legalnie wykorzystana w późniejszym meczu z obserwowalnym efektem w prognozie lub historii,
- trzej przeciwnicy mają mierzalnie różne częstotliwości planów i intencji,
- zapis i wznowienie nie zmieniają oferty, talii ani przebiegu runu,
- po sukcesie albo porażce reset uruchamia kolejny run z czystymi taliami i pozwala dokonać innego wyboru.

Playtest użytkownika, znajomego lub osoby nieznającej projektu jest opcjonalnym feedbackiem jakościowym. Nie jest kryterium akceptacji ani bramką, a workflow nigdy nie czeka na jego wykonanie lub deklarację chęci ponownego runu.

## 20. Ryzyka

### R-201 — Nagroda nie pojawia się w ręce

Dodanie jednej karty do dziesięciokartowej talii może nie dać graczowi okazji do świadomego użycia jej w kolejnym meczu. Planowanie powinno sprawdzić dobieranie, widoczność nagrody i minimalny dowód jej wpływu bez gwarantowania zwycięstwa.

### R-202 — Pozorny wybór

Jedna z trzech kart może być zawsze najlepsza albo karta do niewłaściwej talii może wyglądać na martwą. Oferta gwarantuje obie role, a karty wymagają jawnych kompromisów i testu przeciw różnym przeciwnikom.

### R-203 — Trzy mecze są zbyt długie

Sesja może przekroczyć 35 minut, szczególnie przy wyrównanych końcówkach. Należy mierzyć rzeczywisty czas bez skracania meczu przed zebraniem dowodów.

### R-204 — Przeciwnicy różnią się tylko nazwą

Jeśli konfiguracje używają tych samych planów i intencji w podobnych proporcjach, progresja będzie pozorna. Każdy przeciwnik wymaga obserwowalnego profilu i kontrolowanego scenariusza.

### R-205 — Finał opiera się na ukrytym bonusie

Trudność `Paint Kings` nie może wynikać z niewidocznego mnożnika trafienia. Siła ma pochodzić z jawnego stylu, planów, talii i wyjaśnialnych parametrów.

### R-206 — Zapis umożliwia przerzucanie nagrody

Zapis przed rozstrzygnięciem oferty albo niepełne utrwalenie RNG mogłyby pozwolić odświeżać wybór. Checkpoint powstaje dopiero po wybraniu nagrody i przechowuje kanoniczny stan RNG.

### R-207 — Zapis staje się niezgodny

Zmiana modelu może uszkodzić istniejący lokalny checkpoint. Format wymaga wersji, walidacji i bezpiecznego odrzucenia bez awarii gry.

### R-208 — Onboarding zastępuje odkrywanie

Zbyt szczegółowy ekran zasad może rozwiązać taktyczny puzzle za gracza, a zbyt krótki powtórzy problem ślepych wyborów. Treść wyjaśnia system i język UI, ale nie podaje kontr ani sekwencji.

### R-209 — Zakres rośnie do pełnego roguelite

Mapa, sklep, waluta, rzadkość, metaprogresja i wybór drużyny mogą przedwcześnie zwiększyć zakres. PRD kończy się na liniowej sekwencji trzech meczów, dwóch nagrodach i jednym lokalnym slocie.

## 21. Fakty ustalone z użytkownikiem

- Pierwszy pionowy przekrój testuje pętlę `mecz → wybór jednej z trzech kart → kolejny trudniejszy mecz`.
- Run zawiera dokładnie trzy mecze, trzeci jest finałem, a każda porażka kończy run.
- Nagroda dodaje nową kartę do właściwej talii na resztę runu bez usuwania ani zastępowania kart.
- Oferta zawsze zawiera co najmniej jedną kartę ataku i jedną obrony; trzecia może należeć do dowolnej talii.
- Zakres obejmuje cztery nowe karty: `Backdoor Cut`, `Step Back`, `Hedge` i `Close Out`.
- Przeciwnikami są `Fundamentals`, `Perimeter Crew` i finałowi `Paint Kings`.
- Run rozpoczyna obecna drużyna i obecne talie, bez wyboru kapitana, archetypu lub buildu.
- Nagroda występuje tylko po pierwszym i drugim zwycięstwie.
- Po porażce nowy run resetuje talie i przeciwników; brak metaprogresji i trwałych odblokowań.
- Przed pierwszym meczem dostępny jest krótki ekran `Jak grać` bez gotowych kontr.
- Docelowy pełny run trwa około 25–35 minut.
- Wszystkie karty mają równy poziom systemowy; brak rzadkości, ulepszeń i waluty.
- Zapis jest ręczny, lokalny, ma jeden slot i jest dostępny między meczami jako `Zapisz i wyjdź` oraz `Kontynuuj run`.
- Obowiązkową walidację zapewniają deterministyczne testy, E2E i agentowy techniczny smoke przeglądarkowy; ludzkie playtesty są opcjonalnym feedbackiem poza bramką i workflow na nie nie czeka.

## 22. Założenia do zweryfikowania

- Dwie nagrody wystarczą, aby gracz odczuł rozwój buildu w trzy-meczowym runie.
- Jedna dodatkowa karta ma wystarczającą szansę pojawienia się i zastosowania w późniejszym meczu.
- Cztery nowe karty zapewnią znaczące oferty bez rzadkości i ulepszeń.
- Trzech liniowych przeciwników wystarczy do odczucia progresji bez mapy.
- Obecne reguły meczu utrzymają pełny run w czasie 25–35 minut.
- Jeden checkpoint pomiędzy meczami wystarczy do bezpiecznego przerwania sesji.
- Krótki onboarding jawnie wyjaśni rozpoczęcie i reguły bez ujawniania optymalnych decyzji; subiektywna jasność może być później oceniona z opcjonalnego feedbacku.

## 23. Otwarte pytania do planowania

1. Jakie dokładne koszty, legalne cele i efekty mają cztery nowe karty?
2. Jak sprawić, aby wybrana nagroda miała realną szansę pojawić się w następnym meczu bez ustawiania ręki pod zwycięstwo?
3. Jakie dokładne plany, intencje, talie i wagi odróżniają trzech przeciwników?
4. Czy istniejące plany wystarczą do `Perimeter Crew` i `Paint Kings`, czy potrzebują pojedynczych nowych akcji?
5. Jak prezentować porównanie nagrody z aktualną talią bez przeciążenia ekranu?
6. Jaki jest minimalny, wersjonowany schemat zapisu i strategia odrzucenia niezgodnego checkpointu?
7. Które kontrolowane seedy pokrywają sukces, porażkę na każdym etapie, obie role nagród i wszystkich przeciwników?
8. Jak mierzyć łączny czas runu, jeśli sesja została przerwana zapisem?
9. Jakie dane podsumowania najlepiej pokazują wpływ nagród bez dodawania metaprogresji?

## 24. Bramka po PRD 002

Po implementacji, automatycznej walidacji i agentowym smoke teście pierwszej pętli runu należy wybrać jeden z wyników:

1. `proceed` — kontrolowane scenariusze pokazują wpływ nagród na późniejsze decyzje, przeciwnicy są różni, a reset umożliwia kolejny run z innym wyborem; można przygotować PRD mapy albo kolejnego systemu runu,
2. `iterate` — pętla jest obiecująca, ale nagrody, czas, przeciwnicy, zapis albo onboarding wymagają ograniczonej korekty,
3. `rethink` — kontrolowane scenariusze nie pokazują wpływu dwóch nagród na późniejsze decyzje albo trzy profile nie tworzą funkcjonalnie różnego przebiegu.

Pozytywny wynik nie zatwierdza automatycznie sklepu, waluty, metaprogresji ani szerokiej produkcji kart i przeciwników. Każdy z tych zakresów wymaga osobnej decyzji produktowej.
