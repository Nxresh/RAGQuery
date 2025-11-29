import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDPgulVdBfKn5-37hj3DzJsBtok3ALfqCA",
    authDomain: "ragquery-ddb60.firebaseapp.com",
    projectId: "ragquery-ddb60",
    storageBucket: "ragquery-ddb60.firebasestorage.app",
    messagingSenderId: "593026023874",
    appId: "1:593026023874:web:4c66a8a1c94c174a5a165b",
    measurementId: "G-BJQ19XME2W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;
