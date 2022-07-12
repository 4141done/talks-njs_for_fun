import QRCode from 'qrcode-svg'; // Note that for the bundler, import * as y can't be used
import helper from 'helper.mjs';
const qs = require('querystring');

const NGINX_GREEN = "#099639";
const WHITE = "#000000";
const QR_CODE_PADDING_PX = 4;
const QR_CODE_SIZE_PX = 256;

function generateQRCode(r) {
  // Pull in the parsed arguments ready for use with the
  // QR code generator
  const QRCodeContent = r.variables.qr_code_content;

  if (QRCodeContent) {
    const code = new QRCode({
      content: QRCodeContent,
      padding: QR_CODE_PADDING_PX,
      width: QR_CODE_SIZE_PX,
      height: QR_CODE_SIZE_PX,
      color: NGINX_GREEN,
      background: WHITE,
    }).svg();

    r.headersOut['Content-Type'] = 'image/svg+xml';
    r.return(200, code);
  } else {
    r.return(200, 'Invalid input.  ex: DOMAIN.com?content=yourtext');
  }
}

// NJS only supports `export default`.  Therefore anything you want to call
// from the NGINX context needs to be exported here in the object.
// It is also possible to just import a single function.
export default { generateQRCode, getQRCodeContent: helper.prepareContent };
