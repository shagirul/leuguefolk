/* All values are public client identifiers, never secret keys.
 * Connected to leaguefolk-2b1c2. VAPID key comes from Cloud Messaging > Web Push certificates.
 * Add vapidPublicKey to enable real web push; other Firebase features do not require it.
 */
self.AGREE_FIREBASE = {
  firebaseConfig: {
    apiKey: "AIzaSyBrIylN0op-5rF-NSdW9tbR7C41RBmmkjU",
    authDomain: "leaguefolk-2b1c2.firebaseapp.com",
    projectId: "leaguefolk-2b1c2",
    storageBucket: "leaguefolk-2b1c2.firebasestorage.app",
    messagingSenderId: "1067470774043",
    appId: "1:1067470774043:web:87427a719e7f07c038fdbe",
    measurementId: "G-YCN6GK0088"
  },
  // Spark deployment uses direct Firestore transactions and Security Rules.
  features: { leaderboards: true, push: false },
  vapidPublicKey: "",
  functionsRegion: "asia-south1"
};
