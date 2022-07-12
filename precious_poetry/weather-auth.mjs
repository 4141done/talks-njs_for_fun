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