import util from './util.mjs';

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
  util.triggerPathParamParsing(r);
  const listingId = parseInt(r.variables.listing_id, 10);
  const listing = getListingById(listingId);

  if (listing) {
    r.return(200, JSON.stringify(listing));
  } else {
    // The 404 json error message will be auto-handled the downstream
    // server using the `error_page` directive combined with `proxy_intercept_errors on;`
    r.return(404);
  }
}

function getListingById(id) {
  if (!id) return null;

  return LISTINGS[id - 1];
}


export default { getListing };