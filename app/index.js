import document from "document";
import { me as device } from "device";
import clock from "clock";
import { battery,charger } from "power";
import { preferences, units } from "user-settings";
import { goals, today } from "user-activity";
import { HeartRateSensor } from "heart-rate";
import asap from "fitbit-asap/app";
import * as util from "../common/utils";
import { display } from "display";


var batteryText= document.getElementById("bt1")
var batteryBar = document.getElementById("fgb1")

var stepsText = document.getElementById("bt2");
var stepsBar = document.getElementById("fgb2")

var heartrateText = document.getElementById("bt3");
var heartrateBar = document.getElementById("fgb3")

var sleepText = document.getElementById("bt4");
var sleepBar = document.getElementById("fgb4")

var weatherText = document.getElementById("bt5");
var weatherBar = document.getElementById("fgb5")

var dateText = document.getElementById("bt6");
var dateBar = document.getElementById("fgb6")

var timeText = document.getElementById("bt7");
var timeBar = document.getElementById("fgb7")

var syncBar = document.getElementById("sync");

var compComTimeBar = document.getElementById("compCom");

var asapTimeStamp = 0
var deviceWidth = device.screen.width;

var weatherData = {}; // create weather object
var sleepData = {};  //create sleepData object

asap.onmessage = message => {

  console.log(JSON.stringify(message))

  if (message.timeStamp){
    asapTimeStamp = message.timeStamp
  }

  if (message.currentTemp){ // if temp is reported

    weatherData.currentTemp= message.currentTemp
    weatherData.currentSummary= message.currentSummary
    weatherData.temperatureHigh= message.temperatureHigh
    weatherData.temperatureHighTime= message.temperatureHighTime
    weatherData.temperatureLow= message.temperatureLow
    weatherData.sunriseTime= message.sunriseTime
    weatherData.sunsetTime= message.sunsetTime

    updateWeather(weatherData)
  }

  if (message.totalMinutesAsleep){ // if toal slept mins is reported

    sleepData.totalMinutesAsleep = message.totalMinutesAsleep
    sleepData.deepMins = message.deepMins
    sleepData.lightMins = message.lightMins
    sleepData.remMins = message.remMins
    sleepData.wakeMins = message.wakeMins

    updateSleep(sleepData)
  }
}


// CLOCK ------------------------------------------------------------------
clock.granularity = 'seconds'; // seconds, minutes, hours
clock.ontick = function(evt) { // do the following on every tick

  var hrs = evt.date.getHours()
  var mins= evt.date.getMinutes()
  var secs= evt.date.getSeconds()

  var secsSinceMidnight = (hrs * 3600) + (mins * 60) + secs
  const timePercentage = (secsSinceMidnight) * 100 / 86400;
  const stepsBarWidth = (timePercentage / 100) * deviceWidth;
  
  timeBar.width = stepsBarWidth

  if(preferences.clockDisplay === "12h" && hrs == 12) {
      hrs = 12;
  }
  else if(preferences.clockDisplay === "12h" && hrs > 12) {
      hrs = hrs - 12;
  }

  timeText.text = ("0" + hrs).slice(-2) + ":" +
                      ("0" + mins).slice(-2) + ":" +
                      ("0" + secs).slice(-2);

  updateSteps()
  updateHeartRate()
  updateSync()
  updateBattery()
  updateDate()
  updateCompComBar()

  updateSleep()
  updateWeather()

}


function updateSync() {  

  var date = new Date();
  var lastSyncTime =(device.lastSyncTime);

  var timeSinceLastSync = (date - lastSyncTime)

  var sbPerc = (timeSinceLastSync || 0) * 100 / 900000;    // 15 mins in ms
  var syncBarWidth = (sbPerc / 100) * deviceWidth;

  if (syncBarWidth > (deviceWidth - 2)) {  //do not allow bar to flow past 2 pixels from the width of the screen
    syncBarWidth = 284
  }

  syncBar.width=syncBarWidth
}


function updateCompComBar() {  

  if (asapTimeStamp){

    var date = new Date();
    var secsSinceMidnight = (date -new Date().setHours(0,0,0,0)) / 1000;

    var timeSinceLasCompCom = (secsSinceMidnight - asapTimeStamp)
  
    var cbPerc = (timeSinceLasCompCom || 0) * 100 / 900;    // fifteen mins in seconds
    var compComTimeBarWidth = (cbPerc / 100) * deviceWidth;
  
    if (compComTimeBarWidth > (deviceWidth - 12)) {  //do not allow bar to flow past 2 pixels from the width of the screen
      compComTimeBarWidth = (deviceWidth - 12)
    }
    compComTimeBar.width=compComTimeBarWidth
  }else{
    compComTimeBar.width=0
  }
}


function updateDate(){   // UPDATE DATE --------------------------------------------------

  var date = new Date();
  var day = date.getDay()

  var secsSinceMidnight = (date -new Date().setHours(0,0,0,0)) / 1000;

  var pastDaysInSecs = (day * 86400);  // day of week times seonds in a day
  var totalSecsPassedWeek = secsSinceMidnight + pastDaysInSecs
  var datePercentage = (totalSecsPassedWeek) * 100 / 604800;    //seonds already passed vs seconds in a week
  var dateBarWidth = (datePercentage / 100) * deviceWidth;
  dateBar.width = dateBarWidth

  var dayName = nameOfDay(day);
  var monthName = nameOfMonth(date.getMonth());
 
  var day = ("0" + date.getDate()).slice(-2);

  dateText.text = `${dayName} ${day} ${monthName}`;

}


function updateSteps(){       // UPDATE STEPS -------------------------------------------------------------  

    stepsText.text = (`${today.local.steps || 0} / ${goals.steps || 0}`);
  
    const stepGoalPercentage = (today.local.steps|| 0) * 100 / goals.steps;
    const stepsBarWidth = (stepGoalPercentage / 100) * deviceWidth;
  
    if (stepsBarWidth < 60) {
      stepsBarWidth = 60
    }

    stepsBar.width = stepsBarWidth;

}


function updateHeartRate(){      // UPDATE HEARTRATE -------------------------------------------------------------  

    if (HeartRateSensor) {
      const hrm = new HeartRateSensor(); // if there is a heart rate sensor
      hrm.addEventListener("reading", () => { // add a listener to it

          heartrateText.text = (`${hrm.heartRate}`);
          var heartrateBarWidth = (hrm.heartRate / 200) * deviceWidth; //220 is max heart rate, but i never get there so 180 makes the bar move more which is more interesting
          heartrateBar.width = heartrateBarWidth;

      });
      display.addEventListener("change", () => {
        display.on ? hrm.start() : hrm.stop();         // Automatically stop the sensor when the screen is off to conserve battery
      });
      hrm.start();
    }

}


function updateBattery(){       // UPDATE BATTERY ------------------------------------------------------------------

  var level = battery.chargeLevel;
  var batteryPercentage = Math.floor(level);
  var batterBarWidth = Math.floor(deviceWidth*(batteryPercentage/100));

  batteryText.text= batteryPercentage + "%"
  batteryBar.width = batterBarWidth;

}


function updateWeather(){
  if (!weatherData.currentTemp){ //if not respoding to an incoming message, send an outgoing message
    asap.send("weather")
  }else{

    var dailyTempSpread = weatherData.dailyTemperatureHigh - weatherData.dailyTemperatureLow
    var currentTempDiff = weatherData.currentlyTemperature - weatherData.dailyTemperatureLow

    // if current temp is lower than daily low or of high is hi

    var cTP = (currentTempDiff|| 0) * 100 / dailyTempSpread;
    var weatherBarWidth = (cTP / 100) * deviceWidth;

    if (weatherBarWidth < 60) {
      weatherBarWidth = 60
    }

    weatherText.text = (`${weatherData.currentTemp} ${weatherData.currentSummary}`)
    weatherBar.width = weatherBarWidth
  }
}


function updateSleep() {
  if (!sleepData.totalMinutesAsleep){ //if not respoding to an incoming message, send an outgoing message
    asap.send("sleep")
  }else{
  
    var deepSleepBar = document.getElementById('deep')
    var lightSleepBar = document.getElementById('light')
    var remSleepBar = document.getElementById('rem')

    var lsbP= Math.round((sleepData.lightMins || 0) * 100 / sleepData.totalMinutesAsleep);
    var lightSleepBarWidth = (lsbP / 100) * deviceWidth;

    var dsbP= Math.round((sleepData.deepMins || 0) * 100 / sleepData.totalMinutesAsleep);
    var deepSleepBarWidth = (dsbP / 100) * deviceWidth;

    var rsbP= Math.round((sleepData.remMins || 0) * 100 / sleepData.totalMinutesAsleep);
    var remSleepBarWidth = (rsbP / 100) * deviceWidth;

    var tmaP= Math.round((sleepData.totalMinutesAsleep || 0) * 100 / 480);//480 mins = 8 hours, replace this with sleep goal
    var sleepBarWidth = (tmaP / 100) * deviceWidth;

    lightSleepBar.width= lightSleepBarWidth - 5     // need ot shave 4 px off each bar so it doesnt overflow off screen, because i added margins between bars
    deepSleepBar.width= deepSleepBarWidth - 5
    remSleepBar.width= remSleepBarWidth -5
    sleepBar.width = sleepBarWidth

    var totalMinutesAsleep= convertMinsToHrsMins(sleepData.totalMinutesAsleep)
    sleepText.text = (`${totalMinutesAsleep}`)
  }
}

function nameOfMonth(i) {
    switch(i) {
      case 0:
        return "Jan";
      case 1:
        return "Feb";
      case 2:
        return "Mar";
      case 3:
        return "Apr";
      case 4:
        return "May";
      case 5:
        return "Jun";
      case 6:
        return "Jul";
      case 7:
        return "Aug";
      case 8:
        return "Sep";
      case 9:
        return "Oct";
      case 10:
        return "Nov";
      case 11:
        return "Dec";
    }
  }
  

  function nameOfDay(i) {
    switch(i) {
      case 0:
        return "Sun";
      case 1:
        return "Mon";
      case 2:
        return "Tue";
      case 3:
        return "Wed";
      case 4:
        return "Thu";
      case 5:
        return "Fri";
      case 6:
        return "Sat";
    }
  }


  function convertMinsToHrsMins(mins) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m}`;
  }