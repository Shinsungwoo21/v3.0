import { Section } from './venue';

export interface SeatGrade {
    grade: string;
    price: number;
    color: string;
    description?: string;  // V7.14: 좌석 등급 설명
}

export interface PerformanceSchedule {
    date: string;
    dayOfWeek?: string; // Added for booking page
    times: { time: string; seatCount: number; status?: string; availableSeats?: number }[]; // Extended for booking
}

export interface Performance {
    id: string; // compatibility
    performanceId: string;
    title: string;
    venueId: string;
    venue: string; // Added to match backend response
    posterUrl: string;
    poster?: string;  // V7.14: 호환성 (posterUrl의 별칭)
    dates: string[];
    times: string[];
    dateRange?: string;  // V7.14: 공연 기간 (예: "2026.02.10 ~ 2026.04.30")
    grades: SeatGrade[];
    hasOPSeats?: boolean; // V7.10 Added
    description: string;
    duration: string; // clean name
    runtime: string; // compatibility
    ageRating: string; // clean name
    ageLimit: string; // compatibility
    price: string; // compatibility (display string)
    schedules?: PerformanceSchedule[]; // for booking
    // V7.14: DB 스키마와 일치 (DynamoDB_Schema.md 참조)
    sections?: Section[];  // 좌석 배치 (venues에서 비정규화)
    seatGrades?: SeatGrade[];  // 좌석 등급/가격 (SSOT)
    seatColors?: Record<string, string>;  // 등급별 색상
}
