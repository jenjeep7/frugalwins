import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { NonSpend } from '../types';

const COLLECTION_NAME = 'non_spends';

export const fetchNonSpends = async (userId: string): Promise<NonSpend[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('user_id', '==', userId),
    orderBy('date_created', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    userId: doc.data().user_id,
    description: doc.data().description,
    amountSaved: doc.data().amount_saved,
    category: doc.data().category,
    dateCreated: doc.data().date_created.toDate()
  }));
};

export const addNonSpend = async (
  userId: string,
  description: string,
  amountSaved: number,
  category: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    user_id: userId,
    description,
    amount_saved: amountSaved,
    category,
    date_created: Timestamp.now()
  });
  return docRef.id;
};

export const deleteNonSpend = async (nonSpendId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_NAME, nonSpendId));
};

export const calculateStatistics = (nonSpends: NonSpend[]) => {
  const totalSaved = nonSpends.reduce((sum, ns) => sum + ns.amountSaved, 0);
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const thisMonthSaved = nonSpends
    .filter(ns => ns.dateCreated >= startOfMonth)
    .reduce((sum, ns) => sum + ns.amountSaved, 0);

  const thisWeekCount = nonSpends
    .filter(ns => ns.dateCreated >= startOfWeek)
    .length;

  // Calculate streak
  const sortedDates = nonSpends
    .map(ns => ns.dateCreated.toDateString())
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffTime = prevDate.getTime() - currDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
  }

  return {
    totalSaved,
    thisMonthSaved,
    thisWeekCount,
    currentStreak: streak
  };
};
