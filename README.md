# niköperminbil

Marknadsledande inom att inte köpa din bil sedan 2026.

En trygg och professionell process för dig som vill köpa min bil. Fast pris. Inga bud.

## Teknik

Statisk webbplats i ren HTML/CSS/JS, utan ramverk och utan byggsteg. Driftsätts som statiska tillgångar via Cloudflare Workers.

Scrollkoreografin (pinnade sektioner, scrubbade sekvenser, parallax) drivs av en liten egen motor i `script.js` — requestAnimationFrame + IntersectionObserver, enbart transforms/opacity. Respekterar `prefers-reduced-motion`.

```
public/          källkod som serveras direkt (HTML, CSS, JS)
wrangler.jsonc   Worker-konfiguration
```

## Utveckling

```
npx wrangler dev
```

## Driftsättning

```
npx wrangler deploy
```
