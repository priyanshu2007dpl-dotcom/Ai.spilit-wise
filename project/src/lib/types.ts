export type GroupCategory = 'trip' | 'friends' | 'roommates' | 'family' | 'office' | 'other';
export type ExpenseCategory = 'food' | 'transport' | 'hotel' | 'shopping' | 'entertainment' | 'groceries' | 'bills' | 'tickets' | 'other';
export type SplitType = 'equal' | 'exact' | 'percentage';
export type SettlementStatus = 'pending' | 'initiated' | 'paid' | 'confirmed' | 'disputed';
export type PaymentMethod = 'upi' | 'qr' | 'bank' | 'cash' | 'other';
export type MemberRole = 'admin' | 'member';
export type NotificationType =
  | 'added_to_group'
  | 'new_expense'
  | 'expense_edited'
  | 'payment_request'
  | 'payment_marked_paid'
  | 'payment_confirmed'
  | 'settlement_reminder';

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  upi_id: string | null;
  qr_code_data: string | null;
  preferred_payment_method: string;
  currency: string;
  notifications_enabled: boolean;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  category: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: Profile;
}

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  paid_by: string;
  category: string;
  split_type: string;
  expense_date: string;
  created_at: string;
  payer?: Profile;
  participants?: ExpenseParticipant[];
}

export interface ExpenseParticipant {
  id: string;
  expense_id: string;
  user_id: string;
  share_amount: number;
  percentage: number;
  profile?: Profile;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: string;
  payment_method: string | null;
  transaction_reference: string | null;
  created_at: string;
  confirmed_at: string | null;
  from_profile?: Profile;
  to_profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  group_id: string | null;
  created_at: string;
}

export interface ParsedExpense {
  amount: number | null;
  description: string | null;
  payerName: string | null;
  participantNames: string[];
  category: ExpenseCategory | null;
  date: string | null;
  needsClarification: boolean;
  clarificationQuestion: string | null;
}

export interface SplitShare {
  userId: string;
  shareAmount: number;
  percentage: number;
}

export interface MemberBalance {
  userId: string;
  paid: number;
  share: number;
  net: number;
}

export interface SettlementTransaction {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'food', label: 'Food', icon: 'Utensils' },
  { value: 'transport', label: 'Transport', icon: 'Car' },
  { value: 'hotel', label: 'Hotel', icon: 'BedDouble' },
  { value: 'shopping', label: 'Shopping', icon: 'ShoppingBag' },
  { value: 'entertainment', label: 'Entertainment', icon: 'Clapperboard' },
  { value: 'groceries', label: 'Groceries', icon: 'ShoppingCart' },
  { value: 'bills', label: 'Bills', icon: 'Receipt' },
  { value: 'tickets', label: 'Tickets', icon: 'Ticket' },
  { value: 'other', label: 'Other', icon: 'Package' },
];

export const GROUP_CATEGORIES: { value: GroupCategory; label: string; icon: string }[] = [
  { value: 'trip', label: 'Trip', icon: 'Plane' },
  { value: 'friends', label: 'Friends', icon: 'Users' },
  { value: 'roommates', label: 'Roommates', icon: 'Home' },
  { value: 'family', label: 'Family', icon: 'Heart' },
  { value: 'office', label: 'Office', icon: 'Briefcase' },
  { value: 'other', label: 'Other', icon: 'Folder' },
];

export const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'qr', label: 'QR Code' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];
