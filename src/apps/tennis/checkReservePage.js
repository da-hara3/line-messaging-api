import checkArakawaTennisCort from "./everyCort/checkArakawaTennisCort"

export default async function () {
  const arakawaResult = checkArakawaTennisCort();
  console.log(arakawaResult);
}