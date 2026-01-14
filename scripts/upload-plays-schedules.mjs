import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const region = "ap-northeast-2";
const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "plcr-gtbl-schedules";
const createdAt = new Date().toISOString();

// 연극별 캐스팅 정보
const castings = {
    "perf-liar": {
        "존 스미스": ["김재익", "이동수", "전대현"],
        "스탠리 가드너": ["권오율", "김연철", "승기호"],
        "메리 스미스": ["김가현", "김희성", "안유민"],
        "바바라 스미스": ["이미선", "장희재"],
        "포터 하우스": ["김원식", "최승주"],
        "트로우튼": ["윤상철", "윤정훈", "이수형"],
        "바비 프랭클린": ["강태웅", "전주형"]
    },
    "perf-rooftop-cat": {
        "남정은": ["양솔", "윤봄", "조하연"],
        "이경민": ["강이성", "곽근영", "조민규"],
        "겨양이": ["백진화", "정유정", "홍은"],
        "뭉치": ["김창일", "성보람", "김동섭"]
    },
    "perf-let-me-in": {
        "일라이": ["권슬아", "백승연"],
        "오스카": ["천우진", "안승균"],
        "하칸": ["조정근", "지현준"]
    },
    "perf-line2-tenant": {
        "시청": ["정은규", "민채우", "서해트"],
        "성내": ["임지우", "박경진", "전지후"],
        "구의": ["최상태", "성보람", "박호진"],
        "방배": ["이우진", "김은정", "허슬빈"],
        "역삼(역장)": ["정진혁", "유우현", "김건호"]
    }
};

// 연극 스케줄 데이터 (총 36회)
const schedules = [
    // 라이어 (perf-liar) - 11회
    { performanceId: "perf-liar", date: "2026-03-04", time: "16:30", dayOfWeek: "수" },
    { performanceId: "perf-liar", date: "2026-03-05", time: "16:30", dayOfWeek: "목" },
    { performanceId: "perf-liar", date: "2026-03-06", time: "16:30", dayOfWeek: "금" },
    { performanceId: "perf-liar", date: "2026-03-06", time: "19:30", dayOfWeek: "금" },
    { performanceId: "perf-liar", date: "2026-03-07", time: "13:00", dayOfWeek: "토" },
    { performanceId: "perf-liar", date: "2026-03-07", time: "16:00", dayOfWeek: "토" },
    { performanceId: "perf-liar", date: "2026-03-07", time: "19:00", dayOfWeek: "토" },
    { performanceId: "perf-liar", date: "2026-03-08", time: "11:00", dayOfWeek: "일" },
    { performanceId: "perf-liar", date: "2026-03-08", time: "14:00", dayOfWeek: "일" },
    { performanceId: "perf-liar", date: "2026-03-08", time: "17:00", dayOfWeek: "일" },

    // 2호선세입자 (perf-line2-tenant) - 10회
    { performanceId: "perf-line2-tenant", date: "2026-03-11", time: "17:00", dayOfWeek: "수" },
    { performanceId: "perf-line2-tenant", date: "2026-03-12", time: "17:00", dayOfWeek: "목" },
    { performanceId: "perf-line2-tenant", date: "2026-03-13", time: "17:00", dayOfWeek: "금" },
    { performanceId: "perf-line2-tenant", date: "2026-03-13", time: "19:30", dayOfWeek: "금" },
    { performanceId: "perf-line2-tenant", date: "2026-03-14", time: "12:50", dayOfWeek: "토" },
    { performanceId: "perf-line2-tenant", date: "2026-03-14", time: "15:00", dayOfWeek: "토" },
    { performanceId: "perf-line2-tenant", date: "2026-03-14", time: "17:15", dayOfWeek: "토" },
    { performanceId: "perf-line2-tenant", date: "2026-03-14", time: "19:30", dayOfWeek: "토" },
    { performanceId: "perf-line2-tenant", date: "2026-03-15", time: "13:30", dayOfWeek: "일" },
    { performanceId: "perf-line2-tenant", date: "2026-03-15", time: "16:00", dayOfWeek: "일" },

    // 옥탑방 고양이 (perf-rooftop-cat) - 9회
    { performanceId: "perf-rooftop-cat", date: "2026-04-01", time: "16:00", dayOfWeek: "수" },
    { performanceId: "perf-rooftop-cat", date: "2026-04-02", time: "16:00", dayOfWeek: "목" },
    { performanceId: "perf-rooftop-cat", date: "2026-04-03", time: "16:00", dayOfWeek: "금" },
    { performanceId: "perf-rooftop-cat", date: "2026-04-03", time: "19:00", dayOfWeek: "금" },
    { performanceId: "perf-rooftop-cat", date: "2026-04-04", time: "13:30", dayOfWeek: "토" },
    { performanceId: "perf-rooftop-cat", date: "2026-04-04", time: "15:45", dayOfWeek: "토" },
    { performanceId: "perf-rooftop-cat", date: "2026-04-04", time: "18:00", dayOfWeek: "토" },
    { performanceId: "perf-rooftop-cat", date: "2026-04-05", time: "14:00", dayOfWeek: "일" },
    { performanceId: "perf-rooftop-cat", date: "2026-04-05", time: "16:30", dayOfWeek: "일" },

    // 렛미인 (perf-let-me-in) - 6회
    { performanceId: "perf-let-me-in", date: "2026-05-05", time: "19:30", dayOfWeek: "화" },
    { performanceId: "perf-let-me-in", date: "2026-05-06", time: "19:30", dayOfWeek: "수" },
    { performanceId: "perf-let-me-in", date: "2026-05-07", time: "19:30", dayOfWeek: "목" },
    { performanceId: "perf-let-me-in", date: "2026-05-08", time: "19:30", dayOfWeek: "금" },
    { performanceId: "perf-let-me-in", date: "2026-05-09", time: "14:00", dayOfWeek: "토" },
    { performanceId: "perf-let-me-in", date: "2026-05-09", time: "18:30", dayOfWeek: "토" }
];

async function uploadSchedules() {
    console.log("🚀 연극 스케줄 업로드 시작...\n");

    for (const schedule of schedules) {
        const scheduleId = `${schedule.performanceId}-${schedule.date}-${schedule.time}`;
        const datetime = `${schedule.date}T${schedule.time}`;

        const item = {
            scheduleId,
            performanceId: schedule.performanceId,
            date: schedule.date,
            time: schedule.time,
            datetime,
            dayOfWeek: schedule.dayOfWeek,
            totalSeats: 1210,
            availableSeats: 1210,
            status: "AVAILABLE",
            casting: castings[schedule.performanceId],
            createdAt
        };

        console.log(`Uploading: ${scheduleId}`);

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        }));

        console.log(`✅ Success`);
    }

    console.log(`\n🎭 연극 스케줄 업로드 완료! (${schedules.length}개)`);
}

uploadSchedules().catch(console.error);
