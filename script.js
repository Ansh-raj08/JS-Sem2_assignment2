const API_KEY = "58f8a0946fef7dfddee078100adb6877";
const HISTORY_KEY = "weatherSearchHistory";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherBox = document.getElementById("weather");
const historyBox = document.getElementById("history");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const THEME_KEY = "weatherTheme";
const MAX_THERMOMETER_TEMP = 75;

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeIcon.textContent = theme === "dark" ? "🌙" : "☀";
}

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
        applyTheme(savedTheme);
        return;
    }

    applyTheme("light");
}

themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "light" ? "dark" : "light";

    themeToggle.classList.add("toggling");
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);

    setTimeout(() => {
        themeToggle.classList.remove("toggling");
    }, 350);
});

async function getWeather(city) {
    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );

    if (!res.ok) {
        alert("city not found")
        throw new Error("City not found");
    }

    return res.json();
}

function getThermometerFill(tempCelsius) {
    const clamped = Math.max(0, Math.min(tempCelsius, MAX_THERMOMETER_TEMP));
    return (clamped / MAX_THERMOMETER_TEMP) * 100;
}

function getWindMeterData(windSpeed) {
    const WIND_METER_MAX = 20;
    const clamped = Math.max(0, Math.min(windSpeed, WIND_METER_MAX));
    const percent = (clamped / WIND_METER_MAX) * 100;

    let label = "Calm";
    if (windSpeed >= 15) {
        label = "Strong";
    } else if (windSpeed >= 8) {
        label = "Breezy";
    } else if (windSpeed >= 3) {
        label = "Light";
    }

    return { percent, label };
}

function renderWeather(data) {
    const temp = Number(data.main.temp);
    const clampedTemp = Math.max(0, Math.min(temp, MAX_THERMOMETER_TEMP));
    const thermometerFill = getThermometerFill(temp);
    const windSpeed = Number(data.wind.speed);
    const windMeter = getWindMeterData(windSpeed);

    weatherBox.innerHTML = `
        <div class="weather-item"><label>City</label><span>${data.name}, ${data.sys.country}</span></div>
        <div class="weather-item"><label>Temperature</label><span>${temp.toFixed(1)} °C</span></div>
        <div class="thermometer-wrap" aria-label="Temperature thermometer with max ${MAX_THERMOMETER_TEMP} degree celsius">
            <div class="thermometer-panel">
                <div class="thermometer-scale">
                    <span>75&deg;C</span>
                    <span>60&deg;C</span>
                    <span>45&deg;C</span>
                    <span>30&deg;C</span>
                    <span>15&deg;C</span>
                    <span>0&deg;C</span>
                </div>
                <div class="thermometer-shell">
                    <div class="thermometer" role="meter" aria-valuemin="0" aria-valuemax="${MAX_THERMOMETER_TEMP}" aria-valuenow="${clampedTemp.toFixed(1)}">
                        <div class="thermometer-fill" style="height: ${thermometerFill}%;"></div>
                    </div>
                    <div class="thermometer-bulb"></div>
                </div>
            </div>
        </div>
        <div class="weather-item"><label>Weather</label><span>${data.weather[0].main}</span></div>
        <div class="weather-item"><label>Humidity</label><span>${data.main.humidity}%</span></div>
        <div class="weather-item"><label>Wind Speed</label><span>${windSpeed.toFixed(1)} m/s</span></div>
        <div class="wind-indicator" aria-label="Wind intensity indicator">
            <div class="wind-indicator-head">
                <label>Wind Intensity</label>
                <span>${windMeter.label}</span>
            </div>
            <div class="wind-meter" role="meter" aria-valuemin="0" aria-valuemax="20" aria-valuenow="${Math.max(0, Math.min(windSpeed, 20)).toFixed(1)}">
                <div class="wind-meter-fill" style="width: ${windMeter.percent}%;"></div>
                <div class="wind-meter-marker" style="left: calc(${windMeter.percent}% - 1px);"></div>
            </div>
            <div class="wind-scale">
                <span>0</span>
                <span>5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
            </div>
        </div>
    `;
}

function getHistory() {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
}

function saveHistory(city) {
    let list = getHistory();
    list = list.filter((item) => item.toLowerCase() !== city.toLowerCase());
    list.unshift(city);
    list = list.slice(0, 6);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    showHistory();
}

function showHistory() {
    const list = getHistory();
    historyBox.innerHTML = "";

    list.forEach((city) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = city;
        btn.dataset.city = city;
        historyBox.appendChild(btn);
    });
}

async function search(city) {
    weatherBox.innerHTML = "";

    try {
        const data = await getWeather(city);
        renderWeather(data);
        saveHistory(data.name);
    } catch (error) {
        weatherBox.innerHTML = `<p>${error.message}</p>`;
    }
}

searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) {
        search(city);
    }
});

cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const city = cityInput.value.trim();
        if (city) {
            search(city);
        }
    }
});

historyBox.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-city]");
    if (!button) {
        return;
    }

    const city = button.dataset.city;
    cityInput.value = city;
    search(city);
});

initTheme();
showHistory();
