import { useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../auth/AuthContext";
import { Alert } from "../components/ui/Alert";
import api from "../services/api";

const schema = z.object({
  email: z.string().email("Enter a valid administrator email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type FormData = z.infer<typeof schema>;

export function AdminLogin() {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const submit = async (data: FormData) => {
    setError("");
    try {
      const response = await api.post("/auth/admin-login", data);
      const { token, user } = response.data;
      if (user?.role !== "ADMIN") {
        setError("This portal is for administrators only. Please use the Applicant / Faculty portal.");
        return;
      }
      // Persists the session; <PublicOnly> then moves the user on.
      login(token, user);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid administrator credentials.");
    }
  };

  return (
    <div className="bg-paper px-4 py-10 sm:py-14">
      <div className="card mx-auto grid max-w-5xl overflow-hidden lg:grid-cols-[.9fr_1.1fr]">
        <div className="on-dark hidden bg-brand-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15">
              <ShieldCheck aria-hidden="true" />
            </div>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-brand-200">Secure console</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight">
              Administration
              <br />
              Workspace
            </h1>
            <p className="mt-5 text-sm leading-6 text-brand-100">
              Review patent applications, manage submitted documents, update statuses and generate
              filing PDFs.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-5 text-sm text-brand-50">
            <LockKeyhole size={18} aria-hidden="true" />
            <p className="mt-3 font-semibold">
              Administrator access is separated from the applicant experience.
            </p>
          </div>
        </div>

        <div className="p-7 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-7">
              <h2 className="text-3xl font-bold text-slate-900">Administrator login</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sign in with your administrator account to access the review console.
              </p>
            </div>

            {error && (
              <div className="mb-5">
                <Alert tone="error">{error}</Alert>
              </div>
            )}

            <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="admin-email" className="mb-2 block text-sm font-bold text-slate-700">
                  Administrator email
                </label>
                <input
                  id="admin-email"
                  className="field"
                  type="email"
                  placeholder="admin@example.com"
                  autoComplete="username"
                  {...register("email")}
                />
                {errors.email && <p className="error">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="admin-password" className="mb-2 block text-sm font-bold text-slate-700">
                  Password
                </label>
                <input
                  id="admin-password"
                  className="field"
                  type="password"
                  placeholder="Administrator password"
                  autoComplete="current-password"
                  {...register("password")}
                />
                {errors.password && <p className="error">{errors.password.message}</p>}
              </div>
              <button disabled={isSubmitting} className="btn-primary w-full !py-3">
                {isSubmitting ? "Authenticating…" : "Sign in to administration"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Admin accounts are created and maintained by the system administrator.
              <br />
              Not an administrator?{" "}
              <Link to="/login" className="font-bold text-brand hover:underline">
                Applicant / Faculty sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
