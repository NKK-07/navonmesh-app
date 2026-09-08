/* The deployed entry point.
 *
 * One catch-all function behind /api/*, rather than a file per endpoint. The
 * routes already share a database layer, an auth layer and a push layer, so
 * splitting them would mean every cold start pays for the same three modules
 * anyway, in more places, with the routing table spread across a directory
 * instead of readable in one file.
 *
 * The bracket filename is the platform's catch-all convention: it matches
 * /api/health, /api/auth/login and /api/alerts/<id>/ack alike, and hands over
 * the segments in req.query.path. _lib is skipped, so nothing in there
 * becomes an endpoint of its own.
 */

import { serveApi } from './_lib/routes.js';

export default async function handler(req, res) {
  const segments = req.query && req.query.path;
  const route = Array.isArray(segments)
    ? '/api/' + segments.join('/')
    : (req.url || '/').split('?')[0];

  await serveApi(req, res, route);
}
