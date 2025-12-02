import { describe, it, expect } from 'vitest';
import { safeParse, getStatusDisplay } from './helpers';

describe('Helpers - safeParse', () => {
  it('deve retornar null para input inválido ou nulo', () => {
    expect(safeParse(null)).toBeNull();
    expect(safeParse(undefined)).toBeNull();
    expect(safeParse('')).toBeNull();
    expect(safeParse('{ json quebrado }')).toBeNull();
  });

  it('deve parsear JSON válido corretamente', () => {
    const json = '{"nome": "Teste", "valor": 123}';
    expect(safeParse(json)).toEqual({ nome: "Teste", valor: 123 });
  });

  it('deve retornar o objeto se o input já for um objeto', () => {
    const obj = { id: 1 };
    expect(safeParse(obj)).toEqual(obj); // Identidade ou igualdade
  });
});

describe('Helpers - getStatusDisplay', () => {
  it('deve retornar configuração correta para status conhecidos', () => {
    const aprovado = getStatusDisplay('Aprovado');
    expect(aprovado.text).toBe('Aprovado');
    expect(aprovado.color).toContain('green');
  });

  it('deve retornar fallback seguro para status desconhecido', () => {
    const desconhecido = getStatusDisplay('Status_Inexistente_123');
    expect(desconhecido.text).toBe('Desconhecido');
    expect(desconhecido.color).toBe('text-gray-400');
  });
});