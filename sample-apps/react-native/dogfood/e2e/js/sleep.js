(function (sec) {
  var duration = sec * 1000;
  var now = new Date().getTime();
  while (new Date().getTime() < now + duration) {
    /* sleep */
  }
})(
  seconds !== undefined && seconds !== null && typeof seconds === 'number'
    ? seconds
    : 5,
);
