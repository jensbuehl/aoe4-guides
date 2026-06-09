const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore } = require("firebase-admin/firestore");
const { Resend } = require("resend");
const crypto = require("crypto");

const resendApiKey = defineSecret("RESEND_API_KEY");

const COOLDOWN_SECONDS = 3600;
const PREVIEW_MAX_CHARS = 280;
const BASE_URL = "https://aoe4guides.com";
const FROM_EMAIL = "AOE4 GUIDES <noreply@aoe4guides.com>";

function truncate(text, max) {
  if (!text) return "";
  return text.length <= max ? text : text.slice(0, max) + "…";
}

function buildEmailHtml({ commenterName, commentPreview, buildTitle, buildUrl, unsubscribeUrl }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="margin-bottom:4px">New comment on <em>${buildTitle}</em></h2>
  <p style="color:#666;margin-top:0"><strong>${commenterName}</strong> wrote:</p>
  <blockquote style="border-left:3px solid #ccc;margin:0;padding:8px 16px;color:#444">
    ${commentPreview}
  </blockquote>
  <p style="margin-top:24px">
    <a href="${buildUrl}" style="background:#294790;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;font-weight:500">
      View discussion
    </a>
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
  <p style="font-size:12px;color:#999">
    You are receiving this email because you own or have commented on this build order.<br>
    <a href="${unsubscribeUrl}" style="color:#999">Unsubscribe</a> from notifications for this build order.
  </p>
</body>
</html>`;
}

exports.notifyCommenters = onDocumentCreated(
  { document: "comments/{commentId}", secrets: [resendApiKey] },
  async (event) => {
    const comment = event.data.data();
    const { buildId, authorId: commentAuthorId, author: commenterName, text: commentText } = comment;

    const db = getFirestore();

    // Get build to find owner
    const buildSnap = await db.collection("builds").doc(buildId).get();
    if (!buildSnap.exists) return;
    const build = buildSnap.data();
    const buildTitle = build.title || "a build order";
    const buildUrl = `${BASE_URL}/builds/${buildId}`;

    // Build deduped recipient set: owner + all previous commenters - the new commenter
    const recipients = new Set();

    if (build.authorUid && build.authorUid !== commentAuthorId) {
      recipients.add(build.authorUid);
    }

    // Collect previous commenters (Phase 4 — participants)
    const commentsSnap = await db.collection("comments")
      .where("buildId", "==", buildId)
      .get();

    commentsSnap.forEach((doc) => {
      const uid = doc.data().authorId;
      if (uid && uid !== commentAuthorId) {
        recipients.add(uid);
      }
    });

    if (recipients.size === 0) return;

    const now = new Date();
    const resend = new Resend(resendApiKey.value());
    const batch = db.batch();
    let batchHasWrites = false;

    for (const uid of recipients) {
      const userSnap = await db.collection("users").doc(uid).get();
      if (!userSnap.exists) continue;

      const user = userSnap.data();
      if (!user.email) continue;

      const prefs = user.notificationPreferences || {};
      const optedOut = Array.isArray(prefs.optedOut) ? prefs.optedOut : [];
      if (optedOut.includes(buildId)) continue;

      const lastNotifiedStr = (prefs.lastNotifiedAt || {})[buildId];
      if (lastNotifiedStr) {
        const lastNotified = new Date(lastNotifiedStr);
        const elapsed = (now - lastNotified) / 1000;
        if (elapsed < COOLDOWN_SECONDS) continue;
      }

      // Generate token once per user+build if not already stored
      const tokens = prefs.tokens || {};
      const token = tokens[buildId] || crypto.randomBytes(32).toString("hex");
      const unsubscribeUrl = `${BASE_URL}/account/unsubscribe?uid=${uid}&bid=${buildId}&t=${token}`;

      const preview = truncate(commentText, PREVIEW_MAX_CHARS);
      const html = buildEmailHtml({ commenterName, commentPreview: preview, buildTitle, buildUrl, unsubscribeUrl });

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: `New comment on ${buildTitle}`,
          html,
        });
      } catch (err) {
        console.error(`Failed to send notification to ${uid}:`, err);
        continue;
      }

      const userRef = db.collection("users").doc(uid);
      batch.update(userRef, {
        [`notificationPreferences.tokens.${buildId}`]: token,
        [`notificationPreferences.lastNotifiedAt.${buildId}`]: now.toISOString(),
      });
      batchHasWrites = true;
    }

    if (batchHasWrites) {
      await batch.commit();
    }
  }
);
