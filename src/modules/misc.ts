/**
 * @def {Auth}
 * @headers {Authorization} Bearer <token>
 */

/**
 * @def {ContentAuth}
 * @headers {Content-Type} application/json
 * @headers {Authorization} Bearer <token>
 */

/**
 * @def {Query}
 * @par {sort?} @query e.g. sort=name,desc
 * @par {select?} @query e.g. select=name,email
 * @par {populate?} @query e.g. populate=profile
 * @par {limit?} @query e.g. limit=10
 * @par {page?} @query e.g. page=1
 */
