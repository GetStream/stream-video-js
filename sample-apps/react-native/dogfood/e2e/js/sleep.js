function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

sleep(2000);
