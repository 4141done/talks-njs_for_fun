# Scripting NGINX with njs for Fun and (No) Profit: Code Examples
This repository contains code examples from a talk originally given at NGINX Sprint 2.0.

## Goals
To provide a small amount of levity while showing the flexibility of having the ability
to script nginx with javascript via [njs](https://nginx.org/en/docs/njs/)

## Differences from the talk
The code examples are more heavily annotated than those presented in the talk.
They may also differ slightly as the code examples in the talk were optimised for
quick presentation.  The code examples in this repository should be considered a better example.

However, **nothing in this repository should be considered production ready.**

## Reporting bugs and asking questions
If you find a bug or an area where the example code could be improved, please file
an issue on github or contribute a pull request.  If it's a big change, consider starting with a bug.

If you find any of the explanations or code examples unclear or just need help, feel free to file an issue.  Alternately, you can find me on the [nginx community Slack](https://community.nginx.org/joinslack).

## Running the projects
The repository provides two ways to run the projects

### With local `nginx`
Each project may be run with the `nginx -c /path/to/project/nginx.conf`.  Details and additional commands may be found
in the `README.md` in each project folder.

### In Docker
A `Dockerfile` is provided that contains a standard install of nginx. To run a project using the `Dockerfile`,
take a look at the `README.md` file in that project's folder for specific commands and notes.

## Projects
This repository consists of three projects all of which illustrate difference usage of njs.

### Precious Poetry
Gate access to some beatiful poetry by using njs to call a public weather API and deny users
in sunny areas.

See the [README](precious_poetry/README.md) for more details on running the project

#### Concepts
* njs directives `js_import` and `js_content`
* nginx core directives `internal` and `resolver`
* The [`ngx_http_auth_request_module`](http://nginx.org/en/docs/http/ngx_http_auth_request_module.html)
* HTTP calls performed via [`fetch`](https://nginx.org/en/docs/njs/reference.html#ngx_fetch) in njs
* Parsing incoming headers with `headersIn`


### Real Childcare for Real Human Children
Modify responses from a fake dogsitting app to convince people that it's an app for finding quick childcare.

See the [README](read_childcare_site/README.md) for more details on running the project

#### Concepts
* njs directives `js_body_filter` and `js_header_filter`
* Modifying outgoing headers with `headersOut`
* Chunked transfer encoding

### QR Code Generator
Use nginx as a webserver that generates qr codes for arbitrary text.  We recommend that it is used mainly for jokes.

See the [README](qr_code/README.md) for more details on running the project

#### Concepts
* Using npm packages
* Bundling and transpiling javascript using [rollup.js](https://rollupjs.org/)
* Modifying outgoing headers with `headersOut`
