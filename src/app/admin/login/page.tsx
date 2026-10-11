
'use client';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail, getUserProfile, createUserProfile, auth } from '@/lib/firebase';
import { getAuthErrorMessage } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

const FormSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
});

type FormValues = z.infer<typeof FormSchema>;

const ADMIN_EMAIL = 'nicklesh@gmail.com';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setLoading(true);

    const emailTrimmed = data.email.toLowerCase().trim();
    if (emailTrimmed !== ADMIN_EMAIL) {
      console.error('Admin login denied: email is not authorized admin', data.email);
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Only nicklesh@gmail.com is authorized to log in as admin.',
      });
      setLoading(false);
      return;
    }

    try {
      const user = await signInWithEmail(data.email, data.password);
      
      // Ensure the admin profile exists and has the correct role for nicklesh@gmail.com.
      await createUserProfile(user.uid, {
        email: user.email!,
        role: 'admin',
      });

      // Now fetch the profile to check the role.
      const profile = await getUserProfile(user.uid);

      if (profile?.role !== 'admin' || user.email?.toLowerCase().trim() !== ADMIN_EMAIL) {
          await auth.signOut();
          console.error('Admin login denied: user does not have admin privileges');
          toast({
              variant: 'destructive',
              title: 'Access Denied',
              description: 'You do not have administrative privileges.',
          });
          setLoading(false);
          return;
      }

      toast({
        title: 'Admin Login Successful',
        description: 'Welcome back! Redirecting to dashboard.',
      });
      if (typeof window !== 'undefined') {
        window.location.replace('/chore-champ');
      } else {
        router.push('/chore-champ');
      }
    } catch (error) {
      console.error('Admin login failed:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: getAuthErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-card rounded-lg shadow-md">
        <div className="text-center">
          <Image src="/ChoresChampLogo.png" alt="Chores Champ Logo" width={128} height={128} className="mx-auto mb-4 rounded-lg" />
          <h1 className="text-3xl font-bold text-card-foreground">Admin Login</h1>
          <p className="text-muted-foreground">Access the Chores Champ admin panel</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading} variant="navy">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
         <p className="text-sm text-center text-muted-foreground">
            Not an admin?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Go to user login
            </Link>
          </p>
      </div>
    </div>
  );
}
