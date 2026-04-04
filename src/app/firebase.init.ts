let firebaseReadyPromise: Promise<void> | null = null;

export let auth: import('firebase/auth').Auth;
export let googleProvider: import('firebase/auth').GoogleAuthProvider;
export let db: import('firebase/firestore').Firestore;

export function initFirebase(): Promise<void> {
  if (firebaseReadyPromise) return firebaseReadyPromise;

  firebaseReadyPromise = (async () => {
    const cfgUrl = new URL('firebase-config.json', document.baseURI).toString();
    const res = await fetch(cfgUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load Firebase config');
    const firebaseConfig = await res.json();

    const { initializeApp } = await import('firebase/app');
    const {
      getAuth,
      GoogleAuthProvider,
      setPersistence,
      browserLocalPersistence,
    } = await import('firebase/auth');
    const {
      initializeFirestore,
      persistentLocalCache,
      persistentMultipleTabManager,
    } = await import('firebase/firestore');

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    // This ensures the user stays logged in across refreshes
    await setPersistence(auth, browserLocalPersistence);

    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

    /**
     * CHANGE: Removed getRedirectResult(auth).
     * Since you use a popup, this call is unnecessary on every load 
     * and is the primary trigger for the 403 'getProjectConfig' error 
     * during the background domain handshake.
     */
  })();

  return firebaseReadyPromise;
}
