//
//  FirestoreManager.swift
//  Frugal Wins
//
//  Created by Jennifer Nelson on 11/5/25.
//

import Foundation
import FirebaseFirestore
import FirebaseAuth
import Combine

@MainActor
class FirestoreManager: ObservableObject {
    private let db = Firestore.firestore()
    @Published var savingWins: [SavingWin] = []
    @Published var isLoading = false
    
    // MARK: - Statistics Computed Properties
    var totalSaved: Double {
        savingWins.reduce(0) { $0 + $1.amountSaved }
    }
    
    var thisMonthSaved: Double {
        savingWins.filter { $0.isThisMonth }.reduce(0) { $0 + $1.amountSaved }
    }
    
    var winsThisWeek: Int {
        savingWins.filter { $0.isThisWeek }.count
    }
    
    var currentStreak: Int {
        calculateCurrentStreak()
    }
    
    var recentWins: [SavingWin] {
        Array(savingWins.sorted { $0.dateCreated > $1.dateCreated }.prefix(5))
    }
    
    // MARK: - Public Methods
    
    /// Fetch all saving wins for the current user
    func fetchSavingWins() async {
        guard let userId = Auth.auth().currentUser?.uid else {
            print("No authenticated user found")
            return
        }
        
        isLoading = true
        
        do {
            let snapshot = try await db.collection("saving_wins")
                .whereField("user_id", isEqualTo: userId)
                .order(by: "date_created", descending: true)
                .getDocuments()
            
            let wins = try snapshot.documents.compactMap { document in
                try document.data(as: SavingWin.self)
            }
            
            savingWins = wins
            isLoading = false
        } catch {
            print("Error fetching saving wins: \(error.localizedDescription)")
            isLoading = false
        }
    }
    
    /// Add a new saving win
    func addSavingWin(description: String, amountSaved: Double, category: String) async throws {
        guard let userId = Auth.auth().currentUser?.uid else {
            throw FirestoreError.noAuthenticatedUser
        }
        
        let newWin = SavingWin(
            userId: userId,
            description: description,
            amountSaved: amountSaved,
            category: category
        )
        
        do {
            _ = try db.collection("saving_wins").addDocument(from: newWin)
            
            // Refresh the local data
            await fetchSavingWins()
        } catch {
            throw FirestoreError.saveFailed(error.localizedDescription)
        }
    }
    
    /// Delete a saving win
    func deleteSavingWin(_ win: SavingWin) async throws {
        guard let documentId = win.id else {
            throw FirestoreError.invalidDocument
        }
        
        do {
            try await db.collection("saving_wins").document(documentId).delete()
            
            // Remove from local array
            savingWins.removeAll { $0.id == documentId }
        } catch {
            throw FirestoreError.deleteFailed(error.localizedDescription)
        }
    }
    
    /// Set up real-time listener for saving wins
    func setupRealtimeListener() {
        guard let userId = Auth.auth().currentUser?.uid else {
            print("No authenticated user for real-time listener")
            return
        }
        
        db.collection("saving_wins")
            .whereField("user_id", isEqualTo: userId)
            .order(by: "date_created", descending: true)
            .addSnapshotListener { [weak self] snapshot, error in
                if let error = error {
                    print("Error listening for saving wins updates: \(error.localizedDescription)")
                    return
                }
                
                guard let documents = snapshot?.documents else {
                    print("No documents found")
                    return
                }
                
                let wins = documents.compactMap { document in
                    try? document.data(as: SavingWin.self)
                }
                
                Task { @MainActor in
                    self?.savingWins = wins
                }
            }
    }
    
    // MARK: - Private Methods
    
    private func calculateCurrentStreak() -> Int {
        let calendar = Calendar.current
        let sortedWins = savingWins.sorted { $0.dateCreated > $1.dateCreated }
        
        var streak = 0
        var currentDate = Date()
        
        for win in sortedWins {
            let winDate = calendar.startOfDay(for: win.dateCreated)
            let checkDate = calendar.startOfDay(for: currentDate)
            
            if winDate == checkDate {
                streak += 1
                currentDate = calendar.date(byAdding: .day, value: -1, to: currentDate) ?? currentDate
            } else if winDate == calendar.date(byAdding: .day, value: -1, to: checkDate) {
                streak += 1
                currentDate = winDate
            } else {
                break
            }
        }
        
        return streak
    }
}

// MARK: - Custom Errors
enum FirestoreError: LocalizedError {
    case noAuthenticatedUser
    case saveFailed(String)
    case deleteFailed(String)
    case invalidDocument
    
    var errorDescription: String? {
        switch self {
        case .noAuthenticatedUser:
            return "No authenticated user found. Please log in and try again."
        case .saveFailed(let message):
            return "Failed to save: \(message)"
        case .deleteFailed(let message):
            return "Failed to delete: \(message)"
        case .invalidDocument:
            return "Invalid document. Unable to perform operation."
        }
    }
}