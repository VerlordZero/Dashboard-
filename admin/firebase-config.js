/* ==========================================================================
   DEMO SETUP. NOT SECURE YET. Lock both sections below before real use.
   ========================================================================== */

/* ---------- FIREBASE (database + file storage) ----------
   DEMO: the Realtime Database rules are OPEN (anyone with the address can read and write).
   TODO before launch: sign-in + proper rules (see firestore.rules, storage.rules). */
export const firebaseConfig = {
  apiKey: "AIzaSyAalTjSYreVdtfah0W-b-gQE6dvw9biniw",
  authDomain: "dtarks-c75b8.firebaseapp.com",
  databaseURL: "https://dtarks-c75b8-default-rtdb.firebaseio.com",
  projectId: "dtarks-c75b8",
  storageBucket: "dtarks-c75b8.firebasestorage.app",
  messagingSenderId: "469572538926",
  appId: "1:469572538926:web:1329782782b44e9f4c05bf",
  measurementId: "G-EMYJEQHNKF"
};

/* ---------- CLOUDINARY (images and videos) ----------
   Uploads use the unsigned preset below (no secret). Listing and deleting go through the helper in server/,
   because Cloudinary blocks browsers from calling its admin service.
   DEMO: the API key and SECRET are written in plain text in server/cloudinary-server.js.
   TODO before launch: move them to a real server secret (Supabase Edge Function, Netlify function)
   and regenerate the secret in Cloudinary > API Keys. */
export const cloudinaryConfig = {
  cloudName: "e956iksj",
  uploadPreset: "dashboard_unsigned",
  // The local helper is at http://localhost:8787 (start it with server/start-helper.bat).
  functionUrl: "/.netlify/functions/cloudinary"
};
