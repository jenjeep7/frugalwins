//
//  MainAppView.swift
//  Frugal Wins
//
//  Created by Jennifer Nelson on 11/5/25.
//

import SwiftUI
import UIKit
import FirebaseAuth

struct MainAppView: View {
    @StateObject private var authManager = AuthenticationManager()
    @StateObject private var firestoreManager = FirestoreManager()
    @State private var showingAddWin = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Welcome Header
                VStack(spacing: 10) {
                    Text("Welcome to Frugal Wins!")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)
                    
                    if let email = authManager.user?.email {
                        Text("Hello, \(email.components(separatedBy: "@").first ?? "Saver")!")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                
                // Quick Stats Cards
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 15) {
                    StatCard(title: "This Month", amount: String(format: "$%.2f", firestoreManager.thisMonthSaved), color: .green)
                    StatCard(title: "Total Saved", amount: String(format: "$%.2f", firestoreManager.totalSaved), color: .blue)
                    StatCard(title: "Wins This Week", amount: "\(firestoreManager.winsThisWeek)", color: .orange)
                    StatCard(title: "Streak", amount: "\(firestoreManager.currentStreak) days", color: .purple)
                }
                .padding(.horizontal)
                
                // Recent Wins Section
                VStack(alignment: .leading, spacing: 15) {
                    HStack {
                        Text("Recent Wins")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Spacer()
                        
                        if firestoreManager.isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                        }
                    }
                    
                    if firestoreManager.recentWins.isEmpty {
                        // Placeholder for when there are no wins yet
                        VStack(spacing: 15) {
                            Image(systemName: "star.circle.fill")
                                .font(.system(size: 50))
                                .foregroundColor(.yellow)
                            
                            Text("No wins yet!")
                                .font(.headline)
                                .fontWeight(.medium)
                            
                            Text("Start tracking your savings wins to see them here. Every dollar saved is a victory!")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                        .padding()
                        .background(Color(UIColor.systemGray6))
                        .cornerRadius(12)
                    } else {
                        // Display actual wins
                        VStack(spacing: 10) {
                            ForEach(firestoreManager.recentWins) { win in
                                WinRowView(win: win)
                            }
                        }
                    }
                }
                .padding(.horizontal)
                
                Spacer()
                
                // Add Win Button
                Button(action: {
                    showingAddWin = true
                }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("Add a Win")
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.green, Color.blue]),
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(12)
                }
                .padding(.horizontal)
                .padding(.bottom)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button("Settings") {
                            // TODO: Show settings
                        }
                        
                        Button("Sign Out") {
                            signOut()
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
        .sheet(isPresented: $showingAddWin) {
            AddWinView(firestoreManager: firestoreManager)
        }
        .onAppear {
            Task {
                await firestoreManager.fetchSavingWins()
            }
            firestoreManager.setupRealtimeListener()
        }
    }
    
    private func signOut() {
        do {
            try authManager.signOut()
        } catch {
            print("Error signing out: \(error.localizedDescription)")
        }
    }
}

struct StatCard: View {
    let title: String
    let amount: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .fontWeight(.medium)
            
            Text(amount)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct WinRowView: View {
    let win: SavingWin
    
    var body: some View {
        HStack {
            Text(win.categoryEmoji)
                .font(.title2)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(win.description)
                    .font(.headline)
                    .lineLimit(2)
                
                Text(win.formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Text(win.formattedAmount)
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(.green)
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }
}

struct AddWinView: View {
    @Environment(\.presentationMode) var presentationMode
    let firestoreManager: FirestoreManager
    
    @State private var winDescription = ""
    @State private var amountSaved = ""
    @State private var selectedCategory = "Coffee/Drinks"
    @State private var isLoading = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    let categories = ["Coffee/Drinks", "Groceries", "Dining Out", "Shopping", "Entertainment", "Transportation", "Other"]
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Win Details")) {
                    TextField("What did you save on? (e.g., Skipped Starbucks today)", text: $winDescription)
                    
                    HStack {
                        Text("$")
                        TextField("0.00", text: $amountSaved)
                            .keyboardType(.decimalPad)
                    }
                    
                    Picker("Category", selection: $selectedCategory) {
                        ForEach(categories, id: \.self) { category in
                            Text(category).tag(category)
                        }
                    }
                }
                
                Section(header: Text("Celebration")) {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("🎉 Great job on this saving win!")
                            .font(.headline)
                        
                        Text("Every dollar saved brings you closer to your financial goals!")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 5)
                }
            }
            .navigationTitle("Add a Win")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        Task {
                            await saveWin()
                        }
                    }
                    .disabled(winDescription.isEmpty || amountSaved.isEmpty || isLoading)
                }
            }
        }
        .alert("Error", isPresented: $showingAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(alertMessage)
        }
    }
    
    private func saveWin() async {
        guard let amount = Double(amountSaved) else {
            alertMessage = "Please enter a valid amount"
            showingAlert = true
            return
        }
        
        isLoading = true
        
        do {
            try await firestoreManager.addSavingWin(
                description: winDescription,
                amountSaved: amount,
                category: selectedCategory
            )
            
            DispatchQueue.main.async {
                self.presentationMode.wrappedValue.dismiss()
            }
        } catch {
            DispatchQueue.main.async {
                self.alertMessage = error.localizedDescription
                self.showingAlert = true
                self.isLoading = false
            }
        }
    }
}

#Preview {
    MainAppView()
}