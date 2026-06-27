// Tech Verse — Firebase Initialization (compat SDK)

var firebaseConfig = {
    apiKey: "AIzaSyCfOIPrXnHsCtVgXJFWT5ny2ZvpUNbfPFM",
    authDomain: "tech-verse-project-f4ccc.firebaseapp.com",
    projectId: "tech-verse-project-f4ccc",
    storageBucket: "tech-verse-project-f4ccc.firebasestorage.app",
    messagingSenderId: "642149604263",
    appId: "1:642149604263:web:c4daea9a37d566481df482",
    measurementId: "G-JZCCVCJMXK"
};

firebase.initializeApp(firebaseConfig);

window.tvAuth = firebase.auth();
window.tvFirestore = firebase.firestore();
