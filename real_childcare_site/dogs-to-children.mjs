// Easily edit as an object, transform to this form:
// [['dog[^s]', 'human child'], ..] for easy replacement
const replacements = Object.entries({
  'dog[^s]': 'human child',
  dogs: 'human children',
  'leash[^es]': 'a really fun toy',
  park: 'fun playground for human games',
  bark: 'cry'
});

function translate(req, data, flags) {
  // Apply all the replacements one at a time
  const newBody = replacements
    .reduce((acc, kvPair) => {
      const regex = kvPair[0];
      const replacement = kvPair[1];

      return acc.replace(new RegExp(regex, 'ig'), replacement)
    }, data);

  // Add the chunk to the buffer. `js_body_filter`
  // will handle collecting and transferring them
  req.sendBuffer(newBody, flags);
}

function removeContentLengthHeader(req) {
  // Clear the `Content-Length` header to
  // cause nginx to used chunked transfer encoding
  delete req.headersOut['Content-Length'];
}

export default { translate, removeContentLengthHeader };