// /lib/clientApp.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";



const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const storage = getStorage(app);

export { db };
