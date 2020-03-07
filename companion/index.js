import * as messaging from "messaging";
import { preferences, units } from "user-settings";
import { geolocation } from "geolocation";

console.log("Companion Started");





// GEOLOCATION --------------------------------

 geolocation.getCurrentPosition(locationSuccess, locationError, {
  timeout: 60 * 1000
});

function locationSuccess(position) {
  let latitude = position.coords.latitude
  let longitude = position.coords.longitude
  console.log(
    "Latitude: " + lat,
    "Longitude: " + lng
  );
  dailyWeather(latitude,longitude)
}

function locationError(){
  console.log('locationError')
}






// DAILY WEATHER ---------------------------------------------------------
function dailyWeather(lat,lng){
  let darksky = 'https://api.darksky.net/forecast/';
  let key = 'e09fb7a5c4859b3cdd54879e1b49b3c2';
  let uri = darksky + key + '/' + lat +','+ lng;
  console.log(uri);
  uri = uri.concat('?units=us&exclude=minutely,hourly');
  // units - ca, si, us, uk
  // exclude - minutely,hourly,daily,currently

  fetch(uri)
    .then((response)=>{
        if(response.ok){
            return response.json();
        }else{
            throw new Error('Bad HTTP!')
        }
    })
    .then((j) =>{
        console.log(
            j.currently.temperature, 
            j.currently.summary
            );

        let myData = {
            currentTemp: j.currently.temperature,
            currentSummary: j.currently.summary
        }

        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            messaging.peerSocket.send(myData);
        }
    })
    .catch(err => console.log('[FETCH]: ' + err));
}

