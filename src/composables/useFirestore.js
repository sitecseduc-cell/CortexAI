import { ref, watchEffect } from 'vue';
import { supabase } from '@/libs/supabase';

/**
 * Hook para buscar dados de uma tabela do Supabase com suporte a Realtime.
 * @param {import('vue').Ref<string>} tableNameRef - Ref contendo o nome da tabela (ex: 'processos')
 * @param {Object} queryOptions - Opções de filtro (opcional)
 */
export function useSupabaseCollection(tableNameRef, queryOptions = {}) {
  const data = ref([]);
  const loading = ref(true);
  const error = ref(null);

  watchEffect(async (onInvalidate) => {
    if (!tableNameRef.value) {
        loading.value = false;
        return;
    }

    loading.value = true;
    const table = tableNameRef.value;

    // 1. Busca Inicial
    const fetchData = async () => {
      try {
        let query = supabase.from(table).select('*').order('created_at', { ascending: false });
        
        // Aplica filtros simples se houver (ex: user_id)
        if (queryOptions.userId) {
            query = query.eq('user_id', queryOptions.userId);
        }

        const { data: result, error: err } = await query;
        if (err) throw err;
        data.value = result;
      } catch (err) {
        error.value = err;
        console.error(`Erro ao buscar ${table}:`, err);
      } finally {
        loading.value = false;
      }
    };

    await fetchData();

    // 2. Inscrição em Realtime (Ouve Insert/Update/Delete)
    const channel = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: table }, (payload) => {
        if (payload.eventType === 'INSERT') {
          data.value.unshift(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          const index = data.value.findIndex(item => item.id === payload.new.id);
          if (index !== -1) data.value[index] = payload.new;
        } else if (payload.eventType === 'DELETE') {
          data.value = data.value.filter(item => item.id !== payload.old.id);
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