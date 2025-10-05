"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, ArrowLeft, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated";
import { toast } from "sonner";

// Login form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success("Login successful!");
      router.push("/dashboard");
    } catch (error) {
      // Error is already handled by the store and toast
      console.error("Login error:", error);
    }
  };

  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen flex p-8">
        {/* Left Section - Login Form */}
        <div className="w-full lg:w-1/2 px-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Logo and Company Name */}
            <div className="flex items-center gap-3 mb-12">
              <img src="/images/ia_logo.png" alt="India Accelerator" className="h-8 w-auto" />
            </div>

            <div>
              {/* Login Header */}
              <div className="space-y-2 mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Login to your account</h1>
                <p className="text-gray-600">Enter your email below to login to your account</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email ID"
                      className="pl-10 h-12 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••"
                      className="pl-10 pr-10 h-12 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Login"}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Section - Image */}
        <div className="hidden lg:block lg:w-1/2">
          <div className="h-full w-full bg-[url('/images/login_image.jpg')] bg-cover bg-center bg-no-repeat rounded-xl" />
        </div>
      </div>
    </RedirectIfAuthenticated>
  );
}