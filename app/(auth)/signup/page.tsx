'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { toast } from 'sonner'
import { BookOpen, KeyRound, Mail, User, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const signupSchema = zod.object({
  fullName: zod.string().min(2, 'Full name must be at least 2 characters'),
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: zod.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type SignupFormValues = zod.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
        },
      })

      if (error) {
        toast.error(error.message || 'Unable to sign up. Please try again.')
        return
      }

      toast.success('Your room is ready! Redirecting to onboarding...')
      router.refresh()
      router.push('/onboarding')
    } catch (err: any) {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        toast.error(error.message || 'Unable to initialize Google Sign In.')
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center bg-cream px-6 py-12">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-primary-pink/20 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-butter/30 blur-3xl" />

      <div className="card-cozy w-full max-w-md bg-white/80 backdrop-blur-md space-y-7 z-10 p-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-warm-brown text-cream shadow-md transition-transform hover:scale-105">
            <BookOpen className="h-6 w-6" />
          </Link>
          <h2 className="font-playfair text-3xl font-bold text-warm-brown">Join the Club</h2>
          <p className="text-sm text-navy/70">
            Create your account to unlock shelves and cozy swaps.
          </p>
        </div>

        {/* Credentials Form */}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-warm-brown">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
              <input
                type="text"
                placeholder="Elizabeth Bennet"
                {...register('fullName')}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-sage/30 bg-cream/30 focus:bg-white text-navy placeholder:text-navy/40 text-sm font-semibold transition-all focus:outline-none"
              />
            </div>
            {errors.fullName && (
              <span className="flex items-center gap-1 text-xs font-bold text-coral mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.fullName.message}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-warm-brown">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
              <input
                type="email"
                placeholder="reader@bookclub.com"
                {...register('email')}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-sage/30 bg-cream/30 focus:bg-white text-navy placeholder:text-navy/40 text-sm font-semibold transition-all focus:outline-none"
              />
            </div>
            {errors.email && (
              <span className="flex items-center gap-1 text-xs font-bold text-coral mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-warm-brown">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-sage/30 bg-cream/30 focus:bg-white text-navy placeholder:text-navy/40 text-sm font-semibold transition-all focus:outline-none"
              />
            </div>
            {errors.password && (
              <span className="flex items-center gap-1 text-xs font-bold text-coral mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-warm-brown">
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-sage/30 bg-cream/30 focus:bg-white text-navy placeholder:text-navy/40 text-sm font-semibold transition-all focus:outline-none"
              />
            </div>
            {errors.confirmPassword && (
              <span className="flex items-center gap-1 text-xs font-bold text-coral mt-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-cozy btn-cozy-primary w-full py-3.5 flex items-center justify-center gap-2 font-bold tracking-wide mt-2"
          >
            {isLoading ? 'Creating your shelf...' : 'Create Your Room'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-sage/20"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-navy/40 uppercase tracking-widest">or</span>
          <div className="flex-grow border-t border-sage/20"></div>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="btn-cozy btn-cozy-outline w-full py-3 flex items-center justify-center gap-2.5 font-bold text-sm bg-white/50 backdrop-blur"
        >
          <svg className="h-4 w-4.5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.566 0-6.463-2.896-6.463-6.462 0-3.567 2.897-6.463 6.463-6.463 1.548 0 2.966.549 4.084 1.455l3.078-3.078C19.263 2.115 15.986 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.207 0 11.24-5.033 11.24-11.24 0-.768-.073-1.503-.207-2.185l-11.033.03z"
            />
          </svg>
          <span>{isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
        </button>

        {/* Footer info */}
        <div className="text-center text-xs text-navy/60 font-semibold border-t border-sage/10 pt-4">
          Already a member?{' '}
          <Link href="/login" className="text-coral hover:underline font-bold">
            Sign in to your room
          </Link>
        </div>
      </div>
    </div>
  )
}
