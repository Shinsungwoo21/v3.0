"use client"

import { Seat, Grade, SeatStatus } from "@mega-ticket/shared-types"
import { cn } from "@/lib/utils"

interface SeatButtonProps {
    seat: Seat;
    grade: Grade;
    floor: string;
    isSelected: boolean;
    onClick: (seatId: string) => void;
    isOPDisabled?: boolean;
    displayNumber?: number;
}

// [V8.13] Tailwind 클래스 + 인라인 스타일 fallback
const statusStyles: Record<SeatStatus, { className: string; inlineStyle?: React.CSSProperties }> = {
    available: {
        className: 'bg-white border-2 hover:brightness-95 cursor-pointer',
        inlineStyle: { backgroundColor: '#ffffff' }
    },
    selected: {
        className: 'border-2 text-white shadow-md animate-in zoom-in-95 duration-200',
        inlineStyle: {}
    },
    reserved: {
        className: 'bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed',
        inlineStyle: { backgroundColor: '#d1d5db', borderColor: '#d1d5db', color: '#6b7280' }
    },
    holding: {
        // [V8.13 FIX] 노란색 선점 표시 - 더 진한 노란색으로 변경
        className: 'bg-yellow-400 border-yellow-500 text-yellow-900 cursor-not-allowed font-bold',
        inlineStyle: { backgroundColor: '#facc15', borderColor: '#eab308', color: '#713f12' }
    },
    disabled: {
        className: 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed',
        inlineStyle: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }
    },
    empty: {
        className: 'invisible pointer-events-none border-none',
        inlineStyle: {}
    },
};

export function SeatButton({ seat, grade, floor, isSelected, onClick, isOPDisabled = false, displayNumber }: SeatButtonProps) {
    const showNumber = displayNumber ?? seat.seatNumber;
    const isOpStyle = isOPDisabled;

    // [V8.12 FIX] DB에서 HOLDING (대문자)으로 올 수 있으므로 소문자로 정규화
    const normalizedStatus = (seat.status?.toLowerCase() || 'available') as SeatStatus;

    // [V8.13 DEBUG] HOLDING 상태 디버그 로그
    if (normalizedStatus === 'holding') {
        console.log('[SeatButton] HOLDING seat detected:', {
            seatId: seat.seatId,
            originalStatus: seat.status,
            normalizedStatus
        });
    }

    const statusConfig = statusStyles[normalizedStatus] || statusStyles.available;

    // 스타일 계산: 선택됨 > HOLDING/reserved > available
    let computedStyle: React.CSSProperties = {};

    if (isOpStyle) {
        computedStyle = {};
    } else if (isSelected) {
        computedStyle = { backgroundColor: grade.color, borderColor: grade.color };
    } else if (normalizedStatus === 'holding' || normalizedStatus === 'reserved' || normalizedStatus === 'disabled') {
        // [V8.13 FIX] HOLDING/reserved 상태는 인라인 스타일로 확실히 적용
        computedStyle = statusConfig.inlineStyle || {};
    } else if (normalizedStatus === 'available') {
        computedStyle = { borderColor: grade.color };
    }

    const isDisabled = (normalizedStatus !== 'available' && !isSelected) || isOPDisabled;
    const opDisabledClasses = "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none";

    const rowLabel = seat.rowId || (seat as any).row || '?';
    const tooltipText = isOPDisabled
        ? "해당 공연은 OP석 판매를 하지 않습니다"
        : normalizedStatus === 'holding'
            ? `${floor} ${rowLabel}열 ${showNumber}번 - 다른 사용자가 선점 중`
            : normalizedStatus === 'reserved'
                ? `${floor} ${rowLabel}열 ${showNumber}번 - 예약완료`
                : `${floor} ${rowLabel}열 ${showNumber}번 (${grade.grade}석)`;

    return (
        <button
            className={cn(
                "w-8 h-8 m-0.5 rounded-t-md text-[10px] font-medium transition-all duration-200 flex items-center justify-center select-none border-2",
                isOpStyle ? opDisabledClasses : statusConfig.className,
                (isSelected && !isOpStyle) ? statusStyles.selected.className : ""
            )}
            style={computedStyle}
            disabled={isDisabled}
            onClick={() => onClick(seat.seatId)}
            title={tooltipText}
        >
            {/* [V8.13 FIX] 모래시계 제거 - 숫자만 표시 */}
            {(normalizedStatus === 'reserved' || isOPDisabled) ? 'X' : showNumber}
        </button>
    );
}
