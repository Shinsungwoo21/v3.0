import { getAllPerformances, getPerformance, getVenue } from '../server/performance-service';

export async function getPerformances(input: any) {
    try {
        const performances = await getAllPerformances();
        // [V8.2] 디버그 로그
        console.log('[PERFORMANCE_DEBUG] Count:', performances.length);
        console.log('[PERFORMANCE_DEBUG] Titles:', performances.map(p => p.title));
        return {
            count: performances.length,
            performances: performances.map(p => ({
                id: p.id,
                title: p.title,
                venue: p.venue,
                dates: p.dateRange || (Array.isArray(p.dates) ? p.dates.join(', ') : String(p.dates || '날짜 미정')),
                posterUrl: p.posterUrl
            })),
            message: `현재 예매 가능한 공연은 총 ${performances.length}개입니다.`
        };
    } catch (e: any) {
        console.error("Error fetching performances:", e);
        return { error: "공연 목록을 불러오는 중 오류가 발생했습니다." };
    }
}

export async function getPerformanceDetails(input: any) {
    const { performanceId } = input;
    try {
        const perf = await getPerformance(performanceId);
        // [V8.2] 디버그 로그
        console.log('[PERF_DETAIL_DEBUG] performanceId:', performanceId);
        console.log('[PERF_DETAIL_DEBUG] Found:', perf?.title || 'NOT FOUND');
        if (!perf) {
            return { error: "해당 공연을 찾을 수 없습니다." };
        }
        // V7.10.2: cast 정보는 DB 스키마에 있을 수 있음 (dynamic field)
        const perfAny = perf as any;
        return {
            id: perf.id,
            title: perf.title,
            venue: perf.venue,
            description: perf.description,
            dateRange: perf.dateRange || (Array.isArray(perf.dates) ? perf.dates.join(' ~ ') : String(perf.dates || '기간 정보 없음')),
            schedules: perf.schedules?.slice(0, 5), // Basic fallback
            price: perf.price,
            runtime: perf.runtime,
            ageLimit: perf.ageLimit,
            // [V7.10.2] 캐스팅 정보 추가 (DB에서 가져온 cast 필드 사용)
            cast: perfAny.cast || perfAny.casting || [],
            message: `[${perf.title}] 상세 정보입니다.\n장소: ${perf.venue}\n기간: ${perf.dateRange || '정보 없음'}\n가격: ${perf.price}\n캐스팅: ${Array.isArray(perfAny.cast || perfAny.casting) ? (perfAny.cast || perfAny.casting).join(', ') : '정보 없음'}`
        };
    } catch (e: any) {
        return { error: "공연 정보를 불러오는 중 오류가 발생했습니다." };
    }
}

export async function getVenueInfo(input: any) {
    const { venueId, performanceId } = input;

    // 1. Try to get info from Performance (preferred source for sections/seat map)
    if (performanceId) {
        try {
            const perf = await getPerformance(performanceId);
            if (perf) {
                // [V7.12] Fetch actual venue data for totalSeats
                let actualVenue = null;
                if (perf.venueId) {
                    actualVenue = await getVenue(perf.venueId);
                }

                // [V7.12] sections에서 층별 좌석 수 동적 계산 (SSOT)
                const sections = perf.sections || actualVenue?.sections || [];
                let floor1Seats = 0;
                let floor2Seats = 0;
                sections.forEach((sec: any) => {
                    const floorSeats = (sec.rows || []).reduce((acc: number, row: any) =>
                        acc + (row.seats?.length || 0), 0);
                    if (sec.floor === '1층') floor1Seats += floorSeats;
                    else floor2Seats += floorSeats;
                });
                const calculatedTotal = floor1Seats + floor2Seats;
                const totalSeats = actualVenue?.totalSeats || calculatedTotal;

                return {
                    success: true,
                    venue: {
                        id: perf.venueId || 'unknown',
                        name: perf.venue || 'Unknown Venue',
                        totalSeats: totalSeats,
                        floor1Seats: floor1Seats,
                        floor2Seats: floor2Seats,
                        sections: sections
                    },
                    message: `🏛️ **${perf.venue}** 정보입니다.\n• 총 좌석: **${totalSeats.toLocaleString()}석**\n• 1층: ${floor1Seats.toLocaleString()}석\n• 2층: ${floor2Seats.toLocaleString()}석`
                };
            }
        } catch (e) {
            console.error("Error fetching performance for venue info:", e);
        }
    }


    // 2. Fallback to Venue DB (Might lack sections now)
    if (venueId) {
        try {
            const venue = await getVenue(venueId);
            if (venue) {
                return {
                    success: true,
                    venue: venue,
                    message: `${venue.name} 정보입니다. (구역 정보가 없을 수 있습니다)`
                };
            }
        } catch (e) {
            console.error("Error fetching venue:", e);
        }
    }

    return {
        success: false,
        error: "공연장 정보를 찾을 수 없습니다. performanceId 또는 유효한 venueId를 입력해주세요."
    };
}
