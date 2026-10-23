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
   DEMO: the API key and API SECRET are in this file, so anyone who can open the page can read them.
   TODO before launch: remove apiKey/apiSecret from here, keep them on a server (Supabase Edge Function,
   Netlify function), and regenerate the secret in Cloudinary > API Keys. */
export const cloudinaryConfig = {
  cloudName: "e956iksj",
  uploadPreset: "dashboard_unsigned",
  apiKey: "564552812816849",
  apiSecret: "8QfFh8me0sn9dyFoH-S5-VCG_zU",
  // Used only if direct browser calls to Cloudinary are blocked. Local helper: node server/cloudinary-server.js
  functionUrl: "/.netlify/functions/cloudinary"
};
