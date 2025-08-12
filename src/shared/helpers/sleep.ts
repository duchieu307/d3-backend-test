export const sleep = (timeout) =>
  new Promise((resolve, _reject) => {
    setTimeout(() => {
      resolve(1);
    }, timeout);
  });
