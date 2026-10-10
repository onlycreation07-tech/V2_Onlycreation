import { Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest, BookingLock } from '../types';
import { calculateStudioPrice } from './pricingController';

// In-Memory Fast Atomic Lock Store with TTL (and sync to DB when available)
const activeLocks = new Map<string, BookingLock>();
const confirmedBookings = new Set<string>(); // composite keys: `${studioId}_${date}_${slot}`

// Clean up expired locks every 60 seconds
setInterval(() => {
  const now = new Date().toISOString();
  for (const [key, lock] of activeLocks.entries()) {
    if (lock.status === 'locked' && lock.expiresAt < now) {
      activeLocks.delete(key);
    }
  }
}, 60000);

export function getSlotCompositeKey(studioId: string, date: string, slotHour: number = 0): string {
  return `${studioId.trim().toLowerCase()}_${date.trim()}_slot${slotHour}`;
}

/**
 * Attempts to atomically acquire a lock for a studio date slot.
 * Throws 409 Conflict if already locked or booked.
 */
export function acquireBookingLock(params: {
  studioId: string;
  date: string;
  slotHour?: number;
  userId: string;
  timeoutMinutes?: number;
}): BookingLock {
  const { studioId, date, slotHour = 0, userId, timeoutMinutes = 15 } = params;
  const key = getSlotCompositeKey(studioId, date, slotHour);

  // Check 1: Already permanently booked
  if (confirmedBookings.has(key)) {
    throw new Error('SLOT_ALREADY_BOOKED: This studio slot has already been confirmed and paid for.');
  }

  // Check 2: Active lock by someone else
  const existingLock = activeLocks.get(key);
  const now = new Date();
  if (existingLock && existingLock.status === 'locked') {
    if (new Date(existingLock.expiresAt) > now) {
      if (existingLock.lockedBy !== userId) {
        throw new Error('SLOT_CURRENTLY_RESERVED: Another creator is currently in the checkout flow for this slot. Please try another slot or check back in 15 minutes.');
      }
      // Same user renewing lock
      const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();
      existingLock.expiresAt = expiresAt;
      return existingLock;
    } else {
      activeLocks.delete(key);
    }
  }

  // Acquire fresh lock
  const lockId = `lock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();

  const newLock: BookingLock = {
    lockId,
    studioId,
    date,
    slotHour,
    lockedBy: userId,
    lockedAt: now.toISOString(),
    expiresAt,
    status: 'locked'
  };

  activeLocks.set(key, newLock);
  return newLock;
}

/**
 * Confirms a lock permanently upon payment verification
 */
export function confirmBookingLock(lockId: string, studioId: string, date: string, slotHour: number = 0): void {
  const key = getSlotCompositeKey(studioId, date, slotHour);
  const lock = activeLocks.get(key);
  if (lock && lock.lockId === lockId) {
    lock.status = 'confirmed';
  }
  confirmedBookings.add(key);
}

/**
 * Releases a booking lock if user cancels or payment fails
 */
export function releaseBookingLock(lockId: string): boolean {
  for (const [key, lock] of activeLocks.entries()) {
    if (lock.lockId === lockId) {
      activeLocks.delete(key);
      return true;
    }
  }
  return false;
}

/**
 * Express handler: POST /api/bookings/create-lock
 */
export function handleCreateBookingLock(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.uid;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required to reserve a booking slot' });
  }

  const { studioId, date, slotHour, hours, addons } = req.body;
  if (!studioId || !date) {
    return res.status(400).json({ error: 'studioId and date are required' });
  }

  try {
    // 1. Authoritative price calculation
    const pricing = calculateStudioPrice({
      studioId,
      hours: Number(hours) || 2,
      date,
      addons: Array.isArray(addons) ? addons : []
    });

    // 2. Concurrency-safe atomic lock
    const lock = acquireBookingLock({
      studioId,
      date,
      slotHour: Number(slotHour) || 10,
      userId,
      timeoutMinutes: 15
    });

    return res.json({
      success: true,
      lock,
      pricing,
      message: 'Booking slot locked successfully. Complete checkout within 15 minutes.'
    });
  } catch (err: any) {
    if (err.message.includes('SLOT_ALREADY_BOOKED') || err.message.includes('SLOT_CURRENTLY_RESERVED')) {
      return res.status(409).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message || 'Failed to acquire booking lock' });
  }
}

/**
 * Express handler: POST /api/bookings/release-lock
 */
export function handleReleaseBookingLock(req: AuthenticatedRequest, res: Response) {
  const { lockId } = req.body;
  if (!lockId) {
    return res.status(400).json({ error: 'lockId is required' });
  }

  const released = releaseBookingLock(lockId);
  return res.json({ success: true, released });
}

/**
 * Express handler: GET /api/bookings/check-availability
 */
export function handleCheckAvailability(req: AuthenticatedRequest, res: Response) {
  const { studioId, date } = req.query;
  if (!studioId || !date) {
    return res.status(400).json({ error: 'studioId and date are required' });
  }

  const sid = String(studioId);
  const dt = String(date);
  const now = new Date();

  // Slots from 9:00 to 21:00 (every 2 hours)
  const availableSlots = [];
  const hours = [9, 11, 13, 15, 17, 19];

  for (const h of hours) {
    const key = getSlotCompositeKey(sid, dt, h);
    const isBooked = confirmedBookings.has(key);
    const existingLock = activeLocks.get(key);
    const isLocked = existingLock && existingLock.status === 'locked' && new Date(existingLock.expiresAt) > now;

    availableSlots.push({
      slotHour: h,
      timeLabel: `${h}:00 - ${h + 2}:00`,
      available: !isBooked && !isLocked,
      status: isBooked ? 'booked' : isLocked ? 'reserved' : 'available'
    });
  }

  return res.json({ studioId: sid, date: dt, slots: availableSlots });
}
