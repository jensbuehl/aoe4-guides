// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

//TODO:Clean up deprecated data when users or builds are deleted
// Take the text parameter passed to this HTTP endpoint and insert it into
exports.updateviews = onRequest(async (req, res) => {
  //Update view count here, so that no any user is allowed to update all documents
  logger.log("Update views called!");
});

exports.updatelikes = onRequest(async (req, res) => {
  //Update like count here, so that no any user is allowed to update all documents
  logger.log("Update likes called!");
});

exports.updatevotes = onRequest(async (req, res) => {
  //Update vote count here, so that no any user is allowed to update all documents
  logger.log("Update votes called!");
});

exports.logbuild = onDocumentCreated("/builds/{documentId}", (event) => {
  // Grab the current value of what was written to Firestore.
  const original = event.data.data().original;
  logger.log("Document created", original);
});

// Run once a day at midnight, to update the build score
// Manually run the task here https://console.cloud.google.com/cloudscheduler
exports.updatescore = onSchedule(
  { schedule: "every day 00:00", timeZone: "UTC" },
  async (event) => {
    logger.log("Update score called!");
  }
);
