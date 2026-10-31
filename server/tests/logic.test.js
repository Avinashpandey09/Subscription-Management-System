// DB-free unit tests for billing/auth logic. Run: npm test
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isEligible, discountAmount } from '../src/services/discount.service.js';
import { canTransition } from '../src/controllers/subscription.controller.js';
import { advanceDate } from '../src/services/billing.service.js';
import { passwordSchema } from '../src/services/auth.service.js';

describe('discount eligibility', () => {
  const now = Date.now();
  const base = {
    startDate: new Date(now - 1000),
    endDate: new Date(now + 86400000),
    usageLimit: 5,
    usedCount: 2,
    minPurchase: 10000,
    minQty: 2,
    type: 'percent',
    value: 10
  };
  it('accepts an eligible discount', () => {
    assert.equal(isEligible(base, { subtotalPaise: 20000, qty: 3 }), true);
  });
  it('rejects below minPurchase / minQty', () => {
    assert.equal(isEligible(base, { subtotalPaise: 5000, qty: 3 }), false);
    assert.equal(isEligible(base, { subtotalPaise: 20000, qty: 1 }), false);
  });
  it('enforces usageLimit, 0 means unlimited', () => {
    assert.equal(isEligible({ ...base, usedCount: 5 }, { subtotalPaise: 20000, qty: 3 }), false);
    assert.equal(isEligible({ ...base, usageLimit: 0, usedCount: 999 }, { subtotalPaise: 20000, qty: 3 }), true);
  });
  it('enforces the validity window', () => {
    assert.equal(
      isEligible({ ...base, endDate: new Date(now - 1000) }, { subtotalPaise: 20000, qty: 3 }),
      false
    );
    assert.equal(
      isEligible({ ...base, startDate: new Date(now + 1000) }, { subtotalPaise: 20000, qty: 3 }),
      false
    );
  });
  it('computes percent and capped fixed amounts', () => {
    assert.equal(discountAmount(base, 20000), 2000);
    assert.equal(discountAmount({ ...base, type: 'fixed', value: 50000 }, 20000), 20000);
  });
});

describe('subscription state machine', () => {
  it('follows Draft -> Quotation -> Confirmed -> Active -> Closed', () => {
    const plan = { pausable: true };
    assert.equal(canTransition('Draft', 'Quotation', plan), true);
    assert.equal(canTransition('Quotation', 'Confirmed', plan), true);
    assert.equal(canTransition('Confirmed', 'Active', plan), true);
    assert.equal(canTransition('Active', 'Closed', plan), true);
    assert.equal(canTransition('Draft', 'Active', plan), false);
    assert.equal(canTransition('Closed', 'Active', plan), false);
  });
  it('gates Paused on plan.pausable', () => {
    assert.equal(canTransition('Active', 'Paused', { pausable: true }), true);
    assert.equal(canTransition('Active', 'Paused', { pausable: false }), false);
  });
});

describe('billing periods', () => {
  const d = new Date('2026-01-15T00:00:00Z');
  it('advances daily/weekly/monthly/yearly', () => {
    assert.equal(advanceDate(d, 'daily').toISOString(), '2026-01-16T00:00:00.000Z');
    assert.equal(advanceDate(d, 'weekly').toISOString(), '2026-01-22T00:00:00.000Z');
    assert.equal(advanceDate(d, 'monthly').toISOString(), '2026-02-15T00:00:00.000Z');
    assert.equal(advanceDate(d, 'yearly').toISOString(), '2027-01-15T00:00:00.000Z');
  });
});

describe('password policy', () => {
  it('accepts compliant passwords', () => {
    passwordSchema.parse('Abcdefg@1');
  });
  it('rejects weak passwords', () => {
    for (const bad of ['short@1A', 'nouppercase@123', 'NOLOWER@123', 'NoSpecial123']) {
      assert.throws(() => passwordSchema.parse(bad), undefined, `should reject ${bad}`);
    }
  });
});
