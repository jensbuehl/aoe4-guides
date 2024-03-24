//External
import { ref } from "vue";
import {
  db,
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
export function collectionService(col) {
  const error = ref(null);

  const add = async (document, id) => {
    error.value = null;

    try {
      const collectionRef = collection(db, col);
      var docRef = null;
      if (id) {
        docRef = doc(collectionRef, id);
        console.log(collectionRef);
      } else {
        docRef = doc(collectionRef);
        console.log(collectionRef);
      }

      document.id = docRef.id;
      document.timeCreated = Timestamp.fromDate(new Date());
      document.timeUpdated = Timestamp.fromDate(new Date());
      await setDoc(docRef, document);

      console.log("Document created with ID: ", docRef.id);
      return docRef.id;
    } catch (err) {
      console.log(err.message);
      error.value = "Document could not be created";
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
      console.log("Document retrieved with ID: ", id);
      return snapshot.data();
    } catch (err) {
      console.log(err.message);
      error.value = "Document could not be retrieved";
    }
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
      console.log("Snapshot retrieved with ID: ", id);
      return snapshot;
    } catch (err) {
      console.log(err.message);
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
      console.log(err.message);
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
  async function decrementNumber(documentId, propertyName) {
    error.value = null;

    try {
      const docRef = doc(db, col, documentId);
      await updateDoc(docRef, {
        [propertyName]: increment(-1),
      });
    } catch (err) {
      console.log(err.message);
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
      console.log(err.message);
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
      console.log(err.message);
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
      console.log(err.message);
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
      console.log(docRef);
      document.timeUpdated = Timestamp.fromDate(new Date());
      if (updateTimestamp) {
        document.timeCreated = Timestamp.fromDate(new Date());
      }
      await updateDoc(docRef, document);
      console.log("Document updated with ID: ", id);
    } catch (err) {
      console.log(err.message);
      error.value = "Document could not be updated";
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
      console.log("Document deleted with ID: ", id);
    } catch (err) {
      console.log(err.message);
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
      console.log(err.message);
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
      console.log(err.message);
      error.value = "Collection size could not be retrieved";
    }
  }

  return {
    error,
    add,
    get,
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
