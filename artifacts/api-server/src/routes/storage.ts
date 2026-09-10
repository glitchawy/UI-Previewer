import { Readable } from 'stream';
import express, { Router, type IRouter, type NextFunction, type Request, type Response } from 'express';
import { and, eq, or } from 'drizzle-orm';
import { adminAccountsTable, adminPermissionGroupsTable, applicationDocumentsTable, db, usersTable, restaurantsTable, driverProfilesTable } from '@workspace/db';

import { ObjectNotFoundError, ObjectStorageService } from '../lib/objectStorage';
import { lookupSession } from '../lib/session';

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
  return (await lookupSession(token))?.user ?? null;
}

/**
 * Check whether a user may read a private stored object.
 * Admins can access everything.
 * Any other role may only access objects stored in their own application row.
 */
export async function canUserAccessObject(
  user: typeof usersTable.$inferSelect,
  objectPath: string,
): Promise<boolean> {
  if (user.role === 'admin') {
    const [account] = await db.select({
      isActive: adminAccountsTable.isActive,
      isSuperAdmin: adminAccountsTable.isSuperAdmin,
      permissions: adminPermissionGroupsTable.permissions,
    })
      .from(adminAccountsTable)
      .leftJoin(adminPermissionGroupsTable, eq(adminPermissionGroupsTable.id, adminAccountsTable.permissionGroupId))
      .where(eq(adminAccountsTable.userId, user.id))
      .limit(1);
    return account?.isActive === true &&
      (account.isSuperAdmin || (account.permissions ?? []).includes("applications.read"));
  }

  // Check restaurant ownership (logoUrl / coverUrl)
  const rRows = await db
    .select({ ownerUserId: restaurantsTable.ownerUserId })
    .from(restaurantsTable)
    .where(and(
      eq(restaurantsTable.ownerUserId, user.id),
      or(eq(restaurantsTable.logoUrl, objectPath), eq(restaurantsTable.coverUrl, objectPath)),
    ))
    .limit(1);
  if (rRows.length > 0) return true;

  // Check driver profile ownership (four document URL columns)
  const dRows = await db
    .select({ userId: driverProfilesTable.userId })
    .from(driverProfilesTable)
    .where(and(
      eq(driverProfilesTable.userId, user.id),
      or(
        eq(driverProfilesTable.nationalIdFrontUrl, objectPath),
        eq(driverProfilesTable.nationalIdBackUrl, objectPath),
        eq(driverProfilesTable.criminalRecordUrl, objectPath),
        eq(driverProfilesTable.licenseUrl, objectPath),
      ),
    ))
    .limit(1);
  if (dRows.length > 0) return true;

  // Historical versions remain private but accessible to the owning applicant.
  const restaurantHistory = await db
    .select({ id: applicationDocumentsTable.id })
    .from(applicationDocumentsTable)
    .innerJoin(restaurantsTable, eq(restaurantsTable.id, applicationDocumentsTable.applicationId))
    .where(and(
      eq(applicationDocumentsTable.applicationType, 'restaurant'),
      eq(applicationDocumentsTable.objectPath, objectPath),
      eq(restaurantsTable.ownerUserId, user.id),
    ))
    .limit(1);
  if (restaurantHistory.length > 0) return true;
  const driverHistory = await db
    .select({ id: applicationDocumentsTable.id })
    .from(applicationDocumentsTable)
    .innerJoin(driverProfilesTable, eq(driverProfilesTable.id, applicationDocumentsTable.applicationId))
    .where(and(
      eq(applicationDocumentsTable.applicationType, 'driver'),
      eq(applicationDocumentsTable.objectPath, objectPath),
      eq(driverProfilesTable.userId, user.id),
    ))
    .limit(1);
  if (driverHistory.length > 0) return true;

  return false;
}

const MAX_UPLOAD_BYTES = 10_000_000; // 10 MB

/**
 * Inspect the first bytes of a buffer and return the canonical MIME type for
 * allowed formats, or null if the bytes don't match any allowed signature.
 *
 * Allowed: JPEG, PNG, WebP, GIF, BMP, TIFF, PDF.
 * SVG and all other text/executable types are NOT allowed.
 */
function detectAllowedMimeType(buf: Buffer): string | null {
  if (buf.length < 4) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';

  // GIF87a / GIF89a: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';

  // PDF: %PDF  (25 50 44 46)
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'application/pdf';

  // WebP: RIFF????WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && // RIFF
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50  // WEBP
  ) return 'image/webp';

  // BMP: BM  (42 4D)
  if (buf[0] === 0x42 && buf[1] === 0x4D) return 'image/bmp';

  // TIFF little-endian: II*\0  (49 49 2A 00)
  if (buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2A && buf[3] === 0x00) return 'image/tiff';

  // TIFF big-endian: MM\0*  (4D 4D 00 2A)
  if (buf[0] === 0x4D && buf[1] === 0x4D && buf[2] === 0x00 && buf[3] === 0x2A) return 'image/tiff';

  return null;
}

/**
 * Middleware: authenticate the caller before the body is buffered.
 * Attaches `req.authenticatedUser` for downstream handlers.
 */
async function requireAuthBeforeBody(
  req: Request & { authenticatedUser?: typeof usersTable.$inferSelect },
  res: Response,
  next: NextFunction,
) {
  const user = await getUserFromToken(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.authenticatedUser = user;
  next();
}

/**
 * POST /storage/uploads
 *
 * Upload a file through the server so that size and content-type limits are
 * enforced at the byte sink.  The client sends raw file bytes as the body.
 *
 * Enforcement order:
 *  1. Authentication is checked BEFORE the body is buffered so anonymous
 *     callers cannot force the server to buffer up to 10 MB.
 *  2. express.raw() with a 10 MB limit buffers the body and 413s if exceeded.
 *  3. Magic-byte detection validates actual file content independent of the
 *     caller-controlled Content-Type header.
 *  4. The server-detected MIME type is stored in GCS (not the client header).
 */
router.post(
  '/storage/uploads',
  requireAuthBeforeBody as express.RequestHandler,
  express.raw({ type: '*/*', limit: MAX_UPLOAD_BYTES }),
  async (req: Request & { authenticatedUser?: typeof usersTable.$inferSelect }, res: Response) => {
    const body = req.body as Buffer;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      res.status(400).json({ error: 'الملف فارغ أو لم يُرسَل بشكل صحيح' });
      return;
    }

    // Belt-and-suspenders size check after body-parser limit
    if (body.length > MAX_UPLOAD_BYTES) {
      res.status(400).json({ error: 'حجم الملف كبير جداً — الحد الأقصى 10 ميجابايت' });
      return;
    }

    // Validate file type from actual bytes — do NOT trust the Content-Type header
    const detectedMime = detectAllowedMimeType(body);
    if (!detectedMime) {
      res.status(400).json({ error: 'نوع الملف غير مقبول — يُسمح فقط بالصور (JPG، PNG، WebP، GIF) أو ملفات PDF' });
      return;
    }

    try {
      // Store with the server-detected MIME type, not the client-claimed one
      const objectPath = await objectStorageService.uploadObjectEntity(body, detectedMime);
      res.json({ objectPath });
    } catch (error) {
      req.log.error({ err: error }, 'Error uploading file');
      res.status(500).json({ error: 'فشل رفع الملف، حاول مرة أخرى' });
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
 *
 * Content-Disposition: attachment ensures browsers treat uploads as files to
 * download rather than render, preventing stored-XSS from malicious uploads.
 * X-Content-Type-Options: nosniff stops MIME-sniffing by browsers.
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
      // Prevent browser from rendering uploaded content in the app origin
      res.setHeader('Content-Disposition', 'attachment; filename="document"');
      res.setHeader('X-Content-Type-Options', 'nosniff');
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
