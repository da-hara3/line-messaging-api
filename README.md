# herokuで動かす場合の覚書
```
// heroku CLIのinstall
$ curl https://cli-assets.heroku.com/install.sh | sh

// herokuへのログイン
$ heroku login

// heroku上でのdeploy先の指定
$ heroku git:remote -a [アプリ名]

// herokuの環境変数情報セット
$ heroku config:set LINE_CHANNEL_SECRET="[チャンネルシークレット]"
$ heroku config:set LINE_CHANNEL_ACCESS_TOKEN="[チャンネルアクセストークン]"

// herokuへのソースアップ (自動的にdeployが走る))
$ git push heroku master
```

---
# ローカルでデバッグする場合
## chrome版
* package.jsonのstartに `--inspect` を付与する。
* `chrome://inspect/#devices` をchromeで開く

## VS Code版
* 未定

---

# 補足

### 天気APIを使う場合
1. こちらでアカウント作成 → https://openweathermap.org/api
2. API Keyを取得する
3. herokuサーバーにAPI Keyを登録
```
$ heroku config:set WEATHER_API_KEY=""
```
#### open wheatherの参考サイト
* jsonのキーの意味とか
** https://qiita.com/key/items/aad73fd6057484f20731
* 公式なあれこれ
** https://openweathermap.org/weather-conditions

# コードを修正してherokuにpushする

gitの初期設定(一度だけ)
```
$ git config user.name "Your Name"
$ git config user.email "youremail@example.com"
```

herokuサーバーへのpush
```
$ git add .
$ git commit -m "update"
$ git push heroku master
```

# 画像認識AIとの接続
## 概要
- [IBM Cloud Visual Recognition](https://console.bluemix.net/docs/services/visual-recognition/index.html#-)を使い、画像の種類を返すLINE BOTを作成します。
- [API reference](https://www.ibm.com/watson/developercloud/visual-recognition/api/v3/node.html?node#general-api)

## 準備
- IBM Cloudのアカウント作成
  - [こちら](https://console.bluemix.net/docs/services/visual-recognition/getting-started.html#-)に従い作成
- `npm install --save watson-developer-cloud`

## 実行
### まずcurlでAPIを試す
```
curl -X POST -u -H 'Accept-Language:ja' "apikey:{your-api-key}" --form "images_file=@./image/fruitbowl.jpg" "https://gateway.watsonplatform.net/visual-recognition/api/v3/classify?version=2018-03-19"
```
### 次にnodeで試す
`node IBMImageRecognition.js`

### LINE BOTを改造する
