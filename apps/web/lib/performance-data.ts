
export interface TimeSlot {
    time: string
    availableSeats: number
    status: "available" | "soldout" | "few"
}

export interface Schedule {
    date: string
    dayOfWeek: string
    times: TimeSlot[]
}

export interface PerformanceData {
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
    poster: string // Added poster field to match usage in BookingPage
    producer?: string
    contact?: string
    schedules: Schedule[]
}

export const PERFORMANCES: Record<string, PerformanceData> = {
    "perf-kinky-1": {
        id: "perf-kinky-1",
        title: "킹키부츠",
        titleEn: "Kinky Boots",
        genre: "뮤지컬",
        image: "/posters/kinky-boots.png",
        poster: "/posters/kinky-boots.png",
        dateRange: "2026.02.10 ~ 2026.04.30",
        schedule: "화, 목, 금 19:30 / 수 14:30, 19:30 / 토, 일, 공휴일 14:00, 19:00 / 월 공연 없음",
        venue: "샤롯데시어터",
        description: "토니상 6관왕 수상작! 아버지로부터 물려받은 구두 공장의 위기를 극복하기 위해, 평범한 청년 찰리와 화려한 드래그퀸 롤라가 만나 세상에 없던 특별한 구두 '킹키부츠'를 만들어가는 이야기. 신디 로퍼 작곡의 감동적인 브로맨스!",
        price: "VIP/OP석 170,000원 / R석 140,000원 / S석 110,000원 / A석 80,000원",
        runtime: "155분 (인터미션 20분)",
        ageLimit: "8세 이상 관람가",
        producer: "CJ ENM, 롯데컬처웍스 주식회사",
        contact: "1588-5212",
        schedules: [
            // 2월
            { date: "2026-02-10", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 45, status: "available" }] },
            { date: "2026-02-11", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 12, status: "few" }, { time: "19:30", availableSeats: 38, status: "available" }] },
            { date: "2026-02-12", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 52, status: "available" }] },
            { date: "2026-02-13", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 28, status: "available" }] },
            { date: "2026-02-14", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 0, status: "soldout" }, { time: "19:00", availableSeats: 8, status: "few" }] },
            { date: "2026-02-15", dayOfWeek: "일", times: [{ time: "14:00", availableSeats: 35, status: "available" }, { time: "19:00", availableSeats: 42, status: "available" }] },
            { date: "2026-02-17", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 60, status: "available" }] },
            { date: "2026-02-18", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 25, status: "available" }, { time: "19:30", availableSeats: 55, status: "available" }] },
            { date: "2026-02-19", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 48, status: "available" }] },
            { date: "2026-02-20", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 32, status: "available" }] },
            { date: "2026-02-21", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 18, status: "available" }, { time: "19:00", availableSeats: 22, status: "available" }] },
            { date: "2026-02-22", dayOfWeek: "일", times: [{ time: "14:00", availableSeats: 40, status: "available" }, { time: "19:00", availableSeats: 35, status: "available" }] },
            { date: "2026-02-24", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 55, status: "available" }] },
            { date: "2026-02-25", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 30, status: "available" }, { time: "19:30", availableSeats: 45, status: "available" }] },
            { date: "2026-02-26", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 50, status: "available" }] },
            { date: "2026-02-27", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 38, status: "available" }] },
            { date: "2026-02-28", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 20, status: "available" }, { time: "19:00", availableSeats: 25, status: "available" }] },
            // 3월
            { date: "2026-03-01", dayOfWeek: "일", times: [{ time: "14:00", availableSeats: 0, status: "soldout" }, { time: "19:00", availableSeats: 5, status: "few" }] },
            { date: "2026-03-03", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 60, status: "available" }] },
            { date: "2026-03-04", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 45, status: "available" }, { time: "19:30", availableSeats: 50, status: "available" }] },
            { date: "2026-03-05", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 55, status: "available" }] },
            { date: "2026-03-06", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 42, status: "available" }] },
            { date: "2026-03-07", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 28, status: "available" }, { time: "19:00", availableSeats: 35, status: "available" }] },
            { date: "2026-03-08", dayOfWeek: "일", times: [{ time: "14:00", availableSeats: 32, status: "available" }, { time: "19:00", availableSeats: 40, status: "available" }] },
            { date: "2026-03-10", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 58, status: "available" }] },
            { date: "2026-03-11", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 40, status: "available" }, { time: "19:30", availableSeats: 48, status: "available" }] },
            { date: "2026-03-12", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 52, status: "available" }] },
            { date: "2026-03-13", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 45, status: "available" }] },
            { date: "2026-03-14", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 15, status: "few" }, { time: "19:00", availableSeats: 22, status: "available" }] },
            { date: "2026-03-15", dayOfWeek: "일", times: [{ time: "14:00", availableSeats: 38, status: "available" }, { time: "19:00", availableSeats: 42, status: "available" }] },
            { date: "2026-03-17", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 55, status: "available" }] },
            { date: "2026-03-18", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 35, status: "available" }, { time: "19:30", availableSeats: 45, status: "available" }] },
            { date: "2026-03-19", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 50, status: "available" }] },
            { date: "2026-03-20", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 40, status: "available" }] },
            { date: "2026-03-21", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 25, status: "available" }, { time: "19:00", availableSeats: 30, status: "available" }] },
            { date: "2026-03-22", dayOfWeek: "일", times: [{ time: "14:00", availableSeats: 35, status: "available" }, { time: "19:00", availableSeats: 38, status: "available" }] },
            { date: "2026-03-24", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 52, status: "available" }] },
            { date: "2026-03-25", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 30, status: "available" }, { time: "19:30", availableSeats: 42, status: "available" }] },
            { date: "2026-03-26", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 48, status: "available" }] },
            { date: "2026-03-27", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 35, status: "available" }] },
            { date: "2026-03-28", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 20, status: "available" }, { time: "19:00", availableSeats: 28, status: "available" }] },
            { date: "2026-03-29", dayOfWeek: "일", times: [{ time: "14:00", availableSeats: 30, status: "available" }, { time: "19:00", availableSeats: 35, status: "available" }] },
            { date: "2026-03-31", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 50, status: "available" }] },
            // 4월
            { date: "2026-04-01", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 40, status: "available" }, { time: "19:30", availableSeats: 45, status: "available" }] },
            { date: "2026-04-02", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 55, status: "available" }] },
            { date: "2026-04-03", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 42, status: "available" }] },
            { date: "2026-04-04", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 22, status: "available" }, { time: "19:00", availableSeats: 30, status: "available" }] },
            { date: "2026-04-05", dayOfWeek: "일", times: [{ time: "14:00", availableSeats: 35, status: "available" }, { time: "19:00", availableSeats: 40, status: "available" }] },
            { date: "2026-04-07", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 58, status: "available" }] },
            { date: "2026-04-08", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 38, status: "available" }, { time: "19:30", availableSeats: 48, status: "available" }] },
            { date: "2026-04-09", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 52, status: "available" }] },
            { date: "2026-04-10", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 45, status: "available" }] },
            { date: "2026-04-11", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 18, status: "available" }, { time: "19:00", availableSeats: 25, status: "available" }] },
            { date: "2026-04-12", dayOfWeek: "일", times: [{ time: "14:00", availableSeats: 32, status: "available" }, { time: "19:00", availableSeats: 38, status: "available" }] },
            { date: "2026-04-14", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 55, status: "available" }] },
            { date: "2026-04-15", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 35, status: "available" }, { time: "19:30", availableSeats: 45, status: "available" }] },
            { date: "2026-04-16", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 50, status: "available" }] },
            { date: "2026-04-17", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 40, status: "available" }] },
            { date: "2026-04-18", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 15, status: "few" }, { time: "19:00", availableSeats: 20, status: "available" }] },
            { date: "2026-04-19", dayOfWeek: "일", times: [{ time: "14:00", availableSeats: 28, status: "available" }, { time: "19:00", availableSeats: 35, status: "available" }] },
            { date: "2026-04-21", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 52, status: "available" }] },
            { date: "2026-04-22", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 30, status: "available" }, { time: "19:30", availableSeats: 42, status: "available" }] },
            { date: "2026-04-23", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 48, status: "available" }] },
            { date: "2026-04-24", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 35, status: "available" }] },
            { date: "2026-04-25", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 10, status: "few" }, { time: "19:00", availableSeats: 15, status: "few" }] },
            { date: "2026-04-26", dayOfWeek: "일", times: [{ time: "14:00", availableSeats: 22, status: "available" }, { time: "19:00", availableSeats: 28, status: "available" }] },
            { date: "2026-04-28", dayOfWeek: "화", times: [{ time: "19:30", availableSeats: 45, status: "available" }] },
            { date: "2026-04-29", dayOfWeek: "수", times: [{ time: "14:30", availableSeats: 25, status: "available" }, { time: "19:30", availableSeats: 35, status: "available" }] },
            { date: "2026-04-30", dayOfWeek: "목", times: [{ time: "14:00", availableSeats: 8, status: "few" }, { time: "19:30", availableSeats: 12, status: "few" }] },
        ]
    },
    "perf-1": {
        id: "perf-1",
        title: "오페라의 유령",
        titleEn: "The Phantom of the Opera",
        genre: "뮤지컬",
        image: "/posters/opera.png",
        poster: "/posters/opera.png",
        dateRange: "2024.12.01 ~ 2025.03.31",
        schedule: "화~금 19:30 / 토 14:00, 19:00 / 일 14:00, 18:00",
        venue: "샤롯데씨어터",
        description: "전 세계를 매혹시킨 불멸의 명작! 브로드웨이 최장기 공연 기네스북 등재. 앤드류 로이드 웨버의 역대급 뮤지컬 넘버와 화려한 무대 연출로 관객들의 마음을 사로잡는 감동의 대서사시.",
        price: "VIP석 150,000원 / R석 120,000원 / S석 90,000원 / A석 60,000원",
        runtime: "150분 (인터미션 20분)",
        ageLimit: "8세 이상",
        producer: "S&CO",
        contact: "1588-5212",
        schedules: [
            { date: "2024-12-24", dayOfWeek: "화", times: [{ time: "14:00", availableSeats: 20, status: "available" }, { time: "19:30", availableSeats: 35, status: "available" }] },
            { date: "2024-12-25", dayOfWeek: "수", times: [{ time: "14:00", availableSeats: 0, status: "soldout" }, { time: "19:00", availableSeats: 15, status: "few" }] },
            { date: "2024-12-26", dayOfWeek: "목", times: [{ time: "19:30", availableSeats: 45, status: "available" }] },
            { date: "2024-12-27", dayOfWeek: "금", times: [{ time: "19:30", availableSeats: 38, status: "available" }] },
            { date: "2024-12-28", dayOfWeek: "토", times: [{ time: "14:00", availableSeats: 12, status: "few" }, { time: "19:00", availableSeats: 28, status: "available" }] },
        ]
    }
}
