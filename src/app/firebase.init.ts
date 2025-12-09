let firebaseReadyPromise: Promise<void> | null = null;

export let auth: import('firebase/auth').Auth;
export let googleProvider: import('firebase/auth').GoogleAuthProvider;
export let db: import('firebase/firestore').Firestore;

export function initFirebase(): Promise<void> {
  if (firebaseReadyPromise) return firebaseReadyPromise;

  firebaseReadyPromise = (async () => {
    // Resolve against current base href so it works under subpaths
    const cfgUrl = new URL('firebase-config.json', document.baseURI).toString();
    const res = await fetch(cfgUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load Firebase config');
    const firebaseConfig = await res.json();

    const { initializeApp } = await import('firebase/app');
    const {
      getAuth,
      GoogleAuthProvider,
      getRedirectResult,
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
    await setPersistence(auth, browserLocalPersistence);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

    // Complete redirect-based login if applicable (mobile-friendly flow)
    try {
      const result = await getRedirectResult(auth);
      // If needed, you could expose the result via a callback or a shared signal.
      // For now, auth state listener elsewhere will pick up the user.
    } catch {
      // Swallow redirect completion errors; auth state listener will remain consistent.
    }
  })();

  return firebaseReadyPromise;
}
