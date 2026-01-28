import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import StatCard from './StatCard.vue';
import { FileText } from 'lucide-vue-next';

describe('StatCard.vue', () => {
  it('renderiza corretamente com props completas', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Total',
        value: 10,
        unit: 'un',
        icon: FileText,
        colorClass: 'text-indigo-400',
        rate: 50,
        rateLabel: 'Crescimento'
      }
    });
    expect(wrapper.text()).toContain('Total');
    expect(wrapper.text()).toContain('10');
  });

  it('NÃO deve quebrar se colorClass for undefined (Bug Fix)', () => {
    // Este teste simula o erro que você estava tendo
    expect(() => {
      mount(StatCard, {
        props: { title: 'Teste Sem Cor', value: 0 }
      });
    }).not.toThrow();
  });
});