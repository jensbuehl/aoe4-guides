// Firestore rules test: what any client may write to builds and contributors.
//
// The case ids (B*, A*, C*) are the ones in
// .specify/specs/040-fair-trending/contracts/firestore-rules.md, which is the
// list this file has to cover. Add a case there first, then here.
//
// Run with `npm run test:rules`. It starts the Firestore emulator under the
// throwaway project id `demo-aoe4-guides`, so it cannot touch either real
// project, and it needs a Java runtime for the emulator.
//
// Imports nothing from src/: the rules are the contract, and the test must hold
// whatever the client happens to send.
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, increment, setDoc, Timestamp, updateDoc } from "firebase/firestore";

let testEnv;

const BUILD = "builds/b1";

const seedBuild = () => ({
  authorUid: "alice",
  title: "Seeded build",
  steps: [],
  isDraft: false,
  views: 40,
  likes: 3,
  upvotes: 5,
  downvotes: 1,
  comments: 2,
  score: 4.2,
  scoreAllTime: 6.1,
  timeCreated: Timestamp.fromMillis(1_700_000_000_000),
  timeUpdated: Timestamp.fromMillis(1_700_000_000_000),
});

// What the editor's "new build" sends (src/views/builds/BuildEditor.vue): every
// counter and score at zero.
const newBuild = (authorUid) => ({
  ...seedBuild(),
  authorUid,
  views: 0,
  likes: 0,
  upvotes: 0,
  downvotes: 0,
  comments: 0,
  score: 0,
  scoreAllTime: 0,
  timeCreated: null,
  timeUpdated: null,
});

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-aoe4-guides",
    // RULES_FILE lets a run point at another version, e.g. the last deployed
    // rules, to see that a new case really fails against the hole it covers.
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
    await setDoc(doc(db, "contributors/alice"), { authorId: "alice", viewCount: 900, boCount: 4 });
  });
});

const anon = () => testEnv.unauthenticatedContext().firestore();
const alice = () => testEnv.authenticatedContext("alice").firestore(); // the author
const bob = () => testEnv.authenticatedContext("bob").firestore(); // someone else

describe("builds: ownership (authorUid takeover hotfix)", () => {
  it("B8: another user cannot claim a build by writing their own uid into authorUid", async () => {
    await assertFails(updateDoc(doc(bob(), BUILD), { authorUid: "bob", title: "mine now" }));
  });

  it("B12: the author cannot hand the build to someone else", async () => {
    await assertFails(updateDoc(doc(alice(), BUILD), { authorUid: "bob" }));
  });

  it("A5: the author edits content fields", async () => {
    await assertSucceeds(
      updateDoc(doc(alice(), BUILD), {
        title: "Edited",
        steps: [{ type: "age", gameplan: "" }],
        isDraft: true,
        timeCreated: Timestamp.now(),
        timeUpdated: Timestamp.now(),
      })
    );
  });

  it("another user cannot edit content fields", async () => {
    await assertFails(updateDoc(doc(bob(), BUILD), { title: "vandalised" }));
  });

  it("A7: the author deletes their build", async () => {
    await assertSucceeds(deleteDoc(doc(alice(), BUILD)));
  });

  it("another user cannot delete it", async () => {
    await assertFails(deleteDoc(doc(bob(), BUILD)));
  });

  it("an anonymous visitor cannot delete it", async () => {
    await assertFails(deleteDoc(doc(anon(), BUILD)));
  });

  it("a user creates a build in their own name", async () => {
    await assertSucceeds(setDoc(doc(bob(), "builds/b2"), newBuild("bob")));
  });

  it("a user cannot create a build in someone else's name", async () => {
    await assertFails(setDoc(doc(bob(), "builds/b3"), newBuild("alice")));
  });
});

describe("builds: counters can only be stepped", () => {
  it("B1: a view cannot jump by 2", async () => {
    await assertFails(updateDoc(doc(anon(), BUILD), { views: increment(2) }));
  });

  it("B2: views cannot be set to an arbitrary value", async () => {
    await assertFails(updateDoc(doc(anon(), BUILD), { views: 1000000 }));
  });

  it("B3: views cannot go down", async () => {
    await assertFails(updateDoc(doc(anon(), BUILD), { views: increment(-1) }));
  });

  it("B4: an anonymous visitor cannot like", async () => {
    await assertFails(updateDoc(doc(anon(), BUILD), { likes: increment(1) }));
  });

  it("B5: an anonymous visitor cannot upvote", async () => {
    await assertFails(updateDoc(doc(anon(), BUILD), { upvotes: increment(1) }));
  });

  it("an anonymous visitor cannot change the comment count", async () => {
    await assertFails(updateDoc(doc(anon(), BUILD), { comments: increment(1) }));
  });

  it("B6: a signed-in visitor cannot add 5 likes at once", async () => {
    await assertFails(updateDoc(doc(bob(), BUILD), { likes: increment(5) }));
  });

  it("B7: two counters cannot move in one write", async () => {
    await assertFails(updateDoc(doc(bob(), BUILD), { views: increment(1), likes: increment(1) }));
  });

  it("a counter step cannot carry a content change with it", async () => {
    await assertFails(updateDoc(doc(bob(), BUILD), { views: increment(1), title: "x" }));
  });

  it("A1: an anonymous visitor adds a view", async () => {
    await assertSucceeds(updateDoc(doc(anon(), BUILD), { views: increment(1) }));
  });

  it("A2: a signed-in visitor likes and unlikes", async () => {
    await assertSucceeds(updateDoc(doc(bob(), BUILD), { likes: increment(1) }));
    await assertSucceeds(updateDoc(doc(bob(), BUILD), { likes: increment(-1) }));
  });

  it("A3: a signed-in visitor votes and withdraws the vote", async () => {
    await assertSucceeds(updateDoc(doc(bob(), BUILD), { upvotes: increment(1) }));
    await assertSucceeds(updateDoc(doc(bob(), BUILD), { upvotes: increment(-1) }));
    await assertSucceeds(updateDoc(doc(bob(), BUILD), { downvotes: increment(1) }));
    await assertSucceeds(updateDoc(doc(bob(), BUILD), { downvotes: increment(-1) }));
  });

  it("A4: a signed-in visitor's comment moves the count by one", async () => {
    await assertSucceeds(updateDoc(doc(bob(), BUILD), { comments: increment(1) }));
    await assertSucceeds(updateDoc(doc(bob(), BUILD), { comments: increment(-1) }));
  });

  it("the author may step a counter like anyone else", async () => {
    await assertSucceeds(updateDoc(doc(alice(), BUILD), { likes: increment(1) }));
  });

  it("A8: a missing counter reads as 0 — upvote needs sign-in, then succeeds", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const legacy = seedBuild();
      delete legacy.upvotes;
      delete legacy.downvotes;
      await setDoc(doc(ctx.firestore(), "builds/legacy"), legacy);
    });
    await assertFails(updateDoc(doc(anon(), "builds/legacy"), { upvotes: increment(1) }));
    await assertSucceeds(updateDoc(doc(bob(), "builds/legacy"), { upvotes: increment(1) }));
  });
});

describe("builds: the author cannot touch counters or scores", () => {
  it("B9: an edit cannot reset views (the stale-editor write)", async () => {
    await assertFails(updateDoc(doc(alice(), BUILD), { title: "Edited", views: 0 }));
  });

  it("B10: the author cannot set the trending score", async () => {
    await assertFails(updateDoc(doc(alice(), BUILD), { score: 99 }));
  });

  it("the author cannot set the all-time score", async () => {
    await assertFails(updateDoc(doc(alice(), BUILD), { scoreAllTime: 99 }));
  });

  it("B11: the author cannot set the trend bookkeeping", async () => {
    await assertFails(updateDoc(doc(alice(), BUILD), { trend: 1e6 }));
    await assertFails(updateDoc(doc(alice(), BUILD), { trendBase: 0 }));
    await assertFails(updateDoc(doc(alice(), BUILD), { trendAt: Timestamp.now() }));
  });

  it("an edit that sends counters unchanged still succeeds", async () => {
    // Unchanged keys are not in affectedKeys(), so a client that still sends
    // the loaded counters is refused only when one has moved meanwhile.
    await assertSucceeds(updateDoc(doc(alice(), BUILD), { title: "Edited", views: 40, likes: 3 }));
  });
});

describe("builds: a new build starts at zero", () => {
  it("A6: the editor's new-build payload", async () => {
    await assertSucceeds(setDoc(doc(bob(), "builds/new"), newBuild("bob")));
  });

  it("A6: a remix payload (no upvotes/downvotes fields)", async () => {
    const remix = newBuild("bob");
    delete remix.upvotes;
    delete remix.downvotes;
    remix.remix = { id: "b1", title: "Seeded build", author: "Alice", authorUid: "alice" };
    await assertSucceeds(setDoc(doc(bob(), "builds/remix"), remix));
  });

  it("B13: a new build cannot start with views", async () => {
    await assertFails(setDoc(doc(bob(), "builds/new"), { ...newBuild("bob"), views: 500 }));
  });

  it("a new build cannot start with a score", async () => {
    await assertFails(setDoc(doc(bob(), "builds/new"), { ...newBuild("bob"), score: 9 }));
  });

  it("B14: a new build cannot carry trend bookkeeping, not even zero", async () => {
    await assertFails(setDoc(doc(bob(), "builds/new"), { ...newBuild("bob"), trendBase: 0 }));
    await assertFails(setDoc(doc(bob(), "builds/new"), { ...newBuild("bob"), trend: 0 }));
  });
});

describe("contributors: totals can only be stepped", () => {
  const ALICE = "contributors/alice";

  it("C1: anyone adds one view", async () => {
    await assertSucceeds(updateDoc(doc(anon(), ALICE), { viewCount: increment(1) }));
  });

  it("C2: nobody adds 1000 views", async () => {
    await assertFails(updateDoc(doc(anon(), ALICE), { viewCount: increment(1000) }));
  });

  it("the contributor cannot add more than one view either", async () => {
    await assertFails(updateDoc(doc(alice(), ALICE), { viewCount: increment(5) }));
  });

  it("C3: the contributor removes a deleted build's views", async () => {
    await assertSucceeds(updateDoc(doc(alice(), ALICE), { viewCount: increment(-340) }));
  });

  it("C4: someone else cannot lower the total", async () => {
    await assertFails(updateDoc(doc(bob(), ALICE), { viewCount: increment(-1) }));
    await assertFails(updateDoc(doc(anon(), ALICE), { viewCount: increment(-1) }));
  });

  it("C5: someone else cannot change the build count", async () => {
    await assertFails(updateDoc(doc(bob(), ALICE), { boCount: increment(1) }));
  });

  it("C6: the contributor's build count moves by one", async () => {
    await assertSucceeds(updateDoc(doc(alice(), ALICE), { boCount: increment(1) }));
    await assertSucceeds(updateDoc(doc(alice(), ALICE), { boCount: increment(-1) }));
  });

  it("C7: not by three", async () => {
    await assertFails(updateDoc(doc(alice(), ALICE), { boCount: increment(3) }));
  });

  it("both totals cannot move in one write", async () => {
    await assertFails(
      updateDoc(doc(alice(), ALICE), { viewCount: increment(1), boCount: increment(1) })
    );
  });
});
