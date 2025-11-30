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
import { Challenge } from '../types';

const COLLECTION_NAME = 'challenges';

export const fetchChallenges = async (userId: string): Promise<Challenge[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('user_id', '==', userId),
    orderBy('created_date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    userId: doc.data().user_id,
    amount: doc.data().amount,
    currentSavings: doc.data().current_savings,
    isCompleted: doc.data().is_completed,
    completedDate: doc.data().completed_date?.toDate(),
    createdDate: doc.data().created_date.toDate(),
    usedFor: doc.data().used_for,
    usedAmount: doc.data().used_amount,
    usedDate: doc.data().used_date?.toDate()
  }));
};

export const createChallenge = async (
  userId: string,
  amount: number
): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    user_id: userId,
    amount,
    current_savings: 0,
    is_completed: false,
    completed_date: null,
    created_date: Timestamp.now(),
    used_for: null,
    used_amount: null,
    used_date: null
  });
  return docRef.id;
};

export const updateChallengeProgress = async (
  challengeId: string,
  additionalAmount: number,
  currentSavings: number,
  targetAmount: number
): Promise<void> => {
  const newSavings = currentSavings + additionalAmount;
  const isCompleted = newSavings >= targetAmount;

  await setDoc(
    doc(db, COLLECTION_NAME, challengeId),
    {
      current_savings: newSavings,
      is_completed: isCompleted,
      completed_date: isCompleted ? Timestamp.now() : null
    },
    { merge: true }
  );
};

export const logChallengeUse = async (
  challengeId: string,
  usedFor: string,
  usedAmount: number
): Promise<void> => {
  await setDoc(
    doc(db, COLLECTION_NAME, challengeId),
    {
      used_for: usedFor,
      used_amount: usedAmount,
      used_date: Timestamp.now()
    },
    { merge: true }
  );
};

export const deleteChallenge = async (challengeId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_NAME, challengeId));
};

export const getActiveChallenge = (challenges: Challenge[]): Challenge | null => {
  return challenges.find(c => !c.isCompleted) || null;
};

export const getCompletedChallenges = (challenges: Challenge[]): Challenge[] => {
  return challenges.filter(c => c.isCompleted);
};

export const calculateProgress = (currentSavings: number, targetAmount: number): number => {
  return Math.min((currentSavings / targetAmount) * 100, 100);
};
