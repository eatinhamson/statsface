import { geolocation } from "geolocation";
import asap from "fitbit-asap/companion"
import { settingsStorage } from "settings";
import calendars from "calendars";

/*
Only hit API if watch is conected to phone, this way i am not hitting API only to clear the data
get user settings, like units for temp
get geo location just when needed
time based triggers, like get sleep data at 8am, or get weather data on the 10s, or do some action each minute, and each hour

*/

console.log("Companion Started");

var toAppData = {};  // create a global object to which data is added then sent to app

var lat
var lng

asap.onmessage = message => {
  console.log(message) // See you later, alligator.
}
asap.send("ASAP - from companion to app")

var myVar = setInterval(sendToWatch, 30000); //every 5 mins - 300000, 3 mins 180000
function sendToWatch() {
    console.log("Timer Triggered")

    getGeo()
    fetchDailyWeather(lat,lng)
    fetchTodaysSleepData() 

    asap.cancel() // clear queue of all existing items, this way only the most recent data is delivered to watch
    asap.send(toAppData) // send all collected info frpm phone to watch in one batch
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
}

function locationError(){
  console.log('getGeo - failed. Trying again.')
  getGeo()
}

// DAILY WEATHER ---------------------------------------------------------
function fetchDailyWeather(lat,lng){
    console.log('fetchDailyWeather - started')

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
        toAppData.currentTemp= j.currently.temperature
        toAppData.currentSummary= j.currently.summary
    })
    .catch(err => console.log('[FETCH]: ' + err));
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
  