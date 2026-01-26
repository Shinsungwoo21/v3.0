"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Mail, CheckCircle2, XCircle, Loader2 } from "lucide-react"

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

function EmailVerificationForm({
    email,
    onConfirm,
    onResend,
    onBack,
    loading
}: {
    email: string
    onConfirm: (code: string) => Promise<void>
    onResend: () => Promise<void>
    onBack: () => void
    loading: boolean
}) {
    const [code, setCode] = React.useState("")
    const [error, setError] = React.useState("")
    const [resending, setResending] = React.useState(false)
    const [resendSuccess, setResendSuccess] = React.useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        try {
            await onConfirm(code)
        } catch (err: any) {
            setError(err.message || "인증에 실패했습니다.")
        }
    }

    async function handleResend() {
        setResending(true)
        setResendSuccess(false)
        try {
            await onResend()
            setResendSuccess(true)
            setTimeout(() => setResendSuccess(false), 3000)
        } catch (err: any) {
            setError(err.message || "재발송에 실패했습니다.")
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-green-500 z-10">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-green-100 rounded-full">
                            <Mail className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">이메일 인증</CardTitle>
                    <CardDescription>
                        <span className="font-medium text-gray-700">{email}</span>
                        <br />
                        위 이메일로 발송된 6자리 인증 코드를 입력해주세요.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <label htmlFor="code" className="text-sm font-medium">인증 코드</label>
                            <Input
                                id="code"
                                type="text"
                                placeholder="123456"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                maxLength={6}
                                className="h-12 text-center text-2xl tracking-widest font-mono"
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md">
                                {error}
                            </div>
                        )}
                        {resendSuccess && (
                            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-100 rounded-md">
                                인증 코드가 재발송되었습니다.
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Button
                            type="submit"
                            className="w-full h-11"
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    확인 중...
                                </>
                            ) : "인증 완료"}
                        </Button>
                        <div className="flex gap-2 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={handleResend}
                                disabled={resending}
                            >
                                {resending ? "발송 중..." : "코드 재발송"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="flex-1"
                                onClick={onBack}
                            >
                                처음으로
                            </Button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

export default function SignupPage() {
    const router = useRouter()
    const { signup, confirmEmail, resendVerificationCode, isEmailVerificationPending } = useAuth()
    const [error, setError] = React.useState<string>("")
    const [loading, setLoading] = React.useState(false)
    const [password, setPassword] = React.useState("")
    const [pendingEmail, setPendingEmail] = React.useState("")
    const [showVerification, setShowVerification] = React.useState(false)

    const requirements = checkPasswordRequirements(password)
    const allRequirementsMet = Object.values(requirements).every(Boolean)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(event.currentTarget)
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const formPassword = formData.get("password") as string
        const confirmPassword = formData.get("confirmPassword") as string

        if (formPassword !== confirmPassword) {
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
            await signup(email, formPassword, name)
            setPendingEmail(email)
            setShowVerification(true)
        } catch (err: any) {
            setError(err.message || "회원가입 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    async function handleConfirmEmail(code: string) {
        setLoading(true)
        try {
            await confirmEmail(pendingEmail, code)
            alert("이메일 인증이 완료되었습니다! 🎉 로그인해주세요.")
            router.push("/login")
        } catch (err: any) {
            throw err // EmailVerificationForm에서 처리
        } finally {
            setLoading(false)
        }
    }

    async function handleResendCode() {
        await resendVerificationCode(pendingEmail)
    }

    if (showVerification || isEmailVerificationPending) {
        return (
            <EmailVerificationForm
                email={pendingEmail}
                onConfirm={handleConfirmEmail}
                onResend={handleResendCode}
                onBack={() => {
                    setShowVerification(false)
                    setPendingEmail("")
                }}
                loading={loading}
            />
        )
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 px-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary z-10">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <UserPlus className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">회원가입</CardTitle>
                    <CardDescription>
                        새로운 계정을 만들고 MegaTicket의 모든 기능을 누려보세요.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="grid gap-5">
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium leading-none">이름</label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="홍길동"
                                required
                                disabled={loading}
                                className="h-11"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none">이메일</label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                disabled={loading}
                                className="h-11"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none">비밀번호</label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                disabled={loading}
                                className="h-11"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {/* 비밀번호 요건 표시 */}
                            <PasswordRequirements password={password} />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">비밀번호 확인</label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
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
                            disabled={loading || !allRequirementsMet}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    가입 중...
                                </>
                            ) : "회원가입"}
                        </Button>
                        <div className="text-center text-sm text-gray-500 mt-2">
                            이미 계정이 있으신가요?{" "}
                            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                                로그인
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}