let cronJob = require('cron').CronJob;
 
// 秒 分 時 日 月 曜日
const testCronTime = "0 */1 * * * *";
// 一度だけ実行したい場合、Dateオブジェクトで指定も可能
// var cronTime = new Date();
const testJob = new cronJob({
  //実行したい日時 or crontab書式
  cronTime: testCronTime
  //指定時に実行したい関数
  , onTick: function() {
    console.log('onTick!');
  }
  //ジョブの完了または停止時に実行する関数 
  , onComplete: function() {
    console.log('onComplete!')
  }
  // コンストラクタを終する前にジョブを開始するかどうか
  , start: false
  //タイムゾーン
  , timeZone: "Asia/Tokyo"
})
//ジョブ開始
testJob.start();
//ジョブ停止
//job.stop();

// 実際のテスト
