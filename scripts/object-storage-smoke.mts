import { randomUUID } from "node:crypto";
import { ObjectStorageService } from "../artifacts/api-server/src/lib/objectStorage";
import { getObjectAclPolicy } from "../artifacts/api-server/src/lib/objectAcl";

const service = new ObjectStorageService();
const owner = `storage-smoke-owner-${randomUUID()}`;
const bytes = Buffer.from(`talabat-betak-storage-smoke:${randomUUID()}\n`, "utf8");
let file: Awaited<ReturnType<typeof service.getObjectEntityFile>> | undefined;

try {
  const objectPath = await service.uploadObjectEntity(bytes, "text/plain");
  file = await service.getObjectEntityFile(objectPath);
  await service.trySetObjectEntityAclPolicy(objectPath, {
    owner,
    visibility: "private",
  });

  const [downloaded] = await file.download();
  if (!downloaded.equals(bytes)) throw new Error("Object Storage read-back did not match uploaded bytes");

  const policy = await getObjectAclPolicy(file);
  if (policy?.owner !== owner || policy.visibility !== "private") {
    throw new Error("Object Storage ACL metadata did not round-trip");
  }
  if (!(await service.canAccessObjectEntity({ userId: owner, objectFile: file }))) {
    throw new Error("Object Storage ACL denied its owner");
  }
  if (await service.canAccessObjectEntity({ userId: `other-${randomUUID()}`, objectFile: file })) {
    throw new Error("Object Storage ACL allowed an unrelated user");
  }

  console.log("PASS: Object Storage upload, read-back, and private owner ACL checks succeeded");
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : "Object Storage smoke failed"}`);
  process.exitCode = 1;
} finally {
  if (file) {
    try {
      await file.delete({ ignoreNotFound: true });
      console.log("PASS: Object Storage smoke artifact cleaned up");
    } catch {
      console.error("FAIL: Object Storage smoke artifact cleanup failed; remove the latest uploads object manually");
      process.exitCode = 1;
    }
  }
}