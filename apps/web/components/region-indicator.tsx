
"use client"

import { useEffect, useState } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"

export function RegionIndicator() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()
    const [region, setRegion] = useState<string | null>(null)

    // API에서 런타임 리전 가져오기 (DR 시나리오 지원)
    useEffect(() => {
        const fetchRegion = async () => {
            try {
                // 타임스탬프를 추가하여 브라우저/프록시 캐시 방지
                const res = await fetch(`/api/health?t=${Date.now()}`, { cache: 'no-store' })
                if (res.ok) {
                    const data = await res.json()
                    if (data.region) {
                        setRegion(data.region)
                    }
                }
            } catch {
                // 실패 시에만 URL 파라미터에서 가져오기
                const urlRegion = searchParams.get('region')
                if (urlRegion) setRegion(urlRegion)
            }
        }
        fetchRegion()
    }, [searchParams])

    useEffect(() => {
        // [수정] URL에 리전이 있더라도 실시간 데이터(region)와 다르면 강제로 업데이트함
        if (region && searchParams.get('region') !== region) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('region', region)
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        }
    }, [region, searchParams, pathname, router])

    if (!region) return null

    // Visual indicator for DR/Failover regions
    const isMainRegion = region === 'ap-northeast-2'

    const getRegionName = (r: string) => {
        if (r === 'ap-northeast-2') return '(서울)';
        if (r === 'ap-northeast-1') return '(도쿄)';
        return '';
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-black/80 text-white px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-2 shadow-lg backdrop-blur-sm border border-white/10 pointer-events-none">
            <div className={`w-2 h-2 rounded-full ${isMainRegion ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
            Region: {region}{getRegionName(region)}
        </div>
    )
}
