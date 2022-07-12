const qs = require('querystring');

function prepareContent(req) {
  const rawContent = req.args.content;
  return parseContent(rawContent);
}

function parseContent(rawContent) {
  if (rawContent) {
    return qs.unescape(rawContent);
  } else {
    return null;
  }
}
export default { prepareContent };