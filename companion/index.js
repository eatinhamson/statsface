import { geolocation } from "geolocation";
import asap from "fitbit-asap/companion"
import { settingsStorage } from "settings";
import calendars from "calendars";
import * as messaging from "messaging";
import { localStorage } from "local-storage";
import clock from "clock";


/*


localStorage.setItem("myKey", "myValue");
console.log(localStorage.getItem("myKey"));
localStorage.clear()

Syntax
setInterval(function, milliseconds, param1, param2, ...)

Parameter Values

function 	Required. The function that will be executed
milliseconds 	Required. The intervals (in milliseconds) on how often to execute the code. If the value is less than 10, the value 10 is used
param1, param2, ... 	Optional. Additional parameters to pass to the function (Not supported in IE9 and earlier)

*/

asap.cancel()

var oneMin = 60000
var fiveMins = 300000
var fifteenMins = 900000

setInterval(getGeo, fiveMins)

setInterval(fetchDailyWeather, fifteenMins)
setInterval(fetchTodaysSleepData, fifteenMins)

asap.onmessage = message => {

  console.log('From App to Comp: ' + message);

  if (message == 'weather'){ // if weather is requested
    if (!localStorage.getItem("currentTemp")){ //check to see if ther is saved weather data
      fetchDailyWeather() // if not, get it
    }else{ 
      sendWeather()
    }
  }

  if (message == 'sleep'){ // if toal slept mins is reported
    if (!localStorage.getItem("totalMinutesAsleep")){ //check to see if there is sleep data
      fetchTodaysSleepData() //if not get it
    }else{
      sendSleep()
    }
  }

  if (message == 'agenda') {
    getCalendarEvents()
  }

  if (message == 'clearLocalStorage'){
    localStorage.clear()
  }
}


// GEOLOCATION --------------------------------
function getGeo(){
  geolocation.getCurrentPosition(locationSuccess, locationError, {timeout: 60 * 1000});
}

function locationSuccess(position) {
  localStorage.setItem("Latitude", position.coords.latitude);
  localStorage.setItem("Longitude", position.coords.longitude);
 
  if (!localStorage.getItem("currentTemp")){ //if there weather data
    fetchDailyWeather()
  }
}

function locationError(error) {
  console.log("Error: " + error.code, "Message: " + error.message);
}



// DAILY WEATHER ---------------------------------------------------------
function fetchDailyWeather(){

    if (!localStorage.getItem("Latitude")){ //check to see if there is saved location data
      getGeo() //if not, get it
    }else{

      var Latitude = (localStorage.getItem("Latitude"));
      var Longitude = (localStorage.getItem("Longitude"));
  
      var darksky = 'https://api.darksky.net/forecast/';
      var key = 'e09fb7a5c4859b3cdd54879e1b49b3c2';
      var uri = darksky + key + '/' + Latitude +','+ Longitude;
      uri = uri.concat('?units=us&');
  
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
      
        localStorage.setItem("currentTemp", j.currently.temperature);
        localStorage.setItem("currentSummary", j.currently.summary);
        localStorage.setItem("temperatureHigh", j.daily.data[1].temperatureHigh);
        localStorage.setItem("temperatureHighTime", j.daily.data[1].temperatureHighTime);
        localStorage.setItem("temperatureLow", j.daily.data[1].temperatureLow);
        localStorage.setItem("sunriseTime", j.daily.data[1].sunriseTime);
        localStorage.setItem("sunsetTime", j.daily.data[1].sunsetTime);
  
        sendWeather()
      })
      .catch(err => console.log('[FETCH]: ' + err));
    }

}

function sendWeather() {
  
  var weatherData = {}; // create weather object\\ 
  
  var date = new Date();
  var secsSinceMidnight = (date -new Date().setHours(0,0,0,0)) / 1000;
  weatherData.timeStamp = secsSinceMidnight

  weatherData.currentTemp= (localStorage.getItem("currentTemp"));  // assign saved weather values
  weatherData.currentSummary= (localStorage.getItem("currentSummary"));
  weatherData.temperatureHigh= (localStorage.getItem("temperatureHigh"));
  weatherData.temperatureHighTime= (localStorage.getItem("temperatureLow"));
  weatherData.temperatureLow= (localStorage.getItem("temperatureLow"));
  weatherData.sunriseTime= (localStorage.getItem("sunriseTime"));
  weatherData.sunsetTime= (localStorage.getItem("sunsetTime"));

  console.log("sending weatherData")
  asap.send(weatherData,1000) // send back

}




function fetchTodaysSleepData() {

  console.log("fetchTodaysSleepData")

    var accessToken = localStorage.getItem("accessToken");

    var date = new Date();
    var todayDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; //YYYY-MM-DD
  
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

      localStorage.setItem("totalMinutesAsleep", j.summary.totalMinutesAsleep);
      localStorage.setItem("totalSleepRecords", j.summary.totalSleepRecords);

      var i;
      for (i = 0; i < j.summary.totalSleepRecords ; i++) {
        if (j.sleep[i]){
            localStorage.setItem("deepMins", j.sleep[i].levels.summary.deep.minutes);
            localStorage.setItem("lightMins", j.sleep[i].levels.summary.light.minutes);
            localStorage.setItem("remMins", j.sleep[i].levels.summary.rem.minutes);
            localStorage.setItem("wakeMins", j.sleep[i].levels.summary.wake.minutes);
        }
      } 
      sendSleep()
    })
    .catch(err => console.log('[FETCH]: - ' + err));
}

function sendSleep() {
  var sleepData = {};  //create sleepData object

  var date = new Date();
  var secsSinceMidnight = (date -new Date().setHours(0,0,0,0)) / 1000;
  sleepData.timeStamp = secsSinceMidnight

  sleepData.totalMinutesAsleep = (localStorage.getItem("totalMinutesAsleep"));
  sleepData.deepMins = localStorage.getItem("deepMins");
  sleepData.lightMins = localStorage.getItem("lightMins");
  sleepData.remMins = localStorage.getItem("remMins");
  sleepData.wakeMins = localStorage.getItem("wakeMins");

  console.log("sending sleepData")
  asap.send(sleepData,1000)

}

// refresh oauth token

function fetchRefreshToken(){

  console.log("fetchRefreshToken")

  var refreshToken = localStorage.getItem("refreshToken");

  fetch(`https://api.fitbit.com/oauth2/token/grant_type=refresh_token&refresh_token=${refreshToken}`, {
    method: "POST",
    headers: {
      "Authorization": `Basic MjJCRzdKOmExZmRiMTQ4ZDJkYzc5MWQ4MTU5YjIwMDViNDg5OWI5`
    }
  })
  .then((response)=>{
      if(response.ok){
          return response.json();
      }else{
          throw new Error('fetchRefreshToken failed - Bad HTTP!')
      }
  })
  .then((j) =>{
  
      localStorage.setItem("accessToken", j.access_token);
      localStorage.setItem("refreshToken", j.refresh_token);

      console.log(j.access_token + " : " + j.refresh_token)

  })
  .catch(err => console.log('[FETCH]: ' + err));
}





  // A user changes Settings
  settingsStorage.onchange = evt => {
    if (evt.key === "oauth") {
      // Settings page sent us an oAuth token
      var data = JSON.parse(evt.newValue);

      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("refreshToken", data.refresh_token);

      fetchTodaysSleepData()
    }
  };
  
  // Restore previously saved settings and send to the device
  function restoreSettings() {
    for (var index = 0; index < settingsStorage.length; index++) {
      var key = settingsStorage.key(index);
      if (key && key === "oauth") {
        // We already have an oauth token
        var data = JSON.parse(settingsStorage.getItem(key))

        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("refreshToken", data.refresh_token);
        
        fetchTodaysSleepData()
      }
    }
  }
  

//Get calendar events
function getCalendarEvents () {
  var start = new Date()
  start.setHours(0, 0, 0, 0)
  var end = new Date()
  end.setHours(23, 59, 59, 999)
  
  var eventsQuery = { startDate: start, endDate: end }
  
  calendars.searchEvents(eventsQuery).then(function() {
     todayEvents.forEach(event => {
       console.log(event.title)
      })
  });
}
