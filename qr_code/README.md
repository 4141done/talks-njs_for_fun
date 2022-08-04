# NGINX QR Code Generator
Dynamically generate QR codes to impress your friends!

## Features
* Slick hard coded NGINX color scheme
* Encode anything you want in the QR code

## Run the Project
To run this example, you'll need a fairly recent version of nodejs. We recommend you use `asdf` ( you can find setup instructions here: https://github.com/asdf-vm/asdf) to install and manage versions of nodejs if you don't already have it installed.

The nodejs plugin for asdf can be found [here](https://github.com/asdf-vm/asdf-nodejs).  After the plugin is installed, just run `asdf install` from this directory and you'll have the same node version this project was developed with.

If you're using nvm, an `.nvmrc` file is also provided.  Install with `nvm install`.

### With Local nginx
From the `qr_code` directory:
1. Run `npm install` to download dependencies
1. Run `npm run transpile` to transpile javascript
1. Test the config with: `nginx -c $(pwd)/nginx.conf -t`
1. Load the config with `nginx -c $(pwd)/nginx.conf`

After making changes to the javascript files you'll need to run `npm run transpile`.
The configuration may be reloaded with: `nginx -c $(pwd)/nginx.conf -s reload`

### Using Docker
These instructions assume that you have docker or a compatible container engine installed on your system. If you want to use docker, but don't have this set up, see the the [Docker Installation Guide](https://docs.docker.com/engine/install/).

For the docker-based workflow you'll still transpile javascript on your local machine.

From the **root directory of this repo** run:

1. Build the container image: `docker build -t njs_examples .`

From the `qr_code` directory:

1. Run `npm install` to download dependencies
1. Run `npm run transpile` to transpile javascript
1. Run the container
`docker run --name qr_code -v $(pwd):/project -p 4003:4003 --rm njs_examples`

After making changes to the javascript files you'll need to run `npm run transpile`.
You can reload the configuration using the command:
`docker exec qr_code nginx -s reload -c /project/nginx.conf`

Alternately, you can stop and restart the container but you'll still need to run the transpile script before this if you changed any javascript files.

### After you get it running
1. In your browser `http://localhost:4003?content=<your content here>`

> Note: In some browsers, you'll need to worry about escaping your text for the uri.
> If yours does not, open a node console and run `encodeURIComponent('my string')`
> and paste the result into the uri above.

Example:
In browser: `http://localhost:4000/?content=Thanks%20for%20scanning%20this%20QR%20code,%20friend.`
![screenshot of qr code](/screenshot.png)


### Learning and modifying
To learn how the project works, you can reference [the walkthrough](walkthrough.md) for step-by-step code examples, or reference the code annotations.

In this project, you can also play with the transpilation script.  The `qrcode-svg` library doesn't actually need to be transpiled (it's one of the few npm libraries for which this is true).  You can try to modify the transpile script not to transpile but only bundle. Maybe try running some benchmarks against the nginx server running transpiled code vs non transpiled code.

### Files and their roles
## Project Structure

| File/Folder         | Purpose                                                                                                                              |
|---------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `qr-code.mjs`       | The primary njs script responsible for generating the svg markup of the QR code                                                      |
| `nginx.conf`        | The main configuration for the nginx server                                                                                          |
| `rollup.mjs`        | Script to bundle and transpile files. It uses [rollup.js](https://rollupjs.org/)                                                                                                |
| `babel.config.json` | Configuration for the babel library which controls transpilation of language features and addition of polyfills.                     |
| `package.json`      | Standard javascript manifest file containing dependencies and command definitions among other metadata.                              |
|                     |                                                                                                                                      |

## Technical Details
## The `_build` directory
The `qr-code.mjs` file is put through the transpilation/bundling process and then a new file
with the transformations applied is created at `_build/qr-code.js`.  That file is actually the
file loaded by the nginx configuration.  Thus, if you make changes to `qr-code.mjs` you'll need
to be sure to run `npm run transpile` otherwise nginx won't be aware of your changes.

### QR Code Generation
This project uses the [qrcode-svg](https://github.com/papnkukn/qrcode-svg) library to generate qr codes.  Responses are sent back to the server with the header `Content-Type: image/svg+xml` which causes the browser to render it correctly.

### `import`s
njs doesn't currently know how to resolved dependendencies in `node_modules` so we use `rollup.js` not only to transpile the code, but also to bundle it in to one file. That way you just have to give njs the bundled file and know that it contains all the javascript code you need. For local files, you can `import` them but cannot use named imports.

### Transpilation
This project transpiles the [qrcode-svg](https://github.com/papnkukn/qrcode-svg) source code as well as any of its dependent libraries.  This is done because njs has limited support for certain commonly used javascript constructs and most npm modules are written with node or browser runtimes in mind.

Note that your njs script are NOT transpiled for ease of debugging. While it is possible to transpile your njs script as well in order to use modern javascript constructs, it's not recommended.