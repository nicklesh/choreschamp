
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { confirmPasswordReset } from '@/lib/firebase';
import { getAuthErrorMessage } from '@/lib/utils';
import Image from 'next/image';

const FormSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters long.')
      .max(16, 'Password must be no more than 16 characters long.')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.')
      .regex(/[!@#$%&\-_?]/, 'Password must contain one of !,@,#,$,%,&,-,_,?'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof FormSchema>;

function ResetPasswordComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });
  
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!oobCode) {
        console.error('Invalid password reset link: missing oobCode parameter');
        toast({
            variant: 'destructive',
            title: 'Invalid Link',
            description: 'The password reset link is missing or invalid.',
        });
        router.push('/login');
    }
  }, [oobCode, router, toast]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!oobCode) return;
    setLoading(true);
    try {
      await confirmPasswordReset(oobCode, data.password);
      toast({
        title: 'Password Reset Successful',
        description: 'You can now log in with your new password.',
      });
      router.push('/login');
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: getAuthErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!oobCode) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Invalid password reset link...</p>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-card rounded-lg shadow-md">
        <div className="text-center">
          <Image src="/ChoresChampLogo.png" alt="Chores Champ Logo" width={128} height={128} className="mx-auto mb-4 rounded-lg" />
          <h1 className="text-3xl font-bold text-card-foreground">Reset your password</h1>
          <p className="text-muted-foreground">Enter your new password below.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
           <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md space-y-1">
            <p className="font-semibold">Password must contain:</p>
            <ul className="list-disc list-inside">
                <li>Min 12 chars and Max 16 chars</li>
                <li>At least one number</li>
                <li>At least one lowercase letter</li>
                <li>At least one uppercase letter</li>
                <li>At least one of: !,@,#,$,%,&,-,_,?</li>
            </ul>
          </div>
          <Button type="submit" className="w-full" disabled={loading} variant="navy">
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordComponent />
        </Suspense>
    )
}
