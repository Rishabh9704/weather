const apiKey = "b417e8acac9f49bc8d5225c4cb4f3073"; // Replace with your actual API key

const locationSelect = document.getElementById("location-select");
const weatherIcon = document.getElementById("weather-icon");
const temperatureElement = document.getElementById("temperature");
const descriptionElement = document.getElementById("description");
const hourlyForecastContainer = document.getElementById("hourly-forecast-container");
const dailyForecastContainer = document.getElementById("daily-forecast-container");
const searchButton = document.getElementById("search-button");
const searchLocationInput = document.getElementById("search-location");
const errorMessageElement = document.getElementById("error-message"); // Assuming you have an element with this ID to display error messages

let startTime = Date.now();

function getWeatherData(location) {
    errorMessageElement.textContent = ""; // Clear any previous error message
    searchButton.disabled = true; // Disable the button while fetching data
    searchButton.classList.add("loading"); // Add a loading class for visual feedback

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            searchButton.disabled = false;
            searchButton.classList.remove("loading");
            displayCurrentWeather(data);
            getForecastData(location);
        })
        .catch(error => {
            searchButton.disabled = false;
            searchButton.classList.remove("loading");
            console.error("Error fetching weather data:", error);
            displayErrorMessage("Failed to fetch weather data.");
        });
}

function getForecastData(location) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            displayHourlyForecast(data.list, location); // Pass the city name to displayHourlyForecast
            displayDailyForecast(data.list);
        })
        .catch(error => {
            console.error("Error fetching forecast data:", error);
            displayErrorMessage("Failed to fetch weather data.");
        });
}

function displayCurrentWeather(data) {
    const weatherIconUrl = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.src = weatherIconUrl;
    temperatureElement.textContent = `${data.main.temp.toFixed(1)}°C`;
    descriptionElement.textContent = data.weather[0].description;
}

function displayHourlyForecast(forecastData, cityName) {
    hourlyForecastContainer.innerHTML = "";

    // Create a new element for the city name
    const cityNameElement = document.createElement("h2");
    cityNameElement.textContent = cityName.toUpperCase();
    cityNameElement.classList.add("city-name");
    hourlyForecastContainer.appendChild(cityNameElement);

    // Limit to the next 8 hours of forecast
    let forecastCount = 0; // Counter to track the number of hourly forecasts

    let previousForecast = null;

    for (let i = 0; i < forecastData.length - 1 && forecastCount < 8; i++) {
        let currentForecast = forecastData[i];
        let nextForecast = forecastData[i + 1];

        let currentDate = new Date(currentForecast.dt * 1000);
        let nextDate = new Date(nextForecast.dt * 1000);

        // Add the first forecast if previousForecast is null
        if (previousForecast === null && forecastCount < 8) {
            addHourlyForecastItem(currentForecast);
            forecastCount++;
        }

        // Fill in the missing hours
        let hoursDifference = (nextDate - currentDate) / (1000 * 60 * 60); // Calculate hour difference
        let currentTemp = currentForecast.main.temp;
        let nextTemp = nextForecast.main.temp;

        for (let j = 1; j < hoursDifference && forecastCount < 8; j++) {
            let interpolatedTemp = currentTemp + ((nextTemp - currentTemp) / hoursDifference) * j;
            let interpolatedTime = new Date(currentDate.getTime() + j * 60 * 60 * 1000);

            // Manually create a forecast-like object for the interpolated time
            let interpolatedForecast = {
                dt: Math.floor(interpolatedTime.getTime() / 1000),
                main: { temp: interpolatedTemp },
                weather: currentForecast.weather
            };

            addHourlyForecastItem(interpolatedForecast);
            forecastCount++; // Increment the forecast count
        }

        previousForecast = currentForecast;

        // Add the next forecast if forecastCount < 8
        if (forecastCount < 8) {
            addHourlyForecastItem(nextForecast);
            forecastCount++;
        }
    }
}

function addHourlyForecastItem(forecast) {
    const hour = new Date(forecast.dt * 1000).getHours();
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    const amOrPm = hour < 12 ? "AM" : "PM";
    const iconUrl = `http://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`;
    const temperature = forecast.main.temp.toFixed(1);
    const date = new Date(forecast.dt * 1000).toDateString(); // Extract the date

    const hourlyForecastItem = document.createElement("div");
    hourlyForecastItem.classList.add("hourly-forecast-item");
    hourlyForecastItem.innerHTML = `
        <p>${date}</p>
        <img class="icon" src="${iconUrl}" alt="Weather icon">
        <p class="temperature">${formattedHour.toString().padStart(2, '0')}:00 ${amOrPm} - ${temperature}°C</p>
    `;
    hourlyForecastContainer.appendChild(hourlyForecastItem);
}

function displayDailyForecast(forecastData) {
    dailyForecastContainer.innerHTML = "";
    const dailyForecasts = groupByDay(forecastData);

    for (const day in dailyForecasts) {
        const dailyForecast = dailyForecasts[day].find(forecast => {
            const forecastTime = new Date(forecast.dt * 1000).getHours();
            return forecastTime >= 8;
        });

        if (dailyForecast) {
            const date = new Date(dailyForecast.dt * 1000);
            const formattedHour = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
            const amOrPm = date.getHours() < 12 ? "AM" : "PM";
            const iconUrl = `http://openweathermap.org/img/wn/${dailyForecast.weather[0].icon}@2x.png`;
            const temperature = dailyForecast.main.temp.toFixed(1);

            const dailyForecastItem = document.createElement("div");
            dailyForecastItem.classList.add("daily-forecast-item");
            dailyForecastItem.innerHTML = `
                <p>${date.toDateString()} ${formattedHour}:00 ${amOrPm}</p>
                <img class="icon" src="${iconUrl}" alt="Weather icon">
                <p class="temperature">${temperature}°C</p>
            `;
            dailyForecastContainer.appendChild(dailyForecastItem);
        }
    }
}

function groupByDay(forecastData) {
    const groupedData = {};
    forecastData.forEach(forecast => {
        const date = new Date(forecast.dt * 1000).toDateString();
        if (!groupedData[date]) {
            groupedData[date] = [];
        }
        groupedData[date].push(forecast);
    });
    return groupedData;
}

function displayErrorMessage(message) {
    // Implement error handling and display a user-friendly message
    errorMessageElement.textContent = message;
}

locationSelect.addEventListener("change", () => {
    const selectedLocation = locationSelect.value;
    getWeatherData(selectedLocation);
});

// Add event listener for the search button
searchButton.addEventListener("click", () => {
    const searchLocation = searchLocationInput.value;
    if (searchLocation.trim() === "") {
        errorMessageElement.textContent = "Please enter a location.";
    } else {
        getWeatherData(searchLocation);
    }
});

// Initial weather data for Agra
getWeatherData("agra");