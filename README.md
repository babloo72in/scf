# Weather Forecast (sample app)

A small static web app: search a city (or use your location) to see current conditions and a 7-day forecast. Data comes from [Open-Meteo](https://open-meteo.com), which needs no API key.

## Run

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files

- `index.html` – markup
- `style.css` – styling (light/dark)
- `app.js` – geocoding, forecast fetch, rendering
