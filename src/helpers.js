function cloneDeep(object) {
  return JSON.parse(JSON.stringify(object));
}

function getDayString(date) {
  const dayStrings = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayStrings[date.getDay()];
}

function getDateString(date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

module.exports = {
  cloneDeep,
  getDayString,
  getDateString
};
