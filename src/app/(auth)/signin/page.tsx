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
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-xl shadow-md space-y-8">
          <div>
            <h1 className="text-center text-4xl font-bold text-gray-900 mb-2">TransitOps</h1>
            <h2 className="text-center text-2xl font-bold text-gray-900">
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
                    className="text-xs font-medium text-blue-600 hover:text-blue-500"
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

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-xs text-blue-800">
              <p><span className="font-medium">Fleet Manager:</span> fleet@transitops.com</p>
              <p><span className="font-medium">Driver:</span> driver@transitops.com</p>
              <p><span className="font-medium">Safety Officer:</span> safety@transitops.com</p>
              <p><span className="font-medium">Financial Analyst:</span> finance@transitops.com</p>
              <p><span className="font-medium">Password:</span> password123</p>
            </div>
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

