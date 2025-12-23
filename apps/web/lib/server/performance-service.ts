import { getReservationCounts } from './holding-manager';

export interface TimeSlot {
    time: string
    availableSeats: number
    status: "available" | "soldout" | "few"
    cast?: string
}

export interface Schedule {
    date: string
    dayOfWeek: string
    times: TimeSlot[]
}

export interface Performance {
    id: string;
    title: string;
    venue: string;
    description: string;
    dates: string[]; // YYYY-MM-DD
    times: string[]; // HH:mm
    posterUrl?: string; // Legacy
    poster?: string; // New UI uses this
    dateRange?: string; // New UI uses this
    runtime?: string;
    ageLimit?: string;
    price?: string;
    schedules?: Schedule[]; // Added for Booking Page compatibility
}

export interface SeatInfo {
    grade: string;
    price: number;
}

const PERFORMANCES: Performance[] = [
    {
        id: "perf-phantom-of-the-opera-1",
        title: "오페라의 유령 (The Phantom of the Opera)",
        venue: "샤롯데씨어터",
        description: "전 세계를 매혹시킨 불멸의 명작! 브로드웨이 최장기 공연 기네스북 등재. 앤드류 로이드 웨버의 역대급 뮤지컬 넘버와 화려한 무대 연출로 관객들의 마음을 사로잡는 감동의 대서사시.",
        dates: ["2026-02-20", "2026-06-15"],
        times: ["19:30"],
        posterUrl: "/posters/opera-new.png",
        poster: "/posters/opera-new.png",
        dateRange: "2026.02.20 ~ 2026.06.15",
        runtime: "150분 (인터미션 20분)",
        ageLimit: "8세 이상",
        price: "VIP석 150,000원 / R석 120,000원 / S석 90,000원 / A석 60,000원",
        // Schedules generated dynamically in getPerformance
    },
    {
        id: "perf-2",
        title: "레미제라블 (Les Misérables)",
        venue: "Mega Arts Center",
        description: "세계 4대 뮤지컬 중 하나, 빅토르 위고의 소설을 원작으로 한 감동의 대서사시.",
        dates: ["2025-12-30", "2025-12-31"],
        times: ["19:30"]
    },
    {
        id: "perf-kinky-1",
        title: "킹키부츠 (Kinky Boots)",
        venue: "샤롯데시어터",
        description: "토니상 6관왕 수상작! 평범한 청년 찰리와 드래그퀸 롤라가 함께 '킹키부츠'를 만들어가는 감동의 브로맨스.",
        dates: ["2026-02-10", "2026-02-11", "2026-02-14", "2026-02-15", "2026-03-01", "2026-03-15", "2026-04-25", "2026-04-30"],
        times: ["14:00", "14:30", "19:00", "19:30"],
        posterUrl: "/posters/kinky-boots.png",
        poster: "/posters/kinky-boots.png",
        dateRange: "2026.02.10 ~ 2026.04.30",
        runtime: "155분 (인터미션 20분)",
        ageLimit: "8세 이상 관람가",
        price: "OP석 170,000원 / VIP석 170,000원 / R석 140,000원 / S석 110,000원 / A석 80,000원",
        // Schedules generated dynamically in getPerformance
    }
];

export async function getPerformance(performanceId: string): Promise<Performance | null> {
    const perf = PERFORMANCES.find(p => p.id === performanceId);
    if (!perf) return null;

    // Clone and add dynamic schedules
    const result = { ...perf };

    if (performanceId === "perf-phantom-of-the-opera-1") {
        result.schedules = generatePhantomSchedule(performanceId);
    } else if (performanceId === "perf-kinky-1") {
        result.schedules = generateKinkySchedule(performanceId);
    }

    return result;
}

export function getAllPerformances(): Performance[] {
    return PERFORMANCES;
}

export function getSeatInfo(seatId: string): SeatInfo {
    // 새 좌석 ID 형식: "A-1-5" (구역-열-번호)
    const parts = seatId.split('-');

    // 3 parts: "A-1-5" (Section-Row-Number)
    if (parts.length === 3) {
        const [sectionId, rowId, numberStr] = parts;
        const row = parseInt(rowId, 10);

        // 1층 (A, B, C 구역)
        if (['A', 'B', 'C'].includes(sectionId)) {
            if (row <= 10) return { grade: 'VIP', price: 170000 };
            if (row <= 14) return { grade: 'R', price: 140000 };
            if (row <= 17) return { grade: 'S', price: 110000 };
            return { grade: 'A', price: 80000 };
        }

        // 2층 (D, E, F 구역)
        if (['D', 'E', 'F'].includes(sectionId)) {
            if (row <= 5) return { grade: 'R', price: 140000 };
            if (row <= 8) return { grade: 'S', price: 110000 };
            return { grade: 'A', price: 80000 };
        }
    }

    // 4 parts: "1F-A-1-5" (Legacy or explicit format)
    if (parts.length === 4) {
        return { grade: 'R', price: 140000 };
    }

    // Default fallback
    return { grade: 'Standard', price: 80000 };
}


function generatePhantomSchedule(performanceId: string): Schedule[] {
    const startDate = new Date("2026-02-20");
    const endDate = new Date("2026-06-15");
    const schedule: Schedule[] = [];
    const TOTAL_SEATS = 1240; // Updated Charlotte Theater Capacity
    const reservationCounts = getReservationCounts(performanceId);

    let current = new Date(startDate);
    while (current <= endDate) {
        const day = current.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const dateStr = current.toISOString().split('T')[0];
        const dayStr = ["일", "월", "화", "수", "목", "금", "토"][day];

        // Exception: 3/1 No show
        if (current.getMonth() === 2 && current.getDate() === 1) { // Month is 0-indexed (2=March)
            current.setDate(current.getDate() + 1);
            continue;
        }

        let times: TimeSlot[] = [];

        const addTimeSlot = (time: string, baseAvailable: number) => { // baseAvailable unused if real logic applied
            const reserved = reservationCounts[`${dateStr}:${time}`] || 0;
            const available = Math.max(0, TOTAL_SEATS - reserved);
            const status = available === 0 ? "soldout" : available < 10 ? "few" : "available";
            times.push({ time, availableSeats: available, status });
        };

        // Exception: 4/12 (Sun) -> 19:30 only
        if (current.getMonth() === 3 && current.getDate() === 12) {
            addTimeSlot("19:30", 50);
        } else {
            // Standard Rules
            if (day === 1) { // Mon: No show
                // pass
            } else if (day === 2 || day === 4) { // Tue, Thu: 19:30
                addTimeSlot("19:30", 50);
            } else if (day === 3 || day === 5) { // Wed, Fri: 14:30, 19:30
                addTimeSlot("14:30", 30);
                addTimeSlot("19:30", 50);
            } else if (day === 6) { // Sat: 14:00, 19:00
                addTimeSlot("14:00", 20);
                addTimeSlot("19:00", 25);
            } else if (day === 0) { // Sun: 15:00
                addTimeSlot("15:00", 40);
            }
        }

        if (times.length > 0) {
            schedule.push({
                date: dateStr,
                dayOfWeek: dayStr,
                times: times
            });
        }

        current.setDate(current.getDate() + 1);
    }
    return schedule;
}

function generateKinkySchedule(performanceId: string): Schedule[] {
    const startDate = new Date("2026-02-10");
    const endDate = new Date("2026-04-30");
    const schedule: Schedule[] = [];
    const TOTAL_SEATS = 1240; // Updated Charlotte Theater Capacity
    const reservationCounts = getReservationCounts(performanceId);

    // Cast Pools
    const charlie = ["김호영", "이석훈", "김성규", "신재범"];
    const lola = ["최재림", "강홍석", "서경수"];
    const lauren = ["김환희", "나하나"];
    const don = ["고창석", "심재현"]; // Example names

    let dayIndex = 0;

    let current = new Date(startDate);
    while (current <= endDate) {
        const day = current.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const dateStr = current.toISOString().split('T')[0];
        const dayStr = ["일", "월", "화", "수", "목", "금", "토"][day];

        let times: TimeSlot[] = [];

        // Casting Logic (Round Robin)
        const getCast = (idx: number) => {
            return `찰리:${charlie[idx % charlie.length]}, 롤라:${lola[idx % lola.length]}, 로렌:${lauren[idx % lauren.length]}`;
        };

        const addTimeSlot = (time: string, castIdx: number) => {
            const reserved = reservationCounts[`${dateStr}:${time}`] || 0;
            const available = Math.max(0, TOTAL_SEATS - reserved);
            const status = available === 0 ? "soldout" : available < 10 ? "few" : "available";
            times.push({ time, availableSeats: available, status, cast: getCast(castIdx) });
        };


        if (day === 1) { // Mon: No show
            // pass
        } else if (day === 2 || day === 4 || day === 5) { // Tue, Thu, Fri: 19:30 (Fri also sometimes 14:30 but simplifying)
            addTimeSlot("19:30", dayIndex);
        } else if (day === 3) { // Wed: 14:30, 19:30
            addTimeSlot("14:30", dayIndex);
            addTimeSlot("19:30", dayIndex + 1);
        } else if (day === 6 || day === 0) { // Sat, Sun: 14:00, 19:00
            addTimeSlot("14:00", dayIndex);
            addTimeSlot("19:00", dayIndex + 1);
        }

        if (times.length > 0) {
            schedule.push({
                date: dateStr,
                dayOfWeek: dayStr,
                times: times
            });
            dayIndex++;
        }

        current.setDate(current.getDate() + 1);
    }
    return schedule;
}
