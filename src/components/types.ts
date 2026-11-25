/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER_SENT = 'transfer_sent',
  TRANSFER_RECEIVED = 'transfer_received',
  CARD_SPEND = 'card_spend',
}

export interface BankTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  merchant: string;
  recipientEmail?: string;
  senderEmail?: string;
  createdAt: string;
  status: TransactionStatus;
}

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  accountNumber?: string;
  routingNumber?: string;
  pinCode?: string;
  isVerified: boolean;
  kycStatus?: 'unsubmitted' | 'pending' | 'approved' | 'rejected';
  isAdmin: boolean;
  isFrozen: boolean;
  isSuspended: boolean;
  biometricsEnabled: boolean;
  currency?: 'USD' | 'EUR' | 'GBP';
  accountType?: 'personal' | 'business' | 'private_wealth';
  businessName?: string;
  primaryFocus?: 'savings_yield' | 'spending_cards' | 'wires_transfers' | 'lending_investing';
  monthlyVolume?: 'under_5k' | '5k_25k' | '25k_100k' | 'over_100k';
  onboardingCompleted?: boolean;
  preProvisionedKey?: string;
  createdAt: string;
}

export interface UserBalance {
  uid: string;
  checking: number;
  savings: number;
  invested?: number;
  updatedAt: string;
}

export interface VirtualCard {
  id: string;
  userId: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  isFrozen: boolean;
  spendingLimit: number;
  spentThisMonth: number;
  cardType: 'platinum' | 'ebony' | 'emerald' | 'physical';
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  autoSaveEnabled: boolean;
  autoSavePercentage: number;
  color: string;
  createdAt: string;
}

export interface BankNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'info' | 'alert' | 'success' | 'system';
  createdAt: string;
}

export interface UserSecuritySettings {
  uid: string;
  faceIdEnabled: boolean;
  webAuthnConfigured: boolean;
  biometricCredentialId?: string | null;
  biometricDeviceName?: string | null;
  pushNotifications: boolean;
  deviceNotificationsEnabled?: boolean;
  notifyTransfers?: boolean;
  notifySecurity?: boolean;
  notifyCards?: boolean;
  emailStatements: boolean;
  twoFactorEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId: string;
  details: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  category: string;
  documentBase64?: string | null;
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface KycSubmission {
  id: string;
  userId: string;
  userEmail: string;
  fullLegalName: string;
  dateOfBirth: string;
  ssnLast4: string;
  address: string;
  documentType: 'passport' | 'drivers_license' | 'national_id';
  idFrontBase64: string;
  idBackBase64?: string | null;
  livenessSelfieBase64: string;
  livenessChallengesPassed: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewerNotes?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PreProvisionedAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountNumber: string;
  routingNumber: string;
  initialChecking: number;
  initialSavings: number;
  currency: 'USD' | 'EUR' | 'GBP';
  isVerified: boolean;
  isAdmin: boolean;
  status: 'pending' | 'claimed';
  createdBy: string;
  claimedByUid?: string | null;
  createdAt: string;
  claimedAt?: string | null;
}

export type LoanType = 'personal' | 'auto' | 'mortgage' | 'business';
export type LoanStatus = 'pending' | 'approved' | 'declined';

export interface LoanApplication {
  id: string;
  userId: string;
  loanType: LoanType;
  amount: number;
  termMonths: number;
  apr: number;
  monthlyPayment: number;
  purpose: string;
  annualIncome: number;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
}

export type InvestmentCategory = 'index_etf' | 'treasury' | 'growth_tech' | 'dividend';
export type InvestmentStatus = 'active' | 'redemption_requested' | 'redeemed';

export interface InvestmentPosition {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  category: InvestmentCategory;
  investedAmount: number;
  expectedYield: number;
  status: InvestmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  senderUid: string;
  senderRole: 'client' | 'admin';
  senderName: string;
  text: string;
  isReadByAdmin: boolean;
  isReadByClient: boolean;
  createdAt: string;
}


