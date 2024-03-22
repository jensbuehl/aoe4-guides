// The Firebase Admin SDK to access Firestore and Auth.
const { initializeApp } = require("firebase-admin/app");
initializeApp();

//User related functions
const createUser = require('./users/createUser');
exports.createUser = createUser.createUser;

const deleteUser = require('./users/deleteUser');
exports.deleteUser = deleteUser.deleteUser;

const getUsers = require('./users/getUsers');
exports.getUsers = getUsers.getUsers;

const updateUserDisplayName = require('./users/updateUserDisplayName');
exports.updateUserDisplayName = updateUserDisplayName.updateUserDisplayName;

//Build related functions
const updateBuildScore = require('./builds/updateBuildScore');
exports.updateBuildScore = updateBuildScore.updateBuildScore;

const updateBuildAllTimeScore = require('./builds/updateBuildAllTimeScore');
exports.updateBuildAllTimeScore = updateBuildAllTimeScore.updateBuildAllTimeScore;
