"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { setToken } from "@/lib/auth";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { Lock, Mail, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", values);

      if (data.success) {
        setToken(data.data.accessToken);
        toast.success("Login successful! Redirecting...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = error.response?.data?.message || "Invalid credentials or server error.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      <Toaster position="top-center" richColors />
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[60%] bg-[#1A3A5C] transition-all duration-700 ease-in-out"></div>
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      
      <div className="relative w-full max-w-md p-1 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl z-10 mx-4 border border-white/20">
        <div className="bg-white p-10 rounded-[1.4rem] shadow-inner">
          <div className="mb-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#1A3A5C] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/20 rotate-3 hover:rotate-0 transition-transform duration-300">
               <span className="text-white text-2xl font-black tracking-tighter">DD</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Staff Portal</h1>
            <p className="mt-2 text-sm text-slate-400 font-medium tracking-[0.2em] uppercase">Management System</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1A3A5C] transition-colors">
                  <Mail size={18} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ddinfoways.co.nz"
                  {...register("email")}
                  disabled={loading}
                  className={`h-14 pl-12 bg-slate-50 border-slate-200 focus:border-[#1A3A5C] focus:ring-[#1A3A5C]/10 transition-all rounded-2xl text-base ${errors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-red-500 ml-1 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest" htmlFor="password">
                  Password
                </label>
                <button type="button" className="text-[10px] font-bold text-[#1A3A5C] hover:underline uppercase tracking-wider">
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1A3A5C] transition-colors">
                  <Lock size={18} />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={loading}
                  className={`h-14 pl-12 bg-slate-50 border-slate-200 focus:border-[#1A3A5C] focus:ring-[#1A3A5C]/10 transition-all rounded-2xl text-base ${errors.password ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-red-500 ml-1 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-bold bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 text-white shadow-xl shadow-blue-900/10 hover:shadow-blue-900/20 transition-all duration-300 rounded-2xl flex items-center justify-center gap-2 mt-4" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign in to Dashboard"
              )}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
              DD Infoways Limited NZ
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer Decoration */}
      <div className="absolute bottom-6 text-center w-full">
        <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase opacity-50">
          Internal Management Platform &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
