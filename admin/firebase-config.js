// Firebase web config. These values identify the project and are safe in client code;
// access is protected by Firebase Auth plus firestore.rules and storage.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyAalTjSYreVdtfah0W-b-gQE6dvw9biniw",
  authDomain: "dtarks-c75b8.firebaseapp.com",
  databaseURL: "https://dtarks-c75b8-default-rtdb.firebaseio.com",
  projectId: "dtarks-c75b8",
  storageBucket: "dtarks-c75b8.firebasestorage.app",
  messagingSenderId: "469572538926",
  appId: "1:469572538926:web:1329782782b44e9f4c05bf",
  // Optional defaults for Cloudinary uploads (not secret). Can also be set in Settings, Integrations.
  cloudName: "e956iksj",
  uploadPreset: "dashboard_unsigned",
  functionUrl: "/.netlify/functions/cloudinary", // Netlify function (falls back to the local helper when opened as a file)
  measurementId: "G-EMYJEQHNKF"
};
