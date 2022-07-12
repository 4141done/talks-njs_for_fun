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
| `helper.mjs`        | Another njs script that provides some helper functions. This file is included mostly to illustrate code sharing between njs scripts. |
| `rollup.mjs`        | Script to bundle and transpile files.                                                                                                |
| `babel.config.json` | Configuration for the babel library which controls transpilation of language features and addition of polyfills.                     |
| `package.json`      | Standard javascript manifest file containing dependencies and command definitions among other metadata.                              |
|                     |                                                                                                                                      |
### A note about transpilation
In this project, we use the `qrcode-svg` library which may use javascript language features not supported by njs.
In this case, we use the logic in the `rollup.mjs` (which is an implementation of the bundling using the `rollup.js` library) to transpile the `qrcode-svg` library and its dependencies and then bundle it with the main file.

Generally you want to avoid transpilation as much as possible. It makes debugging your code more difficult and also could create performance issues.  However it does open up a powerful ecosystem for you to use.  Just be aware of the tradeoffs and prefer not transpiling whenever possible.

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

Looking at the javascript file:
```javascript
import QRCode from 'qrcode-svg';

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
```

Let's first set up importing the library and defining some helpful variables about the appearance of our QR Code

## Generating the QR Code
To actually generate the code, it's just a matter of hooking up the main function to our parameters:
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
We're going to take a bit of a detour here in order to show taking user input in an interesting way and introduce another njs concept.

We have another file called `helper.mjs` that looks like this:
```javascript
function prepareContent(req) {
}
export default { prepareContent };
```

Let's make it export a function that reads the query param `content`:

```javascript
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
```

First we read in the querystring from the njs request object with `req.args`.  The content will be escaped for inclusion in the uri, so we just want to unescape it.  For that we'll pull in njs' implementation of the `querystring` module to unescape the input.

The rest is just handling if there was no content passed.

Next, we'll use our final new njs directive, `js_set`.  `js_set` allows you to set an nginx variable using an njs script.  In this case, we'll use it to make sure that any input we're reading in our main script has been parsed.

Just like you might in a more traditional web framework, it's good to separate your interface from your primary logic and we're using `js_set` to do a bit of that here.

In the `nginx.conf` file, let's add the new directive in the `http` context.
```nginx
  js_set $qr_code_content qr_code.getQRCodeContent;
```
The script will be invoked the first time the variable `$qr_code_content` is referenced.

Finally, we'll modify our main script to read the content from that variable.

```javascript
import QRCode from 'qrcode-svg';
import helper from 'helper.mjs';

// ... code truncated

function generateQRCode(r) {
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
```

In order, we first import the `helper.mjs` script in the top of the file.

Second, we pull the value of the variable by looking in `r.variables`.  Any NGINX variables are made available to njs scripts via that object.

Third, we add an `if` statement around our qr code generation to handle the case when there is no content provided.

Lastly, we export the function from the helper script as part of this script's interface.

## Testing
You can test the output like so:
`http://localhost:4000/?content=Thanks%20for%20scanning%20this%20QR%20code,%20friend.`
Testing the script is best done in the browser.
