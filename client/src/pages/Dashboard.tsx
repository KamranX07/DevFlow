import { useAuth } from "../context/useAuth";

export default function Dashboard() {
    const { user, logout } = useAuth();

    async function handleLogout() {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    return (
        <main>
            <h1>DevFlow Dashboard</h1>
            <p>Welcome, {user?.username}!</p>
            <button onClick={handleLogout}>Logout</button>
        </main>
    );
}