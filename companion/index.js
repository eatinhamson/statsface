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


Syntax
setInterval(function, milliseconds, param1, param2, ...)

Parameter Values

function 	Required. The function that will be executed
milliseconds 	Required. The intervals (in milliseconds) on how often to execute the code. If the value is less than 10, the value 10 is used
param1, param2, ... 	Optional. Additional parameters to pass to the function (Not supported in IE9 and earlier)

*/

asap.cancel() // Cancels all queued messages. Call this function on startup to limit messages to a single session.

restoreSettings() //get oauth token from settings



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

const fiveMins = 300000
const fifteenMins = 900000

setInterval(getGeo, fiveMins)
setInterval(fetchDailyWeather, fiveMins)
const getSleep = setInterval(fetchTodaysSleepData, fiveMins)




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

      let Latitude = (localStorage.getItem("Latitude"));
      let Longitude = (localStorage.getItem("Longitude"));
  
      let darksky = 'https://api.darksky.net/forecast/';
      let key = 'e09fb7a5c4859b3cdd54879e1b49b3c2';
      let uri = darksky + key + '/' + Latitude +','+ Longitude;
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
  
  var weatherArray = {}; // create weather object

  weatherArray.currentTemp= (localStorage.getItem("currentTemp"));  // assign saved weather values
  weatherArray.currentSummary= (localStorage.getItem("currentSummary"));
  weatherArray.temperatureHigh= (localStorage.getItem("temperatureHigh"));
  weatherArray.temperatureHighTime= (localStorage.getItem("temperatureLow"));
  weatherArray.temperatureLow= (localStorage.getItem("temperatureLow"));
  weatherArray.sunriseTime= (localStorage.getItem("sunriseTime"));
  weatherArray.sunsetTime= (localStorage.getItem("sunsetTime"));

  asap.send(weatherArray) // send back

}





function fetchTodaysSleepData()  {

    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken){
      restoreSettings()
    }

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

      localStorage.setItem("totalMinutesAsleep", sleepData.totalMinutesAsleep);

      var i;
      for (i = 0; i < 5; i++) {
        if (j.sleep[i]){

            localStorage.setItem("deepMins", sleepData.deepMins);
            localStorage.setItem("lightMins", sleepData.lightMins);
            localStorage.setItem("remMins", sleepData.remMins);
            localStorage.setItem("wakeMins", sleepData.wakeMins);

        }else{
          clearInterval(getSleep);
          break
        }
      } 
    })
    .catch(err => console.log('[FETCH]: - ' + err));
}

function sendSleep() {
  var sleepData = {};  //create sleepData object

  sleepData.totalMinutesAsleep = (localStorage.getItem("totalMinutesAsleep"));
  sleepData.deepMins = localStorage.getItem("deepMins");
  sleepData.lightMins = localStorage.getItem("lightMins");
  sleepData.remMins = localStorage.getItem("remMins");
  sleepData.wakeMins = localStorage.getItem("wakeMins");

  asap.send(sleepData)

}


  // A user changes Settings
  settingsStorage.onchange = evt => {
    if (evt.key === "oauth") {
      // Settings page sent us an oAuth token
      let data = JSON.parse(evt.newValue);
      localStorage.setItem("accessToken", data.access_token);
    }
  };
  
  // Restore previously saved settings and send to the device
  function restoreSettings() {
    for (let index = 0; index < settingsStorage.length; index++) {
      let key = settingsStorage.key(index);
      if (key && key === "oauth") {
        // We already have an oauth token
        let data = JSON.parse(settingsStorage.getItem(key))
        localStorage.setItem("accessToken", data.access_token);

        if (!localStorage.getItem("totalMinutesAsleep")){ //check to see if there is sleep data
          fetchTodaysSleepData() //if not get it
        }

      }
    }
  }
  
//Get calendar events
function getCalendarEvents () {
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
}
