import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Lê a configuração do .env.local
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// --- DETECÇÃO DE AMBIENTE DE DESENVOLVIMENTO ---
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log("🔧 Usando Emuladores Firebase Locais");
    
    // Conecta ao Firestore Emulator (Porta padrão 8080)
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    
    // Conecta ao Auth Emulator (Porta padrão 9099)
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    
    // Conecta ao Storage Emulator (Porta padrão 9199)
    connectStorageEmulator(storage, '127.0.0.1', 9199);
}

export { db, auth, app, storage };