import { collection, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "../firebase.js";

export function listenToReceivedInvites(userUid, callback) {
  const q = query(collection(firestore, "invites"), where("toUid", "==", userUid));
  return onSnapshot(q, (snapshot) => {
    const invites = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(invites);
  });
}