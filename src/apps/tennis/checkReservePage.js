let checkArakawaTennisCort = require("./everyCort/checkArakawaTennisCort");

module.exports = async function () {
  const arakawaResult = checkArakawaTennisCort();
  console.log(arakawaResult);
}