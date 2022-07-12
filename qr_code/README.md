# NGINX QR Code Generator
Dynamically generate QR codes to impress your friends!

## Features
* Slick hard coded NGINX color scheme
* Encode anything you want in the QR code

## Usage
1. Run it: `nginx -c <this_dir>/nginx.conf`
1. In your browser `http://localhost:4000?content=<your content here>`

> Note: In some browsers, you'd need to worry about escaping your text for the uri.
> If yours does not, open a node console and run `encodeURIComponent('my string')`
> and paste the result into the uri above.

Example:
In browser: `http://localhost:4000/?content=Thanks%20for%20scanning%20this%20QR%20code,%20friend.`
![screenshot of qr code](/screenshot.png)

## Project Structure
Any files that you would need to change are in the `./src` folder.
This includes the njs scripts as well as the `nginx.conf`

```bash
.
├── README.md
├── _build # transpiled njs scripts go here
├── assets # Files for this readme
├── babel.config.json # configures what is transpiled and how
├── package-lock.json
├── package.json
├── rollup.mjs # Performs the transpilation
└── src # Scripts and NGINX conf
    ├── nginx.conf
    ├── qr-code.mjs
    └── test-import.mjs
```

## Technical Details
### QR Code Generation
This project uses the [qrcode-svg](https://github.com/papnkukn/qrcode-svg) library to generate qr codes.  Responses are sent back to the server with the header `Content-Type: image/svg+xml` which causes the browser to render it correctly.

### `import`s
This project shows njs' capabilities in terms of sharing code.  Code must be exported using the following syntax `export default { myFunction };`. 

It is possible to export any data type, but in njs scripting an object is most common since it can be referenced in in the configuration easily. 

### Transpilation
This project transpiles the [qrcode-svg](https://github.com/papnkukn/qrcode-svg) source code as well as any of its dependent libraries.  This is done because njs has limited support for certain commonly used javascript constructs and most npm modules are written with node or browser runtimes in mind.

Note that your njs script are NOT transpiled for ease of debugging. While it is possible to transpile your njs script as well in order to use modern javascript constructs, it's not recommended.