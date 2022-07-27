// This constant codifies the minimal wather condition for access
// to the precious poetry.
// See `weather_conditions.js` to understand the number
const PARTLY_CLOUDY = 1003;

/**
 * Location handler for the `/auth` endpoint used
 * by the `auth_request` directive from `ngx_http_auth_request_module`
 * @see {@link https://nginx.org/en/docs/http/ngx_http_auth_request_module.html|ngx_http_auth_request_module}
 * @param {Object}  r - The njs request object
 */
async function doAuth(r) {
  // These are the two pieces of outside information
  // that we need to make the request.
  // Incoming headers can be accessed via `r.headersIn`.
  // See https://nginx.org/en/docs/njs/reference.html#r_headers_in
  //
  // `process.env` gives us access to any environment variables
  // exported to the environment running nginx.
  // To get your own api key, sign up at https://www.weatherapi.com/signup.aspx
  const location = r.headersIn['User-Location'];
  const APIKey = process.env['WEATHER_API_KEY'];

  // Because the header content contains spaces and maybe
  // commas, we will escape the header value for inclusion in
  // the query string of the request to the weather api.
  // See https://nginx.org/en/docs/njs/reference.html#querystring_escape
  const qs = require('querystring');
  const encodedLocation = qs.escape(location);

  // The request is performed using `ngx.fetch`
  // See https://nginx.org/en/docs/njs/reference.html#ngx_fetch
  // The `resolver` directive in the `nginx.conf` file provides
  // the resolver for dns resolution.  This is an example
  // of a case where directives in the configuration provide
  // configuration to njs as well.
  const uri = `http://api.weatherapi.com/v1/current.json?key=${APIKey}&q=${encodedLocation}`;
  const resp = await ngx.fetch(uri);

  if (!resp.ok) {
    return r.return(401);
  }

  // https://nginx.org/en/docs/njs/reference.html#response_json
  const weather = await resp.json();

  // Here is a simplified version of the JSON response body.
  // We just care about the `code`.  As the `code` gets
  // larger, the weather is worse.  See all codes in
  // `weather_conditions.json` in this repo.
  // {
  //   current: {
  //     condition: {
  //       text: 'Partly Cloudy',
  //       code: 1003
  //     }
  //   }
  // }
  const conditionCode = weather.current.condition.code;

  // The `auth_request` directive which will receive this response
  // code will pass the request through if a `200` is returned, and reject it
  // if `401` is returned.
  if (conditionCode >= PARTLY_CLOUDY) {
    r.return(200);
  } else {
    r.return(401);
  }
}

// We export an object containing various keys.  The keys may be referenced in the
// `nginx.conf` using dot notation.  For example, this module exposes:
// `<this_module>.doAuth` where `<this_module>` is the name of the js file as
// included in the configuration using `js_import`
// See https://nginx.org/en/docs/http/ngx_http_js_module.html#js_import
//
// For njs, you **MUST** use `export default` although the exported item
// does not have to be an object necessarily. It is conventional, however,
// to export an object and define items as keys on the object.
export default { doAuth };