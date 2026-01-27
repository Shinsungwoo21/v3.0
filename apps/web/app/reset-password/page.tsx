"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { KeyRound, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"

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

export default function ResetPasswordPage() {
    const router = useRouter()
    const { completeNewPassword, isNewPasswordRequired, pendingEmail, isLoading } = useAuth()
    const [error, setError] = React.useState<string>("")
    const [password, setPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    const requirements = checkPasswordRequirements(password)
    const allRequirementsMet = Object.values(requirements).every(Boolean)
    const passwordsMatch = password === confirmPassword && password.length > 0

    React.useEffect(() => {
        if (!isLoading && !isNewPasswordRequired) {
            router.push("/login")
        }
    }, [isLoading, isNewPasswordRequired, router])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
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
            await completeNewPassword(password)
            alert("비밀번호가 성공적으로 재설정되었습니다! 🎉")
            router.push("/")
        } catch (err: any) {
            setError(err.message || "비밀번호 재설정 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!isNewPasswordRequired) {
        return null
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-orange-500 z-10">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-orange-100 rounded-full">
                            <KeyRound className="w-8 h-8 text-orange-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">비밀번호 재설정</CardTitle>
                    <CardDescription className="space-y-2">
                        <div className="flex items-center justify-center gap-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span className="text-sm text-amber-700">재해 복구로 인해 비밀번호 재설정이 필요합니다</span>
                        </div>
                        {pendingEmail && (
                            <p className="text-sm mt-2">
                                계정: <span className="font-medium text-gray-700">{pendingEmail}</span>
                            </p>
                        )}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="grid gap-5">
                        <div className="grid gap-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none">새 비밀번호</label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                disabled={loading}
                                className="h-11"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="새 비밀번호를 입력하세요"
                            />
                            <PasswordRequirements password={password} />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">새 비밀번호 확인</label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                disabled={loading}
                                className="h-11"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="새 비밀번호를 다시 입력하세요"
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
                            className="w-full h-11 text-base font-medium shadow-md transition-all hover:shadow-lg bg-orange-500 hover:bg-orange-600"
                            type="submit"
                            disabled={loading || !allRequirementsMet || !passwordsMatch}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    설정 중...
                                </>
                            ) : "비밀번호 재설정"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
