import fs from 'fs';

// Helper to unmarshall simple DynamoDB JSON (only what we need)
function unmarshall(item) {
    if (item.S !== undefined) return item.S;
    if (item.N !== undefined) return Number(item.N);
    if (item.BOOL !== undefined) return item.BOOL;
    if (item.L !== undefined) return item.L.map(unmarshall);
    if (item.M !== undefined) {
        const obj = {};
        for (const [k, v] of Object.entries(item.M)) {
            obj[k] = unmarshall(v);
        }
        return obj;
    }
    return item;
}

const rawData = JSON.parse(fs.readFileSync('scripts/concerts-complete.json', 'utf8'));
const oldItems = rawData['plcr-gtbl-performances'].map(entry => {
    const item = entry.PutRequest.Item;
    // Unmarshall manually to get a clean object
    const obj = {};
    for (const [k, v] of Object.entries(item)) {
        obj[k] = unmarshall(v);
    }
    return obj;
});

// oldItems[0] = BTS
// oldItems[1] = Blackpink
// oldItems[2] = Day6
// oldItems[3] = IVE

const newItems = [];

// 1. Jeong O Byeol Jeom (Base: BTS)
const band1 = { ...oldItems[0] };
band1.performanceId = "perf-jeong-o-byeol-jeom";
band1.title = "✷ 정 오 별 점 pt.2 ✷";
band1.venueId = "charlotte-theater";
band1.venue = "언플러그드 라운지 (서울 마포구 와우산로29길 15 2층)";
band1.posterUrl = "/posters/indie-band-1.png";
band1.price = "1층 90,000원 / 2층 70,000원";
// dates match BTS: 2026-02-20 ~ 22
band1.description = "그냥 마음 편히 1등이고 싶어.\n적어도 오늘만큼은 말이야!\n\n𖤐 기묘말 - @mikk.oz\n𖤐 언더플로우 - @under__flow";
band1.cast = { "indie": ["기묘말", "언더플로우"] };
band1.schedule = "금토일 19:00";
band1.seatGrades = [
    { grade: "1층", price: 90000, color: "#14213D", description: "1층 스탠딩/좌석 (Midnight Navy)" },
    { grade: "2층", price: 70000, color: "#FCA311", description: "2층 좌석 (Starlight Yellow)" }
];
band1.seatColors = { "1층": "#14213D", "2층": "#FCA311" };
// Remap gradeMapping keys
band1.gradeMapping = {
    "1층": band1.gradeMapping.VIP,
    "2층": band1.gradeMapping.R
};
newItems.push(band1);

// 2. 29CM STAGE (Base: Blackpink)
const band2 = { ...oldItems[1] };
band2.performanceId = "perf-29cm-stage";
band2.title = "[29CM STAGE] 6th STAGE";
band2.venueId = "charlotte-theater";
band2.venue = "무신사개러지 (서울 마포구 잔다리로 32 서문빌딩 지하1층)";
band2.posterUrl = "/posters/indie-band-2.png";
band2.price = "1층 70,000원 / 2층 50,000원";
// dates match Blackpink: 2026-03-13 ~ 15
band2.description = "[29CM STAGE] 6th STAGE – DAY 1\n\n음악으로 공간을 채우고, 감각이 깨어나는 특별한 경험.\n\n29CM가 전개중인 자체 기획 콘서트 프로그램인 이구스테이지가 두루두루아티스트컴퍼니 @dooroodooroo.ac 의 아티스트들과 함께 이틀간의 일정으로 더 풍성하게 진행됩니다.";
band2.cast = { "indie": ["장기하", "양치기소년단"] };
band2.schedule = "금토일 19:00";
band2.seatGrades = [
    { grade: "1층", price: 70000, color: "#2E4053", description: "1층 (Urban Navy)" },
    { grade: "2층", price: 50000, color: "#FF5A00", description: "2층 (Accent Orange)" }
];
band2.seatColors = { "1층": "#2E4053", "2층": "#FF5A00" };
band2.gradeMapping = {
    "1층": band2.gradeMapping.VIP,
    "2층": band2.gradeMapping.R
};
newItems.push(band2);

// 3. Free Fall (Base: Day6)
const band3 = { ...oldItems[2] };
band3.performanceId = "perf-free-fall";
band3.title = "자유낙하 - [Free Fall to Indie - November]";
band3.venueId = "charlotte-theater";
band3.venue = "언플러그드 라운지 (서울 마포구 와우산로29길 15 2층)";
band3.posterUrl = "/posters/indie-band-3.png";
band3.price = "1층 80,000원 / 2층 50,000원";
// dates match Day6: 2026-03-27 ~ 29
band3.description = "자유낙하 공연 소식📣\n\n[Free Fall to Indie]";
band3.cast = { "indie": ["오예본", "우수현", "민채영"] };
band3.schedule = "금토일 19:00"; // Changed to 19:00 as requested
band3.seatGrades = [
    { grade: "1층", price: 80000, color: "#00BFFF", description: "1층 (Deep Sky Blue)" },
    { grade: "2층", price: 50000, color: "#B0C4DE", description: "2층 (Light Steel Blue)" }
];
band3.seatColors = { "1층": "#00BFFF", "2층": "#B0C4DE" };
band3.gradeMapping = {
    "1층": band3.gradeMapping.VIP,
    "2층": band3.gradeMapping.R
};
newItems.push(band3);

// 4. ON:AIR (Base: IVE)
const band4 = { ...oldItems[3] };
band4.performanceId = "perf-on-air";
band4.title = "ON:AIR";
band4.venueId = "charlotte-theater";
band4.venue = "서울스트리밍스테이션 (서울 강남구 강남대로110길 51)";
band4.posterUrl = "/posters/indie-band-4.png";
band4.price = "1층 70,000원 / 2층 50,000원";
// dates match IVE: 2026-02-27 ~ 3-01
band4.description = "ON:AIR 는 ‘보이는 라디오’ 콘셉트의 라이브 공연입니다.\n공연 중 각 밴드 셋업 시간에 MC와 각 밴드 보컬이, 사전에 추첨된 관객의 사연을 직접 읽어드립니다.";
band4.cast = { "indie": ["디아틱", "세븐아워즈", "나타샤"] };
band4.schedule = "금토일 19:30"; // Changed to 19:30 as requested
band4.seatGrades = [
    { grade: "1층", price: 70000, color: "#E01E37", description: "1층 (On Air Red)" },
    { grade: "2층", price: 50000, color: "#ADB5BD", description: "2층 (Studio Grey)" }
];
band4.seatColors = { "1층": "#E01E37", "2층": "#ADB5BD" };
band4.gradeMapping = {
    "1층": band4.gradeMapping.VIP,
    "2층": band4.gradeMapping.R
};
newItems.push(band4);

fs.writeFileSync('apps/web/indie-performances.json', JSON.stringify(newItems, null, 2));
console.log('Successfully created apps/web/indie-performances.json');
