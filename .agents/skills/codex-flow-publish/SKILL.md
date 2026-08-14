---
name: codex-flow-publish
description: Przygotuj zakończoną zmianę HOOP-RUN do publikacji, aktualizując dokumentację, weryfikując diff, testy, build i wymagany playtest oraz wykonując commit lub push wyłącznie na jawne polecenie użytkownika.
---

# Publikacja zmiany

1. Ustal dokładny poziom autoryzacji z polecenia: przygotowanie, commit albo push. Nie rozszerzaj go.
2. Sprawdź `git status --short`, pełny diff oraz obecność zmian użytkownika spoza zakresu.
3. Upewnij się, że nie ma nierozwiązanych problemów blokujących, `./scripts/verify.sh` przechodzi, a widoczna zmiana ma zaliczony `$codex-flow-playtest`.
4. Zaktualizuj `ROADMAP.md` i `STATUS.md` zgodnie z faktami. Zmień `spec.md` lub `README.md` tylko przy zmianie decyzji, zachowania, uruchamiania albo konfiguracji.
5. Uruchom `./scripts/check-context-size.sh`; uporządkuj przekroczone pliki przed stagingiem, chyba że użytkownik jawnie wyłączył to z zakresu.
6. Dla samego przygotowania zatrzymaj się przed stagingiem. Dla commita stage'uj wyłącznie uzgodnione pliki i utwórz logiczny commit.
7. Wykonaj push tylko na jawne polecenie `push`, `opublikuj` lub równoważne i tylko do właściwego remote/brancha.

Nie twórz pustych commitów, nie ukrywaj nieprzechodzącej walidacji i nie publikuj cudzych zmian. Podaj dokumenty, walidacje, playtest oraz faktyczny status commita i pusha.
