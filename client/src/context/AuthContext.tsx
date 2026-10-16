import {  
    useCallback, 
    useEffect, 
    useState,
    type ReactNode, 
} from "react";
import api from "../api/axios";
import { AuthContext } from "./auth-context";
import type { User } from "./auth-types";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.get("/auth/me");
            const data = response.data;

            setUser(data.user ?? data);
        } catch {
            setUser(null);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        let active = true;

        async function loadUser() {
            try {
                const response = await api.get("/auth/me");
                const data = response.data;

                if (active) {
                    setUser(data.user ?? data);
                }
            } catch {
                if (active) setUser(null);
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadUser();

        return () => {
            active = false;
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
