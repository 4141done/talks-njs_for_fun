# Walkthrough

## Project structure and njs script inclusion basics
We start with a simple directory structure:
```bash
.
├── mock_server
│   └── precious-poetry.mjs
├── nginx.conf
└── weather-auth.mjs
```

Which contains a simple `nginx.conf` file that looks like this:
```nginx
load_module modules/ngx_http_js_module.so;

events {}

http {
  js_import weather_auth from weather-auth.mjs;
  js_import poetry from mock_server/precious-poetry.mjs;


  server {
    listen 4000;
  }
}
```
the `load_module` directive simple loads the module necessary to use njs which are a collection of `js_*` directives.

Below that, in the `http` context you'll see the first njs directive we'll introduce which is `js_import`. This directive simply takes a path to a javascript file and optionally allows you to provide an alias for the functions or data exported from that file.

For example, let's take a look at the file `weather-auth.mjs`.

```javascript
async function doAuth(req) {
  // Your content here
}

export default { doAuth };
```

We see that it exports an object with a key called `doAuth` which has a value of the function `doAuth`.  In javascript, functions are "first-class" and may be passed around like any other object.

Looking back at our `nginx.conf`, we can see that the `js_import` makse the object exported by `weather-auth.mjs` available as `weather_auth` for use later in the config file.

Likewise, we're `js_import`ing another file which is just some mock data.

## Adding a location
Next, we will add the endpoint to serve the Precious Poetry. To do this, we'll add a location block in the `server` context:
```nginx
    location / {
      js_content poetry.preciousWeatherPoetry;
    }
```

This will serve our Precious Poetry from the root.  So `curl http://localhost:4000` will display our Precious Poetry.
This snippet also introduces our second njs directive: `js_content`.  This directive simply returns a response based on a script. To understand how this works, let's move to the relevant portion of our mock data script, `./mock_server/precious-poetry.mjs`.

```javascript
function preciousWeatherPoetry(req){
  req.return(200, JSON.stringify(poems));
}

export default { preciousWeatherPoetry };
```

Here, the function `preciousWeatherPoetry` will be invoked by `js_content` and passed an njs request object.  You can see here that we are using the `return` function present on that object to specify a response code (200 for success) and the response body.

So we can test this by reloading the config and calling
`curl http://localhost:4000/ | jq -r '.poems[0]`

## Adding Security
Now that we are serving the Precious Poetry, we need to lock it down.  For this we will use the [ngx_http_auth_request_module](http://nginx.org/en/docs/http/ngx_http_auth_request_module.html) to streamline the creation of a subrequest to an authorization endpoint that we will also write in njs.

```nginx
    location / {
      auth_request     /auth;
      js_content poetry.preciousWeatherPoetry;
    }
```

This tells nginx to go query `/auth` and let the request continue if it gets a 200, or return a 401 if it gets a 401.

Now we need to implement the auth endpoint.

```nginx
    location /auth {
      internal;

      # DNS for external request
      resolver 1.1.1.1;
      js_content weather_auth.doAuth;
    }
```
This adds the necessary endpoint.  The `internal` directive just makes sure that any outside requests get a 404. We add the `resolver` directive to clue nginx in to where it should resolve the host since we will be contacting an external endpoint in our script. This is a good example of how nginx directives and njs interact in ways that would not be possible calling out to javascript.

The `js_content` below that is our main auth script. Let's look at that.

```javascript
async function doAuth(req) {
    req.return(200);
}

export default { doAuth };
```

This should look similar to our mock data script.  Remember that `auth_request` will let the request through if it gets back a 200.  Since we are using njs' `return` function with `200` as the response code, our endpoint should continue to serve Precious Poetry.

Reload the server and verify that this still works. `curl http://localhost:4000/ | jq -r '.poems[0]`

Now let's briefly change the response to be `req.return(401);`. `curl http://localhost:4000/`
Now we see a 401 page so we know the `auth_request` directive is interacting with our njs script as we expect.  Now all we need to do is add the logic to bar smug people in good weather.

## Checking the weather
Now we can implement our weather checking API call. First, you'll need to register and grab an API key by [signing up](https://www.weatherapi.com/signup.aspx).
Next, set your api key as an environment variable `export WEATHER_API_KEY=yourkeyhere`.

We first need to make sure we have the user's location as well as the API key. In `weather-auth.mjs` add:

```javascript
  const location = req.headersIn['User-Location'];
  const APIKey = process.env['WEATHER_API_KEY'];
```

njs puts the value of any environment variables in the `process.env` object. Likewise, we can access the values of headers by looking at the `headersIn` object on the njs request object.

Next we will add the code to call the weather API:
```javascript
  const qs = require('querystring');
  const encodedLocation = qs.escape(location);

  const uri = `http://api.weatherapi.com/v1/current.json?key=${APIKey}&q=${encodedLocation}`;
  const resp = await ngx.fetch(uri);

  if (!resp.ok) {
    return req.return(401);
  }

  const weather = await resp.json();
```

In the above code, we prepare the user's location for the query by encoding it to be included in the call as a query parameter.

Next, we assemble the uri, and perform the request.  There is also some basic error handling.

Finally, if the request is successful, we parse out the json response and make it available to our script as `weather`.

## Enforcing Bad weather
Finally, we will include some very simple logic to allow or deny the user based on the weather in their reported location.

For this, we'll need to understand one of the concepts of the particular weather API we are using.  In this API, each weather condition has a code starting at `1000` which represents "sunny" and
with higher numbers representing increasingly bad weather conditions.  You can view the full list in `./weather_conditions.json`.

So knowing this, I'll add some simple code:
```javascript
  // {
  //   current: {
  //     condition: {
  //       text: 'Partly Cloudy',
  //       code: 1003
  //     }
  //   }
  // }
  const PARTLY_CLOUDY = 1003;
  const conditionCode = weather.current.condition.code;

  if (conditionCode >= PARTLY_CLOUDY) {
    req.return(200);
  } else {
    req.return(401);
  }
```

All this does is find the weather code in the json response, then do a simple if-statement to either return `200` or `401` if the weather is partly cloudy or worse.

## Full Code
### `nginx.conf`
```nginx
load_module modules/ngx_http_js_module.so;

events {}

http {
  js_import weather_auth from weather-auth.mjs;
  js_import poetry from mock_server/precious-poetry.mjs;


  server {
    listen 4000;

    location / {
      auth_request     /auth;
      js_content poetry.preciousWeatherPoetry;
    }

    location /auth {
      internal;

      # DNS for external request
      resolver 1.1.1.1;
      js_content weather_auth.doAuth;
    }
  }
}
```

### `weather-auth.mjs`
```javascript
const PARTLY_CLOUDY = 1003;

async function doAuth(req) {
  const location = req.headersIn['User-Location'];
  const APIKey = process.env['WEATHER_API_KEY'];

  const qs = require('querystring');
  const encodedLocation = qs.escape(location);

  const uri = `http://api.weatherapi.com/v1/current.json?key=${APIKey}&q=${encodedLocation}`;
  const resp = await ngx.fetch(uri);

  if (!resp.ok) {
    return req.return(401);
  }

  const weather = await resp.json();

  // {
  //   current: {
  //     condition: {
  //       text: 'Partly Cloudy',
  //       code: 1003
  //     }
  //   }
  // }
  const conditionCode = weather.current.condition.code;

  if (conditionCode >= PARTLY_CLOUDY) {
    req.return(200);
  } else {
    req.return(401);
  }
}

export default { doAuth };
```

### `./mock_server/precious-poetry`
For this file, you can add the weather poems that come from your heart.
```javascript
function preciousWeatherPoetry(req) {
  req.headersOut['Content-Type'] = 'application/json';

  // Show up nicely when done like so: curl localhost:4002 | jq -r '.poems[0]'
  const poems = {
    poems: [
      `
      It's a rainy day
      In my head
      In my heart
      In my general vicinity

      The people I meet look at me with soggy eyes
      Let's make a hearty breakfast.
      `,

      `
      The local sandwich shop
      There are no windows and no doors
      The interior is pitch black

      Steve will make you a sandwich
      While the rain falls on to the bread

      Steve's Soggy Sandwich Sale
      Selected Sandwiches Served Slightly Soggy
      Savor
      Savor

      Thank you, Steve
      `,

      `
      A grey morning greets my eyes
      Awakened by the seagull's cry

      There's rain in my boots as I reach the bus stop
      Silly Socks Sopping Wet

      You and I acknowledge each other
      It's not great weather today, is it?

      No it is not.

      But we are here.

      Siblings Soggy Sockery
      `
    ]
  }

  req.return(200, JSON.stringify(poems));
}

export default { preciousWeatherPoetry };
```

And as a reminder, the file structure looks like this:
```bash
.
├── mock_server
│   └── precious-poetry.mjs
├── nginx.conf
└── weather-auth.mjs
```

## Testing it out
You can now try the whole request to see if you get let in.  Here are some premade test requests:
`curl -H 'User-Location: Seattle, WA' http://localhost:4000/`
`curl -H 'User-Location: Seoul, Korea' http://localhost:4000/`

