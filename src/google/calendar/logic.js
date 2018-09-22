const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
authorize(JSON.parse(process.env.GOOGLE_CREDENTIALS), listEvents, function(){});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, callBackAfterApi) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  // getAccessToken(oAuth2Client, callback); TODO //reflesh enviroment var
  oAuth2Client.setCredentials(JSON.parse(process.env.GOOGLE_TOKEN));
  return callback(oAuth2Client, callBackAfterApi);
  
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

exports.getListEvents =  function (callBackAfterApi) {
  return authorize(JSON.parse(process.env.GOOGLE_CREDENTIALS), listEvents, callBackAfterApi);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth, callBackAfterApi) {
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


function registerEvent(auth, params, callBackAfterApi) {
  let event = {
    'summary': 'test title',
    'location': 'test location',
    'description': '説明',
    'start': {
      'dateTime': '2015-05-28T09:00:00-07:00',
      'timeZone': 'Asia/Tokyo',
    },
    'end': {
      'dateTime': '2015-05-28T17:00:00-07:00',
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
  const calendar = google.calendar({version: 'v3', auth});
  calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  }, (err, res) => {
  if (err) {
    console.log('There was an error contacting the Calendar service: ' + err);
    return;
  }
  console.log('Event created: %s', res.htmlLink);
  callBackAfterApi(res.htmlLink + 'を登録したよ！');
  });
}
