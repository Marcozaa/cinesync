import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQHf9voq413jeRRPkEtF14Znw-w3ADptQ",
  authDomain: "cine-sync-app.firebaseapp.com",
  databaseURL: "https://cine-sync-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cine-sync-app",
  storageBucket: "cine-sync-app.firebasestorage.app",
  messagingSenderId: "923911193343",
  appId: "1:923911193343:web:2ef9032363ea8270fe02ca",
  measurementId: "G-XR6X0EWEV6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);