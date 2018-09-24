const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
// If you want to define `readonly`, you can add `.readonly`
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

// TODO: util化
let dateFormat = 
{
 _fmt : {
   hh: function(date) { return ('0' + date.getHours()).slice(-2); },
   h: function(date) { return date.getHours(); },
   mm: function(date) { return ('0' + date.getMinutes()).slice(-2); },
   m: function(date) { return date.getMinutes(); },
   ss: function(date) { return ('0' + date.getSeconds()).slice(-2); },
   dd: function(date) { return ('0' + date.getDate()).slice(-2); },
   d: function(date) { return date.getDate(); },
   s: function(date) { return date.getSeconds(); },
   yyyy: function(date) { return date.getFullYear() + ''; },
   yy: function(date) { return date.getYear() + ''; },
   t: function(date) { return date.getDate()<=3 ? ["st", "nd", "rd"][date.getDate()-1]: 'th'; },
   w: function(date) {return ["Sun", "$on", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]; },
   MMMM: function(date) { return ["January", "February", "$arch", "April", "$ay", "June", "July", "August", "September", "October", "November", "December"][date.getMonth()]; },
   MMM: function(date) {return ["Jan", "Feb", "$ar", "Apr", "$ay", "Jun", "Jly", "Aug", "Spt", "Oct", "Nov", "Dec"][date.getMonth()]; },  
   MM: function(date) { return ('0' + (date.getMonth() + 1)).slice(-2); },
   M: function(date) { return date.getMonth() + 1; },
   $: function(date) {return 'M';}
 },
 _priority : ["hh", "h", "mm", "m", "ss", "dd", "d", "s", "yyyy", "yy", "t", "w", "MMMM", "MMM", "MM", "M", "$"],
 format: function(date, format){return this._priority.reduce((res, fmt) => res.replace(fmt, this._fmt[fmt](date)), format)}
}

// Load client secrets from a local file.
// authorize(JSON.parse(process.env.GOOGLE_CREDENTIALS), listEvents, function(){});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, callBackAfterApi) {
  const dummyParams = [];
  authorize(credentials, callback, callBackAfterApi, dummyParams);
}

function authorize(credentials, callback, callBackAfterApi, params) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  // getAccessToken(oAuth2Client, callback); //TODO //reflesh enviroment var
  oAuth2Client.setCredentials(JSON.parse(process.env.GOOGLE_TOKEN));
  return callback(oAuth2Client, callBackAfterApi, params); 
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

// define callBackApi ---------------------------------------------------

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth, callBackAfterApi, params) {
  // param when be used feature.
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const calendarItems = res.data.items;
    if (calendarItems.length) {
      console.log('Upcoming 10 calendarItems:');
      calendarItems.map((calendarItem, i) => {
        const start = calendarItem.start.dateTime || calendarItem.start.date;
        console.log(`${start} - ${calendarItem.summary}`);
        callBackAfterApi(`${start} - ${calendarItem.summary}`);
      });
    } else {
      console.log('No upcoming calendarItems found.');
      callBackAfterApi('予定なし');
    }
  });
}

function registerEventLocal(auth, callBackAfterApi, params) {
  let event = createEvent(params);
  if (event.summary === ''){
    callBackAfterApi('タイトルが入ってないよ！');
    return 
  }
  if (event.start === '' ){
   callBackAfterApi('開始日が入っていないよ！');
   return 
  }

  if (event.start.dateTime.indexOf('NaN-aN-aNTaN:aN:aN') !== -1){
    callBackAfterApi('開始日がおかしいよ！');
    return 
  }
  if (event.end.dateTime.indexOf('NaN-aN-aNTaN:aN:aN') !== -1){
    callBackAfterApi('開始日がおかしいよ！');
    return 
  }

  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: event,
  }, (err, res) => {
  if (err) {
    console.log('There was an error contacting the Calendar service: ' + err);
    callBackAfterApi('エラーが発生しちゃった・・・ :' + err);
    return;
  }
  callBackAfterApi(res.data.htmlLink + 'を登録したよ！');
  });
}

function createEvent(params){
  // 可能であれば各配列値がどのような要素かを判定して処理を行いたい。
  // 一旦はメタ情報を付与して貰って対応する。
  let title = 'てｓｔ';
  let start = '';
  let end = '';
  let location = '';
  let description = '';
  const META_TITLE = 't-';
  const META_START = 's-';
  const META_END = 'e-';
  const META_LOCATION = 'l-';
  const JAPAN_TIME = '+09:00'
  const DEFAULT_START_TIME = '00:00';

  for (let i = 1; i < params.length; i++) {
    let param = params[i];
     // jsのクラスの考えが不明瞭なので一旦力技
     // TODO: typeScriptへのリファクタとともに書き換え
    if (param.indexOf(META_TITLE) == 0){
      title = param.replace(META_TITLE, '');
    } else if (param.indexOf(META_START) == 0){
      start = param.replace(META_START, '');
    } else if (param.indexOf(META_END) == 0){
      end = param.replace(META_END, '');
    } else if (param.indexOf(META_LOCATION) == 0){
      location = param.replace(META_LOCATION, '');
    } else {
      description += param;
    }
   }
   if (start == ''){
    // からの場合は呼び出し元でエラーにする。
   } else  {
     let startDate = dateFormat.format(new Date(start), 'yyyy-MM-ddThh:mm:ss'); 
     start = startDate + JAPAN_TIME;
   }

  if (end == ''){
   // からの場合はgoogleに任せるｗ
  } else{
   let endDate = dateFormat.format(new Date(end), 'yyyy-MM-ddThh:mm:ss'); 
   end = endDate + JAPAN_TIME;
  }
  

  return {
    'summary': title,
    'location': location,
    'description': description,
    'start': {
      'dateTime': start,
      'timeZone': 'Asia/Tokyo',
    },
    'end': {
      'dateTime': end,
      'timeZone': 'Asia/Tokyo',
    },
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 24 * 60},
        {'method': 'popup', 'minutes': 10},
      ],
    },
  };
}

// define exports

exports.getListEvents =  function (callBackAfterApi) {
  return authorize(JSON.parse(process.env.GOOGLE_CREDENTIALS), listEvents, callBackAfterApi);
}

exports.registerEvent = function (callBackAfterApi, params) {
  return authorize(JSON.parse(process.env.GOOGLE_CREDENTIALS), registerEventLocal, callBackAfterApi, params);
}