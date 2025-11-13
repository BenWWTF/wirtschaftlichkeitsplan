# Implementation Plan: Native macOS App (Swift + SwiftUI)

**Workbranch:** `feature/swift-macos-app`
**Estimated Time:** 3-4 weeks (phased)
**Priority:** Phase 2 (Weeks 2-4+)

---

## Overview

Building a native macOS application with full feature parity to the web version:
- ✅ All 8 phases of functionality
- ✅ MVVM-C architecture
- ✅ Offline-first with real-time sync
- ✅ Native keyboard shortcuts
- ✅ Mac App Store ready

---

## Phase 1: Foundation & Project Setup (Days 1-7)

### Task 1.1: Create Xcode Project Structure
```bash
# Create new Swift package
mkdir WirtschaftlichkeitsplanMac
cd WirtschaftlichkeitsplanMac

# Create directory structure manually or via Xcode
WirtschaftlichkeitsplanMac/
├── WirtschaftlichkeitsplanMac.xcodeproj
├── WirtschaftlichkeitsplanMac/
│   ├── App/
│   │   ├── WirtschaftlichkeitsplanApp.swift
│   │   └── AppDelegate.swift
│   ├── Models/
│   ├── Services/
│   ├── ViewModels/
│   ├── Views/
│   ├── Coordinators/
│   └── Utils/
├── WirtschaftlichkeitsplanMacTests/
├── Package.swift
└── README.md
```

**Files to Create:**
1. `WirtschaftlichkeitsplanApp.swift` - App entry point
2. `AppDelegate.swift` - Lifecycle management
3. `AppCoordinator.swift` - Navigation orchestrator

**Example: WirtschaftlichkeitsplanApp.swift**
```swift
import SwiftUI

@main
struct WirtschaftlichkeitsplanApp: App {
  @StateObject private var coordinator = AppCoordinator()

  var body: some Scene {
    WindowGroup {
      ZStack {
        if coordinator.isAuthenticated {
          coordinator.makeRootView()
        } else {
          LoginView(coordinator: coordinator)
        }
      }
      .frame(minWidth: 1000, minHeight: 700)
      .environmentObject(coordinator)
    }
    .commands {
      KeyboardShortcutCommands(coordinator: coordinator)
    }
  }
}
```

**Success Criteria:**
- [ ] Xcode project created and builds successfully
- [ ] App entry point working
- [ ] Window can open and close without errors

### Task 1.2: Implement AppCoordinator
```swift
// Coordinators/AppCoordinator.swift

class AppCoordinator: NSObject, ObservableObject {
  @Published var isAuthenticated = false
  @Published var currentScene: Scene = .dashboard

  enum Scene {
    case login
    case dashboard
    case planning
    case therapies
    case analysis
    case reports
    case expenses
    case taxPlanning
    case dataImport
  }

  func navigate(to scene: Scene) {
    withAnimation {
      self.currentScene = scene
    }
  }

  @ViewBuilder
  func makeRootView() -> some View {
    switch currentScene {
    case .dashboard:
      DashboardView(coordinator: self)
    case .planning:
      PlanningView(coordinator: self)
    case .therapies:
      TherapiesView(coordinator: self)
    case .analysis:
      AnalysisView(coordinator: self)
    case .reports:
      ReportsView(coordinator: self)
    case .expenses:
      ExpensesView(coordinator: self)
    case .taxPlanning:
      TaxPlanningView(coordinator: self)
    case .dataImport:
      DataImportView(coordinator: self)
    case .login:
      LoginView(coordinator: self)
    }
  }

  func logout() {
    isAuthenticated = false
    AuthService.shared.logout()
  }
}
```

**Success Criteria:**
- [ ] AppCoordinator navigates between scenes
- [ ] Scene switching works smoothly
- [ ] Logout functionality works

### Task 1.3: Setup Supabase Swift SDK
```bash
# Add to Package.swift dependencies
dependencies: [
  .package(url: "https://github.com/supabase/supabase-swift.git", from: "0.1.0"),
]

# Or via CocoaPods (if using)
pod 'Supabase', '~> 1.0'
```

**Files to Create:**
- `Services/SupabaseService.swift`

```swift
// Services/SupabaseService.swift

class SupabaseService: NSObject, ObservableObject {
  static let shared = SupabaseService()

  let client: SupabaseClient

  override init() {
    let supabaseURL = URL(string: "https://your-project.supabase.co")!
    let supabaseKey = "your-public-key"

    self.client = SupabaseClient(
      supabaseURL: supabaseURL,
      supabaseKey: supabaseKey
    )

    super.init()
    setupRealtime()
  }

  func setupRealtime() {
    // Listen to therapy_types changes
    let therapySubscription = client
      .realtimeV2
      .channel("public:therapy_types")
      .on(
        ChannelEvents.postgresChanges(
          event: .all,
          schema: "public",
          table: "therapy_types"
        ),
        callback: handleTherapyTypeChange
      )

    Task {
      await therapySubscription.subscribe()
    }
  }

  // MARK: - CRUD Operations

  func fetchTherapies(userId: String) async throws -> [Therapy] {
    return try await client
      .database
      .from("therapy_types")
      .select("id, name, price_per_session, color")
      .eq("user_id", value: userId)
      .execute()
      .decoded(as: [Therapy].self)
  }

  func createTherapy(_ therapy: Therapy) async throws {
    try await client
      .database
      .from("therapy_types")
      .insert(therapy)
      .execute()
  }
}
```

**Success Criteria:**
- [ ] Supabase SDK installed
- [ ] Service connects to backend
- [ ] Realtime subscriptions setup
- [ ] Basic CRUD operations working

### Task 1.4: Authentication Flow
```swift
// Services/AuthService.swift

class AuthService: NSObject, ObservableObject {
  static let shared = AuthService()

  @Published var currentUser: User?
  @Published var isLoading = false
  @Published var error: Error?

  private let keychainService = KeychainService()

  func signUp(email: String, password: String) async throws {
    isLoading = true
    defer { isLoading = false }

    let response = try await SupabaseService.shared.client.auth
      .signUp(email: email, password: password)

    self.currentUser = response.user
    try keychainService.store(response.session.accessToken)
  }

  func signIn(email: String, password: String) async throws {
    isLoading = true
    defer { isLoading = false }

    let response = try await SupabaseService.shared.client.auth
      .signIn(email: email, password: password)

    self.currentUser = response.user
    try keychainService.store(response.session.accessToken)
  }

  func logout() throws {
    try SupabaseService.shared.client.auth.signOut()
    currentUser = nil
    try keychainService.clear()
  }

  func restoreSession() async throws {
    if let token = try keychainService.retrieve() {
      // Restore user session from token
      let session = try await SupabaseService.shared.client.auth.session
      self.currentUser = session.user
    }
  }
}
```

**Files to Create:**
- `Services/AuthService.swift`
- `Services/KeychainService.swift`
- `Views/LoginView.swift`

**Success Criteria:**
- [ ] Sign up works
- [ ] Sign in works
- [ ] Logout works
- [ ] Session persists after app restart
- [ ] Keychain stores token securely

---

## Phase 2: Core Data Models & Services (Days 8-14)

### Task 2.1: Define Core Data Models
```swift
// Models/Therapy.swift
import Foundation

@Codable
struct Therapy: Identifiable, Hashable {
  let id: String
  let userId: String
  let name: String
  let pricePerSession: Double
  let color: String?
  let createdAt: Date
  let updatedAt: Date

  enum CodingKeys: String, CodingKey {
    case id
    case userId = "user_id"
    case name
    case pricePerSession = "price_per_session"
    case color
    case createdAt = "created_at"
    case updatedAt = "updated_at"
  }
}

// Models/MonthlyPlan.swift
struct MonthlyPlan: Identifiable, Hashable {
  let id: String
  let userId: String
  let therapyTypeId: String
  let month: Date
  let plannedSessions: Int
  let actualSessions: Int
  let notes: String?
  let createdAt: Date
  let updatedAt: Date
}

// Models/Expense.swift
struct Expense: Identifiable, Hashable {
  let id: String
  let userId: String
  let category: String
  let subcategory: String?
  let amount: Double
  let date: Date
  let isRecurring: Bool
  let recurrenceInterval: String?
  let notes: String?
  let createdAt: Date
  let updatedAt: Date
}

// Models/TaxCalculation.swift
struct TaxCalculation: Codable {
  let grossIncome: Double
  let incomeTax: Double
  let svBeitraege: Double
  let aerztekammerBeitrag: Double
  let vat: Double
  let pauschalDeduction: Double
  let netIncome: Double
  let effectiveTaxRate: Double
  let tips: [TaxTip]
}

struct TaxTip: Codable {
  let icon: String
  let title: String
  let description: String
  let savings: Double?
}
```

**Files to Create (Models):**
- `Models/Therapy.swift`
- `Models/MonthlyPlan.swift`
- `Models/Expense.swift`
- `Models/TaxCalculation.swift`
- `Models/PracticeSettings.swift`
- `Models/ImportRow.swift`

**Success Criteria:**
- [ ] 6 model files created
- [ ] All Codable conformances working
- [ ] Models match Supabase schema

### Task 2.2: Implement Core Data Caching
```swift
// Services/CacheService.swift
import CoreData

class CacheService: NSObject, ObservableObject {
  static let shared = CacheService()

  let container: NSPersistentContainer

  override init() {
    container = NSPersistentContainer(name: "WirtschaftlichkeitsplanCache")
    container.loadPersistentStores { description, error in
      if let error = error {
        print("Error loading Core Data: \(error)")
      }
    }
    super.init()
  }

  var mainContext: NSManagedObjectContext {
    container.viewContext
  }

  func saveTherapies(_ therapies: [Therapy], for userId: String) {
    let context = container.newBackgroundContext()
    context.perform {
      // Save to Core Data
      // ...
      try? context.save()
    }
  }

  func fetchCachedTherapies(for userId: String) -> [Therapy] {
    // Fetch from Core Data
    // ...
    return []
  }
}
```

**Files to Create:**
- `Services/CacheService.swift`
- `WirtschaftlichkeitsplanCache.xcdatamodeld` (Core Data model file)

**Success Criteria:**
- [ ] Core Data setup working
- [ ] Can save to cache
- [ ] Can fetch from cache
- [ ] No errors loading persistent store

### Task 2.3: Implement Services
```swift
// Services/DataSyncService.swift
class DataSyncService: NSObject, ObservableObject {
  @Published var syncStatus: SyncStatus = .idle
  @Published var lastSyncTime: Date?

  private let timer = Timer.publish(every: 30, on: .main, in: .common).autoconnect()

  func startAutoSync() {
    // Sync every 30 seconds
    onReceive(timer) { _ in
      Task {
        await self.syncPendingChanges()
      }
    }
  }

  func syncPendingChanges() async {
    syncStatus = .syncing

    do {
      // Fetch pending local changes
      // Upload to Supabase
      // Merge remote changes
      // Update local cache

      lastSyncTime = Date()
      syncStatus = .synced
    } catch {
      syncStatus = .failed(error)
    }
  }
}

enum SyncStatus {
  case idle
  case syncing
  case synced
  case failed(Error)
}
```

**Files to Create:**
- `Services/DataSyncService.swift`
- `Services/TherapyService.swift`
- `Services/ExpenseService.swift`
- `Services/PlanService.swift`

**Success Criteria:**
- [ ] 4 service files created
- [ ] Services handle CRUD operations
- [ ] Sync service tracks status
- [ ] No compiler errors

---

## Phase 3: Core Views & ViewModels (Days 15-21)

### Task 3.1: Dashboard Scene

**Files to Create:**
- `Views/Dashboard/DashboardView.swift`
- `ViewModels/DashboardViewModel.swift`

```swift
// ViewModels/DashboardViewModel.swift
class DashboardViewModel: NSObject, ObservableObject {
  @Published var therapies: [Therapy] = []
  @Published var monthlyRevenue: Double = 0
  @Published var totalExpenses: Double = 0
  @Published var netIncome: Double = 0
  @Published var activeTherapies: Int = 0
  @Published var isLoading = false

  private let supabaseService = SupabaseService.shared
  private var userId: String?

  func loadDashboard(for userId: String) {
    self.userId = userId
    isLoading = true

    Task {
      do {
        async let therapies = supabaseService.fetchTherapies(userId: userId)
        async let summary = supabaseService.getDashboardSummary(userId: userId)

        let (th, summ) = try await (therapies, summary)

        await MainActor.run {
          self.therapies = th
          self.monthlyRevenue = summ.revenue
          self.totalExpenses = summ.expenses
          self.netIncome = summ.income
          self.activeTherapies = th.count
          self.isLoading = false
        }
      } catch {
        await MainActor.run {
          self.isLoading = false
        }
        print("Error loading dashboard: \(error)")
      }
    }
  }
}

// Views/Dashboard/DashboardView.swift
struct DashboardView: View {
  @ObservedObject var viewModel: DashboardViewModel
  @EnvironmentObject var coordinator: AppCoordinator

  var body: some View {
    NavigationView {
      VStack(spacing: 16) {
        HStack(spacing: 16) {
          KPICard(
            title: "Gesamtumsatz",
            value: viewModel.monthlyRevenue,
            format: "€%.2f",
            color: .blue
          )
          KPICard(
            title: "Gewinn",
            value: viewModel.netIncome,
            format: "€%.2f",
            color: viewModel.netIncome > 0 ? .green : .red
          )
          KPICard(
            title: "Ausgaben",
            value: viewModel.totalExpenses,
            format: "€%.2f",
            color: .orange
          )
          KPICard(
            title: "Therapiearten",
            value: Double(viewModel.activeTherapies),
            format: "%.0f",
            color: .purple
          )
        }

        // Navigation buttons
        HStack(spacing: 12) {
          QuickActionButton(
            icon: "calendar",
            title: "Planung",
            action: { coordinator.navigate(to: .planning) }
          )
          QuickActionButton(
            icon: "person.fill",
            title: "Therapien",
            action: { coordinator.navigate(to: .therapies) }
          )
          QuickActionButton(
            icon: "chart.bar",
            title: "Analyse",
            action: { coordinator.navigate(to: .analysis) }
          )
          QuickActionButton(
            icon: "doc.text",
            title: "Berichte",
            action: { coordinator.navigate(to: .reports) }
          )
        }
      }
      .padding(20)
      .navigationTitle("Übersicht")
    }
    .onAppear {
      viewModel.loadDashboard(for: "user-id") // Get from auth service
    }
  }
}
```

### Task 3.2: Therapies Scene

**Files to Create:**
- `Views/Therapies/TherapiesView.swift`
- `Views/Therapies/TherapyDetailView.swift`
- `ViewModels/TherapiesViewModel.swift`

### Task 3.3: Planning Scene

**Files to Create:**
- `Views/Planning/PlanningView.swift`
- `Views/Planning/PlanningGrid.swift`
- `ViewModels/PlanningViewModel.swift`

### Task 3.4: Analysis Scene

**Files to Create:**
- `Views/Analysis/AnalysisView.swift`
- `Views/Analysis/BreakEvenChart.swift`
- `ViewModels/AnalysisViewModel.swift`

### Task 3.5: Reports Scene

**Files to Create:**
- `Views/Reports/ReportsView.swift`
- `Views/Reports/FinancialReport.swift`
- `ViewModels/ReportsViewModel.swift`

### Task 3.6: Expenses Scene

**Files to Create:**
- `Views/Expenses/ExpensesView.swift`
- `Views/Expenses/ExpenseForm.swift`
- `ViewModels/ExpensesViewModel.swift`

### Task 3.7: Tax Planning Scene

**Files to Create:**
- `Views/TaxPlanning/TaxPlanningView.swift`
- `Views/TaxPlanning/TaxCalculationCard.swift`
- `ViewModels/TaxPlanningViewModel.swift`
- `Utils/TaxCalculator.swift`

### Task 3.8: Data Import Scene

**Files to Create:**
- `Views/DataImport/DataImportView.swift`
- `Views/DataImport/ImportWizard.swift`
- `ViewModels/DataImportViewModel.swift`
- `Utils/CSVParser.swift`

**Success Criteria:**
- [ ] 8 scene views created
- [ ] All ViewModels implemented
- [ ] Navigation working between scenes
- [ ] Data flowing from ViewModels to Views
- [ ] No compiler errors

---

## Phase 4: Keyboard Shortcuts & Polish (Days 22-28)

### Task 4.1: Implement Keyboard Shortcuts
```swift
// Utils/KeyboardShortcutCommands.swift

struct KeyboardShortcutCommands: Commands {
  @EnvironmentObject var coordinator: AppCoordinator

  var body: some Commands {
    CommandGroup(replacing: .appMenu) {
      Button(action: { coordinator.navigate(to: .dashboard) }) {
        Text("Dashboard")
      }
      .keyboardShortcut("1", modifiers: .command)

      Button(action: { coordinator.navigate(to: .planning) }) {
        Text("Planning")
      }
      .keyboardShortcut("2", modifiers: .command)

      // ... more shortcuts
    }

    CommandGroup(after: .appInfo) {
      Button(action: { showKeyboardShortcuts() }) {
        Text("Show Keyboard Shortcuts")
      }
      .keyboardShortcut("/", modifiers: .command)
    }
  }
}
```

**Shortcuts to Implement:**
- Navigation: ⌘1-8
- Common actions: ⌘N, ⌘E, ⌘P, ⌘I, ⌘S, ⌘,
- Dialog controls: ⌘↩, ⌘⌫
- Theme: ⌘Shift+D

**Files to Create:**
- `Utils/KeyboardShortcutCommands.swift`

### Task 4.2: Dark Mode Support
```swift
// In each View:
@Environment(\.colorScheme) var colorScheme

// Use system colors:
Color(.sRGB, red: 0.1, green: 0.1, blue: 0.1)
  .preferredColorScheme(colorScheme == .dark ? .dark : .light)
```

### Task 4.3: Performance Profiling
- Use Instruments to profile startup time
- Profile memory usage during operations
- Optimize network requests
- Cache frequently accessed data

### Task 4.4: Testing
```swift
// WirtschaftlichkeitsplanMacTests/DashboardViewModelTests.swift
class DashboardViewModelTests: XCTestCase {
  var sut: DashboardViewModel!

  override func setUp() {
    super.setUp()
    sut = DashboardViewModel()
  }

  func testLoadDashboard() async {
    // Test loading dashboard data
    // Verify KPI calculations
    // Check error handling
  }
}
```

**Tests to Create:**
- ViewModel unit tests (8 files)
- Service integration tests
- Model encoding/decoding tests
- Keyboard shortcut tests

### Task 4.5: Code Signing & Notarization
```bash
# In Xcode Build Settings:
# 1. Set Team ID
# 2. Set Bundle Identifier
# 3. Enable code signing

# For distribution:
xcodebuild archive -scheme WirtschaftlichkeitsplanMac \
  -configuration Release \
  -archivePath WirtschaftlichkeitsplanMac.xcarchive

# Notarize for Mac App Store / direct distribution
```

**Success Criteria:**
- [ ] All shortcuts working
- [ ] Dark mode fully supported
- [ ] App performs well (< 500ms operations)
- [ ] Unit tests pass (80%+ coverage)
- [ ] Code signed and ready to notarize

---

## Verification Checklist

- [ ] All 8 scenes implemented
- [ ] CRUD operations work for all entities
- [ ] Real-time sync working
- [ ] Offline support functional
- [ ] Keyboard shortcuts all working
- [ ] Dark/light mode toggle works
- [ ] Performance acceptable
- [ ] All tests passing
- [ ] No memory leaks
- [ ] App signed and notarized

---

## Rollback Plan

```bash
# If critical issue:
git reset --hard main
git branch -D feature/swift-macos-app

# Or revert specific commits:
git revert <commit-hash>
```

---

## Success Definition

✅ **Swift macOS App Complete When:**
1. All 8 phases working in native Swift
2. Full feature parity with web version
3. Real-time sync with web app verified
4. Keyboard shortcuts for all actions
5. Dark mode fully supported
6. Performance > 500ms for all operations
7. Unit tests: 80%+ coverage, all passing
8. App signed and notarized
9. Readme with keyboard shortcuts
10. Release ready for distribution

