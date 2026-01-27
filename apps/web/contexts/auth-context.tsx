"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { Amplify } from "aws-amplify"
import {
    signIn,
    signUp,
    signOut,
    getCurrentUser,
    fetchUserAttributes,
    confirmSignUp,
    resendSignUpCode,
    confirmSignIn,
    type SignUpOutput,
} from "aws-amplify/auth"

// --- Interfaces ---

export interface User {
    id: string
    email: string
    name: string
}

// --- Context & Provider ---

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isEmailVerificationPending: boolean
    isNewPasswordRequired: boolean
    pendingEmail: string
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string, name: string) => Promise<void>
    confirmEmail: (email: string, code: string) => Promise<void>
    resendVerificationCode: (email: string) => Promise<void>
    completeNewPassword: (newPassword: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const USER_STORAGE_KEY = "megaticket-auth-user"

function configureAmplify() {
    if (typeof window === "undefined") return;

    const config = (window as any).__PLCR_CONFIG__;
    if (!config?.COGNITO_USER_POOL_ID || !config?.COGNITO_CLIENT_ID) {
        console.warn("[Auth] Cognito config not found in window.__PLCR_CONFIG__");
        return;
    }

    Amplify.configure({
        Auth: {
            Cognito: {
                userPoolId: config.COGNITO_USER_POOL_ID,
                userPoolClientId: config.COGNITO_CLIENT_ID,
                signUpVerificationMethod: "code",
            }
        }
    });

    console.log("[Auth] Amplify configured with Cognito");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEmailVerificationPending, setIsEmailVerificationPending] = useState(false)
    const [isNewPasswordRequired, setIsNewPasswordRequired] = useState(false)
    const [pendingEmail, setPendingEmail] = useState("")

    useEffect(() => {
        configureAmplify();
        checkCurrentUser();
    }, [])

    async function checkCurrentUser() {
        try {
            const currentUser = await getCurrentUser();
            const attributes = await fetchUserAttributes();

            const user: User = {
                id: currentUser.userId,
                email: attributes.email || "",
                name: attributes.name || attributes.email || "",
            };

            setUser(user);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } catch (error) {
            console.log("[Auth] No current user");
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
        } finally {
            setIsLoading(false);
        }
    }

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);

            const result = await signIn({
                username: email,
                password: password,
            });

            console.log("[Auth] Sign in result:", result);

            if (result.isSignedIn) {
                await checkCurrentUser();
            } else if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
                setIsEmailVerificationPending(true);
                throw new Error("이메일 인증이 필요합니다. 인증 코드를 확인해주세요.");
            } else if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
                console.log("[Auth] NEW_PASSWORD_REQUIRED challenge");
                setPendingEmail(email);
                setIsNewPasswordRequired(true);
                throw new Error("비밀번호 재설정이 필요합니다.");
            } else if (result.nextStep.signInStep === "DONE") {
                await checkCurrentUser();
            } else {
                console.warn("[Auth] Unexpected signInStep:", result.nextStep.signInStep);
                throw new Error("로그인에 실패했습니다.");
            }
        } catch (error: any) {
            console.error("[Auth] Login error:", error);

            if (error.name === "PasswordResetRequiredException") {
                console.log("[Auth] DR migration - password reset required");
                throw new Error("DR_PASSWORD_RESET_REQUIRED");
            }

            if (error.name === "NotAuthorizedException") {
                throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
            } else if (error.name === "UserNotFoundException") {
                throw new Error("등록되지 않은 사용자입니다.");
            } else if (error.name === "UserNotConfirmedException") {
                setIsEmailVerificationPending(true);
                throw new Error("이메일 인증이 필요합니다.");
            }

            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    const signup = async (email: string, password: string, name: string) => {
        try {
            setIsLoading(true);

            const result: SignUpOutput = await signUp({
                username: email,
                password: password,
                options: {
                    userAttributes: {
                        email: email,
                        name: name,
                    },
                },
            });

            console.log("[Auth] SignUp result:", result);

            if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
                setIsEmailVerificationPending(true);
            }

        } catch (error: any) {
            console.error("[Auth] Signup error:", error);

            if (error.name === "UsernameExistsException") {
                throw new Error("이미 존재하는 이메일입니다.");
            } else if (error.name === "InvalidPasswordException") {
                throw new Error("비밀번호는 12자 이상, 대/소문자, 숫자, 특수문자를 포함해야 합니다.");
            } else if (error.name === "InvalidParameterException") {
                throw new Error("입력 정보가 올바르지 않습니다.");
            }

            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    const confirmEmail = async (email: string, code: string) => {
        try {
            setIsLoading(true);

            const result = await confirmSignUp({
                username: email,
                confirmationCode: code,
            });

            if (result.isSignUpComplete) {
                setIsEmailVerificationPending(false);
                console.log("[Auth] Email confirmed successfully");
            }
        } catch (error: any) {
            console.error("[Auth] Confirm error:", error);

            if (error.name === "CodeMismatchException") {
                throw new Error("인증 코드가 올바르지 않습니다.");
            } else if (error.name === "ExpiredCodeException") {
                throw new Error("인증 코드가 만료되었습니다. 재발송해주세요.");
            }

            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    const resendVerificationCode = async (email: string) => {
        try {
            await resendSignUpCode({ username: email });
            console.log("[Auth] Verification code resent");
        } catch (error: any) {
            console.error("[Auth] Resend code error:", error);
            throw new Error("인증 코드 재발송에 실패했습니다.");
        }
    }

    const completeNewPassword = async (newPassword: string) => {
        try {
            setIsLoading(true);

            const result = await confirmSignIn({
                challengeResponse: newPassword,
            });

            if (result.isSignedIn) {
                setIsNewPasswordRequired(false);
                setPendingEmail("");
                await checkCurrentUser();
                console.log("[Auth] New password set successfully");
            } else {
                throw new Error("비밀번호 설정에 실패했습니다.");
            }
        } catch (error: any) {
            console.error("[Auth] Complete new password error:", error);

            if (error.name === "InvalidPasswordException") {
                throw new Error("비밀번호는 12자 이상, 대/소문자, 숫자, 특수문자를 포함해야 합니다.");
            }

            throw error;
        } finally {
            setIsLoading(false);
        }
    }

    const logout = async () => {
        try {
            await signOut();
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
            console.log("[Auth] Logged out");
        } catch (error) {
            console.error("[Auth] Logout error:", error);
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isEmailVerificationPending,
            isNewPasswordRequired,
            pendingEmail,
            login,
            signup,
            confirmEmail,
            resendVerificationCode,
            completeNewPassword,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

// --- Hook ---

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}