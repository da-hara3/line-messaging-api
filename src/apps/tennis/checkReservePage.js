let checkArakawaTennisCort = require("./everyCort/checkArakawaTennisCort");
let push = require("./everyCort/checkArakawaTennisCort");

const BASE_DIR = "../../"
let pushMessage = require(BASE_DIR + 'line/api/pushMessage.js');
let messageTemplate = require(BASE_DIR + 'line/api/messageTemplate.js');

module.exports = async function (to, accessToken) {
  const arakawaResult = await checkArakawaTennisCort();

  if (!arakawaResult) {
    return pushMessage.send(to, [messageTemplate.textMessage(`エラーが起きたっぽい`)], accessToken);

  }

  const isEmpty = arakawaResult.filter(el => el.result.length > 0).length === 0;
  if (isEmpty) {
    pushMessage.send(to, [messageTemplate.textMessage(`空いているコートはなかったよ・・・`)], accessToken);
  } else {
    pushMessage.send(to, [messageTemplate.textMessage(`${generateMessage(arakawaResult)}`)], accessToken);
  }
}

const generateMessage = (array) => {
  let result = "";
  array.filter(el => el.result.length > 0)
    .forEach(el => {
    result += el.day + "\n";
    el.result.forEach(cort => {
      result += `  ${cort.cortName} \n`;
      cort.emptyTimes.forEach(time => {
        result += `    ${time} \n`;
      })
    })
  });
  return result;
}