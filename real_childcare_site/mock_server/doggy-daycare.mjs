// In njs, we can import other **local**
// scripts just like normal js, except that only default exports are
// allowed.
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

/**
 * Triggers path parameter parsing then grabs the listing
 * id out of the `r.variables` object.  The name of the key
 * on the `r.variables` object is set in this line in the
 * `doggy_daycare.conf`` file: `set $path_pattern /listings/:listing_id;`
 * If `:listing_id` were changed to `:id` then the key here would be `:id`.
 * 
 * After we know the selected listing id, it's simply a matter of pulling
 * the right listing out of our mock listings.
 * 
 * @param {Object}  r - The njs request object
 */
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

// This is just a simple convenience method for allowing us to not worry
// about array indexing and null ids in the main logic.
function getListingById(id) {
  if (!id) return null;

  return LISTINGS[id - 1];
}


export default { getListing };