import { useState, type ComponentProps } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import axios from "axios";

type RegisterSubmitEvent = Parameters<
    NonNullable<ComponentProps<"form">["onSubmit"]>>[0];

export default function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    async function handleSubmit(event: RegisterSubmitEvent) {
        event.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            await api.post("/auth/register", {
                username: username.trim(),
                email: email.trim(),
                password,
            });
            
            await refreshUser();
            navigate("/dashboard", { replace: true });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ??
                    err.response?.data?.error ??
                    "Registration failed. Please try again."
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
            Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-400">
            Start building better projects with DevFlow.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {[
            {
                id: "username",
                label: "Username",
                value: username,
                change: setUsername,
                type: "text",
                autocomplete: "username",
                placeholder: "Choose a username",
            },
            {
                id: "email",
                label: "Email",
                value: email,
                change: setEmail,
                type: "email",
                autocomplete: "email",
                placeholder: "you@example.com",
            },
            {
                id: "password",
                label: "Password",
                value: password,
                change: setPassword,
                type: "password",
                autocomplete: "new-password",
                placeholder: "Create a password",
            },
            {
                id: "confirmPassword",
                label: "Confirm password",
                value: confirmPassword,
                change: setConfirmPassword,
                type: "password",
                autocomplete: "new-password",
                placeholder: "Enter your password again",
            },
            ].map((field) => (
            <div key={field.id}>
                <label
                htmlFor={field.id}
                className="mb-2 block text-sm font-medium text-slate-300"
                >
                {field.label}
                </label>
                <input
                id={field.id}
                name={field.id}
                type={field.type}
                value={field.value}
                onChange={(event) => field.change(event.target.value)}
                autoComplete={field.autocomplete}
                placeholder={field.placeholder}
                required
                className="w-full rounded-lg border border-slate-700 bg-[#0b1020] px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
            </div>
            ))}

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
            {submitting ? "Creating account..." : "Create account"}
            </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
            to="/login"
            className="font-medium text-indigo-400 hover:text-indigo-300"
            >
            Log in
            </Link>
        </p>
        </section>
    </main>
    );
}