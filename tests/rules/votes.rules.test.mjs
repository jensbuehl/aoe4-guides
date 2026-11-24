// Firestore rules test: likes and upvotes count once per account (spec 042).
//
// The case ids (V*, X*) are the ones in
// .specify/specs/042-vote-integrity/contracts/firestore-rules.md, which is the
// list this file has to cover. Add a case there first, then here.
//
// A like is ONE batched write: the build's `likes` step and the caller's
// `favorites` list change, with `lastChange` naming the build. `react()` below
// writes exactly what src/composables/data/reactionService.js sends; the other
// cases send what a console script could send instead.
//
// Run with `npm run test:rules` (emulator, needs Java). `RULES_FILE=<path>`
// runs the same cases against another version — the deployed rules — to show
// each refused case really was a hole there.
//
// Imports nothing from src/: the rules are the contract, and the test must hold
// whatever the client happens to send.
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

let testEnv;

const build = (likes, upvotes, downvotes = 0) => ({
  authorUid: "carol",
  title: "Seeded build",
  steps: [],
  isDraft: false,
  views: 40,
  likes,
  upvotes,
  downvotes,
  comments: 0,
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
    await setDoc(doc(db, "builds/b1"), build(3, 5, 1));
    await setDoc(doc(db, "builds/b0"), build(0, 0));
    await setDoc(doc(db, "builds/b2"), build(2, 1));
  });
});

// alice and bob have verified addresses; una has not.
const alice = () => testEnv.authenticatedContext("alice", { email_verified: true }).firestore();
const bob = () => testEnv.authenticatedContext("bob", { email_verified: true }).firestore();
const una = () => testEnv.authenticatedContext("una", { email_verified: false }).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

/** Seeds favorites/{uid} with rules off. */
const seedLists = (uid, lists) =>
  testEnv.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), `favorites/${uid}`), lists));

/** Reads a document with rules off. */
const peek = async (path) => {
  let data;
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    data = (await getDoc(doc(ctx.firestore(), path))).data();
  });
  return data;
};

const COUNTER = { favorites: "likes", upvotes: "upvotes" };

/** What reactionService sends: one batch, build step (if any) + list change + lastChange. */
function react(db, uid, buildId, list, on, step = on ? 1 : -1) {
  const batch = writeBatch(db);
  if (step) batch.update(doc(db, `builds/${buildId}`), { [COUNTER[list]]: increment(step) });
  batch.set(
    doc(db, `favorites/${uid}`),
    { [list]: on ? arrayUnion(buildId) : arrayRemove(buildId), lastChange: { list, buildId } },
    { merge: true }
  );
  return batch.commit();
}

describe("votes: what a player does is allowed", () => {
  it("V1: like — the first heart also creates the list document", async () => {
    await assertSucceeds(react(alice(), "alice", "b1", "favorites", true));
    assert.equal((await peek("builds/b1")).likes, 4);
    assert.deepEqual((await peek("favorites/alice")).favorites, ["b1"]);
  });

  it("V2: unlike", async () => {
    await seedLists("alice", { favorites: ["b1"] });
    await assertSucceeds(react(alice(), "alice", "b1", "favorites", false));
    assert.equal((await peek("builds/b1")).likes, 2);
    assert.deepEqual((await peek("favorites/alice")).favorites, []);
  });

  it("V3: upvote and take it back", async () => {
    await assertSucceeds(react(alice(), "alice", "b1", "upvotes", true));
    assert.equal((await peek("builds/b1")).upvotes, 6);
    await assertSucceeds(react(alice(), "alice", "b1", "upvotes", false));
    assert.equal((await peek("builds/b1")).upvotes, 5);
  });

  it("V1+V2: like, unlike, like again", async () => {
    await assertSucceeds(react(alice(), "alice", "b1", "favorites", true));
    await assertSucceeds(react(alice(), "alice", "b1", "favorites", false));
    await assertSucceeds(react(alice(), "alice", "b1", "favorites", true));
    assert.equal((await peek("builds/b1")).likes, 4);
  });

  it("V4: remove a favourite whose build was deleted — no step", async () => {
    await seedLists("alice", { favorites: ["gone", "b1"] });
    await assertSucceeds(react(alice(), "alice", "gone", "favorites", false, 0));
  });

  it("V5: remove a favourite whose count is already 0 — no step", async () => {
    await seedLists("alice", { favorites: ["b0"] });
    await assertSucceeds(react(alice(), "alice", "b0", "favorites", false, 0));
    assert.equal((await peek("builds/b0")).likes, 0);
  });

  it("V6: an unverified account can still take a like back", async () => {
    await seedLists("una", { favorites: ["b1"] });
    await assertSucceeds(react(una(), "una", "b1", "favorites", false));
  });

  it("V7: account setup's empty arrayUnion() changes no list", async () => {
    await assertSucceeds(setDoc(doc(alice(), "favorites/alice"), { favorites: arrayUnion() }, { merge: true }));
    await seedLists("bob", { favorites: ["b1"], upvotes: ["b2"] });
    await assertSucceeds(setDoc(doc(bob(), "favorites/bob"), { favorites: arrayUnion() }, { merge: true }));
  });

  it("V8: a legacy list holding the build twice can still unlike", async () => {
    await seedLists("alice", { favorites: ["b1", "b2", "b1"] });
    await assertSucceeds(react(alice(), "alice", "b1", "favorites", false));
  });

  it("the owner reads their own lists; nobody else does", async () => {
    await seedLists("alice", { favorites: ["b1"] });
    await assertSucceeds(getDoc(doc(alice(), "favorites/alice")));
    await assertFails(getDoc(doc(bob(), "favorites/alice")));
  });
});

describe("votes: one account counts once", () => {
  it("X1: a bare like, no list change", async () => {
    await assertFails(updateDoc(doc(alice(), "builds/b1"), { likes: increment(1) }));
  });

  it("X2: a second like on a build already in the list", async () => {
    await seedLists("alice", { favorites: ["b1"] });
    await assertFails(react(alice(), "alice", "b1", "favorites", true));
  });

  it("X3: dropping a favourite without giving the like back", async () => {
    await seedLists("alice", { favorites: ["b1"] });
    await assertFails(react(alice(), "alice", "b1", "favorites", false, 0));
  });

  it("X4: adding a favourite without the like", async () => {
    await assertFails(react(alice(), "alice", "b1", "favorites", true, 0));
  });

  it("X5: a bare unlike of a build not in the list", async () => {
    await assertFails(updateDoc(doc(alice(), "builds/b1"), { likes: increment(-1) }));
  });

  it("X6: a like paired with someone else's list", async () => {
    const db = alice();
    const batch = writeBatch(db);
    batch.update(doc(db, "builds/b1"), { likes: increment(1) });
    batch.set(doc(db, "favorites/bob"), { favorites: arrayUnion("b1"), lastChange: { list: "favorites", buildId: "b1" } }, { merge: true });
    await assertFails(batch.commit());
  });

  it("X7: one like, two builds added to the list", async () => {
    const db = alice();
    const batch = writeBatch(db);
    batch.update(doc(db, "builds/b1"), { likes: increment(1) });
    batch.set(doc(db, "favorites/alice"), { favorites: arrayUnion("b1", "b2"), lastChange: { list: "favorites", buildId: "b1" } }, { merge: true });
    await assertFails(batch.commit());
  });

  it("X8: the like names one build, the list gains another", async () => {
    const db = alice();
    const batch = writeBatch(db);
    batch.update(doc(db, "builds/b1"), { likes: increment(1) });
    batch.set(doc(db, "favorites/alice"), { favorites: arrayUnion("b2"), lastChange: { list: "favorites", buildId: "b1" } }, { merge: true });
    await assertFails(batch.commit());
  });

  it("X9: an unverified account cannot like", async () => {
    await assertFails(react(una(), "una", "b1", "favorites", true));
  });

  it("X10: downvotes are frozen — no step", async () => {
    await assertFails(updateDoc(doc(alice(), "builds/b1"), { downvotes: increment(1) }));
    await assertFails(updateDoc(doc(alice(), "builds/b1"), { downvotes: increment(-1) }));
  });

  it("X11: downvotes are frozen — the list does not change", async () => {
    await seedLists("alice", { downvotes: ["b1"] });
    await assertFails(setDoc(doc(alice(), "favorites/alice"), { downvotes: arrayRemove("b1") }, { merge: true }));
    await assertFails(setDoc(doc(alice(), "favorites/alice"), { downvotes: arrayUnion("b2") }, { merge: true }));
  });

  it("X12: a player cannot delete their list document", async () => {
    await seedLists("alice", { favorites: ["b1"] });
    await assertFails(deleteDoc(doc(alice(), "favorites/alice")));
  });

  it("X13: a count of 0 cannot go negative", async () => {
    await seedLists("alice", { favorites: ["b0"] });
    await assertFails(react(alice(), "alice", "b0", "favorites", false, -1));
  });

  it("X14: like and upvote stepped in one build write", async () => {
    const db = alice();
    const batch = writeBatch(db);
    batch.update(doc(db, "builds/b1"), { likes: increment(1), upvotes: increment(1) });
    batch.set(doc(db, "favorites/alice"), { favorites: arrayUnion("b1"), lastChange: { list: "favorites", buildId: "b1" } }, { merge: true });
    await assertFails(batch.commit());
  });

  it("X15: one like, both lists gain the build", async () => {
    const db = alice();
    const batch = writeBatch(db);
    batch.update(doc(db, "builds/b1"), { likes: increment(1) });
    batch.set(
      doc(db, "favorites/alice"),
      { favorites: arrayUnion("b1"), upvotes: arrayUnion("b1"), lastChange: { list: "favorites", buildId: "b1" } },
      { merge: true }
    );
    await assertFails(batch.commit());
  });

  it("X16: an anonymous visitor cannot like", async () => {
    await assertFails(updateDoc(doc(anon(), "builds/b1"), { likes: increment(1) }));
  });

  it("X17: two builds liked with one list change", async () => {
    const db = alice();
    const batch = writeBatch(db);
    batch.update(doc(db, "builds/b1"), { likes: increment(1) });
    batch.update(doc(db, "builds/b2"), { likes: increment(1) });
    batch.set(doc(db, "favorites/alice"), { favorites: arrayUnion("b1"), lastChange: { list: "favorites", buildId: "b1" } }, { merge: true });
    await assertFails(batch.commit());
  });
});
