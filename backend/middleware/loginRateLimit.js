const failStore = new Map();

function getIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
}

exports.checkFail = (req, res, next) => {
  const ip = getIp(req);

  if (!failStore.has(ip)) failStore.set(ip, 0);

  req.failCount = failStore.get(ip);

  next();
};

exports.increaseFail = (req) => {
  const ip = getIp(req);
  failStore.set(ip, (failStore.get(ip) || 0) + 1);
};

exports.resetFail = (req) => {
  const ip = getIp(req);
  failStore.set(ip, 0);
};
