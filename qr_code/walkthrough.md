# Walkthrough

## Project structure and njs script inclusion basics
```bash
.
├── README.md
├── _build
│   ├── helper.js
│   └── qr-code.js
├── babel.config.json
├── helper.mjs
├── nginx.conf
├── package-lock.json
├── package.json
├── qr-code.mjs
└── rollup.mjs
```

| File/Folder         | Purpose                                                                                                                              |
|---------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `qr-code.mjs`       | The primary njs script responsible for generating the svg markup of the QR code                                                      |
| `nginx.conf`        | The main configuration for the nginx server                                                                                          |
| `rollup.mjs`        | Script to bundle and transpile files.                                                                                                |
| `babel.config.json` | Configuration for the babel library which controls transpilation of language features and addition of polyfills.                     |
| `package.json`      | Standard javascript manifest file containing dependencies and command definitions among other metadata.                              |
| `_build`        | Directory containing transpiled javascript.  These are the files loaded by nginx server                                                                                          |

### A note about transpilation
In this project, we use the `qrcode-svg` library which may use javascript language features not supported by njs.

In this case, we use the logic in the `rollup.mjs` (which is an implementation of the bundling using the `rollup.js` library) to transpile the `qrcode-svg` library and its dependencies and then bundle it with the main file.

Generally you want to avoid transpilation as much as possible. It makes debugging your code more difficult and also could create performance issues.  However it does open up a powerful ecosystem for you to use.  Just be aware of the tradeoffs and prefer not transpiling whenever possible.

The diry secret is that the `qr-code` library doesn't actually need to be transpiled since it's written using language features compatible with njs (as of the time of this writing).  For a fun experiment, try modifying the transpile script to only bundle and not transpile, then run benchmarks against the two methods.

## Setting things up
First in the `nginx.conf` we will add some basic configuration:
```nginx
load_module modules/ngx_http_js_module.so;

events {}

http {
  js_import qr_code from _build/qr-code.js;

  server {
    listen 4003;

    location / {
      js_content qr_code.generateQRCode;
    }
  }
}
```
If you're not familiar with the inclusion of njs scripts using `js_import`, read the `precious_poetry` `walkthrough.md`.

This config will just invoke and serve the result of the function `generateQRCode` when a request goes to `localhost:4003`.

Looking at the javascript file (`qr-code.mjs`):
```javascript
import QRCode from 'qrcode-svg';

const NGINX_GREEN = "#099639";
const WHITE = "#000000";
const QR_CODE_PADDING_PX = 4;
const QR_CODE_SIZE_PX = 256;

function generateQRCode(r) {

}

export default { generateQRCode };
```

Let's first set up importing the library and defining some helpful variables about the appearance of our QR Code

## Generating the QR Code
To actually generate the code, it's just a matter of hooking up the main function to our parameters in `qr-code.mjs`:
```javascript
function generateQRCode(r) {
  const code = new QRCode({
    content: 'testing',
    padding: QR_CODE_PADDING_PX,
    width: QR_CODE_SIZE_PX,
    height: QR_CODE_SIZE_PX,
    color: NGINX_GREEN,
    background: WHITE,
  }).svg();

  r.headersOut['Content-Type'] = 'image/svg+xml';
  r.return(200, code);
}
```

Here we are creating a QR code that has the output "testing".

Let's check it with `http://localhost:4003` in the browser.

## Taking user input
Next, we're going to do some parsing of query string parameters to get content for the qr code.  In `qr-code.mjs` in the main function:

```javascript
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
    content: QRCodeContent,
  // .. truncated
```

First we read in the querystring from the njs request object with `r.args`.  The content will be escaped for inclusion in the uri, so we just want to unescape it.  For that we'll pull in njs' implementation of the `querystring` module to unescape the input.

The rest is just handling if there was no content passed.

## Testing
You can test the output like so:
`http://localhost:4000/?content=Thanks%20for%20scanning%20this%20QR%20code,%20friend.`
Testing the script is best done in the browser.
