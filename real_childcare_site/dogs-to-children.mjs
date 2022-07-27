// Create a mapping of regex expressions to
// values in an object for easy editing.
// the object is reduced to an array of arrays
// for easy consumption by the `translate` function.
// The final form is `[['dog[^s]', 'human child '], ...]`
const replacements = Object.entries({
  'dog[^s]': 'human child ',
  dogs: 'human children ',
  'leash[^es]': 'a really fun toy ',
  park: 'fun playground for human games ',
  bark: 'cry '
});

/**
 * Processes the body from the upstream chunk by chunk and
 * applies substitutions before passing them back to the client.
 * Note that this implementation is naive and replacement targets
 * that span chunk boundaries won't be removed.
 * 
 * njs invocation: `js_body_filter`
 * @param {Object}  r - The njs request object
 * @param {string}  chunk - A piece of the response from the upstream
 * @param {Object}  flags - A object containing the key `last` with a boolean value denoting whether
 *                          the chunk is the last in the response
 */
function translate(r, chunk, flags) {
  // Here we reduce over the replacements doing each substitution
  // in order and passing the modified body as the accumulator.
  const newBody = replacements
    .reduce((acc, kvPair) => {
      const regex = kvPair[0];
      const replacement = kvPair[1];

      return acc.replace(new RegExp(regex, 'ig'), replacement)
    }, chunk);

  // Add the chunk to the buffer. `js_body_filter`
  // will handle collecting and transferring them
  r.sendBuffer(newBody, flags);
}

/**
 * Deletes the `Content-Length` header from the response.  
 * If this is done, nginx will provide the
 * `Transfer-Encoding: chunked` header.
 * 
 * njs invocation: `js_header_filter`
 * @param {Object}  r - The njs request object
 */
function removeContentLengthHeader(r) {
  delete r.headersOut['Content-Length'];
}

export default { translate, removeContentLengthHeader };