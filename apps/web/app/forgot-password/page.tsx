"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, KeyRound, CheckCircle2, XCircle, Loader2 } from "lucide-react"

function checkPasswordRequirements(password: string) {
    return {
        minLength: password.length >= 12,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
}

function PasswordRequirements({ password }: { password: string }) {
    const requirements = checkPasswordRequirements(password)

    const items = [
        { key: "minLength", label: "12자 이상", met: requirements.minLength },
        { key: "hasUppercase", label: "대문자 포함", met: requirements.hasUppercase },
        { key: "hasLowercase", label: "소문자 포함", met: requirements.hasLowercase },
        { key: "hasNumber", label: "숫자 포함", met: requirements.hasNumber },
        { key: "hasSpecial", label: "특수문자 포함", met: requirements.hasSpecial },
    ]

    return (
        <div className="mt-2 p-3 bg-gray-50 rounded-md border">
            <p className="text-xs font-medium text-gray-600 mb-2">비밀번호 요건</p>
            <div className="grid grid-cols-2 gap-1">
                {items.map((item) => (
                    <div key={item.key} className="flex items-center gap-1.5">
                        {item.met ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                            <XCircle className="w-3.5 h-3.5 text-gray-300" />
                        )}
                        <span className={`text-xs ${item.met ? "text-green-600" : "text-gray-400"}`}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ForgotPasswordPage() {
    const router = useRouter()
    const { forgotPassword, confirmForgotPassword } = useAuth()
    const [step, setStep] = React.useState<"email" | "code">("email")
    const [email, setEmail] = React.useState("")
    const [code, setCode] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [error, setError] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    const requirements = checkPasswordRequirements(password)
    const allRequirementsMet = Object.values(requirements).every(Boolean)
    const passwordsMatch = password === confirmPassword && password.length > 0

    async function handleSendCode(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            await forgotPassword(email)
            setStep("code")
        } catch (err: any) {
            setError(err.message || "인증 코드 전송에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (password !== confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.")
            setLoading(false)
            return
        }

        if (!allRequirementsMet) {
            setError("비밀번호 요건을 모두 충족해주세요.")
            setLoading(false)
            return
        }

        try {
            await confirmForgotPassword(email, code, password)
            alert("비밀번호가 성공적으로 재설정되었습니다! 🎉")
            router.push("/login")
        } catch (err: any) {
            setError(err.message || "비밀번호 재설정에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-500 z-10">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            {step === "email" ? (
                                <Mail className="w-8 h-8 text-blue-600" />
                            ) : (
                                <KeyRound className="w-8 h-8 text-blue-600" />
                            )}
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {step === "email" ? "비밀번호 찾기" : "비밀번호 재설정"}
                    </CardTitle>
                    <CardDescription>
                        {step === "email" 
                            ? "등록된 이메일로 인증 코드를 전송합니다."
                            : "이메일로 받은 인증 코드와 새 비밀번호를 입력하세요."}
                    </CardDescription>
                </CardHeader>

                {step === "email" ? (
                    <form onSubmit={handleSendCode}>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <label htmlFor="email" className="text-sm font-medium">이메일</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11"
                                />
                            </div>
                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 pt-4">
                            <Button
                                className="w-full h-11 text-base font-medium shadow-md transition-all hover:shadow-lg"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        전송 중...
                                    </>
                                ) : "인증 코드 전송"}
                            </Button>
                            <div className="text-center text-sm text-gray-500">
                                <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                                    로그인으로 돌아가기
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <CardContent className="grid gap-5">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-700">
                                    <span className="font-medium">{email}</span>로<br />
                                    인증 코드가 전송되었습니다.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="code" className="text-sm font-medium">인증 코드</label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="6자리 코드 입력"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11"
                                    maxLength={6}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="password" className="text-sm font-medium">새 비밀번호</label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="새 비밀번호 입력"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11"
                                />
                                <PasswordRequirements password={password} />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium">새 비밀번호 확인</label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="새 비밀번호 다시 입력"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11"
                                />
                                {confirmPassword.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {passwordsMatch ? (
                                            <>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                <span className="text-xs text-green-600">비밀번호가 일치합니다</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                                                <span className="text-xs text-red-600">비밀번호가 일치하지 않습니다</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 pt-4">
                            <Button
                                className="w-full h-11 text-base font-medium shadow-md transition-all hover:shadow-lg"
                                type="submit"
                                disabled={loading || !allRequirementsMet || !passwordsMatch}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        재설정 중...
                                    </>
                                ) : "비밀번호 재설정"}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setStep("email")}
                                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                            >
                                이메일 다시 입력
                            </button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    )
}
