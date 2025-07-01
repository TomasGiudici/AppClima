const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const weatherResult = document.getElementById('weather-result');
const cityNameElement = document.getElementById('city-name');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const humidityElement = document.getElementById('humidity');
const windSpeedElement = document.getElementById('wind-speed');

const hourlyForecastSection = document.getElementById('hourly-forecast');
const hourlyForecastContainer = document.getElementById('hourly-forecast-container');

let scrollTarget = hourlyForecastSection.scrollLeft;
let isScrolling = false;

const API_KEY = '51ca2a87e58f43633dd60c7a7fba07ce';

/**
 * Fetches current weather data for a given city.
 * @param {string} city - The name of the city.
 * @returns {Promise<object>} - A promise that resolves with the weather data.
 */
async function fetchCurrentWeatherData(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=es`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Fetches hourly forecast data for a given city.
 * @param {string} city - The name of the city.
 * @returns {Promise<object>} - A promise that resolves with the forecast data.
 */
async function fetchHourlyForecastData(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=es`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Handles fetching both current weather and hourly forecast data.
 * @param {string} city - The name of the city.
 */
async function fetchAllWeatherData(city) {
    weatherResult.classList.remove('show');
    hourlyForecastSection.classList.remove('show');
    errorMessage.classList.remove('show');

    try {
        // Fetch both current weather and forecast concurrently
        const [currentWeather, hourlyForecast] = await Promise.all([
            fetchCurrentWeatherData(city),
            fetchHourlyForecastData(city)
        ]);

        displayWeather(currentWeather);
        displayHourlyForecast(hourlyForecast);

    } catch (error) {
        let userMessage = 'Ocurrió un error inesperado.';
        if (error.message.includes('404')) {
            userMessage = 'Ciudad no encontrada. Por favor, verifica el nombre.';
        } else if (error.message.includes('401')) {
            userMessage = 'Error de autenticación. Revisa tu clave de API.';
        } else {
            userMessage = `Error: ${error.message}`;
        }
        displayError(userMessage);
        console.error('Error fetching weather data:', error);
    }
}

/**
 * Displays current weather data in the UI.
 * @param {object} data - JSON object with current weather data.
 */
function displayWeather(data) {
    cityNameElement.textContent = data.name;
    temperatureElement.textContent = `${Math.round(data.main.temp)}°C`;
    descriptionElement.textContent = data.weather[0].description;
    humidityElement.textContent = `${data.main.humidity}%`;
    windSpeedElement.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;

    weatherResult.classList.add('show');
}

/**
 * @param {object} data - JSON object with hourly forecast data.
 */
function displayHourlyForecast(data) {
    hourlyForecastContainer.innerHTML = '';

    // Take the next 8 forecast entries (24 hours, as each is 3 hours)
    const forecastItems = data.list.slice(0, 8);

    forecastItems.forEach(item => {
        const dateTime = new Date(item.dt * 1000);
        const hour = dateTime.getHours();
        const temperature = Math.round(item.main.temp);
        const description = item.weather[0].description;
        const iconCode = item.weather[0].icon; // Icon code from OpenWeatherMap

        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecastCard';
        forecastCard.innerHTML = `
            <p>${hour}:00</p>
            <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${description}">
            <p>${temperature}°C</p>
            <p>${description}</p>
        `;
        hourlyForecastContainer.appendChild(forecastCard);
    });

    hourlyForecastSection.classList.add('show');
}

function displayError(message) {
    errorText.textContent = message;
    errorMessage.classList.add('show'); 
    weatherResult.classList.remove('show'); 
    hourlyForecastSection.classList.remove('show'); 
}

searchButton.addEventListener('click', () => {
    const city = cityInput.value.trim(); // Elimina espacios en blanco al inicio/final
    if (city) {
        fetchAllWeatherData(city);
    } else {
        displayError('Por favor, ingresa el nombre de una ciudad.');
    }
});

cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

hourlyForecastSection.addEventListener('wheel', function (e) {
    if (e.deltaY !== 0) {
      e.preventDefault();

      // Suma al objetivo el desplazamiento suavizado
      scrollTarget += e.deltaY * 0.5;

      // Limita el objetivo al rango válido
      scrollTarget = Math.max(
        0,
        Math.min(scrollTarget, hourlyForecastSection.scrollWidth - hourlyForecastSection.clientWidth)
      );

      if (!isScrolling) {
        isScrolling = true;
        smoothScroll();
      }
    }
  }, { passive: false });

  function smoothScroll() {
    const scrollSpeed = 0.2;
    const distance = scrollTarget - hourlyForecastSection.scrollLeft;

    if (Math.abs(distance) < 0.5) {
      hourlyForecastSection.scrollLeft = scrollTarget;
      isScrolling = false;
      return;
    }

    hourlyForecastSection.scrollLeft += distance * scrollSpeed;
    requestAnimationFrame(smoothScroll);
  }