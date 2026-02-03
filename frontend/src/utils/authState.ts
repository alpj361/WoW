/**
 * Simple global state for auth processing
 * Used to coordinate between auth-callback and other components
 */

type AuthStateListener = (state: AuthState) => void;

interface AuthState {
    isProcessing: boolean;
    isVerified: boolean;
    isInitialized: boolean;  // Track if auth has been initialized (survives remounts)
}

class AuthStateManager {
    private state: AuthState = {
        isProcessing: false,
        isVerified: false,
        isInitialized: false,
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

    setInitialized(value: boolean): void {
        this.state.isInitialized = value;
        // Don't notify - this is for internal tracking only
    }

    reset(): void {
        // Only notify if state actually changed
        // Note: we do NOT reset isInitialized - that should persist
        if (this.state.isProcessing || this.state.isVerified) {
            this.state = {
                isProcessing: false,
                isVerified: false,
                isInitialized: this.state.isInitialized,  // Preserve initialization flag
            };
            this.notify();
        }
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
