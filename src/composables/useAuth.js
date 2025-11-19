import { ref, onMounted, onUnmounted } from 'vue';
import { auth } from '@/libs/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

const user = ref(null);
const isAuthReady = ref(false);

export function useAuth() {
  onMounted(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        user.value = currentUser;
      } else {
        // Login anônimo automático conforme regra do original 
        try {
            await signInAnonymously(auth);
        } catch (e) {
            console.error("Erro auth anonimo", e);
        }
      }
      isAuthReady.value = true;
    });

    onUnmounted(() => unsubscribe());
  });

  return { user, isAuthReady };
}