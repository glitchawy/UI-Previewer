import { Readable } from 'stream';
import { Router, type IRouter, type Request, type Response } from 'express';
import { eq, or } from 'drizzle-orm';
import { db, usersTable, restaurantsTable, driverProfilesTable } from '@workspace/db';

import { ObjectNotFoundError, ObjectStorageService } from '../lib/objectStorage';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/** Extract token from Authorization header or ?token= query param. */
function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  const q = req.query['token'];
  return typeof q === 'string' && q ? q : null;
}

/** Resolve a valid session from the request. */
async function getUserFromToken(req: Request) {
  const token = extractToken(req);
  if (!token) return null;
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.sessionToken, token))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Check whether a user may read a private stored object.
 * Admins can access everything.
 * Any other role may only access objects stored in their own application row.
 */
async function canUserAccessObject(
  user: typeof usersTable.$inferSelect,
  objectPath: string,
): Promise<boolean> {
  if (user.role === 'admin') return true;

  // Check restaurant ownership (logoUrl / coverUrl)
  const rRows = await db
    .select({ ownerUserId: restaurantsTable.ownerUserId })
    .from(restaurantsTable)
    .where(or(
      eq(restaurantsTable.logoUrl, objectPath),
      eq(restaurantsTable.coverUrl, objectPath),
    ))
    .limit(1);
  if (rRows.length > 0 && rRows[0].ownerUserId === user.id) return true;

  // Check driver profile ownership (four document URL columns)
  const dRows = await db
    .select({ userId: driverProfilesTable.userId })
    .from(driverProfilesTable)
    .where(or(
      eq(driverProfilesTable.nationalIdFrontUrl, objectPath),
      eq(driverProfilesTable.nationalIdBackUrl, objectPath),
      eq(driverProfilesTable.criminalRecordUrl, objectPath),
      eq(driverProfilesTable.licenseUrl, objectPath),
    ))
    .limit(1);
  if (dRows.length > 0 && dRows[0].userId === user.id) return true;

  return false;
}

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * Client sends JSON metadata (name, size, contentType) — NOT the file bytes.
 * The file is then PUT directly to the returned GCS presigned URL.
 */
router.post(
  '/storage/uploads/request-url',
  async (req: Request, res: Response) => {
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, size, contentType } = req.body as Record<string, unknown>;
    if (typeof name !== 'string' || typeof size !== 'number' || typeof contentType !== 'string') {
      res.status(400).json({ error: 'Missing or invalid required fields: name, size, contentType' });
      return;
    }

    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  },
);

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * Unconditionally public — no auth or ACL checks.
 */
router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      const response = await objectStorageService.downloadObject(file);
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (response.body) {
        const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

/**
 * GET /storage/objects/*
 *
 * Serve private object entities.
 * Access allowed only for admins or the user who owns the application
 * that references this objectPath (resolved from the DB).
 */
router.get(
  '/storage/objects/*objectPath',
  async (req: Request, res: Response) => {
    const user = await getUserFromToken(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const raw = req.params.objectPath;
    const objectPath = '/objects/' + (Array.isArray(raw) ? raw.join('/') : raw);

    const allowed = await canUserAccessObject(user, objectPath);
    if (!allowed) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    try {
      const file = await objectStorageService.getObjectEntityFile(objectPath);
      const response = await objectStorageService.downloadObject(file, 3600);
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (response.body) {
        const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      req.log.error({ err: error }, 'Error serving object');
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
