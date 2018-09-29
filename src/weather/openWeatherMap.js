const http = require('http');

const location = "Tokyo";
const units = 'metric';
const APIKEY = process.env.OPEN_WEATHER_MAP_API_KEY;
const TODAY_WEATHER_URL = 'http://api.openweathermap.org/data/2.5/weather?q='+ location +'&units='+ units +'&appid='+ APIKEY;
const FIVW_DAYS_WEATHER_URL = 'http://api.openweathermap.org/data/2.5/forecast?q='+ location +'&units='+ units +'&appid='+ APIKEY;


exports.get = function (callback) {
// function weather(callback) {
  http.get(TODAY_WEATHER_URL, function(res) {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function(chunk) {
      let parseJson = JSON.parse(body);
      // console.log(res.weather[0].main);
      callback(resolveWeatherJson(parseJson));
    });
  }).on('error', function(e) {
    console.log(e.message);
  });
}

exports.getFiveDays = function (callback) {
  // function weather(callback) {
    http.get(FIVW_DAYS_WEATHER_URL, function(res) {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        body += chunk;
      });
      res.on('end', function(chunk) {
        let parseJson = JSON.parse(body);
        // console.log(res.weather[0].main);
        callback(resolveWeatherJson(parseJson));
      });
    }).on('error', function(e) {
      console.log(e.message);
    });
  }

function resolveWeatherJson(parseJson){
  let message = "";
  const HEAD_MESSAGE = ""
  for (weather of parseJson.weather){
    if (message !== ""){
      message += ", ところにより";
    }
    message += convertIcon(weather.icon);
  }
  message += "\n気温:" + parseJson.main.temp + "℃";
  message += "\n湿度:" + parseJson.main.humidity + "％";
  message += "\n最低気温:" + parseJson.main.temp_min + "℃";
  message += "\n最高気温:" + parseJson.main.temp_max + "℃";
  return message;
}

function convertIcon(icon){
  switch(icon) {
    case "01d" : 
    case "01n" : 
      return "快晴";
    case "02d" : 
    case "02n" : 
      return "晴れ";
    case "03d" : 
    case "03n" : 
      return "くもり";
    case "04d" : 
    case "04n" :
     return "くもり";
    case "09d" : 
    case "09n" : 
      return "小雨";
    case "10d" : 
    case "10n" : 
      return "雨";
    case "11d" :
    case "11n" :
     return "雷雨";
    case "13d" : 
    case "13n" : 
      return "雪";
    case "50d" :
    case "50n" :
      return "霧";
    default: return "";
  }
}

exports.weatherWithPlace = function (place, callback) {
  const urlPlace = 'http://api.openweathermap.org/data/2.5/weather?q='+ place +'&units='+ units +'&appid='+ APIKEY;

  http.get(urlPlace, function(res) {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function(chunk) {
      res = JSON.parse(body);
      // console.log(res.weather[0].main);
      callback(res.weather[0].main);
    });
  }).on('error', function(e) {
    console.log(e.message);
  });
}
