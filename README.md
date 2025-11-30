# Frugal Wins 🎉💰

A SwiftUI iOS app for tracking daily savings and celebrating financial victories through "reverse budgeting."

## 📱 About

Frugal Wins helps you turn every dollar saved into a victory! Instead of focusing on what you can't spend, this app celebrates what you *didn't* spend and tracks your saving wins.

## ✨ Features

- 🔐 **User Authentication** - Secure sign-up and login with Firebase Auth
- 💾 **Cloud Storage** - All your wins are safely stored in Firestore
- 🎯 **Savings Goals** - Set targets and track progress with visual indicators
- 📊 **Statistics Dashboard** - Track your total savings, monthly progress, and winning streaks
- 🏆 **Categorized Wins** - Organize savings by category (Coffee, Groceries, Dining, etc.)
- 📱 **Real-time Updates** - See your wins update instantly across devices
- 🎨 **Beautiful UI** - Clean, modern SwiftUI interface with progress animations
- 🎉 **Goal Celebrations** - Get celebrated when you reach your savings goals

## 🛠 Tech Stack

- **SwiftUI** - Modern declarative UI framework
- **Firebase Authentication** - Secure user management
- **Cloud Firestore** - Real-time NoSQL database
- **Swift 5** - Latest Swift language features
- **iOS 18.5+** - Target deployment

## 📦 Setup

### Prerequisites

- Xcode 16 or later
- iOS 18.5+ Simulator or Device
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jenjeep7/frugalwins.git
cd frugalwins
```

2. Open the project in Xcode:
```bash
open "Frugal Wins.xcodeproj"
```

3. Add your Firebase configuration:
   - Download `GoogleService-Info.plist` from your Firebase Console
   - Add it to the "Frugal Wins" folder in Xcode
   - **Important:** Never commit this file to version control

4. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Set up Firestore security rules (see below)

### Firestore Security Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Saving wins collection
    match /saving_wins/{winId} {
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.user_id;
      
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.user_id;
      
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.user_id;
    }
    
    // Saving goals collection
    match /saving_goals/{goalId} {
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.user_id;
      
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.user_id;
      
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.user_id;
    }
  }
}
```

### Firestore Indexes

Create these composite indexes:

1. **saving_wins** collection:
   - Fields: 
     - `user_id` (Ascending)
     - `date_created` (Descending)

2. **saving_goals** collection:
   - Fields:
     - `user_id` (Ascending)
     - `date_created` (Descending)

## 🎯 Usage

1. **Sign Up/Login** - Create an account or sign in
2. **Set a Goal** - Create your first savings goal with a target amount
3. **Add a Win** - Tap the "Add a Win" button and describe what you saved on
4. **Track Progress** - Watch your goal progress and total savings grow
5. **Reach Your Goal** - Get celebrated when you hit your target!
6. **Reset or Complete** - Choose to apply your savings and complete the goal, or reset and try again
7. **Maintain Your Streak** - Keep saving daily to build your winning streak 🔥

## 📱 Screenshots

*Coming soon!*

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

Jennifer Nelson
- GitHub: [@jenjeep7](https://github.com/jenjeep7)

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- SwiftUI for the amazing UI framework
- The iOS development community

---

**Note:** Remember to never commit your `GoogleService-Info.plist` file to version control. Keep your Firebase credentials secure!

🎉 Happy Saving! 💰
