let checkArakawaTennisCort = require("./everyCort/checkArakawaTennisCort");
let push = require("./everyCort/checkArakawaTennisCort");

const BASE_DIR = "../../"
let pushMessage = require(BASE_DIR + 'line/api/pushMessage.js');
let messageTemplate = require(BASE_DIR + 'line/api/messageTemplate.js');

module.exports = async function (to, accessToken) {
  const arakawaResult = await checkArakawaTennisCort();

  if (!arakawaResult) {
    pushMessage.send(to, [messageTemplate.textMessage(`エラーが起きたっぽい`)], accessToken);
  } else if (arakawaResult.length === 0) {
    pushMessage.send(to, [messageTemplate.textMessage(`空いているコートはなかったよ・・・`)], accessToken);
  } else {
    pushMessage.send(to, [messageTemplate.textMessage(`${generateMessage(arakawaResult)}`)], accessToken);
  }
}

const generateMessage = (array) => {
  let result = "";
  array.forEach(el => {
    result = el.day + "\n";
    el.result.forEach(cort => {
      result = `  ${cort.cortName} \n`;
      cort.emptyTimes.forEach(time => {
        result = `    ${time} \n`;
      })
    })
  });
  return result;
}