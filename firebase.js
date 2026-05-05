// CineVerse Firebase Configuration
// Converted to standard script for local file (file://) support
const firebaseConfig = {
    apiKey: "AIzaSyAlMLhAhPwKgZiTeGWeZiE9MsyrwOc8XIg",
    authDomain: "cineverse-d4485.firebaseapp.com",
    projectId: "cineverse-d4485",
    storageBucket: "cineverse-d4485.firebasestorage.app",
    messagingSenderId: "202365297476",
    appId: "1:202365297476:web:1e92e8f846530fe3f22d11",
    measurementId: "G-K0PK20WK1E"
};

// Initialize Firebase using the global firebase object from the CDN tags
firebase.initializeApp(firebaseConfig);

// Create global references for the app to use
window.auth = firebase.auth();
window.db = firebase.firestore();
window.storage = firebase.storage();
window.provider = new firebase.auth.GoogleAuthProvider();

// Standard Firebase logic aliases
window.collection = (db, coll) => db.collection(coll);
window.addDoc = async (collRef, data) => collRef.add(data);
window.serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
window.signOut = (auth) => auth.signOut();
window.onAuthStateChanged = (auth, callback) => auth.onAuthStateChanged(callback);
window.createUserWithEmailAndPassword = (auth, email, password) => auth.createUserWithEmailAndPassword(email, password);
window.signInWithEmailAndPassword = (auth, email, password) => auth.signInWithEmailAndPassword(email, password);
window.signInWithPopup = (auth, provider) => auth.signInWithPopup(provider);
window.updateProfile = (user, profile) => user.updateProfile(profile);
window.RecaptchaVerifier = firebase.auth.RecaptchaVerifier;
window.signInWithPhoneNumber = (auth, number, verifier) => auth.signInWithPhoneNumber(number, verifier);
