# Security Specification - OnlyCreation

## 1. Data Invariants
- `brands`: Only the owner of the `userId` can read/write their brand profile.
- `creatives`: Only the owner of the `userId` can read/write their creative.
- `studios`: Publicly readable. Only Admins can write (create/update/delete).
- `config`: Publicly readable. Only Admins can write.

## 2. Admin Verification
- Admins are verified by checking if their UID exists in the `/admins/` collection.
- Super Admin: `onlycreation07@gmail.com` (to be bootstrapped).

## 3. The Dirty Dozen Payloads (Rejection Tests)
1. **Identity Spoofing**: User A trying to create a `brand` for User B.
2. **Studio Poisoning**: Non-admin trying to update a studio's price.
3. **Config Leak**: Non-admin trying to change the `subscriptionPrice`.
4. **Orphaned Creative**: Creating a creative without a `userId`.
5. **ID Poisoning**: Injecting a 2KB string as a `creativeId`.
6. **Price Manipulation**: Admin setting `subscriptionPrice` to a string instead of a number.
7. **Role Escalation**: User trying to write to `/admins/` collection.
8. **Malicious Enum**: Setting studio category to `hack`.
9. **Timestamp Fraud**: Setting `createdAt` to a future date instead of `request.time`.
10. **State Shortcut**: Setting creative status directly to `produced` without any content.
11. **Size Attack**: Sending a `copy` field with 1MB of text.
12. **Public Write**: Trying to write a studio without any auth.
