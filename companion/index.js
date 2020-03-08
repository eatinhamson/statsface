import * as messaging from "messaging";
import { preferences, units } from "user-settings";
import { geolocation } from "geolocation";
import asap from "fitbit-asap/companion"
import { settingsStorage } from "settings";

console.log("Companion Started");

var lat
var lng

asap.onmessage = message => {
  console.log(message) // See you later, alligator.
}


var myVar = setInterval(myTimer, 30000); //every 5 mins - 300000

function myTimer() {
    console.log("timer triggered")
    //getGeo()
    fetchSleepData() 
}

// GEOLOCATION --------------------------------

function getGeo(){
    geolocation.getCurrentPosition(locationSuccess, locationError, {
        timeout: 60 * 1000
      });
}

function locationSuccess(position) {
    lat = position.coords.latitude
    lng = position.coords.longitude
  console.log(
    "Latitude: " + lat,
    "Longitude: " + lng
  );
  dailyWeather(lat,lng)
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
        asap.send(myData)
    })
    .catch(err => console.log('[FETCH]: ' + err));
}


function fetchSleepData(accessToken)  {
    let date = new Date();
    let todayDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; //YYYY-MM-DD
  
    // Sleep API docs - https://dev.fitbit.com/reference/web-api/sleep/
    fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${todayDate}.json`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    })
    .then(function(res) {
      return res.json();
    })
    .then(function(data) {
      let myData = {
        totalMinutesAsleep: data.summary.totalMinutesAsleep
      }
      asap.send(myData)
      console.log(myData)
    })
    .catch(err => console.log('[FETCH]: ' + err));
  }
  
  // A user changes Settings
  settingsStorage.onchange = evt => {
    if (evt.key === "oauth") {
      // Settings page sent us an oAuth token
      let data = JSON.parse(evt.newValue);
      fetchSleepData(data.access_token) ;
    }
  };
  
  // Restore previously saved settings and send to the device
  function restoreSettings() {
    for (let index = 0; index < settingsStorage.length; index++) {
      let key = settingsStorage.key(index);
      if (key && key === "oauth") {
        // We already have an oauth token
        let data = JSON.parse(settingsStorage.getItem(key))
        fetchSleepData(data.access_token);
      }
    }
  }
  