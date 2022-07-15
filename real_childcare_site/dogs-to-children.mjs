function translate(r, chunk, flags) {
  r.sendBuffer(chunk, flags);
}

export default { translate };