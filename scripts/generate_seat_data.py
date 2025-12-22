import json

def create_seat(id, num, row_id, grade, status="available"):
    return {
        "seatId": id,
        "seatNumber": num,
        "rowId": row_id,
        "grade": grade,
        "status": status,
        "x": 0,
        "y": 0
    }

def create_row(row_id, layout, grades_map):
    # layout is [A_count, B_count, C_count]
    seats = []
    
    current_seat_num = 1
    
    # Block A (Left)
    for i in range(layout[0]):
        # Check if seats should be skipped (e.g. curve effect)? For now, straight blocks.
        seats.append(create_seat(f"{row_id}-{current_seat_num}", current_seat_num, row_id, grades_map['A']))
        current_seat_num += 1
        
    # Gap A-B (2 slots)
    for i in range(2):
        seats.append(create_seat(f"{row_id}-gap1-{i}", 0, row_id, grades_map['B'], "empty"))

    # Block B (Center)
    for i in range(layout[1]):
        seats.append(create_seat(f"{row_id}-{current_seat_num}", current_seat_num, row_id, grades_map['B']))
        current_seat_num += 1

    # Gap B-C (2 slots)
    for i in range(2):
        seats.append(create_seat(f"{row_id}-gap2-{i}", 0, row_id, grades_map['B'], "empty"))

    # Block C (Right)
    for i in range(layout[2]):
        seats.append(create_seat(f"{row_id}-{current_seat_num}", current_seat_num, row_id, grades_map['C']))
        current_seat_num += 1
        
    return {
        "rowId": row_id,
        "rowName": f"{row_id}열",
        "grade": grades_map['B'], 
        "seats": seats
    }

def main():
    venue = {
        "venueId": "charlotte-theater",
        "venueName": "Charlotte Theater",
        "venueType": "theater",
        "totalSeats": 0,
        "grades": [
            {"grade": "OP", "color": "#A855F7", "price": 170000},  # Purple
            {"grade": "VIP", "color": "#EC4899", "price": 170000}, # Pink
            {"grade": "R", "color": "#EAB308", "price": 140000},   # Yellow
            {"grade": "S", "color": "#3B82F6", "price": 110000},   # Blue
            {"grade": "A", "color": "#22C55E", "price": 80000},    # Green
        ],
        "sections": []
    }
    
    rows = []
    
    # 1. OP Rows
    # OP is usually just 1 or 2 rows at the very front.
    # Let's make it 2 rows.
    for i, r_id in enumerate(["OP"]):
        # A=4, B=8, C=4
        row = create_row(r_id, [4, 8, 4], {'A': 'OP', 'B': 'OP', 'C': 'OP'})
        rows.append(row)

    # 2. Main Rows (1-21)
    for i in range(1, 22):
        r_id = str(i)
        
        # Curve Effect:
        # Rows 1-3: Narrower
        # Rows 4-21: Standard
        
        if i == 1:
            layout = [10, 14, 10]
        elif i == 2:
            layout = [11, 14, 11]
        elif i == 3:
            layout = [11, 15, 11]
        else:
            layout = [12, 16, 12]

        # Grade Distribution logic
        # OP is handled above.
        # Row 1-7: All VIP (Pink)
        # Row 8-10: Center VIP, Side VIP (or R?) -> Let's keep VIP to match 'lots of pink'
        # Row 11-12: Center VIP, Side R
        # Row 13-14: Center R, Side R
        # Row 15-18: Center S, Side S
        # Row 19-21: Center A, Side A
        
        g_center = "VIP"
        g_side = "VIP"
        
        if i > 7:
            # Start introducing R on sides?
            # From the image, pink dominates the front half.
            pass
            
        if i > 10:
            g_side = "R"
            g_center = "VIP" # Center still VIP for a bit
            
        if i > 12:
            g_center = "R" # Now Center becomes R too
            g_side = "R"
            
        if i > 15:
            # Transitions to S
            g_center = "S"
            g_side = "S"
            
        if i > 19:
            # Transitions to A
            g_center = "A"
            g_side = "A"

        # Special case: Image shows some "mixed" rows or specific patterns.
        # But this approximation should be good enough for "7-B UI Change".
        
        row = create_row(r_id, layout, {'A': g_side, 'B': g_center, 'C': g_side})
        rows.append(row)

    venue["sections"] = [{
        "sectionId": "1F",
        "sectionName": "1층",
        "rows": rows
    }]
    
    # Count seats
    count = 0
    for s in venue["sections"]:
        for r in s["rows"]:
            for seat in r["seats"]:
                if seat["status"] != "empty":
                    count += 1
    venue["totalSeats"] = count

    with open('apps/web/data/venues/sample-theater.json', 'w', encoding='utf-8') as f:
        json.dump(venue, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
