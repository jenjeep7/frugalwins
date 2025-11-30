import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../types';

const COLLECTION_NAME = 'user_profiles';

export const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('user_id', '==', userId)
  );

  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }

  const docData = snapshot.docs[0];
  const data = docData.data();
  
  return {
    id: docData.id,
    userId: data.user_id,
    displayName: data.display_name,
    age: data.age,
    phoneNumber: data.phone_number,
    bio: data.bio,
    savingsGoalReason: data.savings_goal_reason,
    biggestSpendingCategory: data.biggest_spending_category,
    monthlySavingsTarget: data.monthly_savings_target,
    avgCoffeesPerWeek: data.avg_coffees_per_week,
    avgDiningOutPerWeek: data.avg_dining_out_per_week,
    avgShoppingPerWeek: data.avg_shopping_per_week,
    avgEntertainmentPerWeek: data.avg_entertainment_per_week,
    isProfileComplete: data.is_profile_complete || false,
    profileCompletedDate: data.profile_completed_date?.toDate(),
    dateCreated: data.date_created?.toDate() || new Date()
  };
};

export const createProfile = async (
  userId: string,
  displayName: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    user_id: userId,
    display_name: displayName,
    age: null,
    phone_number: null,
    bio: null,
    savings_goal_reason: null,
    biggest_spending_category: null,
    monthly_savings_target: null,
    avg_coffees_per_week: null,
    avg_dining_out_per_week: null,
    avg_shopping_per_week: null,
    avg_entertainment_per_week: null,
    is_profile_complete: false,
    profile_completed_date: null,
    date_created: Timestamp.now()
  });
  return docRef.id;
};

export const updateProfile = async (
  profileId: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, profileId);
  
  const firestoreUpdates: any = {};
  
  if (updates.displayName !== undefined) firestoreUpdates.display_name = updates.displayName;
  if (updates.age !== undefined) firestoreUpdates.age = updates.age;
  if (updates.phoneNumber !== undefined) firestoreUpdates.phone_number = updates.phoneNumber;
  if (updates.bio !== undefined) firestoreUpdates.bio = updates.bio;
  if (updates.savingsGoalReason !== undefined) firestoreUpdates.savings_goal_reason = updates.savingsGoalReason;
  if (updates.biggestSpendingCategory !== undefined) firestoreUpdates.biggest_spending_category = updates.biggestSpendingCategory;
  if (updates.monthlySavingsTarget !== undefined) firestoreUpdates.monthly_savings_target = updates.monthlySavingsTarget;
  if (updates.avgCoffeesPerWeek !== undefined) firestoreUpdates.avg_coffees_per_week = updates.avgCoffeesPerWeek;
  if (updates.avgDiningOutPerWeek !== undefined) firestoreUpdates.avg_dining_out_per_week = updates.avgDiningOutPerWeek;
  if (updates.avgShoppingPerWeek !== undefined) firestoreUpdates.avg_shopping_per_week = updates.avgShoppingPerWeek;
  if (updates.avgEntertainmentPerWeek !== undefined) firestoreUpdates.avg_entertainment_per_week = updates.avgEntertainmentPerWeek;
  if (updates.isProfileComplete !== undefined) {
    firestoreUpdates.is_profile_complete = updates.isProfileComplete;
    if (updates.isProfileComplete) {
      firestoreUpdates.profile_completed_date = Timestamp.now();
    }
  }

  await setDoc(docRef, firestoreUpdates, { merge: true });
};
