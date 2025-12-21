
import requests
import json
import time

BASE_URL = "http://localhost:3000/api"
SEAT_IDS = ["C-8", "C-9", "C-10"]
SEATS_PAYLOAD = [
    {"seatId": "C-8", "price": 120000, "grade": "R", "seatNumber": 8, "row": "C"},
    {"seatId": "C-9", "price": 120000, "grade": "R", "seatNumber": 9, "row": "C"},
    {"seatId": "C-10", "price": 120000, "grade": "R", "seatNumber": 10, "row": "C"}
]

PAYLOAD = {
    "performanceId": "perf-1",
    "seats": SEATS_PAYLOAD,
    "userId": "user-test-cycle",
    "date": "2024-12-25",
    "time": "19:00"
}

def check_seats(expected_status):
    print(f"\n[Check] Expecting {SEAT_IDS} to be {expected_status}")
    res = requests.get(f"{BASE_URL}/seats/perf-1")
    if res.status_code != 200:
        print("Failed to get seats")
        return False
    
    data = res.json()['seats']
    all_match = True
    for sid in SEAT_IDS:
        actual = data.get(sid, 'available')
        print(f"  Seat {sid}: {actual}")
        if actual != expected_status:
            all_match = False
    
    if all_match:
        print("  -> MATCH")
    else:
        print("  -> MISMATCH")
    return all_match

def main():
    print("=== STARTING FULL CYCLE VERIFICATION ===")
    
    # 1. First Hold
    print("\n1. Holding seats...")
    res = requests.post(f"{BASE_URL}/holdings", json=PAYLOAD)
    if res.status_code != 200:
        print("First hold failed:", res.text)
        return
    
    holding_id_1 = res.json()['holdingId']
    print(f"  Holding ID: {holding_id_1}")
    
    if not check_seats('holding'): return

    # 2. Release
    print("\n2. Releasing holding...")
    res = requests.delete(f"{BASE_URL}/holdings/{holding_id_1}")
    print(f"  Status: {res.status_code}")
    
    if not check_seats('available'): return
    
    # 3. Second Hold (Re-booking)
    print("\n3. Re-Holding seats (Test for issue)...")
    res = requests.post(f"{BASE_URL}/holdings", json=PAYLOAD)
    if res.status_code != 200:
        print("Second hold failed:", res.text)
        return
        
    holding_id_2 = res.json()['holdingId']
    print(f"  Holding ID: {holding_id_2}")
    
    if not check_seats('holding'): 
        print("!! FAILURE: Could not verify re-holding !!")
        return
        
    print("\n=== SUCCESS: Full cycle completed without errors ===")
    
    # Cleanup
    requests.delete(f"{BASE_URL}/holdings/{holding_id_2}")

if __name__ == "__main__":
    main()
