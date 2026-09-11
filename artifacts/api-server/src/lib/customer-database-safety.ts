import { and, count, eq, gt, isNull } from "drizzle-orm";
import {
  adminAccountsTable,
  authSessionsTable,
  db,
  usersTable,
} from "@workspace/db";
import { runtimeCapabilities } from "./deployment-profile";

export type CustomerDatabaseSafetyState = {
  developmentFixtureUsers: number;
  activeDevelopmentFixtureSessions: number;
  activeDevelopmentFixtureAdmins: number;
};

async function loadCustomerDatabaseSafetyState(): Promise<CustomerDatabaseSafetyState> {
  const now = new Date();
  const [[fixtureUsers], [activeSessions], [activeAdmins]] = await Promise.all([
    db.select({ value: count() })
      .from(usersTable)
      .where(eq(usersTable.isDevelopmentFixture, true)),
    db.select({ value: count() })
      .from(authSessionsTable)
      .innerJoin(usersTable, eq(usersTable.id, authSessionsTable.userId))
      .where(and(
        eq(usersTable.isDevelopmentFixture, true),
        isNull(authSessionsTable.revokedAt),
        gt(authSessionsTable.absoluteExpiresAt, now),
        gt(authSessionsTable.idleExpiresAt, now),
      )),
    db.select({ value: count() })
      .from(adminAccountsTable)
      .innerJoin(usersTable, eq(usersTable.id, adminAccountsTable.userId))
      .where(and(
        eq(usersTable.isDevelopmentFixture, true),
        eq(adminAccountsTable.isActive, true),
      )),
  ]);
  return {
    developmentFixtureUsers: fixtureUsers.value,
    activeDevelopmentFixtureSessions: activeSessions.value,
    activeDevelopmentFixtureAdmins: activeAdmins.value,
  };
}

export async function assertCustomerDatabaseSafety(
  loadState: () => Promise<CustomerDatabaseSafetyState> =
    loadCustomerDatabaseSafetyState,
): Promise<void> {
  if (runtimeCapabilities().deploymentProfile !== "customer") return;
  const state = await loadState();
  if (
    state.developmentFixtureUsers > 0 ||
    state.activeDevelopmentFixtureSessions > 0 ||
    state.activeDevelopmentFixtureAdmins > 0
  ) {
    throw new Error(
      "Unsafe customer database contains development test identities or grants; a fresh isolated customer database is required.",
    );
  }
}