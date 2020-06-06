window.addEventListener('load', ()=>{
    let long;
    let lat;
    let temperatureDescription = document.querySelector('.temperature-description');
    let temperatureDegree = document.querySelector('.temperature-degree');
    let locationTimezone = document.querySelector('.location-timezone');
    let temperatureSection = document.querySelector('.temperature-section');
    let temperatureSpan = document.querySelector('.temperature-section span');
    let uvindexFigure = document.querySelector('.uv-index');
    let visibilityFigure = document.querySelector('.visibility');
    let humidityFigure = document.querySelector('.humidity');
    //let currentTimeFigure = document.querySelector('.dateAndTime');
    
    //https://api.darksky.net/forecast/fd9d9c6418c23d94745b836767721ad1/37.8267,-122.4233
    // https://cors-anywhere.herokuapp.com/https://en.wikipedia.org/wiki/
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            long = position.coords.longitude;
            lat = position.coords.latitude;

            const proxy = `https://cors-anywhere.herokuapp.com/`;
            const api= `https://api.darksky.net/forecast/fd9d9c6418c23d94745b836767721ad1/${lat},${long}`;
            console.log(api);
            const url = proxy+api;
            fetch(url)
            .then (response =>{
                return response.json();
            })
            .then(data => {
                console.log(data);
                const {temperature, summary, icon, uvIndex, visibility, humidity, time} = data.currently;
                //Set DOM Elements from the API
                temperatureDegree.textContent = temperature;
                temperatureDescription.textContent = summary;
                locationTimezone.textContent = data.timezone.replace(/America/g,"Canada");
                temperatureSpan.textContent = "F";
                uvindexFigure.textContent = uvIndex;
                visibilityFigure.textContent = visibility;

                // let newDate = new Date();
                // let currentDate = newDate.toString();
                // console.log({currentDate});
                // currentTimeFigure.textContext = currentDate;

                let humdityInPercent = humidity * 100;
                humidityFigure.textContent = humdityInPercent + "%";
                
                // forumla for C
                let celsius = (temperature - 32 ) * 5 / 9 ;
                
                // setIcon
                setIcon(icon, document.querySelector('.icon'));

                // Change from F to C
                temperatureSection.addEventListener("click", () => {
                    if(temperatureSpan.textContent === "F") {
                        temperatureSpan.textContent = "C"; 
                        temperatureDegree.textContent = Math.floor(celsius);
                    } else {
                        temperatureSpan.textContent = "F";
                        temperatureDegree.textContent = temperature;
                    }
                });
            })
        });

    }

    
    function setIcon(icon, iconID){
        const skycons = new Skycons({"color": "white"});
        const currentIcon = icon.replace(/-/g,"_").toUpperCase();
        skycons.play();
        return skycons.set(iconID, Skycons[currentIcon]);
    }
});
