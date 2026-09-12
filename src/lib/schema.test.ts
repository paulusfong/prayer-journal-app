import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import {
  CATEGORIES,
  account,
  circles,
  invites,
  memberships,
  prayerMarks,
  prayerNotes,
  prayerRequests,
  requestGrants,
  requestUpdates,
  session,
  user,
  verification,
} from "./schema";

describe("schema", () => {
  it("defines expected table names", () => {
    assert.deepEqual(
      [
        user,
        session,
        account,
        verification,
        circles,
        memberships,
        invites,
        prayerRequests,
        requestUpdates,
        prayerNotes,
        prayerMarks,
        requestGrants,
      ].map(getTableName),
      [
        "user",
        "session",
        "account",
        "verification",
        "circles",
        "memberships",
        "invites",
        "prayer_requests",
        "request_updates",
        "prayer_notes",
        "prayer_marks",
        "request_grants",
      ],
    );
  });

  it("defines category labels used by request forms", () => {
    assert.deepEqual(CATEGORIES, {
      health: "Health",
      family: "Family",
      work_school: "Work/School",
      church_ministry: "Church/Ministry",
      friends: "Friends",
      other: "Other",
    });
  });

  it("builds auth table indexes and foreign keys", () => {
    const sessionConfig = getTableConfig(session);
    const verificationConfig = getTableConfig(verification);

    assert.deepEqual(
      sessionConfig.indexes.map((idx) => idx.config.name),
      ["session_userId_idx"],
    );
    assert.deepEqual(
      verificationConfig.indexes.map((idx) => idx.config.name),
      ["verification_identifier_idx"],
    );
    assert.equal(sessionConfig.foreignKeys.length, 1);
  });

  it("builds membership and prayer uniqueness constraints", () => {
    const membershipConfig = getTableConfig(memberships);
    const prayerMarksConfig = getTableConfig(prayerMarks);
    const requestGrantsConfig = getTableConfig(requestGrants);

    assert.deepEqual(
      membershipConfig.indexes.map((idx) => idx.config.name),
      ["memberships_circle_user"],
    );
    assert.deepEqual(
      prayerMarksConfig.indexes.map((idx) => idx.config.name),
      ["prayer_marks_request_user"],
    );
    assert.deepEqual(
      requestGrantsConfig.indexes.map((idx) => idx.config.name),
      ["request_grants_request_user"],
    );
  });

  it("defines request relationships", () => {
    const inviteConfig = getTableConfig(invites);
    const requestConfig = getTableConfig(prayerRequests);
    const requestUpdatesConfig = getTableConfig(requestUpdates);
    const prayerNotesConfig = getTableConfig(prayerNotes);

    assert.equal(inviteConfig.foreignKeys.length, 2);
    assert.equal(requestConfig.foreignKeys.length, 3);
    assert.equal(requestUpdatesConfig.foreignKeys.length, 2);
    assert.equal(prayerNotesConfig.foreignKeys.length, 2);
  });

  it("resolves all foreign-key references", () => {
    const foreignTables = [
      session,
      account,
      memberships,
      invites,
      prayerRequests,
      requestUpdates,
      prayerNotes,
      prayerMarks,
      requestGrants,
    ].flatMap((table) =>
      getTableConfig(table).foreignKeys.map((foreignKey) =>
        getTableName(foreignKey.reference().foreignTable),
      ),
    );

    assert.deepEqual(foreignTables, [
      "user",
      "user",
      "user",
      "circles",
      "circles",
      "user",
      "circles",
      "user",
      "user",
      "prayer_requests",
      "user",
      "prayer_requests",
      "user",
      "prayer_requests",
      "user",
      "prayer_requests",
      "user",
    ]);
  });

  it("can build every table config", () => {
    const configs = [
      user,
      session,
      account,
      verification,
      circles,
      memberships,
      invites,
      prayerRequests,
      requestUpdates,
      prayerNotes,
      prayerMarks,
      requestGrants,
    ].map(getTableConfig);

    assert.equal(configs.length, 12);
    assert.equal(configs.reduce((sum, config) => sum + config.columns.length, 0), 84);
  });
});
describe("CATEGORIES const object", () => {
  it("exposes every label key (covers as-const export surface)", async () => {
    const { CATEGORIES } = await import("./schema");
    assert.equal(CATEGORIES.health, "Health");
    assert.equal(CATEGORIES.other, "Other");
    assert.equal(Object.keys(CATEGORIES).length, 6);
    // Touch the binding again so the export statement stays hot under c8/tsx maps.
    assert.ok("friends" in CATEGORIES);
  });
});
