# Wdrożenie frontendu przez FTP

FTP wystarcza do opublikowania frontendu Angular jako statycznych plików. Nie wystarcza do uruchomienia backendu Express + Prisma, migracji PostgreSQL ani WebSocketów.

## Co da się zrobić z samym FTP

- wrzucić panel Angular,
- ustawić adres publicznego API w `assets/config/app-config.js`,
- obsłużyć odświeżanie tras Angulara przez `.htaccess`,
- korzystać z aplikacji, jeśli backend działa gdzieś publicznie.

## Czego nie da się zrobić z samym FTP

- uruchomić backendu Node.js,
- wykonać `npm install`, `npm run start` albo `prisma migrate deploy`,
- utrzymać WebSocketów,
- hostować PostgreSQL,
- bezpiecznie trzymać sekretów backendu.

## Przygotowanie paczki

Jeśli backend działa publicznie pod adresem `https://api.twojadomena.pl`:

```powershell
cd "C:\Users\micha\Desktop\Michał\husaria\husaria\husaria"
npm.cmd run build:ftp -- -ApiBaseUrl "https://api.twojadomena.pl"
```

Skrypt zrobi build i utworzy:

```text
C:\Users\micha\Desktop\Michał\husaria\husaria\husaria\dist\husaria-ftp.zip
```

Na FTP wrzuć zawartość katalogu:

```text
C:\Users\micha\Desktop\Michał\husaria\husaria\husaria\dist\husaria
```

## Upload z terminala

Jeśli nie używasz FileZilli/WinSCP, możesz użyć skryptu z repo:

```powershell
cd "C:\Users\micha\Desktop\Michał\husaria\husaria"
powershell -ExecutionPolicy Bypass -File .\scripts\upload-ftp.ps1 `
  -Server "ftp.j7pl.webd.pro" `
  -Port 21 `
  -Username "zawody@ligahusarska.pl" `
  -LocalPath ".\husaria\dist\husaria" `
  -RemotePath "/"
```

Skrypt zapyta o hasło lokalnie w terminalu. Jeśli hosting wymaga jawnego FTPS, dodaj `-UseFtps`.

Nie wrzucaj samego katalogu `husaria`, tylko jego zawartość do katalogu publicznego hostingu, zwykle `public_html`, `www`, `htdocs` albo katalog wskazany przez dostawcę.

## Plik konfiguracyjny API

Po uploadzie możesz awaryjnie zmienić adres backendu bez ponownego builda, edytując na FTP:

```text
assets/config/app-config.js
```

Przykład:

```js
window.__HUSARIA_CONFIG__ = {
  apiBaseUrl: "https://api.twojadomena.pl"
};
```

Jeśli frontend i backend są na tej samej domenie przez reverse proxy, można ustawić pusty string:

```js
window.__HUSARIA_CONFIG__ = {
  apiBaseUrl: ""
};
```

## Ważne dla hostingu

W paczce jest `.htaccess`, który przekierowuje trasy Angulara do `index.html`. Jeśli hosting nie obsługuje `.htaccess`, odświeżenie strony typu `/league` może kończyć się 404. Wtedy trzeba w panelu hostingu ustawić fallback wszystkich tras do `index.html`.

## Backend

Dla backendu nadal potrzebny jest hosting z jednym z tych wariantów:

- SSH + Docker,
- VPS,
- panel hostingu z obsługą Node.js i zmiennych środowiskowych,
- platforma typu Railway, Render, Fly.io, Supabase Edge/Functions albo inny runtime Node.js.

Samo drugie konto FTP może służyć co najwyżej jako miejsce na pliki lub backup, ale nie jako działający backend.
