# Precious Poetry

## Run the Project
Before you start, you'll need to get an API key from [weatherapi.com](https://www.weatherapi.com/).  The key will be referenced in the rest of this readme as `YOUR_API_KEY`.

### With Local nginx
Before starting, make sure you have the `http_auth_request_module` available.

You can check this by running `nginx -V` and looking for the following flag: `--with-http_auth_request_module`.

If it is not present, you'll either need to recompile your local nginx with this module or use the docker instructions below.

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

### After you get it running
Because precious poetry comes from our hearts, responses are served from `/`.  Additionally, because 4000 is the number of individual raindrops I counted during the darkest months the winter, the web server is listening on port `4000`.

In order to view the precious poetry, make sure you specify a currently cloudy or rainy location and issue a request like the following:

`curl -H 'User-Location: Bhopal, India' http://localhost:4000/`

You can put any reasonable place name in the location header.

If you have `jq` installed you can format the beautify poetry nicely by picking individual poems out:

`curl -H 'User-Location: Bhopal, India' http://localhost:4000/ | jq -r '.poems[0]'`

### Learning and modifying
To learn how the project works, you can reference [the walkthrough](walkthrough.md) for step-by-step code examples, or reference the code annotations.

### Files and their roles
| File/Folder                       | Purpose                                                                                                  |
|-----------------------------------|----------------------------------------------------------------------------------------------------------|
| `weather-auth.mjs`                | The primary njs script responsible for handling the auth request generated by `auth_request`             |
| `nginx.conf`                      | The primary nginx configuration file.                                                                    |
| `mock_server/precious-poetry.mjs` | The njs script that serves as the location handler for the main endpoint.  It contains priceless poetry. |

You can experiment with the authorization logic by making changes to the `weather-auth.mjs` file.  The general handling of the request can be changed in `nginx.conf`.  If you feel something in your heart, you can change or add poetry to `mock_server/precious-poetry.mjs`.