
'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  auth,
  getUserProfile,
  type UserProfile,
  type Notification,
  getAllUsers,
  updateUserAccountStatus,
  getChildProfiles,
  updateUserProfile,
  type AssignedChore,
  signUpWithEmail,
  createUserProfile,
  type RedeemedReward,
  markNotificationsAsRead,
  firebaseSignOut,
  type Reward,
  defaultRewards,
  saveFeedback,
  getAllFeedback,
  markFeedbackAsRead,
  type Feedback,
} from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { z } from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAuthErrorMessage } from '@/lib/utils';
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
import { Bell, PlusCircle, ChevronDown, ChevronUp, Trash2, Eye, EyeOff, Save, XCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';


interface UserWithId extends UserProfile {
  id: string;
}

const NewChildSchema = z.object({
  childEmail: z.string().email({
    message: 'Please enter a valid email address for the child.',
  }),
  childPassword: z.string().min(6, {
      message: 'Child\'s password must be at least 6 characters long.',
  }),
});

type NewChildFormValues = z.infer<typeof NewChildSchema>;

interface ChildSummary {
  id: string;
  name: string;
  avatar?: string;
  gender?: 'boy' | 'girl';
  completedLast30Days: number;
  notDoneLast30Days: number;
  activeNext30Days: number;
  totalPoints: number;
  redeemedPointsLast30Days: number;
}


const toCamelCase = (str: string) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};


export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserWithId[]>([]);
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [childAccounts, setChildAccounts] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [parentName, setParentName] = useState('');
  const [isCreateChildOpen, setCreateChildOpen] = useState(false);
  const [isRewardsSummaryExpanded, setRewardsSummaryExpanded] = useState(false);
  const [isRewardsReportExpanded, setRewardsReportExpanded] = useState(false);
  const [isChoreManagementExpanded, setChoreManagementExpanded] = useState(false);
  const [isAvatarsExpanded, setAvatarsExpanded] = useState(false);
  const [avatarImages, setAvatarImages] = useState<string[]>([]);
  const [logoImages, setLogoImages] = useState<string[]>([]);
  
  // State for chore management
  const [selectedChildForDeletion, setSelectedChildForDeletion] = useState<string | null>(null);
  const [choresToDelete, setChoresToDelete] = useState<string[]>([]);
  
  // State for summary table column visibility
  const [showExtendedSummary, setShowExtendedSummary] = useState(false);

  // State for editable rewards
  const [rewards, setRewards] = useState<Reward[]>(defaultRewards);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardPoints, setNewRewardPoints] = useState<string>('');
  const [hasRewardsChanged, setHasRewardsChanged] = useState(false);

  // State for contact us form
  const [feedback, setFeedback] = useState('');
  const [isContactUsExpanded, setContactUsExpanded] = useState(false);
  const contactUsRef = useRef<HTMLDivElement>(null);
  
  // State for admin view
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback[] | null>(null);
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedParentForPayment, setSelectedParentForPayment] = useState<UserWithId | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');


  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewChildFormValues>({
    resolver: zodResolver(NewChildSchema),
  });

  const fetchAllUsers = useCallback(async () => {
    try {
      const users = await getAllUsers();
      return users.map((u) => ({ ...u.data(), id: u.id })) as UserWithId[];
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Error fetching users',
        description: 'Could not load user list.',
      });
      return [];
    }
  }, [toast]);
  
  const fetchAllFeedback = useCallback(async () => {
    try {
        const feedbackList = await getAllFeedback();
        setAllFeedback(feedbackList);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        toast({
            variant: 'destructive',
            title: 'Error fetching feedback',
            description: 'Could not load feedback list.',
        });
    }
  }, [toast]);

  const fetchProfileAndChildren = useCallback(async (uid: string) => {
    try {
      const userProfile = await getUserProfile(uid);
      if (!userProfile) {
          console.error('User profile not found for uid:', uid);
          return null; 
      }
      
      if (userProfile.role === 'child') {
          router.push(`/chore-champ/${uid}`);
          return null; 
      }
      
      setProfile(userProfile);
      setParentName(toCamelCase(userProfile.name || userProfile.email.split('@')[0]));
      const userRewards = userProfile.rewards && userProfile.rewards.length > 0 ? userProfile.rewards : defaultRewards;
      setRewards(userRewards);
      
      if (userProfile.role === 'parent' && userProfile.childUids?.length) {
          const childrenDocs = await getChildProfiles(userProfile.childUids);
          setChildAccounts(childrenDocs);
      }
      
      return userProfile;
    } catch (error) {
      console.error('Error fetching profile and children:', error);
      return null;
    }
  }, [router]);

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));

    const ADMIN_EMAIL = 'nicklesh@gmail.com';

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setLoading(true);
          setUser(currentUser);
          
          const userProfile = await getUserProfile(currentUser.uid);
          if (!userProfile) {
              if (typeof window !== 'undefined') {
                window.location.replace('/login');
              } else {
                router.push('/login');
              }
              return;
          }

          const userEmail = (currentUser.email || userProfile.email || '').toLowerCase().trim();
          const isUserAuthorizedAdmin = userEmail === ADMIN_EMAIL;

          // If a non-admin account had role 'admin' in Firestore, demote to 'parent'
          if (userProfile.role === 'admin' && !isUserAuthorizedAdmin) {
              console.warn(`Non-admin user ${userEmail} had admin role; reverting to parent.`);
              await updateUserProfile(currentUser.uid, { role: 'parent' });
              userProfile.role = 'parent';
          }

          setProfile(userProfile);
          setParentName(toCamelCase(userProfile.name || userProfile.email.split('@')[0]));
          const userRewards = userProfile.rewards && userProfile.rewards.length > 0 ? userProfile.rewards : defaultRewards;
          setRewards(userRewards);
          
          if (isUserAuthorizedAdmin && userProfile.role === 'admin') {
              const allSystemUsers = await fetchAllUsers();
              setAllUsers(allSystemUsers);
              await fetchAllFeedback();
          } else if (userProfile.role === 'child') {
              router.push(`/chore-champ/${currentUser.uid}`);
              return;
          } else {
              await fetchProfileAndChildren(currentUser.uid);
          }
          
          setLoading(false);
        } else {
          if (window.location.pathname.startsWith('/chore-champ')) {
            if (typeof window !== 'undefined') {
              window.location.replace('/login');
            } else {
              router.push('/login');
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth state change error in dashboard:', error);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, fetchAllUsers, fetchProfileAndChildren, fetchAllFeedback]);

  useEffect(() => {
      if(profile?.rewards) {
          const initialRewards = JSON.stringify(profile.rewards);
          const currentRewards = JSON.stringify(rewards);
          setHasRewardsChanged(initialRewards !== currentRewards);
      } else if (profile) { // This handles the case where profile exists but rewards are not set
          const defaultRewardsString = JSON.stringify(defaultRewards);
          const currentRewards = JSON.stringify(rewards);
          setHasRewardsChanged(defaultRewardsString !== currentRewards);
      }
  }, [rewards, profile]);

  const calculateTotalPoints = (chores: AssignedChore[] = []): number => {
    return chores.reduce((sum, chore) => {
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
    }, 0);
  };

  const calculateRedeemedPoints = (redeemedRewards: RedeemedReward[] = [], includeBonus = false): number => {
      return redeemedRewards
        .filter(r => r.rewardRedeemed && (includeBonus || r.name !== 'Bonus Points'))
        .reduce((sum, reward) => sum + reward.points, 0);
  };


  const childSummaries: ChildSummary[] = useMemo(() => {
    if (!childAccounts.length) return [];

    return childAccounts.map(child => {
        let completedLast30Days = 0;
        let notDoneLast30Days = 0;
        let activeNext30Days = 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const chores = child.assignedChores || [];

        chores.forEach(chore => {
            const processInstance = (dueDateStr: string, status: 'approved' | 'completed' | 'not-done' | 'active') => {
                const dueDate = new Date(dueDateStr);
                dueDate.setHours(0, 0, 0, 0);

                if (dueDate >= thirtyDaysAgo && dueDate < today) {
                    if (status === 'approved' || status === 'completed') completedLast30Days++;
                    if (status === 'not-done') notDoneLast30Days++;
                }

                if (dueDate >= today && dueDate <= thirtyDaysFromNow) {
                    if (status === 'active') activeNext30Days++;
                }
            };
            
            if (chore.recurrence === 'one-time') {
                let status = chore.status;
                const choreDueDate = new Date(chore.dueDate);
                choreDueDate.setHours(0,0,0,0);
                if (choreDueDate < today && status === 'active') {
                    status = 'not-done';
                }
                processInstance(chore.dueDate, status);
            } else {
                let currentDate = new Date(chore.createdAt);
                currentDate.setHours(0,0,0,0);
                const endDate = new Date(chore.dueDate);
                endDate.setHours(0,0,0,0);

                while(currentDate <= endDate && currentDate <= thirtyDaysFromNow) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const completion = chore.completions?.find(c => c.date === dateStr);
                    let status: 'active' | 'completed' | 'not-done' | 'approved' = completion?.status || 'active';
                    
                    if (currentDate < today && status === 'active') {
                        status = 'not-done';
                    }

                    processInstance(dateStr, status);

                    switch (chore.recurrence) {
                        case 'daily': currentDate.setDate(currentDate.getDate() + 1); break;
                        case 'weekly': currentDate.setDate(currentDate.getDate() + 7); break;
                        case 'bi-weekly': currentDate.setDate(currentDate.getDate() + 14); break;
                        case 'monthly': currentDate.setMonth(currentDate.getMonth() + 1); break;
                        default: currentDate = new Date(endDate.getTime() + 86400000); break; // End loop
                    }
                }
            }
        });

        const totalEarned = calculateTotalPoints(child.assignedChores);
        const bonusPoints = (child.redeemedRewards || []).filter(r => r.name === 'Bonus Points').reduce((s, r) => s + r.points, 0);
        const totalRedeemed = calculateRedeemedPoints(child.redeemedRewards);
        
        const redeemedLast30Days = (child.redeemedRewards || [])
            .filter(r => new Date(r.date) >= thirtyDaysAgo && r.rewardRedeemed)
            .reduce((sum, r) => sum + r.points, 0);

        return {
            id: child.id,
            name: toCamelCase(child.name || child.email.split('@')[0]),
            avatar: child.avatar,
            gender: child.gender,
            completedLast30Days,
            notDoneLast30Days,
            activeNext30Days,
            totalPoints: totalEarned + bonusPoints - totalRedeemed,
            redeemedPointsLast30Days: redeemedLast30Days,
        };
    });

  }, [childAccounts]);

    const rewardsReport = useMemo(() => {
        return childAccounts.map(child => {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const recentRedemptions = (child.redeemedRewards || []).filter(r => new Date(r.date) >= oneYearAgo && r.rewardRedeemed);

            const totalRewards = recentRedemptions.length;
            const totalPoints = recentRedemptions.reduce((sum, r) => sum + r.points, 0);

            return {
                id: child.id,
                name: toCamelCase(child.name || child.email.split('@')[0]),
                avatar: child.avatar,
                gender: child.gender,
                totalRewards,
                totalPoints,
            };
        });
    }, [childAccounts]);

    const totalRedeemedRewards = useMemo(() => {
        return rewardsReport.reduce((sum, report) => sum + report.totalRewards, 0);
    }, [rewardsReport]);

  const accumulatedPoints = useMemo(() => {
    if (!profile) return 0;
    const totalEarned = calculateTotalPoints(profile.assignedChores);
    const totalRedeemed = calculateRedeemedPoints(profile.redeemedRewards);
    return totalEarned - totalRedeemed;
  }, [profile]);

  const completedChores = useMemo(() => {
    if (!profile?.assignedChores) return [];
    
    const allCompleted: (AssignedChore & { instanceDueDate: string, completedOn: string })[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    profile.assignedChores.forEach(chore => {
        if (chore.recurrence === 'one-time') {
            if (chore.status === 'completed' || chore.status === 'approved') {
                allCompleted.push({
                    ...chore,
                    instanceDueDate: chore.dueDate,
                    completedOn: chore.completedAt || chore.dueDate
                });
            }
        } else {
            // Handle recurring chores
            chore.completions?.forEach(completion => {
                if (completion.status === 'completed' || completion.status === 'approved') {
                    allCompleted.push({
                        ...chore,
                        dueDate: completion.date,
                        instanceDueDate: completion.date,
                        status: completion.status,
                        completedOn: completion.date,
                    });
                }
            });
        }
    });

    allCompleted.sort((a, b) => new Date(b.completedOn).getTime() - new Date(a.completedOn).getTime());
    return allCompleted;
  }, [profile?.assignedChores]);


  const handleLogout = async () => {
    try {
      const wasAdmin = (user?.email || profile?.email || '').toLowerCase().trim() === 'nicklesh@gmail.com' && profile?.role === 'admin';
      setLoading(true);
      setUser(null);
      setProfile(null);
      setAllUsers([]);
      setChildAccounts([]);
      await firebaseSignOut(auth);
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.clear();
        window.location.replace(wasAdmin ? '/admin/login' : '/login');
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

  const handleToggleAccountStatus = async (
    uid: string,
    isDisabled: boolean
  ) => {
    try {
      await updateUserAccountStatus(uid, !isDisabled);
      toast({
        title: 'Success',
        description: `User account has been ${
          !isDisabled ? 'disabled' : 'enabled'
        }.`,
      });
      // Refresh the list
      const users = await fetchAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Error updating user account status:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update user account status.',
      });
    }
  };
  
  const handleChildSelect = async (childId: string) => {
    if (childId && user) {
      try {
        await markNotificationsAsRead(user.uid, childId);
        // Refetch parent profile to update notification count
        await fetchProfileAndChildren(user.uid);
        router.push(`/chore-champ/${childId}`);
      } catch (error) {
        console.error('Error selecting child / marking notifications read:', error);
      }
    }
  };

  const handleCompleteChore = async (choreIndex: number) => {
      if (!user || !profile || !profile.assignedChores) return;

      const updatedChores = [...profile.assignedChores];
      const chore = updatedChores[choreIndex];
      if(chore.status === 'completed' || chore.status === 'approved') return;

      chore.status = 'completed';
      chore.completedAt = new Date().toISOString();

      try {
        await updateUserProfile(user.uid, { assignedChores: updatedChores });
        setProfile(prev => prev ? { ...prev, assignedChores: updatedChores } : null);
        toast({ title: "Chore Complete!", description: `You earned ${chore.points} points!`});
      } catch (error) {
          console.error('Error completing chore:', error);
          toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not mark chore as complete.'});
      }
  };

  const handleUpdateParentName = async () => {
    if (!user || !profile || !parentName.trim()) return;
    const formattedName = toCamelCase(parentName.trim());
    if (profile.name === formattedName) return;

    try {
        await updateUserProfile(user.uid, { name: formattedName });
        setProfile(prev => prev ? { ...prev, name: formattedName } : null);
        toast({
            title: "Name Updated",
            description: `Your name has been updated to ${formattedName}.`,
        });
    } catch (error) {
        console.error('Error updating parent name:', error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not update your name.',
        });
        setParentName(toCamelCase(profile.name || ''));
    }
  };

  const handleCreateChildAccount: SubmitHandler<NewChildFormValues> = async (data) => {
    if (!user || !profile) return;
    setLoading(true);
    
    try {
      // Create child user without signing out the parent.
      const childUser = await signUpWithEmail(data.childEmail, data.childPassword);

      // Create child profile and link it to the parent.
      await createUserProfile(childUser.uid, {
        email: data.childEmail,
        role: 'child',
        parentId: user.uid,
      });
      const updatedChildUids = [...(profile.childUids || []), childUser.uid];
      await updateUserProfile(user.uid, {
        childUids: updatedChildUids,
      });
      
      toast({
        title: "Child Account Created",
        description: `The account for ${data.childEmail} has been created and linked.`,
      });
      
      // Refresh the child list on the parent dashboard.
      await fetchProfileAndChildren(user.uid);
      
      reset(); 
      setCreateChildOpen(false);
    } catch (error) {
      console.error('Error creating child account:', error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: getAuthErrorMessage(error),
      });
    } finally {
        setLoading(false);
    }
  };
  
  const handleUpdateRewardPoints = (index: number, newPoints: string) => {
    const updatedRewards = [...rewards];
    updatedRewards[index].points = parseInt(newPoints, 10) || 0;
    setRewards(updatedRewards);
  };
  
  const handleAddNewReward = () => {
      if (rewards.length >= 15) {
          toast({ variant: 'destructive', title: 'Reward Limit Reached', description: 'You can have a maximum of 15 rewards.'});
          return;
      }
      const points = parseInt(newRewardPoints, 10);
      if (!newRewardName.trim() || !newRewardPoints || isNaN(points) || points <= 0) {
          toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please enter a valid reward name and points value greater than 0.'});
          return;
      }
      if (newRewardName.trim().length > 15) {
          toast({ variant: 'destructive', title: 'Invalid Name', description: 'Reward name cannot exceed 15 characters.'});
          return;
      }
      const newReward: Reward = {
          name: newRewardName,
          points: points,
      };
      setRewards([...rewards, newReward]);
      setNewRewardName('');
      setNewRewardPoints('');
      toast({ title: 'Reward Added', description: `"${newReward.name}" has been added.`});
  };
  
    const handleDeleteReward = (indexToDelete: number) => {
        const rewardToDelete = rewards[indexToDelete];
        const updatedRewards = rewards.filter((_, index) => index !== indexToDelete);
        setRewards(updatedRewards);
        toast({ title: 'Reward Deleted', description: `"${rewardToDelete.name}" has been removed.`});
    };

  const handleSaveChangesToRewards = async () => {
    if (!user || !hasRewardsChanged) return;
    try {
        await updateUserProfile(user.uid, { rewards });
        setHasRewardsChanged(false); // Reset changed status after saving
        toast({ title: 'Rewards Updated!', description: 'Your custom rewards list has been saved.' });
    } catch (error) {
        console.error('Error saving rewards list:', error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save your rewards list.' });
    }
  };


  const handleRedeemRewardForChild = async (childId: string, reward: Reward) => {
    const child = childAccounts.find(c => c.id === childId);
    if (!child) return;

    const childSummary = childSummaries.find(s => s.id === childId);
    if (!childSummary || childSummary.totalPoints < reward.points) {
        toast({ variant: 'destructive', title: 'Not enough points!', description: `${child.name} does not have enough points.`});
        return;
    }

    const newReward: RedeemedReward = { ...reward, date: new Date().toISOString(), rewardRedeemed: true }; // Parent redeeming is auto-approved
    const updatedRewards = [...(child.redeemedRewards || []), newReward];

    try {
        await updateUserProfile(childId, { redeemedRewards: updatedRewards });

        // Update local state to reflect change immediately
        setChildAccounts(prev => prev.map(c => 
            c.id === childId ? { ...c, redeemedRewards: updatedRewards } : c
        ));

        toast({ title: 'Reward Redeemed!', description: `${child.name} has redeemed "${reward.name}"!`});
    } catch (error) {
        console.error('Error redeeming reward for child:', error);
        toast({ variant: 'destructive', title: 'Redemption Failed', description: 'Could not redeem reward for child.'});
    }
  };
  
  const unreadNotifications = useMemo(() => {
      return (profile?.notifications || []).filter(n => !n.read);
  }, [profile?.notifications]);

  const notificationsByChild = useMemo(() => {
    return unreadNotifications.reduce((acc, notif) => {
        const childName = childAccounts.find(c => c.id === notif.childId)?.name || 'A child';
        if (!acc[childName]) {
            acc[childName] = [];
        }
        acc[childName].push(notif);
        return acc;
    }, {} as Record<string, Notification[]>);
  }, [unreadNotifications, childAccounts]);

  const upcomingChoresForSelectedChild = useMemo(() => {
    if (!selectedChildForDeletion) return [];
    const child = childAccounts.find(c => c.id === selectedChildForDeletion);
    if (!child || !child.assignedChores) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming: AssignedChore[] = [];

    child.assignedChores.forEach(chore => {
        const choreEndDate = new Date(chore.dueDate);
        choreEndDate.setHours(23, 59, 59, 999);

        if (chore.recurrence === 'one-time') {
            const choreDueDate = new Date(chore.dueDate);
            choreDueDate.setHours(0, 0, 0, 0);
            if (choreDueDate >= today && chore.status !== 'approved') {
                upcoming.push(chore);
            }
        } else {
            let currentDateIter = new Date(chore.createdAt > today.toISOString() ? chore.createdAt : today.toISOString());
            currentDateIter.setHours(0, 0, 0, 0);

            while (currentDateIter <= choreEndDate) {
                const dateStr = currentDateIter.toISOString().split('T')[0];
                const instanceDate = new Date(dateStr);
                instanceDate.setHours(0, 0, 0, 0);

                if (instanceDate >= today) {
                    const completion = chore.completions?.find(c => c.date === dateStr);
                    if (!completion || (completion.status !== 'approved')) {
                         upcoming.push({ ...chore, id: `${chore.id}-${dateStr}`, dueDate: dateStr }); 
                    }
                }

                switch (chore.recurrence) {
                    case 'daily': currentDateIter.setDate(currentDateIter.getDate() + 1); break;
                    case 'weekly': currentDateIter.setDate(currentDateIter.getDate() + 7); break;
                    case 'bi-weekly': currentDateIter.setDate(currentDateIter.getDate() + 14); break;
                    case 'monthly': currentDateIter.setMonth(currentDateIter.getMonth() + 1); break;
                    default:
                        currentDateIter = new Date(choreEndDate.getTime() + 86400000);
                        break;
                }
            }
        }
    });

    return upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [selectedChildForDeletion, childAccounts]);

  const handleToggleChoreForDeletion = (choreId: string) => {
    setChoresToDelete(prev => 
        prev.includes(choreId)
            ? prev.filter(id => id !== choreId)
            : [...prev, choreId]
    );
  };

  const handleDeleteSelectedChores = async () => {
    if (!selectedChildForDeletion || choresToDelete.length === 0) return;

    const childToUpdate = childAccounts.find(c => c.id === selectedChildForDeletion);
    if (!childToUpdate) return;
    
    // For recurring chores, we delete the entire definition.
    const choreIdsToDelete = new Set(choresToDelete.map(id => id.split('-')[0] === 'custom' ? id : id.split('-').slice(0, 2).join('-')));

    const updatedChores = (childToUpdate.assignedChores || []).filter(
        chore => !choreIdsToDelete.has(chore.id.split('-')[0] === 'custom' ? chore.id : chore.id.split('-').slice(0, 2).join('-'))
    );

    try {
        await updateUserProfile(selectedChildForDeletion, { assignedChores: updatedChores });
        
        // Update local state to reflect changes immediately
        setChildAccounts(prev => prev.map(c => 
            c.id === selectedChildForDeletion ? { ...c, assignedChores: updatedChores } : c
        ));

        toast({
            title: 'Chores Deleted',
            description: `Successfully removed ${choreIdsToDelete.size} chore(s).`
        });
        
        // Reset selection
        setChoresToDelete([]);
        setSelectedChildForDeletion(null);

    } catch (error) {
        console.error('Error deleting chores:', error);
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: 'Could not delete the selected chores.'
        });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user || !feedback.trim()) {
        toast({ variant: 'destructive', title: 'Empty Feedback', description: 'Please enter a message before submitting.' });
        return;
    }
    try {
        await saveFeedback(user.uid, feedback);
        toast({ title: 'Feedback Submitted', description: 'Thank you for your feedback!' });
        setFeedback('');
        setContactUsExpanded(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your feedback at this time.' });
    }
  };
  
  const handleContactUsClick = () => {
    setContactUsExpanded(true);
    setTimeout(() => {
        contactUsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
    const handleBellClick = async (parentId: string) => {
      try {
        const feedbackForParent = allFeedback.filter(f => f.userId === parentId);
        if (feedbackForParent.length === 0) {
            setSelectedFeedback(null);
            return;
        }
        
        setSelectedFeedback(feedbackForParent);

        // Mark unread feedback as read
        const unreadFeedbackIds = feedbackForParent.filter(f => !f.read).map(f => f.id);
        if (unreadFeedbackIds.length > 0) {
            await Promise.all(unreadFeedbackIds.map(id => markFeedbackAsRead(id)));
            // Refresh feedback data to update UI
            await fetchAllFeedback();
        }
      } catch (error) {
        console.error('Error processing feedback notifications:', error);
      }
    };
  const handleOpenPaymentDialog = (parent: UserWithId) => {
    setSelectedParentForPayment(parent);
    setPaymentAmount(parent.paidAmount?.toString() || '');
    setPaymentDialogOpen(true);
  };
  
  const handleUpdatePayment = async () => {
    if (!selectedParentForPayment || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount < 0) {
        toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid positive number.' });
        return;
    }

    try {
        await updateUserProfile(selectedParentForPayment.id, { paidAmount: amount });
        toast({ title: 'Payment Updated', description: `Payment amount for ${selectedParentForPayment.email} updated.` });
        
        const users = await fetchAllUsers(); // Refresh users to show new amount
        setAllUsers(users);

        setPaymentDialogOpen(false);
        setSelectedParentForPayment(null);
        setPaymentAmount('');
    } catch (error) {
        console.error('Error updating payment amount:', error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update payment amount.' });
    }
  };


  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const ADMIN_EMAIL = 'nicklesh@gmail.com';
  const currentEmail = (user?.email || profile?.email || '').toLowerCase().trim();
  const is_admin = currentEmail === ADMIN_EMAIL && profile?.role === 'admin';
  const is_parent = !is_admin && profile?.role !== 'child';
  
  const parentUsers = allUsers.filter(u => u.role === 'parent');
  const userMap = allUsers.reduce((acc, u) => {
    acc[u.id] = u;
    return acc;
  }, {} as Record<string, UserWithId>);
  
  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      <AlertDialog open={isPaymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <AlertDialogContent className="bg-basalt-stones text-white-dove border-gray-700">
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-white-dove">Update Payment for {selectedParentForPayment?.email}</AlertDialogTitle>
                  <AlertDialogDescription className="text-white-dove/80">
                      Enter the total amount this user has paid.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 my-4">
                  <Label htmlFor="payment-amount" className="text-white-dove">Paid Amount ($)</Label>
                  <Input 
                      id="payment-amount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="e.g., 50"
                      className="bg-gray-800 border-gray-600 text-white-dove"
                  />
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel className="border-gray-600 text-white-dove bg-transparent hover:bg-gray-700 hover:text-white-dove">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUpdatePayment} className="border border-gray-500 bg-primary hover:bg-primary/90">Update Payment</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <div className="w-full max-w-6xl p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
            <div className="flex items-center space-x-4 flex-grow">
              <Image src="/ChoresChampLogo.png" alt="Chores Champ Logo" width={64} height={64} className="rounded-lg" />
                <div className="flex-grow">
                     <h1 className="text-2xl sm:text-3xl font-bold">
                        {is_admin ? 'Admin Dashboard' : 'Parent Dashboard'}
                    </h1>
                     {is_admin && (
                         <p className="text-lg text-muted-foreground">Welcome, Admin!</p>
                     )}
                     {is_parent && (
                        <div className="flex items-baseline space-x-2 mt-1">
                            <Label htmlFor="parent-name" className="text-lg text-muted-foreground">Welcome,</Label>
                            <Input
                                id="parent-name"
                                type="text"
                                value={parentName}
                                onChange={(e) => setParentName(e.target.value)}
                                onBlur={handleUpdateParentName}
                                className="text-lg text-muted-foreground border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                                style={{width: `${parentName.length + 2}ch`}}
                            />
                        </div>
                     )}
                </div>
            </div>
          <div className="flex flex-col items-end w-full sm:w-auto mt-4 sm:mt-0">
            <div className="flex items-center">
              {is_parent && (
                <Button onClick={handleContactUsClick} variant="navy" className="mr-2">
                    Contact Us
                </Button>
              )}
              <Button onClick={handleLogout} variant="navy">
                Logout
              </Button>
            </div>
            <p className="hidden sm:block text-lg font-medium text-muted-foreground mt-2 w-full text-right">
              {currentDate}
            </p>
             {is_parent && unreadNotifications.length > 0 && (
                <div className="relative mt-2">
                    <Bell className="h-6 w-6" />
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {unreadNotifications.length}
                    </span>
                </div>
            )}
             <p className="sm:hidden text-sm font-medium text-muted-foreground w-full text-right mt-2">
                {currentDate}
            </p>
          </div>
        </div>

        {is_admin ? (
          <div className='space-y-8'>
            <Card className="bg-very-light-navy">
                <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl">User Management</CardTitle>
                    <CardDescription>View parents and their linked children. Click on a parent to expand.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto max-h-[30rem] overflow-y-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Paid Amount</TableHead>
                                <TableHead>Feedback</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {parentUsers.map((parent) => {
                                const parentChildren = (parent.childUids || []).map(uid => userMap[uid]).filter(Boolean);
                                const hasFeedback = allFeedback.some(f => f.userId === parent.id);
                                const hasUnreadFeedback = allFeedback.some(f => f.userId === parent.id && !f.read);
                                const isExpanded = expandedParentId === parent.id;
                                return (
                                <>
                                    <TableRow key={parent.id} className="cursor-pointer" onClick={() => setExpandedParentId(isExpanded ? null : parent.id)}>
                                        <TableCell>
                                           <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </TableCell>
                                        <TableCell>{parent.name || '-'}</TableCell>
                                        <TableCell>{parent.email}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${parent.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {parent.disabled ? 'Disabled' : 'Enabled'}
                                            </span>
                                        </TableCell>
                                        <TableCell>${parent.paidAmount?.toFixed(2) || '0.00'}</TableCell>
                                        <TableCell>
                                            {hasFeedback && (
                                                <div className="relative" onClick={(e) => { e.stopPropagation(); handleBellClick(parent.id); }}>
                                                    <Bell className={`h-5 w-5 ${hasUnreadFeedback ? 'font-bold' : ''}`} />
                                                    {hasUnreadFeedback && (
                                                        <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500" />
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="navy" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenPaymentDialog(parent); }}>Update Payment</Button>
                                            <Button
                                                variant={parent.disabled ? 'olive' : 'destructive'}
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleToggleAccountStatus(parent.id, !!parent.disabled); }}
                                            >
                                                {parent.disabled ? 'Enable' : 'Disable'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                        <TableRow className="bg-light-sunset-sky">
                                            <TableCell colSpan={7} className="p-0">
                                                <div className="p-4 max-h-64 overflow-y-auto">
                                                    <h4 className="font-semibold mb-2">Children of {parent.name || parent.email}</h4>
                                                    {parentChildren.length > 0 ? (
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Name</TableHead>
                                                                    <TableHead>Email</TableHead>
                                                                    <TableHead>Status</TableHead>
                                                                    <TableHead className="text-right">Actions</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {parentChildren.map(child => (
                                                                    <TableRow key={child.id}>
                                                                        <TableCell>{child.name || '-'}</TableCell>
                                                                        <TableCell>{child.email}</TableCell>
                                                                        <TableCell>
                                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${child.disabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                                                {child.disabled ? 'Disabled' : 'Enabled'}
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            <Button
                                                                                variant={child.disabled ? 'navy' : 'light-navy'}
                                                                                size="sm"
                                                                                onClick={(e) => { e.stopPropagation(); handleToggleAccountStatus(child.id, !!child.disabled); }}
                                                                            >
                                                                                {child.disabled ? 'Enable' : 'Disable'}
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    ) : (
                                                        <p className="text-muted-foreground text-sm">This parent has no linked children.</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            )})}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            {selectedFeedback && (
                 <Card className="bg-light-palm-leaf">
                    <CardHeader>
                        <CardTitle className="text-xl sm:text-2xl">Feedback Details</CardTitle>
                        <CardDescription>
                            Showing feedback from {userMap[selectedFeedback[0]?.userId]?.email || 'a parent'}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {selectedFeedback.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map(fb => (
                                <div key={fb.id} className="p-4 border rounded-lg bg-background">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Submitted on: {new Date(fb.submittedAt).toLocaleString()}
                                    </p>
                                    <p>{fb.feedback}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
            <Card>
                <CardHeader 
                    className="flex flex-row items-center justify-between cursor-pointer"
                    onClick={() => setAvatarsExpanded(!isAvatarsExpanded)}
                >
                    <div>
                        <CardTitle className="text-xl sm:text-2xl">Stored Avatars and Logos</CardTitle>
                        <CardDescription>Avatars and logos available for assignment.</CardDescription>
                    </div>
                    {isAvatarsExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardHeader>
                {isAvatarsExpanded && (
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Logos</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                <div className="flex flex-col items-center gap-2">
                                    <Image 
                                        src="/ChoresChampLogo.png" 
                                        alt="Chores Champ Logo" 
                                        width={100}
                                        height={100}
                                        className="rounded-lg object-cover"
                                    />
                                    <p className="text-xs text-muted-foreground">ChoresChampLogo.png</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t pt-4">
                           <h3 className="text-lg font-semibold mb-2">Avatars</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                               {['boys', 'girls'].map(gender => {
                                   const genderTitle = gender.charAt(0).toUpperCase() + gender.slice(1);
                                   return (
                                    <div key={gender}>
                                        <h4 className="font-semibold mb-2 capitalize">{genderTitle}</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[...Array(8)].map((_, i) => {
                                                const avatarNumber = (i + 1).toString().padStart(2, '0');
                                                const avatarName = `Kid${avatarNumber}-${gender === 'boys' ? 'Boy' : 'Girl'}.png`;
                                                const avatarPath = `/avatars/${gender}/${avatarName}`;
                                                return (
                                                <div key={avatarName} className="flex flex-col items-center gap-2">
                                                     <Image 
                                                        src={avatarPath} 
                                                        alt={avatarName} 
                                                        width={100}
                                                        height={100}
                                                        className="rounded-lg object-cover"
                                                    />
                                                    <p className="text-xs text-muted-foreground">{avatarName}</p>
                                                </div>
                                            )})}
                                        </div>
                                    </div>
                               )})}
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
          </div>
        ) : is_parent ? (
          <div className="space-y-8">
            <AlertDialog open={isCreateChildOpen} onOpenChange={setCreateChildOpen}>
                <AlertDialogContent className="bg-basalt-stones text-white-dove border-gray-700">
                    <form onSubmit={handleSubmit(handleCreateChildAccount)}>
                        <AlertDialogHeader>
                        <AlertDialogTitle className="text-white-dove">Create New Child Account</AlertDialogTitle>
                        <AlertDialogDescription className="text-white-dove/80">
                            This will create a new account for your child and link it to your parent account.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 my-4">
                            <div className="space-y-2">
                                <Label htmlFor="childEmail" className="text-white-dove">Child&apos;s Email</Label>
                                <Input
                                    id="childEmail"
                                    type="email"
                                    placeholder="child@example.com"
                                    {...register('childEmail')}
                                    className="bg-white border-gray-600 text-olive-green placeholder:text-gray-400"
                                />
                                {errors.childEmail && (
                                    <p className="text-sm text-destructive">{errors.childEmail.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="childPassword" className="text-white-dove">Child&apos;s Password</Label>
                                <Input
                                    id="childPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register('childPassword')}
                                    className="bg-white border-gray-600 text-olive-green placeholder:text-gray-400"
                                />
                                {errors.childPassword && (
                                    <p className="text-sm text-destructive">{errors.childPassword.message}</p>
                                )}
                            </div>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel type="button" onClick={() => setCreateChildOpen(false)} className="border-gray-600 text-white-dove bg-transparent hover:bg-gray-700 hover:text-white-dove">Cancel</AlertDialogCancel>
                            <AlertDialogAction type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                                {loading ? 'Creating...' : 'Create Account'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>
            <Card className="bg-very-light-navy">
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                      <CardTitle className="text-xl sm:text-2xl">All Kids Summary</CardTitle>
                      <CardDescription className="hidden sm:block">
                          A summary of chore activity for the last 30 days and the next 30 days.
                      </CardDescription>
                       <CardDescription className="sm:hidden">
                          A summary of chore activity.
                      </CardDescription>
                  </div>
                   <div className="flex w-full md:w-auto space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowExtendedSummary(!showExtendedSummary)}
                            className="md:hidden"
                        >
                            {showExtendedSummary ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                            {showExtendedSummary ? 'Hide Details' : 'Show Details'}
                        </Button>
                        <Button onClick={() => setCreateChildOpen(true)} className="bg-basalt-stones text-white-dove hover:bg-basalt-stones/90 w-full md:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Child
                        </Button>
                   </div>
              </CardHeader>
              <CardContent>
                  {childSummaries.length > 0 ? (
                      <div className="overflow-x-auto">
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead className="px-2 sm:px-4"></TableHead>
                                      <TableHead className="px-2 sm:px-4">Child</TableHead>
                                      <TableHead className={`text-center px-2 sm:px-4 ${!showExtendedSummary ? 'hidden md:table-cell' : ''}`}>Completed (Last 30d)</TableHead>
                                      <TableHead className={`text-center px-2 sm:px-4 ${!showExtendedSummary ? 'hidden md:table-cell' : ''}`}>Not Done (Last 30d)</TableHead>
                                      <TableHead className={`text-center px-2 sm:px-4 ${!showExtendedSummary ? 'hidden md:table-cell' : ''}`}>Active (Next 30d)</TableHead>
                                      <TableHead className="text-right px-2 sm:px-4">Available Points</TableHead>
                                      <TableHead className={`text-right px-2 sm:px-4 ${!showExtendedSummary ? 'hidden md:table-cell' : ''}`}>Redeemed Points (Last 30d)</TableHead>
                                      <TableHead className="text-center px-2 sm:px-4">Redeem Reward</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {childSummaries.map((summary) => {
                                      const displayName = summary.name || 'Child';
                                      return (
                                      <TableRow key={summary.id}>
                                          <TableCell className="p-2 sm:p-4">
                                              <Avatar className="rounded-lg">
                                                  <AvatarImage src={summary.avatar} alt={displayName} />
                                                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                          </TableCell>
                                          <TableCell 
                                            className="font-medium cursor-pointer hover:underline p-2 sm:p-4"
                                            onClick={() => handleChildSelect(summary.id)}
                                          >
                                            {summary.name}
                                          </TableCell>
                                          <TableCell className={`text-center p-2 sm:p-4 ${!showExtendedSummary ? 'hidden md:table-cell' : ''}`}>{summary.completedLast30Days}</TableCell>
                                          <TableCell className={`text-center p-2 sm:p-4 ${!showExtendedSummary ? 'hidden md:table-cell' : ''}`}>{summary.notDoneLast30Days}</TableCell>
                                          <TableCell className={`text-center p-2 sm:p-4 ${!showExtendedSummary ? 'hidden md:table-cell' : ''}`}>{summary.activeNext30Days}</TableCell>
                                          <TableCell className="text-right font-bold p-2 sm:p-4">{summary.totalPoints}</TableCell>
                                          <TableCell className={`text-right p-2 sm:p-4 ${!showExtendedSummary ? 'hidden md:table-cell' : ''}`}>{summary.redeemedPointsLast30Days}</TableCell>
                                          <TableCell className="p-2 sm:p-4">
                                            {summary.totalPoints > 0 && (
                                                <Select onValueChange={(value) => {
                                                    const reward = rewards.find(r => r.name === value);
                                                    if (reward) handleRedeemRewardForChild(summary.id, reward);
                                                }}>
                                                    <SelectTrigger className="w-full sm:w-48 bg-basalt-stones text-white-dove">
                                                        <SelectValue placeholder="Select a reward..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-basalt-stones">
                                                        {rewards.map(reward => (
                                                            <SelectItem 
                                                                key={reward.name} 
                                                                value={reward.name}
                                                                disabled={summary.totalPoints < reward.points}
                                                                className="text-white-dove focus:bg-gray-700 focus:text-white-dove"
                                                            >
                                                                {reward.name} ({reward.points} pts)
                                                            </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                            )}
                                          </TableCell>
                                      </TableRow>
                                      )
                                    })}
                              </TableBody>
                          </Table>
                      </div>
                  ) : (
                      <div className="text-center p-8">
                          <p className="text-muted-foreground">
                              No child data to summarize yet.
                          </p>
                      </div>
                  )}
              </CardContent>
            </Card>
             {unreadNotifications.length > 0 && (
                <Card className="border-blue-500">
                    <CardHeader>
                        <CardTitle className="text-xl sm:text-2xl">New Notifications</CardTitle>
                        <CardDescription>Chores and rewards waiting for your approval.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                           {Object.entries(notificationsByChild).map(([childName, notifs]) => (
                                <li key={childName}>
                                    <h4 className="font-semibold">{toCamelCase(childName)}</h4>
                                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                       {notifs.map(n => (
                                            <li key={n.id} className="cursor-pointer hover:underline" onClick={() => handleChildSelect(n.childId)}>
                                                {n.message}
                                            </li>
                                       ))}
                                    </ul>
                                </li>
                           ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
            <Card className="bg-concrete">
                <CardHeader
                    className="flex flex-row items-center justify-between cursor-pointer"
                    onClick={() => setChoreManagementExpanded(!isChoreManagementExpanded)}
                >
                    <div>
                        <CardTitle className="text-xl sm:text-2xl">Future Chore Management</CardTitle>
                        <CardDescription>
                            Select a child to view and delete their upcoming chores in bulk.
                        </CardDescription>
                    </div>
                    {isChoreManagementExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardHeader>
                {isChoreManagementExpanded && (
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="w-full flex-grow flex items-center space-x-4">
                                <Label htmlFor="child-select-deletion" className="whitespace-nowrap">Select Child:</Label>
                                <Select onValueChange={(value) => {
                                    setSelectedChildForDeletion(value);
                                    setChoresToDelete([]);
                                }}>
                                    <SelectTrigger id="child-select-deletion" className="w-full sm:w-64 bg-basalt-stones text-white-dove">
                                        <SelectValue placeholder="Select a child..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-basalt-stones">
                                        {childAccounts.map(child => (
                                            <SelectItem key={child.id} value={child.id} className="text-white-dove focus:bg-gray-700 focus:text-white-dove">
                                                {toCamelCase(child.name || child.email)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedChildForDeletion && upcomingChoresForSelectedChild.length > 0 && (
                                <div className="w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="destructive" disabled={choresToDelete.length === 0} className="w-full">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete ({choresToDelete.length}) Selected
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-basalt-stones border-gray-700">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-white-dove">Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-white-dove/80">
                                                    This action cannot be undone. This will permanently delete the selected {choresToDelete.length} chore(s).
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="border-gray-600 text-white-dove bg-transparent hover:bg-gray-700 hover:text-white-dove">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteSelectedChores} className="bg-destructive text-white-dove hover:bg-destructive/90 border border-gray-500">
                                                    Continue
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                        {selectedChildForDeletion && (
                           <>
                             {upcomingChoresForSelectedChild.length > 0 ? (
                                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">
                                                        <Checkbox 
                                                            className="border-basalt-stones"
                                                            checked={choresToDelete.length === upcomingChoresForSelectedChild.length && upcomingChoresForSelectedChild.length > 0}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setChoresToDelete(upcomingChoresForSelectedChild.map(c => c.id))
                                                                } else {
                                                                    setChoresToDelete([]);
                                                                }
                                                            }}
                                                        />
                                                    </TableHead>
                                                    <TableHead className="font-bold">Chore Title</TableHead>
                                                    <TableHead className="font-bold">Due Date</TableHead>
                                                    <TableHead className="font-bold">Points</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {upcomingChoresForSelectedChild.map(chore => (
                                                    <TableRow key={chore.id}>
                                                        <TableCell>
                                                            <Checkbox 
                                                              className="border-basalt-stones"
                                                              checked={choresToDelete.includes(chore.id)}
                                                              onCheckedChange={() => handleToggleChoreForDeletion(chore.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{chore.title}</TableCell>
                                                        <TableCell>{new Date(chore.dueDate).toLocaleDateString()}</TableCell>
                                                        <TableCell>{chore.points}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                             ) : (
                                <div className="text-center p-8 border rounded-lg">
                                    <p className="text-muted-foreground">
                                        This child has no upcoming chores to delete.
                                    </p>
                                </div>
                             )}
                           </>
                        )}
                    </CardContent>
                )}
            </Card>

            <Card className="bg-very-light-zen-garden">
                <CardHeader
                    className="flex flex-row items-center justify-between cursor-pointer"
                    onClick={() => setRewardsReportExpanded(!isRewardsReportExpanded)}
                >
                    <div>
                        <CardTitle className="text-xl sm:text-2xl">Rewards Report</CardTitle>
                        <CardDescription>
                            A summary of rewards redeemed by each child in the last year.
                        </CardDescription>
                    </div>
                     {isRewardsReportExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardHeader>
                {isRewardsReportExpanded && (
                    <CardContent>
                        {rewardsReport.length > 0 && totalRedeemedRewards > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead></TableHead>
                                            <TableHead>Child</TableHead>
                                            <TableHead className="text-center">Total Rewards Redeemed (1 Year)</TableHead>
                                            <TableHead className="text-right">Total Points Redeemed (1 Year)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rewardsReport.map((report) => {
                                          const displayName = report.name || 'Child';
                                          return (
                                            <TableRow key={report.id}>
                                                <TableCell>
                                                  <Avatar>
                                                      <AvatarImage src={report.avatar} alt={displayName} />
                                                      <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                                                  </Avatar>
                                                </TableCell>
                                                <TableCell className="font-medium">{report.name}</TableCell>
                                                <TableCell className="text-center">{report.totalRewards}</TableCell>
                                                <TableCell className="text-right">{report.totalPoints}</TableCell>
                                            </TableRow>
                                        )})}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <p className="text-muted-foreground">
                                    No rewards have been redeemed yet.
                                </p>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
            <Card className="bg-very-light-olive-green">
                <CardHeader
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer gap-2"
                    onClick={() => setRewardsSummaryExpanded(!isRewardsSummaryExpanded)}
                >
                    <div className="flex-grow">
                        <CardTitle className="text-xl sm:text-2xl">Rewards Customization</CardTitle>
                        <CardDescription>Edit points for existing rewards or add new ones (max 15).</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            size="sm"
                            variant="navy"
                            onClick={(e) => { e.stopPropagation(); handleSaveChangesToRewards(); }}
                            disabled={!hasRewardsChanged}
                        >
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                        <span onClick={(e) => { e.stopPropagation(); setRewardsSummaryExpanded(!isRewardsSummaryExpanded); }}>
                         {isRewardsSummaryExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </span>
                    </div>
                </CardHeader>
                {isRewardsSummaryExpanded && (
                    <CardContent>
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Reward</TableHead>
                                            <TableHead>Points</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rewards.map((reward, index) => (
                                            <TableRow key={`${reward.name}-${index}`}>
                                                <TableCell className="font-medium">{reward.name}</TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number"
                                                        value={reward.points}
                                                        onChange={(e) => handleUpdateRewardPoints(index, e.target.value)}
                                                        className="w-24 text-right"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteReward(index)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <h4 className="text-lg font-semibold">Add New Reward</h4>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <Input 
                                        placeholder="New Reward Name"
                                        value={newRewardName}
                                        onChange={(e) => setNewRewardName(e.target.value)}
                                        className="flex-grow"
                                        maxLength={15}
                                        disabled={rewards.length >= 15}
                                    />
                                    <Input 
                                        type="number"
                                        placeholder="Points"
                                        value={newRewardPoints}
                                        onChange={(e) => setNewRewardPoints(e.target.value)}
                                        className="w-full sm:w-28"
                                        disabled={rewards.length >= 15}
                                    />
                                    <Button onClick={handleAddNewReward} variant="navy" className="w-full sm:w-auto" disabled={rewards.length >= 15}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Reward
                                    </Button>
                                </div>
                                {rewards.length >= 15 && (
                                    <p className="text-sm text-destructive text-center mt-2">
                                        You have reached the maximum of 15 rewards.
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
            {isContactUsExpanded && (
              <Card ref={contactUsRef} className="bg-light-palm-leaf">
                  <CardHeader>
                      <CardTitle className="text-xl sm:text-2xl">Contact Us</CardTitle>
                      <CardDescription>Have questions or feedback? Let us know!</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4">
                          <Textarea 
                            placeholder="Type your message here." 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                          />
                          <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => setFeedback('')}>
                                  <XCircle className="mr-2 h-4 w-4" /> Clear
                              </Button>                              <Button variant="navy" size="sm" onClick={handleSubmitFeedback}>
                                  Submit
                              </Button>
                          </div>
                      </div>
                  </CardContent>
              </Card>
            )}
          </div>
        ) : (
           <div className="text-center">
            <p className="text-muted-foreground">
              Your dashboard is not available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
