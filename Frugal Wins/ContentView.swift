//
//  ContentView.swift
//  Frugal Wins
//
//  Created by Jennifer Nelson on 11/4/25.
//

import SwiftUI
import FirebaseAuth

struct ContentView: View {
    @StateObject private var authManager = AuthenticationManager()
    
    var body: some View {
        Group {
            if authManager.isLoggedIn {
                MainAppView()
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authManager.isLoggedIn)
    }
}

#Preview {
    ContentView()
}
