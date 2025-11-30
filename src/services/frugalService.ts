import {
  collection,
  doc,
  addDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SavingsEntry, WeeklySavings } from '../types/frugal';

const COLLECTION_NAME = 'frugal_savings';

export const fetchSavingsEntries = async (userId: string): Promise<SavingsEntry[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('user_id', '==', userId),
    orderBy('date_created', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    userId: doc.data().user_id,
    amount: doc.data().amount,
    description: doc.data().description,
    category: doc.data().category,
    status: doc.data().status,
    dateCreated: doc.data().date_created.toDate(),
    dueDate: doc.data().due_date?.toDate(),
    completedDate: doc.data().completed_date?.toDate()
  }));
};

export const addSavingsEntry = async (
  userId: string,
  amount: number,
  description: string,
  category: string,
  status: 'saved' | 'pending' | 'missed',
  dueDate?: Date
): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    user_id: userId,
    amount,
    description,
    category,
    status,
    date_created: Timestamp.now(),
    due_date: dueDate ? Timestamp.fromDate(dueDate) : null,
    completed_date: null
  });
  return docRef.id;
};

export const updateSavingsEntry = async (
  entryId: string,
  updates: Partial<SavingsEntry>
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, entryId);
  
  const firestoreUpdates: any = {};
  
  if (updates.amount !== undefined) firestoreUpdates.amount = updates.amount;
  if (updates.description !== undefined) firestoreUpdates.description = updates.description;
  if (updates.category !== undefined) firestoreUpdates.category = updates.category;
  if (updates.status !== undefined) {
    firestoreUpdates.status = updates.status;
    if (updates.status === 'saved' || updates.status === 'missed') {
      firestoreUpdates.completed_date = Timestamp.now();
    }
  }
  if (updates.dueDate !== undefined) {
    firestoreUpdates.due_date = updates.dueDate ? Timestamp.fromDate(updates.dueDate) : null;
  }

  await setDoc(docRef, firestoreUpdates, { merge: true });
};

export const deleteSavingsEntry = async (entryId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_NAME, entryId));
};

export const calculateTotals = (entries: SavingsEntry[]) => {
  const totalSaved = entries
    .filter(e => e.status === 'saved')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPending = entries
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalMissed = entries
    .filter(e => e.status === 'missed')
    .reduce((sum, e) => sum + e.amount, 0);

  return { totalSaved, totalPending, totalMissed };
};

export const groupByWeek = (entries: SavingsEntry[]): WeeklySavings[] => {
  const weeks = new Map<string, WeeklySavings>();

  entries.forEach(entry => {
    const date = entry.dateCreated;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekKey = weekStart.toISOString();

    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, {
        weekStartDate: weekStart,
        entries: [],
        totalSaved: 0,
        totalPending: 0,
        totalMissed: 0
      });
    }

    const week = weeks.get(weekKey)!;
    week.entries.push(entry);

    if (entry.status === 'saved') week.totalSaved += entry.amount;
    if (entry.status === 'pending') week.totalPending += entry.amount;
    if (entry.status === 'missed') week.totalMissed += entry.amount;
  });

  return Array.from(weeks.values()).sort((a, b) => 
    b.weekStartDate.getTime() - a.weekStartDate.getTime()
  );
};
