import { useState, type ComponentProps } from "react";
import { useAuth } from "../context/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import axios from "axios";

type LoginSubmitEvent = Parameters<
    NonNullable<ComponentProps<"form">["onSubmit"]>>[0];

export default function Login() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { refreshUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/dashboard";

    async function handleSubmit(event: LoginSubmitEvent) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            await api.post("/auth/login", {
                email: identifier.trim(),
                password,
            });

            await refreshUser();
            navigate(from, { replace: true });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Login failed. Please check your credentials and try again."
                );
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#0b1020] px-4 py-10 text-slate-100">
            <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#131b2e] p-8 shadow-2xl shadow-black/20 sm:p-10">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-xl font-bold shadow-lg shadow-indigo-500/25">
                        D
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome back
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Log in to continue to DevFlow.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label 
                            htmlFor="identifier"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Email
                        </label>
                        <input 
                            id="identifier" 
                            type="email"
                            value={identifier}
                            onChange={(event) => setIdentifier(event.target.value)}
                            autoComplete="email"
                            placeholder="you@example.com" 
                            required
                            className="w-full rounded-lg border border-slate-700 bg-[#0b1020] px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                        
                    <div>
                        <label 
                            htmlFor="password" 
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Password
                        </label>
                        <input
                            id="password" 
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            required
                            className="w-full rounded-lg border border-slate-700 bg-[#0b1020] px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    {error && (
                        <p 
                            role="alert"
                            className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300" 
                        >
                            {error}
                        </p>
                    )}

                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full rounded-lg bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#131b2e] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? "Logging in..." : "Log in"}
                    </button>
                </form>

                <p className="mt-7 text-center text-sm text-slate-400">
                    Don't have an account?{" "} 
                    <Link 
                        to="/register"
                        className="font-medium text-indigo-400 hover:text-indigo-300"
                    >
                        Create one
                    </Link>
                </p>
            </section>            
        </main>
    );
}