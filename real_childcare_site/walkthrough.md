# Walkthrough

## Project structure and njs script inclusion basics
```bash
.
├── dogs-to-children.mjs
├── mock_server
│   ├── doggy-daycare.mjs
│   └── doggy_daycare.conf
└── nginx.conf
```
| File                               | Purpose                                                                               |
|------------------------------------|---------------------------------------------------------------------------------------|
| `nginx.conf`                       | The main configuration file                                                           |
| `dogs-to-children.mjs`             | The main njs script file                                                              |
| `./mock_server/doggy-daycare.mjs`  | Njs script serving mock data for demo. Not necessary to modify.                       |
| `./mock_server/doggy_daycare.conf` | NGINX server hooking njs script to serve mock data for demo.  No necessary to modify. |

The `nginx.conf` file defines a simple server and imports the njs script.  Functions exported by the script `dogs-to-children.mjs`
will be accessible via the alias `dogs_to_children`.

```nginx
load_module modules/ngx_http_js_module.so;

events {}

http {
  # MOCK SERVER
  js_import listings from mock_server/doggy-daycare.mjs;
  include mock_server/doggy_daycare.conf;

  # Our script
  js_import dogs_to_children from dogs-to-children.mjs;

  server {
    listen 4002;
  }
}
```

## Testing the old server
First let's set up a reverse proxy to our old server.  It's serving on port 4001.

```nginx
    location /listings/ {
      proxy_pass http://localhost:4001;
    }
```

Next let's test it out:
`curl -H "Accept: application/json" http://localhost:4002/listings/1 | jq`

Here we should see some listings for dogsitters.

## Modifying the output
Let's add a new njs directive, `js_body_filter` right above `proxy_pass`:

```nginx
      js_body_filter dogs_to_children.translate;
```

This tells us that we'll filter the body returned by the upstream using the function `translate` in the file `dogs-to-children.mjs`.

Let's open that file:

```javascript
function translate(r, data, flags) {
  r.sendBuffer(data, flags);
}

export default { translate };
```

Here we can see the function defined.  This time when `js_body_filter` invokes the function we get two more arguments passed in.

| Argument | Purpose                                                                                                                                                                      |
|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `data`   | A chunk of the response from the upstream                                                                                                                                    |
| `flags`  | An object with information about the current chunk.  Currenty in just contains the key `last` which has a boolean indicating if the chunk is the final chunk in the response |

First we just want to test that this function can handle the response from the upstream without modifying it.  The above code does this.  When we are done processing a chunk we pass it to the njs method `sendBuffer` which will take care of passing along the chunk for us.

The test: `curl -H "Accept: application/json" http://localhost:4002/listings/1 | jq`

Now we can change the output.  We'll use a naive strategy of calling `.replace` on chunks.

Add the following to `dogs-to-children.mjs`
```javascript
const replacements = Object.entries({
  'dog[^s]': 'human child',
  dogs: 'human children',
  'leash[^es]': 'a really fun toy',
  park: 'fun playground for human games',
  bark: 'cry'
});
```

This code simply defines an object with keys that are regex compatible expressions, and the values the desired replacements.  It then uses `Object.entries()` to make them easier to work with.  The final form of the data is `[['dog[^s]', 'human child'], ..]`.

Next, we'll add some code to perform the substitution and complete the `translate` function:
```javascript
function translate(r, data, flags) {
  const newBody = replacements
    .reduce((acc, kvPair) => {
      const regex = kvPair[0];
      const replacement = kvPair[1];

      return acc.replace(new RegExp(regex, 'ig'), replacement)
    }, data);

  // Add the chunk to the buffer. `js_body_filter`
  // will handle collecting and transferring them
  r.sendBuffer(newBody, flags);
}
```

The details of this code are not especially important, just that we are applying the substituions in a loop and then returning the transformed string to `sendBuffer` to be returned to the client.

## Testing it out
You can use the same test request to test your results:
`curl -H "Accept: application/json" http://localhost:4002/listings/1 | jq`

But we have a problem!  The responses are being cut off!

## Adjusting the `Content-Length`
The responses are being cut off because the length of the response no longer matches the `Content-Length` header provided by the upstream because we replaced words with phrases and made the responses longer.

In this case, we'll reach for another njs directive, `js_header_filter` which allows us to modify the outgoing headers using an njs script.

To do this, let's add the code in `nginx.conf` in the `location` context.
```nginx
js_header_filter dogs_to_children.removeContentLengthHeader;
```

Next, well create the function `removeContentLengthHeader` in `dogs-to-children.mjs`.
```javascript
function removeContentLengthHeader(r) {
  delete r.headersOut['Content-Length'];
}

// Notice that we added the function name to the exports
export default { translate, removeContentLengthHeader };
```

All we need to do is remove the `Content-Length` header and NGINX will use chunked transfer encoding. Now we should have no partial responses.

## Final tests
`curl -H "Accept: application/json" http://localhost:4002/listings/1 | jq`

## Full Code
```javascript
// Easily edit as an object, transform to this form:
// [['dog[^s]', 'human child'], ..] for easy replacement
const replacements = Object.entries({
  'dog[^s]': 'human child',
  dogs: 'human children',
  'leash[^es]': 'a really fun toy',
  park: 'fun playground for human games',
  bark: 'cry'
});

function translate(r, data, flags) {
  // Apply all the replacements one at a time
  const newBody = replacements
    .reduce((acc, kvPair) => {
      const regex = kvPair[0];
      const replacement = kvPair[1];

      return acc.replace(new RegExp(regex, 'ig'), replacement)
    }, data);

  // Add the chunk to the buffer. `js_body_filter`
  // will handle collecting and transferring them
  r.sendBuffer(newBody, flags);
}

function removeContentLengthHeader(r) {
  // Clear the `Content-Length` header to
  // cause nginx to used chunked transfer encoding
  delete r.headersOut['Content-Length'];
}

export default { translate, removeContentLengthHeader };
```

`nginx.conf`
```nginx
# load the njs module to allow us to use js_* directives
load_module modules/ngx_http_js_module.so;

events {}

http {
  # Old AirBnb for Dogs webapp I forgot how to maintain
  js_import listings from mock_server/doggy-daycare.mjs;
  include mock_server/doggy_daycare.conf;

  # import the javascript module `dogs-to-children.mjs`
  # aliased as `dogs_to_children`
  js_import dogs_to_children from dogs-to-children.mjs;

  server {
    listen 4002;

    location /listings/ {
      # Applies the js function `translate` to the outbound body
      js_body_filter dogs_to_children.translate;

      # Applies the js function removeContentLengthHeader to
      # modify outbound headers
      js_header_filter dogs_to_children.removeContentLengthHeader;
      proxy_pass http://localhost:4001;
    }
  }
}
```
