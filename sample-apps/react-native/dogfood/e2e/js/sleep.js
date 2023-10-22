function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

sleep(seconds * 1000);
