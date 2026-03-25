/**
 * Weather App — Modernized
 * Uses WeatherAPI.com for weather data and BigDataCloud for reverse geocoding.
 */

(() => {
    "use strict";

    // ── Config ──────────────────────────────────────────────────
    const API_KEY = "52c5ddc336f14e3299d13034232603";
    const WEATHER_BASE = "https://api.weatherapi.com/v1";
    const GEO_BASE = "https://api.bigdatacloud.net/data/reverse-geocode-client";

    // ── State ───────────────────────────────────────────────────
    let useCelsius = true;
    let currentData = null;   // cached API response
    let searchTimeout = null;

    // ── DOM refs ────────────────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const loadingOverlay = $("#loading-overlay");
    const errorContainer = $("#error-message");
    const errorText      = $("#error-text");
    const mainContent    = $("#main-content");
    const warnBanner     = $("#warning-message");

    const elLocation        = $(".location");
    const elSummary         = $(".weather-summary");
    const elTempDeg         = $(".temperature-degree");
    const elTempUnit        = $(".temperature-unit");
    const elFeelsLikeDeg    = $(".feels-like-degree");
    const elFeelsLikeUnit   = $(".feels-like-unit");
    const elHumidity        = $(".humidity");
    const elPressure        = $(".pressure");
    const elPressureDesc    = $(".pressure-desc");
    const elWindSpeed       = $(".wind-speed");
    const elWindDir         = $(".wind-direction");
    const elWindGust        = $(".wind-gust-speed");
    const elUV              = $(".uv-index");
    const elUVDesc          = $(".uv-desc");
    const elVisibility      = $(".visibility");
    const elSunrise         = $(".sunrise");
    const elSunset          = $(".sunset");
    const elDateTime        = $(".date-and-time");
    const elWeatherIcon     = $("#weather-icon");
    const elUnitToggle      = $("#unit-toggle");
    const elSearchInput     = $("#search-input");
    const elSearchResults   = $("#search-results");
    const elHourlyContainer = $("#hourly-container");
    const elDailyContainer  = $("#daily-container");

    // ── Helpers ─────────────────────────────────────────────────
    const round1 = (v) => (Math.round(v * 10) / 10).toString();
    const cToF   = (c) => (c * 9 / 5) + 32;

    function showError(msg) {
        loadingOverlay.classList.add("hidden");
        errorText.textContent = msg;
        errorContainer.style.display = "flex";
    }

    function hideLoading() {
        loadingOverlay.classList.add("hidden");
        mainContent.style.display = "block";
    }

    // ── UV description ────────────────────────────────────────────
    function uvDescription(uv) {
        if (uv <= 2)  return "Low";
        if (uv <= 5)  return "Moderate";
        if (uv <= 7)  return "High";
        if (uv <= 10) return "Very High";
        return "Extreme";
    }

    // ── Pressure description ────────────────────────────────────────
    function pressureDescription(p, tempC) {
        if (typeof p !== "number") return "";
        if (p > 1022.689) return "Pleasant";
        if (p >= 1009.144) return "Steady";
        if (tempC > 0) return "Rainstorms possible";
        return "Snowstorms possible";
    }

    // ── Wind direction ────────────────────────────────────────────
    function windDirection(deg) {
        const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
        return dirs[Math.round(deg / 22.5) % 16];
    }

    // ── Day / night check ─────────────────────────────────────────
    function parseTime12(str) {
        const [time, ampm] = str.split(" ");
        let [h, m] = time.split(":").map(Number);
        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        return h * 60 + m;
    }

    function isDayTime(sunrise, sunset) {
        const now = new Date();
        const mins = now.getHours() * 60 + now.getMinutes();
        return mins >= parseTime12(sunrise) && mins < parseTime12(sunset);
    }

    // ── Sun arc position ──────────────────────────────────────────
    function updateSunArc(sunrise, sunset) {
        const sunCircle = $("#sun-position");
        if (!sunCircle) return;
        const now = new Date();
        const mins = now.getHours() * 60 + now.getMinutes();
        const rise = parseTime12(sunrise);
        const set  = parseTime12(sunset);

        if (mins < rise || mins > set) {
            sunCircle.style.display = "none";
            return;
        }
        const progress = (mins - rise) / (set - rise);       // 0→1
        // Quadratic bezier: P = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
        const p0 = { x: 10, y: 90 };
        const p1 = { x: 100, y: 0 };
        const p2 = { x: 190, y: 90 };
        const t = progress;
        const cx = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x;
        const cy = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y;
        sunCircle.setAttribute("cx", cx);
        sunCircle.setAttribute("cy", cy);
        sunCircle.style.display = "block";
    }

    // ── Weather icon URL (WeatherAPI provides icons) ────────
    function iconUrl(conditionIcon) {
        return "https:" + conditionIcon.replace("64x64", "128x128");
    }

    // ── Fetch wrapper ───────────────────────────────────────────
    async function apiFetch(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("API error: " + res.status);
        return res.json();
    }

    // ── Set hazard warnings (preserved original logic) ──────
    function setHazardWarning(alerts, currentEpoch) {
        const list = alerts.alert;
        if (!list || list.length === 0) return;

        const unique = {};
        const hazardsRe  = /Hazards:[\s\S]*?(?=\n\nTiming:)/;
        const hazardRe   = /Hazard:[\s\S]*?(?=\n\nTiming:)/;
        const timingRe   = /Timing:[\s\S]*?(?=\n\nDiscussion:)/;

        for (const w of list) {
            const expiry = Date.parse(w.expires) / 1000;
            if (expiry < currentEpoch) continue;

            const msg = w.desc;
            let hazardMsg = "";
            if (hazardsRe.test(msg))      hazardMsg = msg.match(hazardsRe)[0];
            else if (hazardRe.test(msg))   hazardMsg = msg.match(hazardRe)[0];
            else continue;

            const timingMatch = msg.match(timingRe);
            const timingMsg = timingMatch ? timingMatch[0] : "";

            if (!unique[hazardMsg]) unique[hazardMsg] = timingMsg;
        }

        const entries = Object.entries(unique);
        if (entries.length === 0) return;

        const result = entries.map(([h, t]) => h + "\n" + t).join("\n\n");
        warnBanner.innerHTML = result;
        warnBanner.style.display = "block";
    }

    // ── Render current weather ──────────────────────────────────────
    function renderCurrent(data) {
        const cur = data.current;
        const astro = data.forecast.forecastday[0].astro;

        // Icon
        elWeatherIcon.src = iconUrl(cur.condition.icon);
        elWeatherIcon.alt = cur.condition.text;

        // Summary
        elSummary.textContent = cur.condition.text;

        // Temperatures
        const tempC = cur.temp_c;
        const feelsC = cur.feelslike_c;
        elTempDeg.textContent = round1(useCelsius ? tempC : cToF(tempC));
        elTempUnit.textContent = useCelsius ? "°C" : "°F";
        elFeelsLikeDeg.textContent = round1(useCelsius ? feelsC : cToF(feelsC));
        elFeelsLikeUnit.textContent = useCelsius ? "°C" : "°F";

        // Details
        elHumidity.textContent = cur.humidity + "%";
        elWindSpeed.textContent = cur.wind_kph + " km/h";
        elWindDir.textContent = windDirection(cur.wind_degree) + " " + cur.wind_kph + " km/h";
        elWindGust.textContent = cur.gust_kph + " km/h";

        const pMb = cur.pressure_mb;
        elPressure.textContent = pMb + " hPa";
        elPressureDesc.textContent = pressureDescription(pMb, tempC);

        elUV.textContent = cur.uv;
        elUVDesc.textContent = uvDescription(cur.uv);
        elVisibility.textContent = cur.vis_km + " km";

        // Sun
        elSunrise.textContent = astro.sunrise;
        elSunset.textContent  = astro.sunset;
        updateSunArc(astro.sunrise, astro.sunset);

        // Warnings
        setHazardWarning(data.alerts, cur.last_updated_epoch);

        // Date
        elDateTime.textContent = new Date().toString();
    }

    // ── Render hourly forecast ──────────────────────────────────────
    function renderHourly(data) {
        const hours = [];
        const nowHour = new Date().getHours();
        const today = data.forecast.forecastday[0].hour;
        const tomorrow = data.forecast.forecastday[1] ? data.forecast.forecastday[1].hour : [];

        // Collect next 24 hours
        for (const h of today) {
            const hh = new Date(h.time).getHours();
            if (hh >= nowHour) hours.push(h);
        }
        for (const h of tomorrow) {
            if (hours.length >= 24) break;
            hours.push(h);
        }

        elHourlyContainer.innerHTML = hours.slice(0, 24).map((h, i) => {
            const hr = new Date(h.time).getHours();
            const label = i === 0 ? "Now" : (hr === 0 ? "12 AM" : hr <= 12 ? hr + (hr === 12 ? " PM" : " AM") : (hr - 12) + " PM");
            const temp = useCelsius ? round1(h.temp_c) : round1(cToF(h.temp_c));
            const unit = useCelsius ? "°" : "°";
            return `
                <div class="hourly-item${i === 0 ? " now" : ""}">
                    <div class="hourly-time">${label}</div>
                    <img class="hourly-icon" src="https:${h.condition.icon}" alt="${h.condition.text}">
                    <div class="hourly-temp">${temp}${unit}</div>
                </div>`;
        }).join("");
    }

    // ── Render 5-day forecast ───────────────────────────────────────
    function renderDaily(data) {
        const days = data.forecast.forecastday;
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        elDailyContainer.innerHTML = days.map((d, i) => {
            const dt = new Date(d.date + "T12:00:00");
            const dayLabel = i === 0 ? "Today" : dayNames[dt.getDay()];
            const dateLabel = monthNames[dt.getMonth()] + " " + dt.getDate();
            const hi = useCelsius ? round1(d.day.maxtemp_c) : round1(cToF(d.day.maxtemp_c));
            const lo = useCelsius ? round1(d.day.mintemp_c) : round1(cToF(d.day.mintemp_c));
            const unit = useCelsius ? "°" : "°";
            return `
                <div class="daily-item">
                    <div class="daily-day">${dayLabel} <span class="daily-date">${dateLabel}</span></div>
                    <img class="daily-icon" src="https:${d.day.condition.icon}" alt="${d.day.condition.text}">
                    <div class="daily-condition">${d.day.condition.text}</div>
                    <div class="daily-temps">
                        <span class="daily-high">${hi}${unit}</span>
                        <span class="daily-low">${lo}${unit}</span>
                    </div>
                </div>`;
        }).join("");
    }

    // ── Render all ────────────────────────────────────────────────
    function renderAll(data) {
        currentData = data;
        renderCurrent(data);
        renderHourly(data);
        renderDaily(data);
    }

    // ── Set location name ─────────────────────────────────────────
    async function setLocationName(lat, lon, sunrise, sunset) {
        try {
            const geo = await apiFetch(GEO_BASE + "?latitude=" + lat + "&longitude=" + lon + "&localityLanguage=en");
            const tag = isDayTime(sunrise, sunset) ? " (Day)" : " (Night)";
            const sub = geo.principalSubdivision;
            elLocation.textContent = geo.city + ", " + (sub || geo.countryName) + tag;
        } catch (e) {
            elLocation.textContent = lat.toFixed(2) + ", " + lon.toFixed(2);
        }
    }

    // ── Main fetch ──────────────────────────────────────────────
    async function loadWeather(lat, lon) {
        try {
            const url = WEATHER_BASE + "/forecast.json?key=" + API_KEY + "&q=" + lat + "," + lon + "&days=5&aqi=no&alerts=yes";
            const data = await apiFetch(url);
            const astro = data.forecast.forecastday[0].astro;

            renderAll(data);
            await setLocationName(lat, lon, astro.sunrise, astro.sunset);
            hideLoading();
        } catch (err) {
            console.error(err);
            showError("Unable to fetch weather data. Please try again.");
        }
    }

    // ── Load by city query ────────────────────────────────────────
    async function loadWeatherByQuery(query) {
        loadingOverlay.classList.remove("hidden");
        mainContent.style.display = "none";
        try {
            const url = WEATHER_BASE + "/forecast.json?key=" + API_KEY + "&q=" + encodeURIComponent(query) + "&days=5&aqi=no&alerts=yes";
            const data = await apiFetch(url);
            const loc = data.location;

            renderAll(data);

            // Set location from API response
            const astro = data.forecast.forecastday[0].astro;
            const tag = isDayTime(astro.sunrise, astro.sunset) ? " (Day)" : " (Night)";
            const region = loc.region || loc.country;
            elLocation.textContent = loc.name + ", " + region + tag;

            hideLoading();
        } catch (err) {
            console.error(err);
            showError("City not found. Please try a different search.");
        }
    }

    // ── Search autocomplete ───────────────────────────────────────
    async function searchCities(query) {
        if (query.length < 2) {
            elSearchResults.classList.remove("visible");
            return;
        }
        try {
            const url = WEATHER_BASE + "/search.json?key=" + API_KEY + "&q=" + encodeURIComponent(query);
            const results = await apiFetch(url);
            if (results.length === 0) {
                elSearchResults.classList.remove("visible");
                return;
            }
            elSearchResults.innerHTML = results.slice(0, 5).map(r => {
                const label = r.name + ", " + (r.region ? r.region + ", " : "") + r.country;
                return '<div class="search-result-item" data-query="' + r.lat + ',' + r.lon + '">' + label + '</div>';
            }).join("");
            elSearchResults.classList.add("visible");
        } catch (e) {
            elSearchResults.classList.remove("visible");
        }
    }

    // ── Event listeners ─────────────────────────────────────────

    // Unit toggle (shared logic)
    function toggleUnit() {
        useCelsius = !useCelsius;
        elUnitToggle.textContent = useCelsius ? "°C" : "°F";
        if (currentData) renderAll(currentData);
    }

    // Toggle via button
    elUnitToggle.addEventListener("click", toggleUnit);

    // Toggle via clicking on the temperature display (hero card)
    const elHeroTemp = $(".hero-temp");
    if (elHeroTemp) elHeroTemp.addEventListener("click", toggleUnit);
    const elFeelsLike = $(".feels-like-text");
    if (elFeelsLike) elFeelsLike.addEventListener("click", toggleUnit);

    // Search input with debounce
    elSearchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchCities(e.target.value.trim()), 300);
    });

    elSearchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const val = elSearchInput.value.trim();
            if (val) {
                elSearchResults.classList.remove("visible");
                loadWeatherByQuery(val);
            }
        }
    });

    // Search result click
    elSearchResults.addEventListener("click", (e) => {
        const item = e.target.closest(".search-result-item");
        if (!item) return;
        elSearchInput.value = item.textContent;
        elSearchResults.classList.remove("visible");
        loadWeatherByQuery(item.dataset.query);
    });

    // Close search results on outside click
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-container")) {
            elSearchResults.classList.remove("visible");
        }
    });

    // ── Init ────────────────────────────────────────────────────
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
            (err) => {
                console.warn("Geolocation denied:", err.message);
                // Fallback to Richmond Hill, Ontario
                loadWeather(43.8828, -79.4403);
            },
            { timeout: 10000 }
        );
    } else {
        // No geolocation support — fallback
        loadWeather(43.8828, -79.4403);
    }

})();
