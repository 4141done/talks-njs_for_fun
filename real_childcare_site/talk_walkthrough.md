# Talk Code Pasterino

## Poetry
```nginx
    location / {
      js_content poetry.preciousWeatherPoetry;
    }
```

`nginx -c /Users/j.evans/talks/njs_for_fun/precious_poetry/nginx.conf`

`curl http://localhost:4000 | jq -r '.poems[0]'`


```nginx
      auth_request     /auth;
```

```nginx
    location /auth {
      internal;

      # DNS for external request
      resolver 1.1.1.1;
      js_content weather_auth.doAuth;
    }
```

```javascript
    r.return(200);
```
`nginx -c /Users/j.evans/talks/njs_for_fun/precious_poetry/nginx.conf -t`

`nginx -c /Users/j.evans/talks/njs_for_fun/precious_poetry/nginx.conf -s reload`

`curl http://localhost:4000/ | jq -r '.poems[0]'`

```javascript
    r.return(401);
```

`nginx -c /Users/j.evans/talks/njs_for_fun/precious_poetry/nginx.conf -t`

`nginx -c /Users/j.evans/talks/njs_for_fun/precious_poetry/nginx.conf -s reload`

`curl http://localhost:4000/`

```javascript
  const location = r.headersIn['User-Location'];
  const APIKey = process.env['WEATHER_API_KEY'];
```

```javascript
  const qs = require('querystring');
  const encodedLocation = qs.escape(location);

  const uri = `http://api.weatherapi.com/v1/current.json?key=${APIKey}&q=${encodedLocation}`;
  const resp = await ngx.fetch(uri);

  if (!resp.ok) {
    return r.return(401);
  }

  const weather = await resp.json();
```

```javascript
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
    r.return(200);
  } else {
    r.return(401);
  }
```

`nginx -c /Users/j.evans/talks/njs_for_fun/precious_poetry/nginx.conf -t`

`nginx -c /Users/j.evans/talks/njs_for_fun/precious_poetry/nginx.conf -s reload`

`curl -H 'User-Location: Seattle, WA' http://localhost:4000/ | jq -r '.poems[0]'`


`curl -H 'User-Location: Seattle, WA' http://localhost:4000/ | jq -r '.poems[0]'`

`nginx -c /Users/j.evans/talks/njs_for_fun/precious_poetry/nginx.conf -s quit`

## Dogs To Kids
```nginx
    location /listings/ {
      proxy_pass http://localhost:4001;
    }
```

`nginx -c /Users/j.evans/talks/njs_for_fun/real_childcare_site/nginx.conf -t`

`nginx -c /Users/j.evans/talks/njs_for_fun/real_childcare_site/nginx.conf`

`curl -H "Accept: application/json" http://localhost:4002/listings/1 | jq`

```nginx
      js_body_filter dogs_to_children.translate;
```
`nginx -c /Users/j.evans/talks/njs_for_fun/real_childcare_site/nginx.conf -t`

`nginx -c /Users/j.evans/talks/njs_for_fun/real_childcare_site/nginx.conf -s reload`

`curl -H "Accept: application/json" http://localhost:4002/listings/1 | jq`


```javascript
const replacements = Object.entries({
  'dog[^s]': 'human child',
  dogs: 'human children',
  'leash[^es]': 'a really fun toy',
  park: 'fun playground for human games',
  bark: 'cry'
});
```

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
`nginx -c /Users/j.evans/talks/njs_for_fun/real_childcare_site/nginx.conf -t`

`nginx -c /Users/j.evans/talks/njs_for_fun/real_childcare_site/nginx.conf -s reload`

`curl -H "Accept: application/json" http://localhost:4002/listings/1`

```nginx
js_header_filter dogs_to_children.removeContentLengthHeader;
```

```javascript
function removeContentLengthHeader(r) {
  delete r.headersOut['Content-Length'];
}

export default { translate, removeContentLengthHeader };
```

`nginx -c /Users/j.evans/talks/njs_for_fun/real_childcare_site/nginx.conf -t`

`nginx -c /Users/j.evans/talks/njs_for_fun/real_childcare_site/nginx.conf -s reload`

`curl -H "Accept: application/json" http://localhost:4002/listings/1 | jq`

`curl -H "Accept: application/json" http://localhost:4002/listings/2 | jq`


`nginx -c /Users/j.evans/talks/njs_for_fun/real_childcare_site/nginx.conf -s quit`

## QR Code

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
```nginx
      js_content qr_code.generateQRCode;
```


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

`node rollup.mjs`

`nginx -c /Users/j.evans/talks/njs_for_fun/qr_code/nginx.conf -t`
`nginx -c /Users/j.evans/talks/njs_for_fun/qr_code/nginx.conf`

`localhost:4003`

```javascript
const qs = require('querystring');

function generateQRCode(r) {
  let content;
  if (r.args.content) {
    content = qs.unescape(r.args.content);
  } else {
    return r.return(400, "'content' query param is required");
  }

  const code = new QRCode({
    content: content,
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
`node rollup.mjs`

`nginx -c /Users/j.evans/talks/njs_for_fun/qr_code/nginx.conf -t`

`nginx -c /Users/j.evans/talks/njs_for_fun/qr_code/nginx.conf -s reload`

`http://localhost:4003/?content=A proton walks into a bar. No one noticed it because protons are tiny and everywhere.`