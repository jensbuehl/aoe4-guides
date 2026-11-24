// Firestore rules test: remix lineage (spec 044). Cases L1–L9 are the ones in
// .specify/specs/044-remix-lineage/contracts/firestore-rules.md; add a case
// there first, then here.
//
// The five lineage fields decide what every visitor sees: duplicateOf hides a
// build from every list, stepsSince decides which of two builds is the original,
// remixCredit feeds the scores. Only the nightly job may write them. A build is
// created with duplicateOf: null (public lists filter `== null`, which a missing
// field never matches), or without it from an older cached app.
//
// Run with `npm run test:rules` (emulator, project `demo-aoe4-guides`).
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, Timestamp, updateDoc } from "firebase/firestore";

let testEnv;

const BUILD = "builds/b1";

const seedBuild = () => ({
  authorUid: "alice",
  title: "Seeded build",
  steps: [],
  isDraft: false,
  map: "Land",
  strategy: "",
  views: 40,
  likes: 3,
  upvotes: 5,
  downvotes: 1,
  comments: 2,
  score: 4.2,
  scoreAllTime: 6.1,
  timeCreated: Timestamp.fromMillis(1_700_000_000_000),
  timeUpdated: Timestamp.fromMillis(1_700_000_000_000),
  remixOf: null,
  duplicateOf: { id: "orig", title: "Original", author: "Carol" },
  stepsHash: "abc",
  stepsSince: Timestamp.fromMillis(1_700_000_000_000),
  remixCredit: 2,
  remixes: { count: 1, items: [{ id: "r1", title: "R", author: "Dan" }] },
});

// What addBuild sends for a new build: counters at zero, duplicateOf null.
const newBuild = (over = {}) => {
  const build = {
    ...seedBuild(),
    views: 0,
    likes: 0,
    upvotes: 0,
    downvotes: 0,
    comments: 0,
    score: 0,
    scoreAllTime: 0,
    duplicateOf: null,
  };
  // Removed BEFORE the override, so a case can still send one of them.
  for (const field of ["stepsHash", "stepsSince", "remixCredit", "remixes"]) delete build[field];
  return { ...build, ...over };
};

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-aoe4-guides",
    firestore: { rules: readFileSync(process.env.RULES_FILE ?? "firestore.rules", "utf8") },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), BUILD), seedBuild());
  });
});

const alice = () => testEnv.authenticatedContext("alice").firestore(); // the author
const bob = () => testEnv.authenticatedContext("bob").firestore(); // someone else

const SERVER_ONLY = {
  stepsHash: "forged",
  stepsSince: Timestamp.fromMillis(0),
  remixCredit: 500,
  remixes: { count: 99, items: [] },
};

describe("builds: lineage fields on create", () => {
  it("L1: a new build with duplicateOf: null is allowed", async () => {
    await assertSucceeds(setDoc(doc(alice(), "builds/new1"), newBuild()));
  });

  it("L2: a new build without duplicateOf (an older cached app) is allowed", async () => {
    const build = newBuild();
    delete build.duplicateOf;
    await assertSucceeds(setDoc(doc(alice(), "builds/new2"), build));
  });

  it("L3: a new build cannot arrive already marked as someone's duplicate", async () => {
    await assertFails(
      setDoc(doc(alice(), "builds/new3"), newBuild({ duplicateOf: { id: "b1", title: "x", author: "x" } }))
    );
  });

  for (const [field, value] of Object.entries(SERVER_ONLY)) {
    it(`L4: a new build cannot carry ${field}`, async () => {
      await assertFails(setDoc(doc(alice(), `builds/new-${field}`), newBuild({ [field]: value })));
    });
  }
});

describe("builds: lineage fields on update", () => {
  it("L5: the author cannot un-hide their own duplicate", async () => {
    await assertFails(updateDoc(doc(alice(), BUILD), { duplicateOf: null }));
  });

  for (const [field, value] of Object.entries(SERVER_ONLY)) {
    it(`L6: the author cannot write ${field}`, async () => {
      await assertFails(updateDoc(doc(alice(), BUILD), { [field]: value }));
    });
  }

  it("L7: an ordinary save without the lineage fields is allowed", async () => {
    await assertSucceeds(updateDoc(doc(alice(), BUILD), { title: "New title", steps: [{ type: "age", steps: [] }] }));
  });

  it("L8: the author may point remixOf at another build", async () => {
    await assertSucceeds(
      updateDoc(doc(alice(), BUILD), { remixOf: { id: "other", title: "Other", author: "Eve", authorUid: "eve" } })
    );
  });

  for (const field of ["duplicateOf", ...Object.keys(SERVER_ONLY)]) {
    it(`L9: another user cannot write ${field}`, async () => {
      const value = field === "duplicateOf" ? null : SERVER_ONLY[field];
      await assertFails(updateDoc(doc(bob(), BUILD), { [field]: value }));
    });
  }
});
