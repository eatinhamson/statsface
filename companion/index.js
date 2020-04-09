import { geolocation } from "geolocation";
import asap from "fitbit-asap/companion"
import { settingsStorage } from "settings";
import calendars from "calendars";
import * as messaging from "messaging";

/*
Only hit API if watch is conected to phone, this way i am not hitting API only to clear the data
get user settings, like units for temp
get geo location just when needed
time based triggers, like get sleep data at 8am, or get weather data on the 10s, or do some action each minute, and each hour
*/

/*
check if watch is conencted to phone
    send message form companion to app
    send message form app to companion
     if fails, wait 10 sec and try again
     count 10 secs to 
if it is, update data

*/


var weatherArray = []; // create global weather object


asap.onmessage = message => {

  console.log('From App to Comp: ' + message);

  if (message == 'weather'){ // if weather is requested
    getGeo()
  }

  if (message == 'sleepData'){ // if toal slept mins is reported

  }
}


// GEOLOCATION --------------------------------
function getGeo(){
    console.log('getGeo - started')
    geolocation.getCurrentPosition(locationSuccess, locationError, {
        timeout: 60 * 1000
      });
}

function locationSuccess(position) {
    lat = position.coords.latitude
    lng = position.coords.longitude
    fetchDailyWeather(lat,lng)
}

function locationError(){
  console.log('getGeo - failed. Trying again.')
}

// DAILY WEATHER ---------------------------------------------------------
function fetchDailyWeather(lat,lng){

    let darksky = 'https://api.darksky.net/forecast/';
    let key = 'e09fb7a5c4859b3cdd54879e1b49b3c2';
    let uri = darksky + key + '/' + lat +','+ lng;
    uri = uri.concat('?units=us&exclude=minutely,hourly');

    // units - ca, si, us, uk
    // exclude - minutely,hourly,daily,currently

    fetch(uri)
    .then((response)=>{
        if(response.ok){
            return response.json();
        }else{
            throw new Error('fetchDailyWeather failed - Bad HTTP!')
        }
    })
    .then((j) =>{
      weatherArray.currentTemp= j.currently.temperature
      weatherArray.currentSummary= j.currently.summary
      asap.send(weatherArray)
    })
    .catch(err => console.log('[FETCH]: ' + err));
}







function fetchTodaysSleepData(accessToken)  {
    console.log('fetchDailyWeather - started')
    let date = new Date();
    let todayDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; //YYYY-MM-DD
  
    // Sleep API docs - https://dev.fitbit.com/reference/web-api/sleep/
    fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${todayDate}.json`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    })
    .then((response)=>{
        if(response.ok){
            return response.json();
        }else{
            throw new Error('fetchTodaysSleepData failed - Bad HTTP!')
        }
    })
    .then((j) =>{
        toAppData.totalMinutesAsleep= j.summary.totalMinutesAsleep
    })
    .catch(err => console.log('[FETCH]: - ' + err));
}

  // A user changes Settings
  settingsStorage.onchange = evt => {
    if (evt.key === "oauth") {
      // Settings page sent us an oAuth token
      let data = JSON.parse(evt.newValue);
      fetchTodaysSleepData(data.access_token) ;
    }
  };
  
  // Restore previously saved settings and send to the device
  function restoreSettings() {
    for (let index = 0; index < settingsStorage.length; index++) {
      let key = settingsStorage.key(index);
      if (key && key === "oauth") {
        // We already have an oauth token
        let data = JSON.parse(settingsStorage.getItem(key))
        fetchTodaysSleepData(data.access_token);
      }
    }
  }
  
//Get calendar events
let start = new Date()
start.setHours(0, 0, 0, 0)
let end = new Date()
end.setHours(23, 59, 59, 999)

let eventsQuery = { startDate: start, endDate: end }

calendars.searchEvents(eventsQuery).then(function() {
   todayEvents.forEach(event => {
     console.log(event.title)
    })
});