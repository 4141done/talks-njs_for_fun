/**
 * This file just exists to serve mock responses
 * containing beautify poetry.  If your heart is
 * full of rainy love, please add a poem.
 * 
 * @module precious-poetry
 */

function preciousWeatherPoetry(r) {
  // Shows up nicely when queried like so:
  // curl localhost:4002 | jq -r '.poems[0]'
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

      Siblings in Soggy Sockery
      `
    ]
  }

  r.return(200, JSON.stringify(poems));
}

export default { preciousWeatherPoetry };