let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let request = require('request');
let crypto = require("crypto");
let async = require('async');

const BASE_DIR = '../';
let sendMessage = require(BASE_DIR + 'line/api/sendMessage.js');
let messageTemplate = require(BASE_DIR + 'line/api/messageTemplate.js');
let calendar = require(BASE_DIR + 'google/calendar/logic.js');
let weatherMap = require(BASE_DIR + 'weather/openWeatherMap.js'); 

// let pgManager = require('./postgresManager.js'); // データベースを使う時に必要

// let visualRecognition = require('./IBMImageRecognition.js'); // 画像認識AIを使う時に必要

// utilモジュールを使います。
let util = require('util');

app.set('port', (process.env.PORT || 8000));
// JSONの送信を許可
app.use(bodyParser.urlencoded({
  extended: true
}));

// JSONパーサー
app.use(bodyParser.json());

// 半ばhealth check
app.get('/', function(req, res) {
  res.send('<h1>Hello World! </h1>');
  // calendar.getListEvents(function(value){res.send('<h1>' + value + '</h1>')});
});

// あくまで処理の確認用
app.get('/test', (req, res) => {
  weatherMap.get((value) => {res.send('<h1>' + value + '</h1>')});
});

// ここは最終的に別クラスに移譲する作りにするべき
app.post('/callback', function(req, res) {
  console.log("リクエストログ開始");
  console.log(req.body['events'][0]);
  console.log("リクエストログ終了");
  async.waterfall([
      function(callback) {
        // リクエストがLINE Platformから送られてきたか確認する
        if (!validate_signature(req.headers['x-line-signature'], req.body)) {
          return;
        }
        // テキストか画像が送られてきた場合のみ返事をする
        if (
          (req.body['events'][0]['type'] != 'message') ||
          ((req.body['events'][0]['message']['type'] != 'text') &&
          (req.body['events'][0]['message']['type'] != 'image'))
        ) {
          return;
        }

        // ユーザIDを取得する
        let user_id = req.body['events'][0]['source']['userId'];
        let message_id = req.body['events'][0]['message']['id'];
        // 'text', 'image' ...
        let message_type = req.body['events'][0]['message']['type'];
        let message_text = req.body['events'][0]['message']['text'];
        request.get(getProfileOption(user_id), function(error, response, body) {
          if (!error && response.statusCode == 200) {
            callback(req, body['displayName'], message_id, message_type, message_text);
          }
       });    
      },
    ],

    function(req, displayName, message_id, message_type, message_text) {

      let message = "やあ, " + displayName + "。これから色々返せるようにするからちょっと待ってね"; 
      const NO_SPACE_INDEX = -1;
      const CORRECT_SPACE_INDEX = 4; // これは要らない。指定ワードが何かによって可変で処理できるべき。

      // 半角も全角も判定できるようにしておく。
      if (isReturnMessage(message_type, message_text, CORRECT_SPACE_INDEX)) {
        let param_text = message_text.substr(CORRECT_SPACE_INDEX).trim();
        operationForParam(param_text, function(value) {sendMessage.send(req, [ messageTemplate.textMessage(value) ]);});
      } else if (message_text === 'がーすー' ){
        callBackForLine("やあ, " + displayName + "。ぼくはがーすー。\n「こんなことしてほしい！」があったら言ってね！");
      }
      

      ///////////////////
      // 画像で返事をする //
      ///////////////////
      /*
      let messages = ["左上を押した", "右上を押した", "左下を押した", "右下を押した"];
      if (message_text == "猫") {
         sendMessage.send(req, [ messageTemplate.imagemapMessage(messages, 'https://i.imgur.com/8cbL5dl.jpg') ]);
         return;
      } else if (message_text == "犬") {
         sendMessage.send(req, [ messageTemplate.imagemapMessage(messages, 'https://i.imgur.com/ph82KWH.jpg') ]);
         return;
      } else if (message_text == "鹿") {
         sendMessage.send(req, [ messageTemplate.imagemapMessage(messages, 'https://i.imgur.com/Z6ilhSI.jpg') ]);
         return;
      }
      */
      //////////////∏/////
      // 画像で返事をする //
      ///////////////////



      //////////////////
      // 画像認識パート //
      /////////////////
      // if (message_type === 'image') {

      //   // 上のLINE Developersドキュメントのコードだとうまくいかない。
      //   // chunkにresponseとbodyが一緒に入っている？
      //   // encoding: nullが設定されてないから？
      //   const options = {
      //     url: `https://api.line.me/v2/bot/message/${message_id}/content`,
      //     method: 'get',
      //     headers: {
      //         'Authorization': 'Bearer ' + process.env.LINE_CHANNEL_ACCESS_TOKEN,
      //     },
      //     encoding: null
      //   };

      //   request(options, function(error, response, body) {
      //     if (!error && response.statusCode == 200) {
      //       console.log('Got responce');
      //       visualRecognition.classify(body, function (result) {
      //         sendMessage.send(req, [ messageTemplate.textMessage(result) ]);
      //         return;
      //       })
      //     } else {
      //       // @todo handle error
      //     }
      //   });
      // }
      ////////////////////////
      // 画像認識パートここまで //
      ////////////////////////

      return;
    }
  );
});

app.listen(app.get('port'), function() {
  console.log('Node app is running');
});

// メッセージの長さを返す
function textcount(body) {
  return body.length;
}

// ランダムな数値を取得する
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function getProfileOption(user_id) {
  return {
    url: 'https://api.line.me/v2/bot/profile/' + user_id,
    proxy: process.env.FIXIE_URL,
    json: true,
    headers: {
      'Authorization': 'Bearer {' + process.env.LINE_CHANNEL_ACCESS_TOKEN + '}'
    }
  };
}

// 署名検証
function validate_signature(signature, body) {
  return signature == crypto.createHmac('sha256', process.env.LINE_CHANNEL_SECRET).update(new Buffer(JSON.stringify(body), 'utf8')).digest('base64');
}

// botとして何らかのメッセージを返すかを
function isReturnMessage(messageType, messageText, correctIndex){
  if (messageType !== 'text' || messageText.indexOf('がーすー') !== 0) {
    return false;
  }
  if (messageText.indexOf(' ') === correctIndex){
    return true;
  }
  if (messageText.indexOf('　') === correctIndex){
    return true;
  }
  return false;
}

// 引数に応じて処理をしてその結果の文言をlineに投稿する
async function operationForParam(paramText, callBackForLine){
  let params = paramText.split(/\s+/);
  switch(params[0]) {
    case '予定教えて':
      return calendar.getListEvents(callBackForLine);
    case '予定登録':
    case '予定登録して':
      return calendar.registerEvent(callBackForLine, params);
    case '天気':
    case '天気教えて':
      return weatherMap.get(callBackForLine);
    case '仕様' :
    case '仕様教えて' :
      return callBackForLine("呼びかけの基本: 先頭に「がーすー」"
      + "\n---カレンダー確認---" 
      + "\n・指定語「予定教えて」・例 「がーすー 予定教えて」"
      + "\n---カレンダー登録---"
      + "\n・指定語:「予定登録」,「予定登録して」"
      + "\n・オプション:スペースでそれぞれの情報を区切る"
      + "\n  * `t-`: タイトル * `s-`: 開始日時 * `e-`: 終了日時, `l-`: 場所, `指定なし`: 説明"
      + "\n・例 「がーすー t-飲み会 s-2018-09-30T20:00」 *タイトルと開始日時が必須だよ " 
      + "\n---カレンダー情報---"
      + "\nharada.hiroto.bot@gmail.com に登録されてるよ"
      + "\n中の人にgoogleアカウントを送ってくれたら権限を付与するよ"
      );
    default:
        return callBackForLine("ごめんよ。君の言っていることが分からないよ・・・");
    }

    function get(){

    }
}