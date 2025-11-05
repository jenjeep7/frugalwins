//
//  AuthenticationManager.swift
//  Frugal Wins
//
//  Created by Jennifer Nelson on 11/5/25.
//

import Foundation
import FirebaseAuth
import Combine

class AuthenticationManager: ObservableObject {
    @Published var user: User?
    @Published var isLoggedIn = false
    
    private var authStateHandle: AuthStateDidChangeListenerHandle?
    
    init() {
        registerAuthStateHandler()
    }
    
    deinit {
        if let handle = authStateHandle {
            Auth.auth().removeStateDidChangeListener(handle)
        }
    }
    
    private func registerAuthStateHandler() {
        authStateHandle = Auth.auth().addStateDidChangeListener { auth, user in
            DispatchQueue.main.async {
                self.user = user
                self.isLoggedIn = user != nil
            }
        }
    }
    
    func signIn(email: String, password: String) async throws {
        try await Auth.auth().signIn(withEmail: email, password: password)
    }
    
    func signUp(email: String, password: String) async throws {
        try await Auth.auth().createUser(withEmail: email, password: password)
    }
    
    func signOut() throws {
        try Auth.auth().signOut()
    }
    
    func resetPassword(email: String) async throws {
        try await Auth.auth().sendPasswordReset(withEmail: email)
    }
}