import * as messaging from "messaging";

console.log("Companion Started");

let darksky = 'https://api.darksky.net/forecast/';
let key = 'e09fb7a5c4859b3cdd54879e1b49b3c2';
let lat = 45.3483;
let lng = -75.7584;
let uri = darksky + key + '/' + lat +','+ lng;
console.log(uri);
uri = uri.concat('?units=us&exclude=minutely,hourly');
// units - ca, si, us, uk
// exclude - minutely,hourly,daily,currently

fetch(uri)
    .then((response)=>{
        if(response.ok){
            return response.json();
        }else{
            throw new Error('Bad HTTP!')
        }
    })
    .then((j) =>{
        console.log(
            j.currently.temperature, 
            j.currently.summary
            );

        let myData = {
            currentTemp: j.currently.temperature,
            currentSummary: j.currently.summary
        }

        if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
            messaging.peerSocket.send(myData);
        }
    })
    .catch(err => console.log('[FETCH]: ' + err));
