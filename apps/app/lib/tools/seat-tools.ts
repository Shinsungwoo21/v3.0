
import { getSeatStatusMap } from '../server/holding-manager';
import { getPerformance, getSchedule, getVenue, getSeatInfo } from '../server/performance-service';
import { calculateGlobalSeatNumber } from '@mega-ticket/shared-types';

export async function getAvailableSeats(input: any) {
    let { performanceId, date, time, scheduleId, grade: requestedGrade, count } = input;
    const groupSize = count; // map count to existing groupSize logic

    console.log('[SEATS] get_available_seats called:', { performanceId, scheduleId, requestedGrade, count });

    // [V8.10] 디버그 로깅 추가
    console.log('[getAvailableSeats] 호출됨:', {
        performanceId,
        scheduleId,
        requestedGrade,
        count,
        timestamp: new Date().toISOString()
    });

    if (!performanceId || !scheduleId) return { error: "공연 ID와 회차 ID가 필요합니다." };

    // [V7.9.3.1] 인원수 방어 로직 (STEP 3 복귀 유도)
    if (!groupSize || groupSize < 1) {
        return {
            success: false,
            errorCode: "MISSING_COUNT",
            message: "몇 명이서 관람하실 예정인가요? 인원 수를 알려주시면 정확한 좌석을 추천해 드릴 수 있습니다.",
            nextStep: "STEP_3"
        };
    }

    // [V7.13] scheduleId에서 date/time 추출
    if (scheduleId && (!date || !time)) {
        const schedule = await getSchedule(scheduleId);
        if (schedule) {
            date = schedule.date;
            time = schedule.times?.[0]?.time || time;
        }

        // scheduleId 파싱 fallback
        if (!date || !time) {
            const parts = scheduleId.split('-');

            // [V8.14 FIX] 새 형식 (perf-kinky-1-2026-02-10-19:30) 지원
            // parts: ["perf", "kinky", "1", "2026", "02", "10", "19:30"] (length: 7)
            if (parts.length >= 7 && parts[3].length === 4) {
                date = `${parts[3]}-${parts[4]}-${parts[5]}`;
                time = parts[6];
            }
            // 레거시 형식 (sch-kinky-20260210-1930) 지원
            // parts: ["sch", "kinky", "20260210", "1930"] (length: 4)
            else if (parts.length === 4 && parts[2].length === 8) {
                const dateStr = parts[2]; // 20260210
                const timeStr = parts[3]; // 1930
                date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
                time = `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`;
            }
        }
    }

    console.log('[SEATS] Resolved date/time:', { date, time });

    const statusMap = await getSeatStatusMap(performanceId, date, time);


    // [Issue 4] DB Single Source of Truth: Remove hardcoded gradeInfo
    // Initialize gradeInfo structure dynamically
    const gradeInfo: Record<string, { price: number; seats: string[] }> = {};

    // V7.7: Fetch Performance to get sections and seatGrades
    const perf = await getPerformance(performanceId);

    // [V8.14 FIX] 에러 핸들링 추가
    if (!perf) {
        return {
            error: `공연 정보를 찾을 수 없습니다. (performanceId: ${performanceId})`,
            errorCode: "PERFORMANCE_NOT_FOUND"
        };
    }

    const seatGrades = perf.seatGrades || [];

    // [V7.13] sections fallback
    // perf가 존재하므로 perf.sections 안전하게 접근
    let sections = perf.sections || [];
    if (sections.length === 0 && perf.venueId) {
        console.log('[SEATS] sections empty in perf, fetching from venue:', perf.venueId);
        const venue = await getVenue(perf.venueId);
        sections = venue?.sections || [];
    }

    console.log('[SEATS] Performance loaded:', {
        title: perf?.title,
        sectionsCount: sections.length,
        gradesCount: seatGrades.length
    });

    const priceMap = new Map<string, number>();
    if (Array.isArray(seatGrades)) {
        seatGrades.forEach(g => priceMap.set(g.grade, g.price || 0));
    }


    // [V7.13] OP석 활성화 여부 확인
    const hasOPSeats = (perf as any)?.hasOPSeats ?? true;
    console.log('[SEATS] hasOPSeats:', hasOPSeats);

    // [V8.10] 등급 정규화 Helper
    const normalizeGrade = (g: string) => {
        if (!g) return null;
        const lower = g.toLowerCase().trim();
        const map: Record<string, string> = {
            'vip': 'VIP', 'vip석': 'VIP', 'vip좌석': 'VIP',
            'op': 'OP', 'op석': 'OP', '최전방': 'OP',
            'r': 'R', 'r석': 'R',
            's': 'S', 's석': 'S',
            'a': 'A', 'a석': 'A'
        };
        // 맵에 없으면 "석" 제거 후 대문자 변환
        return map[lower] || g.replace(/석$/, '').toUpperCase();
    };

    const targetGrade = requestedGrade ? normalizeGrade(requestedGrade) : null;
    console.log(`[getAvailableSeats] requestedGrade="${requestedGrade}" -> targetGrade="${targetGrade}"`);

    // [V8.11 FIX] statusMap이 비어있을 때 모든 좌석을 available로 처리하기 위해
    // statusMap 순회 대신 전체 좌석 목록(allSeatIds)을 먼저 생성하고 필터링하는 방식으로 변경
    const allSeatIds: string[] = [];

    // sections에서 모든 좌석 ID 생성
    sections.forEach((section: any) => {
        const floor = section.floor || '1층';
        const sectionId = section.sectionId || section.id;
        const rows = section.rows || [];

        rows.forEach((row: any) => {
            const rowId = row.rowId || row.row;
            const seats = row.seats || [];

            // seats 배열이 있으면 사용 (우선)
            if (seats && seats.length > 0) {
                seats.forEach((seat: any) => {
                    // seatId가 이미 있으면 사용, 없으면 조합
                    if (seat.seatId) {
                        allSeatIds.push(seat.seatId);
                    } else {
                        const seatNum = seat.seatNumber || seat.number;
                        allSeatIds.push(`${floor}-${sectionId}-${rowId}-${seatNum}`);
                    }
                });
            }
            // seats 배열 없이 length만 있는 경우 (fallback)
            else if (row.length) {
                for (let i = 1; i <= row.length; i++) {
                    allSeatIds.push(`${floor}-${sectionId}-${rowId}-${i}`);
                }
            }
        });
    });

    console.log('[SEATS] 전체 좌석 생성(allSeatIds):', allSeatIds.length);

    // available 좌석만 gradeInfo에 추가
    // statusMap에 없으면(undefined) -> 예약없음 -> available로 간주
    allSeatIds
        .filter(seatId => !statusMap[seatId] || statusMap[seatId] === 'available')
        .forEach(seatId => {
            const parts = seatId.split('-');
            const rowId = parts.length >= 3 ? parts[2] : '';

            // [V7.13] OP열 좌석 필터링 (hasOPSeats=false면 제외)
            if (rowId === 'OP' && !hasOPSeats) {
                return; // OP열 제외
            }

            const { grade } = getSeatInfo(seatId, sections); // Dynamic Grade

            // [V8.10] 강력한 등급 필터링 방어 로직
            // VIP 요청 시 OP 좌석이 섞여 들어가는 것 방지
            if (targetGrade === 'VIP' && grade === 'OP') {
                // Skip OP seat if VIP specifically requested
                return;
            }

            const price = priceMap.get(grade) || 0;

            if (!gradeInfo[grade]) {
                gradeInfo[grade] = { price, seats: [] };
            }
            gradeInfo[grade].seats.push(seatId);
        });

    console.log('[SEATS] gradeInfo 결과:', {
        grades: Object.keys(gradeInfo),
        vipSeats: gradeInfo['VIP']?.seats.length || 0,
        totalAvailable: Object.values(gradeInfo).reduce((acc, info) => acc + info.seats.length, 0)
    });

    // [DEBUG] B구역 VIP석 좌석 샘플 확인
    const vipSeats = gradeInfo['VIP']?.seats || [];
    const bSectionVIPSeats = vipSeats.filter((s: string) => s.includes('-B-')).slice(0, 10);
    console.log('[SEATS DEBUG] B구역 VIP석 샘플 (처음 10개):', bSectionVIPSeats);


    // Summary string for Bot
    // Sort roughly by price (desc) if possible, or just standard order
    const standardOrder = ['OP', 'VIP', 'R', 'S', 'A'];
    const sortedGrades = Object.keys(gradeInfo).sort((a, b) => {
        const idxA = standardOrder.indexOf(a);
        const idxB = standardOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return 0;
    });

    const summary = sortedGrades
        .map(grade => `${grade}석 ${gradeInfo[grade].price.toLocaleString()}원 (${gradeInfo[grade].seats.length}석)`)
        .join(', ');

    const totalAvailable = Object.values(gradeInfo).reduce((acc, info) => acc + info.seats.length, 0);

    // 등급별 추천 좌석 (요청된 인원 수만큼 연속된 좌석)
    const recommendations: Record<string, Array<{ seats: string[], formatted: string, label: string }>> = {};
    const targetCount = groupSize && groupSize > 0 ? groupSize : 1; // Default to 1
    const gradeOptionsCounts: Record<string, number> = {}; // [V8.19] 전체 옵션 수 저장

    const gradesToRecommend = targetGrade
        ? sortedGrades.filter(g => normalizeGrade(g) === targetGrade)
        : sortedGrades;

    console.log('[getAvailableSeats] 필터링 결과:', {
        availableGrades: sortedGrades,
        targetGrade,
        gradesToRecommend
    });

    gradesToRecommend.forEach(grade => {
        if (gradeInfo[grade].seats.length >= targetCount) {
            // [V8.9] 좌석 추천 다양화 로직 적용
            // 기존: B구역 앞열부터 순서대로 3개 추천 → 문제: B구역만 추천됨
            // 개선: 모든 가능한 연속석(Chunk)을 찾은 후 스코어링 → 구역별(A/B/C) 베스트 선정

            const seats = gradeInfo[grade].seats;
            const seatsByRow: Record<string, string[]> = {};
            seats.forEach(seatId => {
                const parts = seatId.split('-');
                if (parts.length === 4) {
                    const key = `${parts[0]}-${parts[1]}-${parts[2]}`;
                    if (!seatsByRow[key]) seatsByRow[key] = [];
                    seatsByRow[key].push(seatId);
                }
            });

            interface SeatChunk {
                seats: string[];
                section: string;
                rowNum: number;
                centerNum: number; // 청크의 중심 번호
                score: number;
            }

            const allChunks: SeatChunk[] = [];

            // 1. 모든 row에 대해 가능한 chunk 찾기
            Object.keys(seatsByRow).forEach(key => {
                const [floor, section, row] = key.split('-');
                const rowNum = row === 'OP' ? 0 : parseInt(row);

                const rowSeats = seatsByRow[key];
                // 번호순 정렬
                const sorted = rowSeats.sort((a, b) => parseInt(a.split('-')[3]) - parseInt(b.split('-')[3]));

                // [V8.13] 글로벌 번호 변환을 위한 sections 필터링
                const floorSections = sections.filter((s: any) => s.floor === floor);

                for (let i = 0; i <= sorted.length - targetCount; i++) {
                    const chunk = sorted.slice(i, i + targetCount);
                    const localNums = chunk.map(s => parseInt(s.split('-')[3]));

                    // 연속성 검사 (로컬 번호 기준)
                    let isConsecutive = true;
                    for (let j = 1; j < localNums.length; j++) {
                        if (localNums[j] !== localNums[j - 1] + 1) { isConsecutive = false; break; }
                    }

                    if (isConsecutive) {
                        // [V8.13 FIX] 글로벌 번호로 변환하여 정중앙 판단
                        const globalNums = localNums.map(n =>
                            calculateGlobalSeatNumber(section, row, n, floorSections, floor)
                        );
                        const avgGlobalNum = globalNums.reduce((a, b) => a + b, 0) / globalNums.length;

                        // [Scoring Logic V8.16] 층/구역별 정밀 스코어링
                        const rowScore = 100 - rowNum;

                        // 층별 구역 설정 (SSOT: Venues DB 권장, 현재는 하드코딩)
                        const sectionConfigByFloor: Record<string, Record<string, { min: number; max: number; centerType: 'middle' | 'high' | 'low'; idealCenter?: number; idealRange?: { start: number; end: number } }>> = {
                            '1층': {
                                'A': { min: 1, max: 12, centerType: 'high' },   // 오른쪽(큰 번호)이 무대 방향
                                'B': {
                                    min: 13, max: 26,
                                    centerType: 'middle',
                                    idealCenter: 19.5,
                                    idealRange: { start: 18, end: 21 }
                                },
                                'C': { min: 27, max: 38, centerType: 'low' },   // 왼쪽(작은 번호)이 무대 방향
                            },
                            '2층': {
                                // [V8.20 FIX] 프롬프트(실제) 데이터 기준 동기화
                                'D': { min: 1, max: 13, centerType: 'high' },   // 좌측: 번호 클수록 중앙
                                'E': {
                                    min: 14, max: 26,
                                    centerType: 'middle',
                                    idealCenter: 20,
                                    idealRange: { start: 18, end: 21 }
                                },
                                'F': { min: 27, max: 39, centerType: 'low' }     // 우측: 번호 작을수록 중앙 (대칭 추정)
                            }
                        };

                        const floorConfig = sectionConfigByFloor[floor] || sectionConfigByFloor['1층'];
                        let config = floorConfig[section];

                        // [V8.20] OP석 특별 스코어링 (사용자 요청: 5~8번이 중앙)
                        if (row === 'OP' && section === 'B') {
                            config = {
                                min: 1,
                                max: 12,
                                centerType: 'middle',
                                idealCenter: 6.5,
                                idealRange: { start: 5, end: 8 }
                            };
                        }

                        let centerBonus = 0;

                        if (config) {
                            const { min, max, centerType, idealCenter, idealRange } = config;

                            // 1. 중앙 구역 (B, E)
                            if (centerType === 'middle' && idealRange && idealCenter) {
                                // 정중앙 범위(idealRange)에 포함된 좌석 수 계산
                                const centerSeats = globalNums.filter(
                                    n => n >= idealRange.start && n <= idealRange.end
                                );

                                if (centerSeats.length === globalNums.length) {
                                    // 좌석 전체가 정중앙 범위 내 (BEST)
                                    centerBonus = 80;
                                } else if (centerSeats.length > 0) {
                                    // 일부만 걸친 경우 (비율에 따라 점수 부여)
                                    centerBonus = 30 + (centerSeats.length / globalNums.length) * 40;
                                }

                                // 2. 평균 위치 점수 (idealCenter와 가까울수록 추가 보너스)
                                // 거리가 0이면 +20점, 멀어질수록 감점
                                const distanceFromIdeal = Math.abs(avgGlobalNum - idealCenter);
                                const proximityScore = Math.max(0, 20 - distanceFromIdeal * 3);
                                centerBonus += proximityScore;
                            }
                            // 2. 사이드 구역 - 오른쪽이 무대 (A, D) -> High Number Good
                            else if (centerType === 'high') {
                                // (현재 - min) / (max - min) -> 1에 가까울수록(max쪽) 좋음
                                const ratio = (avgGlobalNum - min) / (max - min);
                                // 범위 밖(음수 등) 방어 로직
                                const safeRatio = Math.max(0, Math.min(1, ratio));
                                centerBonus = safeRatio * 60;
                            }
                            // 3. 사이드 구역 - 왼쪽이 무대 (C, F) -> Low Number Good
                            else if (centerType === 'low') {
                                // (max - 현재) / (max - min) -> 1에 가까울수록(min쪽) 좋음
                                const ratio = (max - avgGlobalNum) / (max - min);
                                const safeRatio = Math.max(0, Math.min(1, ratio));
                                centerBonus = safeRatio * 60;
                            }
                        }

                        // 구역 자체 보너스 (중앙 구역 선호)
                        let sectionScore = 0;
                        if (section === 'B' || section === 'E') sectionScore = 15;
                        else sectionScore = 5; // 사이드도 점수 부여 (기존 0에서 상향)

                        // 층 보너스 (1층 선호)
                        let floorScore = 0;
                        if (floor === '1층') floorScore = 20;
                        else if (floor === '2층') floorScore = 10;

                        const totalScore = rowScore + centerBonus + sectionScore + floorScore;

                        allChunks.push({
                            seats: chunk,
                            section,
                            rowNum,
                            centerNum: avgGlobalNum,
                            score: totalScore
                        });
                    }
                }
            });

            // [DEBUG V8.13]
            const topChunks = [...allChunks].sort((a, b) => b.score - a.score).slice(0, 5);
            console.log('[SCORE] 상위 5개:', topChunks.map(c => ({
                seats: c.seats.map(s => s.split('-').slice(1).join('-')),
                avgGlobalNum: c.centerNum.toFixed(1),
                score: c.score
            })));


            // [V8.19] 전체 가능 옵션 수 저장
            gradeOptionsCounts[grade] = allChunks.length;
            console.log(`[SEATS] ${grade}석 가능한 연석 조합 수: ${allChunks.length}`);

            // 2. 다양성 확보를 위한 선택 (최대 3개)
            // 전략: B구역 1위, A구역 1위, C구역 1위 (없으면 차순위 대체)
            const finalSelection: SeatChunk[] = [];

            // 점수 내림차순 정렬
            allChunks.sort((a, b) => b.score - a.score);

            // 각 구역별 베스트 추출
            const bestB = allChunks.find(c => c.section === 'B');
            const bestA = allChunks.find(c => c.section === 'A');
            const bestC = allChunks.find(c => c.section === 'C');

            const usedChunks = new Set<string>(); // 중복 방지 (chunk[0] seatId 기준)

            const addChunk = (c: SeatChunk | undefined) => {
                if (c && !usedChunks.has(c.seats[0])) {
                    finalSelection.push(c);
                    usedChunks.add(c.seats[0]);
                }
            };

            // 우선순위대로 추가
            addChunk(bestB); // 1. B구역 최적 (정중앙 우선)
            addChunk(bestA); // 2. A구역 최적
            addChunk(bestC); // 3. C구역 최적

            // 3개 미만이면 전체 차순위에서 추가
            if (finalSelection.length < 3) {
                for (const chunk of allChunks) {
                    if (finalSelection.length >= 3) break;
                    addChunk(chunk);
                }
            }

            // 최종 포맷팅
            if (finalSelection.length > 0) {
                recommendations[grade] = finalSelection.map((chunkItem) => {
                    const chunk = chunkItem.seats;
                    const first = chunk[0];
                    const parts = first.split('-'); // 1층-B-7-14
                    const floor = parts[0];
                    const sectionId = parts[1];
                    const rowIdStr = parts[2];
                    const rowId = parseInt(rowIdStr);

                    // [V8.8] calculateGlobalSeatNumber 사용 (프론트엔드와 동일 SSOT)
                    const floorSections = sections.filter((s: any) => s.floor === floor);
                    const sortedNums = chunk.map(s => parseInt(s.split('-')[3])).sort((a, b) => a - b);
                    const displayNums = sortedNums.map(n =>
                        calculateGlobalSeatNumber(sectionId, rowIdStr, n, floorSections, floor)
                    );
                    const seatNums = displayNums.length > 1
                        ? `${displayNums[0]}~${displayNums[displayNums.length - 1]}`
                        : `${displayNums[0]}`;

                    // [V7.11] DB description 우선 사용
                    const gradeDesc = seatGrades.find((g: any) => g.grade === grade);
                    let positionNote = gradeDesc?.description || "";
                    if (!positionNote) {
                        // [V8.14 FIX] rowId NaN 방어 (OP석 등)
                        if (parts[2] === 'OP') positionNote = "무대와 가장 가까운 오케스트라 피트석";
                        else if (rowId <= 5) positionNote = "무대와 매우 가까운 앞쪽";
                        else if (rowId <= 10) positionNote = "시야가 좋은 중간 쪽";
                        else positionNote = "전체적인 무대 감상이 좋은 뒤쪽";
                    }

                    let blockNote = "";
                    if (parts[1] === 'B') {
                        // V8.9: 정중앙 멘트 조건 강화 (score 로직과 일치)
                        // displayNums(글로벌 번호) 기준으로 정중앙 판단
                        const isCenter = displayNums.some(n => n >= 18 && n <= 21);
                        if (isCenter) blockNote = "★정중앙(18~21번)★ 무대 정면 최고의 명당입니다!";
                        else blockNote = "정중앙 블록(B)으로 무대 정면 시야가 매우 우수합니다";
                    } else if (parts[1] === 'A') {
                        blockNote = "좌측 블록(A) 통로 쪽이라 이동이 편하고 시야가 트여있습니다";
                    } else if (parts[1] === 'C') {
                        blockNote = "우측 블록(C) 통로 쪽이라 이동이 편하고 시야가 트여있습니다";
                    } else {
                        blockNote = `${parts[1]}구역 좌석입니다`;
                    }

                    const label = `${parts[0]} ${parts[1]}구역 ${grade}석 ${parts[2]}열 ${seatNums}번`;
                    const description = `📍 ${positionNote}, ${blockNote}`;

                    const formatted = `🎫 **${label}** (인원: ${targetCount}명 연석)\n   └ ${description}`;

                    return {
                        // [V8.17] AI가 hold_seats 호출 시 사용해야 할 seatIds
                        // ⚠️ 이 배열을 hold_seats의 seatIds 파라미터에 그대로 복사해서 사용해야 함!
                        _seatIdsForHoldSeats: chunk,
                        seats: chunk,  // 기존 호환성 유지
                        label: label,  // 사용자에게 보여줄 텍스트 (글로벌 번호)
                        description,
                        formatted: formatted
                    };
                });
            }
        }
    });

    // Prepare Response
    const responseMessage = requestedGrade
        ? `요청하신 ${requestedGrade}석 잔여 현황입니다:\n${summary}`
        : `현재 잔여석 현황입니다:\n${summary}`;

    // [V8.6] 구역별 좌석 번호 범위 정보 추출 (AI가 정확한 좌석 추천을 위해)
    const sectionInfo: Record<string, { floor: string; seatRange: string; description: string }> = {};
    sections.forEach((section: any) => {
        const sectionId = section.sectionId || section.id;
        const floor = section.floor || '1층';
        const rows = section.rows || [];

        // 각 구역의 좌석 번호 범위 계산
        let minSeat = Infinity;
        let maxSeat = 0;
        rows.forEach((row: any) => {
            const seats = row.seats || [];
            seats.forEach((seat: any) => {
                const num = seat.seatNumber || parseInt(String(seat.seatId).split('-').pop() || '0');
                if (num < minSeat) minSeat = num;
                if (num > maxSeat) maxSeat = num;
            });
            // length 기반 fallback
            if (seats.length === 0 && row.length) {
                if (1 < minSeat) minSeat = 1;
                if (row.length > maxSeat) maxSeat = row.length;
            }
        });

        if (minSeat !== Infinity && maxSeat > 0) {
            let description = '';
            if (sectionId === 'B') description = '정중앙 블록 (무대 정면, 최고의 시야)';
            else if (sectionId === 'A') description = '좌측 블록 (무대 왼쪽 시야)';
            else if (sectionId === 'C') description = '우측 블록 (무대 오른쪽 시야)';

            sectionInfo[sectionId] = {
                floor,
                seatRange: `${minSeat}~${maxSeat}번`,
                description
            };
        }
    });

    return {
        totalAvailable,
        summary,
        details: Object.fromEntries(
            Object.entries(gradeInfo).map(([grade, info]) => [grade, {
                count: info.seats.length,
                price: info.price,
                formattedPrice: `${info.price.toLocaleString()}원`
            }])
        ),
        recommendedOptions: recommendations,
        // [V8.6] 구역별 좌석 정보 (AI용)
        sectionInfo,
        // [V8.6] AI를 위한 좌석 구조 가이드
        seatGuide: `
📍 좌석 구조 안내:
- A구역: 좌측 블록 (${sectionInfo['A']?.seatRange || '정보 없음'})
- B구역: 정중앙 블록 (${sectionInfo['B']?.seatRange || '정보 없음'}) ← 가장 좋은 시야!
  (단, OP석은 B구역 맨 앞 1~12번이며, 5~8번이 가장 중앙입니다)
- C구역: 우측 블록 (${sectionInfo['C']?.seatRange || '정보 없음'})

💡 정중앙 좌석을 원하시면 B구역을 추천하세요!
💡 B구역의 가운데 번호는 약 ${Math.floor(((parseInt(sectionInfo['B']?.seatRange?.split('~')[0] || '13') + parseInt(sectionInfo['B']?.seatRange?.split('~')[1]?.replace('번', '') || '25')) / 2))}번입니다.
`.trim(),
        // [V8.19] 메시지 강화: 전체 옵션 수 명시
        message: `${responseMessage}\n\n[추천 좌석 (인원: ${targetCount}명)]
(총 ${Object.values(gradeOptionsCounts).reduce((a, b) => a + b, 0)}개의 가능한 좌석 조합 중 AI가 추천하는 상위 3개입니다.)
${Object.values(recommendations).flat().map(r => r.formatted).join('\n')}

💡 위 추천 외에도 더 많은 좌석이 있습니다. 원하시는 구역이나 번호대("4~6번 등")를 말씀해주시면 확인해드릴게요!

어느 좌석이 마음에 드세요?`,
        _actions: undefined
    };
}
