import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDocumentWorkflow } from './useDocumentWorkflow';
import { supabase } from '@/libs/supabase';
import { executeRAR, determineVerdict } from '@/utils/ruleEngine';
import { httpsCallable } from 'firebase/functions';

// 1. Simulação (Mock) das dependências externas
// Vitest interceptará essas importações e usará nossas simulações no lugar.

// Simula o Firebase Functions
const mockProcessDocumentAI = vi.fn();
vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => mockProcessDocumentAI),
}));

// Simula o Supabase
vi.mock('@/libs/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    insert: vi.fn(),
    select: vi.fn().mockResolvedValue({ data: [{ id: 1, rule: 'TEST_RULE' }] }), // Simula a busca de regras
  }
}));

// Simula a store de Toast (Pinia)
vi.mock('@/stores/toast', () => ({
  useToastStore: () => ({
    addToast: vi.fn(),
  }),
}));

// Simula o composable de autenticação
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    user: { value: { id: 'user-123' } },
  }),
}));

// Simula o motor de regras
vi.mock('@/utils/ruleEngine', () => ({
  executeRAR: vi.fn().mockReturnValue([{ rule: 'RULE_OK', passed: true }]),
  determineVerdict: vi.fn().mockReturnValue('Aprovado'),
}));


describe('useDocumentWorkflow', () => {
  // Limpa o estado das simulações antes de cada teste
  beforeEach(() => {
    vi.clearAllMocks();
    // Reseta os mocks para o estado inicial de sucesso
    mockProcessDocumentAI.mockResolvedValue({
      data: {
        documentType: 'Férias', keyFields: [{ field: 'Nome', value: 'John Doe' }]
      }
    });
    vi.mocked(supabase.storage.upload).mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.getPublicUrl).mockReturnValue({ data: { publicUrl: 'http://example.com/test.pdf' }});
    vi.mocked(supabase.insert).mockResolvedValue({ error: null });
  });

  // Função auxiliar para criar um arquivo simulado
  const createMockFile = (name = 'test.pdf', type = 'application/pdf') => {
    const blob = new Blob([''], { type });
    return new File([blob], name, { type });
  };

  it('deve processar o documento com sucesso (caminho feliz)', async () => {
    const { startNewProcess } = useDocumentWorkflow();
    const mockFile = createMockFile();

    const result = await startNewProcess(mockFile, 'process-1', 'Férias');

    // Verificações
    expect(result).toBe(true);
    // Verifica se o upload para o storage foi chamado
    expect(supabase.storage.upload).toHaveBeenCalledWith(expect.any(String), mockFile);
    // Verifica se a Firebase Function foi chamada
    expect(httpsCallable).toHaveBeenCalledWith(undefined, 'processDocumentWithAI');
    expect(mockProcessDocumentAI).toHaveBeenCalledWith({ base64Content: expect.any(String), mimeType: 'application/pdf' });
    // Verifica se as regras foram executadas
    expect(executeRAR).toHaveBeenCalled();
    // Verifica se o resultado foi inserido no banco de dados
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'Aprovado',
          user_id: 'user-123',
          resultado_ia: expect.any(Object),
        }),
      ])
    );
  });

  it('deve retornar falso e lidar com o erro se o upload do arquivo falhar', async () => {
    // Configuração da simulação para o teste de falha
    const uploadError = new Error('Falha no upload');
    vi.mocked(supabase.storage.upload).mockResolvedValue({ error: uploadError });

    const { startNewProcess, error } = useDocumentWorkflow();
    const mockFile = createMockFile();

    const result = await startNewProcess(mockFile, 'process-2', 'Licença');

    // Verificações
    expect(result).toBe(false);
    expect(error.value).toBe(uploadError.message);
    // Garante que o fluxo foi interrompido e não tentou chamar a IA ou inserir no DB
    expect(mockProcessDocumentAI).not.toHaveBeenCalled();
    expect(supabase.insert).not.toHaveBeenCalled();
  });
});