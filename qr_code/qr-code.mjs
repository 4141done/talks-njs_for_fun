/**
 * Contains the handlers to be invoked by the
 * `js_content` directive for serving an svg QR code.
 * @module qr-code
 */

// This is qr code generation library from npm
import QRCode from 'qrcode-svg';

// Variables to style the qr code
const NGINX_GREEN = "#099639";
const WHITE = "#000000";
const QR_CODE_PADDING_PX = 4;
const QR_CODE_SIZE_PX = 256;

// In this case, querystring is provided by njs
// see: https://nginx.org/en/docs/njs/reference.html#querystring
const qs = require('querystring');

/**
 * Reads query string parameters from the client
 * and generates a qr code as svg markup as the response
 * body while setting the correct MIME type.
 * 
 * It expects query string param called "content",
 * If this parameter is not provided, a 400 status
 * code will be returned
 * 
 * njs invocation: `js_content`
 * @param {Object}  r - The njs request object
 */
function generateQRCode(r) {
  let content;

  // Since the `content` query param comes percent encoded
  // we are making sure that the content is decoded before
  // proceeding.  Ex: 'hello%20world' -> 'hello world'
  if (r.args.content) {
    content = qs.unescape(r.args.content);
  } else {
    return r.return(400, "'content' query param is required");
  }

  // This code simply follows the library usage
  // instructions which can be found at
  // https://github.com/papnkukn/qrcode-svg#readme
  const code = new QRCode({
    content: content,
    padding: QR_CODE_PADDING_PX,
    width: QR_CODE_SIZE_PX,
    height: QR_CODE_SIZE_PX,
    color: NGINX_GREEN,
    background: WHITE,
  }).svg();

  // Setting the `Content-Type` header helps the browser
  // render the svg qr code correctly.
  r.headersOut['Content-Type'] = 'image/svg+xml';
  r.return(200, code);
}

// We export an object containing various keys.  The keys may be referenced in the
// `nginx.conf` using dot notation.  For example, this module exposes:
// `<this_module>.generateQRCode` where `<this_module>` is the name of the js file as
// included in the configuration using `js_import`
// See https://nginx.org/en/docs/http/ngx_http_js_module.html#js_import
//
// For njs, you **MUST** use `export default` although the exported item
// does not have to be an object necessarily. It is conventional, however,
// to export an object and define items as keys on the object.
export default { generateQRCode };
