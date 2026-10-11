
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
import { signUpAndSignInWithEmail, createUserProfile } from '@/lib/firebase';
import { getAuthErrorMessage } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

const FormSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters long.',
  }),
});

type FormValues = z.infer<typeof FormSchema>;

export default function SignupPage() {
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
    try {
        // 1. Create Parent User. This automatically signs them in.
        const parentUser = await signUpAndSignInWithEmail(data.email, data.password);
        
        // 2. Create parent profile
        await createUserProfile(parentUser.uid, {
            email: data.email,
            role: 'parent',
            childUids: [] // Initialize with an empty array
        });

      toast({
        title: 'Account Created!',
        description: "You're being redirected to the dashboard.",
      });
      if (typeof window !== 'undefined') {
        window.location.replace('/chore-champ');
      } else {
        router.push('/chore-champ');
      }

    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
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
          <h1 className="text-3xl font-bold text-card-foreground">Create an Account</h1>
          <p className="text-muted-foreground">Join Chores Champ Today!</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Your Email</Label>
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
            <Label htmlFor="password">Your Password</Label>
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
         <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
      </div>
    </div>
  );
}
