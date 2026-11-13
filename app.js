// Weather app using Open-Meteo (https://open-meteo.com) — no API key required.
const $ = (id) => document.getElementById(id);

// WMO weather codes -> [emoji, description]
const WMO = {
  0: ["☀️", "Clear sky"], 1: ["🌤️", "Mainly clear"], 2: ["⛅", "Partly cloudy"], 3: ["☁️", "Overcast"],
  45: ["🌫️", "Fog"], 48: ["🌫️", "Rime fog"],
  51: ["🌦️", "Light drizzle"], 53: ["🌦️", "Drizzle"], 55: ["🌧️", "Heavy drizzle"],
  61: ["🌧️", "Light rain"], 63: ["🌧️", "Rain"], 65: ["🌧️", "Heavy rain"],
  71: ["🌨️", "Light snow"], 73: ["🌨️", "Snow"], 75: ["❄️", "Heavy snow"], 77: ["❄️", "Snow grains"],
  80: ["🌦️", "Rain showers"], 81: ["🌧️", "Heavy showers"], 82: ["⛈️", "Violent showers"],
  85: ["🌨️", "Snow showers"], 86: ["🌨️", "Heavy snow showers"],
  95: ["⛈️", "Thunderstorm"], 96: ["⛈️", "Thunderstorm, hail"], 99: ["⛈️", "Severe thunderstorm"],
};
const wmo = (c) => WMO[c] || ["❓", "Unknown"];

let place = null; // {name, latitude, longitude}

function setStatus(msg) { $("status").textContent = msg; }

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Request failed (${r.status})`);
  return r.json();
}

async function geocode(query) {
  const d = await getJSON(
    `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(query)}`
  );
  if (!d.results?.length) throw new Error(`No place found for "${query}"`);
  const p = d.results[0];
  return { name: [p.name, p.admin1, p.country].filter(Boolean).join(", "), latitude: p.latitude, longitude: p.longitude };
}

async function loadWeather() {
  if (!place) return;
  setStatus("Loading…");
  const unit = $("units").value;
  const sym = unit === "celsius" ? "°C" : "°F";
  const speed = unit === "celsius" ? "km/h" : "mph";
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&temperature_unit=${unit}&wind_speed_unit=${unit === "celsius" ? "kmh" : "mph"}`;
  try {
    const w = await getJSON(url);
    const c = w.current;
    const [icon, desc] = wmo(c.weather_code);
    $("place").textContent = place.name;
    $("icon").textContent = icon;
    $("temp").textContent = `${Math.round(c.temperature_2m)}${sym}`;
    $("desc").textContent = desc;
    $("meta").innerHTML =
      `<span>Feels like ${Math.round(c.apparent_temperature)}${sym}</span>` +
      `<span>Humidity ${c.relative_humidity_2m}%</span>` +
      `<span>Wind ${Math.round(c.wind_speed_10m)} ${speed}</span>`;
    $("current").hidden = false;

    const d = w.daily;
    $("days").innerHTML = d.time.map((t, i) => {
      const [ic, ds] = wmo(d.weather_code[i]);
      const day = i === 0 ? "Today" : new Date(t + "T12:00").toLocaleDateString(undefined, { weekday: "short" });
      return `<div class="day" title="${ds}">
        <div class="d">${day}</div><div class="i">${ic}</div>
        <div class="hi">${Math.round(d.temperature_2m_max[i])}°</div>
        <div class="lo">${Math.round(d.temperature_2m_min[i])}°</div>
        <div class="p">💧 ${d.precipitation_probability_max[i] ?? 0}%</div></div>`;
    }).join("");
    $("forecast").hidden = false;
    setStatus("");
  } catch (e) {
    setStatus("Could not load weather: " + e.message);
  }
}

async function search(query) {
  try {
    setStatus("Searching…");
    place = await geocode(query);
    await loadWeather();
  } catch (e) {
    setStatus(e.message);
  }
}

$("search").addEventListener("submit", (e) => { e.preventDefault(); search($("city").value.trim()); });
$("units").addEventListener("change", loadWeather);
$("locate").addEventListener("click", () => {
  if (!navigator.geolocation) return setStatus("Geolocation not supported.");
  setStatus("Locating…");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      place = { name: "Your location", latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      loadWeather();
    },
    () => setStatus("Location permission denied.")
  );
});

search("London"); // default city on load
