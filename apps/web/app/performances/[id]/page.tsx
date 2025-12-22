"use client"

import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Timer, Users, Phone } from "lucide-react"

// 공연 데이터 타입
interface PerformanceData {
    id: string
    title: string
    titleEn?: string
    genre: string
    image: string
    dateRange: string
    schedule: string
    venue: string
    description: string
    price: string
    runtime: string
    ageLimit: string
    producer?: string
    contact?: string
}

// Mock 공연 데이터
const PERFORMANCES: Record<string, PerformanceData> = {
    "perf-1": {
        id: "perf-1",
        title: "오페라의 유령",
        titleEn: "The Phantom of the Opera",
        genre: "뮤지컬",
        image: "/posters/opera.png",
        dateRange: "2024.12.01 ~ 2025.03.31",
        schedule: "화~금 19:30 / 토 14:00, 19:00 / 일 14:00, 18:00",
        venue: "샤롯데씨어터",
        description: "전 세계를 매혹시킨 불멸의 명작! 브로드웨이 최장기 공연 기네스북 등재. 앤드류 로이드 웨버의 역대급 뮤지컬 넘버와 화려한 무대 연출로 관객들의 마음을 사로잡는 감동의 대서사시.",
        price: "VIP석 150,000원 / R석 120,000원 / S석 90,000원 / A석 60,000원",
        runtime: "150분 (인터미션 20분)",
        ageLimit: "8세 이상",
        producer: "S&CO",
        contact: "1588-5212"
    },
    "perf-kinky-1": {
        id: "perf-kinky-1",
        title: "킹키부츠",
        titleEn: "Kinky Boots",
        genre: "뮤지컬",
        image: "/posters/kinky-boots.png",
        dateRange: "2026.02.10 ~ 2026.04.30",
        schedule: "화, 목, 금 19:30 / 수 14:30, 19:30 / 토, 일, 공휴일 14:00, 19:00 / 월 공연 없음",
        venue: "샤롯데시어터",
        description: "토니상 6관왕 수상작! 아버지로부터 물려받은 구두 공장의 위기를 극복하기 위해, 평범한 청년 찰리와 화려한 드래그퀸 롤라가 만나 세상에 없던 특별한 구두 '킹키부츠'를 만들어가는 이야기. 신디 로퍼 작곡의 감동적인 브로맨스!",
        price: "VIP/OP석 170,000원 / R석 140,000원 / S석 110,000원 / A석 80,000원",
        runtime: "155분 (인터미션 20분)",
        ageLimit: "8세 이상 관람가",
        producer: "CJ ENM, 롯데컬처웍스 주식회사",
        contact: "1588-5212"
    }
}

export default function PerformanceDetailPage() {
    const params = useParams()
    const id = params.id as string

    // ID가 "perf-kinky"로 시작하면 킹키부츠 데이터 사용
    const performanceKey = id.startsWith("perf-kinky") ? "perf-kinky-1" : "perf-1"
    const performance = PERFORMANCES[performanceKey] || PERFORMANCES["perf-1"]

    // 예매하기 링크용 날짜/시간 (킹키부츠 vs 오페라의 유령)
    const bookingDate = id.startsWith("perf-kinky") ? "2026-02-10" : "2024-12-25"
    const bookingTime = id.startsWith("perf-kinky") ? "19:30" : "19:00"

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8 h-full">
                {/* Image Section */}
                <div className="relative aspect-[4/5] md:aspect-auto md:h-[520px] w-full bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                    {performance.image && !performance.image.includes("placeholder") ? (
                        <Image
                            src={performance.image}
                            alt={performance.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-lg">Poster Image</span>
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="flex flex-col h-full md:h-[520px] py-2 overflow-y-auto overflow-x-hidden">
                    <div>
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full mb-3">
                            {performance.genre}
                        </span>
                        <h1 className="text-3xl font-bold mb-1 tracking-tight">{performance.title}</h1>
                        {performance.titleEn && (
                            <p className="text-lg text-gray-500 mb-3">{performance.titleEn}</p>
                        )}
                        <p className="text-muted-foreground leading-relaxed text-sm lg:text-base mb-6">
                            {performance.description}
                        </p>
                    </div>

                    <div className="space-y-3 border-t border-b py-5">
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="text-sm text-gray-500">공연 기간</span>
                                <p className="font-medium">{performance.dateRange}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="text-sm text-gray-500">공연 시간</span>
                                <p className="font-medium text-sm">{performance.schedule}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="text-sm text-gray-500">공연 장소</span>
                                <p className="font-medium">{performance.venue}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Timer className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="text-sm text-gray-500">러닝타임</span>
                                <p className="font-medium">{performance.runtime}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="text-sm text-gray-500">관람연령</span>
                                <p className="font-medium">{performance.ageLimit}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mt-4">
                        <h3 className="font-bold mb-2 text-sm text-gray-700">티켓 가격</h3>
                        <p className="text-sm text-gray-600 font-medium">{performance.price}</p>
                    </div>

                    {performance.producer && (
                        <div className="mt-3 text-sm text-gray-500">
                            <span className="font-medium">제작:</span> {performance.producer}
                        </div>
                    )}

                    {performance.contact && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <Phone className="w-4 h-4" />
                            <span>공연문의: {performance.contact}</span>
                        </div>
                    )}

                    <div className="mt-auto pt-6 pb-4 px-4">
                        <Link href={`/performances/${id}/booking`} className="block">
                            <Button size="lg" className="w-full text-lg h-14 font-bold shadow-lg transition-transform hover:scale-[1.02]">
                                예매하기
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
