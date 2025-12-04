import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '@/libs/supabase';

// A single user ref to be shared across the application
const user = ref(null);

export function useAuth() {
  // The auth listener subscription
  let authListener = null;

  // Function to handle auth state changes
  const handleAuthStateChange = (_event, session) => {
    user.value = session?.user ?? null;
  };

  onMounted(() => {
    // Listen for changes to the auth state
    const { data: listener } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    authListener = listener;
  });

  onUnmounted(() => {
    // Stop listening for auth changes when the component is unmounted
    authListener?.subscription?.unsubscribe();
  });

  // Return the reactive user object
  return { user };
}