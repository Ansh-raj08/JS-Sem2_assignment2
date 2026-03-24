const API_KEY = "58f8a0946fef7dfddee078100adb6877";
// const API_KEY = "af9f63c59a649f27d602b96a43d0bd14";

const weatherBox = document.getElementById("weather");
const historyBox = document.getElementById("history");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const locationStatus = document.getElementById("locationStatus");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const HISTORY_KEY = "weatherSearchHistory";
const THEME_KEY = "weatherTheme";

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeIcon.textContent = theme === "dark" ? "🌙" : "☀";
}

function setLocationStatus(message, isError = false) {
    locationStatus.textContent = message;
    locationStatus.classList.toggle("error", isError);
}

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "dark" || savedTheme === "light") {
        applyTheme(savedTheme);
        return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
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

function getHistoryList() {
    try {
        const saved = localStorage.getItem(HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        return [];
    }
}

/* ---------- WEATHER FETCH ---------- */
async function getWeather(city) {
    // small delay for smoother UI
    // await new Promise((r) => setTimeout(r, 500));

    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );

    if (!res.ok) {
        alert("city not found");
        throw new Error("City not found");
    }

    const data = await res.json();
    return data;
}

async function getWeatherByCoords(lat, lon) {
    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    if (!res.ok) {
        throw new Error("Unable to fetch weather for your location");
    }

    const data = await res.json();
    return data;
}

/* ---------- BUTTON CLICK ---------- */
searchBtn.onclick = () => {
    const city = cityInput.value.trim();
    if (city) {
        search(city);
    }
};

locationBtn.onclick = () => {
    if (!navigator.geolocation) {
        setLocationStatus("Geolocation is not supported in this browser.", true);
        return;
    }

    setLocationStatus("Requesting location permission...");
    locationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            setLocationStatus(`Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}`);

            try {
                const data = await getWeatherByCoords(latitude, longitude);
                renderWeather(data);
                saveHistory(data.name);
                cityInput.value = data.name;
            } catch (error) {
                weatherBox.innerHTML = `<p>${error.message}</p>`;
                setLocationStatus("Could not fetch weather for your location.", true);
            }

            locationBtn.disabled = false;
        },
        (err) => {
            if (err.code === 1) {
                setLocationStatus("Location access denied. Please allow permission.", true);
            } else if (err.code === 2) {
                setLocationStatus("Location unavailable. Try again.", true);
            } else {
                setLocationStatus("Location request timed out. Try again.", true);
            }
            locationBtn.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        }
    );
};

/* ---------- UI RENDER ---------- */
function getWeatherIconUrl(mainCondition) {
    const condition = mainCondition.toLowerCase();

    if (condition === "clear") {
        return "https://cdn-icons-png.flaticon.com/512/4814/4814489.png"; // Sunny
    }

    if (condition === "rain" || condition === "drizzle") {
        return "https://cdn-icons-png.flaticon.com/512/3313/3313888.png"; // Rainy
    }

    if (condition === "snow") {
        return "https://cdn-icons-png.flaticon.com/512/6363/6363108.png"; // Snowy
    }

    if (condition === "thunderstorm") {
        return "https://cdn-icons-png.flaticon.com/512/3236/3236860.png"; // Thunderstorm
    }

    if (condition === "clouds") {
        return "https://cdn-icons-png.flaticon.com/512/3222/3222801.png"; // Cloudy
    }

    // Mist, haze, fog, smoke and other uncommon conditions
    return "https://cdn-icons-png.flaticon.com/512/1163/1163657.png";
}

function renderWeather(d) {
    const weatherMain = d.weather[0].main;
    const iconUrl = getWeatherIconUrl(weatherMain);

    weatherBox.innerHTML = `
        <div class="weather-header">
            <img src="${iconUrl}" alt="${weatherMain} icon">
            <span>${weatherMain}</span>
        </div>
        <div class="weather-item"><label>City</label><span>${d.name}, ${d.sys.country}</span></div>
        <div class="weather-item"><label>Temperature</label><span>${d.main.temp} °C</span></div>
        <div class="weather-item"><label>Weather</label><span>${weatherMain}</span></div>
        <div class="weather-item"><label>Humidity</label><span>${d.main.humidity}%</span></div>
        <div class="weather-item"><label>Wind Speed</label><span>${d.wind.speed} m/s</span></div>
    `;
}

/* ---------- SAVE SEARCH HISTORY ---------- */
function saveHistory(city) {
    let cityList = getHistoryList();

    // Keep unique city names (case-insensitive), newest first
    cityList = cityList.filter((item) => item.toLowerCase() !== city.toLowerCase());
    cityList.unshift(city);

    // Keep last 6 searches only (simple and clean for UI)
    cityList = cityList.slice(0, 6);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(cityList));
    showHistory();
}

/* ---------- SHOW HISTORY ---------- */
function showHistory() {
    const cityList = getHistoryList();

    historyBox.innerHTML = "";

    cityList.forEach((city) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = city;
        btn.setAttribute("data-city", city);
        historyBox.appendChild(btn);
    });
}

historyBox.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-city]");
    if (!button) {
        return;
    }

    const city = button.getAttribute("data-city");
    if (!city) {
        return;
    }

    cityInput.value = city;
    search(city);
});

/* ---------- SEARCH FUNCTION ---------- */
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

/* ---------- ENTER KEY SEARCH ---------- */
cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const city = cityInput.value.trim();
        if (city) {
            search(city);
        }
    }
});

/* ---------- INITIAL LOAD ---------- */
initTheme();
showHistory();
