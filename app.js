window.addEventListener('load', ()=>{
    let warnMessage = document.getElementById("warning-message");
    let weatherSummary = document.querySelector('.weather-summary');
    let feelsLikeTemperatureDegree = document.querySelector('.feels-like-degree');
    let feelsLikeTemperatureUnit = document.querySelector('.feels-like-degree-section span');
    let temperatureDegree = document.querySelector('.temperature-degree');
    let temperatureSection = document.querySelector('.temperature-section');
    let temperatureUnit = document.querySelector('.temperature-section span');
    let currentDateAndTime = document.querySelector('.date-and-time');
    let iconID = document.querySelector('.icon');
    let humidity = document.querySelector('.humidity');
    let pressure = document.querySelector('.pressure');
    let windDirection = document.querySelector('.wind-direction');
    let windSpeed = document.querySelector('.wind-speed');
    let windGustSpeed = document.querySelector('.wind-gust-speed');
    let sunriseTime = document.querySelector('.sunrise');
    let sunsetTime = document.querySelector('.sunset');
    let location = document.querySelector('.location-section .location');

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const long = position.coords.longitude;
            const lat = position.coords.latitude;
            // Get the user's weather using the OpenWeather API
            setWeather(lat, long);

        });

    }

    const myAPIKey = "52c5ddc336f14e3299d13034232603";
    const header = new Headers();
    header.append("key", myAPIKey);
    function setWeather(lat, long) {
        const weatherAPIURL = `https://api.weatherapi.com/v1/forecast.json?q=${lat},${long}&days=5&aqi=no&alerts=yes`;
        // fetch data from API
        fetch(weatherAPIURL, {
            method : "GET",
            headers : header
        })
            .then (response =>{
                return response.json();
            })
            .then(geolocationData => {
                console.log(geolocationData);

                const feelsLikeTemperatureData = geolocationData.current.feelslike_c;
                const temperatureData = geolocationData.current.temp_c;
                //console.log("temperature: " + temperatureData);
                const iconDescData = geolocationData.current.condition.text;
                //console.log("icon: " + iconDescData);
                const weatherSummaryData = geolocationData.current.condition.text;
                //console.log("summary: " + weatherSummaryData);
                const humidityData = geolocationData.current.humidity;
                const pressureData = geolocationData.current.pressure_mb;
                //console.log("pressure: " + pressure);
                const windDirectionData = geolocationData.current.wind_degree;
                //console.log("wind direction (degree): " + windDirectionData);
                const windSpeedData = geolocationData.current.wind_kph;
                const windGustSpeedData = geolocationData.current.gust_kph;
                const sunriseTimeData = geolocationData.forecast.forecastday[0].astro.sunrise;
                const sunsetTimeData = geolocationData.forecast.forecastday[0].astro.sunset;

                const alertsData = geolocationData.alerts;
                const currentTimeData = geolocationData.current.last_updated_epoch;

                // Set Alert
                setHazardWarning(alertsData,currentTimeData);

                // Get the user's location using the Geolocation API
                setLocation(lat, long, location, sunriseTimeData, sunsetTimeData);

                //Set DOM Elements from the API
                setWeatherIcon(iconDescData, sunriseTimeData, sunsetTimeData);
                //Set temperature info
                feelsLikeTemperatureDegree.textContent = roundingTo1DP(feelsLikeTemperatureData);
                temperatureDegree.textContent = roundingTo1DP(temperatureData);
                temperatureUnit.textContent = "°C";
                feelsLikeTemperatureUnit.textContent = "°C";
                weatherSummary.textContent = weatherSummaryData;

                // set humidity and pressure
                humidity.textContent = humidityData;
                pressure.textContent = pressureData + getPressureDesc(pressureData, temperatureData);
                // set Wind
                windDirection.textContent = getWindDirectionByDegree(getClosestWindDirDegree(windDirectionData));
                windSpeed.textContent = windSpeedData;
                windGustSpeed.textContent = windGustSpeedData;

                // set sunrise time and sunset time
                sunriseTime.textContent = sunriseTimeData;
                sunsetTime.textContent = sunsetTimeData;

                setTemperatureMouseEventListener(temperatureData, feelsLikeTemperatureData);

                currentDateAndTime.textContent = getCurrentDate().toString();
            });
    }

    function setWeatherIcon(iconDescData, sunriseDataTime, sunsetDataTime){
        const skycons = new Skycons({"color": "white"});
        const iconMapDay = {
            'Sunny': Skycons.CLEAR_DAY,
            'Partly cloudy': Skycons.PARTLY_CLOUDY_DAY,
            'Cloudy': Skycons.CLOUDY,
            'Overcast': Skycons.CLOUDY,
            'Patchy rain possible': Skycons.SHOWERS_DAY,
            'Patchy snow possible': Skycons.SNOW_SHOWERS_DAY,
            'Sleet': Skycons.SLEET,
            'Patchy freezing drizzle possible': Skycons.SHOWERS_DAY,
            'Thundery outbreaks possible': Skycons.THUNDER_SHOWERS_DAY,
            'Blowing snow': Skycons.SNOW,
            'Blizzard': Skycons.SNOW,
            'Fog': Skycons.FOG,
            'Freezing fog': Skycons.FOG,
            'Mist': Skycons.FOG,
            'Patchy light drizzle': Skycons.SHOWERS_DAY,
            'Light drizzle': Skycons.SHOWERS_DAY,
            'Freezing drizzle': Skycons.SHOWERS_DAY,
            'Heavy freezing drizzle': Skycons.SHOWERS_DAY,
            'Patchy light rain': Skycons.SHOWERS_DAY,
            'Light rain': Skycons.SHOWERS_DAY,
            'Moderate rain at times': Skycons.SHOWERS_DAY,
            'Moderate rain': Skycons.RAIN,
            'Heavy rain at times': Skycons.RAIN,
            'Heavy rain': Skycons.RAIN,
            'Light freezing rain': Skycons.SHOWERS_DAY,
            'Moderate or heavy freezing rain': Skycons.RAIN,
            'Light sleet': Skycons.SLEET,
            'Moderate or heavy sleet': Skycons.SLEET,
            'Patchy light snow': Skycons.SNOW_SHOWERS_DAY,
            'Light snow': Skycons.SNOW_SHOWERS_DAY,
            'Patchy moderate snow': Skycons.SNOW,
            'Moderate snow': Skycons.SNOW,
            'Patchy heavy snow': Skycons.SNOW,
            'Heavy snow': Skycons.SNOW,
            'Ice pellets': Skycons.SNOW,
            'Light rain shower': Skycons.SHOWERS_DAY,
            'Moderate or heavy rain shower': Skycons.RAIN,
            'Torrential rain shower': Skycons.RAIN,
            'Light sleet showers': Skycons.RAIN_SNOW_SHOWERS_DAY,
            'Moderate or heavy sleet showers': Skycons.SNOW_SHOWERS_DAY,
            'Light snow showers': Skycons.SNOW_SHOWERS_DAY,
            'Light showers of ice pellets': Skycons.RAIN_SNOW,
            'Moderate or heavy showers of ice pellets': Skycons.RAIN_SNOW,
            'Patchy light rain with thunder': Skycons.THUNDER_SHOWERS_DAY,
            'Moderate or heavy rain with thunder': Skycons.THUNDER_RAIN,
            'Patchy light snow with thunder': Skycons.THUNDER_SHOWERS_DAY,
            'Moderate or heavy snow with thunder': Skycons.THUNDER_SHOWERS_DAY,
            'default': Skycons.CLEAR_DAY
        };
        const iconMapNight = {
            'Clear': Skycons.CLEAR_NIGHT,
            'Partly cloudy': Skycons.PARTLY_CLOUDY_NIGHT,
            'Cloudy': Skycons.CLOUDY,
            'Overcast': Skycons.CLOUDY,
            'Patchy rain possible': Skycons.SHOWERS_NIGHT,
            'Patchy snow possible': Skycons.SNOW_SHOWERS_NIGHT,
            'Sleet': Skycons.SLEET,
            'Patchy freezing drizzle possible': Skycons.SHOWERS_NIGHT,
            'Thundery outbreaks possible': Skycons.THUNDER_SHOWERS_NIGHT,
            'Blowing snow': Skycons.SNOW,
            'Blizzard': Skycons.SNOW,
            'Fog': Skycons.FOG,
            'Freezing fog': Skycons.FOG,
            'Mist': Skycons.FOG,
            'Patchy light drizzle': Skycons.SHOWERS_NIGHT,
            'Light drizzle': Skycons.SHOWERS_NIGHT,
            'Freezing drizzle': Skycons.SHOWERS_NIGHT,
            'Heavy freezing drizzle': Skycons.SHOWERS_NIGHT,
            'Patchy light rain': Skycons.SHOWERS_NIGHT,
            'Light rain': Skycons.SHOWERS_NIGHT,
            'Moderate rain at times': Skycons.SHOWERS_NIGHT,
            'Moderate rain': Skycons.RAIN,
            'Heavy rain at times': Skycons.RAIN,
            'Heavy rain': Skycons.RAIN,
            'Light freezing rain': Skycons.SHOWERS_NIGHT,
            'Moderate or heavy freezing rain': Skycons.RAIN,
            'Light sleet': Skycons.SLEET,
            'Moderate or heavy sleet': Skycons.SLEET,
            'Patchy light snow': Skycons.SNOW_SHOWERS_NIGHT,
            'Light snow': Skycons.SNOW_SHOWERS_NIGHT,
            'Patchy moderate snow': Skycons.SNOW,
            'Moderate snow': Skycons.SNOW,
            'Patchy heavy snow': Skycons.SNOW,
            'Heavy snow': Skycons.SNOW,
            'Ice pellets': Skycons.SNOW,
            'Light rain shower': Skycons.SHOWERS_NIGHT,
            'Moderate or heavy rain shower': Skycons.RAIN,
            'Torrential rain shower': Skycons.RAIN,
            'Light sleet showers': Skycons.RAIN_SNOW_SHOWERS_NIGHT,
            'Moderate or heavy sleet showers': Skycons.SNOW_SHOWERS_NIGHT,
            'Light snow showers': Skycons.SNOW_SHOWERS_NIGHT,
            'Moderate or heavy snow showers': Skycons.SNOW_SHOWERS_NIGHT,
            'Light showers of ice pellets': Skycons.RAIN_SNOW,
            'Moderate or heavy showers of ice pellets': Skycons.RAIN_SNOW,
            'Patchy light rain with thunder': Skycons.THUNDER_SHOWERS_NIGHT,
            'Moderate or heavy rain with thunder': Skycons.THUNDER_RAIN,
            'Patchy light snow with thunder': Skycons.THUNDER_SHOWERS_NIGHT,
            'Moderate or heavy snow with thunder': Skycons.THUNDER_SHOWERS_NIGHT,
            'default': Skycons.CLEAR_NIGHT
        };

        let currentIcon;
        if(isDayTime(sunriseDataTime, sunsetDataTime) ) {
            currentIcon = iconMapDay[iconDescData];
            //console.log("Set Day icon")
        } else {
            currentIcon = iconMapNight[iconDescData];
            //console.log("Set Night icon")
        }
        skycons.play();
        return skycons.set(iconID, currentIcon);
    }

    /***
     * Barometric pressure
     *
     * Pressure Range (hPa)           |  Weather Condition
     * -----------------------------------------------------------------
     * Above 1022.689                 | Dry, cool, and pleasant weather
     * Between 1009.144 and 1022.689  | Steady weather
     * Below 1009.144                 | Warm air and rainstorms / snowstorms
     */
    function getPressureDesc(pressure, temperature) {
        if (typeof pressure !== 'number') {
            return 'Invalid input: pressure must be a number';
        }
        if(pressure > 1022.689) {
            return " [Dry, cool, and pleasant weather]";
        } else if (pressure >= 1009.144) {
            return " [Steady weather]";
        } else if (pressure < 1009.144 && temperature > 0) {
            return " [Unstable and and potentially rainstorms]";
        }  else if (pressure < 1009.144 && temperature <= 0) {
            return " [Unstable and and potentially snowstorms]";
        }
    }

    function setTemperatureMouseEventListener(temperatureData, feelsLikeTempData) {
        const currTempInCelsiusData = temperatureData;
        const feelsLikeTempInCelsiusData = feelsLikeTempData;

        // formula for fahrenheit
        const currTempInFahrenheitData = (currTempInCelsiusData * 9 / 5 ) + 32;
        const feelsLikeTempInFahrenheitData = (feelsLikeTempInCelsiusData * 9 / 5) + 32;

        // Change from F to C or vice versa based on mouseClick
        temperatureSection.addEventListener("click", () => {
            if(temperatureUnit.textContent === "°F") {
                temperatureUnit.textContent = "°C";
                feelsLikeTemperatureUnit.textContent = temperatureUnit.textContent;
                temperatureDegree.textContent = roundingTo1DP(currTempInCelsiusData);
                feelsLikeTemperatureDegree.textContent = roundingTo1DP(feelsLikeTempInCelsiusData);
            } else {
                temperatureUnit.textContent = "°F";
                feelsLikeTemperatureUnit.textContent = temperatureUnit.textContent;
                temperatureDegree.textContent = roundingTo1DP(currTempInFahrenheitData);
                feelsLikeTemperatureDegree.textContent = roundingTo1DP(feelsLikeTempInFahrenheitData);
            }
        });
    }

    function setHazardWarning(alerts, currentTime) {
        const warningToggleON = true;
        const listOfWarnings = alerts.alert;
        console.log("warnings",listOfWarnings);

        let showWarning = false;
        let resultMsg = "";
        const endOfLine = "\n";

        for(let i = 0; i < listOfWarnings.length; i++) {
            const warning = listOfWarnings[i];
            const source = warning.headline;
            const category = warning.category;
            const expire = warning.expires;
            const originalMessage = warning.desc;

            // Convert GMT time to Date object
            const expireDateGMT = Date.parse(expire)/1000;

            if (source.toLowerCase() === "environment canada") {
                const hazardsRegex = /Hazards:[\s\S]*?(?=\n\nTiming:)/;
                const hazardRegex = /Hazard:[\s\S]*?(?=\n\nTiming:)/;
                const TimingRegex = /Timing:[\s\S]*?(?=\n\nDiscussion:)/;
                let hazardMsg = "";
                // only Hazard warning will be displayed
                if(originalMessage.match(hazardsRegex) !== null) {
                    //console.log("expireDateGMT", expireDateGMT);
                    //console.log("currentTime", currentTime);
                    //console.log("original warning:",originalMessage);
                    hazardMsg = originalMessage.match(hazardsRegex)[0];
                    //console.log("hazardMsg",hazardMsg);

                } else if (originalMessage.match(hazardRegex) !== null) {
                    hazardMsg = originalMessage.match(hazardRegex)[0];
                } else {
                        // skip the message if there is no Hazard keyword
                        console.log("skip:", originalMessage);
                        continue;
                }

                let timingMsg = "";
                if(originalMessage.match(TimingRegex) !== null) {
                    timingMsg = originalMessage.match(TimingRegex)[0];
                }

                if(expireDateGMT < currentTime) {
                    console.log("This warning is expired:", hazardMsg);
                    continue;
                }
                const extractedMessage = hazardMsg + "\n" + timingMsg;
                resultMsg += category + " " + extractedMessage + endOfLine + endOfLine;
                console.log("resultMsg",resultMsg)
                showWarning = true;
            }
        }
        // Remove the last 2 endOfLine characters
        resultMsg = resultMsg.slice(0,-2);
        if(showWarning && warningToggleON) {
            warnMessage.innerHTML = resultMsg;
            warnMessage.style.display = 'block';
        }
    }

    function setLocation(lat, long, location, sunriseDataTime, sunseDataTime) {
        //console.log("long: ", long);
        //console.log("lat: ", lat);
        // Get the user's location using the Geolocation API
        const locationAPIUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}&localityLanguage=en`;
        fetch(locationAPIUrl)
            .then(response => {
                return response.json();
            })
            .then(weatherData => {
                //console.log(weatherData);
                //const locationName = `${weatherData.city}, ${weatherData.principalSubdivision}, ${weatherData.countryName}`;
                //console.log("locationName: ", locationName);
                const dayOrNight = isDayTime(sunriseDataTime, sunseDataTime) ? " (Day)" : " (Night)";
                if(weatherData.principalSubdivision.length === 0) {
                    location.textContent = weatherData.city + ", " + weatherData.countryName + dayOrNight;
                } else {
                    location.textContent = weatherData.city + ", " + weatherData.principalSubdivision + dayOrNight;
                }
                //location.textContent = weatherData.city + ", " + weatherData.principalSubdivision;
            });
    }

    function getClosestWindDirDegree(degree) {
        const degreeList = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5, 360],
            goal = degree;
        return degreeList.reduce(function(prev, curr) {
            return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
        });
    }

    /**
     * 0° — north wind (N)
     * 22.5° — north-northeast wind (NNE)
     * 45° — northeast wind (NE)
     * 67.5° — east-northeast wind (ENE)
     * 90°— east wind (E)
     * 112.5° — east-southeast wind (ESE)
     * 135° — southeast wind (SE)
     * 157.5° — south-southeast wind (SSE)
     * 180° — south wind (S)
     * 202.5° — south-southwest wind (SSW)
     * 225° — southwest wind (SW)
     * 247.5° — west-southwest wind (WSW)
     * 270° — west wind (W)
     * 292.5° — west-northwest wind (WNW)
     * 315° — northwest wind (NW)
     * 337.5° — north-northwest wind (NNW)
     * 360° — north wind (N)
     */
    function getWindDirectionByDegree(degree) {
        const windDirectionMap = {
            '0': "North",

            '22.5': "NNEast",
            '45': "NorthEast",
            '67.5': "ENEast",
            '90': "East",

            '112.5': "ESEast",
            '135': "SouthEast",
            '157.5': "SEEast",
            '180': "South",

            '202.5': "SSWest",
            '225': "SouthWest",
            '247.5': "WSWest",
            '270': "West",

            '292.5': "WNWest",
            '315': "NorthWest",
            '337.5': "NNWest",
            '360': "North",
            'default': "Unknown"
        };
        return windDirectionMap[degree];
    }

    function getCurrentDate() {
        return new Date();
    }
    function isDayTime(sunriseDataTime, sunsetDataTime) {
        const sunriseTime = parseTimeFromHHMMAMPMFormat(sunriseDataTime);
        //console.log("sunrise hour:", sunriseTime.hour);
        //console.log("sunrise minute:", sunriseTime.minute);

        const sunsetTime = parseTimeFromHHMMAMPMFormat(sunsetDataTime);
        //console.log("sunset hour:", sunsetTime.hour);
        //console.log("sunset minute:", sunsetTime.minute);

        if(isBetween(sunsetTime,sunriseTime,)) {
            //console.log("It is night time:");
            return false;
        } else {
            //console.log("It is day time:");
            return true;
        }
    }

    function isBetween(startTime, endTime) {
        const currentHour = getCurrentDate().getHours();
        const currentMinute = getCurrentDate().getMinutes();
        //console.log("currentHour:", currentHour);
        //console.log("currentMinute:", currentMinute);
        if (currentHour > startTime.hour || currentHour < endTime.hour) {
            //console.log("It is between1");
            return true;
        } else if (currentHour === startTime.hour && currentMinute >= startTime.minute) {
            //console.log("It is between2");
            return true;
        } else if (currentHour === endTime.hour && currentMinute < endTime.minute) {
            //console.log("It is between3");
            return true
        } else {
            //console.log("It is NOT between");
            return false;
        }
    }

    function parseTimeFromHHMMAMPMFormat(timeString) {
        const [time, indicator] = timeString.split(" ");
        const [hour12, minute] = time.split(":");

        let hour = parseInt(hour12);
        if (indicator === "PM" && hour !== 12) {
            hour += 12;
        } else if (indicator === "AM" && hour === 12) {
            hour = 0;
        }
        //const formattedTime = `${hour.toString()}:${minute}`;
        //console.log(formattedTime);
        //const d = new Date();
        return {hour, minute};
    }

    function roundingTo1DP(value) {
        return (Math.round(value*10)/10).toString()
    }
});
