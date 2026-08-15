# niköperminbil

Marknadsledande inom att inte köpa din bil sedan 2026.

Live: <https://nikoperminbil.se>

En cinematisk one-pager om en bil som är till salu för 4 750 000 kr — ett fast pris som aldrig
förhandlas. Sajten är **satir**: ingen bil säljs, inga bud tas emot och inga uppgifter samlas in.
Projektet finns till som en övning i scrollkoreografi och typografi utan ramverk.

## Teknik

Statisk webbplats i ren HTML/CSS/JS — inga ramverk, inga beroenden i webbläsaren, inget byggsteg.
Driftsätts som statiska tillgångar via Cloudflare Workers.

Scrollkoreografin (pinnade sektioner, scrubbade sekvenser, parallax) drivs av en liten egen motor i
`public/script.js`: `requestAnimationFrame` + `IntersectionObserver`, och enbart `transform` och
`opacity` för att hålla animationerna på kompositorn.

Sidan är byggd för att fungera även utan effekterna. All text finns i HTML, animationerna är
progressiv förbättring och `prefers-reduced-motion` stänger av rörelsen.

```
public/
  index.html     allt innehåll och all struktur
  style.css      formgivning, animationer, responsivitet
  script.js      scrollmotor, förhandlingssimulator, kursor
wrangler.jsonc   Worker-konfiguration
```

## Utveckling

Kräver Node.js 20 eller senare.

```bash
npm install
```

```bash
npm run dev
```

Sajten körs då på <http://localhost:8787>. Filerna i `public/` serveras direkt — redigera och ladda om.

## Driftsättning

Push till `main` driftsätter automatiskt via GitHub Actions
([workflow](.github/workflows/deploy.yml)). Det kräver två secrets i repot —
`CLOUDFLARE_API_TOKEN` och `CLOUDFLARE_ACCOUNT_ID`. Saknas de hoppar workflowet över
driftsättningen i stället för att fallera.

Manuellt går det lika bra:

```bash
npm run deploy
```

Kräver att Wrangler är inloggad mot rätt Cloudflare-konto (`npx wrangler login`).

## Licens

[MIT](LICENSE) för koden. Bilen ingår inte.
