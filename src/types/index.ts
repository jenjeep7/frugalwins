export interface UserProfile {
  id?: string;
  userId: string;
  displayName: string;
  age?: number;
  phoneNumber?: string;
  bio?: string;
  savingsGoalReason?: string;
  biggestSpendingCategory?: string;
  monthlySavingsTarget?: number;
  avgCoffeesPerWeek?: number;
  avgDiningOutPerWeek?: number;
  avgShoppingPerWeek?: number;
  avgEntertainmentPerWeek?: number;
  isProfileComplete: boolean;
  profileCompletedDate?: Date;
  dateCreated: Date;
}

export interface NonSpend {
  id?: string;
  userId: string;
  description: string;
  amountSaved: number;
  category: string;
  dateCreated: Date;
}

export interface Challenge {
  id?: string;
  userId: string;
  amount: number; // 50 or 100
  currentSavings: number;
  isCompleted: boolean;
  completedDate?: Date;
  createdDate: Date;
  usedFor?: string;
  usedAmount?: number;
  usedDate?: Date;
}

export const CATEGORIES = [
  'Coffee/Drinks',
  'Groceries',
  'Dining Out',
  'Shopping',
  'Entertainment',
  'Transportation',
  'Other'
];

export const CATEGORY_EMOJIS: Record<string, string> = {
  'Coffee/Drinks': '☕️',
  'Groceries': '🛒',
  'Dining Out': '🍽',
  'Shopping': '🛍',
  'Entertainment': '🎬',
  'Transportation': '🚗',
  'Other': '💰'
};
