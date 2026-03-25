const API_KEY = "58f8a0946fef7dfddee078100adb6877";
const HISTORY_KEY = "weatherSearchHistory";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherBox = document.getElementById("weather");
const historyBox = document.getElementById("history");

async function getWeather(city) {
    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );

    if (!res.ok) {
        throw new Error("City not found");
    }

    return res.json();
}

function renderWeather(data) {
    weatherBox.innerHTML = `
        <div class="weather-item"><label>City</label><span>${data.name}, ${data.sys.country}</span></div>
        <div class="weather-item"><label>Temperature</label><span>${data.main.temp} °C</span></div>
        <div class="weather-item"><label>Weather</label><span>${data.weather[0].main}</span></div>
        <div class="weather-item"><label>Humidity</label><span>${data.main.humidity}%</span></div>
        <div class="weather-item"><label>Wind Speed</label><span>${data.wind.speed} m/s</span></div>
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

showHistory();
