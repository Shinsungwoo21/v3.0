/**
 * V7.15 SSOT: 좌석 번호 계산 유틸리티
 * 
 * 모든 곳에서 동일한 좌석 번호 표시를 위한 Single Source of Truth
 * - 좌석 맵 (theater-template.tsx)
 * - 선택 좌석 표시 (seat-map.tsx)
 * - 결제 확인 페이지 (confirmation-step.tsx)
 * - 내 예약 페이지 (reservation-card.tsx)
 */

export interface SectionData {
    sectionId: string;
    floor: string;
    rows: {
        rowId: string;
        seats: { seatId: string }[];
        length?: number;
    }[];
}

/**
 * 연속 좌석 번호 계산 (같은 열에서 A -> B -> C 순서로 연속)
 * 
 * @param sectionId - 구역 ID (A, B, C, D, E, F)
 * @param rowId - 열 ID (OP, 1, 2, 3, ...)
 * @param localSeatNumber - 구역 내 좌석 번호 (1부터 시작)
 * @param sections - 해당 층의 섹션 데이터 배열
 * @param floor - 층 정보 (1층, 2층)
 * @returns 연속 좌석 번호
 */
export function calculateGlobalSeatNumber(
    sectionId: string,
    rowId: string,
    localSeatNumber: number,
    sections: SectionData[],
    floor: string
): number {
    // OP열은 독립적으로 1~12번
    if (rowId === 'OP') {
        return localSeatNumber;
    }

    // 해당 층의 섹션만 필터링
    const floorSections = sections.filter(s => s.floor === floor);

    // 나머지 열은 A -> B -> C 순서로 연속
    const sectionOrder = ['A', 'B', 'C', 'D', 'E', 'F'];
    const currentSectionIndex = sectionOrder.indexOf(sectionId);

    let offset = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
        const section = floorSections.find(s => s.sectionId === sectionOrder[i]);
        if (section) {
            const row = section.rows.find(r => r.rowId === rowId);
            if (row) {
                // seats 배열이 있으면 length 사용, 없으면 row.length 사용
                const seatCount = row.seats?.length || row.length || 0;
                offset += seatCount;
            }
        }
    }
    return offset + localSeatNumber;
}

/**
 * seatId에서 좌석 정보 파싱
 * 
 * @param seatId - 좌석 ID (형식: "1층-B-5-2" 또는 "B-5-2")
 * @returns 파싱된 좌석 정보
 */
export function parseSeatId(seatId: string): {
    floor: string;
    sectionId: string;
    rowId: string;
    localNumber: number;
} {
    const parts = seatId.split('-');

    if (parts.length === 4) {
        // 형식: "1층-B-5-2"
        return {
            floor: parts[0],
            sectionId: parts[1],
            rowId: parts[2],
            localNumber: parseInt(parts[3]) || 1
        };
    } else if (parts.length === 3) {
        // 형식: "B-5-2" (층 정보 없음)
        const section = parts[0];
        const floor = ['A', 'B', 'C', 'OP'].includes(section) ? '1층' : '2층';
        return {
            floor,
            sectionId: section,
            rowId: parts[1],
            localNumber: parseInt(parts[2]) || 1
        };
    }

    // 파싱 실패 시 기본값
    return {
        floor: '1층',
        sectionId: 'B',
        rowId: '1',
        localNumber: 1
    };
}

/**
 * 좌석 표시 레이블 생성 (SSOT)
 * 
 * @param seatId - 좌석 ID
 * @param grade - 좌석 등급
 * @param sections - 섹션 데이터 (연속 번호 계산용, optional)
 * @returns 표시용 레이블 (예: "1층 5열 38번 (VIP석)")
 */
export function formatSeatLabel(
    seatId: string,
    grade: string,
    sections?: SectionData[]
): string {
    const { floor, sectionId, rowId, localNumber } = parseSeatId(seatId);

    let displayNumber = localNumber;

    // sections가 제공되면 연속 번호 계산
    if (sections && sections.length > 0) {
        displayNumber = calculateGlobalSeatNumber(
            sectionId,
            rowId,
            localNumber,
            sections,
            floor
        );
    }

    return `${floor} ${sectionId}구역 ${rowId}열 ${displayNumber}번 (${grade}석)`;
}

/**
 * [V8.18] 글로벌 좌석 번호를 로컬 좌석 번호로 역변환
 * 
 * AI가 label의 글로벌 번호(예: 18번)를 seatId에 잘못 넣었을 때,
 * 올바른 로컬 번호(예: 6번)로 변환하기 위함
 * 
 * @param sectionId - 구역 ID (A, B, C, D, E, F)
 * @param rowId - 열 ID (OP, 1, 2, 3, ...)
 * @param globalNumber - 글로벌 좌석 번호 (연속 번호)
 * @param sections - 해당 층의 섹션 데이터 배열
 * @param floor - 층 정보 (1층, 2층)
 * @returns 로컬 좌석 번호 (구역 내 1부터 시작하는 번호)
 */
export function calculateLocalSeatNumber(
    sectionId: string,
    rowId: string,
    globalNumber: number,
    sections: SectionData[],
    floor: string
): number {
    // OP열은 글로벌 = 로컬
    if (rowId === 'OP') {
        return globalNumber;
    }

    // 해당 층의 섹션만 필터링
    const floorSections = sections.filter(s => s.floor === floor);

    // 나머지 열은 A -> B -> C 순서로 연속
    const sectionOrder = ['A', 'B', 'C', 'D', 'E', 'F'];
    const currentSectionIndex = sectionOrder.indexOf(sectionId);

    let offset = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
        const section = floorSections.find(s => s.sectionId === sectionOrder[i]);
        if (section) {
            const row = section.rows.find(r => r.rowId === rowId);
            if (row) {
                const seatCount = row.seats?.length || row.length || 0;
                offset += seatCount;
            }
        }
    }

    return globalNumber - offset;
}

/**
 * [V8.18] seatId의 좌석 번호가 유효한지 확인하고, 필요시 변환
 * 
 * @param seatId - 좌석 ID (형식: "1층-B-1-18")
 * @param sections - 섹션 데이터 (변환 필요 여부 판단용)
 * @returns { needsConversion, correctedSeatId, originalNumber, correctedNumber }
 */
export function validateAndCorrectSeatId(
    seatId: string,
    sections: SectionData[]
): {
    needsConversion: boolean;
    correctedSeatId: string;
    originalNumber: number;
    correctedNumber: number;
} {
    const { floor, sectionId, rowId, localNumber } = parseSeatId(seatId);

    // 해당 구역/열의 최대 좌석 수 확인
    const floorSections = sections.filter(s => s.floor === floor);
    const section = floorSections.find(s => s.sectionId === sectionId);
    const row = section?.rows.find(r => r.rowId === rowId);
    const maxSeats = row?.seats?.length || row?.length || 15;

    // localNumber가 해당 열의 좌석 수를 초과하면 글로벌 번호로 간주
    if (localNumber > maxSeats) {
        // 글로벌 번호를 로컬 번호로 변환
        const correctedNumber = calculateLocalSeatNumber(
            sectionId,
            rowId,
            localNumber,
            sections,
            floor
        );

        const correctedSeatId = `${floor}-${sectionId}-${rowId}-${correctedNumber}`;

        return {
            needsConversion: true,
            correctedSeatId,
            originalNumber: localNumber,
            correctedNumber
        };
    }

    return {
        needsConversion: false,
        correctedSeatId: seatId,
        originalNumber: localNumber,
        correctedNumber: localNumber
    };
}
