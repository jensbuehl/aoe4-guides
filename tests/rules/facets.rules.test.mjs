// Firestore rules test: the values a build may store in `map` and `strategy`.
//
// The case ids (F*) are the ones in
// .specify/specs/045-map-types-strategy-guidance/contracts/firestore-rules.md,
// which is the list this file has to cover. Add a case there first, then here.
//
// Each refusal (F1–F8) must FAIL against the rules deployed before spec 045:
//   RULES_FILE=<copy of the old rules> npm run test:rules
// That is what shows the case covers the hole rather than passing by accident.
//
// Run with `npm run test:rules` (emulator, project `demo-aoe4-guides`, needs
// Java). Imports nothing from src/: the rules are the contract, and the test
// must hold whatever the client happens to send. The allowed lists below are
// transcribed on purpose, like the rules' own copy.
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { arrayUnion, doc, increment, setDoc, Timestamp, updateDoc, writeBatch } from "firebase/firestore";

const MAPS = ["Land", "Water", "Hybrid"];
const STRATEGIES = ["Rush", "Boom", "Fast Castle", "Fast Imperial", "Timing Attack", "Cheese"];

let testEnv;

const BUILD = "builds/b1";
const LEGACY = "builds/legacy";

const seedBuild = (extra = {}) => ({
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
  ...extra,
});

// What the editor's "new build" sends: every counter and score at zero.
const newBuild = (extra = {}) => ({
  ...seedBuild(),
  views: 0,
  likes: 0,
  upvotes: 0,
  downvotes: 0,
  comments: 0,
  score: 0,
  scoreAllTime: 0,
  timeCreated: null,
  timeUpdated: null,
  ...extra,
});

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
    const db = ctx.firestore();
    await setDoc(doc(db, BUILD), seedBuild());
    // A document the cleanup would have caught: proves counter writes never
    // trip over a stored value (FR-015).
    await setDoc(doc(db, LEGACY), seedBuild({ map: "Open", strategy: "Feudal Power Spike → Castle Timing" }));
  });
});

const alice = () => testEnv.authenticatedContext("alice").firestore(); // the author
const anon = () => testEnv.unauthenticatedContext().firestore();
const verified = (uid) => testEnv.authenticatedContext(uid, { email_verified: true }).firestore();

const create = (db, id, data) => setDoc(doc(db, `builds/${id}`), data);

/** A like as the client sends it since spec 042: step + own list, one batch. */
function like(db, uid, buildPath) {
  const buildId = buildPath.split("/")[1];
  const batch = writeBatch(db);
  batch.update(doc(db, buildPath), { likes: increment(1) });
  batch.set(
    doc(db, `favorites/${uid}`),
    { favorites: arrayUnion(buildId), lastChange: { list: "favorites", buildId } },
    { merge: true }
  );
  return batch.commit();
}

describe("builds: map and strategy values are refused outside the lists", () => {
  it("F1: create with a legacy map (Open)", async () => {
    await assertFails(create(alice(), "f1", newBuild({ map: "Open" })));
  });

  it("F2: create with an empty map", async () => {
    await assertFails(create(alice(), "f2", newBuild({ map: "" })));
  });

  it("F3: create with no map at all", async () => {
    const { map: _map, ...withoutMap } = newBuild();
    await assertFails(create(alice(), "f3", withoutMap));
  });

  it("F4: create with a typed-in strategy", async () => {
    await assertFails(create(alice(), "f4", newBuild({ strategy: "Aggression" })));
  });

  it("F5: create with strategy null", async () => {
    await assertFails(create(alice(), "f5", newBuild({ strategy: null })));
  });

  it("F6: edit an allowed build to a legacy map", async () => {
    await assertFails(updateDoc(doc(alice(), BUILD), { map: "Closed" }));
  });

  it("F7: edit an allowed build to a strategy the client should have normalised", async () => {
    await assertFails(updateDoc(doc(alice(), BUILD), { strategy: "Feudal Rush" }));
  });

  it("F8: create with an option in the wrong case", async () => {
    await assertFails(create(alice(), "f8", newBuild({ strategy: "fast castle" })));
  });
});

describe("builds: every allowed value is accepted", () => {
  it("F9: create with each map type", async () => {
    for (const map of MAPS) {
      await assertSucceeds(create(alice(), `f9-${map}`, newBuild({ map })));
    }
  });

  it("F10: create with each strategy, and with none", async () => {
    for (const strategy of [...STRATEGIES, ""]) {
      await assertSucceeds(create(alice(), `f10-${strategy || "none"}`, newBuild({ strategy })));
    }
  });

  it("F11: create with no strategy key (reads as not stated)", async () => {
    const { strategy: _strategy, ...withoutStrategy } = newBuild();
    await assertSucceeds(create(alice(), "f11", withoutStrategy));
  });

  it("F12: edit the title of a build with allowed values", async () => {
    await assertSucceeds(updateDoc(doc(alice(), BUILD), { title: "Edited", timeUpdated: Timestamp.now() }));
  });
});

describe("builds: counter writes are not value-checked (FR-015)", () => {
  it("F13: a view on a build that still holds a legacy map", async () => {
    await assertSucceeds(updateDoc(doc(anon(), LEGACY), { views: increment(1) }));
  });

  it("F14: a like on a build that still holds a legacy strategy", async () => {
    await assertSucceeds(like(verified("carol"), "carol", LEGACY));
  });
});
