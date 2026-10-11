
'use client';
import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, where, getDocs, updateDoc, arrayUnion, getDoc, type DocumentSnapshot, addDoc } from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL, type StorageReference } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- AUTH FUNCTIONS ---

// Creates a new user account without signing out the current user.
// This is achieved by creating a temporary, secondary Firebase app instance.
export const signUpWithEmail = async (email: string, password:string) => {
  const tempAppName = `temp-signup-app-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      tempAuth,
      email,
      password
    );
    // The user is created in the shared Firebase Auth backend but is only "logged in"
    // to the temporary app instance. The main app's auth state is unaffected.
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up with email (secondary app):", error);
    throw error;
  } finally {
    // Clean up the temporary app instance to avoid memory leaks.
    await deleteApp(tempApp);
  }
};

// Sign up AND signs in the new user. Used for the main signup page.
export const signUpAndSignInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, // Use the main auth instance to trigger sign-in state change
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up and signing in with email:", error);
    throw error;
  }
};


// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
      );

      // After successful auth, check if the user is disabled in Firestore
      const profile = await getUserProfile(userCredential.user.uid);
      if (profile?.disabled) {
          // If they are disabled, sign them out immediately and throw an error
          await firebaseSignOut(auth);
          console.error("User account disabled:", userCredential.user.uid);
          throw new Error("This account has been disabled by an administrator.");
      }
      
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
};

// Send password reset email
export const sendPasswordReset = async (email: string) => {
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
};

// Confirm the password reset
export const confirmPasswordReset = async (oobCode: string, newPassword: string) => {
    try {
      return await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
    } catch (error) {
      console.error("Error confirming password reset:", error);
      throw error;
    }
};


// --- FIRESTORE FUNCTIONS ---

export interface Reward {
    name: string;
    points: number;
}

export const defaultRewards: Reward[] = [
    { name: '1 $ cash', points: 10 },
    { name: 'Digital Time', points: 20 },
    { name: 'Ice Cream', points: 30 },
    { name: 'Movies', points: 90 },
    { name: 'Pizza/Food', points: 140 },
];

export interface RedeemedReward {
  name: string;
  points: number;
  date: string; // ISO string
  rewardRedeemed: boolean;
  choreTitle?: string;
  choreDueDate?: string;
}

export interface Notification {
  id: string;
  message: string;
  childId: string;
  choreTitle: string;
  createdAt: string; // ISO string
  read: boolean;
}

export interface AssignedChore {
  id: string;
  title: string;
  points: number;
  dueDate: string; // For recurring chores, this is the START date
  status: 'active' | 'completed' | 'not-done' | 'approved';
  completedAt?: string; // ISO string, used for one-time chores
  recurrence?: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  createdAt: string; // ISO string when the chore was assigned
  completions?: { date: string, status: 'completed' | 'not-done' | 'approved', requestedReward?: { name: string, points: number } }[]; // Track status for each recurring instance
  requestedReward?: { name: string, points: number };
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  age?: number;
  avatar?: string;
  gender?: 'boy' | 'girl';
  role: 'parent' | 'child' | 'admin';
  childEmail?: string;
  parentId?: string;
  childUids?: string[];
  disabled?: boolean;
  assignedChores?: AssignedChore[];
  redeemedRewards?: RedeemedReward[];
  rewards?: Reward[];
  notifications?: Notification[];
  awardedBadges?: { [title: string]: number };
  paidAmount?: number;
}

export interface Feedback {
    id: string;
    userId: string;
    feedback: string;
    submittedAt: string; // ISO string
    read: boolean;
}

// Get a user profile document
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap: DocumentSnapshot<Omit<UserProfile, 'id'>> = await getDoc(docRef) as DocumentSnapshot<Omit<UserProfile, 'id'>>;
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
}

// Get multiple child profiles from an array of UIDs
export const getChildProfiles = async (uids: string[]): Promise<UserProfile[]> => {
    if (!uids || uids.length === 0) {
        return [];
    }
    try {
        const profilePromises = uids.map(uid => getUserProfile(uid));
        const profiles = await Promise.all(profilePromises);
        // Filter out any null profiles in case a child account was deleted
        return profiles.filter(p => p !== null) as UserProfile[];
    } catch (error) {
        console.error("Error getting child profiles:", error);
        throw new Error("Could not retrieve child profiles.");
    }
};

// Get all user profiles
export const getAllUsers = async () => {
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        return querySnapshot.docs;
    } catch (error) {
        console.error("Error getting all users:", error);
        throw new Error("Could not retrieve user list.");
    }
}

// Update a user's account status (disabled field)
export const updateUserAccountStatus = async (uid: string, disabled: boolean) => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { disabled });
    } catch (error) {
        console.error("Error updating user status:", error);
        throw new Error("Could not update user account status.");
    }
}


// Create a user profile document
export const createUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
) => {
  try {
    // New users should be enabled by default and have 0 redeemed points
    const profileData = { 
        ...data, 
        disabled: false, 
        redeemedRewards: [], 
        notifications: [], 
        awardedBadges: {},
        rewards: data.role === 'parent' ? defaultRewards : [],
    };
    await setDoc(doc(db, 'users', uid), profileData, { merge: true });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw new Error("Could not create user profile.");
  }
};

// Update a user profile document
export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Could not update user profile.");
  }
};

// Find a parent by their child's email address
export const findParentByChildEmail = async (childEmail: string) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'parent'),
      where('childEmail', '==', childEmail)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    // Return the first matching parent document
    return querySnapshot.docs[0];
  } catch (error) {
    console.error("Error finding parent:", error);
    throw new Error("Could not search for parent account.");
  }
};

// Link parent and child accounts
export const linkParentAndChild = async (parentDocId: string, childUid: string) => {
    try {
        const parentRef = doc(db, 'users', parentDocId);
        await updateDoc(parentRef, {
            childUids: arrayUnion(childUid)
        });
        
        const childRef = doc(db, 'users', childUid);
        await updateDoc(childRef, {
            parentId: parentDocId
        });
    } catch (error) {
        console.error("Error linking accounts:", error);
        throw new Error("Could not link parent and child accounts.");
    }
};

export const sendNotificationToParent = async (parentId: string, notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    try {
        const parentProfile = await getUserProfile(parentId);
        if (!parentProfile) return;

        const newNotification: Notification = {
            ...notificationData,
            id: `notif-${Date.now()}`,
            createdAt: new Date().toISOString(),
            read: false,
        };
        
        const notifications = parentProfile.notifications || [];
        await updateUserProfile(parentId, { notifications: [...notifications, newNotification] });
    } catch (error) {
        console.error("Error sending notification to parent:", error);
        throw error;
    }
};

export const markNotificationsAsRead = async (parentId: string, childIdToMark: string) => {
    try {
        const parentProfile = await getUserProfile(parentId);
        if (!parentProfile || !parentProfile.notifications) return;

        const updatedNotifications = parentProfile.notifications.map(n => 
            (n.childId === childIdToMark && !n.read) ? { ...n, read: true } : n
        );
        
        await updateUserProfile(parentId, { notifications: updatedNotifications });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        throw error;
    }
};

export const saveFeedback = async (userId: string, feedbackText: string) => {
    try {
        await addDoc(collection(db, 'feedback'), {
            userId,
            feedback: feedbackText,
            submittedAt: new Date().toISOString(),
            read: false, // New feedback is unread by default
        });
    } catch (error) {
        console.error("Error saving feedback:", error);
        throw new Error("Could not save feedback.");
    }
};

export const getAllFeedback = async (): Promise<Feedback[]> => {
    try {
        const feedbackRef = collection(db, 'feedback');
        const querySnapshot = await getDocs(feedbackRef);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
    } catch (error) {
        console.error("Error getting all feedback:", error);
        throw new Error("Could not retrieve feedback list.");
    }
}

export const markFeedbackAsRead = async (feedbackId: string) => {
    try {
        const feedbackRef = doc(db, 'feedback', feedbackId);
        await updateDoc(feedbackRef, { read: true });
    } catch (error) {
        console.error("Error marking feedback as read:", error);
        throw new Error("Could not update feedback status.");
    }
};


export { app, auth, db, storage, firebaseSignOut };

    