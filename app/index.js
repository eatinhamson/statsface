import document from "document";
import clock from "clock";
import { battery } from "power";
import { preferences, units } from "user-settings";
import { goals, today } from "user-activity";
import { HeartRateSensor } from "heart-rate";
import asap from "fitbit-asap/app"

let time = document.getElementById("time")
let power = document.getElementById("power")
let txtDate = document.getElementById("txtDate");
let steps = document.getElementById("steps");
let heartRate = document.getElementById("heartRate")
let calories = document.getElementById("calories")
let temperature = document.getElementById("temperature");
let sleepTime = document.getElementById("sleepTime")

asap.send("ASAP - from app to companion")

// CLOCK ------------------------------------------------------------------
clock.granularity = 'seconds'; // seconds, minutes, hours
clock.ontick = function(evt) { // do the following on every tick
    
    let hours=("0" + evt.date.getHours()).slice(-2)
    let mins=("0" + evt.date.getMinutes()).slice(-2)
    let secs=("0" + evt.date.getSeconds()).slice(-2)
    
    if(preferences.clockDisplay === "12h" && hours == 12) {
        hours = 12;
    }
	
    else if(preferences.clockDisplay === "12h" && hours > 12) {
        hours = hours - 12;
    }
    
    time.text = `[T] ${hours}:${mins.toString()}:${secs.toString()}`;
  
  
    // DATE ------------------------------------------
    let date = new Date();
    let dayName = nameOfDay(date.getDay());
    let monthName = nameOfMonth(date.getMonth());
    let day = ("0" + date.getDate()).slice(-2);

    txtDate.text = `[D] ${dayName} ${day} ${monthName}`;

  //BATTERY ------------------------------------------------------------------
    power.text="[B] " + (Math.floor(battery.chargeLevel) + "%");
  
  //STEPS, CALORIES ------------------------------------------
    steps.text = (`[S] ${today.local.steps || 0} / ${goals.steps || 0}`);
    calories.text = (`[C] ${today.local.calories || 0} / ${goals.calories || 0}`)
  
};


//Heart Rate ------------------------------------------------------------------
if (HeartRateSensor) {
    const hrm = new HeartRateSensor();
    hrm.addEventListener("reading", () => {
        heartRate.text = (`[H] ${hrm.heartRate}`);
    });
    hrm.start();
 }

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