export interface SavingsEntry {
  id?: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  status: 'saved' | 'pending' | 'missed';
  dateCreated: Date;
  dueDate?: Date; // For pending entries
  completedDate?: Date; // When pending becomes saved/missed
}

export interface WeeklySavings {
  weekStartDate: Date;
  entries: SavingsEntry[];
  totalSaved: number;
  totalPending: number;
  totalMissed: number;
}
