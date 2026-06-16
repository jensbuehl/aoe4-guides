// One-time developer script to provision admin: true custom claim on designated accounts.
// Run with: GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json node scripts/set-admin-claims.js
// Or via Firebase login: npx firebase-admin-sdk ... (see Firebase Admin SDK docs)
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp();

const ADMIN_UIDS = [
  "beJM1k8sm8TVm5fHQZfKUniL8Hp1",
  "6mzuhMzRCySxaFcaSrXamwHjVm02",
  "zZqq3rZZJZdKPN5TFWBr6jNzJRS2",
];

async function main() {
  const auth = getAuth();
  for (const uid of ADMIN_UIDS) {
    try {
      await auth.setCustomUserClaims(uid, { admin: true });
      console.log(`✓ ${uid}`);
    } catch (err) {
      // UID doesn't exist in this project — skip silently
      console.log(`- ${uid} (not found in this project, skipped)`);
    }
  }
  console.log("Done. Admins must sign out and back in for the claim to take effect.");
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
