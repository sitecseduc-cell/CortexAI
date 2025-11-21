import { describe, it, expect } from 'vitest';
import { safeParse } from './helpers'; // Assumindo que você tem essa função
import { getPriorityConfig } from './priorityHelpers'; // Se criou o arquivo acima

describe('Helpers Suite', () => {
  
  // Teste do Parser JSON (segurança contra dados corrompidos do Firestore)
  it('deve retornar null se o JSON for inválido', () => {
    const badJson = "{ chave: valor sem aspas }"; // JSON quebrado
    const result = safeParse(badJson);
    expect(result).toBeNull();
  });

  it('deve fazer parse de um JSON válido', () => {
    const goodJson = '{"status": "ok"}';
    const result = safeParse(goodJson);
    expect(result).toEqual({ status: "ok" });
  });
});

describe('Regras de Prioridade (GovTech)', () => {
  it('deve marcar Licença Maternidade como alta prioridade', () => {
    const config = getPriorityConfig('MATERNIDADE');
    expect(config.label).toBe('URGENTE');
    expect(config.class).toContain('border-red-500');
  });

  it('deve marcar Férias como prioridade normal', () => {
    const config = getPriorityConfig('FERIAS');
    expect(config.label).toBe('NORMAL');
  });
});