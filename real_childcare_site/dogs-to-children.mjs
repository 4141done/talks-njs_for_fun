function translate(req, data, flags) {
  req.sendBuffer(data, flags);
}

export default { translate };