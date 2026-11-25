/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import toast from 'react-hot-toast';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import {
  auth,
  db,
  getSecondaryAuth,
  OperationType,
  handleFirestoreError,
  timestampToIso,
  clampString,
  isBootstrappedAdminEmail,
} from './firebase';
import {
  UserProfile,
  UserBalance,
  BankTransaction,
  VirtualCard,
  SavingsGoal,
  BankNotification,
  UserSecuritySettings,
  AdminLog,
  TransactionType,
  TransactionStatus,
  Beneficiary,
  SupportTicket,
  LoanApplication,
  LoanType,
  LoanStatus,
  InvestmentPosition,
  InvestmentCategory,
  ChatMessage,
} from './components/types';

// Hold name during active sign-up so initial profile creation captures exact names
let pendingSignUpNames: { firstName: string; lastName: string } | null = null;

function mapFirebaseAuthError(code?: string, fallback?: string): string {
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in Firebase Console. Enable it under Authentication → Sign-in method → Email/Password.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email address or password. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please wait a moment and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    default:
      return fallback || 'Authentication failed. Please try again.';
  }
}

// Generate safe alphanumeric document IDs matching ^[a-zA-Z0-9_\-]+$
const genId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

const generateAccountNumber = () =>
  Math.floor(1000000000 + Math.random() * 9000000000).toString();

const generateFullCardNumber = () =>
  Array.from({ length: 4 }, () =>
    Math.floor(1000 + Math.random() * 9000).toString(),
  ).join(' ');

// Initial onboarding records (all fields strictly match firebase-blueprint.json & firestore.rules)
const buildInitialTransactions = (userId: string) => [
  {
    id: genId('tx'),
    userId,
    amount: 150.0,
    type: TransactionType.CARD_SPEND,
    merchant: 'Apple Store',
    category: 'Electronics',
    status: TransactionStatus.COMPLETED,
    createdAt: serverTimestamp(),
  },
  {
    id: genId('tx'),
    userId,
    amount: 25.5,
    type: TransactionType.CARD_SPEND,
    merchant: 'Starbucks',
    category: 'Food & Dining',
    status: TransactionStatus.COMPLETED,
    createdAt: serverTimestamp(),
  },
];

const buildInitialCards = (userId: string, fullName: string) => {
  const holder = clampString(fullName.toUpperCase(), 100, 'VALUED CLIENT');
  return [
    {
      id: genId('card'),
      userId,
      cardholderName: holder,
      cardNumber: '4111 1111 1111 1111',
      expiryDate: '12/28',
      cvv: '123',
      isFrozen: false,
      spendingLimit: 10000,
      spentThisMonth: 175.5,
      cardType: 'ebony' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      id: genId('card'),
      userId,
      cardholderName: holder,
      cardNumber: '4242 4242 4242 4242',
      expiryDate: '09/27',
      cvv: '456',
      isFrozen: false,
      spendingLimit: 50000,
      spentThisMonth: 0,
      cardType: 'emerald' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      id: genId('card'),
      userId,
      cardholderName: holder,
      cardNumber: '4532 1123 4432 9982',
      expiryDate: '01/29',
      cvv: '999',
      isFrozen: false,
      spendingLimit: 25000,
      spentThisMonth: 0,
      cardType: 'physical' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  ];
};

const buildInitialSavings = (userId: string) => [
  {
    id: genId('goal'),
    userId,
    title: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 2500,
    color: 'emerald',
    autoSavePercentage: 5,
    autoSaveEnabled: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  {
    id: genId('goal'),
    userId,
    title: 'Vacation',
    targetAmount: 5000,
    currentAmount: 1200,
    color: 'amber',
    autoSavePercentage: 0,
    autoSaveEnabled: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
];

const buildInitialNotifications = (userId: string) => [
  {
    id: genId('notif'),
    userId,
    title: 'Welcome to Morning Bright',
    message: 'Your Firebase-backed banking workspace has been provisioned.',
    type: 'system' as const,
    isRead: false,
    createdAt: serverTimestamp(),
  },
];

// Document-to-TypeScript mappers
const mapUserDoc = (id: string, d: DocumentData): UserProfile => ({
  uid: d.uid || id,
  firstName: d.firstName || 'Valued',
  lastName: d.lastName || 'Client',
  email: d.email || '',
  accountNumber: d.accountNumber,
  routingNumber: d.routingNumber,
  pinCode: d.pinCode || undefined,
  isVerified: Boolean(d.isVerified),
  isAdmin: Boolean(d.isAdmin),
  isFrozen: Boolean(d.isFrozen),
  isSuspended: Boolean(d.isSuspended),
  biometricsEnabled: Boolean(d.biometricsEnabled),
  currency: d.currency || 'USD',
  createdAt: timestampToIso(d.createdAt),
});

const mapBalanceDoc = (id: string, d: DocumentData): UserBalance => ({
  uid: d.uid || id,
  checking: Number(d.checking || 0),
  savings: Number(d.savings || 0),
  updatedAt: timestampToIso(d.updatedAt),
});

const mapTransactionDoc = (id: string, d: DocumentData): BankTransaction => ({
  id: d.id || id,
  userId: d.userId,
  amount: Number(d.amount || 0),
  type: d.type,
  category: d.category || 'General',
  merchant: d.merchant || 'Transaction',
  recipientEmail: d.recipientEmail || undefined,
  senderEmail: d.senderEmail || undefined,
  createdAt: timestampToIso(d.createdAt),
  status: d.status || TransactionStatus.COMPLETED,
});

const mapCardDoc = (id: string, d: DocumentData): VirtualCard => ({
  id: d.id || id,
  userId: d.userId,
  cardholderName: d.cardholderName,
  cardNumber: d.cardNumber,
  expiryDate: d.expiryDate,
  cvv: d.cvv,
  isFrozen: Boolean(d.isFrozen),
  spendingLimit: Number(d.spendingLimit || 0),
  spentThisMonth: Number(d.spentThisMonth || 0),
  cardType: d.cardType || 'ebony',
  createdAt: timestampToIso(d.createdAt),
});

const mapSavingsDoc = (id: string, d: DocumentData): SavingsGoal => ({
  id: d.id || id,
  userId: d.userId,
  title: d.title,
  targetAmount: Number(d.targetAmount || 0),
  currentAmount: Number(d.currentAmount || 0),
  autoSaveEnabled: Boolean(d.autoSaveEnabled),
  autoSavePercentage: Number(d.autoSavePercentage || 0),
  color: d.color || 'emerald',
  createdAt: timestampToIso(d.createdAt),
});

const mapNotificationDoc = (id: string, d: DocumentData): BankNotification => ({
  id: d.id || id,
  userId: d.userId,
  title: d.title,
  message: d.message,
  isRead: Boolean(d.isRead),
  type: d.type || 'info',
  createdAt: timestampToIso(d.createdAt),
});

const mapSettingsDoc = (id: string, d: DocumentData): UserSecuritySettings => ({
  uid: d.uid || id,
  faceIdEnabled: Boolean(d.faceIdEnabled),
  webAuthnConfigured: Boolean(d.webAuthnConfigured),
  pushNotifications: Boolean(d.pushNotifications),
  emailStatements: Boolean(d.emailStatements),
  twoFactorEnabled: Boolean(d.twoFactorEnabled),
  theme: d.theme || 'light',
});

const mapTicketDoc = (id: string, d: DocumentData): SupportTicket => ({
  id: d.id || id,
  userId: d.userId,
  subject: d.subject,
  description: d.description,
  status: d.status || 'open',
  category: d.category || 'general',
  documentBase64: d.documentBase64 || null,
  createdAt: timestampToIso(d.createdAt),
});

const mapBeneficiaryDoc = (id: string, d: DocumentData): Beneficiary => ({
  id: d.id || id,
  userId: d.userId,
  name: d.name,
  email: d.email,
  createdAt: timestampToIso(d.createdAt),
});

const mapAdminLogDoc = (id: string, d: DocumentData): AdminLog => ({
  id: d.id || id,
  adminId: d.adminId,
  adminEmail: d.adminEmail,
  action: d.action,
  targetUserId: d.targetUserId,
  details: d.details,
  timestamp: timestampToIso(d.timestamp),
});

const mapLoanDoc = (id: string, d: DocumentData): LoanApplication => ({
  id: d.id || id,
  userId: d.userId,
  loanType: d.loanType || 'personal',
  amount: Number(d.amount || 0),
  termMonths: Number(d.termMonths || 36),
  apr: Number(d.apr || 6.99),
  monthlyPayment: Number(d.monthlyPayment || 0),
  purpose: d.purpose || '',
  annualIncome: Number(d.annualIncome || 0),
  status: d.status || 'pending',
  createdAt: timestampToIso(d.createdAt),
  updatedAt: timestampToIso(d.updatedAt),
});

const mapInvestmentDoc = (id: string, d: DocumentData): InvestmentPosition => ({
  id: d.id || id,
  userId: d.userId,
  symbol: d.symbol || 'MB500',
  name: d.name || 'Index Fund',
  category: d.category || 'index_etf',
  investedAmount: Number(d.investedAmount || 0),
  expectedYield: Number(d.expectedYield || 0),
  status: d.status || 'active',
  createdAt: timestampToIso(d.createdAt),
  updatedAt: timestampToIso(d.updatedAt),
});

const mapChatMessageDoc = (id: string, d: DocumentData): ChatMessage => ({
  id: d.id || id,
  userId: d.userId,
  senderUid: d.senderUid,
  senderRole: d.senderRole === 'admin' ? 'admin' : 'client',
  senderName: d.senderName || (d.senderRole === 'admin' ? 'Account Management' : 'Client'),
  text: d.text || '',
  isReadByAdmin: Boolean(d.isReadByAdmin),
  isReadByClient: Boolean(d.isReadByClient),
  createdAt: timestampToIso(d.createdAt),
});

const sortByDateDesc = <T extends { createdAt?: string; timestamp?: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
    const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
    return tB - tA;
  });

const sortByDateAsc = <T extends { createdAt?: string; timestamp?: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const tA = new Date(a.createdAt || a.timestamp || 0).getTime();
    const tB = new Date(b.createdAt || b.timestamp || 0).getTime();
    return tA - tB;
  });

interface BankState {
  // Current user state
  user: UserProfile | null;
  balance: UserBalance | null;
  transactions: BankTransaction[];
  cards: VirtualCard[];
  savings: SavingsGoal[];
  notifications: BankNotification[];
  tickets: SupportTicket[];
  settings: UserSecuritySettings | null;
  adminLogs: AdminLog[];
  adminTickets: SupportTicket[];
  usersList: UserProfile[];
  beneficiaries: Beneficiary[];
  loans: LoanApplication[];
  investments: InvestmentPosition[];
  adminLoans: LoanApplication[];
  adminInvestments: InvestmentPosition[];
  chatMessages: ChatMessage[];
  adminChatMessages: ChatMessage[];
  adminSelectedUserBalance: UserBalance | null;
  adminSelectedUserTransactions: BankTransaction[];

  // App context flags
  loading: boolean;
  authChecked: boolean;
  biometricAuthenticated: boolean;
  pwaInstalled: boolean;

  // Error and success notifications
  errorMessage: string | null;
  successMessage: string | null;

  // Listeners unsubs
  listeners: (() => void)[];
  adminListeners: (() => void)[];
  adminSelectedUserListeners: (() => void)[];

  // Actions
  initAuthListener: () => () => void;
  signUpWithEmail: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  logOutUser: () => Promise<void>;
  checkBiometrics: () => Promise<boolean>;
  toggleBiometrics: (enabled: boolean) => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;

  // Realtime loaders
  initRealtimeSubscriptions: (firebaseUser: FirebaseUser) => Promise<void>;
  clearSubscriptions: () => void;
  clearAdminSubscriptions: () => void;
  clearAdminSelectedUserSubscriptions: () => void;

  // Core Financial Methods
  issueTransfer: (
    recipientEmail: string,
    amount: number,
    memo: string,
  ) => Promise<void>;
  addFunds: (amount: number, target: 'checking' | 'savings') => Promise<void>;
  createCard: (
    holder: string,
    cardType: 'platinum' | 'ebony' | 'emerald',
  ) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  toggleCardFrozen: (cardId: string) => Promise<void>;
  updateCardLimit: (cardId: string, limit: number) => Promise<void>;
  createSavingsGoal: (
    title: string,
    target: number,
    color: string,
  ) => Promise<string | undefined>;
  contributeToSavings: (goalId: string, amount: number) => Promise<void>;
  toggleGoalAutoSave: (goalId: string, percentage: number) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  updatePinCode: (pin: string) => Promise<void>;
  updateProfile: (first: string, last: string) => Promise<void>;
  updateCurrency: (currency: 'USD' | 'EUR' | 'GBP') => Promise<void>;
  updateSettingsToggle: (
    key: keyof UserSecuritySettings,
    val: boolean | 'light' | 'dark' | 'system',
  ) => Promise<void>;

  // Beneficiaries
  addBeneficiary: (name: string, email: string) => Promise<void>;
  deleteBeneficiary: (id: string) => Promise<void>;

  // Support Tickets & Management Chat
  loadTickets: () => Promise<void>;
  createTicket: (
    subject: string,
    description: string,
    category: string,
    documentBase64?: string,
  ) => Promise<void>;
  sendChatMessage: (text: string) => Promise<boolean>;
  markClientChatRead: () => Promise<void>;

  // Loans & Investing
  applyForLoan: (
    loanType: LoanType,
    amount: number,
    termMonths: number,
    apr: number,
    monthlyPayment: number,
    purpose: string,
    annualIncome: number,
  ) => Promise<boolean>;
  investFunds: (
    symbol: string,
    name: string,
    category: InvestmentCategory,
    amount: number,
    expectedYield: number,
  ) => Promise<boolean>;
  requestInvestmentRedemption: (investmentId: string) => Promise<void>;

  // Admin Controls
  adminCreateUserAccount: (params: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    initialChecking: number;
    initialSavings: number;
    currency: 'USD' | 'EUR' | 'GBP';
    isVerified: boolean;
    isAdmin: boolean;
  }) => Promise<{ uid: string; accountNumber: string } | null>;
  adminLoadUsers: () => Promise<void>;
  adminGetUserBalance: (userId: string) => Promise<UserBalance | null>;
  adminEditBalance: (
    userId: string,
    checking: number,
    savings: number,
  ) => Promise<void>;
  adminAddSystemTransaction: (
    userId: string,
    amount: number,
    type: TransactionType,
    merchant: string,
    category: string,
  ) => Promise<void>;
  adminVerifyUser: (userId: string, isVerified: boolean) => Promise<void>;
  adminFreezeUser: (userId: string, frozen: boolean) => Promise<void>;
  adminSuspendUser: (userId: string, suspended: boolean) => Promise<void>;
  adminToggleAdminRole: (
    userId: string,
    targetEmail: string,
    makeAdmin: boolean,
  ) => Promise<void>;
  adminPushSystemNotification: (
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'alert' | 'success' | 'system',
  ) => Promise<void>;
  adminBroadcastNotification: (
    title: string,
    message: string,
    type: 'info' | 'alert' | 'success' | 'system',
  ) => Promise<void>;
  adminLoadTickets: () => Promise<void>;
  adminUpdateTicketStatus: (
    ticketId: string,
    status: 'open' | 'in_progress' | 'resolved',
  ) => Promise<void>;
  adminLoadLoans: () => Promise<void>;
  adminUpdateLoanStatus: (
    loanId: string,
    status: LoanStatus,
    fundChecking?: boolean,
  ) => Promise<void>;
  adminLoadInvestments: () => Promise<void>;
  adminSettleRedemption: (investmentId: string) => Promise<void>;
  adminLoadLogs: () => Promise<void>;
  adminLoadChatMessages: () => Promise<void>;
  adminSendChatMessage: (targetUserId: string, text: string) => Promise<boolean>;
  adminMarkUserChatRead: (targetUserId: string) => Promise<void>;
  adminSubscribeSelectedUser: (targetUserId: string) => void;
}

export const useStore = create<BankState>((set, get) => ({
  user: null,
  balance: null,
  transactions: [],
  cards: [],
  savings: [],
  notifications: [],
  tickets: [],
  settings: null,
  adminLogs: [],
  adminTickets: [],
  usersList: [],
  beneficiaries: [],
  loans: [],
  investments: [],
  adminLoans: [],
  adminInvestments: [],
  chatMessages: [],
  adminChatMessages: [],
  adminSelectedUserBalance: null,
  adminSelectedUserTransactions: [],

  loading: false,
  authChecked: false,
  biometricAuthenticated: false,
  pwaInstalled: false,
  errorMessage: null,
  successMessage: null,
  listeners: [],
  adminListeners: [],
  adminSelectedUserListeners: [],

  clearError: () => set({ errorMessage: null }),
  clearSuccess: () => set({ successMessage: null }),

  clearSubscriptions: () => {
    get().listeners.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // ignore unsubscribe errors
      }
    });
    get().clearAdminSubscriptions();
    set({ listeners: [] });
  },

  clearAdminSelectedUserSubscriptions: () => {
    get().adminSelectedUserListeners.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // ignore unsubscribe errors
      }
    });
    set({
      adminSelectedUserListeners: [],
      adminSelectedUserBalance: null,
      adminSelectedUserTransactions: [],
    });
  },

  clearAdminSubscriptions: () => {
    get().adminListeners.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // ignore unsubscribe errors
      }
    });
    get().clearAdminSelectedUserSubscriptions();
    set({ adminListeners: [] });
  },

  initAuthListener: () => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await get().initRealtimeSubscriptions(firebaseUser);
      } else {
        get().clearSubscriptions();
        set({
          user: null,
          balance: null,
          transactions: [],
          cards: [],
          savings: [],
          notifications: [],
          tickets: [],
          settings: null,
          adminLogs: [],
          adminTickets: [],
          usersList: [],
          beneficiaries: [],
          loans: [],
          investments: [],
          adminLoans: [],
          adminInvestments: [],
          chatMessages: [],
          adminChatMessages: [],
          adminSelectedUserBalance: null,
          adminSelectedUserTransactions: [],
          biometricAuthenticated: false,
          authChecked: true,
          loading: false,
        });
      }
    });

    return unsub;
  },

  signUpWithEmail: async (firstName, lastName, email, password) => {
    set({ loading: true, errorMessage: null, successMessage: null });
    const cleanEmail = email.trim().toLowerCase();
    const cleanFirst = clampString(firstName, 80, 'Valued');
    const cleanLast = clampString(lastName, 80, 'Client');
    pendingSignUpNames = { firstName: cleanFirst, lastName: cleanLast };

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateFirebaseProfile(cred.user, {
        displayName: `${cleanFirst} ${cleanLast}`,
      }).catch(() => {});
      // Direct immediate authentication — all verifications are handled in-site (no email confirmation gate)
      set({ loading: false });
      toast.success('Account created — signed in immediately.');
      return true;
    } catch (e: any) {
      pendingSignUpNames = null;
      set({
        loading: false,
        errorMessage: mapFirebaseAuthError(e?.code, e?.message),
      });
      return false;
    }
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true, errorMessage: null, successMessage: null });
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      set({ loading: false });
      return true;
    } catch (e: any) {
      set({
        loading: false,
        errorMessage: mapFirebaseAuthError(e?.code, e?.message),
      });
      return false;
    }
  },

  sendPasswordReset: async (email) => {
    set({ loading: true, errorMessage: null, successMessage: null });
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      set({
        loading: false,
        successMessage: 'Password reset instructions have been sent to your email address.',
      });
      return true;
    } catch (e: any) {
      set({
        loading: false,
        errorMessage: mapFirebaseAuthError(e?.code, e?.message),
      });
      return false;
    }
  },

  logOutUser: async () => {
    get().clearSubscriptions();
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase sign out error:', e);
    }
    set({
      user: null,
      balance: null,
      transactions: [],
      cards: [],
      savings: [],
      notifications: [],
      tickets: [],
      settings: null,
      adminLogs: [],
      adminTickets: [],
      usersList: [],
      beneficiaries: [],
      loans: [],
      investments: [],
      adminLoans: [],
      adminInvestments: [],
      chatMessages: [],
      adminChatMessages: [],
      adminSelectedUserBalance: null,
      adminSelectedUserTransactions: [],
      biometricAuthenticated: false,
      authChecked: true,
      loading: false,
    });
  },

  checkBiometrics: async () => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        set({ biometricAuthenticated: true });
        resolve(true);
      }, 1000);
    });
  },

  toggleBiometrics: async (enabled) => {
    const u = get().user;
    if (!u) return;
    const prev = u;
    set({ user: { ...u, biometricsEnabled: enabled } });
    const path = `users/${u.uid}`;
    try {
      await updateDoc(doc(db, 'users', u.uid), {
        biometricsEnabled: enabled,
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      set({ user: prev });
      toast.error(e.message || 'Failed to update biometric setting');
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  initRealtimeSubscriptions: async (firebaseUser: FirebaseUser) => {
    get().clearSubscriptions();
    const uid = firebaseUser.uid;
    set({ loading: true, errorMessage: null });

    try {
      const userRef = doc(db, 'users', uid);
      const balanceRef = doc(db, 'balances', uid);
      const settingsRef = doc(db, 'settings', uid);
      const adminRef = doc(db, 'admins', uid);

      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, `users/${uid}`);
      }

      const email = firebaseUser.email || '';
      const isVerifiedBootstrapped =
        isBootstrappedAdminEmail(email) && Boolean(firebaseUser.emailVerified);

      // Provision initial user records on first Firebase login
      if (!userSnap.exists()) {
        const displayParts = (firebaseUser.displayName || '').trim().split(/\s+/).filter(Boolean);
        const firstName = clampString(
          pendingSignUpNames?.firstName || displayParts[0] || 'Valued',
          80,
          'Valued',
        );
        const lastName = clampString(
          pendingSignUpNames?.lastName || displayParts.slice(1).join(' ') || 'Client',
          80,
          'Client',
        );
        pendingSignUpNames = null;

        const coreBatch = writeBatch(db);
        coreBatch.set(userRef, {
          uid,
          firstName,
          lastName,
          email: clampString(email, 254, 'client@morningbrightfinance.com'),
          accountNumber: generateAccountNumber(),
          routingNumber: '122105155',
          isVerified: false,
          isAdmin: isVerifiedBootstrapped,
          isFrozen: false,
          isSuspended: false,
          biometricsEnabled: false,
          currency: 'USD',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        coreBatch.set(balanceRef, {
          uid,
          checking: 0,
          savings: 0,
          updatedAt: serverTimestamp(),
        });

        coreBatch.set(settingsRef, {
          uid,
          faceIdEnabled: false,
          webAuthnConfigured: false,
          pushNotifications: true,
          emailStatements: true,
          twoFactorEnabled: false,
          theme: 'light',
          updatedAt: serverTimestamp(),
        });

        if (isVerifiedBootstrapped) {
          coreBatch.set(adminRef, {
            uid,
            email: clampString(email, 254),
            grantedBy: 'system_bootstrap',
            createdAt: serverTimestamp(),
          });
        }

        try {
          await coreBatch.commit();
        } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, `users/${uid}`);
        }

        // Seed initial cards, sample spend history, savings goals, and welcome notification
        const seedBatch = writeBatch(db);
        for (const tx of buildInitialTransactions(uid)) {
          seedBatch.set(doc(db, 'transactions', tx.id), tx);
        }
        for (const card of buildInitialCards(uid, `${firstName} ${lastName}`)) {
          seedBatch.set(doc(db, 'cards', card.id), card);
        }
        for (const goal of buildInitialSavings(uid)) {
          seedBatch.set(doc(db, 'savings_goals', goal.id), goal);
        }
        for (const notif of buildInitialNotifications(uid)) {
          seedBatch.set(doc(db, 'notifications', notif.id), notif);
        }
        try {
          await seedBatch.commit();
        } catch (e) {
          console.warn('Onboarding seed warning:', e);
        }
      } else {
        // Ensure balance, settings, and bootstrapped admin registry exist
        const [balSnap, setSnap] = await Promise.all([
          getDoc(balanceRef),
          getDoc(settingsRef),
        ]);

        const repairBatch = writeBatch(db);
        let needsRepair = false;

        if (!balSnap.exists()) {
          repairBatch.set(balanceRef, {
            uid,
            checking: 0,
            savings: 0,
            updatedAt: serverTimestamp(),
          });
          needsRepair = true;
        }
        if (!setSnap.exists()) {
          repairBatch.set(settingsRef, {
            uid,
            faceIdEnabled: false,
            webAuthnConfigured: false,
            pushNotifications: true,
            emailStatements: true,
            twoFactorEnabled: false,
            theme: 'light',
            updatedAt: serverTimestamp(),
          });
          needsRepair = true;
        }
        if (isVerifiedBootstrapped) {
          const admSnap = await getDoc(adminRef);
          if (!admSnap.exists()) {
            repairBatch.set(adminRef, {
              uid,
              email: clampString(email, 254),
              grantedBy: 'system_bootstrap',
              createdAt: serverTimestamp(),
            });
            needsRepair = true;
          }
          if (!userSnap.data()?.isAdmin) {
            repairBatch.update(userRef, {
              isAdmin: true,
              updatedAt: serverTimestamp(),
            });
            needsRepair = true;
          }
        }

        if (needsRepair) {
          try {
            await repairBatch.commit();
          } catch (e) {
            console.warn('Account record sync warning:', e);
          }
        }
      }

      const unsubs: (() => void)[] = [];
      let initialNotifLoaded = false;
      const seenNotifIds = new Set<string>();

      // 1. User Profile listener
      unsubs.push(
        onSnapshot(
          userRef,
          (snap) => {
            if (!snap.exists()) {
              get().logOutUser();
              return;
            }
            set({
              user: mapUserDoc(snap.id, snap.data()),
              authChecked: true,
              loading: false,
            });
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${uid}`);
          },
        ),
      );

      // 2. Balance listener
      unsubs.push(
        onSnapshot(
          balanceRef,
          (snap) => {
            if (snap.exists()) {
              set({ balance: mapBalanceDoc(snap.id, snap.data()) });
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `balances/${uid}`);
          },
        ),
      );

      // 3. Settings listener
      unsubs.push(
        onSnapshot(
          settingsRef,
          (snap) => {
            if (snap.exists()) {
              set({ settings: mapSettingsDoc(snap.id, snap.data()) });
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `settings/${uid}`);
          },
        ),
      );

      // 4. Transactions listener
      unsubs.push(
        onSnapshot(
          query(collection(db, 'transactions'), where('userId', '==', uid)),
          (snap) => {
            const list = snap.docs.map((d) => mapTransactionDoc(d.id, d.data()));
            set({ transactions: sortByDateDesc(list) });
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'transactions');
          },
        ),
      );

      // 5. Cards listener
      unsubs.push(
        onSnapshot(
          query(collection(db, 'cards'), where('userId', '==', uid)),
          (snap) => {
            const list = snap.docs.map((d) => mapCardDoc(d.id, d.data()));
            set({ cards: sortByDateDesc(list) });
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'cards');
          },
        ),
      );

      // 6. Savings Goals listener
      unsubs.push(
        onSnapshot(
          query(collection(db, 'savings_goals'), where('userId', '==', uid)),
          (snap) => {
            const list = snap.docs.map((d) => mapSavingsDoc(d.id, d.data()));
            set({ savings: sortByDateDesc(list) });
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'savings_goals');
          },
        ),
      );

      // 7. Notifications listener
      unsubs.push(
        onSnapshot(
          query(collection(db, 'notifications'), where('userId', '==', uid)),
          (snap) => {
            const list = sortByDateDesc(
              snap.docs.map((d) => mapNotificationDoc(d.id, d.data())),
            );
            if (initialNotifLoaded) {
              for (const n of list) {
                if (!seenNotifIds.has(n.id) && !n.isRead) {
                  toast.success(n.message, {
                    icon: '🔔',
                    duration: 5000,
                    style: {
                      background: '#0f172a',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                    },
                  });
                }
              }
            }
            list.forEach((n) => seenNotifIds.add(n.id));
            initialNotifLoaded = true;
            set({ notifications: list });
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'notifications');
          },
        ),
      );

      // 8. Beneficiaries listener
      unsubs.push(
        onSnapshot(
          query(collection(db, 'beneficiaries'), where('userId', '==', uid)),
          (snap) => {
            const list = snap.docs.map((d) => mapBeneficiaryDoc(d.id, d.data()));
            set({ beneficiaries: sortByDateDesc(list) });
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'beneficiaries');
          },
        ),
      );

      // 9. User Support Tickets listener
      unsubs.push(
        onSnapshot(
          query(collection(db, 'support_tickets'), where('userId', '==', uid)),
          (snap) => {
            const list = snap.docs.map((d) => mapTicketDoc(d.id, d.data()));
            set({ tickets: sortByDateDesc(list) });
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'support_tickets');
          },
        ),
      );

      // 10. User Loan Applications listener
      unsubs.push(
        onSnapshot(
          query(collection(db, 'loan_applications'), where('userId', '==', uid)),
          (snap) => {
            const list = snap.docs.map((d) => mapLoanDoc(d.id, d.data()));
            set({ loans: sortByDateDesc(list) });
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'loan_applications');
          },
        ),
      );

      // 11. User Investment Positions listener
      unsubs.push(
        onSnapshot(
          query(collection(db, 'investments'), where('userId', '==', uid)),
          (snap) => {
            const list = snap.docs.map((d) => mapInvestmentDoc(d.id, d.data()));
            set({ investments: sortByDateDesc(list) });
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'investments');
          },
        ),
      );

      // 12. User Management Chat listener
      let initialChatLoaded = false;
      const seenChatIds = new Set<string>();
      unsubs.push(
        onSnapshot(
          query(collection(db, 'chat_messages'), where('userId', '==', uid)),
          (snap) => {
            const list = sortByDateAsc(
              snap.docs.map((d) => mapChatMessageDoc(d.id, d.data())),
            );
            if (initialChatLoaded) {
              for (const msg of list) {
                if (!seenChatIds.has(msg.id) && msg.senderRole === 'admin' && !msg.isReadByClient) {
                  toast.success(`Management reply: ${msg.text.slice(0, 72)}${msg.text.length > 72 ? '…' : ''}`, {
                    duration: 5000,
                  });
                }
              }
            }
            list.forEach((m) => seenChatIds.add(m.id));
            initialChatLoaded = true;
            set({ chatMessages: list });
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, 'chat_messages');
          },
        ),
      );

      set({ listeners: unsubs });
    } catch (err: any) {
      set({
        loading: false,
        authChecked: true,
        errorMessage: err?.message || 'Unable to connect to Firestore.',
      });
    }
  },

  // --- Core Financial Methods ---

  issueTransfer: async (recipientEmail, amount, memo) => {
    set({ loading: true, errorMessage: null });
    const currentBalance = get().balance;
    const userObj = get().user;

    if (!currentBalance || !userObj) {
      set({ loading: false, errorMessage: 'Session state incomplete' });
      return;
    }

    if (userObj.isFrozen) {
      set({
        loading: false,
        errorMessage: 'Account is frozen by administrators. Transfers declined.',
      });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      set({ loading: false, errorMessage: 'Transfer amount must be positive.' });
      return;
    }

    if (currentBalance.checking < amount) {
      set({
        loading: false,
        errorMessage: 'Insufficient funds in Checking Account',
      });
      return;
    }

    const txId = genId('tx_s');
    const notifId = genId('notif_dispatch');
    const newChecking = Number((currentBalance.checking - amount).toFixed(2));
    const safeEmail = clampString(recipientEmail, 254, 'recipient@external.net');
    const safeMerchant = clampString(memo || `Transfer to ${safeEmail}`, 160);

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'balances', userObj.uid), {
        checking: newChecking,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        userId: userObj.uid,
        amount,
        type: TransactionType.TRANSFER_SENT,
        category: 'Transfers',
        merchant: safeMerchant,
        recipientEmail: safeEmail,
        status: TransactionStatus.COMPLETED,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: userObj.uid,
        title: 'Transfer Dispatched',
        message: clampString(
          `Your wire of $${amount.toFixed(2)} to ${safeEmail} has been securely authorized.`,
          1000,
        ),
        isRead: false,
        type: 'success',
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      set({ loading: false });
      toast.success(`Dispatched $${amount.toFixed(2)} to ${safeEmail}`);
    } catch (err: any) {
      set({
        loading: false,
        errorMessage: err?.message || 'Error transferring funds',
      });
      handleFirestoreError(err, OperationType.WRITE, `transactions/${txId}`);
    }
  },

  addFunds: async (amount, target) => {
    const curBal = get().balance;
    const u = get().user;
    if (!curBal || !u || amount <= 0) return;

    if (!u.isAdmin) {
      toast.error('Deposits are cleared by administrators after verification.');
      return;
    }

    const updatedVal = Number(
      ((target === 'checking' ? curBal.checking : curBal.savings) + amount).toFixed(2),
    );
    const txId = genId('tx_dep');
    const notifId = genId('notif_dep');

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'balances', u.uid), {
        [target]: updatedVal,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        userId: u.uid,
        amount,
        type: TransactionType.DEPOSIT,
        category: 'Funding',
        merchant: 'Self-External Wire Target',
        status: TransactionStatus.COMPLETED,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: u.uid,
        title: 'External Deposit Cleared',
        message: `Your funding of $${amount.toFixed(2)} into ${target} has cleared.`,
        isRead: false,
        type: 'success',
        createdAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.WRITE, `balances/${u.uid}`);
    }
  },

  createCard: async (holder, cardType) => {
    const u = get().user;
    const bal = get().balance;
    if (!u || !bal) return;

    if (u.isFrozen) {
      toast.error('Account is frozen. Card provisioning is disabled.');
      return;
    }

    if (bal.checking < 50) {
      toast.error('Insufficient balance for $50 card initialization fee.');
      return;
    }

    const cardId = genId('card');
    const txId = genId('tx_card');
    const now = new Date();
    const expiryDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(
      now.getFullYear() + 6,
    ).slice(-2)}`;
    const newChecking = Number((bal.checking - 50).toFixed(2));
    const spendingLimit =
      cardType === 'ebony' ? 50000 : cardType === 'platinum' ? 25000 : 10000;

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'cards', cardId), {
        id: cardId,
        userId: u.uid,
        cardholderName: clampString(holder.toUpperCase(), 100, 'VALUED CLIENT'),
        cardNumber: generateFullCardNumber(),
        expiryDate,
        cvv: String(Math.floor(100 + Math.random() * 900)),
        isFrozen: false,
        spendingLimit,
        spentThisMonth: 0,
        cardType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'balances', u.uid), {
        checking: newChecking,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        userId: u.uid,
        amount: 50,
        type: TransactionType.CARD_SPEND,
        merchant: 'Virtual Card Initialization Fee',
        category: 'Card Provisioning',
        status: TransactionStatus.COMPLETED,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      toast.success('Virtual card provisioned successfully.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to provision card');
      handleFirestoreError(e, OperationType.CREATE, `cards/${cardId}`);
    }
  },

  deleteCard: async (cardId) => {
    try {
      await deleteDoc(doc(db, 'cards', cardId));
      toast.success('Card permanently destroyed.');
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.DELETE, `cards/${cardId}`);
    }
  },

  toggleCardFrozen: async (cardId) => {
    const targetCard = get().cards.find((c) => c.id === cardId);
    if (!targetCard) return;
    const nextFrozen = !targetCard.isFrozen;

    try {
      await updateDoc(doc(db, 'cards', cardId), {
        isFrozen: nextFrozen,
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.UPDATE, `cards/${cardId}`);
    }
  },

  updateCardLimit: async (cardId, limit) => {
    const clampedLimit = Math.min(Math.max(Number(limit) || 100, 100), 1000000);
    try {
      await updateDoc(doc(db, 'cards', cardId), {
        spendingLimit: clampedLimit,
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.UPDATE, `cards/${cardId}`);
    }
  },

  createSavingsGoal: async (title, target, color) => {
    const u = get().user;
    if (!u) return undefined;

    const goalId = genId('goal');
    const safeTarget = Math.min(Math.max(Number(target) || 1, 1), 100000000);

    try {
      await setDoc(doc(db, 'savings_goals', goalId), {
        id: goalId,
        userId: u.uid,
        title: clampString(title, 100, 'Savings Goal'),
        targetAmount: safeTarget,
        currentAmount: 0,
        autoSaveEnabled: false,
        autoSavePercentage: 5,
        color: clampString(color, 32, 'emerald'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Savings goal created.');
      return goalId;
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create savings goal');
      handleFirestoreError(e, OperationType.CREATE, `savings_goals/${goalId}`);
    }
  },

  contributeToSavings: async (goalId, amount) => {
    const u = get().user;
    const b = get().balance;
    const targetGoal = get().savings.find((s) => s.id === goalId);
    if (!u || !b || !targetGoal) return;

    if (u.isFrozen) {
      set({ errorMessage: 'Account is frozen. Savings allocations are disabled.' });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      set({ errorMessage: 'Contribution amount must be positive.' });
      return;
    }

    if (b.checking < amount) {
      set({
        errorMessage: 'Insufficient funds in checking to transfer allocation',
      });
      return;
    }

    const nextGoalVal = Number((targetGoal.currentAmount + amount).toFixed(2));
    const nextChecking = Number((b.checking - amount).toFixed(2));
    const nextSavings = Number((b.savings + amount).toFixed(2));
    const txId = genId('tx_save');

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'savings_goals', goalId), {
        currentAmount: nextGoalVal,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'balances', u.uid), {
        checking: nextChecking,
        savings: nextSavings,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        userId: u.uid,
        amount,
        type: TransactionType.WITHDRAWAL,
        category: 'Savings Allocations',
        merchant: clampString(`Transfer to goal [${targetGoal.title}]`, 160),
        status: TransactionStatus.COMPLETED,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      toast.success(`Allocated $${amount.toFixed(2)} to ${targetGoal.title}`);
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.WRITE, `savings_goals/${goalId}`);
    }
  },

  toggleGoalAutoSave: async (goalId, percentage) => {
    const u = get().user;
    const targetGoal = get().savings.find((s) => s.id === goalId);
    if (!u || !targetGoal) return;

    const nextAuto = !targetGoal.autoSaveEnabled;
    const safePct = Math.min(Math.max(Number(percentage) || 0, 0), 100);

    try {
      await updateDoc(doc(db, 'savings_goals', goalId), {
        autoSaveEnabled: nextAuto,
        autoSavePercentage: safePct,
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.UPDATE, `savings_goals/${goalId}`);
    }
  },

  markNotificationAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    }));
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.UPDATE, `notifications/${id}`);
    }
  },

  updatePinCode: async (pin: string) => {
    const u = get().user;
    if (!u) return;
    if (!/^[0-9]{4}$/.test(pin)) {
      set({ errorMessage: 'Transfer PIN must be exactly 4 numeric digits.' });
      return;
    }

    try {
      await updateDoc(doc(db, 'users', u.uid), {
        pinCode: pin,
        updatedAt: serverTimestamp(),
      });
      set({ errorMessage: null });
    } catch (e: any) {
      set({ errorMessage: e?.message || 'Error updating PIN' });
      handleFirestoreError(e, OperationType.UPDATE, `users/${u.uid}`);
    }
  },

  updateProfile: async (first, last) => {
    const u = get().user;
    if (!u) return;

    const firstName = clampString(first, 80, u.firstName);
    const lastName = clampString(last, 80, u.lastName);

    try {
      await updateDoc(doc(db, 'users', u.uid), {
        firstName,
        lastName,
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.UPDATE, `users/${u.uid}`);
    }
  },

  updateCurrency: async (currency) => {
    const u = get().user;
    if (!u) return;
    try {
      await updateDoc(doc(db, 'users', u.uid), {
        currency,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Currency updated to ${currency}`);
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.UPDATE, `users/${u.uid}`);
    }
  },

  updateSettingsToggle: async (key, val) => {
    const s = get().settings;
    if (!s || key === 'uid') return;

    try {
      await updateDoc(doc(db, 'settings', s.uid), {
        [key]: val,
        updatedAt: serverTimestamp(),
      });
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.UPDATE, `settings/${s.uid}`);
    }
  },

  // --- Beneficiaries ---

  addBeneficiary: async (name, email) => {
    const u = get().user;
    if (!u) return;
    const trimmedName = clampString(name, 120);
    const trimmedEmail = clampString(email.toLowerCase(), 254);
    if (!trimmedName || !trimmedEmail) {
      toast.error('Please enter both a recipient name and email address.');
      return;
    }

    const benId = genId('ben');
    try {
      await setDoc(doc(db, 'beneficiaries', benId), {
        id: benId,
        userId: u.uid,
        name: trimmedName,
        email: trimmedEmail,
        createdAt: serverTimestamp(),
      });
      toast.success(`Saved ${trimmedName} to your directory.`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save beneficiary');
      handleFirestoreError(e, OperationType.CREATE, `beneficiaries/${benId}`);
    }
  },

  deleteBeneficiary: async (id) => {
    try {
      await deleteDoc(doc(db, 'beneficiaries', id));
      toast.success('Beneficiary removed.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove beneficiary');
      handleFirestoreError(e, OperationType.DELETE, `beneficiaries/${id}`);
    }
  },

  // --- Support Tickets ---

  loadTickets: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const snap = await getDocs(
        query(collection(db, 'support_tickets'), where('userId', '==', user.uid)),
      );
      const list = snap.docs.map((d) => mapTicketDoc(d.id, d.data()));
      set({ tickets: sortByDateDesc(list) });
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load tickets');
      handleFirestoreError(e, OperationType.LIST, 'support_tickets');
    }
  },

  createTicket: async (subject, description, category, documentBase64) => {
    const { user } = get();
    if (!user) return;

    if (documentBase64 && documentBase64.length > 880000) {
      toast.error('Attached file exceeds Firestore 900KB document limit. Please upload a smaller image or PDF.');
      return;
    }

    const ticketId = genId('tkt');
    const payload: Record<string, unknown> = {
      id: ticketId,
      userId: user.uid,
      subject: clampString(subject, 160, 'Support Request'),
      description: clampString(description, 4000, 'No description provided.'),
      category: clampString(category, 64, 'general'),
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (documentBase64) {
      payload.documentBase64 = documentBase64;
    }

    try {
      await setDoc(doc(db, 'support_tickets', ticketId), payload);
      toast.success('Support ticket submitted.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create ticket');
      handleFirestoreError(e, OperationType.CREATE, `support_tickets/${ticketId}`);
    }
  },

  sendChatMessage: async (text) => {
    const u = get().user;
    const trimmed = text.trim();
    if (!u || !trimmed) return false;

    const msgId = genId('chat');
    try {
      await setDoc(doc(db, 'chat_messages', msgId), {
        id: msgId,
        userId: u.uid,
        senderUid: u.uid,
        senderRole: 'client',
        senderName: clampString(`${u.firstName} ${u.lastName}`, 120, 'Client'),
        text: clampString(trimmed, 2000),
        isReadByAdmin: false,
        isReadByClient: true,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send message');
      handleFirestoreError(e, OperationType.CREATE, `chat_messages/${msgId}`);
    }
  },

  markClientChatRead: async () => {
    const u = get().user;
    if (!u) return;
    const unread = get().chatMessages.filter(
      (m) => m.senderRole === 'admin' && !m.isReadByClient,
    );
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      for (const m of unread) {
        batch.update(doc(db, 'chat_messages', m.id), {
          isReadByClient: true,
        });
      }
      await batch.commit();
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, 'chat_messages');
    }
  },

  // --- Loans & Investing ---

  applyForLoan: async (
    loanType,
    amount,
    termMonths,
    apr,
    monthlyPayment,
    purpose,
    annualIncome,
  ) => {
    const u = get().user;
    if (!u) return false;

    const safeAmount = Math.min(Math.max(Number(amount) || 500, 500), 5000000);
    const safeTerm = Math.min(Math.max(Math.round(Number(termMonths) || 36), 6), 360);
    const safeApr = Math.min(Math.max(Number(apr) || 6.99, 0), 50);
    const safePayment = Math.min(Math.max(Number(monthlyPayment) || 1, 1), 1000000);
    const safeIncome = Math.min(Math.max(Number(annualIncome) || 0, 0), 1000000000);
    const loanId = genId('loan');
    const notifId = genId('notif_loan');

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'loan_applications', loanId), {
        id: loanId,
        userId: u.uid,
        loanType,
        amount: Number(safeAmount.toFixed(2)),
        termMonths: safeTerm,
        apr: Number(safeApr.toFixed(2)),
        monthlyPayment: Number(safePayment.toFixed(2)),
        purpose: clampString(purpose, 300, 'General Financing'),
        annualIncome: Number(safeIncome.toFixed(2)),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: u.uid,
        title: 'Loan Application Received',
        message: clampString(
          `Your ${loanType} loan application for $${safeAmount.toLocaleString()} is under underwriting review.`,
          1000,
        ),
        isRead: false,
        type: 'info',
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      toast.success('Loan application submitted for review.');
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Failed to submit loan application');
      handleFirestoreError(e, OperationType.CREATE, `loan_applications/${loanId}`);
    }
  },

  investFunds: async (symbol, name, category, amount, expectedYield) => {
    const u = get().user;
    const b = get().balance;
    if (!u || !b) return false;

    if (u.isFrozen) {
      toast.error('Account is frozen. Investment allocations are disabled.');
      return false;
    }

    const safeAmt = Number(Number(amount).toFixed(2));
    if (isNaN(safeAmt) || safeAmt <= 0) {
      toast.error('Investment amount must be positive.');
      return false;
    }
    if (b.checking < safeAmt) {
      toast.error('Insufficient Checking balance for this investment.');
      return false;
    }

    const invId = genId('inv');
    const txId = genId('tx_inv');
    const notifId = genId('notif_inv');
    const nextChecking = Number((b.checking - safeAmt).toFixed(2));

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'balances', u.uid), {
        checking: nextChecking,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'investments', invId), {
        id: invId,
        userId: u.uid,
        symbol: clampString(symbol.toUpperCase(), 16, 'MB500'),
        name: clampString(name, 120, 'Index ETF'),
        category,
        investedAmount: safeAmt,
        expectedYield: Math.min(Math.max(Number(expectedYield) || 0, 0), 100),
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        userId: u.uid,
        amount: safeAmt,
        type: TransactionType.WITHDRAWAL,
        category: 'Investments',
        merchant: clampString(`Buy ${symbol.toUpperCase()} — ${name}`, 160),
        status: TransactionStatus.COMPLETED,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: u.uid,
        title: 'Investment Executed',
        message: clampString(
          `Allocated $${safeAmt.toFixed(2)} into ${symbol.toUpperCase()} (${name}).`,
          1000,
        ),
        isRead: false,
        type: 'success',
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      toast.success(`Invested $${safeAmt.toFixed(2)} in ${symbol.toUpperCase()}.`);
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Failed to execute investment');
      handleFirestoreError(e, OperationType.WRITE, `investments/${invId}`);
    }
  },

  requestInvestmentRedemption: async (investmentId) => {
    const u = get().user;
    const pos = get().investments.find((i) => i.id === investmentId);
    if (!u || !pos || pos.status !== 'active') return;

    const notifId = genId('notif_red');
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'investments', investmentId), {
        status: 'redemption_requested',
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: u.uid,
        title: 'Redemption Queued',
        message: clampString(
          `Redemption request for ${pos.symbol} ($${pos.investedAmount.toFixed(2)}) has been sent for settlement.`,
          1000,
        ),
        isRead: false,
        type: 'info',
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      toast.success(`Redemption requested for ${pos.symbol}.`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to request redemption');
      handleFirestoreError(e, OperationType.UPDATE, `investments/${investmentId}`);
    }
  },

  // --- ADMINISTRATIVE DASHBOARD CONTROLS ---

  adminCreateUserAccount: async ({
    firstName,
    lastName,
    email,
    password,
    initialChecking,
    initialSavings,
    currency,
    isVerified,
    isAdmin,
  }) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin) return null;

    const cleanEmail = email.trim().toLowerCase();
    const cleanFirst = clampString(firstName, 80, 'Valued');
    const cleanLast = clampString(lastName, 80, 'Client');
    const safeChecking = Math.min(Math.max(Number(initialChecking) || 0, 0), 1000000000);
    const safeSavings = Math.min(Math.max(Number(initialSavings) || 0, 0), 1000000000);

    if (!cleanEmail || password.length < 6) {
      toast.error('Provide a valid email and a password of at least 6 characters.');
      return null;
    }

    let newUid = '';
    const secondaryAuth = getSecondaryAuth();
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
      newUid = cred.user.uid;
      await updateFirebaseProfile(cred.user, {
        displayName: `${cleanFirst} ${cleanLast}`,
      }).catch(() => {});
      await signOut(secondaryAuth);
    } catch (e: any) {
      toast.error(mapFirebaseAuthError(e?.code, e?.message));
      return null;
    }

    const accountNumber = generateAccountNumber();
    const logId = genId('log');

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', newUid), {
        uid: newUid,
        firstName: cleanFirst,
        lastName: cleanLast,
        email: clampString(cleanEmail, 254),
        accountNumber,
        routingNumber: '122105155',
        isVerified: Boolean(isVerified),
        isAdmin: Boolean(isAdmin),
        isFrozen: false,
        isSuspended: false,
        biometricsEnabled: false,
        currency,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'balances', newUid), {
        uid: newUid,
        checking: Number(safeChecking.toFixed(2)),
        savings: Number(safeSavings.toFixed(2)),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'settings', newUid), {
        uid: newUid,
        faceIdEnabled: false,
        webAuthnConfigured: false,
        pushNotifications: true,
        emailStatements: true,
        twoFactorEnabled: false,
        theme: 'light',
        updatedAt: serverTimestamp(),
      });
      if (isAdmin) {
        batch.set(doc(db, 'admins', newUid), {
          uid: newUid,
          email: clampString(cleanEmail, 254),
          grantedBy: currentUser.uid,
          createdAt: serverTimestamp(),
        });
      }
      for (const card of buildInitialCards(newUid, `${cleanFirst} ${cleanLast}`)) {
        batch.set(doc(db, 'cards', card.id), card);
      }
      for (const goal of buildInitialSavings(newUid)) {
        batch.set(doc(db, 'savings_goals', goal.id), goal);
      }
      for (const notif of buildInitialNotifications(newUid)) {
        batch.set(doc(db, 'notifications', notif.id), notif);
      }
      if (safeChecking > 0) {
        const txId = genId('tx_open');
        batch.set(doc(db, 'transactions', txId), {
          id: txId,
          userId: newUid,
          amount: Number(safeChecking.toFixed(2)),
          type: TransactionType.DEPOSIT,
          category: 'Funding',
          merchant: 'Opening Account Deposit',
          status: TransactionStatus.COMPLETED,
          createdAt: serverTimestamp(),
        });
      }
      batch.set(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: 'CREATE_USER_ACCOUNT',
        targetUserId: newUid,
        details: clampString(
          `Registered new client account ${cleanEmail} (Checking: $${safeChecking.toFixed(2)}, Savings: $${safeSavings.toFixed(2)}, Verified: ${isVerified})`,
          1000,
        ),
        timestamp: serverTimestamp(),
      });

      await batch.commit();
      toast.success(`Registered ${cleanEmail} — ready for immediate login!`);
      return { uid: newUid, accountNumber };
    } catch (e: any) {
      toast.error(e?.message || 'Auth user created, but Firestore profile write failed.');
      handleFirestoreError(e, OperationType.CREATE, `users/${newUid}`);
    }
  },

  adminLoadUsers: async () => {
    if (!get().user?.isAdmin) return;
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map((d) => mapUserDoc(d.id, d.data()));
      set({ usersList: sortByDateDesc(list) });

      // Attach realtime listener for users list
      const unsub = onSnapshot(
        collection(db, 'users'),
        (liveSnap) => {
          const liveList = liveSnap.docs.map((d) => mapUserDoc(d.id, d.data()));
          set({ usersList: sortByDateDesc(liveList) });
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'users');
        },
      );
      set({ adminListeners: [...get().adminListeners, unsub] });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.LIST, 'users');
    }
  },

  adminGetUserBalance: async (userId: string) => {
    if (!userId) return null;
    try {
      const snap = await getDoc(doc(db, 'balances', userId));
      if (!snap.exists()) return null;
      return mapBalanceDoc(snap.id, snap.data());
    } catch (e: any) {
      handleFirestoreError(e, OperationType.GET, `balances/${userId}`);
    }
  },

  adminEditBalance: async (userId, checking, savings) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin) return;

    const safeChecking = Math.min(Math.max(Number(checking) || 0, 0), 1000000000);
    const safeSavings = Math.min(Math.max(Number(savings) || 0, 0), 1000000000);
    const logId = genId('log');
    const notifId = genId('notif_adj');

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'balances', userId), {
        uid: userId,
        checking: safeChecking,
        savings: safeSavings,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: 'EDIT_BALANCE',
        targetUserId: userId,
        details: `Updated balances: Checking $${safeChecking.toFixed(2)}, Savings $${safeSavings.toFixed(2)}`,
        timestamp: serverTimestamp(),
      });
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        userId,
        title: 'Account Balance Adjusted',
        message: `Your balances have been administratively updated to Checking: $${safeChecking.toFixed(2)}, Savings: $${safeSavings.toFixed(2)}`,
        isRead: false,
        type: 'alert',
        createdAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.WRITE, `balances/${userId}`);
    }
  },

  adminAddSystemTransaction: async (userId, amount, type, merchant, category) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin || amount <= 0) return;

    const txId = genId('tx_adm');
    const logId = genId('log');

    try {
      const balSnap = await getDoc(doc(db, 'balances', userId));
      const existingChecking = balSnap.exists() ? Number(balSnap.data().checking || 0) : 0;
      const existingSavings = balSnap.exists() ? Number(balSnap.data().savings || 0) : 0;

      let newChecking = existingChecking;
      if (type === TransactionType.DEPOSIT || type === TransactionType.TRANSFER_RECEIVED) {
        newChecking = Number((existingChecking + amount).toFixed(2));
      } else {
        newChecking = Math.max(0, Number((existingChecking - amount).toFixed(2)));
      }

      const batch = writeBatch(db);
      batch.set(doc(db, 'balances', userId), {
        uid: userId,
        checking: newChecking,
        savings: existingSavings,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        userId,
        amount,
        type,
        category: clampString(category, 80, 'Adjustment'),
        merchant: clampString(merchant, 160, 'System Transaction'),
        status: TransactionStatus.COMPLETED,
        createdAt: serverTimestamp(),
      });
      const notifId = genId('notif_tx_adm');
      const isCredit =
        type === TransactionType.DEPOSIT || type === TransactionType.TRANSFER_RECEIVED;
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        userId,
        title: isCredit ? 'Account Credited' : 'Account Debited',
        message: clampString(
          `${isCredit ? '+' : '-'}$${amount.toFixed(2)} — ${merchant} (${category}). New checking balance: $${newChecking.toFixed(2)}.`,
          1000,
        ),
        isRead: false,
        type: isCredit ? 'success' : 'info',
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: 'INSERT_TRANSACTION',
        targetUserId: userId,
        details: clampString(
          `Injected transaction: $${amount.toFixed(2)} [${type}] at ${merchant}`,
          1000,
        ),
        timestamp: serverTimestamp(),
      });
      await batch.commit();
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.CREATE, `transactions/${txId}`);
    }
  },

  adminVerifyUser: async (userId, isVerified) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin) return;
    const logId = genId('log');

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', userId), {
        isVerified,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: isVerified ? 'VERIFY_USER' : 'UNVERIFY_USER',
        targetUserId: userId,
        details: `${isVerified ? 'Approved KYC' : 'Revoked KYC'} for user`,
        timestamp: serverTimestamp(),
      });
      await batch.commit();
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  },

  adminFreezeUser: async (userId, frozen) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin) return;
    const logId = genId('log');

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', userId), {
        isFrozen: frozen,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: frozen ? 'FREEZE_USER' : 'UNFREEZE_USER',
        targetUserId: userId,
        details: `${frozen ? 'Froze' : 'Unfroze'} transaction channels and card capabilities`,
        timestamp: serverTimestamp(),
      });
      await batch.commit();
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  },

  adminSuspendUser: async (userId, suspended) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin) return;
    const logId = genId('log');

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', userId), {
        isSuspended: suspended,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: suspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
        targetUserId: userId,
        details: `${suspended ? 'Suspended' : 'Reactivated'} user access`,
        timestamp: serverTimestamp(),
      });
      await batch.commit();
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  },

  adminToggleAdminRole: async (userId, targetEmail, makeAdmin) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin) return;
    if (userId === currentUser.uid && !makeAdmin) {
      toast.error('You cannot revoke your own administrator privileges.');
      return;
    }

    const logId = genId('log');
    try {
      const adminDocRef = doc(db, 'admins', userId);
      const admSnap = await getDoc(adminDocRef);

      const batch = writeBatch(db);
      batch.update(doc(db, 'users', userId), {
        isAdmin: makeAdmin,
        updatedAt: serverTimestamp(),
      });
      if (makeAdmin && !admSnap.exists()) {
        batch.set(adminDocRef, {
          uid: userId,
          email: clampString(targetEmail, 254),
          grantedBy: currentUser.uid,
          createdAt: serverTimestamp(),
        });
      } else if (!makeAdmin && admSnap.exists()) {
        batch.delete(adminDocRef);
      }
      batch.set(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: makeAdmin ? 'GRANT_ADMIN' : 'REVOKE_ADMIN',
        targetUserId: userId,
        details: `${makeAdmin ? 'Promoted to' : 'Revoked'} system administrator (${targetEmail})`,
        timestamp: serverTimestamp(),
      });
      await batch.commit();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update admin role');
      handleFirestoreError(e, OperationType.WRITE, `admins/${userId}`);
    }
  },

  adminPushSystemNotification: async (userId, title, message, type) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin) return;
    const notifId = genId('notif_adm');
    const logId = genId('log');

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        userId,
        title: clampString(title, 140, 'System Alert'),
        message: clampString(message, 1000),
        isRead: false,
        type,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: 'PUSH_NOTIFICATION',
        targetUserId: userId,
        details: clampString(`Dispatched direct notify message: "${title}"`, 1000),
        timestamp: serverTimestamp(),
      });
      await batch.commit();
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.CREATE, `notifications/${notifId}`);
    }
  },

  adminBroadcastNotification: async (title, message, type) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin) return;
    const logId = genId('log');

    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const userIds = usersSnap.docs.map((d) => d.id);

      // Chunk writes to respect Firestore 500-write batch limit
      const chunkSize = 400;
      for (let i = 0; i < userIds.length; i += chunkSize) {
        const chunk = userIds.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        for (const uid of chunk) {
          const notifId = genId('notif_bc');
          batch.set(doc(db, 'notifications', notifId), {
            id: notifId,
            userId: uid,
            title: clampString(title, 140, 'System Broadcast'),
            message: clampString(message, 1000),
            isRead: false,
            type,
            createdAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }

      await setDoc(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: 'BROADCAST_NOTIFICATION',
        targetUserId: 'ALL_USERS',
        details: clampString(`Broadcast message: "${title}" to ${userIds.length} users`, 1000),
        timestamp: serverTimestamp(),
      });
    } catch (e: any) {
      toast.error(e?.message || 'Broadcast failed');
      handleFirestoreError(e, OperationType.WRITE, 'notifications');
    }
  },

  adminLoadTickets: async () => {
    if (!get().user?.isAdmin) return;
    try {
      const unsub = onSnapshot(
        collection(db, 'support_tickets'),
        (snap) => {
          const list = snap.docs.map((d) => mapTicketDoc(d.id, d.data()));
          set({ adminTickets: sortByDateDesc(list) });
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'support_tickets');
        },
      );
      set({ adminListeners: [...get().adminListeners, unsub] });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.LIST, 'support_tickets');
    }
  },

  adminUpdateTicketStatus: async (ticketId, status) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin) return;
    const logId = genId('log');

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'support_tickets', ticketId), {
        status,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: 'TICKET_UPDATE',
        targetUserId: 'system_ticket',
        details: clampString(`Updated ticket ${ticketId} to status ${status}`, 1000),
        timestamp: serverTimestamp(),
      });
      await batch.commit();
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
      handleFirestoreError(e, OperationType.UPDATE, `support_tickets/${ticketId}`);
    }
  },

  adminLoadLoans: async () => {
    if (!get().user?.isAdmin) return;
    try {
      const unsub = onSnapshot(
        collection(db, 'loan_applications'),
        (snap) => {
          const list = snap.docs.map((d) => mapLoanDoc(d.id, d.data()));
          set({ adminLoans: sortByDateDesc(list) });
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'loan_applications');
        },
      );
      set({ adminListeners: [...get().adminListeners, unsub] });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.LIST, 'loan_applications');
    }
  },

  adminUpdateLoanStatus: async (loanId, status, fundChecking = false) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin) return;
    const loan = get().adminLoans.find((l) => l.id === loanId);
    if (!loan) return;
    const logId = genId('log');
    const notifId = genId('notif_loan_res');

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'loan_applications', loanId), {
        status,
        updatedAt: serverTimestamp(),
      });

      if (status === 'approved' && fundChecking) {
        const balSnap = await getDoc(doc(db, 'balances', loan.userId));
        const existingChecking = balSnap.exists() ? Number(balSnap.data().checking || 0) : 0;
        const existingSavings = balSnap.exists() ? Number(balSnap.data().savings || 0) : 0;
        const nextChecking = Number((existingChecking + loan.amount).toFixed(2));
        const txId = genId('tx_loan');

        batch.set(doc(db, 'balances', loan.userId), {
          uid: loan.userId,
          checking: nextChecking,
          savings: existingSavings,
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, 'transactions', txId), {
          id: txId,
          userId: loan.userId,
          amount: loan.amount,
          type: TransactionType.DEPOSIT,
          category: 'Loan Disbursement',
          merchant: clampString(`Approved ${loan.loanType.toUpperCase()} Loan Disbursement`, 160),
          status: TransactionStatus.COMPLETED,
          createdAt: serverTimestamp(),
        });
      }

      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: loan.userId,
        title: status === 'approved' ? 'Loan Approved!' : 'Loan Application Update',
        message: clampString(
          status === 'approved'
            ? `Your ${loan.loanType} loan of $${loan.amount.toLocaleString()} has been approved${fundChecking ? ' and disbursed to your checking account' : ''}.`
            : `Your ${loan.loanType} loan application status was updated to ${status}.`,
          1000,
        ),
        isRead: false,
        type: status === 'approved' ? 'success' : 'alert',
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: 'LOAN_DECISION',
        targetUserId: loan.userId,
        details: clampString(
          `Updated loan ${loanId} ($${loan.amount}) to ${status}${fundChecking ? ' + disbursed' : ''}`,
          1000,
        ),
        timestamp: serverTimestamp(),
      });
      await batch.commit();
      toast.success(`Loan marked as ${status}.`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update loan status');
      handleFirestoreError(e, OperationType.UPDATE, `loan_applications/${loanId}`);
    }
  },

  adminLoadInvestments: async () => {
    if (!get().user?.isAdmin) return;
    try {
      const unsub = onSnapshot(
        collection(db, 'investments'),
        (snap) => {
          const list = snap.docs.map((d) => mapInvestmentDoc(d.id, d.data()));
          set({ adminInvestments: sortByDateDesc(list) });
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'investments');
        },
      );
      set({ adminListeners: [...get().adminListeners, unsub] });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.LIST, 'investments');
    }
  },

  adminSettleRedemption: async (investmentId) => {
    const currentUser = get().user;
    if (!currentUser?.isAdmin) return;
    const pos = get().adminInvestments.find((i) => i.id === investmentId);
    if (!pos || pos.status === 'redeemed') return;
    const logId = genId('log');
    const txId = genId('tx_inv_red');
    const notifId = genId('notif_inv_red');

    try {
      const balSnap = await getDoc(doc(db, 'balances', pos.userId));
      const existingChecking = balSnap.exists() ? Number(balSnap.data().checking || 0) : 0;
      const existingSavings = balSnap.exists() ? Number(balSnap.data().savings || 0) : 0;
      const nextChecking = Number((existingChecking + pos.investedAmount).toFixed(2));

      const batch = writeBatch(db);
      batch.update(doc(db, 'investments', investmentId), {
        status: 'redeemed',
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'balances', pos.userId), {
        uid: pos.userId,
        checking: nextChecking,
        savings: existingSavings,
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'transactions', txId), {
        id: txId,
        userId: pos.userId,
        amount: pos.investedAmount,
        type: TransactionType.DEPOSIT,
        category: 'Investments',
        merchant: clampString(`Redemption Settlement — ${pos.symbol}`, 160),
        status: TransactionStatus.COMPLETED,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: pos.userId,
        title: 'Investment Redeemed',
        message: clampString(
          `Your ${pos.symbol} position ($${pos.investedAmount.toFixed(2)}) has settled into your checking account.`,
          1000,
        ),
        isRead: false,
        type: 'success',
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'admin_logs', logId), {
        id: logId,
        adminId: currentUser.uid,
        adminEmail: clampString(currentUser.email, 254),
        action: 'SETTLE_INVESTMENT_REDEMPTION',
        targetUserId: pos.userId,
        details: clampString(
          `Settled redemption of ${pos.symbol} ($${pos.investedAmount.toFixed(2)}) to checking`,
          1000,
        ),
        timestamp: serverTimestamp(),
      });
      await batch.commit();
      toast.success(`Settled ${pos.symbol} redemption to client checking.`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to settle redemption');
      handleFirestoreError(e, OperationType.UPDATE, `investments/${investmentId}`);
    }
  },

  adminLoadLogs: async () => {
    if (!get().user?.isAdmin) return;
    try {
      const unsub = onSnapshot(
        collection(db, 'admin_logs'),
        (snap) => {
          const list = snap.docs.map((d) => mapAdminLogDoc(d.id, d.data()));
          set({ adminLogs: sortByDateDesc(list) });
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'admin_logs');
        },
      );
      set({ adminListeners: [...get().adminListeners, unsub] });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.LIST, 'admin_logs');
    }
  },

  adminLoadChatMessages: async () => {
    if (!get().user?.isAdmin) return;
    try {
      const unsub = onSnapshot(
        collection(db, 'chat_messages'),
        (snap) => {
          const list = sortByDateAsc(
            snap.docs.map((d) => mapChatMessageDoc(d.id, d.data())),
          );
          set({ adminChatMessages: list });
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'chat_messages');
        },
      );
      set({ adminListeners: [...get().adminListeners, unsub] });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.LIST, 'chat_messages');
    }
  },

  adminSendChatMessage: async (targetUserId, text) => {
    const currentUser = get().user;
    const trimmed = text.trim();
    if (!currentUser?.isAdmin || !targetUserId || !trimmed) return false;

    const msgId = genId('chat_adm');
    const notifId = genId('notif_chat');
    const senderName = clampString(
      `${currentUser.firstName} ${currentUser.lastName} (Management)`,
      120,
      'Account Management',
    );

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'chat_messages', msgId), {
        id: msgId,
        userId: targetUserId,
        senderUid: currentUser.uid,
        senderRole: 'admin',
        senderName,
        text: clampString(trimmed, 2000),
        isReadByAdmin: true,
        isReadByClient: false,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: targetUserId,
        title: 'New Message from Management',
        message: clampString(trimmed, 1000),
        isRead: false,
        type: 'info',
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      return true;
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send reply');
      handleFirestoreError(e, OperationType.CREATE, `chat_messages/${msgId}`);
    }
  },

  adminMarkUserChatRead: async (targetUserId) => {
    if (!get().user?.isAdmin || !targetUserId) return;
    const unread = get().adminChatMessages.filter(
      (m) => m.userId === targetUserId && m.senderRole === 'client' && !m.isReadByAdmin,
    );
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      for (const m of unread) {
        batch.update(doc(db, 'chat_messages', m.id), {
          isReadByAdmin: true,
        });
      }
      await batch.commit();
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, 'chat_messages');
    }
  },

  adminSubscribeSelectedUser: (targetUserId) => {
    get().clearAdminSelectedUserSubscriptions();
    if (!get().user?.isAdmin || !targetUserId) return;

    const unsubs: (() => void)[] = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'balances', targetUserId),
        (snap) => {
          if (snap.exists()) {
            set({ adminSelectedUserBalance: mapBalanceDoc(snap.id, snap.data()) });
          } else {
            set({
              adminSelectedUserBalance: {
                uid: targetUserId,
                checking: 0,
                savings: 0,
                updatedAt: new Date().toISOString(),
              },
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `balances/${targetUserId}`);
        },
      ),
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'transactions'), where('userId', '==', targetUserId)),
        (snap) => {
          const list = snap.docs.map((d) => mapTransactionDoc(d.id, d.data()));
          set({ adminSelectedUserTransactions: sortByDateDesc(list) });
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'transactions');
        },
      ),
    );

    set({ adminSelectedUserListeners: unsubs });
  },
}));
