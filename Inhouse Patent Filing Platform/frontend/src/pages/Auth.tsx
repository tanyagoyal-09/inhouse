import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../auth/AuthContext";
import api, { API_URL } from "../services/api";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  role: z.enum(["APPLICANT", "FACULTY"]),
  department: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AuthProps {
  /** "register" is served at /register, "login" at /login. */
  mode: "login" | "register";
}

export function Auth({ mode }: AuthProps) {
  const { login } = useAuth();
  const registerMode = mode === "register";
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    // The backend requires a name when registering, so enforce it here
    // (login mode has no name field and is unaffected).
    resolver: zodResolver(
      schema.refine((data) => !registerMode || !!data.name?.trim(), {
        message: "Full name is required",
        path: ["name"],
      })
    ),

    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "APPLICANT",
      department: "",
    },
  });

  const submit = async (data: FormData) => {
    setError("");

    try {
      // =====================================================
      // REGISTER
      // =====================================================

      if (registerMode) {
        const response = await api.post("/auth/register", {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          department: data.department,
        });

        const { token, user } = response.data;

        // Persists the session; <PublicOnly> then moves the user on.
        login(token, user);

        return;
      }

      // =====================================================
      // LOGIN
      // =====================================================

      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const { token, user } = response.data;

      login(token, user);

    } catch (error: any) {
      console.error(
        "Authentication error:",
        error
      );

      const message = error?.response
        ? error.response.data?.message ||
          `The server rejected the request (HTTP ${error.response.status}).`
        : `Cannot reach the server at ${API_URL}. Make sure the backend is running and VITE_API_URL is correct.`;

      setError(message);
    }
  };

  return (
    <div className="bg-paper px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <img
            src="/assets/srmscet-logo.jpeg"
            alt=""
            width={72}
            height={72}
            className="mx-auto h-[72px] w-[72px] object-contain"
          />
          <p className="mt-3 font-display text-2xl font-bold leading-tight text-brand">Inhouse Patent Filing System</p>
          <p className="mt-1 text-sm text-slate-600">
            SRMS College of Engineering & Technology, Bareilly
          </p>
        </div>

          {/* =================================================
              CARD
          ================================================= */}

          <div className="card p-7 sm:p-8">

            <div className="mb-6">

              <h1 className="text-2xl font-bold text-slate-900">
                {registerMode
                  ? "Create your account"
                  : "Welcome back"}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {registerMode
                  ? "Create an account to manage your patent applications."
                  : "Sign in to continue to the Inhouse Patent Filing System."}
              </p>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit(submit)}
              className="space-y-4"
            >

              {/* =================================================
                  NAME
              ================================================= */}

              {registerMode && (
                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Full name
                  </label>

                  <input
                    className="field w-full"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    {...register("name")}
                  />

                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.name.message}
                    </p>
                  )}

                </div>
              )}

              {/* =================================================
                  EMAIL
              ================================================= */}

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email address
                </label>

                <input
                  className="field w-full"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                />

                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}

              </div>

              {/* =================================================
                  PASSWORD
              ================================================= */}

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <input
                  className="field w-full"
                  type="password"
                  placeholder="Minimum 8 characters"
                  autoComplete={
                    registerMode
                      ? "new-password"
                      : "current-password"
                  }
                  {...register("password")}
                />

                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}

              </div>

              {/* =================================================
                  REGISTRATION FIELDS
              ================================================= */}

              {registerMode && (
                <>

                  {/* ROLE */}

                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Account type
                    </label>

                    <select
                      className="field w-full"
                      {...register("role")}
                    >

                      <option value="APPLICANT">
                        Applicant
                      </option>

                      <option value="FACULTY">
                        Faculty
                      </option>

                    </select>

                  </div>

                  {/* DEPARTMENT */}

                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Department
                    </label>

                    <input
                      className="field w-full"
                      placeholder="e.g. Information Technology"
                      {...register("department")}
                    />

                  </div>

                </>
              )}

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full !py-3"
              >
                {isSubmitting
                  ? "Please wait..."
                  : registerMode
                    ? "Create account"
                    : "Login"}
              </button>

            </form>

            {/* =================================================
                TOGGLE
            ================================================= */}

            <div className="mt-6 border-t border-line pt-5 text-center">

              <p className="text-sm text-slate-500">
                {registerMode
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </p>

              <Link
                to={registerMode ? "/login" : "/register"}
                className="mt-1 inline-block text-sm font-bold text-brand hover:underline"
              >
                {registerMode
                  ? "Sign in instead"
                  : "Create an account"}
              </Link>

            </div>

          </div>

      </div>
    </div>
  );
}