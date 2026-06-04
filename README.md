# WNCW Imweb Assets

Static image assets and an Imweb code-block snippet for the WNCW homepage.

## CDN base

`https://cdn.jsdelivr.net/gh/wncw/wncw-imweb-assets@main/assets/`

## Files

- `assets/wncw-console-overview.png`
- `assets/wncw-console-search.png`
- `assets/wncw-console-pipeline.png`
- `assets/wncw-console-insights.png`
- `assets/wncw-logo-horizontal.png`
- `assets/wncw-logo-symbol.png`
- `imweb-code.html`
- `preview-local.html`
- `preview-imweb-simulated.html`
- `build-imweb-snippet.mjs`

## Rebuild

Run after editing `../wncw-homepage/index.html` or `../wncw-homepage/styles.css`:

```bash
node build-imweb-snippet.mjs
```
