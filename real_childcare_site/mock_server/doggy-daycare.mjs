const LISTING_ID_REGEX = /listings\/(\d+)/i;
const LISTINGS = [
  {
    title: 'Dog haven near to great park',
    description: `
      Ever wanted to find a place for your dog that allows them easy access to a park?
      Look no further!
    `
  },
  {
    title: 'Leave your dog! Enjoy a weekend away!',
    description: `
      Dogs are great, but sometimes you just need a break from all the 
      barking and chaos.  Leave your dog with us and we will make sure 
      they have enough dog food to eat.
    `
  }
];

function getListing(r) {
  r.variables.path_params; // This kicks off the parsing of params in the path
  r.error(`LISTING ID IN THE MAIN LOGIC: ${r.variables.listing_id}`);
  r.error(`dog ID IN THE MAIN LOGIC: ${r.variables.dog_id}`);
  r.error(`fish ID IN THE MAIN LOGIC: ${r.variables.fish_id}`);
  const listingId = parseListingId(r.uri);
  const listing = getListingById(listingId);

  if (listing) {
    r.return(200, JSON.stringify(listing));
  } else {
    r.return(404, JSON.stringify({ error: 'Not Found' }));
  }
}

function getListingById(id) {
  if (!id) return null;

  return LISTINGS[id - 1];
}

// Very naive but does the job
function parseListingId(uri) {
  const match = LISTING_ID_REGEX.exec(uri);

  if (match && match[1]) {
    return parseInt(match[1], 10);
  } else {
    return null;
  }
}


export default { getListing };