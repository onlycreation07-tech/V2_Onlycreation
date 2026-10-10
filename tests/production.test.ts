import { describe, it, expect, beforeEach } from 'vitest';
import { calculateStudioPrice, calculateDispatchPrice, STUDIO_CATALOG, DISPATCH_TIERS } from '../server/controllers/pricingController';
import { 
  acquireBookingLock, 
  releaseBookingLock, 
  confirmBookingLock, 
  getSlotCompositeKey 
} from '../server/controllers/bookingController';
import { 
  getOrCreateServerWallet, 
  creditWalletAndRecordLedgerServer, 
  debitWalletAndRecordLedgerServer 
} from '../server/controllers/paymentController';
import { 
  transitionProjectPhase, 
  addDeliverableVersion 
} from '../server/controllers/projectController';

describe('PHASE 2: Authoritative Pricing Calculations', () => {
  it('calculates studio booking price with 18% GST tax', () => {
    const result = calculateStudioPrice({
      studioId: 'loft-daylight-bandra',
      hours: 4,
      date: '2026-10-15',
      addons: ['lighting_kit_pro']
    });

    const expectedHourly = STUDIO_CATALOG['loft-daylight-bandra'].pricePerHour; // 3500
    const expectedBase = expectedHourly * 4; // 14000
    const expectedAddon = 1500; // lighting_kit_pro
    const expectedSubtotal = expectedBase + expectedAddon; // 15500
    const expectedTax = Math.round(expectedSubtotal * 0.18); // 2790
    const expectedTotal = expectedSubtotal + expectedTax; // 18290

    expect(result.hours).toBe(4);
    expect(result.basePrice).toBe(expectedBase);
    expect(result.addonPrice).toBe(expectedAddon);
    expect(result.subtotal).toBe(expectedSubtotal);
    expect(result.tax).toBe(expectedTax);
    expect(result.totalPrice).toBe(expectedTotal);
    expect(result.currency).toBe('INR');
  });

  it('calculates creator dispatch price with platform fee', () => {
    const result = calculateDispatchPrice({
      creatorTier: 'videographer',
      durationHours: 3,
      equipmentAddons: ['dji_drone_4k']
    });

    const tier = DISPATCH_TIERS['videographer']; // base 6000, hourly 2500
    const expectedBase = tier.basePrice; // 6000
    const expectedHourly = 2500 * 3; // 7500
    const expectedEquip = 2500; // dji_drone_4k
    const expectedSubtotal = expectedBase + expectedHourly + expectedEquip; // 16000
    const expectedFee = Math.round(expectedSubtotal * 0.10); // 1600
    const expectedTotal = expectedSubtotal + expectedFee; // 17600

    expect(result.basePrice).toBe(expectedBase);
    expect(result.hourlyTotal).toBe(expectedHourly);
    expect(result.equipmentTotal).toBe(expectedEquip);
    expect(result.subtotal).toBe(expectedSubtotal);
    expect(result.platformFee).toBe(expectedFee);
    expect(result.totalPrice).toBe(expectedTotal);
  });
});

describe('PHASE 2: Concurrency-Safe Booking Locks', () => {
  const testStudio = 'studio_unit_test';
  const testDate = '2026-11-20';
  const testSlot = 14;

  it('acquires lock for an available slot and prevents collision', () => {
    // User A acquires lock
    const lockA = acquireBookingLock({
      studioId: testStudio,
      date: testDate,
      slotHour: testSlot,
      userId: 'user_alice'
    });

    expect(lockA.lockId).toBeDefined();
    expect(lockA.status).toBe('locked');
    expect(lockA.lockedBy).toBe('user_alice');

    // User B attempts to acquire the exact same slot -> Must throw
    expect(() => {
      acquireBookingLock({
        studioId: testStudio,
        date: testDate,
        slotHour: testSlot,
        userId: 'user_bob'
      });
    }).toThrow(/SLOT_CURRENTLY_RESERVED/);

    // Release lock
    const released = releaseBookingLock(lockA.lockId);
    expect(released).toBe(true);

    // Now User B can acquire the released slot
    const lockB = acquireBookingLock({
      studioId: testStudio,
      date: testDate,
      slotHour: testSlot,
      userId: 'user_bob'
    });
    expect(lockB.lockedBy).toBe('user_bob');

    // Confirm lock permanently
    confirmBookingLock(lockB.lockId, testStudio, testDate, testSlot);

    // Any subsequent lock attempt fails because it is confirmed
    expect(() => {
      acquireBookingLock({
        studioId: testStudio,
        date: testDate,
        slotHour: testSlot,
        userId: 'user_charlie'
      });
    }).toThrow(/SLOT_ALREADY_BOOKED/);
  });
});

describe('PHASE 2: Double-Entry Immutable Ledger', () => {
  const testUser = 'user_ledger_tester_99';

  it('maintains strict balance conservation and prevents overdrafts', () => {
    const wallet = getOrCreateServerWallet(testUser);
    const initialBal = wallet.availableBalance;

    // 1. Credit 10,000 INR
    const credit1 = creditWalletAndRecordLedgerServer({
      uid: testUser,
      amount: 10000,
      type: 'deposit',
      relatedOrderId: 'ord_dep_10000'
    });

    expect(credit1.balanceAfter).toBe(initialBal + 10000);
    expect(wallet.availableBalance).toBe(initialBal + 10000);

    // 2. Debit 4,000 INR for studio booking
    const debit1 = debitWalletAndRecordLedgerServer({
      uid: testUser,
      amount: 4000,
      type: 'booking_payment',
      relatedBookingId: 'bk_studio_4000'
    });

    expect(debit1.balanceAfter).toBe(initialBal + 6000);
    expect(wallet.availableBalance).toBe(initialBal + 6000);

    // 3. Attempt to debit 20,000 INR (more than balance) -> Must reject
    expect(() => {
      debitWalletAndRecordLedgerServer({
        uid: testUser,
        amount: 20000,
        type: 'booking_payment'
      });
    }).toThrow(/INSUFFICIENT_FUNDS/);

    // Balance remains unchanged after rejected transaction
    expect(wallet.availableBalance).toBe(initialBal + 6000);
  });
});

describe('PHASE 5: Project Production State Machine', () => {
  const projId = 'proj_showcase_master';

  it('rejects invalid state jumps and accepts valid progression', () => {
    // Current phase is client_review
    // Cannot jump back to pre_production directly
    expect(() => {
      transitionProjectPhase(projId, 'pre_production', 'admin');
    }).toThrow(/INVALID_TRANSITION/);

    // Can transition from client_review to approved
    const approvedProj = transitionProjectPhase(projId, 'approved', 'client');
    expect(approvedProj.currentPhase).toBe('approved');

    // Terminal phase cannot transition further
    expect(() => {
      transitionProjectPhase(projId, 'ideation', 'admin');
    }).toThrow(/INVALID_TRANSITION/);
  });

  it('appends versioned deliverables with pending status', () => {
    const deliverable = addDeliverableVersion(projId, {
      versionNumber: 'v3.0 Final Master',
      title: 'ProRes 422 HQ Export with Dolby Vision',
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
      changelog: 'Final color grade match and dynamic headroom audio pass',
      uploadedBy: 'colorist_lead'
    });

    expect(deliverable.versionId).toBeDefined();
    expect(deliverable.versionNumber).toBe('v3.0 Final Master');
    expect(deliverable.status).toBe('pending_review');
  });
});
