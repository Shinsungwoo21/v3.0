import { getPerformanceSchedules as getSchedulesService } from "../server/performance-service";

interface GetSchedulesParams {
    performanceId: string;
    fromDate?: string;      // 기본값: 오늘
    preferWeekend?: boolean; // 주말 우선
    limit?: number;         // 기본값: 5
}

export async function getPerformanceSchedules(params: GetSchedulesParams) {
    const fromDate = params.fromDate || new Date().toISOString().split('T')[0];
    const limit = Math.min(params.limit || 10, 30); // [V8.4] limit increased to 30 to show more schedules

    // [V8.2] 비용 최적화: DB 직접 조회 대신 캐시가 적용된 서비스 함수 사용
    // 서비스 함수는 전체 스케줄을 캐싱된 상태로 반환하며, 날짜순 정렬도 이미 되어 있음
    // [V8.4] DB Query 최적화를 위해 fromDate 전달
    let allGroupedSchedules = await getSchedulesService(params.performanceId, fromDate);

    // 날짜 필터링 (fromDate 이후)
    let filteredGroupedSchedules = allGroupedSchedules.filter(s => s.date >= fromDate);

    // 서비스 함수 결과는 날짜별로 그룹핑된 형태이므로, 개별 회차(시간 단위)로 평탄화
    let flattenedSchedules: any[] = [];
    for (const daySchedule of filteredGroupedSchedules) {
        // [V8.4] 시간순 정렬 보장
        const sortedTimes = (daySchedule.times || []).sort((a, b) => a.time.localeCompare(b.time));
        for (const timeSlot of sortedTimes) {
            flattenedSchedules.push({
                ...timeSlot,
                date: daySchedule.date,
                dayOfWeek: daySchedule.dayOfWeek,
                datetime: `${daySchedule.date}T${timeSlot.time}:00`, // datetime 필드 추가
            });
        }
    }

    // 주말 우선 필터링 (토/일)
    if (params.preferWeekend) {
        const weekendSchedules = flattenedSchedules.filter(s =>
            ['토', '일'].includes(s.dayOfWeek)
        );
        // 주말이 있으면 주말만, 없으면 전체
        if (weekendSchedules.length > 0) {
            flattenedSchedules = weekendSchedules;
        }
    }

    // 반환 형식 매핑
    const finalSchedules = flattenedSchedules.slice(0, limit).map(s => {
        const hour = parseInt(s.time.split(':')[0]);
        let timeLabel = '🎭 평일';
        if (hour >= 10 && hour < 15) timeLabel = '☀️ 마티네';
        else if (hour >= 17 && hour <= 21) timeLabel = '🌙 소야';

        timeLabel = `${timeLabel} (${s.time})`;

        const [year, month, day] = s.date.split('-');
        const formattedDate = `${year}년 ${parseInt(month)}월 ${parseInt(day)}일 (${s.dayOfWeek})`;

        return {
            scheduleId: s.scheduleId,        // perf-kinky-1-2026-02-10-19:30
            performanceId: s.performanceId,  // perf-kinky-1
            date: s.date,                    // 2026-02-10
            formattedDate,                   // [V7.10] 2026년 2월 10일 (화)
            time: s.time,                    // 19:30
            timeLabel,                       // [V7.10] 🌙 소야
            datetime: s.datetime,            // 2026-02-10T19:30:00
            dayOfWeek: s.dayOfWeek,          // 화
            status: s.status,                // AVAILABLE
            availableSeats: s.availableSeats, // 1240
            totalSeats: s.totalSeats,        // 1240
            casting: s.casting || null,  // 회차별 캐스팅 정보
        };
    });

    return {
        schedules: finalSchedules,
        count: flattenedSchedules.length,
        hasMore: flattenedSchedules.length > limit,
    };
}
