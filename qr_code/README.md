# NGINX QR Code Generator
Dynamically generate QR codes to impress your friends!

## Features
* Slick hard coded NGINX color scheme
* Encode anything you want in the QR code

## Run the Project
Before you start, you'll need to get an API key from [weatherapi.com](https://www.weatherapi.com/).  The key will be referenced in the rest of this readme as `YOUR_API_KEY`.

### With Local nginx
From the **root directory of this repo** run:
1. Export `YOUR_API_KEY`: `export WEATHER_API_KEY=YOUR_API_KEY` (for example, `export WEATHER_API_KEY=dfdsfsdfdsfs8fds8fsd8f`)
1. Test the config with: `nginx -c $(pwd)/precious_poetry/nginx.conf -t`
1. Load the config with `nginx -c $(pwd)/precious_poetry/nginx.conf`

After making changes to the files, the configuration may be reloaded with:
`nginx -c $(pwd)/precious_poetry/nginx.conf -s reload`

### Using Docker
These instructions assume that you have docker or a compatible container engine installed on your system. If you want to use docker, but don't have this set up, see the the [Docker Installation Guide](https://docs.docker.com/engine/install/).

From the **root directory of this repo** run:

1. Build the container image: `docker build -t njs_examples .`
1. Run the container
`docker run --name precious_poetry -v $(pwd)/precious_poetry:/project -p 4000:4000 -e WEATHER_API_KEY='YOUR_API_KEY' --rm njs_examples`

After making changes to the files, you can reload the configuration using the command:
`docker exec precious_poetry nginx -s reload -c /project/nginx.conf`

Alternately, you can stop and restart the container.

## Creating QR Codes
1. In your browser `http://localhost:4000?content=<your content here>`

> Note: In some browsers, you'll need to worry about escaping your text for the uri.
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

| File/Folder         | Purpose                                                                                                                              |
|---------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `qr-code.mjs`       | The primary njs script responsible for generating the svg markup of the QR code                                                      |
| `nginx.conf`        | The main configuration for the nginx server                                                                                          |
| `helper.mjs`        | Another njs script that provides some helper functions. This file is included mostly to illustrate code sharing between njs scripts. |
| `rollup.mjs`        | Script to bundle and transpile files.                                                                                                |
| `babel.config.json` | Configuration for the babel library which controls transpilation of language features and addition of polyfills.                     |
| `package.json`      | Standard javascript manifest file containing dependencies and command definitions among other metadata.                              |
|                     |                                                                                                                                      |

## Technical Details
### QR Code Generation
This project uses the [qrcode-svg](https://github.com/papnkukn/qrcode-svg) library to generate qr codes.  Responses are sent back to the server with the header `Content-Type: image/svg+xml` which causes the browser to render it correctly.

### `import`s
This project shows njs' capabilities in terms of sharing code.  Code must be exported using the following syntax `export default { myFunction };`. 

It is possible to export any data type, but in njs scripting an object is most common since it can be referenced in in the configuration easily. 

### Transpilation
This project transpiles the [qrcode-svg](https://github.com/papnkukn/qrcode-svg) source code as well as any of its dependent libraries.  This is done because njs has limited support for certain commonly used javascript constructs and most npm modules are written with node or browser runtimes in mind.

Note that your njs script are NOT transpiled for ease of debugging. While it is possible to transpile your njs script as well in order to use modern javascript constructs, it's not recommended.