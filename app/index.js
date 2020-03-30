import document from "document";
import { me as device } from "device";
import clock from "clock";
import { battery } from "power";
import { preferences, units } from "user-settings";
import { goals, today } from "user-activity";
import { HeartRateSensor } from "heart-rate";
import asap from "fitbit-asap/app";
import * as util from "../common/utils";

let time = document.getElementById("time")
let power = document.getElementById("power")
let txtDate = document.getElementById("txtDate");
let steps = document.getElementById("steps");
let heartRate = document.getElementById("heartRate")
let calories = document.getElementById("calories")
let temperature = document.getElementById("temperature");
let sleepTime = document.getElementById("sleepTime")

let batteryBarFG = document.getElementById("batteryBarFG")
let batteryBarBG = document.getElementById("batteryBarBG")
let stepsBarFG = document.getElementById("stepsBarFG")
let stepsBarBG = document.getElementById("stepsBarBG")
let heartrateBarFG = document.getElementById("heartrateBarFG")
let heartrateBarBG = document.getElementById("heartrateBarBG")

const deviceWidth = device.screen.width;

// CLOCK ------------------------------------------------------------------
clock.granularity = 'seconds'; // seconds, minutes, hours
clock.ontick = function(evt) { // do the following on every tick
 
  let hrs = evt.date.getHours()
  let mins= evt.date.getMinutes()
  let secs= evt.date.getSeconds()

    // UPDATE TIME -------------------------------------------------------------

    if(preferences.clockDisplay === "12h" && hrs == 12) {
        hrs = 12;
    }
  
    else if(preferences.clockDisplay === "12h" && hrs > 12) {
        hrs = hrs - 12;
    }
  
    time.text = `[T] ${hrs}:${mins.toString()}:${secs.toString()}`;
    // END UPDATE TIME --------------------------------------------------------



    // UPDATE DATE -------------------------------------------------------------  

    let date = new Date();
    let dayName = nameOfDay(date.getDay());
    let monthName = nameOfMonth(date.getMonth());
    let day = ("0" + date.getDate()).slice(-2);
  
    txtDate.text = `[D] ${dayName} ${day} ${monthName}`;
    // END UPDATE DATE -------------------------------------------------------------  
  

    // UPDATE STEPS -------------------------------------------------------------  
    steps.text = (`[S] ${today.local.steps || 0} / ${goals.steps || 0}`);
  
    const stepGoalPercentage = (today.local.steps|| 0) * 100 / goals.steps;
    const stepsBarWidth = (stepGoalPercentage / 100) * deviceWidth;
  
    stepsBarFG.width = stepsBarWidth;
    stepsBarBG.width = deviceWidth;
    // END UPDATE STEPS -------------------------------------------------------------  
  
  
    // UPDATE HEARTRATE -------------------------------------------------------------  
    if (HeartRateSensor) {
      const hrm = new HeartRateSensor();
      hrm.addEventListener("reading", () => {
          heartRate.text = (`[H] ${hrm.heartRate}`);
  
          const heartrateBarWidth = (hrm.heartRate / 220) * deviceWidth;
  
          heartrateBarFG.width = heartrateBarWidth;
          heartrateBarBG.width = deviceWidth;
      });
      hrm.start();
    }
    // END UPDATE HEARTRATE -------------------------------------------------------------  



  if (secs === 0) {  // every min
    
    console.log ('Every Minute')

      // UPDATE BATTERY ------------------------------------------------------------------
        var batLevel = (Math.floor(battery.chargeLevel));
        const batBarWidth = (batLevel / 100) * deviceWidth;
    
        power.text="[B] " + (Math.floor(battery.chargeLevel) + "%");
    
        batteryBarFG.width = batBarWidth;
        batteryBarBG.width = deviceWidth;
      // END UPDATE BATTERY ------------------------------------------------------------------
    
      // UPDATE CALORIES ------------------------------------------------------------------
      calories.text = (`[C] ${today.local.calories || 0} / ${goals.calories || 0}`)
      // END UPDATE CALORIES ------------------------------------------------------------------
    
  
  }

  if ((mins % 5 === 0) || (mins === 0)) { // every 5 mins and on the hour

    console.log('Every 5 Minutes')

  }

  if ((mins % 15 === 0) || (mins === 0)) { // every 15 mins and on the hour

    console.log('Every 15 Minutes')

  }

  if ((mins % 30 === 0) || (mins === 0)) { // every 30 mins and on the hour

    console.log('Every 30 Minutes')

  }

  if (mins === 0) {

    console.log('Every Hour')

  }
};

asap.onmessage = message => {

  console.log(
    'Received message from Companion',
    message.currentTemp,
    message.currentSummary,
    message.totalMinutesAsleep
  );

  if (message.currentTemp){ // if temp is reported
    let currentTemp = Math.round(message.currentTemp)
    temperature.text = (`[W] ${currentTemp} ${message.currentSummary}`)
  }

  if (message.totalMinutesAsleep){ // if toal slept mins is reported
    let totalMinutesAsleep= convertMinsToHrsMins(message.totalMinutesAsleep)
    sleepTime.text = (`[S] ${totalMinutesAsleep}`)
  }
}






function nameOfMonth(i) {
    switch(i) {
      case 0:
        return "JAN";
      case 1:
        return "FEB";
      case 2:
        return "MAR";
      case 3:
        return "APR";
      case 4:
        return "MAY";
      case 5:
        return "JUN";
      case 6:
        return "JUL";
      case 7:
        return "AUG";
      case 8:
        return "SEP";
      case 9:
        return "OCT";
      case 10:
        return "NOV";
      case 11:
        return "DEC";
    }
  }
  

  function nameOfDay(i) {
    switch(i) {
      case 0:
        return "SUN";
      case 1:
        return "MON";
      case 2:
        return "TUE";
      case 3:
        return "WED";
      case 4:
        return "THU";
      case 5:
        return "FRI";
      case 6:
        return "SAT";
    }
  }


  function convertMinsToHrsMins(mins) {
    let h = Math.floor(mins / 60);
    let m = mins % 60;
    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    return `${h}:${m}`;
  }