import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC00AKwxkk7hLKJpom_LcXg2VmfxclyqY4",
  authDomain: "ameplay-b29a2.firebaseapp.com",
  databaseURL: "https://ameplay-b29a2-default-rtdb.firebaseio.com",
  projectId: "ameplay-b29a2",
  storageBucket: "ameplay-b29a2.appspot.com",
  messagingSenderId: "361703508567",
  appId: "1:361703508567:web:1441d7fa547d561acbb112",
  measurementId: "G-X7C6FR0ND8"
};

let app;
let auth;
let db;
let realtimeDb;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  realtimeDb = getDatabase(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw new Error("Failed to initialize Firebase services");
}

export { auth, db, realtimeDb };