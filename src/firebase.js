// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC4htwD1Xi9mfOhL6le3wxQkIYoX8-cGUg",
  authDomain: "searchlab-bec59.firebaseapp.com",
  projectId: "searchlab-bec59",
  storageBucket: "searchlab-bec59.firebasestorage.app",
  messagingSenderId: "734729409959",
  appId: "1:734729409959:web:e9f2d1a8f99f65767c9282"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
