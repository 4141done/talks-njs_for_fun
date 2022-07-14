// This is the library from npm
import QRCode from 'qrcode-svg';

// Variables to style the QR Code
const NGINX_GREEN = "#099639";
const WHITE = "#000000";
const QR_CODE_PADDING_PX = 4;
const QR_CODE_SIZE_PX = 256;

function generateQRCode(r) {

}

// NJS only supports `export default`.  Therefore anything you want to call
// from the NGINX context needs to be exported here in the object.
// It is also possible to just import a single function.
export default { generateQRCode };
