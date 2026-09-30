import { beforeEach, describe, expect, it } from 'vitest';
import { clearPendingPlan, consumePendingPlan, peekPendingPlan, setPendingPlan } from './pendingPlan';

describe('pendingPlan', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('mémorise puis relit le code du plan choisi', () => {
    setPendingPlan('pro');
    expect(peekPendingPlan()).toBe('pro');
  });

  it('renvoie null quand aucun plan n’a été choisi', () => {
    expect(peekPendingPlan()).toBeNull();
  });

  it('consumePendingPlan lit ET efface en un seul appel', () => {
    setPendingPlan('standard');
    expect(consumePendingPlan()).toBe('standard');
    expect(peekPendingPlan()).toBeNull();
  });

  it('consumePendingPlan renvoie null sans erreur si rien n’était mémorisé', () => {
    expect(consumePendingPlan()).toBeNull();
  });

  it('clearPendingPlan efface une valeur existante', () => {
    setPendingPlan('pro');
    clearPendingPlan();
    expect(peekPendingPlan()).toBeNull();
  });

  it('un nouveau choix remplace le précédent', () => {
    setPendingPlan('standard');
    setPendingPlan('pro');
    expect(peekPendingPlan()).toBe('pro');
  });
});
