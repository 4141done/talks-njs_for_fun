# Real Childcare Site
This example represents an attempt to bamboozle a potential investor into investing in my on-demand childcare site.  The problem is that I didn't actually build an on-demand childcare site. I have a site that I built a long time ago that does on-demand dogsitting.  They can't be that different, so I'm leveraging njs and nginx to translate away any suspicious references to dogs from the backend responses.

If you explore this project, you'll learn about:
* njs directives `js_body_filter` and `js_header_filter`
* Modifying outgoing headers with `headersOut`
* Chunked transfer encoding

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

### After you get it running
This site is full of listings (well, actually just two) so everything is served from `/listings` and the server is listening on port `4002` because that's how much cheese, cheddar, green, money, cash we're going to make from this idea.

Here are the two requests available:

`curl -H "Accept: application/json" http://localhost:4002/listings/1`

`curl -H "Accept: application/json" http://localhost:4002/listings/2`

If you have [`jq`](https://stedolan.github.io/jq/) installed you can pipe the response to `jq` to get some nicer output:
`curl -H "Accept: application/json" http://localhost:4002/listings/2 | jq`

### Learning and modifying
To learn how the project works, you can reference [the walkthrough](walkthrough.md) for step-by-step code examples, or reference the code annotations.

### Files and their roles
| File/Folder                     | Purpose                                                                                                                                                                                        |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `dogs-to-children.mjs`          | The primary njs script that provides handlers for `js_body_filter` and `js_body_filter`                                                                                                        |
| `nginx.conf`                    | The primary nginx configuration file.                                                                                                                                                          |
| `mock_server/doggy-daycare.mjs` | The njs script that serves as the location handler for the main endpoint of the upstream.                                                                                                      |
| `mock_server/doggy_daycare.mjs` | The nginx configuration for the upstream server.                                                                                                                                               |
| `mock_server/util.mjs`          | A utility file that contains some experimental path parameter parsing code. This is not critical to the example but is an interesting example of javascript's integration with njs directives. |

You can experiment by changing the replacement phrases in `dogs-to-children.mjs`  and the listings in `mock_server/doggy_daycare.mjs`.

#### Parsing path parameters
This example contains an experimental pattern for parsing out path parameters from uris supplied to the location.

The intent is to provide a familiar way to express path parameters declaritively in the nginx configuration, then use njs to perform parsing.

> Note that since njs is not garbage collected within a single request so this does add some memory footprint up front. The example is not optimized and as such could cause issues with scaling or provide a surface for memory-based attacks.  Thus it should be noted that **especially** this part of the example should not be considered production ready.

It works like this:

1. First, in your `location` context, define a variable called `$path_pattern` that defines named path parameters:
    `set $path_pattern /users/:user_id/contact_methods/:contact_method_id;`
1. Second, in your `http` block, declare the two variables you expect to be extracted:
    ```
    js_var $user_id;
    js_var $contact_method_id;
    ```
1. Next, in the `http` context import the `util.mjs` script and use it with `js_set`.
    ```
      js_import util from mock_server/util.mjs;
      js_set $path_params util.parsePathParams;
    ``` 
    This is a little tricky, but `js_set` is often used to trigger side effects.  It uses a script to handle the population of a variable.  However, that script is not invoked until the variable in question is referenced either in the configuration or another njs script.  Because of this behavior, it is often used to lazily trigger side effects in a way that works with the nginx lifecycle.

1. Finally, in your script where you need access to the path params, just reference `r.variables.path_params`.  After that, you can gain access to `r.variables.user_id` and `r.variables.contact_method_id` in any njs context.