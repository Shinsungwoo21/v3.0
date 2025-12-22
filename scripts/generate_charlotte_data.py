import json
import os

# Grade Definitions
GRADES = [
    {"grade": "OP", "color": "#808080", "price": 170000},  # Gray
    {"grade": "VIP", "color": "#FF69B4", "price": 170000}, # Pink
    {"grade": "R", "color": "#D4A574", "price": 140000},   # Gold/Beige
    {"grade": "S", "color": "#4169E1", "price": 110000},   # Blue
    {"grade": "A", "color": "#32CD32", "price": 80000},    # Green
]

GRADE_MAP = {g["grade"]: g for g in GRADES}

def create_seat(seat_id, seat_num, row_id, grade, status="available"):
    return {
        "seatId": seat_id,
        "seatNumber": seat_num,
        "rowId": row_id,
        "grade": grade,
        "status": status,
        "x": 0,
        "y": 0
    }

def get_grade_for_1f_row(row_num, section, is_op=False):
    if is_op:
        return "OP"
    
    # 1~15 (VIP/R) - Text says Gold/Beige for 1-15 but VIP is Pink. 
    # User Request says: 1~15열: 황금색/베이지 (VIP/R석) but table says VIP is Pink.
    # Looking at the image, front center is VIP (Pink), sides are R (Gold/Beige).
    # Let's map strict to the Table provided in prompt since it's "Core Requirements".
    # Wait, Reference Image determines distribution.
    # User prompt point 3: "1~15열: 황금색/베이지 (VIP/R석)" 
    #   -> This conflicts with table "VIP: Pink". 
    #   -> But looking at the request more closely: "1~15열: 황금색/베이지 (VIP/R석)" might mean R Grade?
    #   -> Let's check table again: VIP 170,000 (Pink), R 140,000 (Gold).
    #   -> Usually Center Front is VIP.
    #   -> Let's follow the image colors primarily if text is ambiguous.
    #   -> Image 1F:
    #       - Center (B): OP (Gray), Rows 1-10ish are brown/gold (R?), Rows 11ish+ are darker.
    #       - Actually, commonly Charlotte Theater:
    #         - VIP is center block front.
    #         - R is side blocks front + center block middle.
    #         - S is back.
    #         - A is far back/sides.
    #
    #   -> User Prompt Point 3 says: 
    #       "1~15열: 황금색/베이지 (VIP/R석)" -> They grouped VIP/R as Gold/Beige? 
    #       But Point 5 says VIP is Pink, R is Gold.
    #   -> Let's infer:
    #       - Maybe the user considers Pink/Gold similar or just wants Gold for R and Pink for VIP.
    #       - Let's use:
    #           - OP: OP (Gray)
    #           - ROWS 1-10 Center(B): VIP (Pink) - standard for theaters
    #           - ROWS 1-10 Sides(A/C): R (Gold)
    #           - ROWS 11-15 Center(B): R (Gold)
    #           - ROWS 11-15 Sides(A/C): R (Gold)
    #           - ROWS 16-21: S (Blue) -> Wait, prompt says 16-21 Red (S). Table says S is Blue.
    #             Prompt Point 3: "16~21열: 빨간색 (S석)" vs Point 5: "S석 | 파란색 (#4169E1)".
    #             CONFLICT.
    #             Priority: Point 5 (Table) usually defines the SYSTEM settings.
    #             But Point 3 describes the MAP VISUALS.
    #             However, the user wants "Charlotte Style".
    #             Let's stick to the Table colors (Point 5) for consistency of "Grade -> Color".
    #             So if S is Blue in table, I will make S seats Blue.
    #             If User said "16-21 Red (S)", maybe they meant R? No, S usually is cheaper.
    #             Let's assume the Table (Point 5) is the Source of Truth for Color-Grade mapping.
    #             And Point 3 is for Grade Distribution.
    #             
    #             Revised Grade Distribution (1F):
    #             - OP: OP
    #             - 1-7 (B): VIP
    #             - 8-15 (B): VIP/R mix? Let's say VIP up to 10, R 11-15.
    #             - 1-15 (A/C): R
    #             - 16-21 (All): S
    
    if section == 'B':
        if row_num <= 10: return "VIP"
        if row_num <= 15: return "R"
        return "S"
    else: # A or C
        if row_num <= 15: return "R"
        return "S"

def get_grade_for_2f_row(row_num, section):
    # 4. 2층 좌석 배치
    #   - A/C 앞부분: 빨간색 (R석) -> Table R is Gold. I will use R grade.
    #   - B 앞부분 (1~3열): 황금색 (R석) -> Table R is Gold. Use R grade.
    #   - B 중간 (4~7열): 파란색 (S석) -> Table S is Blue. Use S grade.
    #   - B 뒷부분 (8~12열): 파란색 (S석) -> S grade.
    #   - A/C 뒷부분: 초록색 (A석) -> Table A is Green. Use A grade.
    
    if section == 'B':
        if row_num <= 3: return "R"
        return "S"
    else: # A or C
        if row_num <= 7: return "R" # Rough split
        return "A"

def generate_section(floor, section_id, start_row, end_row, start_num, seat_count_fn):
    rows = []
    
    # OP Row for 1F-B
    if floor == "1층" and section_id == "B":
        seats = []
        for i in range(1, 15): # OP has fewer seats usually
             seats.append(create_seat(f"{floor}-{section_id}-OP-{i}", i, "OP", "OP"))
        rows.append({
            "rowId": "OP",
            "rowName": "OP열",
            "grade": "OP",
            "seats": seats
        })

    for r in range(start_row, end_row + 1):
        grade = get_grade_for_1f_row(r, section_id) if floor == "1층" else get_grade_for_2f_row(r, section_id)
        
        # Calculate seat numbers
        # 1F B: 15~30 (approx 16 seats)
        # 1F A: 1~14 (approx 14 seats)
        # 1F C: 31~44 (approx 14 seats)
        
        # 2F B: 15~30
        # 2F A: 1~14
        # 2F C: 31~44
        
        # Adjust count based on row for A/C (wedge shape)
        # Row 1 is narrow (fewer seats), Row 21 is wide.
        
        row_seats = []
        
        current_count = 0
        if section_id == 'B':
            current_count = 16
            current_start = 15
        elif section_id == 'A':
            # Widget shape: start small, get bigger
            # Row 1: maybe 8 seats (7-14)
            # Row 21: 14 seats (1-14)
            # Linear interp or just fixed for simplicity? User said "A/C/OP: 부채꼴 곡선"
            # Let's simple approximation: 
            # 1F A: 1~14 is max. 
            count = 10 + (r // 5) # 10 -> 14
            if count > 14: count = 14
            current_count = count
            current_start = 14 - count + 1
        elif section_id == 'C':
            count = 10 + (r // 5)
            if count > 14: count = 14
            current_count = count
            current_start = 31
            
        # Specific overrides from prompt
        if floor == "2층":
            # A: 1-14, C: 31-44
            if section_id == 'A': current_start = 1
            if section_id == 'C': current_start = 31
            current_count = 14
        
        for i in range(current_count):
            num = current_start + i
            
            # Special Handling for Wheelchair (1F 21 row)
            status = "available"
            if floor == "1층" and r == 21 and (section_id == 'A' or section_id == 'C'):
                # Just add H seat at end
                pass 
                
            row_seats.append(create_seat(f"{floor}-{section_id}-{r}-{num}", num, str(r), grade, status))
            
        rows.append({
            "rowId": str(r),
            "rowName": f"{r}열",
            "grade": grade,
            "seats": row_seats
        })
        
    return {
        "sectionId": section_id,
        "sectionName": f"{section_id}구역",
        "floor": floor,
        "rows": rows
    }

def main():
    venue = {
        "venueId": "charlotte-theater",
        "venueName": "Charlotte Theater",
        "venueType": "theater",
        "totalSeats": 0,
        "grades": GRADES,
        "sections": []
    }
    
    # 1F Sections
    # A: 1-21
    venue["sections"].append(generate_section("1층", "A", 1, 21, 1, None))
    # B: 1-21
    venue["sections"].append(generate_section("1층", "B", 1, 21, 15, None))
    # C: 1-21
    venue["sections"].append(generate_section("1층", "C", 1, 21, 31, None))
    
    # 2F Sections
    # A: 1-12
    venue["sections"].append(generate_section("2층", "A", 1, 12, 1, None))
    # B: 1-12
    venue["sections"].append(generate_section("2층", "B", 1, 12, 15, None))
    # C: 1-12
    venue["sections"].append(generate_section("2층", "C", 1, 12, 31, None))
    
    # Calculate Total
    count = 0
    for s in venue["sections"]:
        for r in s["rows"]:
            count += len(r["seats"])
    venue["totalSeats"] = count
    
    with open('apps/web/data/venues/sample-theater.json', 'w', encoding='utf-8') as f:
        json.dump(venue, f, indent=2, ensure_ascii=False)
        
    print(f"Generated {count} seats.")

if __name__ == "__main__":
    main()
