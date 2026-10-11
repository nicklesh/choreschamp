# ChoresChamp

A gamified chore management system for families that helps children learn responsibility while parents maintain control. Built with Next.js 14, Firebase, and TypeScript.

## 🎯 Overview

ChoresChamp is a three-tiered application enabling:
- **Parents** to assign chores, manage rewards, and track multiple children
- **Children** to complete tasks, earn points, and redeem rewards
- **Admins** to oversee all users, manage payments, and handle feedback

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14.2.3 (App Router)
- React 18
- TypeScript 5
- TailwindCSS 3.4.1
- Shadcn/ui components
- React Hook Form + Zod validation

**Backend:**
- Firebase Authentication
- Cloud Firestore (NoSQL database)
- Firebase Storage (avatars, images)

**Key Libraries:**
- `@radix-ui/*` - Accessible UI primitives
- `lucide-react` - Icon system
- `class-variance-authority` - Component variants
- `@genkit-ai/googleai` - AI task suggestions (unused in current implementation)

### Project Structure

```
├── app/
│   ├── (routes)/
│   │   ├── chore-champ/
│   │   │   ├── [childId]/page.tsx    # Child dashboard
│   │   │   └── page.tsx               # Parent dashboard
│   │   ├── admin/login/page.tsx       # Admin authentication
│   │   ├── login/page.tsx             # User login
│   │   ├── signup/page.tsx            # Parent registration
│   │   └── forgot-password/page.tsx   # Password recovery
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Landing page
│   └── globals.css                    # Global styles
├── components/ui/                     # Shadcn components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── toast.tsx
│   └── [...]
├── lib/
│   ├── firebase.ts                    # Firebase config & functions
│   └── utils.ts                       # Utility functions
├── public/                            # Static assets
├── .env.local                         # Environment variables (not in repo)
├── next.config.mjs                    # Next.js configuration
├── tailwind.config.ts                 # Tailwind customization
└── package.json                       # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ 
- npm/yarn/pnpm
- Firebase project with:
  - Authentication enabled (Email/Password)
  - Firestore database
  - Storage bucket
  - Service account credentials

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/nicklesh/choreschamp.git
cd choreschamp
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Set up Firebase Storage structure**

Upload the following to your Firebase Storage bucket:
```
/avatars/
  /boys/
    - boy_avatar_1.png
    - boy_avatar_2.png
    [...]
  /girls/
    - girl_avatar_1.png
    - girl_avatar_2.png
    [...]
/logos/
  - ChoresChampLogo.png
```

5. **Initialize Firestore**

Create the following collections:
- `users` - User profiles (auto-created on signup)
- `feedback` - User feedback submissions (auto-created)

6. **Run the development server**
```bash
npm run dev
```

Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## 📋 Core Features

### For Parents

**Dashboard Features:**
- View all children in summary table with 30-day chore statistics
- Create and manage child accounts
- Assign age-appropriate chores (2-3, 4-5, 6-9, 10-13, 14+ age groups)
- Configure custom chores with points and recurrence (daily/weekly/bi-weekly/monthly)
- Approve completed chores and reward redemptions
- Award bonus points
- Customize reward catalog (up to 15 rewards)
- Bulk delete future chores
- View rewards report (yearly summary)
- Submit feedback to admins

**Chore Assignment:**
- Suggested chores based on child's age
- Custom chore creation
- Flexible recurrence patterns
- Point value configuration
- Due date selection (up to 90 days ahead)

**Notifications:**
- Real-time alerts for completed chores
- Reward redemption requests
- Bell icon with unread count

### For Children

**Dashboard Features:**
- Personal avatar (gender-specific, auto-assigned)
- Point balance display
- Chore lists: Upcoming, Completed, Past
- Badge collection system (20 unique badges)
- Reward catalog reference
- Mark chores as complete
- Request rewards for completed chores
- View redeemed rewards history

**Gamification:**
- Earn points by completing chores
- Unlock badges for specific chore types
- Track reward redemption history
- Visual progress indicators

### For Admins

**Dashboard Features:**
- User management table (all parents and children)
- Enable/disable user accounts
- View parent-child relationships (expandable rows)
- Update payment tracking per parent
- View and mark feedback as read
- Access all stored avatars and logos
- Bell notifications for unread feedback per parent

## 🎨 Design System

### Color Palette

The app uses a nature-inspired color scheme:

**Primary Colors:**
- `basalt-stones` (#36454F) - Dark navy blue
- `white-dove` (#F5F5F5) - Off-white
- `olive-green` (#8A9A5B) - Muted green

**Accent Colors:**
- `sunset-sky` (#FFD8B1) - Warm orange
- `bamboo-wood` (#D2B48C) - Tan
- `mist` (#E0E7F1) - Light blue
- `concrete` (#D3D3D3) - Light gray
- `lotus-flower` (#F5D9E4) - Light pink

**Variants:**
All colors have `light-`, `dark-`, and `very-light-` variants for consistent theming.

### Typography

- Font: Inter (Google Font)
- Headings: Bold, 2xl-3xl
- Body: Regular, sm-base
- Buttons: Medium weight

## 🔐 Authentication & Authorization

### User Roles

**Three distinct roles with different access levels:**

1. **Parent**
   - Can create child accounts
   - Full CRUD on children's chores
   - Approve/reject chore completions
   - Manage reward catalog
   - Access: `/chore-champ` and `/chore-champ/[childId]`

2. **Child**
   - View assigned chores
   - Mark chores complete
   - Request rewards
   - View own dashboard only
   - Access: `/chore-champ/[childId]` (own ID only)

3. **Admin**
   - View all users
   - Enable/disable accounts
   - Track payments
   - View feedback
   - Access: `/chore-champ` (admin view)

### Security Notes

**CRITICAL: This is a frontend-only implementation with NO server-side security rules.**

⚠️ **Security Vulnerabilities:**
- Firestore security rules not shown in codebase
- All authorization checks happen client-side (easily bypassed)
- No server-side validation of chore completions
- No rate limiting on API calls
- Storage bucket access controls not defined

**Before production deployment, you MUST implement:**

1. **Firestore Security Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
                      (request.auth.uid == userId || 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'parent');
    }
    
    // Only admins can read feedback
    match /feedback/{feedbackId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth != null;
    }
  }
}
```

2. **Storage Security Rules** (`storage.rules`):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins via console
    }
    match /logos/{allPaths=**} {
      allow read: if true; // Public
      allow write: if false;
    }
  }
}
```

3. **Server-side validation** via Cloud Functions
4. **Rate limiting** and abuse prevention
5. **Input sanitization** on all user inputs

## 📊 Data Models

### UserProfile
```typescript
interface UserProfile {
  id: string;
  email: string;
  name?: string;
  age?: number;
  avatar?: string;
  gender?: 'boy' | 'girl';
  role: 'parent' | 'child' | 'admin';
  parentId?: string;           // For children
  childUids?: string[];        // For parents
  disabled?: boolean;          // Account status
  assignedChores?: AssignedChore[];
  redeemedRewards?: RedeemedReward[];
  rewards?: Reward[];          // Parent's custom catalog
  notifications?: Notification[];
  awardedBadges?: { [title: string]: number };
  paidAmount?: number;         // Admin tracking
}
```

### AssignedChore
```typescript
interface AssignedChore {
  id: string;
  title: string;
  points: number;
  dueDate: string;            // ISO string (end date for recurring)
  status: 'active' | 'completed' | 'not-done' | 'approved';
  completedAt?: string;       // For one-time chores
  recurrence?: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  createdAt: string;          // ISO string
  completions?: {             // For recurring chores
    date: string;             // ISO date string
    status: 'completed' | 'not-done' | 'approved';
    requestedReward?: { name: string, points: number };
  }[];
  requestedReward?: { name: string, points: number }; // One-time only
}
```

### Reward System
```typescript
interface Reward {
  name: string;
  points: number;
}

interface RedeemedReward extends Reward {
  date: string;
  rewardRedeemed: boolean;
  choreTitle?: string;
  choreDueDate?: string;
}
```

## 🎮 User Flows

### Parent Creates Child Account

1. Parent logs in → Parent Dashboard
2. Click "Add New Child" button
3. Enter child's email and password
4. System creates child account WITHOUT logging parent out (uses temporary Firebase app)
5. Child account linked to parent's `childUids` array
6. Parent redirects to child dashboard to set name, age, gender

### Child Completes Chore

1. Child logs in → Child Dashboard
2. Views "Upcoming Chores" table
3. Clicks "Complete" button on active chore
4. Chore status changes to `completed`
5. Notification sent to parent via `sendNotificationToParent()`
6. Chore appears in "Completed Chores" section
7. Child can optionally request a reward

### Parent Approves Chore

1. Parent sees notification bell with count
2. Clicks on child's name in summary table
3. Navigates to child's dashboard
4. Views "Upcoming Chores" with completed items
5. Changes status dropdown to "Approved"
6. Points credited to child
7. If reward requested, reward auto-redeemed and points deducted
8. Badge awarded if chore type matches badge definition

### Recurring Chore Logic

Recurring chores generate "instances" based on their recurrence pattern:
- **Daily**: Every day from `createdAt` to `dueDate`
- **Weekly**: Every 7 days
- **Bi-weekly**: Every 14 days
- **Monthly**: Same day each month

Each instance is tracked separately in the `completions[]` array with its own status and optional reward request.

Past-due instances automatically change from `active` to `not-done` status (client-side calculation).

## 🐛 Known Issues & Limitations

1. **No server-side security** - All authorization is client-side
2. **No real-time updates** - Users must refresh to see changes
3. **Genkit AI dependency unused** - Task suggestion feature not implemented
4. **No email verification** - Anyone can create accounts
5. **Hardcoded badge system** - Can't add badges without code changes
6. **No data export** - Users can't download their chore history
7. **Mobile responsiveness partial** - Some tables difficult on small screens
8. **No search/filter** - Large chore lists become unwieldy
9. **Avatar collision possible** - If more children than avatars exist
10. **No backup/recovery** - Deleted chores are permanently gone
11. **Points can go negative** - No validation preventing over-redemption
12. **Timezone issues** - All dates use client timezone, not consistent UTC

## 🔧 Configuration

### Environment Variables

All Firebase config must be set in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Default Rewards

Located in `lib/firebase.ts`:

```typescript
export const defaultRewards: Reward[] = [
  { name: '1 $ cash', points: 10 },
  { name: 'Digital Time', points: 20 },
  { name: 'Ice Cream', points: 30 },
  { name: 'Movies', points: 90 },
  { name: 'Pizza/Food', points: 140 },
];
```

Parents can customize this list in their dashboard.

### Age-Based Chore Suggestions

Defined in `app/chore-champ/[childId]/page.tsx`:

```typescript
const ageBasedChores: Record<string, Chore[]> = {
  "2-3": [...],
  "4-5": [...],
  "6-9": [...],
  "10-13": [...],
  "14+": [...]
};
```

### Badge Definitions

20 badges defined in `app/chore-champ/[childId]/page.tsx`. Each badge:
- Has a unique title
- Links to a specific chore title
- Uses a Lucide React icon
- Awards on parent approval of that chore type

## 📱 Responsive Design

- **Mobile-first approach** with `sm:`, `md:`, `lg:` breakpoints
- **Collapsible sections** on mobile for better UX
- **Show/Hide Details** buttons for tables on small screens
- **Hamburger menus** (not implemented - hardcoded navigation)

**Breakpoints:**
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)
- `2xl`: 1400px (large desktops)

## 🧪 Testing

**No tests included in this codebase.**

Recommended testing strategy:
- Unit tests: Jest + React Testing Library
- E2E tests: Playwright or Cypress
- Firebase emulators for local testing

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in project settings
4. Deploy

### Other Platforms

Works on any platform supporting Next.js:
- Netlify
- Railway
- Render
- Self-hosted

**Important:** Ensure environment variables are set in deployment platform.

## 📝 Development Notes

### Firebase Client-Side Architecture

This app uses Firebase's client SDK directly (no server-side API). This means:
- All database queries happen from browser
- Security rules are critical
- Users can inspect network requests
- Real-time updates require listeners (not implemented)

### Temporary App Pattern

The `signUpWithEmail()` function uses a clever pattern to create child accounts without logging out the parent:

```typescript
const tempApp = initializeApp(firebaseConfig, tempAppName);
const tempAuth = getAuth(tempApp);
// Create user on temp auth instance
await createUserWithEmailAndPassword(tempAuth, email, password);
await deleteApp(tempApp); // Clean up
```

This prevents the main app's auth state from changing.

### Chore Status Flow

```
active → completed → approved
   ↓         ↓
not-done   (stays completed)
```

- `active`: Chore assigned, not done
- `completed`: Child marked done, awaiting parent approval
- `approved`: Parent approved, points awarded
- `not-done`: Past due date without completion

## 🤝 Contributing

This appears to be a personal/educational project. If you want to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (add tests!)
5. Submit a pull request

**Priority improvements needed:**
1. Add Firestore security rules
2. Implement real-time listeners
3. Add comprehensive testing
4. Improve mobile UI/UX
5. Add email verification
6. Implement data export
7. Add search/filter functionality

## 📄 License

No license file included in repository. Contact owner for usage terms.

## 👤 Author

GitHub: [@nicklesh](https://github.com/nicklesh)

---

**Final Thoughts:**

This is a well-structured educational project demonstrating Next.js 14 App Router, Firebase integration, and complex state management. However, it's **NOT production-ready** due to missing security implementations.

Before deploying for real users, address the security concerns, add proper testing, and implement server-side validation. The core logic is solid, but the lack of backend security is a critical flaw that would allow any user to manipulate data directly via Firebase client SDK.

Good foundation, needs hardening before production use.
