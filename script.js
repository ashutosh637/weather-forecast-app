document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const weatherData = document.getElementById('weather-data');
    const loading = document.getElementById('loading');
    
    // Default location
    let currentLocation = 'Bhopal';
    
    // Initialize the app
    getWeatherData(currentLocation);
    
    // Search functionality
    searchBtn.addEventListener('click', function() {
        const location = searchInput.value.trim();
        if (location) {
            getWeatherData(location);
        }
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const location = searchInput.value.trim();
            if (location) {
                getWeatherData(location);
            }
        }
    });
    
    // Get weather data from Open-Meteo API
    async function getWeatherData(location) {
        try {
            loading.style.display = 'block';
            weatherData.innerHTML = '';
            weatherData.appendChild(loading);
            
            // First, get coordinates for the location
            const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=1`);
            const geoData = await geoResponse.json();
            
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('Location not found');
            }
            
            const { latitude, longitude, name, country, admin1 } = geoData.results[0];
            
            // Get current weather and forecast
            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&hourly=temperature_2m,weather_code&timezone=auto`);
            const weatherDataResponse = await weatherResponse.json();
            
            displayWeatherData(name, admin1, country, weatherDataResponse);
        } catch (error) {
            console.error('Error fetching weather data:', error);
            displayError(error.message);
        }
    }
    
    // Display weather data
    function displayWeatherData(city, region, country, data) {
        loading.style.display = 'none';
        
        const current = data.current;
        const daily = data.daily;
        const hourly = data.hourly;
        
        // Current weather HTML
        const currentWeatherHTML = `
            <div class="main-content">
                <div class="current-weather">
                    <div class="location"><i class="fas fa-map-marker-alt"></i> ${city}, ${region || country}</div>
                    <div class="date">${formatDate(current.time)}</div>
                    
                    <div class="weather-main">
                        <div class="temperature">${Math.round(current.temperature_2m)}°C</div>
                        <div class="weather-icon">${getWeatherIcon(current.weather_code, current.is_day)}</div>
                    </div>
                    
                    <div class="description">${getWeatherDescription(current.weather_code)}</div>
                    
                    <div class="weather-details">
                        <div class="detail">
                            <i class="fas fa-wind"></i>
                            <div class="detail-info">
                                <div class="detail-value">${current.wind_speed_10m} km/h</div>
                                <div class="detail-label">Wind Speed</div>
                            </div>
                        </div>
                        <div class="detail">
                            <i class="fas fa-tint"></i>
                            <div class="detail-info">
                                <div class="detail-value">${current.relative_humidity_2m}%</div>
                                <div class="detail-label">Humidity</div>
                            </div>
                        </div>
                        <div class="detail">
                            <i class="fas fa-temperature-low"></i>
                            <div class="detail-info">
                                <div class="detail-value">${Math.round(current.apparent_temperature)}°C</div>
                                <div class="detail-label">Feels Like</div>
                            </div>
                        </div>
                        <div class="detail">
                            <i class="fas fa-compress-alt"></i>
                            <div class="detail-info">
                                <div class="detail-value">${current.pressure_msl} hPa</div>
                                <div class="detail-label">Pressure</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="forecast">
                    <div class="section-title"><i class="fas fa-calendar-alt"></i> 5-Day Forecast</div>
                    <div class="forecast-container">
                        ${generateForecastHTML(daily)}
                    </div>
                </div>
            </div>
        `;
        
        // Hourly forecast HTML
        const hourlyForecastHTML = `
            <div class="hourly-forecast">
                <div class="section-title"><i class="fas fa-clock"></i> 24-Hour Forecast</div>
                <div class="hourly-container">
                    ${generateHourlyHTML(hourly)}
                </div>
            </div>
        `;
        
        weatherData.innerHTML = currentWeatherHTML + hourlyForecastHTML;
    }
    
    // Generate forecast HTML
    function generateForecastHTML(daily) {
        let forecastHTML = '';
        
        for (let i = 0; i < 5; i++) {
            forecastHTML += `
                <div class="forecast-card">
                    <div class="forecast-date">${formatDate(daily.time[i], true)}</div>
                    <div class="forecast-icon">${getWeatherIcon(daily.weather_code[i], 1)}</div>
                    <div class="forecast-temp">
                        <span>${Math.round(daily.temperature_2m_max[i])}°</span> / 
                        <span>${Math.round(daily.temperature_2m_min[i])}°</span>
                    </div>
                    <div class="forecast-desc">${getWeatherDescription(daily.weather_code[i])}</div>
                </div>
            `;
        }
        
        return forecastHTML;
    }
    
    // Generate hourly forecast HTML
    function generateHourlyHTML(hourly) {
        let hourlyHTML = '';
        const now = new Date();
        
        for (let i = 0; i < 24; i += 2) {
            const time = new Date(hourly.time[i]);
            const timeString = formatTime(time);
            
            hourlyHTML += `
                <div class="hourly-card">
                    <div class="hourly-time">${timeString}</div>
                    <div class="hourly-icon">${getWeatherIcon(hourly.weather_code[i], time.getHours() > 6 && time.getHours() < 20)}</div>
                    <div class="hourly-temp">${Math.round(hourly.temperature_2m[i])}°</div>
                </div>
            `;
        }
        
        return hourlyHTML;
    }
    
    // Display error message
    function displayError(message) {
        loading.style.display = 'none';
        weatherData.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> Error: ${message}. Please try again.</div>`;
    }
    
    // Helper functions
    function formatDate(dateString, short = false) {
        const date = new Date(dateString);
        if (short) {
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    function formatTime(date) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    }
    
    function getWeatherIcon(weatherCode, isDay) {
        // Weather code mapping based on WMO codes
        const icons = {
            0: isDay ? 'fas fa-sun' : 'fas fa-moon',
            1: isDay ? 'fas fa-cloud-sun' : 'fas fa-cloud-moon',
            2: 'fas fa-cloud',
            3: 'fas fa-cloud',
            45: 'fas fa-smog',
            48: 'fas fa-smog',
            51: 'fas fa-cloud-rain',
            53: 'fas fa-cloud-rain',
            55: 'fas fa-cloud-rain',
            56: 'fas fa-cloud-rain',
            57: 'fas fa-cloud-rain',
            61: 'fas fa-cloud-rain',
            63: 'fas fa-cloud-rain',
            65: 'fas fa-cloud-showers-heavy',
            66: 'fas fa-cloud-rain',
            67: 'fas fa-cloud-showers-heavy',
            71: 'fas fa-snowflake',
            73: 'fas fa-snowflake',
            75: 'fas fa-snowflake',
            77: 'fas fa-snowflake',
            80: 'fas fa-cloud-showers-heavy',
            81: 'fas fa-cloud-showers-heavy',
            82: 'fas fa-cloud-showers-heavy',
            85: 'fas fa-snowflake',
            86: 'fas fa-snowflake',
            95: 'fas fa-bolt',
            96: 'fas fa-bolt',
            99: 'fas fa-bolt'
        };
        
        return `<i class="${icons[weatherCode] || 'fas fa-cloud'}"></i>`;
    }
    
    function getWeatherDescription(weatherCode) {
        const descriptions = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            66: 'Light freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow fall',
            73: 'Moderate snow fall',
            75: 'Heavy snow fall',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with hail',
            99: 'Thunderstorm with heavy hail'
        };
        
        return descriptions[weatherCode] || 'Unknown';
    }
});
