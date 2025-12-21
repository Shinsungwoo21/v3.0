
export interface Performance {
    id: string;
    title: string;
    venue: string;
    description: string;
    dates: string[]; // YYYY-MM-DD
    times: string[]; // HH:mm
}

export interface SeatInfo {
    grade: string;
    price: number;
}

const PERFORMANCES: Performance[] = [
    {
        id: "perf-1",
        title: "오페라의 유령 (The Phantom of the Opera)",
        venue: "Mega Arts Center",
        description: "전 세계를 매혹시킨 불멸의 명작! 앤드류 로이드 웨버의 걸작.",
        dates: ["2024-12-25", "2024-12-26", "2024-12-27", "2024-12-28"],
        times: ["14:00", "19:00"]
    },
    {
        id: "perf-2",
        title: "레미제라블 (Les Misérables)",
        venue: "Mega Arts Center",
        description: "세계 4대 뮤지컬 중 하나, 빅토르 위고의 소설을 원작으로 한 감동의 대서사시.",
        dates: ["2024-12-30", "2024-12-31"],
        times: ["19:30"]
    }
];

export function getPerformance(performanceId: string): Performance | null {
    return PERFORMANCES.find(p => p.id === performanceId) || null;
}

export function getAllPerformances(): Performance[] {
    return PERFORMANCES;
}

export function getSeatInfo(seatId: string): SeatInfo {
    const [row, numberStr] = seatId.split('-');

    // Default fallback
    if (!row) return { grade: 'Unknown', price: 0 };

    // Grade Logic
    if (['A', 'B'].includes(row)) {
        return { grade: 'VIP', price: 150000 };
    } else if (['C', 'D', 'E'].includes(row)) {
        return { grade: 'R', price: 120000 };
    } else if (['F', 'G', 'H'].includes(row)) {
        return { grade: 'S', price: 90000 };
    } else if (['I', 'J'].includes(row)) {
        return { grade: 'A', price: 60000 };
    }

    return { grade: 'Standard', price: 50000 };
}
