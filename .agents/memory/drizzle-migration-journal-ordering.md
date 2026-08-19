---
name: Drizzle migration journal ordering
description: Why a valid migration file can be silently skipped and how to choose its journal timestamp.
---

New migration entries must use a `when` value greater than the highest migration timestamp already recorded in the database, regardless of filename or journal index order.

**Why:** Drizzle decides which migrations are pending by comparing journal timestamps with the latest applied database timestamp. A lower `when` value is silently treated as already behind the database even when its SQL file and tag are new.

**How to apply:** Before adding a migration manually, compare the new journal timestamp with both the existing journal and the latest row in Drizzle’s migration table. After restart, verify the expected table or column exists instead of relying only on the generic migration-success log.