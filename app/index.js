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

const deviceWidth = device.screen.width;

asap.cancel() // Cancels all queued messages. Call this function on startup to limit messages to a single session.

updateThese([updateDate, updateSteps, updateHeartRate, updateBattery, updateWeather, updateSleep], 1000); // perform each function, in order, with a timeout of 1 second for each function to complete

function updateThese(functions, timeout) {
  for(var i = 0; i < functions.length; i++) {
    setTimeout(functions[i], timeout);
  }
}

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

  updateThese([updateSteps, updateHeartRate], 100); // perform each function, in order, with a timeout of 10 miliseconds for each 
  
  if (ini % 5 == 0 ){ // every 5 seconds after initalization
    // updateThese([updateHeartRate], 3000); // perform each function, in order, with a timeout of 10 miliseconds for each function to complete

  }  

  if (ini % 30 == 0) { // every 30 seonds after initalization
    updateThese([updateBattery, updateDate], 100); // perform each function, in order, with a timeout of 10 miliseconds for each function to complete
  
  }

  if (ini % 900 == 0) { // every 5 mins after initialization
    updateThese( [updateWeather, updateSleep], 5000);

  }
}

asap.onmessage = message => {

  console.log('From Comp to App: ' + message);

  if (message.currentTemp){ // if temp is reported
    updateWeather(message)

  }

  if (message.totalMinutesAsleep){ // if toal slept mins is reported
    updateSleep(message)
  }
}


function updateDate(){   // UPDATE DATE --------------------------------------------------

  let date = new Date();

  let day = date.getDay()
  let month = date.getMonth() + 1
  let year = date.getFullYear()

  let dIM = daysInMonth(month,year);

  const datePercentage = (day) * 100 / dIM;
  const dateBarWidth = (datePercentage / 100) * deviceWidth;
  dateBar.width = dateBarWidth

  let dayName = nameOfDay(day);
  let monthName = nameOfMonth(date.getMonth());
 
  let day = ("0" + date.getDate()).slice(-2);

  dateText.text = `${dayName} ${day} ${monthName}`;

}

// Month here is 1-indexed (January is 1, February is 2, etc).
function daysInMonth (month, year) {
  return new Date(year, month, 0).getDate();
}



function updateSteps(){       // UPDATE STEPS -------------------------------------------------------------  

    stepsText.text = (`${today.local.steps || 0} / ${goals.steps || 0}`);
  
    const stepGoalPercentage = (today.local.steps|| 0) * 100 / goals.steps;
    const stepsBarWidth = (stepGoalPercentage / 100) * deviceWidth;
  
    stepsBar.width = stepsBarWidth;

}


function updateHeartRate(){      // UPDATE HEARTRATE -------------------------------------------------------------  

    /*
      Peak 160 to 220
      Cardio 130 to 159
      Fat Burn 95 to 129
      Resting 0 to 94
    */

    if (HeartRateSensor) {
      const hrm = new HeartRateSensor(); // if there is a heart rate sensor
      hrm.addEventListener("reading", () => { // add a listener to it

          heartrateText.text = (`${hrm.heartRate}`);
          let heartrateBarWidth = (hrm.heartRate / 180) * deviceWidth; //220 is max heart rate, but i never get there so 180 makes the bar move more which is more interesting
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
    let currentTemp = Math.round(incomingMessage.currentTemp)
    weatherText.text = (`${currentTemp} ${incomingMessage.currentSummary}`)
  }
}


function updateSleep(incomingMessage) {
  if (!incomingMessage){ //if not respoding to an incoming message, send an outgoing message
    asap.send("sleep")
  }else{
    let totalMinutesAsleep= convertMinsToHrsMins(incomingMessage.totalMinutesAsleep)
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