# 🔐 Secure Chat – bezpieczna aplikacja do wymiany wiadomości

## 📌 Opis projektu

Celem projektu jest zbudowanie prostej aplikacji typu chat 💬 umożliwiającej
bezpieczną wymianę zaszyfrowanych wiadomości wraz z dowodem ich autentyczności,
zawierających opcjonalne załączniki 📎, które stanowią integralną część wiadomości.
Aplikacja funkcjonalnie nawiązuje do rozwiązań takich jak ProtonMail lub Signal,
jednak w uproszczonej, akademickiej formie 🎓.

System umożliwia:
- 👤 zakładanie kont użytkowników,
- 🔐 logowanie z wykorzystaniem dwuetapowej autentykacji (2FA),
- 💬 wymianę wiadomości w czasie rzeczywistym (chat),
- ✅ kryptograficzną weryfikację autentyczności wiadomości.


## 🧩 Zakres funkcjonalny (minimum)

Aplikacja realizuje następujące funkcjonalności:

- 📝 rejestracja konta użytkownika;
- 🔑 logowanie użytkownika;
- 🔐 dwuetapowa autentykacja (2FA) z użyciem:
    - TOTP (RFC 6238),
    - opcjonalnie HOTP;
- ✉️ wysyłanie zaszyfrowanych wiadomości do co najmniej jednego użytkownika;
- 📎 dołączanie zaszyfrowanych załączników do wiadomości;
- 🗑️ usuwanie otrzymanych wiadomości;
- 👁️ oznaczanie wiadomości jako odczytane;
- 📥 przeglądanie wiadomości i pobieranie załączników;
- 🛡️ weryfikacja autentyczności wiadomości przy użyciu podpisu cyfrowego.


## 🔒 Model bezpieczeństwa

Projekt kładzie szczególny nacisk na bezpieczeństwo danych użytkowników oraz
poprawne wykorzystanie mechanizmów kryptograficznych.

### 🔐 Kryptografia
- szyfrowanie typu end-to-end (E2E) – treść wiadomości i załączniki są szyfrowane
  po stronie klienta;
- backend nie posiada możliwości odszyfrowania treści wiadomości;
- wiadomości są podpisywane cyfrowo w celu zapewnienia integralności oraz
  autentyczności nadawcy.

### 🔑 Hasła i uwierzytelnianie
- bezpieczne przechowywanie haseł z użyciem aktualnie rekomendowanych funkcji
  haszujących (np. Argon2id);
- wykorzystanie soli oraz wielokrotnego haszowania;
- kontrola siły hasła podczas rejestracji;
- ograniczone komunikaty błędów uwierzytelniania.

### 🛑 Ochrona przed atakami
- walidacja wszystkich danych wejściowych (podejście „deny by default”);
- limity prób logowania oraz opóźnienia czasowe w celu utrudnienia ataków typu
  brute-force;
- centralna obsługa wyjątków i błędów.


## 🏗️ Architektura systemu

Projekt został zrealizowany jako repozytorium typu monorepo, zawierające
niezależne komponenty:

secure-chat/
├── backend/        # ☕ Spring Boot (Java)
├── frontend/       # ⚛️ React + TypeScript (TSX)
├── nginx/          # 🌐 konfiguracja reverse proxy
│   └── nginx.conf
├── docker-compose.yml
└── README.md

### 🧱 Komponenty
- Frontend – aplikacja webowa (React + TypeScript), odpowiedzialna za interfejs
  użytkownika, szyfrowanie i deszyfrowanie wiadomości, obsługę WebSocketów oraz
  weryfikację podpisów cyfrowych.
- Backend – aplikacja serwerowa (Spring Boot, Java), odpowiedzialna za
  uwierzytelnianie, autoryzację, obsługę 2FA oraz przechowywanie zaszyfrowanych
  danych.
- NGINX – reverse proxy zapewniające szyfrowane połączenie (HTTPS / WSS) oraz
  separację warstw systemu.
- Baza danych – relacyjna baza danych SQL (PostgreSQL lub SQLite).


## ⚙️ Wymagania techniczne

Projekt spełnia następujące wymagania techniczne:
- 🐳 skonteneryzowanie aplikacji z użyciem Docker oraz Docker Compose;
- 🗄️ wykorzystanie relacyjnej bazy danych (SQL);
- 🔐 bezpieczne połączenie z aplikacją (HTTPS / WSS);
- 🌐 zastosowanie serwera WWW (NGINX) jako pośrednika (reverse proxy).


## ➕ Możliwe rozszerzenia

Projekt przewiduje możliwość dalszego rozwoju, w szczególności:
- 🛡️ zabezpieczenie przed atakami CSRF / XSRF;
- 🔄 mechanizm odzyskiwania dostępu w przypadku utraty hasła (reset hasła przez e-mail);
- 👀 monitorowanie logowań i wykrywanie nowych urządzeń;
- 🕵️ zastosowanie honeypotów rejestrujących aktywność botów lub atakujących;
- 📜 poprawna konfiguracja polityki Content-Security-Policy (CSP).


## 🎤 Dokumentacja i prezentacja

Przed rozpoczęciem implementacji przygotowywany jest dokument opisujący:
- 🧰 stos technologiczny,
- 🏗️ architekturę systemu,
- 🔐 wykorzystane algorytmy kryptograficzne,
- 🧠 kluczowe decyzje projektowe.

Na zakończenie projektu przewidziana jest krótka prezentacja (do 5 minut),
a kod źródłowy zostaje udostępniony prowadzącemu do wglądu przed prezentacją.



## Cytowany opis z ISODa 

Tematem projektu jest zbudowanie prostej aplikacji do wymiany zaszyfrowanych wiadomości z dowodem autentyczności, zawierających potencjalne załączniki (podobnie jak w systemie ProtonMail). Załączniki stanową INTEGRALNĄ część wiadomości. Aplikacja powinna pozwalać na założenie konta w systemie oraz zalogowanie się do niego przy użyciu dwuetapowej autentykacji (2FA, dopuszczalnymi metodami są TOTP oraz HOTP).

Minimalny zakres aplikacji to:

rejestracja konta;
logowanie użytkownika;
wysłanie zaszyfrowanej wiadomości do co najmniej jednego użytkownika;
usunięcie otrzymanej wiadomości;
oznaczenie otrzymanej wiadomości jako odczytanej;
obejrzenie wiadomości i pobranie dołączonych załączników;
weryfikacja autentyczności wysłanej wiadomości.
Należy wybrać (i prawidłowo wykorzystać) odpowiednie algorytmy, biblioteki i techniki zapewniające bezpieczeństwo danych użytkowników. Niezbędne jest wdrożenie skutecznych mechanizmów autoryzacji i autentykacji wszystkich końcówek aplikacji. Niesprecyzowane w tym dokumencie wymagania należy skonsultować z prowadzącym. Oczekiwana jest pełna wiedza dotycząca implementacji i konfiguracji wykorzystanych rozwiązań. Brak odpowiedniej znajomości swojego projektu stanowi podstawę do niezaliczenia projektu.

Istotne elementy, które należy uwzględnić w trakcie implementacji:

walidacja wszystkich danych wejściowych (z negatywnym nastawieniem),
opóźnienia i limity prób (żeby utrudnić zdalne zgadywanie i atak brute-force),
ograniczone informowanie o błędach (np. o przyczynie odmowy uwierzytelenia),
bezpieczne przechowywanie hasła (wykorzystanie aktualnie rekomendowanych, kryptograficznych funkcji mieszających, wykorzystanie soli, wielokrotne hashowanie),
kontrola siły hasła, żeby uświadomić użytkownikowi problem.
Przed rozpoczęciem pracy nad projektem należy załączyć w ISODzie dokument, w którym zostanie opisany planowany stos technologiczny, architektura, wykorzystane algorytmy i kluczowe decyzje projektowe.

Na koniec należy przygotować krótką prezentację (do 5 min.). Kod musi zostać udostępniony do wglądu prowadzącemu przed prezentacją. Prezentacja może zawierać jako ostatni slajd bibliografię.

Wymagania techniczne:

skonteneryzowanie projektu przy pomocą Docker: w przypadku niezrealizowania tego podpunktu aplikacja jest oceniana za maksymalnie 75%;
wykorzystanie relacyjnej bazy danych (SQL, może być SQLite),
bezpieczne połączenie z aplikacją (szyfrowane połączenie) wykorzystujące serwer WWW (NGINX, Apache HTTPd, Caddy) jako pośrednika (proxy).
Możliwe rozszerzenia:

zabezpieczenie przeciwko Cross-Site Request Forgery (żetony CSRF/XSRF),
możliwość odzyskania dostępu w przypadku utraty hasła:
"Użytkownik poprosił o zmianę hasła, wysłałbym mu link: ......
na adres e-mail: ....."
monitorowanie pracy systemu (np. żeby poinformować użytkownika o nowych komputerach, które łączyły się z jego kontem),
zostawienie rozsądnych i skutecznych honeypots pozwalających zarejestrować aktywność atakującego/bota,
poprawne skonfigurowanie Content-Security-Policy.

