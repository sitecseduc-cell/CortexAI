import { ref, watchEffect } from 'vue';
import { db } from '@/libs/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

export function useFirestoreCollection(pathRef) {
  const data = ref([]);
  const loading = ref(true);
  const error = ref(null);

  // watchEffect re-executa se o pathRef (que deve ser reativo) mudar
  watchEffect((onInvalidate) => {
    if (!pathRef.value) {
        loading.value = false;
        return;
    }
    
    loading.value = true;
    const q = query(collection(db, pathRef.value));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      data.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Ordenação 
      loading.value = false;
    }, (err) => {
      error.value = err;
      loading.value = false;
    });

    onInvalidate(() => unsubscribe());
  });

  return { data, loading, error };
}