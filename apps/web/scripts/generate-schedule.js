
const fs = require('fs');

const startDate = new Date("2026-02-20");
const endDate = new Date("2026-06-15");

const schedule = [];

let current = new Date(startDate);
while (current <= endDate) {
    const day = current.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dateStr = current.toISOString().split('T')[0];
    const dayStr = ["일", "월", "화", "수", "목", "금", "토"][day];

    // Exception: 3/1 No show
    if (current.getMonth() === 2 && current.getDate() === 1) { // Month is 0-indexed (2=March)
        current.setDate(current.getDate() + 1);
        continue;
    }

    let times = [];

    // Exception: 4/12 (Sun) -> 19:30 only
    if (current.getMonth() === 3 && current.getDate() === 12) {
        times.push({ time: "19:30", availableSeats: 50, status: "available" });
    } else {
        // Standard Rules
        if (day === 1) { // Mon: No show
            // pass
        } else if (day === 2 || day === 4) { // Tue, Thu: 19:30
            times.push({ time: "19:30", availableSeats: 50, status: "available" });
        } else if (day === 3 || day === 5) { // Wed, Fri: 14:30, 19:30
            times.push({ time: "14:30", availableSeats: 30, status: "available" });
            times.push({ time: "19:30", availableSeats: 50, status: "available" });
        } else if (day === 6) { // Sat: 14:00, 19:00
            times.push({ time: "14:00", availableSeats: 20, status: "few" });
            times.push({ time: "19:00", availableSeats: 25, status: "available" });
        } else if (day === 0) { // Sun: 15:00
            times.push({ time: "15:00", availableSeats: 40, status: "available" });
        }
    }

    if (times.length > 0) {
        schedule.push({
            date: dateStr,
            dayOfWeek: dayStr,
            times: times
        });
    }

    current.setDate(current.getDate() + 1);
}

console.log(JSON.stringify(schedule, null, 4));
