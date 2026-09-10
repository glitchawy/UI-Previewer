-- Make branch_staff the canonical, branch-scoped fulfillment authorization.
-- Multiple active rows are ambiguous, so fail closed rather than choosing one.
UPDATE branch_staff bs
SET left_at = now()
WHERE bs.left_at IS NULL
  AND 1 < (
    SELECT count(*) FROM branch_staff active
    WHERE active.user_id = bs.user_id AND active.left_at IS NULL
  );
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "branch_staff_active_user_uidx"
  ON "branch_staff" ("user_id") WHERE "left_at" IS NULL;
--> statement-breakpoint
WITH eligible AS (
  SELECT r.id, r.owner_user_id, r.name, r.address, r.phone, r.lat, r.lng
  FROM restaurants r
  WHERE r.status IN ('APPROVED', 'ACTIVE')
    AND 1 = (
      SELECT count(*)
      FROM restaurants candidate
      WHERE candidate.owner_user_id = r.owner_user_id
        AND candidate.status IN ('APPROVED', 'ACTIVE')
    )
    AND 1 >= (
      SELECT count(*) FROM branches candidate_branch
      WHERE candidate_branch.restaurant_id = r.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM branch_staff bs WHERE bs.user_id = r.owner_user_id AND bs.left_at IS NULL
    )
), created AS (
  INSERT INTO branches (restaurant_id, name, address, phone, lat, lng, notes)
  SELECT e.id, e.name || ' — الفرع الرئيسي', e.address, e.phone, e.lat, e.lng,
         'Created by safe partner membership reconciliation'
  FROM eligible e
  WHERE NOT EXISTS (SELECT 1 FROM branches b WHERE b.restaurant_id = e.id)
  RETURNING id, restaurant_id
), candidate_targets AS (
  SELECT e.owner_user_id, b.id AS branch_id
  FROM eligible e
  JOIN branches b ON b.restaurant_id = e.id
  UNION ALL
  SELECT e.owner_user_id, created.id AS branch_id
  FROM eligible e
  JOIN created ON created.restaurant_id = e.id
), targets AS (
  SELECT owner_user_id, min(branch_id) AS branch_id
  FROM candidate_targets
  GROUP BY owner_user_id
)
INSERT INTO branch_staff (branch_id, user_id, role)
SELECT t.branch_id, t.owner_user_id, 'MANAGER'
FROM targets t
ON CONFLICT DO NOTHING;