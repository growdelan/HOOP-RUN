# Pierwsza pętla runu

## Status

- Status: częściowo zaimplementowane — Milestone'y 8–10 ukończone, Milestone'y 11–12 pozostają `planned`.
- Źródło: `prd/002-first-run-loop.md`.
- Plan realizacji: Milestone'y 8–12 w `ROADMAP.md`.
- Zależność: zweryfikowany pełny mecz z PRD 001 opisany w `docs/spec/full-match.md`.

Ten dokument rozwija kontrakt pierwszego runu. `spec.md` pozostaje indeksem aktualnej prawdy, a PRD opisuje intencję produktu i miary powodzenia. Nazwy typów określają odpowiedzialności, nie obowiązkowy układ plików.

## Niezmienne reguły runu

- Run zawiera dokładnie trzy mecze w kolejności `Fundamentals`, `Perimeter Crew`, `Paint Kings`.
- Każda porażka natychmiast kończy run niepowodzeniem.
- Pierwsze i drugie zwycięstwo prowadzą do obowiązkowego wyboru jednej z trzech kart.
- Trzecie zwycięstwo kończy run sukcesem bez kolejnej nagrody.
- Wybrana karta trafia do właściwej talii i pozostaje w niej do końca bieżącego runu.
- Nowy run zawsze przywraca obecną drużynę i startowe talie PRD 001; nic nie przechodzi między runami.
- Reguły pojedynczego meczu pozostają `do 11 / przewaga 2 / limit 15` i punktacja 1/2.
- Run nie zawiera mapy, sklepu, waluty, rzadkości, ulepszeń ani metaprogresji.

## Agregat `RunState`

`RunState` jest jedynym źródłem prawdy o bieżącym runie. Jest typowany, serializowalny i logicznie zawiera:

- początkowy seed runu,
- dokładnie jeden kanoniczny kursor RNG właściwy dla bieżącej fazy,
- fazę runu i indeks bieżącego albo następnego przeciwnika,
- uporządkowaną listę trzech identyfikatorów przeciwników,
- aktualne listy kart talii ofensywnej i defensywnej,
- opcjonalny aktywny `MatchState`,
- opcjonalną nierozstrzygniętą ofertę nagrody,
- historię wybranych nagród,
- wyniki zakończonych meczów,
- czas runu zakumulowany według zatwierdzonej polityki pomiaru,
- końcowy rezultat sukcesu albo porażki.

Stan pochodny nie jest utrzymywany w rozbieżnych kopiach. Nazwa przeciwnika wynika z jego identyfikatora, etap z indeksu, a dostępność komend z fazy.

## Fazy i przejścia

Dozwolony przepływ domenowy:

```text
activeMatch
  ├─ porażka ─────────────────────────────→ completedFailure
  └─ zwycięstwo 1/2 → rewardSelection → intermission → activeMatch
  └─ zwycięstwo 3 ────────────────────────→ completedSuccess
```

Reguły przejść:

1. Nowy run tworzy czyste talie i rozpoczyna mecz z `Fundamentals`.
2. W `activeMatch` agregat przyjmuje wyłącznie komendy istniejącego meczu i deleguje je do `MatchState`.
3. Zakończony mecz zapisuje wynik, statystyki potrzebne podsumowaniu oraz aktualny kursor RNG.
4. Porażka przechodzi bezpośrednio do `completedFailure` i nie generuje oferty.
5. Pierwsze albo drugie zwycięstwo generuje ofertę dokładnie raz i przechodzi do `rewardSelection`.
6. W `rewardSelection` legalny jest wybór dokładnie jednej pozycji; inne komendy nie zmieniają stanu ani RNG.
7. Wybór aktualizuje jedną talię, zapisuje nagrodę i przechodzi do `intermission`.
8. `Dalej` w `intermission` tworzy nowy `MatchState` z następnym przeciwnikiem i aktualnymi taliami.
9. Trzecie zwycięstwo przechodzi do `completedSuccess` bez generowania nagrody.
10. Nowy run z fazy końcowej tworzy całkowicie świeży stan z wybranym seedem.

## Składanie pełnego meczu

- `RunState` nie kopiuje punktacji, naprzemienności, faz posiadania ani reguły zwycięstwa.
- Nowy mecz otrzymuje identyfikator i konfigurację przeciwnika, aktualne listy kart obu talii oraz bieżący kursor RNG.
- Podczas `activeMatch` kanoniczna losowość jest aktualizowana przez wynik komendy meczu; nie istnieje drugi niezależnie przesuwany kursor runu.
- Po zakończeniu mecz zwraca wynik, statystyki, końcowe stany talii meczowych oraz kursor RNG przez jeden typowany kontrakt.
- Run utrzymuje skład talii pomiędzy meczami, ale każdy nowy mecz inicjalizuje świeże stosy dobierania, ręce i stosy odrzuconych z tego składu.
- Dokładna kolejność inicjalizacji talii i przeciwnika jest częścią kontraktu deterministyczności oraz testu reprodukcji.

## Nagrody

### Oferta

Oferta jest wartością zapisaną w `RunState`, a nie obliczaną ponownie przez prezentację. Zawiera trzy uporządkowane pozycje z identyfikatorem karty i rolą talii.

Reguły:

- pula PRD 002 zawiera dokładnie `Backdoor Cut`, `Step Back`, `Hedge` i `Close Out`,
- każda oferta zawiera co najmniej jedną kartę ofensywną i jedną defensywną,
- trzecia pozycja może należeć do dowolnej roli,
- oferta zależy od kanonicznego RNG i stanu runu,
- wygenerowanie oferty przesuwa RNG tylko raz,
- ponowne pokazanie zapisanej oferty nie przesuwa RNG i nie zmienia pozycji,
- dokładny algorytm duplikatów między dwiema ofertami pozostaje strojalnym parametrem, o ile spełnia skład oferty i deterministyczność.

### Wybór i talie

- Wybrać można wyłącznie jedną z trzech pozycji bieżącej oferty.
- Karta jest dopisywana do składu właściwej talii bez usuwania ani zastępowania istniejących kart.
- Dwie pozostałe pozycje są odrzucane i nie trafiają do żadnej talii.
- Następny mecz buduje cykl talii z rozszerzonego składu.
- Nowy run przywraca dokładnie startowe składy obu talii.

Przyjęta polityka widoczności nagrody:

- następny mecz inicjalizuje pełną zaktualizowaną talię wraz z wybraną kartą,
- nagroda należy do pierwszego cyklu dobierania właściwej roli i musi zostać dobrana przed pierwszym przetasowaniem, jeżeli mecz zużyje cały ten cykl,
- karta nie jest przypinana do pierwszej ręki ani do wyniku losowania i nie gwarantuje zwycięstwa,
- testy zapisują numer właściwego posiadania, w którym nagroda pojawiła się po raz pierwszy; zakończenie meczu przed jej dobraniem pozostaje mierzalnym ryzykiem walidacyjnym, a nie powodem do ukrytego wstrzyknięcia karty.

## Cztery nowe karty

Karty są typowanymi danymi składanymi ze współdzielonych mechanik. Wartości poniżej są zatwierdzonym prototypem Milestone 9 i pozostają strojalnymi danymi po audycie, nie stałymi zakodowanymi w reducerach.

### `Backdoor Cut` — atak

- Koszt: `2` sekundy.
- Wykonujący: zawodnik ataku bez piłki ustawiony na obwodzie.
- Cel: aktualny posiadacz piłki; karta jest nielegalna, gdy wykonujący ma piłkę albo nie stoi na obwodzie.
- Efekt wspólny: wykonujący przemieszcza się do `paint`; piłka nie zmienia właściciela, więc zakończenie wymaga późniejszego `Pass` i `Shot`.
- Kontra: gdy intencja ma `onBallPressure >= 8` i `helpOnDrive = false`, cutter trafia do `openPlayerIds`; `Advantage` nie zmienia się.
- Ryzyko: przeciw pozostałym intencjom zawodnik trafia do paint bez statusu otwarcia. Karta nadal zużywa czas i może dać gorszy rzut niż pozostanie na obwodzie.
- Status: nie dodaje nowego trwałego statusu; korzysta z istniejącej strefy i `openPlayerIds`.
- Kontrolowany dobry scenariusz: `Deny Perimeter → Backdoor Cut → Pass → Shot`.
- Kontrolowany ryzykowny scenariusz: `Protect Paint → Backdoor Cut → Pass → Shot`, bez premii otwartego rzutu.

### `Step Back` — atak

- Koszt: `3` sekundy.
- Wykonujący: aktualny posiadacz piłki ustawiony na obwodzie.
- Cel: brak; karta jest nielegalna w `paint` oraz dla zawodnika bez piłki.
- Efekt: dodaje wykonującemu status `stepBackReady`, który daje `+12 pp` do jakości jego najbliższego rzutu za 2 jako nazwany modyfikator `createdSeparation`.
- Konsumpcja: status jest zużywany przez następny `Shot` tego zawodnika; zagranie dowolnej innej karty wcześniej usuwa status bez premii.
- Brak kumulacji: nie można zagrać `Step Back` ponownie, gdy wykonujący ma już `stepBackReady`.
- Ryzyko: karta nie daje `Advantage`, nie usuwa istniejącej presji ani krycia i może doprowadzić do końca czasu przed `Shot`.
- Kontrolowany dobry scenariusz: rzut z obwodu przeciw `Protect Paint`, gdzie `+12 pp` tworzy przestrzeń przy niskiej presji.
- Kontrolowany ryzykowny scenariusz: użycie przy wysokiej presji `Deny Perimeter` albo przy mniej niż 6 sekundach, gdy koszt nie zapewnia dobrego zakończenia.

### `Hedge` — obrona

- Koszt bazowy: `2` sekundy zegara przeciwnika; interakcja z `Screen` dodaje `1` sekundę kosztu, łącznie `3`.
- Wykonujący i cel: karta odpowiada wyłącznie na `Screen` i wskazuje `actionTarget`, czyli prowadzącego korzystającego z zasłony.
- Efekt na `Screen`: `advantageDelta = -2`, `contestDelta = +6`, `turnoverPressureDelta = 0`, bez zmiany krycia.
- Ryzyko: `actionActor`, czyli stawiający zasłonę, trafia do istniejącej listy odsłoniętych przeciwników.
- Status ryzyka: jeżeli odsłonięty zawodnik jest wykonującym albo celem następnej akcji, akcja otrzymuje dodatkowe `+1 Opponent Advantage`, po czym jego odsłonięcie zostaje zużyte.
- Kontrolowany dobry scenariusz: późny zegar i `Screen`, gdy dodatkowy koszt czasu oraz contest są ważniejsze od zachowania dopasowań.
- Kontrolowany ryzykowny scenariusz: początek `Pick & Roll`, gdzie odsłonięty screener uczestniczy w następnym kroku i odzyskuje część przewagi.

### `Close Out` — obrona

- Koszt: `2` sekundy zegara przeciwnika.
- Wykonujący i cel: karta odpowiada wyłącznie na `Shoot`, wskazuje `actionActor` i jest legalna tylko dla rzutu z obwodu.
- Czysta pozycja: przy `Opponent Advantage = 0` daje `contestDelta = +12` bez zmiany przewagi.
- Spóźniona pozycja: przy `Opponent Advantage >= 1` daje tylko `contestDelta = +4` i `advantageDelta = +1`, reprezentując minięcie lub utratę kontroli przy zbyt agresywnym doskoku.
- Karta nie jest legalna przeciw zakończeniu w `paint` i nie powoduje straty ani zmiany krycia.
- Kontrolowany dobry scenariusz: czysty `Quick Three` albo `Corner Shot` bez zbudowanej przewagi.
- Kontrolowany ryzykowny scenariusz: rzut z obwodu przy co najmniej jednym `Opponent Advantage`, gdzie dodatkowy punkt przewagi może przeważyć ograniczony contest.

Każda karta publikuje legalność, koszt, zmianę jakości w punktach procentowych, status i przyczynowe zdarzenie przed wyborem. Nie wolno implementować jej efektu wyłącznie w Phaserze ani przez sprawdzanie nazwy konkretnego przeciwnika.

## Profile przeciwników

Konfiguracja przeciwnika jest typowanymi danymi obejmującymi identyfikator, nazwę, opis stylu, skład lub wagi planów ofensywnych, intencje defensywne oraz strojalne parametry widoczne przez zachowanie.

- `Fundamentals` używa zbalansowanego profilu bazującego na zweryfikowanym przeciwniku PRD 001.
- `Perimeter Crew` preferuje `Quick Three`, akcje obwodowe, rzuty za 2 i agresywne ograniczanie obwodu.
- `Paint Kings` preferuje `Pick & Roll`, wejścia, zakończenia w paint i ochronę paint.

Późniejszy przeciwnik nie otrzymuje mnożnika trafienia ani przewagi tylko z powodu indeksu etapu. Trudność wynika z jawnego profilu planów, intencji, talii i ich strojalnych danych. Ten sam seed i stan odtwarzają wybór planu oraz wszystkie rozstrzygnięcia.

Milestone 9 korzysta wyłącznie z istniejących planów, akcji i intencji. Wagi są dodatnimi liczbami całkowitymi normalizowanymi przy losowaniu:

| Profil | `Pick & Roll` | `Drive & Kick` | `Quick Three` |
|---|---:|---:|---:|
| `Fundamentals` | 1 | 1 | 1 |
| `Perimeter Crew` | 1 | 1 | 3 |
| `Paint Kings` | 3 | 1 | 1 |

| Profil | `Pressure & Help` | `Protect Paint` | `Deny Perimeter` |
|---|---:|---:|---:|
| `Fundamentals` | 1 | 1 | 1 |
| `Perimeter Crew` | 1 | 1 | 3 |
| `Paint Kings` | 1 | 3 | 1 |

Rozkład `3/1/1` daje dominującemu zachowaniu 60% udziału, a każdemu pozostałemu 20%, dzięki czemu profil jest czytelny bez usuwania różnorodności. Milestone 9 nie dodaje nowej akcji przeciwnika. Jeżeli kontrolowany audyt nie odróżni profili, dalsza akcja wymaga osobnej decyzji zamiast niejawnego rozszerzenia zakresu.

## RNG i reprodukcja runu

- Cały run ma jeden logiczny strumień losowości obejmujący inicjalizację meczów, tasowania, plany, intencje, rzuty i oferty.
- Operacja bez losowości nie przesuwa kursora.
- Nielegalna komenda nie przesuwa kursora.
- Nierozstrzygnięta oferta przechowuje wylosowane pozycje i kursor po losowaniu.
- Przejście między fazami przenosi kursor; nie kopiuje go do dwóch niezależnych właścicieli.
- Test reprodukcji porównuje oferty, talie, ręce, przeciwników, wyniki, nagrody i końcowy stan, nie tylko rezultat runu.
- Czas rzeczywisty jest osobnym wejściem aplikacyjnym i nie wpływa na RNG ani rozstrzygnięcia gameplayu.

## Czas runu

Łączny czas runu oznacza wyłącznie aktywny czas gry. Przerwa pomiędzy `Zapisz i wyjdź` a `Kontynuuj run` nie jest doliczana, ponieważ miara służy do oceny długości rozgrywki, a nie czasu ściennego.

Warstwa aplikacyjna otrzymuje zegar przez port i aktualizuje czas na kontrolowanych granicach faz lub sesji. Checkpoint przechowuje zakumulowane `elapsedActiveMs`, a po wznowieniu rozpoczyna się nowy odcinek pomiaru. Podsumowanie sumuje zapisane i bieżące odcinki oraz zaokrągla czas do sekund dopiero w modelu widoku. `core` nie wywołuje `Date.now()`, nie używa czasu jako źródła rozstrzygnięć, a checkpoint nie zapisuje czasu ściennego `savedAt`.

## Checkpoint i trwałość

### Kontrakt domenowy

`RunCheckpointV1` jest wersjonowanym, serializowalnym snapshotem kanonicznego stanu dostępnym wyłącznie w `intermission` po wyborze nagrody. Jego kontrakt ma postać:

```ts
interface RunCheckpointV1 {
  readonly kind: "hoop-run.run-checkpoint";
  readonly version: 1;
  readonly contentVersion: 1;
  readonly elapsedActiveMs: number;
  readonly run: RunCheckpointStateV1;
}
```

`RunCheckpointStateV1` zawiera:

- `initialSeed`, obowiązkowy kanoniczny `rngState` i `phase: "intermission"`,
- indeks następnego przeciwnika i uporządkowaną listę przeciwników,
- początkowe i aktualne składy obu talii,
- katalog nagród, profile przeciwników i konfigurację meczu,
- historię wybranych nagród i wyniki zakończonych meczów.

Checkpoint nie zawiera `activeMatch`, `rewardOffer`, `outcome`, `savedAt` ani modelu widoku. `contentVersion` jest niezależny od wersji formatu i pozwala odrzucić zapis po niekompatybilnej zmianie znaczenia kart, profili albo konfiguracji zawartości.

Kodek i walidacja są czyste oraz niezależne od API przeglądarki. Niepoprawny JSON, brak pola, nieznany identyfikator karty lub przeciwnika, nieobsługiwana wersja formatu lub zawartości zwracają jawny błąd i nigdy nie tworzą częściowo zaufanego `RunState`. Walidacja integralności sprawdza także dozwolony indeks następnego etapu, zgodność liczby wyników i nagród, talie wynikające z wybranych nagród oraz dokładnie jednego właściciela RNG. Checksum nie jest częścią V1, ponieważ nie zapewnia bezpieczeństwa lokalnego slotu ponad ścisłą walidację strukturalną i domenową.

### Adapter przeglądarkowy

- `application` definiuje port jednego repozytorium checkpointu.
- `platform` implementuje port przez jeden stały klucz `localStorage`: `hoop-run:run-checkpoint`. Klucz nie zawiera wersji, aby przyszła aplikacja mogła wykryć starszy zapis i jawnie zgłosić brak obsługi.
- Odczyt, zapis i usunięcie zwracają typowany rezultat; wyjątek storage nie może wywrócić sceny.
- `Zapisz i wyjdź` utrwala checkpoint i wraca do startu dopiero po udanym zapisie.
- Porażka albo trzecie zwycięstwo usuwa aktywny slot po utworzeniu końcowego podsumowania.
- Nowy run przy istniejącym slocie wymaga potwierdzenia przed zastąpieniem.

## Warstwa aplikacyjna i prezentacja

`RunSession` jest nadrzędną sesją aplikacyjną. Przyjmuje komendy ekranów runu, deleguje gameplay do istniejącej sesji meczu i publikuje model widoku obejmujący:

- fazę runu, postęp `1/3`–`3/3`, przeciwnika i opis stylu,
- dostępność nowego runu, onboardingu, kontynuacji i potwierdzenia zastąpienia zapisu,
- bieżący model widoku meczu podczas `activeMatch`,
- trzy pozycje oferty z rolą, działaniem i kompromisem,
- potwierdzenie wybranej karty oraz aktualne składy talii,
- stan przerwy i dostępność `Dalej` oraz `Zapisz i wyjdź`,
- końcowy etap, wyniki, nagrody, talie i łączny czas,
- jawne błędy zapisu, wersji i integralności.

Phaser renderuje model i wysyła komendy. Nie generuje oferty, nie aktualizuje talii, nie wybiera przeciwnika, nie waliduje checkpointu i nie oblicza czasu domenowego. Most E2E pozostaje tylko do odczytu.

## Walidacja i śledzenie wymagań

| Zakres | Milestone | Główny dowód |
|---|---|---|
| agregat runu, fazy, nagrody, RNG | 8 | deterministyczne testy Vitest i review core |
| cztery karty i trzy profile | 9 | testy mechanik, scenariusze kompromisów i audyt seedów |
| grywalny run, onboarding i podsumowania | 10 | testy sesji, E2E pełnego runu, build i agentowy smoke techniczny |
| checkpoint, integralność i wznowienie | 11 | testy kodeka i adaptera, E2E reloadu oraz agentowy smoke techniczny |
| hipoteza czasu i wpływ nagrody | 12 | kontrolowane seedy, E2E, agentowy smoke techniczny i dokument bramki |

Bramka PRD 002 może otrzymać wynik `proceed`, `iterate` albo `rethink`. Mapa, sklep, ekonomia i metaprogresja nie są planowane przed tą decyzją.
Playtest człowieka jest opcjonalnym feedbackiem poza bramką; workflow nie czeka na użytkownika ani zewnętrznego testera i nie wymaga deklaracji chęci ponownego runu.
