/**
 * Parses path parameters into the `r.variables` object.
 * It depends on some outside elements being declared
 * in the nginx configuration:
 * 1. In the `http` context any named path parameter
 *    should be defined using `js_var`.  Ex: `js_var $name;`
 * 2. In the `location` context, a variable must
 *    be declared with the pattern `set $path_pattern /foo/:name/bar;`
 * 
 * When a request like `/foo/eugenio/bar` is received,
 * it will set the variable `$name` to "eugenio"
 */
function parsePathParams(r) {
  // Currently we naively depend on an exact match in the
  // pattern and the location
  let pattern = r.variables.path_pattern.split("/");
  let uri = r.uri.split("/");

  if (pattern.length === uri.length) {
    const params = doParsePathParams(pattern, uri);
    r.variables = Object.assign({}, r.variables, params);

    // Returning this here is not strictly necessary since we
    // are directly injecting the parsed params into the `r.variables`
    // object but 
    return JSON.stringify(params);
  } else {
    throw new Error(
      ```
        Declared path parameter pattern ${r.variables.path_pattern}
        does not match received pattern ${r.uri}
      ```
    );
  }
}

const namedParamRegex = /^\:.+/;
function doParsePathParams(pattern, uri) {
  const params = {};
  for (let i = 0; i <= pattern.length; i++) {
    if (namedParamRegex.test(pattern[i])) {
      params[keyFromPattern(pattern[i])] = uri[i];
    }
  }

  return params;
}

function keyFromPattern(pattern) {
  return pattern.replace(":", "");
}

export default { parsePathParams };
