// The Firebase Admin SDK to access Firestore and Auth.
const { initializeApp } = require("firebase-admin/app");
initializeApp();

//User related functions
const createUser = require('@/functions/users/createUser');
exports.createUser = createUser.createUser;

const deleteUser = require('@/functions/users/deleteUser');
exports.deleteUser = deleteUser.deleteUser;

const getUsers = require('@/functions/users/getUsers');
exports.getUsers = getUsers.getUsers;

const updateUserDisplayName = require('@/functions/users/updateUserDisplayName');
exports.updateUserDisplayName = updateUserDisplayName.updateUserDisplayName;

//Build related functions
const updateBuildScore = require('@/functions/builds/updateBuildScore');
exports.updateBuildScore = updateBuildScore.updateBuildScore;

const deleteBuild = require('@/functions/builds/deleteBuild');
exports.deleteBuild = deleteBuild.deleteBuild;
