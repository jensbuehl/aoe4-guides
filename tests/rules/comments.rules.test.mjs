// Firestore rules test: comments are retired (spec 047).
//
// No client may create, read or delete a comment, whoever it is, including the
// comment's own author. The collection's documents are deleted by
// scripts/retire-comments.mjs (Admin SDK, which bypasses rules); these cases
// make sure nothing can put one back.
//
// Run with `npm run test:rules` (emulator, needs Java). `RULES_FILE=<path>`
// runs the same cases against another version, e.g. the deployed rules, where
// every case here must fail: that is what shows they cover the hole.
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import { assertFails, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

let testEnv;
const COMMENT = "comments/c1";

const comment = (authorId) => ({
  buildId: "b1",
  authorId,
  author: authorId,
  text: "Nice build",
  timeCreated: Timestamp.fromMillis(1_700_000_000_000),
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
    await setDoc(doc(ctx.firestore(), COMMENT), comment("alice"));
  });
});

const anon = () => testEnv.unauthenticatedContext().firestore();
const alice = () => testEnv.authenticatedContext("alice", { email_verified: true }).firestore(); // the comment's author
const bob = () => testEnv.authenticatedContext("bob", { email_verified: true }).firestore();

describe("comments are retired (047)", () => {
  it("K1: no one may write a new comment, not even in their own name", async () => {
    await assertFails(setDoc(doc(alice(), "comments/c2"), comment("alice")));
    await assertFails(setDoc(doc(bob(), "comments/c3"), comment("bob")));
    await assertFails(setDoc(doc(anon(), "comments/c4"), comment("anon")));
  });

  it("K2: no one may read a comment", async () => {
    await assertFails(getDoc(doc(anon(), COMMENT)));
    await assertFails(getDoc(doc(bob(), COMMENT)));
    await assertFails(getDoc(doc(alice(), COMMENT)));
  });

  it("K3: no one may delete a comment, not even its author", async () => {
    await assertFails(deleteDoc(doc(alice(), COMMENT)));
    await assertFails(deleteDoc(doc(bob(), COMMENT)));
  });
});
