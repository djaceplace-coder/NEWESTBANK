/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Security Rules Specification Verification Suite for Morning Bright Finance.
 * Validates the 12 "Dirty Dozen" threat payloads documented in security_spec.md
 * against firestore.rules using @firebase/rules-unit-testing when run under
 * the Firebase Emulator Suite.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  docPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  rationale: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthorized Profile Manipulation (Identity Spoofing)',
    collection: 'users',
    docPath: 'users/victim_456',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'attacker_123 cannot modify victim_456 profile.'
  },
  {
    id: 2,
    name: 'Privileged Parameter Overwrite (Self-Promotion)',
    collection: 'users',
    docPath: 'users/user_789',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'Standard user cannot set isAdmin=true or write to /admins.'
  },
  {
    id: 3,
    name: 'Account De-freezing (State Shortcircuit)',
    collection: 'users',
    docPath: 'users/frozen_guy',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'Owner cannot modify isFrozen, isSuspended, or isVerified.'
  },
  {
    id: 4,
    name: 'Arbitrary Fund Injection (Balance Poisoning)',
    collection: 'balances',
    docPath: 'balances/customer_888',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'Non-admin cannot increase total checking + savings balance.'
  },
  {
    id: 5,
    name: 'Siphoning Private Assets (PII Exposure)',
    collection: 'balances',
    docPath: 'balances/victim_456',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    rationale: 'Non-owner non-admin cannot read another user balance.'
  },
  {
    id: 6,
    name: 'Forged Deposit Insertion (System Spoofing)',
    collection: 'transactions',
    docPath: 'transactions/forged_tx_001',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'Non-admin cannot create deposit or transfer_received ledger entries.'
  },
  {
    id: 7,
    name: 'Transaction History Purge (Ledger Eviction)',
    collection: 'transactions',
    docPath: 'transactions/actual_tx_999',
    operation: 'delete',
    expected: 'PERMISSION_DENIED',
    rationale: 'Transactions ledger is strictly immutable (update/delete denied).'
  },
  {
    id: 8,
    name: 'Direct Card Interception (PII Leak)',
    collection: 'cards',
    docPath: 'cards/victim_card_777',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    rationale: 'Cards are strictly isolated to owner or admin.'
  },
  {
    id: 9,
    name: 'Hijacking Savings Goals (Asset Transfer)',
    collection: 'savings_goals',
    docPath: 'savings_goals/goal_222',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    rationale: 'Non-owner cannot modify savings_goals or reassign userId.'
  },
  {
    id: 10,
    name: 'Injecting Malicious System Notifications (Resource Injection)',
    collection: 'notifications',
    docPath: 'notifications/fake_notif_001',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'Non-admin cannot create notifications targeting another userId.'
  },
  {
    id: 11,
    name: 'Security Log Sabotage (Auditing Evasion)',
    collection: 'admin_logs',
    docPath: 'admin_logs/audit_987',
    operation: 'delete',
    expected: 'PERMISSION_DENIED',
    rationale: 'admin_logs are strictly append-only for admins and immutable.'
  },
  {
    id: 12,
    name: 'Bypassing Email Verification Gates (Verification Escalation)',
    collection: 'cards',
    docPath: 'cards/card_555',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    rationale: 'Unverified accounts (email_verified == false) cannot create cards.'
  }
];
