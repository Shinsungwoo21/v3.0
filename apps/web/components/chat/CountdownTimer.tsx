import React, { useEffect, useState } from 'react';
import { TimerInfo } from '../../types/chat';

interface CountdownTimerProps {
    timer: TimerInfo;
    onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ timer, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const expireTime = new Date(timer.expiresAt).getTime();
            const diff = Math.floor((expireTime - now) / 1000);
            return diff > 0 ? diff : 0;
        };

        const initialTime = calculateTimeLeft();
        setTimeLeft(initialTime);

        if (initialTime <= 0) {
            setIsExpired(true);
            if (onExpire) onExpire();
            return;
        }

        const interval = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                setIsExpired(true);
                if (onExpire) onExpire();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timer.expiresAt, onExpire]);

    if (isExpired) {
        return (
            <div className="flex items-center gap-2 text-gray-500 mt-2 text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>만료된 요청입니다</span>
            </div>
        );
    }

    const isUrgent = timeLeft <= (timer.warningThreshold || 30);

    // [V8.6] 버튼 영역의 타이머 텍스트는 표시하지 않음 (헤더에만 표시)
    // 단, 만료 시에는 표시
    return null;
};
