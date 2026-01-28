import { ref, watchEffect } from 'vue';
import { supabase } from '@/libs/supabase';

/**
 * Hook para buscar dados de uma tabela do Supabase com suporte a Realtime.
 * @param {string} tableName - O nome da tabela.
 * @param {Function} filterFn - Uma função opcional para aplicar filtros à query.
 */
export function useSupabaseCollection(tableName, filterFn = null) {
  const data = ref([]);
  const loading = ref(true);
  const error = ref(null);

  watchEffect(async (onInvalidate) => {
    loading.value = true;
    error.value = null;

    // 1. Busca Inicial
    let query = supabase.from(tableName).select('*').order('created_at', { ascending: false });
    
    // Aplica filtros se fornecidos (ex: filtrar por usuário)
    if (filterFn) {
        query = filterFn(query);
    }

    const { data: result, error: err } = await query;

    if (err) {
      console.error(`Erro ao buscar ${tableName}:`, err);
      error.value = err;
    } else {
      data.value = result || [];
    }
    loading.value = false;

    // 2. Inscrição em Realtime (Ouve Insert/Update/Delete)
    const channel = supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        if (payload.eventType === 'INSERT') {
          data.value.unshift(payload.new);
        } else if (payload.eventType === 'DELETE') {
          data.value = data.value.filter(item => item.id !== payload.old.id);
        } else if (payload.eventType === 'UPDATE') {
          const index = data.value.findIndex(item => item.id === payload.new.id);
          if (index !== -1) data.value[index] = payload.new;
        }
      })
      .subscribe();

    // Limpeza ao desmontar
    onInvalidate(() => {
      supabase.removeChannel(channel);
    });
  });

  return { data, loading, error };
}