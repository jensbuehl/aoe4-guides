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

const useCollection = (col) => {
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

    const get = async (id) => {
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
    };

    const getSnapshot = async (id) => {
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
    };

    const incrementNumber = async (documentId, propertyName) => {
      error.value = null;

        try {
            const docRef = doc(db, col, documentId);
            await updateDoc(docRef, {
                [propertyName]: increment(1),
            });
        } catch (err) {
            console.log(err.message);
            error.value = "Like count could not be incremented";
        }
    };

    const decrementNumber = async (documentId, propertyName) => {
      error.value = null;

        try {
            const docRef = doc(db, col, documentId);
            await updateDoc(docRef, {
                [propertyName]: increment(-1),
            });
        } catch (err) {
            console.log(err.message);
            error.value = "Like count could not be incremented";
        }
    };

    const addElementToArray = async (documentId, arrayName, element) => {
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
    };

    const removeElementFromArray = async (documentId, arrayName, element) => {
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

    const update = async (id, document, updateTimestamp) => {
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
        getSnapshot,
        del,
        getAll,
        update,
        getQuery,
        getSize,
        addElementToArray,
        removeElementFromArray,
        incrementNumber,
        decrementNumber
    };
};

export default useCollection;
