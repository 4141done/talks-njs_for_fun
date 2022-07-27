# Real Childcare Site

## Run the Project
### With Local nginx
From the **root directory of this repo** run:
1. Test the config with: `nginx -c $(pwd)/real_childcare_site/nginx.conf -t`
1. Load the config with `nginx -c $(pwd)/real_childcare_site/nginx.conf`

After making changes to the files, the configuration may be reloaded with:
`nginx -c $(pwd)/real_childcare_site/nginx.conf -s reload`

### Using Docker
These instructions assume that you have docker or a compatible container engine installed on your system. If you want to use docker, but don't have this set up, see the the [Docker Installation Guide](https://docs.docker.com/engine/install/).

From the **root directory of this repo** run:

1. Build the container image: `docker build -t njs_examples .`
1. Run the container
`docker run --name real_childcare_site -v $(pwd)/real_childcare_site:/project -p 4001:4001 -p 4002:4002 --rm njs_examples`

After making changes to the files, you can reload the configuration using the command:
`docker exec real_childcare_site nginx -s reload -c /project/nginx.conf`

Alternately, you can stop and restart the container.
