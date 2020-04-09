import document from "document";
import { me as device } from "device";
import clock from "clock";
import { battery,charger } from "power";
import { preferences, units } from "user-settings";
import { goals, today } from "user-activity";
import { HeartRateSensor } from "heart-rate";
import asap from "fitbit-asap/app";
import * as util from "../common/utils";

let ini = 0

let batt = document.getElementById("battery")
let steps = document.getElementById("steps");
let heartrate = document.getElementById("heartrate");
let sleep = document.getElementById("sleep");
let weather = document.getElementById("weather");
let writtenDate = document.getElementById("date");
let time = document.getElementById("time");

let batteryFGB = document.getElementById("batteryFGB")
let stepsFGB = document.getElementById("stepsFGB")
let heartrateFGB = document.getElementById("heartrateFGB")
let sleepFGB = document.getElementById("sleepFGB")
let weatherFGB = document.getElementById("weatherFGB")
let dateFGB = document.getElementById("dateFGB")
let timeFGB = document.getElementById("timeFGB")

const deviceWidth = device.screen.width;

updateThese([updateDate, updateSteps, updateHeartRate, updateBattery, updateWeather], 1000); // perform each function, in order, with a timeout of 1 second for each function to complete

function updateThese(functions, timeout) {
  for(var i = 0; i < functions.length; i++) {
    setTimeout(functions[i], timeout);
  }
}

// CLOCK ------------------------------------------------------------------
clock.granularity = 'seconds'; // seconds, minutes, hours
clock.ontick = function(evt) { // do the following on every tick

  let hrs = evt.date.getHours()
  let mins= evt.date.getMinutes()
  let secs= evt.date.getSeconds()

  if(preferences.clockDisplay === "12h" && hrs == 12) {
      hrs = 12;
  }
  else if(preferences.clockDisplay === "12h" && hrs > 12) {
      hrs = hrs - 12;
  }

  time.text = `[t] ${hrs}:${mins.toString()}:${secs.toString()}`;


  updateThese([updateSteps], 100); // perform each function, in order, with a timeout of 10 miliseconds for each 
  
  if (ini % 5 == 0 ){ // every 5 seconds after initalization
    updateThese([updateHeartRate], 3000); // perform each function, in order, with a timeout of 10 miliseconds for each function to complete

  }  
  if (ini % 30 == 0) { // every 30 seonds after initalization
    updateThese([updateBattery, updateDate], 100); // perform each function, in order, with a timeout of 10 miliseconds for each function to complete
  
  }

  if (ini % 60 == 0) { // every min after initialization
    updateThese( [updateWeather], 5000);

  }
  ini+=1
}

asap.onmessage = message => {

  console.log('From Comp to App: ' + message);

  if (message.currentTemp){ // if temp is reported
    let currentTemp = Math.round(message.currentTemp)
    weather.text = (`[w] ${currentTemp} ${message.currentSummary}`)
  }

  if (message.totalMinutesAsleep){ // if toal slept mins is reported
    let totalMinutesAsleep= convertMinsToHrsMins(message.totalMinutesAsleep)
    sleep.text = (`[s] ${totalMinutesAsleep}`)
  }
}


function updateDate(){   // UPDATE DATE --------------------------------------------------

  let date = new Date();
  let dayName = nameOfDay(date.getDay());
  let monthName = nameOfMonth(date.getMonth());
  let day = ("0" + date.getDate()).slice(-2);

  writtenDate.text = `[d] ${dayName} ${day} ${monthName}`;

}

function updateSteps(){       // UPDATE STEPS -------------------------------------------------------------  

    steps.text = (`[s] ${today.local.steps || 0} / ${goals.steps || 0}`);
  
    const stepGoalPercentage = (today.local.steps|| 0) * 100 / goals.steps;
    const stepsBarWidth = (stepGoalPercentage / 100) * deviceWidth;
  
    stepsFGB.width = stepsBarWidth;

}


function updateHeartRate(){      // UPDATE HEARTRATE -------------------------------------------------------------  

    if (HeartRateSensor) {
      const hrm = new HeartRateSensor();
      hrm.addEventListener("reading", () => {
          
          heartrate.text = (`[h] ${hrm.heartRate}`);
          let heartrateBarWidth = (hrm.heartRate / 220) * deviceWidth;
          heartrateFGB.width = heartrateBarWidth;
      });
      hrm.start();
    }else{
      heartrate.text = "no heartrate";
    }

}


function updateBattery(){       // UPDATE BATTERY ------------------------------------------------------------------

  let level = battery.chargeLevel;
  let batteryPercentage = Math.floor(level);
  let batterBarWidth = Math.floor(deviceWidth*(batteryPercentage/100));

  batt.text= "[b] " + batteryPercentage + "%"
  batteryFGB.width = batterBarWidth;

}



function updateWeather(incomingMessage){
  if (!incomingMessage){ //if not respoding to an incoming message, send an outgoing message
    asap.send("weather")
  }

}

function nameOfMonth(i) {
    switch(i) {
      case 0:
        return "jan";
      case 1:
        return "feb";
      case 2:
        return "mar";
      case 3:
        return "apr";
      case 4:
        return "may";
      case 5:
        return "jun";
      case 6:
        return "jul";
      case 7:
        return "aug";
      case 8:
        return "sep";
      case 9:
        return "oct";
      case 10:
        return "nov";
      case 11:
        return "dec";
    }
  }
  

  function nameOfDay(i) {
    switch(i) {
      case 0:
        return "sun";
      case 1:
        return "mon";
      case 2:
        return "tue";
      case 3:
        return "wed";
      case 4:
        return "thu";
      case 5:
        return "fri";
      case 6:
        return "sat";
    }
  }


  function convertMinsToHrsMins(mins) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m}`;
  }