//
//  SavingWin.swift
//  Frugal Wins
//
//  Created by Jennifer Nelson on 11/5/25.
//

import Foundation
import FirebaseFirestore

struct SavingWin: Identifiable, Codable {
    @DocumentID var id: String?
    let userId: String
    let description: String
    let amountSaved: Double
    let category: String
    let dateCreated: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case description
        case amountSaved = "amount_saved"
        case category
        case dateCreated = "date_created"
    }
    
    init(userId: String, description: String, amountSaved: Double, category: String, dateCreated: Date = Date()) {
        self.userId = userId
        self.description = description
        self.amountSaved = amountSaved
        self.category = category
        self.dateCreated = dateCreated
    }
}

// MARK: - Computed Properties for Statistics
extension SavingWin {
    var isThisWeek: Bool {
        let calendar = Calendar.current
        let now = Date()
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: now) ?? now
        return dateCreated >= weekAgo
    }
    
    var isThisMonth: Bool {
        let calendar = Calendar.current
        let now = Date()
        let startOfMonth = calendar.dateInterval(of: .month, for: now)?.start ?? now
        return dateCreated >= startOfMonth
    }
    
    var formattedAmount: String {
        return String(format: "$%.2f", amountSaved)
    }
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .none
        return formatter.string(from: dateCreated)
    }
    
    var categoryEmoji: String {
        switch category.lowercased() {
        case "coffee/drinks", "coffee":
            return "☕️"
        case "groceries":
            return "🛒"
        case "dining out", "restaurant":
            return "🍽️"
        case "shopping":
            return "🛍️"
        case "entertainment":
            return "🎬"
        case "transportation":
            return "🚗"
        default:
            return "💰"
        }
    }
}

// MARK: - Sample Data for Previews
extension SavingWin {
    static let sampleWins: [SavingWin] = [
        SavingWin(
            userId: "sample-user",
            description: "Skipped Starbucks and made coffee at home",
            amountSaved: 5.50,
            category: "Coffee/Drinks",
            dateCreated: Date()
        ),
        SavingWin(
            userId: "sample-user",
            description: "Bought generic brand groceries instead of name brand",
            amountSaved: 12.00,
            category: "Groceries",
            dateCreated: Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date()
        ),
        SavingWin(
            userId: "sample-user",
            description: "Cooked dinner instead of ordering takeout",
            amountSaved: 25.00,
            category: "Dining Out",
            dateCreated: Calendar.current.date(byAdding: .day, value: -2, to: Date()) ?? Date()
        )
    ]
}