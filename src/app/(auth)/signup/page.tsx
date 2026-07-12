"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    try {
      await axios.post("/api/auth/signup", data);
      toast.success("Account created successfully! Please sign in.");
      router.push("/signin");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Something went wrong");
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
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/signin" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                {...register("name")}
                error={errors.name?.message}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="john@example.com"
                {...register("email")}
                error={errors.email?.message}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                error={errors.password?.message}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select
                  {...register("role")}
                  defaultValue=""
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="" disabled>Select a role</option>
                  <option value="FLEET_MANAGER">Fleet Manager</option>
                  <option value="DRIVER">Driver</option>
                  <option value="SAFETY_OFFICER">Safety Officer</option>
                  <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                </select>
                {errors.role?.message && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.role.message as string}</p>
                )}
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign up
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
