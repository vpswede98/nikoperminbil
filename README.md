# niköperminbil

Marknadsledande inom att inte köpa din bil sedan 2026.

En trygg och professionell process för dig som vill köpa min bil. Fast pris. Inga bud.

## Teknik

Statisk webbplats i ren HTML/CSS, utan ramverk och utan byggsteg. Driftsätts som statiska tillgångar via Cloudflare Workers.

```
public/          källkod som serveras direkt (HTML, CSS)
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
