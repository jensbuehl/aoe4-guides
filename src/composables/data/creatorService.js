//Composables
import useCollection from "@/composables/data/useCollection";
const { getAll, get, add } = useCollection("creators");

/**
 * Retrieves creators from the server.
 *
 * @return {Promise} A promise that resolves with the retrieved creators.
 */
export async function getCreators() {
  getAll();
}

/**
 * Retrieves a creator by their ID.
 *
 * @param {number} id - The ID of the creator to retrieve.
 * @return {Promise} A promise that resolves to the creator object.
 */
export async function getCreator(id) {
  get(id);
}

/**
 * Add a creator with custom ID.
 *
 * @param {any} creator - The creator to add.
 * @param {any} customId - The custom ID to assign to the creator.
 * @return {Promise<void>} 
 */
export async function addCreator(creator, customId) {
  add(creator, customId);
}
