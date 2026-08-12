//External
import { ref } from "vue";
import {
  db,
  appCheck,
  getToken,
  collection,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  query,
  doc,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  getCountFromServer,
} from "@/firebase";

/**
 * A collection service for interacting with a specified collection in the database.
 *
 * @param {string} col - the name of the collection in the database
 * @return {object} an object containing methods for adding, getting, updating, and deleting documents in the collection
 */
/**
 * Maps a Firestore/App Check error to a user-actionable message. Falls back to
 * `fallback` for unknown codes. Keeps the raw code/message for the console.
 *
 * @param {any} err - The caught error (Firestore errors carry a `.code`).
 * @param {string} fallback - Generic message to use when the code is unknown.
 * @return {string} A message the user can act on where possible.
 */
function toUserMessage(err, fallback) {
  switch (err?.code) {
    case "permission-denied":
      // Rules rejection or, very commonly here, an App Check / reCAPTCHA token
      // that could not be obtained (privacy browsers, ad/tracker blockers).
      return "Save was blocked. Please sign out and back in, and disable any ad blocker, tracker blocker, or privacy shield for this site — they can block our bot-protection check.";
    case "unauthenticated":
      return "Your session has expired. Please sign in again and retry.";
    case "unavailable":
      return "Could not reach the server. Check your internet connection and try again.";
    case "resource-exhausted":
      return "The service is temporarily over capacity. Please try again in a little while.";
    case "invalid-argument":
    case "failed-precondition":
      return "This build contains a value we couldn't save. Please remove any unusual formatting and try again, or report it if it persists.";
    default:
      return fallback;
  }
}

/**
 * Runs a Firestore write. If it's rejected because App Check / auth could not
 * attest the request (permission-denied / unauthenticated), forces a fresh
 * App Check token and retries exactly once.
 *
 * This recovers transient failures (an expired token, a momentary reCAPTCHA
 * blip). If the client genuinely cannot produce a token — e.g. reCAPTCHA is
 * blocked by a privacy browser or an ad/tracker blocker — the refresh throws
 * too, and we re-throw the original write error so the caller surfaces a clear
 * message. Either way we fail fast instead of letting the offline cache
 * silently requeue a write that can never sync.
 *
 * @param {() => Promise<any>} op - The write operation to run (and possibly retry).
 * @return {Promise<any>} The result of the successful write.
 */
async function writeWithTokenRetry(op) {
  try {
    return await op();
  } catch (err) {
    if (err?.code !== "permission-denied" && err?.code !== "unauthenticated") {
      throw err;
    }
    try {
      await getToken(appCheck, /* forceRefresh */ true);
    } catch {
      // Couldn't mint a fresh token — surface the original write error so the
      // user gets the "unblock App Check" guidance rather than a token error.
      throw err;
    }
    return await op();
  }
}

export function collectionService(col) {
  const error = ref(null);

  const add = async (document, id) => {
    error.value = null;

    try {
      const collectionRef = collection(db, col);
      var docRef = null;
      if (id) {
        docRef = doc(collectionRef, id);
      } else {
        docRef = doc(collectionRef);
      }

      document.id = docRef.id;
      document.timeCreated = Timestamp.fromDate(new Date());
      document.timeUpdated = Timestamp.fromDate(new Date());
      await writeWithTokenRetry(() => setDoc(docRef, document));

      return docRef.id;
    } catch (err) {
      console.error("collectionService.add failed:", err?.code, err?.message);
      error.value = toUserMessage(err, "Document could not be created");
    }
  };

  /**
   * Retrieves a document from the database by its ID.
   *
   * @param {string} id - The ID of the document to retrieve.
   * @return {Promise<object>} The data of the retrieved document.
   */
  async function get(id) {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      const snapshot = await getDoc(docRef);
      return snapshot.data();
    } catch (err) {
      console.error("collectionService.get failed:", err.message);
      error.value = "Document could not be retrieved";
    }
  }

  /**
   * Reads a document and lets the failure reach the caller.
   *
   * Identical to get() except that it does not swallow. That difference
   * matters: get() returns `undefined` both for "this document does not exist"
   * and for "you were not allowed to read it", and a caller cannot tell the two
   * apart. A build page therefore rendered "Build Order Not Found" for a build
   * that exists perfectly well — which is what Google indexed as a soft 404,
   * and what a reader whose reCAPTCHA is blocked sees today.
   *
   * The write path already treats these as different (toUserMessage,
   * writeWithTokenRetry); the read path never did.
   *
   * A missing document still resolves to `undefined` here — only an actual
   * error throws.
   *
   * @param {string} id - The document id.
   * @return {Promise<any>} The document data, or undefined when it does not exist.
   * @throws {FirebaseError} Whatever Firestore rejected with, `.code` intact.
   */
  async function getOrThrow(id) {
    const snapshot = await getDoc(doc(db, col, id));
    return snapshot.data();
  }

  /**
   * Asynchronously retrieves a snapshot.
   *
   * @param {type} id - The ID of the snapshot to retrieve
   * @return {type} The retrieved snapshot
   */
  async function getSnapshot(id) {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      const snapshot = await getDoc(docRef);
      return snapshot;
    } catch (err) {
      console.error("collectionService.getSnapshot failed:", err.message);
      error.value = "Snapshot could not be retrieved";
    }
  }

  /**
   * Increments the value of a specified property in a document by 1.
   *
   * @param {string} documentId - The ID of the document.
   * @param {string} propertyName - The name of the property to increment.
   * @return {Promise<void>} - A promise that resolves when the increment is successful, or rejects with an error message if it fails.
   */
  async function incrementNumber(documentId, propertyName) {
    error.value = null;

    try {
      const docRef = doc(db, col, documentId);
      await updateDoc(docRef, {
        [propertyName]: increment(1),
      });
    } catch (err) {
      console.error("collectionService.incrementNumber failed:", err.message);
      error.value = "Count could not be incremented";
    }
  }

  /**
   * Decrements the value of a specified property in a document.
   *
   * @param {string} documentId - The ID of the document.
   * @param {string} propertyName - The name of the property to decrement.
   * @return {Promise<void>} - A promise that resolves when the value has been decremented.
   */
  async function decrementNumber(documentId, propertyName, decrementCount = 1) {
    error.value = null;
    const decrementBy = -decrementCount;

    try {
      const docRef = doc(db, col, documentId);
      await updateDoc(docRef, {
        [propertyName]: increment(decrementBy),
      });
    } catch (err) {
      console.error("collectionService.decrementNumber failed:", err.message);
      error.value = "Count could not be decremented";
    }
  }

  /**
   * Asynchronously adds an element to an array in a document.
   *
   * @param {string} documentId - The ID of the document.
   * @param {string} arrayName - The name of the array field.
   * @param {any} element - The element to be added to the array.
   */
  async function addElementToArray(documentId, arrayName, element) {
    error.value = null;

    try {
      const docRef = doc(db, col, documentId);
      await updateDoc(docRef, {
        [arrayName]: arrayUnion(...[element]),
      });
    } catch (err) {
      console.error("collectionService.addElementToArray failed:", err.message);
      error.value = "Element could not be added.";
    }
  }

  /**
   * Remove an element from an array in a specific document.
   *
   * @param {string} documentId - The ID of the document
   * @param {string} arrayName - The name of the array in the document
   * @param {any} element - The element to be removed from the array
   * @return {Promise<void>} A Promise that resolves after the element is removed
   */
  async function removeElementFromArray(documentId, arrayName, element) {
    error.value = null;

    try {
      const docRef = doc(db, col, documentId);
      await updateDoc(docRef, {
        [arrayName]: arrayRemove(...[element]),
      });
    } catch (err) {
      console.error("collectionService.removeElementFromArray failed:", err.message);
      error.value = "Element could not be removed.";
    }
  }

  /**
   * Retrieves all documents from the specified collection based on the given query.
   *
   * @param {Object} query - The query object to filter the documents.
   * @return {Array} An array of document data objects.
   */
  async function getAll(query) {
    error.value = null;
    var snapshot = null;

    try {
      if (query) {
        snapshot = await getDocs(query);
      } else {
        snapshot = await getDocs(collection(db, col));
      }
      return snapshot.docs.map((doc) => doc.data());
    } catch (err) {
      console.error("collectionService.getAll failed:", err.message);
      error.value = "Collection could not be retrieved";
    }
  }

  /**
   * Updates a document in the database with the given ID.
   *
   * @param {string} id - The ID of the document to update.
   * @param {Object} document - The updated document data.
   * @param {boolean} updateTimestamp - Whether to update the creation timestamp.
   * @return {Promise<void>} - A promise that resolves when the document is successfully updated, or rejects with an error message if the update fails.
   */
  async function update(id, document, updateTimestamp) {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      document.timeUpdated = Timestamp.fromDate(new Date());
      if (updateTimestamp) {
        document.timeCreated = Timestamp.fromDate(new Date());
      }
      await writeWithTokenRetry(() => updateDoc(docRef, document));
    } catch (err) {
      console.error("collectionService.update failed:", err?.code, err?.message);
      error.value = toUserMessage(err, "Document could not be updated");
    }
  }

  /**
   * Deletes a document from the database with the given ID.
   *
   * @param {any} id - The ID of the document to be deleted
   * @return {Promise<void>} Promise that resolves once the document is deleted
   */
  async function del(id) {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("collectionService.del failed:", err.message);
      error.value = "Document could not be deleted";
    }
  }

  /**
   * Get the query based on the given query parameters.
   *
   * @param {array} queryParams - The array of query parameters
   * @return {object} The built query based on the given parameters
   */
  function getQuery(queryParams) {
    let buildQuery = query(collection(db, col));
    try {
      queryParams.forEach((element) => {
        buildQuery = query(buildQuery, element);
      });
      return buildQuery;
    } catch (err) {
      console.error("collectionService.getQuery failed:", err.message);
    }
  }

  /**
   * Retrieves the size from the server based on the query or collection.
   *
   * @param {object} query - The query to retrieve the size
   * @return {number} The size retrieved from the server
   */
  async function getSize(query) {
    error.value = null;

    try {
      var snapshot;
      if (query) {
        snapshot = await getCountFromServer(query);
      } else {
        const coll = collection(db, col);
        snapshot = await getCountFromServer(coll);
      }
      return snapshot.data().count;
    } catch (err) {
      console.error("collectionService.getSize failed:", err.message);
      error.value = "Collection size could not be retrieved";
    }
  }

  return {
    error,
    add,
    get,
    getOrThrow,
    getSnapshot,
    del,
    getAll,
    update,
    getQuery,
    getSize,
    addElementToArray,
    removeElementFromArray,
    incrementNumber,
    decrementNumber,
  };
}

export default collectionService;
