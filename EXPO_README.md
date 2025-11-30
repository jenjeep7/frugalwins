# Frugal Wins - Expo/React Native

A savings tracking app built with Expo and React Native Paper. Track your non-spends, complete savings challenges, and build better financial habits!

## Features

- 🔐 **Authentication** - Email/password sign up and login
- 💰 **Non-Spends Tracking** - Log what you didn't spend on and watch your savings grow
- 🎯 **Challenges** - $50 and $100 savings challenges with progress tracking
- 📊 **Statistics** - Track total saved, monthly savings, weekly count, and streaks
- 👤 **User Profile** - Customize your profile with savings goals and targets

## Tech Stack

- **Expo** - React Native framework
- **TypeScript** - Type-safe code
- **React Native Paper** - Material Design components
- **Firebase** - Authentication and Firestore database
- **React Navigation** - Screen navigation

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your "frugal-wins" project (or create one)
3. Add a Web app to your project
4. Copy the Firebase config object
5. Update `src/config/firebase.ts` with your config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "frugal-wins.firebaseapp.com",
  projectId: "frugal-wins",
  storageBucket: "frugal-wins.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Firebase Security Rules

Make sure your Firestore has these security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /user_profiles/{profileId} {
      allow read: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    match /non_spends/{nonSpendId} {
      allow read: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    match /challenges/{challengeId} {
      allow read: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    match /frugal_savings/{savingsId} {
      allow read: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
  }
}
```

### 4. Create Firestore Indexes

When you first run queries, Firebase will provide links to create required indexes. Create these composite indexes:

1. **non_spends**: `user_id` (Ascending), `date_created` (Descending)
2. **challenges**: `user_id` (Ascending), `created_date` (Descending)

## Run the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

## Project Structure

```
src/
├── config/
│   └── firebase.ts          # Firebase configuration
├── screens/
│   ├── AuthScreen.tsx       # Login/Signup
│   ├── HomeScreen.tsx       # Dashboard with non-spends
│   ├── ChallengesScreen.tsx # Savings challenges
│   └── ProfileScreen.tsx    # User profile
├── services/
│   ├── authService.ts       # Authentication functions
│   ├── nonSpendService.ts   # Non-spend CRUD
│   ├── challengeService.ts  # Challenge CRUD
│   └── profileService.ts    # Profile CRUD
└── types/
    └── index.ts             # TypeScript interfaces
```

## Firebase Collections

### `user_profiles`
- User profile information
- Savings goals and targets

### `non_spends`
- Individual non-spend entries
- Categories, amounts, dates

### `challenges`
- $50 and $100 savings challenges
- Progress tracking
- Usage logging

## Development

- Edit files in `src/` folder
- App will hot-reload on save
- Check console for errors
- Use Expo Go app for testing on devices

## Notes

- All existing Firebase data from the iOS app is preserved
- Same authentication users work across platforms
- Firestore collections use snake_case field names (`user_id`, `date_created`, etc.)
