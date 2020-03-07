import * as messaging from "messaging";
import { preferences, units } from "user-settings";
import { geolocation } from "geolocation";
import asap from "fitbit-asap/companion"

console.log("Companion Started");

let lat = '1'
let lng = '1'


asap.onmessage = message => {
  console.log(message) // See you later, alligator.
}


// GEOLOCATION --------------------------------

function getGeo(){
    geolocation.getCurrentPosition(locationSuccess, locationError, {
        timeout: 60 * 1000
      });
}

function locationSuccess(position) {
  let lat = position.coords.latitude
  let lng = position.coords.longitude
  console.log(
    "Latitude: " + lat,
    "Longitude: " + lng
  );
  dailyWeather()
}

function locationError(){
  console.log('locationError')
}



// DAILY WEATHER ---------------------------------------------------------
function dailyWeather(){
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

        //if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        //    messaging.peerSocket.send(myData);
        //}
        asap.send(myData)
    })
    .catch(err => console.log('[FETCH]: ' + err));
}

