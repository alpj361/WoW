/**
 * Simple global state for auth processing
 * Used to coordinate between auth-callback and other components
 */

type AuthStateListener = (state: AuthState) => void;

interface AuthState {
    isProcessing: boolean;
    isVerified: boolean;
}

class AuthStateManager {
    private state: AuthState = {
        isProcessing: false,
        isVerified: false,
    };
    private listeners: Set<AuthStateListener> = new Set();

    getState(): AuthState {
        return { ...this.state };
    }

    setProcessing(value: boolean): void {
        this.state.isProcessing = value;
        this.notify();
    }

    setVerified(value: boolean): void {
        this.state.isVerified = value;
        this.notify();
    }

    reset(): void {
        this.state = {
            isProcessing: false,
            isVerified: false,
        };
        this.notify();
    }

    subscribe(listener: AuthStateListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        const state = this.getState();
        this.listeners.forEach(listener => listener(state));
    }
}

export const authState = new AuthStateManager();
