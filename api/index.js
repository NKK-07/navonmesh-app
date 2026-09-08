/* The deployed entry point.
 *
 * One function behind /api/*, rather than a file per endpoint. The routes
 * already share a database layer, an auth layer and a push layer, so splitting
 * them would mean every cold start pays for the same three modules anyway, in
 * more places, with the routing table spread across a directory instead of
 * readable in one file.
 *
 * Routing is declared in vercel.json rather than inferred from this filename.
 * The first version of this file was api/[...path].js, on the assumption that
 * the bracket convention would match any depth. It did not: the platform built
 * a single segment matcher from it, so /api/health worked and /api/auth/login
 * returned the platform's own 404 without ever reaching this code. One segment
 * of the API worked and the rest did not, which is a worse failure than none
 * of it working, because health checks pass.
 *
 * So vercel.json rewrites /api/(.*) here and passes the matched path as a
 * query parameter. Nothing depends on how a filename is parsed.
 */

import { serveApi } from './_lib/routes.js';

export default async function handler(req, res) {
  /* The rewrite sends "auth/login"; a catch-all filename would send
     ["auth","login"]; a direct hit sends neither. All three resolve here, so
     the routing table cannot be silently truncated by the platform again. */
  const p = req.query && req.query.path;
  const route =
    Array.isArray(p) ? '/api/' + p.join('/')
    : typeof p === 'string' && p ? '/api/' + p.replace(/^\/+/, '')
    : (req.url || '/').split('?')[0];

  await serveApi(req, res, route);
}
