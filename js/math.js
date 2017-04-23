function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function clamp(value, min, max) {
  return Math.max(Math.min(value, max), min);
}
