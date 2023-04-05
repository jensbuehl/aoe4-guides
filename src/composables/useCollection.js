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
} from "../firebase";

// declare the connection & refs inside the function
// because the collection state is not global (like a user)
// different collections may be used at once this way

const useCollection = (col) => {
  const error = ref(null);

  const add = async (document, id) => {
    error.value = null;
    var collectionRef = null;

    try {
      if(id){
        collectionRef = collection(db, col, id);
      } else {
        collectionRef = collection(db, col);
      }    
      const docRef = doc(collectionRef);
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

  const get = async (id) => {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      const docSnap = await getDoc(docRef);
      console.log("Document retrieved with ID: ", id);
      return docSnap.data();
    } catch (err) {
      console.log(err.message);
      error.value = "Document could not be retrieved";
    }
  };

  const incrementViews = async (id) => {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      await updateDoc(docRef, {
        views: increment(1),
      });
    } catch (err) {
      console.log(err.message);
      error.value = "Document could not be retrieved";
    }
  };

  const incrementLikes = async (id) => {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      await updateDoc(docRef, {
        likes: increment(1),
      });
    } catch (err) {
      console.log(err.message);
      error.value = "Document could not be retrieved";
    }
  };

  const decrementLikes = async (id) => {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      await updateDoc(docRef, {
        likes: increment(-1),
      });
    } catch (err) {
      console.log(err.message);
      error.value = "Document could not be retrieved";
    }
  };

  const arrayUnionLikes = async (id, array) => {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      await updateDoc(docRef, {
        favorites: arrayUnion(array),
      });
    } catch (err) {
      console.log(err.message);
      error.value = "Favorite could not be added";
    }
  };

  const arrayRemoveLikes = async (id, array) => {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      await updateDoc(docRef, {
        favorites: arrayRemove(array),
      });
    } catch (err) {
      console.log(err.message);
      error.value = "Favorite could not be removed";
    }
  };

  const getAll = async (query) => {
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
  };

  const update = async (id, document) => {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      document.timeUpdated = Timestamp.fromDate(new Date());
      await updateDoc(docRef, document);
      console.log("Document updated with ID: ", id);
    } catch (err) {
      console.log(err.message);
      error.value = "Document could not be updated";
    }
  };

  const del = async (id) => {
    error.value = null;

    try {
      const docRef = doc(db, col, id);
      await deleteDoc(docRef);
      console.log("Document deleted with ID: ", id);
    } catch (err) {
      console.log(err.message);
      error.value = "Document could not be deleted";
    }
  };

  const getQuery = (queryParams) => {
    let buildQuery = query(collection(db, col));
    try {
      queryParams.forEach((element) => {
        buildQuery = query(buildQuery, element);
      });
      return buildQuery;
    } catch (err) {
      console.log(err.message);
    }
  };

  const getSize = async (query) => {
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
  };

  return {
    error,
    add,
    get,
    del,
    getAll,
    update,
    getQuery,
    getSize,
    incrementViews,
    incrementLikes,
    decrementLikes,
    arrayUnionLikes,
    arrayRemoveLikes
  };
};

export default useCollection;
