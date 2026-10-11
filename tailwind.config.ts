import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // The 'colors' object must be here, not under 'extend', to override Tailwind's default palette.
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      card: {
        DEFAULT: 'hsl(var(--card))',
        foreground: 'hsl(var(--card-foreground))',
      },
      popover: {
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      },
      primary: {
        DEFAULT: 'hsl(var(--primary))',
        foreground: 'hsl(var(--primary-foreground))',
      },
      secondary: {
        DEFAULT: 'hsl(var(--secondary))',
        foreground: 'hsl(var(--secondary-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      border: 'hsl(var(--border))',
      input: 'hsl(var(--input))',
      ring: 'hsl(var(--ring))',
      chart: {
        '1': 'hsl(var(--chart-1))',
        '2': 'hsl(var(--chart-2))',
        '3': 'hsl(var(--chart-3))',
        '4': 'hsl(var(--chart-4))',
        '5': 'hsl(var(--chart-5))',
      },
      sidebar: {
        DEFAULT: 'hsl(var(--sidebar-background))',
        foreground: 'hsl(var(--sidebar-foreground))',
        primary: 'hsl(var(--sidebar-primary))',
        'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
        accent: 'hsl(var(--sidebar-accent))',
        'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        border: 'hsl(var(--sidebar-border))',
        ring: 'hsl(var(--sidebar-ring))',
      },
       // Custom colors from globals.css need to be explicitly available to Tailwind
      'basalt-stones': 'hsl(var(--basalt-stones))',
      'white-dove': 'hsl(var(--white-dove))',
      'olive-green': 'hsl(var(--olive-green))',
      'sunset-sky': 'hsl(var(--sunset-sky))',
      'bamboo-wood': 'hsl(var(--bamboo-wood))',
      'mist': 'hsl(var(--mist))',
      'concrete': 'hsl(var(--concrete))',
      'lotus-flower': 'hsl(var(--lotus-flower))',
      'very-light-navy': 'hsl(var(--very-light-navy))',
      'light-sunset-sky': 'hsl(var(--light-sunset-sky))',
      'dark-sunset-sky': 'hsl(var(--dark-sunset-sky))',
      'very-dark-sunset-sky': 'hsl(var(--very-dark-sunset-sky))',
      'light-olive-green': 'hsl(var(--light-olive-green))',
      'very-light-olive-green': 'hsl(var(--very-light-olive-green))',
      'light-palm-leaf': 'hsl(var(--light-palm-leaf))',
      'very-light-bamboo-wood': 'hsl(var(--very-light-bamboo-wood))',
      'dark-natural-light': 'hsl(var(--dark-natural-light))',
      'natural-light': 'hsl(var(--natural-light))',
      'very-light-zen-garden': 'hsl(var(--very-light-zen-garden))',
    },
    borderRadius: {
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
