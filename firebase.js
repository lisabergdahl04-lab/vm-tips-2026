import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDuIMIBH8PhD2e5g6Yn1jLe0vLFnnzahWI",
  authDomain: "vm-tips-9f681.firebaseapp.com",
  projectId: "vm-tips-9f681",
  storageBucket: "vm-tips-9f681.firebasestorage.app",
  messagingSenderId: "790294165729",
  appId: "1:790294165729:web:2b4d96ffa5c908f6555fa0"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  setDoc
};