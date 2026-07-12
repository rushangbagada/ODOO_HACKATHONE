"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { signinSchema, type SigninInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninInput>({
    resolver: zodResolver(signinSchema),
  });

  const onSubmit = async (data: SigninInput) => {
    setIsLoading(true);
    try {
      await axios.post("/api/auth/signin", data);
      toast.success("Logged in successfully!");
      const from = searchParams.get("from") || "/dashboard";
      router.push(from);
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)] bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-8">
          <div>
            <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="john@example.com"
                {...register("email")}
                error={errors.email?.message}
              />
              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  error={errors.password?.message}
                />
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign in
              </Button>
            </div>
          </form>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-xs text-indigo-800 dark:text-indigo-300">
              <p><span className="font-medium">Fleet Manager:</span> fleet@transitops.com</p>
              <p><span className="font-medium">Driver:</span> driver@transitops.com</p>
              <p><span className="font-medium">Safety Officer:</span> safety@transitops.com</p>
              <p><span className="font-medium">Financial Analyst:</span> finance@transitops.com</p>
              <p><span className="font-medium">Password:</span> password123</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link href="/signup" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <SigninForm />
    </Suspense>
  );
}

