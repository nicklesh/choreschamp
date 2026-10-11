'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-4xl flex flex-col items-center justify-center text-center">
        <Image src="/ChoresChampLogo.png" alt="Chores Champ Logo" width={128} height={128} className="mb-4 rounded-lg" />
        <h1 className="text-4xl sm:text-5xl font-bold mb-8" style={{ color: 'hsl(var(--foreground))' }}>
          Chores Champions
        </h1>
        <p className="text-lg mb-8 max-w-2xl px-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
          A fun, playful and secured way for kids and parents to track their chores and also earn rewards!
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <Button asChild size="lg" className="w-full sm:w-auto" variant="navy">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="navy" size="lg" className="w-full sm:w-auto">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
