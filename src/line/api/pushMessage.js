var request = require('request');

exports.send = function(to, messages, accessToken) {
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {' + accessToken + '}',
  };

  // 送信データ作成
  var data = {
    'to': to,
    'messages': messages
  };

  //オプションを定義
  var options = {
    url: 'https://api.line.me/v2/bot/message/push',
    proxy: process.env.FIXIE_URL,
    headers: headers,
    json: true,
    body: data
  };

  request.post(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('リクエスト成功');
    } else {
      console.log('エラー: ' + JSON.stringify(response));
    }
  });
}
