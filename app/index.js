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

let ini = 0
let syncCount =0
let secsSinceMidnight= 0

let batteryText= document.getElementById("bt1")
let batteryBar = document.getElementById("fgb1")

let stepsText = document.getElementById("bt2");
let stepsBar = document.getElementById("fgb2")

let heartrateText = document.getElementById("bt3");
let heartrateBar = document.getElementById("fgb3")

let sleepText = document.getElementById("bt4");
let sleepBar = document.getElementById("fgb4")

let weatherText = document.getElementById("bt5");
let weatherBar = document.getElementById("fgb5")

let dateText = document.getElementById("bt6");
let dateBar = document.getElementById("fgb6")

let timeText = document.getElementById("bt7");
let timeBar = document.getElementById("fgb7")

let syncBar = document.getElementById("sync");

const deviceWidth = device.screen.width;

asap.cancel() // Cancels all queued messages. Call this function on startup to limit messages to a single session.


// CLOCK ------------------------------------------------------------------
clock.granularity = 'seconds'; // seconds, minutes, hours
clock.ontick = function(evt) { // do the following on every tick
  
  ini+=1

  let hrs = evt.date.getHours()
  let mins= evt.date.getMinutes()
  let secs= evt.date.getSeconds()

  let secsSinceMidnight = (hrs * 3600) + (mins * 60) + secs
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
  
  if (ini % 5 == 0 ){ // every 5 seconds after initalization
    // updateThese([updateHeartRate], 3000); // perform each function, in order, with a timeout of 10 miliseconds for each function to complete

  }  

  if (ini % 30 == 0) { // every 30 seonds after initalization

    updateBattery()
    updateDate()
  
  }

  if (ini % 900 == 0) { // every 5 mins after initialization
    updateWeather()
    updateSleep()
    updatedAgenda()
  }

  if ((hrs = 0) & (mins = 0) & (secs= 0)){ //at midnight 

  }
}

asap.onmessage = message => {

  console.log(JSON.stringify(message))

  updateSync(message) //update sync time

  if (message.currentTemp){ // if temp is reported
    updateWeather(message)
  }

  if (message.totalMinutesAsleep){ // if toal slept mins is reported
    updateSleep(message)
  }
}

function updatedAgenda (incomingMessage) {
  if (incomingMessage){
    syncCount = 0
  }else{
    asap.send("agenda")
  }
}

function updateSync(incomingMessage){
    if (incomingMessage){
      syncCount = 0
    }

    let sbPerc = (syncCount || 0) * 100 / 300;    //seonds in 5 mins
    let syncBarWidth = (sbPerc / 100) * deviceWidth;
  
    syncBar.width=syncBarWidth
    syncCount += 1

}


function updateDate(){   // UPDATE DATE --------------------------------------------------

  let date = new Date();
  let day = date.getDay()

  let secsSinceMidnight = (date -new Date().setHours(0,0,0,0)) / 1000;

  let pastDaysInSecs = (day * 86400);  // day of week times seonds in a day
  let totalSecsPassedWeek = secsSinceMidnight + pastDaysInSecs
  const datePercentage = (totalSecsPassedWeek) * 100 / 604800;    //seonds already passed vs seconds in a week
  const dateBarWidth = (datePercentage / 100) * deviceWidth;
  dateBar.width = dateBarWidth

  let dayName = nameOfDay(day);
  let monthName = nameOfMonth(date.getMonth());
 
  let day = ("0" + date.getDate()).slice(-2);

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
          let heartrateBarWidth = (hrm.heartRate / 200) * deviceWidth; //220 is max heart rate, but i never get there so 180 makes the bar move more which is more interesting
          heartrateBar.width = heartrateBarWidth;

      });
      display.addEventListener("change", () => {
        display.on ? hrm.start() : hrm.stop();         // Automatically stop the sensor when the screen is off to conserve battery
      });
      hrm.start();
    }

}


function updateBattery(){       // UPDATE BATTERY ------------------------------------------------------------------

  let level = battery.chargeLevel;
  let batteryPercentage = Math.floor(level);
  let batterBarWidth = Math.floor(deviceWidth*(batteryPercentage/100));

  batteryText.text= batteryPercentage + "%"
  batteryBar.width = batterBarWidth;

}


function updateWeather(incomingMessage){
  if (!incomingMessage){ //if not respoding to an incoming message, send an outgoing message
    asap.send("weather")
  }else{

    let currentlyTemperature    = Math.round(incomingMessage.currentTemp)
    let currentlySummary        = incomingMessage.currentSummary
    let dailyTemperatureHigh    = Math.round(incomingMessage.temperatureHigh)
    let dailyTemperatureHighTime= incomingMessage.temperatureHighTime
    let dailyTemperatureLow     = Math.round(incomingMessage.temperatureLow)
    let dailySunriseTime        = incomingMessage.sunriseTime
    let dailySunsetTime         = incomingMessage.sunsetTime

    let dailyTempSpread = dailyTemperatureHigh - dailyTemperatureLow
    let currentTempDiff = currentlyTemperature - dailyTemperatureLow

    // if current temp is lower than daily low or of high is hi

    let cTP = (currentTempDiff|| 0) * 100 / dailyTempSpread;
    let weatherBarWidth = (cTP / 100) * deviceWidth;

    if (weatherBarWidth < 60) {
      weatherBarWidth = 60
    }

    weatherText.text = (`${currentlyTemperature} ${currentlySummary}`)
    weatherBar.width = weatherBarWidth
  }
}


function updateSleep(incomingMessage) {
  if (!incomingMessage){ //if not respoding to an incoming message, send an outgoing message
    asap.send("sleep")
  }else{

    let totalMinutesAsleep = (incomingMessage.totalMinutesAsleep)
    let deepMins = (incomingMessage.deepMins)
    let lightMins = (incomingMessage.lightMins)
    let remMins = (incomingMessage.remMins)
    let wakeMins = (incomingMessage.wakeMins)
  
    let deepSleepBar = document.getElementById('deep')
    let lightSleepBar = document.getElementById('light')
    let remSleepBar = document.getElementById('rem')

    let lsbP= Math.round((lightMins || 0) * 100 / totalMinutesAsleep);
    let lightSleepBarWidth = (lsbP / 100) * deviceWidth;

    let dsbP= Math.round((deepMins || 0) * 100 / totalMinutesAsleep);
    let deepSleepBarWidth = (dsbP / 100) * deviceWidth;

    let rsbP= Math.round((remMins || 0) * 100 / totalMinutesAsleep);
    let remSleepBarWidth = (rsbP / 100) * deviceWidth;

    let tmaP= Math.round((totalMinutesAsleep || 0) * 100 / 480);//480 mins = 8 hours, replace this with sleep goal
    let sleepBarWidth = (tmaP / 100) * deviceWidth;

    lightSleepBar.width= lightSleepBarWidth - 5     // need ot shave 4 px off each bar so it doesnt overflow off screen, because i added margins between bars
    deepSleepBar.width= deepSleepBarWidth - 5
    remSleepBar.width= remSleepBarWidth -5
    sleepBar.width = sleepBarWidth

    let totalMinutesAsleep= convertMinsToHrsMins(totalMinutesAsleep)
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