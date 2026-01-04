import { getUserReservations } from '../server/holding-manager';

export async function getMyReservations(input: any) {
    const { userId } = input;
    const reservations = await getUserReservations(userId);

    if (reservations.length === 0) {
        return { message: "예약 내역이 없습니다." };
    }

    // [Issue 4] Format reservations for better readability
    // and [V7.9] Handle DR_RECOVERED status
    const formatted = reservations.map(r => {
        let statusText: string = r.status;
        let actions: any[] = [];

        if (r.status === 'confirmed') statusText = "예약 완료";
        // [V8.21 FIX] DR_RESERVED는 예약 완료 상태임
        if (r.status === 'dr_reserved') statusText = "예약 확정 (DR)";

        if (r.status === 'dr_recovered') {
            // [V8.21 FIX] 사용자 멘탈 모델에 맞게 "선점 중"으로 표시
            statusText = "선점 중 (결제 필요)";
            // [V8.4] Chatbot Role Separation: Redirect to Web
            actions = [
                {
                    id: `pay-${r.id}`,
                    label: '결제하기',
                    action: 'navigate',
                    url: `/reservation/confirm?holdingId=${r.id}&region=${process.env.AWS_REGION || 'ap-northeast-2'}`, // holdingId is r.id in recovery
                    style: 'primary',
                    target: '_blank'
                },
                {
                    id: `cancel-${r.id}`,
                    label: '취소하기',
                    action: 'navigate',
                    url: `/my`, // Navigate to My Page to cancel
                    style: 'danger'
                }
            ];
        }
        // HOLDING is filtered out in getUserReservations, so no need to check

        return {
            ...r,
            status: statusText,
            _actions: actions.length > 0 ? actions : undefined
        };
    });

    return {
        success: true,
        reservations: formatted,
        message: `총 ${reservations.length}건의 예약 내역이 있습니다.`
    };
}
