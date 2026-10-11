
'use client';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';
import {
  auth,
  getUserProfile,
  type UserProfile,
  updateUserProfile,
  type AssignedChore,
  storage,
  sendNotificationToParent,
  type RedeemedReward,
  getChildProfiles,
  type Reward,
  defaultRewards,
} from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Trash2, CheckCircle, Gift, ToyBrick, Droplets, Trash, Brush, BookOpen, Utensils, Sprout, Flower2, Wind, Shirt, Dog, Car, Bed, Carrot, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';


interface UserWithId extends UserProfile {
  id: string;
}

interface Chore {
  id: string;
  title: string;
  description: string;
}

interface Badge {
    title: string;
    choreTitle: string; // The chore that unlocks this badge
    icon: React.ElementType;
}

const badgeDefinitions: Badge[] = [
    { title: 'Toy Tamer', choreTitle: 'Put toys away', icon: ToyBrick },
    { title: 'Pet Feeder', choreTitle: 'Fill pet\'s food bowl', icon: Dog },
    { title: 'Laundry Legend', choreTitle: 'Place clothes in hamper', icon: Shirt },
    { title: 'Spill Superhero', choreTitle: 'Wipe up spills', icon: Droplets },
    { title: 'Dust Destroyer', choreTitle: 'Dust or wipe baseboards', icon: Brush },
    { title: 'Bookworm Organizer', choreTitle: 'Pile up books and magazines', icon: BookOpen },
    { title: 'Bed Maker', choreTitle: 'Make their bed', icon: Bed },
    { title: 'Table Clearer', choreTitle: 'Clear the table', icon: Utensils },
    { title: 'Weed Warrior', choreTitle: 'Pull weeds', icon: Sprout },
    { title: 'Flower Friend', choreTitle: 'Water flowers', icon: Flower2 },
    { title: 'Sweeping Star', choreTitle: 'Sweep floors', icon: Wind },
    { title: 'Raking Rockstar', choreTitle: 'Rake the yard', icon: Wind },
    { title: 'Room Ranger', choreTitle: 'Clean their own room', icon: Brush },
    { title: 'Grocery Getter', choreTitle: 'Put away groceries', icon: Utensils },
    { title: 'Dishwasher Pro', choreTitle: 'Load the dishwasher', icon: Droplets },
    { title: 'Car Cleaner', choreTitle: 'Wash the car', icon: Car },
    { title: 'Window Wizard', choreTitle: 'Wash the windows', icon: Droplets },
    { title: 'Snack Chef', choreTitle: 'Prepare easy meals', icon: Utensils },
    { title: 'Lawn Master', choreTitle: 'Mow the lawn', icon: Carrot },
    { title: 'Trash Taker', choreTitle: 'Take trash to the curb', icon: Trash },
];

// Chore list based on age
const ageBasedChores: Record<string, Chore[]> = {
    "2-3": [
        { id: '3-1', title: 'Put toys away', description: 'Place toys in a bin.' },
        { id: '3-2', title: 'Fill pet\'s food bowl', description: 'Scoop food for the family pet.' },
        { id: '3-3', title: 'Place clothes in hamper', description: 'Put dirty clothes where they belong.' },
        { id: '3-4', title: 'Wipe up spills', description: 'Clean up small messes.' },
        { id: '3-5', title: 'Dust or wipe baseboards', description: 'Use a cloth to wipe down baseboards.' },
        { id: '3-6', title: 'Pile up books and magazines', description: 'Stack books neatly.' },
    ],
    "4-5": [
        { id: '5-1', title: 'Make their bed', description: 'Straighten sheets and pillows.' },
        { id: '5-2', title: 'Clear the table', description: 'Bring their own plate to the sink.' },
        { id: '5-3', title: 'Pull weeds', description: 'Help with simple garden tasks.' },
        { id: '5-4', title: 'Water flowers', description: 'Use a small watering can for plants.' },
        { id: '5-5', title: 'Put away clean utensils', description: 'Help sort and put away silverware.' },
        { id: '5-6', title: 'Wash plastic dishes', description: 'Wash non-breakable items in the sink.' },
        { id: '5-7', title: 'Sort laundry', description: 'Help separate clothes by color.' },
        { id: '5-8', title: 'Match socks', description: 'Pair clean socks together.' },
    ],
    "6-9": [
        { id: '9-1', title: 'Sweep floors', description: 'Sweep the kitchen or hallway.' },
        { id: '9-2', title: 'Rake the yard', description: 'Help gather leaves.' },
        { id: '9-3', title: 'Clean their own room', description: 'Tidy up toys, clothes, and books.' },
        { id: '9-4', title: 'Put away groceries', description: 'Help unload and store groceries.' },
        { id: '9-5', title: 'Load the dishwasher', description: 'Place dishes in the dishwasher.' },
        { id: '9-6', title: 'Empty the dishwasher', description: 'Put away clean dishes.' },
        { id: '9-7', title: 'Vacuum', description: 'Vacuum one or two rooms.' },
        { id: '9-8', title: 'Wipe down counters', description: 'Clean kitchen or bathroom surfaces.' },
        { id: '9-9', title: 'Fold and put away laundry', description: 'Fold their own clothes.' },
        { id: '9-10', title: 'Take the family pet for a walk', description: 'With supervision.' },
    ],
    "10-13": [
        { id: '13-1', title: 'Wash the car', description: 'Help with washing the family vehicle.' },
        { id: '13-2', title: 'Wash the windows', description: 'Clean interior windows.' },
        { id: '13-3', title: 'Prepare easy meals', description: 'Make a sandwich or a simple snack.' },
        { id: '13-4', title: 'Use the clothes washer/dryer', description: 'Do a load of their own laundry.' },
        { id: '13-5', title: 'Take trash to the curb', description: 'Wheel the bins out on trash day.' },
        { id_ : '13-6', title: 'Babysit younger siblings', description: 'With a parent at home.' },
    ],
    "14+": [
        { id: '14-1', title: 'Clean out the fridge', description: 'Wipe shelves and remove old food.' },
        { id: '14-2', title: 'Help with deep cleaning', description: 'Tackle bigger cleaning projects.' },
        { id: '14-3', title: 'Clean the toilet and shower', description: 'Do a full bathroom clean.' },
        { id: '14-4', title: 'Babysit younger siblings alone', description: 'For short periods.' },
        { id: '14-5', title: 'Mow the lawn', description: 'Operate the lawn mower safely.' },
        { id: '14-6', title: 'Care for pets independently', description: 'Feeding, walking, and cleaning.' },
        { id: '14-7', title: 'Iron clothes', description: 'Learn to use an iron safely.' },
        { id: '14-8', 'title': 'Help parents with simple repairs', description: 'Assist with basic home maintenance.' },
    ],
};

const getChoresForAge = (age: number): Chore[] => {
    if (age <= 3) return ageBasedChores['2-3'] || [];
    if (age <= 5) return ageBasedChores['4-5'] || [];
    if (age <= 9) return ageBasedChores['6-9'] || [];
    if (age <= 13) return ageBasedChores['10-13'] || [];
    if (age >= 14) return ageBasedChores['14+'] || [];
    return [];
};

const boyAvatars = Array.from({ length: 8 }, (_, i) => `/avatars/boys/Kid${(i + 1).toString().padStart(2, '0')}-Boy.png`);
const girlAvatars = Array.from({ length: 8 }, (_, i) => `/avatars/girls/Kid${(i + 1).toString().padStart(2, '0')}-Girl.png`);


type Recurrence = 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
type ChoreStatus = 'active' | 'completed' | 'not-done' | 'approved';
type Gender = 'boy' | 'girl';
type ChoreTableType = 'upcoming' | 'completed' | 'past';


interface ChoreSettings {
  points: number;
  dueDate: string;
  recurrence: Recurrence;
}

const badgeColors: { [key: string]: string } = {};
const getBadgeColor = (badgeTitle: string) => {
    if (!badgeColors[badgeTitle]) {
        const hue = Math.floor(Math.random() * 360);
        badgeColors[badgeTitle] = `hsl(${hue}, 70%, 80%)`;
    }
    return badgeColors[badgeTitle];
};

const toCamelCase = (str: string) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function ChildChorePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { childId } = params;

  const [user, setUser] = useState<User | null>(null);
  const [parentProfile, setParentProfile] = useState<UserProfile | null>(null);
  const [childProfile, setChildProfile] = useState<UserWithId | null>(null);
  const [rewards, setRewards] = useState<Reward[]>(defaultRewards);
  const [loading, setLoading] = useState(true);
  const [avatarsLoading, setAvatarsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  // State for child management
  const [childAge, setChildAge] = useState('');
  const [childName, setChildName] = useState('');
  const [childGender, setChildGender] = useState<Gender | undefined>(undefined);
  const [suggestedChores, setSuggestedChores] = useState<Chore[]>([]);
  const [choreSettings, setChoreSettings] = useState<Record<string, Partial<ChoreSettings>>>({});

  // State for custom chores
  const [customChoreTitle, setCustomChoreTitle] = useState('');
  const [customChoreDescription, setCustomChoreDescription] = useState('');
  const [customChoreSettings, setCustomChoreSettings] = useState<ChoreSettings>({
    points: 10,
    dueDate: '',
    recurrence: 'one-time',
  });
  const [isCustomChoreExpanded, setCustomChoreExpanded] = useState(false);


  // State for bonus points
  const [bonusPoints, setBonusPoints] = useState<number>(10);
  const [isBonusDialogOpen, setBonusDialogOpen] = useState(false);

  // State for suggested chores accordion
  const [expandedChoreId, setExpandedChoreId] = useState<string | null>(null);
  
  // State for rewards reference accordion
  const [isRewardsReferenceExpanded, setRewardsReferenceExpanded] = useState(false);

  // State for view collapsing sections
  const [isChildDetailsExpanded, setChildDetailsExpanded] = useState(true);
  const [isRewardsExpanded, setRewardsExpanded] = useState(true);
  const [isBadgesExpanded, setBadgesExpanded] = useState(true);
  const [isUpcomingChoresExpanded, setUpcomingChoresExpanded] = useState(true);
  const [isPastChoresExpanded, setPastChoresExpanded] = useState(false);
  const [isCompletedChoresExpanded, setCompletedChoresExpanded] = useState(false);
  
  // State for chore table details visibility (mobile)
  const [isUpcomingDetailsExpanded, setUpcomingDetailsExpanded] = useState(false);
  const [isCompletedDetailsExpanded, setCompletedDetailsExpanded] = useState(false);
  const [isPastDetailsExpanded, setPastDetailsExpanded] = useState(false);


  const maxDueDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toISOString().split('T')[0];
  }, []);

  const fetchChildProfile = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const profile = await getUserProfile(id);
      if (profile) {
        const profileWithId = { ...profile, id };
        setChildProfile(profileWithId);
        setChildName(profile.name || '');
        setChildAge(profile.age?.toString() || '');
        setChildGender(profile.gender as Gender | undefined);

         if (profile.parentId) {
          const parent = await getUserProfile(profile.parentId);
          setParentProfile(parent);
          if (parent?.rewards && parent.rewards.length > 0) {
              setRewards(parent.rewards);
          } else {
              setRewards(defaultRewards);
          }
        }

      } else {
        console.error('Child profile not found for id:', id);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load child profile.',
        });
        router.push('/chore-champ');
      }
    } catch (error) {
      console.error('Error fetching child profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load child profile.',
      });
      router.push('/chore-champ');
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          setLoading(true);
          const userProfile = await getUserProfile(currentUser.uid);
          
          if (!userProfile) {
              router.push('/login');
              return;
          }
          
          const isChildViewingOwnPage = userProfile.role === 'child' && currentUser.uid === childId;

          if (isChildViewingOwnPage) {
              const parent = userProfile.parentId ? await getUserProfile(userProfile.parentId) : null;
              setParentProfile(parent);
              setChildProfile({ ...userProfile, id: currentUser.uid });
              setChildName(toCamelCase(userProfile.name || ''));
              setChildAge(userProfile.age?.toString() || '');
              setChildGender(userProfile.gender as Gender | undefined);
              if (parent?.rewards && parent.rewards.length > 0) {
                  setRewards(parent.rewards);
              }
              // For child view, collapse sections by default on mobile, keep some open on desktop
              const isMobile = window.innerWidth < 768;
              setChildDetailsExpanded(!isMobile);
              setRewardsExpanded(!isMobile);
              setBadgesExpanded(!isMobile);
              setCompletedChoresExpanded(false);
              setPastChoresExpanded(false);
              setRewardsReferenceExpanded(false);
          } else if (userProfile.role === 'parent') {
              setParentProfile(userProfile);
              if (userProfile.rewards && userProfile.rewards.length > 0) {
                  setRewards(userProfile.rewards);
              }
              if (typeof childId === 'string') {
                  await fetchChildProfile(childId);
              }
               // On parent view and mobile, collapse sections by default
              if (window.innerWidth < 768) {
                  setChildDetailsExpanded(false);
                  setRewardsExpanded(false);
                  setBadgesExpanded(false);
                  setUpcomingChoresExpanded(false);
              }
          } else {
              router.push('/chore-champ'); 
              return;
          }
          
          setAvatarsLoading(false);
          setLoading(false);

        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth state change error in child chore page:', error);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, childId, fetchChildProfile]);
  
  useEffect(() => {
    if (childAge) {
      const age = parseInt(childAge, 10);
      if (!isNaN(age)) {
        setSuggestedChores(getChoresForAge(age));
      }
    } else {
      setSuggestedChores([]);
    }
  }, [childAge]);
  

  const handleUpdateChildName = async () => {
    if (!childProfile || !childName.trim()) return;
    const formattedName = toCamelCase(childName.trim());
    if (childProfile.name === formattedName) return;

    try {
        await updateUserProfile(childProfile.id, { name: formattedName });
        setChildProfile(prev => prev ? { ...prev, name: formattedName } : null);
        toast({
            title: "Child's Name Updated",
            description: `Successfully updated name to ${formattedName}.`,
        });
    } catch (error) {
        console.error("Error updating child's name:", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not update the child\'s name.',
        });
        setChildName(toCamelCase(childProfile.name || ''));
    }
  };

   const handleUpdateChildAge = async () => {
    if (!childProfile || !childAge.trim()) return;

    const age = parseInt(childAge, 10);
    if (isNaN(age) || childProfile.age === age) return;

    try {
        await updateUserProfile(childProfile.id, { age: age });
        setChildProfile(prev => prev ? { ...prev, age: age } : null);
        toast({
            title: "Child's Age Updated",
            description: `Successfully updated age to ${age}.`,
        });
    } catch (error) {
        console.error("Error updating child's age:", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not update the child\'s age.',
        });
        setChildAge(childProfile.age?.toString() || '');
    }
  };

  const handleUpdateChildGender = async (gender: Gender) => {
    if (!childProfile || childProfile.gender === gender) return;
  
    setAvatarsLoading(true);
  
    try {
      // 1. Directly fetch the parent profile to ensure we have the latest data
      if (!childProfile.parentId) {
        throw new Error("Could not find parent information for this child.");
      }
      const currentParentProfile = await getUserProfile(childProfile.parentId);
  
      if (!currentParentProfile?.childUids) {
        throw new Error("Parent data is incomplete.");
      }
      
      // 2. Fetch sibling profiles
      const siblingUids = currentParentProfile.childUids.filter(uid => uid !== childProfile.id);
      const siblings = await getChildProfiles(siblingUids);
      
      const childrenOfSameGender = siblings.filter(s => s.gender === gender);
      const usedAvatars = childrenOfSameGender.map(s => s.avatar).filter(Boolean);
      
      // 3. Determine the correct set of avatars
      const allPossibleAvatars = gender === 'boy' ? boyAvatars : girlAvatars;
  
      // 4. Find the next available avatar sequentially
      let selectedAvatar: string | undefined;
      for (const avatar of allPossibleAvatars) {
          if (!usedAvatars.includes(avatar)) {
              selectedAvatar = avatar;
              break;
          }
      }
  
      // 5. If all are used, wrap around and assign based on count
      if (!selectedAvatar) {
        selectedAvatar = allPossibleAvatars[childrenOfSameGender.length % allPossibleAvatars.length];
      }
      
      const profileUpdates: Partial<UserProfile> = { gender, avatar: selectedAvatar };
      
      await updateUserProfile(childProfile.id, profileUpdates);
      
      // 6. Immediately update local state to reflect the change in the UI
      setChildProfile(prev => prev ? { ...prev, ...profileUpdates } : null);
      setChildGender(gender);
  
      toast({
        title: "Child's Details Updated",
        description: `Successfully updated gender and assigned a new avatar.`,
      });
  
    } catch (error: any) {
      console.error("Error updating gender/avatar:", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: `Could not update gender and assign avatar. ${error.message}`,
      });
      // Revert local state on error
      setChildGender(childProfile.gender as Gender | undefined);
    } finally {
      setAvatarsLoading(false);
    }
  };


  const handleAddChore = async (chore: Chore, choreId: string) => {
    if (!childProfile) return;

    const settings = choreSettings[choreId] || {};
    const points = settings.points || 10;
    const dueDate = settings.dueDate;
    const recurrence = settings.recurrence || 'one-time';

    if (!dueDate) {
        toast({ variant: 'destructive', title: 'Missing Due Date', description: 'Please set a due date for the chore.' });
        return;
    }

    const newChore: AssignedChore = {
        id: `${chore.id}-${Date.now()}`,
        title: chore.title,
        points: points,
        dueDate: dueDate,
        status: 'active',
        recurrence: recurrence,
        createdAt: new Date().toISOString(),
    };

    try {
        const existingChores = childProfile.assignedChores || [];
        const updatedChores = [...existingChores, newChore];
        await updateUserProfile(childProfile.id, { assignedChores: updatedChores });
        setChildProfile(prev => prev ? { ...prev, assignedChores: updatedChores } : null);
        toast({ title: 'Chore Added!', description: `"${chore.title}" has been assigned to ${childName}.` });
        setExpandedChoreId(null);
    } catch (error) {
        console.error('Error adding chore:', error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not assign the chore.' });
    }
  };

  const handleAddCustomChore = async () => {
    if (!customChoreTitle) {
      toast({ variant: 'destructive', title: 'Missing Title', description: 'Please enter a title for the custom chore.' });
      return;
    }
     if (!customChoreSettings.dueDate) {
        toast({ variant: 'destructive', title: 'Missing Due Date', description: 'Please set a due date for the custom chore.' });
        return;
    }

    const customChoreId = `custom-${Date.now()}`;
    const newCustomChore: Chore = {
      id: customChoreId,
      title: customChoreTitle,
      description: customChoreDescription,
    };
    
    const newChore: AssignedChore = {
        id: `${newCustomChore.id}-${Date.now()}`,
        title: newCustomChore.title,
        points: customChoreSettings.points,
        dueDate: customChoreSettings.dueDate,
        status: 'active',
        recurrence: customChoreSettings.recurrence,
        createdAt: new Date().toISOString(),
    };

    if (!childProfile) return;

    try {
        const existingChores = childProfile.assignedChores || [];
        const updatedChores = [...existingChores, newChore];
        await updateUserProfile(childProfile.id, { assignedChores: updatedChores });
        setChildProfile(prev => prev ? { ...prev, assignedChores: updatedChores } : null);
        toast({ title: 'Chore Added!', description: `"${newCustomChore.title}" has been assigned to ${childName}.` });
        
        setCustomChoreTitle('');
        setCustomChoreDescription('');
        setCustomChoreSettings({ points: 10, dueDate: '', recurrence: 'one-time' });
        setCustomChoreExpanded(false);

    } catch (error) {
        console.error('Error adding custom chore:', error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not assign the chore.' });
    }
  };


  const handleDeleteChore = async (choreIdToDelete: string) => {
    if (!childProfile) return;
    const updatedChores = (childProfile.assignedChores || []).filter((chore) => chore.id !== choreIdToDelete);
    try {
        await updateUserProfile(childProfile.id, { assignedChores: updatedChores });
        setChildProfile(prev => prev ? { ...prev, assignedChores: updatedChores } : null);
        toast({ title: 'Chore Deleted', description: 'The chore has been removed from the list.' });
    } catch (error) {
        console.error('Error deleting chore:', error);
        toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the chore.' });
    }
  };

  const handleUpdateChoreStatus = async (choreToUpdate: AssignedChore, newStatus: ChoreStatus) => {
      if (!childProfile?.assignedChores || !user) return;
      
      const localChildProfile = {...childProfile};

      const updatedChores = [...(localChildProfile.assignedChores || [])];
      const baseChoreIndex = updatedChores.findIndex(c => c.id === choreToUpdate.id);
      
      if (baseChoreIndex === -1) {
          toast({variant: 'destructive', title: 'Chore not found'});
          return;
      }
      
      const baseChore = updatedChores[baseChoreIndex];

      if (baseChore.recurrence === 'one-time') {
          if(baseChore.status === newStatus) return;
          baseChore.status = newStatus;
          if (newStatus === 'completed' || newStatus === 'approved') {
              baseChore.completedAt = new Date().toISOString();
          } else {
              delete baseChore.completedAt;
          }
      } else {
          const completionDate = new Date(choreToUpdate.dueDate).toISOString().split('T')[0];
          if (!baseChore.completions) baseChore.completions = [];
          const existingCompletionIndex = baseChore.completions.findIndex(comp => comp.date === completionDate);

          if (newStatus === 'completed' || newStatus === 'approved' || newStatus === 'not-done') {
              if (existingCompletionIndex > -1) {
                 baseChore.completions[existingCompletionIndex].status = newStatus;
              } else {
                 baseChore.completions.push({ date: completionDate, status: newStatus });
              }
          } else {
              if (existingCompletionIndex > -1) {
                  baseChore.completions.splice(existingCompletionIndex, 1);
              }
          }
      }

      localChildProfile.assignedChores = updatedChores;
      let profileUpdates: Partial<UserProfile> = { assignedChores: updatedChores };

      if (isParentView && newStatus === 'approved') {
          let rewardToRedeem: {name: string, points: number} | undefined;
          
          if (choreToUpdate.recurrence === 'one-time') {
              rewardToRedeem = choreToUpdate.requestedReward;
          } else {
              const completionDate = new Date(choreToUpdate.dueDate).toISOString().split('T')[0];
              const completion = baseChore.completions?.find(c => c.date === completionDate);
              rewardToRedeem = completion?.requestedReward;
          }

          if(rewardToRedeem) {
              const newRedeemedReward: RedeemedReward = { 
                  name: rewardToRedeem.name,
                  points: rewardToRedeem.points,
                  date: new Date().toISOString(),
                  rewardRedeemed: true,
                  choreTitle: choreToUpdate.title,
                  choreDueDate: choreToUpdate.dueDate,
              };
              const updatedRewards = [...(localChildProfile.redeemedRewards || []), newRedeemedReward];
              profileUpdates.redeemedRewards = updatedRewards;
              localChildProfile.redeemedRewards = updatedRewards;
              
              if (baseChore.recurrence === 'one-time') {
                  delete baseChore.requestedReward;
              } else {
                   const completionDate = new Date(choreToUpdate.dueDate).toISOString().split('T')[0];
                   const completion = baseChore.completions?.find(c => c.date === completionDate);
                   if (completion) delete completion.requestedReward;
              }
              toast({ title: 'Reward Redeemed!', description: `${childName} has redeemed "${rewardToRedeem.name}"!`});
          }
          
            const badgeDef = badgeDefinitions.find(b => b.choreTitle === choreToUpdate.title);
            if (badgeDef) {
                const updatedBadges = { ...(localChildProfile.awardedBadges || {}) };
                updatedBadges[badgeDef.title] = (updatedBadges[badgeDef.title] || 0) + 1;
                profileUpdates.awardedBadges = updatedBadges;
                localChildProfile.awardedBadges = updatedBadges;
                toast({ title: 'Badge Awarded!', description: `You earned the "${badgeDef.title}" badge!` });
            }
      }

      try {
          await updateUserProfile(childProfile.id, profileUpdates);
          setChildProfile(localChildProfile);
          toast({ title: 'Chore Status Updated', description: 'The chore status has been changed.'});
          
          if ((user.uid === childProfile.id) && newStatus === 'completed' && childProfile.parentId) {
              await sendNotificationToParent(childProfile.parentId, {
                  message: `${childProfile.name || 'Your child'} has completed a chore: "${choreToUpdate.title}"`,
                  childId: childProfile.id,
                  choreTitle: choreToUpdate.title,
              });
              toast({ title: 'Parent Notified!', description: 'Your parent has been notified to approve your chore.' });
          }

      } catch (error) {
          console.error('Error updating chore status:', error);
          toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update chore status.' });
      }
  };
  
    const handleRequestReward = async (choreToUpdate: AssignedChore, rewardName: string) => {
        if (!childProfile || !user) return;
        
        const reward = rewards.find(r => r.name === rewardName);
        if (!reward) return;

        const updatedChores = [...(childProfile.assignedChores || [])];
        const baseChoreIndex = updatedChores.findIndex(c => c.id === choreToUpdate.id);
        if (baseChoreIndex === -1) return;

        const baseChore = updatedChores[baseChoreIndex];

        if (baseChore.recurrence === 'one-time') {
            baseChore.requestedReward = { name: reward.name, points: reward.points };
        } else {
            const completionDate = new Date(choreToUpdate.dueDate).toISOString().split('T')[0];
            if (!baseChore.completions) baseChore.completions = [];
            
            const existingCompletionIndex = baseChore.completions.findIndex(comp => comp.date === completionDate);
            if (existingCompletionIndex > -1) {
                baseChore.completions[existingCompletionIndex].requestedReward = { name: reward.name, points: reward.points };
            } else {
                baseChore.completions.push({
                    date: completionDate,
                    status: 'completed',
                    requestedReward: { name: reward.name, points: reward.points }
                });
            }
        }
        
        try {
            await updateUserProfile(childProfile.id, { assignedChores: updatedChores });
            setChildProfile(prev => prev ? { ...prev, assignedChores: updatedChores } : null);
            toast({ title: 'Reward Requested!', description: `You requested "${reward.name}". Waiting for parent approval.`});

            if (childProfile.parentId) {
              await sendNotificationToParent(childProfile.parentId, {
                  message: `${childProfile.name || 'Your child'} has requested a reward: "${reward.name}" for the chore "${choreToUpdate.title}"`,
                  childId: childProfile.id,
                  choreTitle: choreToUpdate.title,
              });
              toast({ title: 'Parent Notified!', description: 'Your parent has been notified to approve your request.' });
            }
        } catch (error) {
            console.error('Error requesting reward:', error);
            toast({ variant: 'destructive', title: 'Request Failed', description: 'Could not request the reward.' });
        }
    };

    const handleGiveBonusPoints = async () => {
        if (!childProfile || !bonusPoints || bonusPoints <= 0) return;
        
        const newReward: RedeemedReward = {
            name: 'Bonus Points',
            points: bonusPoints,
            date: new Date().toISOString(),
            rewardRedeemed: true,
            choreTitle: 'Bonus Reward from Parent',
            choreDueDate: new Date().toISOString().split('T')[0],
        };
        
        const updatedRewards = [...(childProfile.redeemedRewards || []), newReward];

        try {
            await updateUserProfile(childProfile.id, { redeemedRewards: updatedRewards });
            setChildProfile(prev => prev ? { ...prev, redeemedRewards: updatedRewards } : null);
            toast({ title: 'Bonus Points Awarded!', description: `${displayName} received ${bonusPoints} bonus points.`});
            setBonusDialogOpen(false);
            setBonusPoints(10);
        } catch (error) {
            console.error('Error awarding bonus points:', error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not award bonus points.' });
        }
    };

  const accumulatedPoints = useMemo(() => {
    const totalEarned = childProfile?.assignedChores?.reduce((sum, chore) => {
        let pointsFromChore = 0;
        if (chore.recurrence === 'one-time') {
            if (chore.status === 'approved') {
                pointsFromChore = chore.points;
            }
        } else {
            const approvedCount = chore.completions?.filter(c => c.status === 'approved').length || 0;
            pointsFromChore = approvedCount * chore.points;
        }
        return sum + pointsFromChore;
    }, 0) || 0;
    
    const totalBonusPoints = childProfile?.redeemedRewards
        ?.filter(r => r.name === 'Bonus Points')
        .reduce((sum, reward) => sum + reward.points, 0) || 0;

    const totalRedeemed = childProfile?.redeemedRewards
        ?.filter(r => r.rewardRedeemed && r.name !== 'Bonus Points')
        .reduce((sum, reward) => sum + reward.points, 0) || 0;

    return totalEarned + totalBonusPoints - totalRedeemed;
  }, [childProfile?.assignedChores, childProfile?.redeemedRewards]);

  const { upcomingChores, pastChores, completedChores } = useMemo(() => {
    if (!childProfile?.assignedChores) {
        return { upcomingChores: [], pastChores: [], completedChores: [] };
    }
    
    const allUpcoming: (AssignedChore & { instanceDueDate: string })[] = [];
    const allPast: (AssignedChore & { instanceDueDate: string })[] = [];
    const allCompleted: (AssignedChore & { completedOn: string })[] = [];


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    childProfile.assignedChores.forEach(chore => {
        const choreCreatedDate = new Date(chore.createdAt);
        const choreDueDate = new Date(chore.dueDate); // This is the END date for recurring
        choreDueDate.setHours(23, 59, 59, 999); // Ensure we include the due date itself

        if (chore.recurrence === 'one-time') {
             let status = chore.status;
             const instanceDate = new Date(chore.dueDate);
             instanceDate.setHours(0,0,0,0);
             
             if (instanceDate < today && (status === 'active' || status === 'completed')) {
                 status = 'not-done';
             }
             const instance = { ...chore, status, instanceDueDate: chore.dueDate };

             if (status === 'approved') {
                 allCompleted.push({ ...instance, completedOn: chore.completedAt || chore.dueDate });
             } else if (status === 'completed') {
                 // A 'completed' one-time chore can be upcoming (if parent hasn't approved yet) or past.
                 if(instanceDate >= today) allUpcoming.push(instance);
                 else allPast.push(instance);
             } else if (instanceDate >= today) {
                 allUpcoming.push(instance);
             } else {
                 allPast.push(instance);
             }
             return;
        }

        let currentDateIter = new Date(choreCreatedDate); 
        currentDateIter.setHours(0,0,0,0);
        
        while (currentDateIter <= choreDueDate) {
            const dateStr = currentDateIter.toISOString().split('T')[0];
            const completion = chore.completions?.find(c => c.date === dateStr);
            let status: ChoreStatus = completion?.status || 'active';

            const instanceDate = new Date(dateStr);
            instanceDate.setHours(0,0,0,0);
            
            if (instanceDate < today && (status === 'active' || status === 'completed')) {
                status = 'not-done';
            }

            const instance = {
                ...chore,
                dueDate: dateStr, // This dueDate is for this specific instance
                instanceDueDate: dateStr,
                status: status,
                requestedReward: completion?.requestedReward,
            };

            if (status === 'approved') {
                 allCompleted.push({ ...instance, completedOn: dateStr });
            } else if (status === 'completed') {
                 if (instanceDate >= today) allUpcoming.push(instance);
                 else allPast.push(instance);
            } else if (instanceDate >= today) {
                 allUpcoming.push(instance);
            } else {
                allPast.push(instance);
            }

            switch (chore.recurrence) {
                case 'daily':
                    currentDateIter.setDate(currentDateIter.getDate() + 1);
                    break;
                case 'weekly':
                    currentDateIter.setDate(currentDateIter.getDate() + 7);
                    break;
                case 'bi-weekly':
                    currentDateIter.setDate(currentDateIter.getDate() + 14);
                    break;
                case 'monthly':
                    currentDateIter.setMonth(currentDateIter.getMonth() + 1);
                    break;
                default:
                    currentDateIter = new Date(choreDueDate.getTime() + 86400000); 
                    break;
            }
        }
    });

    allUpcoming.sort((a, b) => new Date(a.instanceDueDate).getTime() - new Date(b.instanceDueDate).getTime());
    allPast.sort((a, b) => new Date(b.instanceDueDate).getTime() - new Date(a.instanceDueDate).getTime());
    allCompleted.sort((a, b) => new Date(b.completedOn).getTime() - new Date(a.completedOn).getTime());

    return { 
        upcomingChores: allUpcoming,
        pastChores: allPast,
        completedChores: allCompleted 
    };

  }, [childProfile?.assignedChores]);
  
   const awardedRewards = useMemo(() => {
    if (!childProfile?.redeemedRewards) return [];
    
    // Create a map of completed chores for easier lookup
    const completedChoresMap = new Map<string, AssignedChore & { completedOn: string }>();
    completedChores.forEach(c => {
        const key = `${c.title}-${new Date(c.completedOn).toISOString().split('T')[0]}`;
        completedChoresMap.set(key, c);
    });

    return (childProfile.redeemedRewards)
      .filter(r => r.rewardRedeemed)
      .map(reward => {
          let choreTitle = reward.choreTitle || 'Bonus Reward';
          // Try to find the matching completed chore
          if(reward.choreTitle && reward.choreDueDate) {
              const key = `${reward.choreTitle}-${reward.choreDueDate}`;
              const matchedChore = completedChoresMap.get(key) || completedChores.find(c => c.title === reward.choreTitle && new Date(c.completedOn).toISOString().split('T')[0] === reward.choreDueDate);

              if (matchedChore) {
                  choreTitle = matchedChore.title;
              }
          }
          return {
              ...reward,
              choreTitle: choreTitle
          };
       })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   }, [childProfile?.redeemedRewards, completedChores]);
   
   const awardedBadges = useMemo(() => {
        return childProfile?.awardedBadges || {};
   }, [childProfile?.awardedBadges]);

  const isParentView = parentProfile?.role === 'parent' && user?.uid !== childId;
  const isChildView = user?.uid === childId;

  const handleLogout = async () => {
    try {
      setLoading(true);
      await auth.signOut();
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.clear();
        window.location.replace('/login');
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.clear();
        window.location.replace('/login');
      }
    }
  };


  const ChoreTable = ({ chores, type, showDetails }: { chores: (AssignedChore & { instanceDueDate?: string, requestedReward?: { name: string, points: number }, completedOn?: string })[], type: ChoreTableType, showDetails?: boolean }) => {
    const isMobileHidden = (colType: 'points' | 'recurrence' | 'rewards' | 'status' | 'action') => {
        if (showDetails) return '';

        const commonHidden = 'hidden md:table-cell';
        
        if(isParentView) {
            switch(type) {
                case 'upcoming': return ['points', 'recurrence', 'rewards', 'action'].includes(colType) ? commonHidden : '';
                case 'completed': return ['recurrence', 'rewards'].includes(colType) ? commonHidden : '';
                case 'past': return ['points', 'recurrence', 'rewards', 'action'].includes(colType) ? commonHidden : '';
                default: return '';
            }
        }
        
        if (isChildView) {
             switch(type) {
                case 'upcoming': return ['points', 'recurrence', 'rewards'].includes(colType) ? commonHidden : '';
                case 'completed': return ['recurrence', 'rewards'].includes(colType) ? commonHidden : '';
                case 'past': return ['points', 'recurrence', 'rewards', 'action'].includes(colType) ? commonHidden : '';
                default: return '';
            }
        }

        return '';
    };

    const cellPadding = 'px-2 py-3 md:px-4 md:py-4';
    
    if (chores.length === 0) {
      return (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No chores in this category.</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chore</TableHead>
              <TableHead className={isMobileHidden('points')}>{type === "completed" ? "Points Earned" : "Points"}</TableHead>
              <TableHead>{type === "completed" ? "Completed On" : "Due Date"}</TableHead>
              <TableHead className={isMobileHidden('recurrence')}>Recurrence</TableHead>
              <TableHead className={isMobileHidden('status')}>Status</TableHead>
              <TableHead className={isMobileHidden('rewards')}>Rewards</TableHead>
              <TableHead className={`text-right ${isMobileHidden('action')}`}>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chores.map((chore, index) => {
              const isApproved = chore.status === 'approved';
              const rewardRequested = !!chore.requestedReward;
              const rewardRedeemed = awardedRewards.some(r => r.choreTitle === chore.title && r.choreDueDate === (chore.instanceDueDate || chore.dueDate));
              
              return (
                <TableRow key={`${chore.id}-${chore.instanceDueDate || index}`} className={isApproved && type !== 'completed' ? 'line-through' : ''}>
                  <TableCell className={cellPadding}>{chore.title}</TableCell>
                  <TableCell className={`${isMobileHidden('points')} ${cellPadding}`}>{chore.points}</TableCell>
                  <TableCell className={cellPadding}>{new Date(chore.completedOn || chore.instanceDueDate || chore.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className={`capitalize ${isMobileHidden('recurrence')} ${cellPadding}`}>{chore.recurrence?.replace('-', ' ')}</TableCell>
                  <TableCell className={`${isMobileHidden('status')} ${cellPadding}`}>
                    {isParentView && type !== 'completed' ? (
                         <Select
                            value={chore.status}
                            onValueChange={(value: ChoreStatus) => handleUpdateChoreStatus(chore, value)}
                            disabled={isApproved}
                          >
                            <SelectTrigger
                              className={`w-28 text-xs h-8 bg-basalt-stones text-white-dove`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-basalt-stones">
                              <SelectItem className="text-white-dove focus:bg-gray-700 focus:text-white-dove" value="active">Active</SelectItem>
                              <SelectItem className="text-white-dove focus:bg-gray-700 focus:text-white-dove" value="completed">Completed</SelectItem>
                              <SelectItem className="text-white-dove focus:bg-gray-700 focus:text-white-dove" value="not-done">Not Done</SelectItem>
                              <SelectItem className="text-white-dove focus:bg-gray-700 focus:text-white-dove" value="approved">Approved</SelectItem>
                            </SelectContent>
                          </Select>
                    ) : (
                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            chore.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : chore.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : chore.status === 'not-done'
                                ? 'bg-red-100 text-red-800'
                                : chore.status === 'active'
                                ? 'bg-basalt-stones text-white-dove'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                        >
                           {toCamelCase(chore.status.replace('-', ' '))}
                        </span>
                    )}
                  </TableCell>
                   <TableCell className={`${isMobileHidden('rewards')} ${cellPadding}`}>
                        {(chore.status === 'completed' && isChildView && !rewardRequested) ? (
                            <Select 
                                onValueChange={(value) => handleRequestReward(chore, value)}
                                disabled={rewardRequested}
                            >
                                <SelectTrigger className="w-full sm:w-48 bg-basalt-stones text-white-dove">
                                    <SelectValue placeholder="Select a reward..." />
                                </SelectTrigger>
                                <SelectContent className="bg-basalt-stones">
                                    {rewards.map(reward => (
                                        <SelectItem 
                                            key={reward.name} 
                                            value={reward.name}
                                            disabled={accumulatedPoints < reward.points}
                                            className="text-white-dove focus:bg-gray-700 focus:text-white-dove"
                                        >
                                            {reward.name} ({reward.points} pts)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : rewardRequested ? (
                            <span className="text-sm text-muted-foreground italic">
                                {chore.requestedReward?.name} (Requested)
                            </span>
                        ) : rewardRedeemed ? (
                             <span className="text-sm text-emerald-800">
                               Redeemed
                            </span>
                        ) : null}
                    </TableCell>
                  <TableCell className={`text-right flex items-center justify-end space-x-2 ${isMobileHidden('action')} ${cellPadding}`}>
                      {isParentView && chore.status === 'completed' && !isApproved && (
                      <Button variant="ghost" size="icon" onClick={() => handleUpdateChoreStatus(chore, 'approved')}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                      )}
                      {isChildView && chore.status === 'active' && (
                      <Button variant="outline" size="sm" className="text-basalt-stones border-basalt-stones" onClick={() => handleUpdateChoreStatus(chore, 'completed')}>
                              Complete
                          </Button>
                      )}
                      {isParentView && !isApproved && type !== 'completed' && (
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-basalt-stones text-white-dove border-gray-700">
                              <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white-dove">Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-white-dove/80">
                                      This action cannot be undone. This will permanently delete the chore definition and all its instances.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel className="border-gray-600 text-white-dove bg-transparent hover:bg-gray-700 hover:text-white-dove">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteChore(chore.id)} className="bg-destructive hover:bg-destructive/90 text-white-dove border border-gray-500">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                      )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    );
  };
  if (loading || !childProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading child dashboard...</p>
      </div>
    );
  }

  const displayName = toCamelCase(childName || childProfile.email.split('@')[0]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
       <AlertDialog open={isBonusDialogOpen} onOpenChange={setBonusDialogOpen}>
          <AlertDialogContent className="bg-basalt-stones text-white-dove border-gray-700">
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-white-dove">Give Bonus Points</AlertDialogTitle>
                  <AlertDialogDescription className="text-white-dove/80">
                      Award some extra points to {displayName} for good behavior or extra effort!
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 my-4">
                  <Label htmlFor="bonus-points" className="text-white-dove">Bonus Points</Label>
                  <Input 
                      id="bonus-points"
                      type="number"
                      value={bonusPoints}
                      onChange={(e) => setBonusPoints(parseInt(e.target.value, 10))}
                      placeholder="10"
                      className="bg-gray-800 border-gray-600 text-white-dove"
                  />
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel className="border-gray-600 text-white-dove bg-transparent hover:bg-gray-700 hover:text-white-dove">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleGiveBonusPoints} className="border border-gray-500 bg-basalt-stones text-white-dove hover:bg-gray-700">Award Points</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <div className="w-full max-w-6xl p-4 sm:p-8">
        <div className="mb-8">
            {isParentView && (
              <Button variant="ghost" onClick={() => router.push('/chore-champ')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Parent Dashboard
              </Button>
            )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
            <div className="flex items-center space-x-4 flex-grow">
              <Image src="/ChoresChampLogo.png" alt="Chores Champ Logo" width={64} height={64} className="rounded-lg" />
                <div className="flex-grow">
                    <div className="flex justify-between items-baseline">
                        <h1 className="text-2xl sm:text-3xl font-bold">
                            {displayName}&apos;s Dashboard
                        </h1>
                        <p className="sm:hidden text-xs font-medium text-muted-foreground w-full text-right">
                           {currentDate}
                        </p>
                    </div>
                    <div className="flex items-baseline space-x-2 mt-1">
                        <p className="text-sm text-muted-foreground">Total Points Earned:</p>
                        <p className="text-lg font-bold">{accumulatedPoints}</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end w-full sm:w-auto mt-4 sm:mt-0">
                {isChildView && (
                    <Button onClick={handleLogout} variant="navy">
                        Logout
                    </Button>
                )}
                 <div className="hidden sm:block w-full text-right mt-2 sm:mt-0">
                     <p className="text-base font-medium text-muted-foreground">
                        {currentDate}
                    </p>
                </div>
            </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <Card className="bg-dark-natural-light">
                    <CardHeader
                        className="flex flex-row items-center justify-between cursor-pointer"
                        onClick={() => setChildDetailsExpanded(!isChildDetailsExpanded)}
                    >
                      <CardTitle className="text-xl sm:text-2xl">Child Details</CardTitle>
                      <span>{isChildDetailsExpanded ? <ChevronUp /> : <ChevronDown />}</span>
                    </CardHeader>
                    {isChildDetailsExpanded && (
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center space-y-4">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={childProfile.avatar} alt={displayName} />
                                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div>
                                <Label htmlFor="child-name">Child&apos;s Name</Label>
                                <Input 
                                    id="child-name"
                                    type="text"
                                    placeholder="e.g., Jane"
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    onBlur={handleUpdateChildName}
                                    disabled={!isParentView || !!childProfile.name}
                                />
                            </div>
                            <div>
                                <Label htmlFor="child-age">Child&apos;s Age</Label>
                                <Input 
                                    id="child-age"
                                    type="number"
                                    placeholder="e.g., 7"
                                    value={childAge}
                                    onChange={(e) => setChildAge(e.target.value)}
                                    onBlur={handleUpdateChildAge}
                                    disabled={!isParentView || !!childProfile.age}
                                />
                            </div>
                            <div>
                                <Label htmlFor="child-gender">Child&apos;s Gender</Label>
                                <Select 
                                    onValueChange={(value: Gender) => handleUpdateChildGender(value)} 
                                    disabled={!isParentView || !!childProfile.gender || avatarsLoading}
                                    value={childGender}
                                >
                                    <SelectTrigger id="child-gender" className="bg-dark-natural-light text-olive-green">
                                        <SelectValue placeholder={avatarsLoading ? "Assigning avatar..." : "Select gender"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-dark-natural-light">
                                        <SelectItem value="boy" className="focus:bg-natural-light text-olive-green focus:text-olive-green">Boy</SelectItem>
                                        <SelectItem value="girl" className="focus:bg-natural-light text-olive-green focus:text-olive-green">Girl</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    )}
                </Card>


                {isParentView && childProfile.age && (
                    <Card className="bg-sunset-sky">
                        <CardHeader>
                            <CardTitle className="text-xl sm:text-2xl">Assign Chores</CardTitle>
                            <CardDescription>Assign suggested or custom chores to your child.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="border rounded-lg border-dark-sunset-sky bg-dark-sunset-sky">
                                <button
                                    className="w-full flex justify-between items-center p-4 text-left font-medium"
                                    onClick={() => setCustomChoreExpanded(!isCustomChoreExpanded)}
                                >
                                    <span>Create Custom Chore</span>
                                    {isCustomChoreExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </button>
                                {isCustomChoreExpanded && (
                                    <div className="p-4 border-t space-y-4 border-dark-sunset-sky bg-dark-sunset-sky">
                                        <div>
                                            <Label htmlFor="custom-chore-title">Title</Label>
                                            <Input
                                                id="custom-chore-title"
                                                value={customChoreTitle}
                                                onChange={(e) => setCustomChoreTitle(e.target.value)}
                                                placeholder="e.g., Feed the fish"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="custom-chore-desc">Description</Label>
                                            <Input
                                                id="custom-chore-desc"
                                                value={customChoreDescription}
                                                onChange={(e) => setCustomChoreDescription(e.target.value)}
                                                placeholder="e.g., One pinch of flakes"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="custom-points">Points</Label>
                                                <Input id="custom-points" type="number" placeholder="10" 
                                                   value={customChoreSettings.points}
                                                   onChange={(e) => setCustomChoreSettings(prev => ({...prev, points: parseInt(e.target.value) || 10 }))}
                                                />
                                            </div>
                                             <div>
                                                <Label htmlFor="custom-recurrence">Recurrence</Label>
                                                <Select
                                                    onValueChange={(value: Recurrence) => setCustomChoreSettings(prev => ({ ...prev, recurrence: value }))}
                                                    value={customChoreSettings.recurrence}
                                                >
                                                    <SelectTrigger id="custom-recurrence" className="bg-dark-sunset-sky"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-very-dark-sunset-sky">
                                                        <SelectItem value="one-time" className="focus:bg-dark-sunset-sky focus:text-foreground">One-time</SelectItem>
                                                        <SelectItem value="daily" className="focus:bg-dark-sunset-sky focus:text-foreground">Daily</SelectItem>
                                                        <SelectItem value="weekly" className="focus:bg-dark-sunset-sky focus:text-foreground">Weekly</SelectItem>
                                                        <SelectItem value="bi-weekly" className="focus:bg-dark-sunset-sky focus:text-foreground">Bi-weekly</SelectItem>
                                                        <SelectItem value="monthly" className="focus:bg-dark-sunset-sky focus:text-foreground">Monthly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="custom-due-date">Due Date</Label>
                                            <Input id="custom-due-date" type="date"
                                                className="w-auto"
                                                value={customChoreSettings.dueDate}
                                                onChange={(e) => setCustomChoreSettings(prev => ({...prev, dueDate: e.target.value }))}
                                                onKeyDown={(e) => e.preventDefault()}
                                                max={maxDueDate}
                                            />
                                        </div>
                                        <Button onClick={handleAddCustomChore} className="w-full bg-basalt-stones text-white-dove">
                                            Assign Custom Chore
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="border-t pt-4 border-dark-sunset-sky">
                                <h4 className="font-semibold text-md mb-2">Suggested Chores</h4>
                                {suggestedChores.length > 0 ? (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {suggestedChores.map((chore) => {
                                            const isExpanded = expandedChoreId === chore.id;
                                            return (
                                            <div key={chore.id} className="border rounded-lg border-dark-sunset-sky bg-dark-sunset-sky">
                                                <button
                                                    className="w-full flex justify-between items-center p-4 text-left"
                                                    onClick={() => setExpandedChoreId(isExpanded ? null : chore.id)}
                                                >
                                                    <span className="font-medium">{chore.title}</span>
                                                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                </button>
                                                {isExpanded && (
                                                    <div className="p-4 border-t space-y-4 border-dark-sunset-sky bg-dark-sunset-sky">
                                                        <p className="text-sm text-muted-foreground">{chore.description}</p>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label htmlFor={`points-${chore.id}`}>Points</Label>
                                                                <Input
                                                                    id={`points-${chore.id}`}
                                                                    type="number"
                                                                    placeholder="10"
                                                                    value={choreSettings[chore.id]?.points || ''}
                                                                    onChange={(e) => setChoreSettings(prev => ({ ...prev, [chore.id]: { ...prev[chore.id], points: parseInt(e.target.value) || 10 } }))}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label htmlFor={`recurrence-${chore.id}`}>Recurrence</Label>
                                                                <Select
                                                                    onValueChange={(value: Recurrence) => setChoreSettings(prev => ({ ...prev, [chore.id]: { ...prev[chore.id], recurrence: value } }))}
                                                                    defaultValue="one-time"
                                                                >
                                                                    <SelectTrigger id={`recurrence-${chore.id}`} className="bg-dark-sunset-sky"><SelectValue /></SelectTrigger>
                                                                    <SelectContent className="bg-very-dark-sunset-sky">
                                                                        <SelectItem value="one-time" className="focus:bg-dark-sunset-sky focus:text-foreground">One-time</SelectItem>
                                                                        <SelectItem value="daily" className="focus:bg-dark-sunset-sky focus:text-foreground">Daily</SelectItem>
                                                                        <SelectItem value="weekly" className="focus:bg-dark-sunset-sky focus:text-foreground">Weekly</SelectItem>
                                                                        <SelectItem value="bi-weekly" className="focus:bg-dark-sunset-sky focus:text-foreground">Bi-weekly</SelectItem>
                                                                        <SelectItem value="monthly" className="focus:bg-dark-sunset-sky focus:text-foreground">Monthly</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label htmlFor={`due-date-${chore.id}`}>Due Date</Label>
                                                            <Input
                                                                id={`due-date-${chore.id}`}
                                                                type="date"
                                                                className="w-auto"
                                                                value={choreSettings[chore.id]?.dueDate || ''}
                                                                onChange={(e) => setChoreSettings(prev => ({ ...prev, [chore.id]: { ...prev[chore.id], dueDate: e.target.value } }))}
                                                                onKeyDown={(e) => e.preventDefault()}
                                                                max={maxDueDate}
                                                            />
                                                        </div>
                                                        <Button onClick={() => handleAddChore(chore, chore.id)} className="w-full bg-basalt-stones text-white-dove">
                                                            Assign Chore
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )})}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm text-center">No suggested chores for this age.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
                 {isParentView && !childProfile.age && (
                    <div className="space-y-4 p-4 border rounded-lg text-center">
                        <p className="text-muted-foreground text-sm">Please enter an age for your child to see suggested chores.</p>
                    </div>
                )}
            </div>
            
            <div className="md:col-span-2 space-y-8">
                 <div className="grid md:grid-cols-2 gap-8">
                     <Card className="bg-mist">
                        <CardHeader
                            className="flex flex-row items-center justify-between cursor-pointer"
                            onClick={() => setRewardsExpanded(!isRewardsExpanded)}
                        >
                            <div>
                                <CardTitle className="text-xl sm:text-2xl">Rewards</CardTitle>
                                <CardDescription>Rewards that have been approved by a parent.</CardDescription>
                            </div>
                            <div className="flex items-center">
                                {isParentView && (
                                    <Button variant="navy" onClick={(e) => { e.stopPropagation(); setBonusDialogOpen(true); }}>
                                        <Gift className="mr-2 h-4 w-4 text-white-dove" /> Give Bonus
                                    </Button>
                                )}
                                 <span className="ml-2 cursor-pointer" onClick={() => setRewardsExpanded(!isRewardsExpanded)}>{isRewardsExpanded ? <ChevronUp /> : <ChevronDown />}</span>
                            </div>
                        </CardHeader>
                        {isRewardsExpanded && (
                            <CardContent>
                                {awardedRewards.length > 0 ? (
                                    <div className="max-h-96 overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Task</TableHead>
                                                    <TableHead>Reward</TableHead>
                                                    <TableHead className="text-right">Points</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {awardedRewards.map((reward, index) => (
                                                    <TableRow key={`${reward.name}-${index}`}>
                                                        <TableCell className="font-medium">{reward.choreTitle || '-'}</TableCell>
                                                        <TableCell>{reward.name}</TableCell>
                                                        <TableCell className="text-right">{reward.points}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center p-8">
                                        <p className="text-muted-foreground">No rewards have been awarded yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                    <Card className="bg-very-light-bamboo-wood">
                         <CardHeader
                            className="flex flex-row items-center justify-between cursor-pointer"
                            onClick={() => setBadgesExpanded(!isBadgesExpanded)}
                         >
                            <div>
                                <CardTitle className="text-xl sm:text-2xl">Badges</CardTitle>
                                <CardDescription>Unlock badges by completing chores!</CardDescription>
                            </div>
                             <span className="cursor-pointer">{isBadgesExpanded ? <ChevronUp /> : <ChevronDown />}</span>
                        </CardHeader>
                        {isBadgesExpanded && (
                            <CardContent>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                                    {badgeDefinitions.map((badge) => {
                                        const badgeCount = awardedBadges[badge.title] || 0;
                                        const isAwarded = badgeCount > 0;
                                        const BadgeIcon = badge.icon;
                                        const color = isAwarded ? getBadgeColor(badge.title) : '#E5E7EB';
                                        return (
                                            <div key={badge.title} className="relative flex flex-col items-center space-y-2" title={`${badge.title}${isAwarded ? ` (x${badgeCount})` : ''}`}>
                                                <div className="p-3 rounded-full" style={{ backgroundColor: color, color: isAwarded ? 'white' : '#9CA3AF' }}>
                                                    <BadgeIcon className="h-8 w-8" />
                                                </div>
                                                {isAwarded && (
                                                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                                        {badgeCount}
                                                    </span>
                                                )}
                                                <p className={`text-xs text-center font-medium ${isAwarded ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {badge.title}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                 </div>

                <Card className="bg-concrete">
                     <CardHeader
                        className="flex flex-row items-center justify-between cursor-pointer"
                        onClick={() => setUpcomingChoresExpanded(!isUpcomingChoresExpanded)}
                     >
                        <CardTitle className="text-xl sm:text-2xl">Upcoming Chores ({upcomingChores.length})</CardTitle>
                        <div className="flex items-center space-x-2">
                             <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setUpcomingDetailsExpanded(!isUpcomingDetailsExpanded); }}
                                className="md:hidden"
                            >
                                {isUpcomingDetailsExpanded ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                {isUpcomingDetailsExpanded ? 'Hide' : 'Show'}
                            </Button>
                            <span onClick={(e) => { e.stopPropagation(); setUpcomingChoresExpanded(!isUpcomingChoresExpanded); }}>
                                {isUpcomingChoresExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </span>
                        </div>
                    </CardHeader>
                    {isUpcomingChoresExpanded && (
                        <CardContent>
                           <ChoreTable chores={upcomingChores} type="upcoming" showDetails={isUpcomingDetailsExpanded} />
                        </CardContent>
                    )}
                 </Card>
                 
                <Card className="bg-very-light-navy">
                    <CardHeader
                        className="flex flex-row items-center justify-between cursor-pointer"
                        onClick={() => setCompletedChoresExpanded(!isCompletedChoresExpanded)}
                    >
                        <CardTitle className="text-xl sm:text-2xl">Completed Chores ({completedChores.length})</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setCompletedDetailsExpanded(!isCompletedDetailsExpanded); }}
                                className="md:hidden"
                            >
                                {isCompletedDetailsExpanded ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                {isCompletedDetailsExpanded ? 'Hide' : 'Show'}
                            </Button>
                             <span onClick={(e) => { e.stopPropagation(); setCompletedChoresExpanded(!isCompletedChoresExpanded); }}>
                                {isCompletedChoresExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </span>
                        </div>
                    </CardHeader>
                    {isCompletedChoresExpanded && (
                        <CardContent>
                           <ChoreTable chores={completedChores} type="completed" showDetails={isCompletedDetailsExpanded} />
                        </CardContent>
                    )}
                </Card>
                 
                <Card className="bg-very-light-zen-garden">
                    <CardHeader 
                        className="flex flex-row items-center justify-between cursor-pointer"
                        onClick={() => setPastChoresExpanded(!isPastChoresExpanded)}
                    >
                        <CardTitle className="text-xl sm:text-2xl">Past Chores ({pastChores.length})</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setPastDetailsExpanded(!isPastDetailsExpanded); }}
                                className="md:hidden"
                            >
                                {isPastDetailsExpanded ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                {isPastDetailsExpanded ? 'Hide' : 'Show'}
                            </Button>
                            <span onClick={(e) => { e.stopPropagation(); setPastChoresExpanded(!isPastChoresExpanded); }}>
                                {isPastChoresExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </span>
                        </div>
                    </CardHeader>
                    {isPastChoresExpanded && (
                        <CardContent>
                           <ChoreTable chores={pastChores} type="past" showDetails={isPastDetailsExpanded} />
                        </CardContent>
                    )}
                </Card>

                <Card className="bg-very-light-olive-green">
                    <CardHeader 
                      className="flex flex-row items-center justify-between cursor-pointer"
                      onClick={() => setRewardsReferenceExpanded(!isRewardsReferenceExpanded)}
                    >
                        <div>
                            <CardTitle className="text-xl sm:text-2xl">Rewards Reference</CardTitle>                            <CardDescription>Points required to redeem each reward.</CardDescription>
                        </div>
                        {isRewardsReferenceExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </CardHeader>
                    {isRewardsReferenceExpanded && (
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Reward</TableHead>
                                            <TableHead className="text-right">Points</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rewards.map((reward) => (
                                            <TableRow key={reward.name}>
                                                <TableCell className="font-medium">{reward.name}</TableCell>
                                                <TableCell className="text-right">{reward.points}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
