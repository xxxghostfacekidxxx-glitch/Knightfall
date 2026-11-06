// One canonical base deck shared by the backend Worker and the arcade cabinet.
// Keeping the generated answers in one ESM module prevents deck drift.
export {BLACK,WHITE} from "../../public/arcade/hosted/cards-against-chaos/base-deck.js";
