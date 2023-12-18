// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4EfU9IIiPaxRyLLbeCxdVdtIlsLV5IL4",
  authDomain: "clothingpicker-a7db4.firebaseapp.com",
  projectId: "clothingpicker-a7db4",
  storageBucket: "clothingpicker-a7db4.appspot.com",
  messagingSenderId: "210890738861",
  appId: "1:210890738861:web:e701e42485e2dc3ea74a24"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);