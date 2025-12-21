
import requests
import json
import time

BASE_URL = "http://localhost:3000/api"
SEATS = [{"seatId": "D-8", "price": 120000, "grade": "R", "seatNumber": 8, "row": "D"}]
PAYLOAD = {
    "performanceId": "perf-1",
    "seats": SEATS,
    "userId": "user-test-repeat",
    "date": "2024-12-25",
    "time": "19:00"
}

def check_seat_status(expected_status):
    print(f"\nChecking seat status. Expecting: {expected_status}")
    res = requests.get(f"{BASE_URL}/seats/perf-1")
    seats = res.json()['seats']
    actual_status = seats.get('D-8', 'available') # Default available
    print(f"Actual status: {actual_status}")
    if actual_status != expected_status:
        print(f"Mismatch! Expected {expected_status}, got {actual_status}")
        return False
    return True

def run_cycle(iteration):
    print(f"\n=== Cycle {iteration} ===")
    
    # 1. Create Holding
    print("Action: Creating Holding...")
    res = requests.post(f"{BASE_URL}/holdings", json=PAYLOAD)
    if res.status_code != 200:
        print(f"Failed to create holding: {res.text}")
        return False
    holding_id = res.json()['holdingId']
    print(f"Created Holding ID: {holding_id}")
    
    # Verify
    if not check_seat_status('holding'): return False
    
    # 2. Release Holding
    print("Action: Releasing Holding...")
    res_del = requests.delete(f"{BASE_URL}/holdings/{holding_id}")
    if res_del.status_code != 200:
        print(f"Failed to release holding: {res_del.text}")
        return False
    print("Released Holding")
    
    # Verify
    if not check_seat_status('available'): return False
    
    return True

def main():
    for i in range(1, 4):
        if not run_cycle(i):
            print("\nFAILED at cycle", i)
            break
    else:
        print("\nSUCCESS: All cycles passed.")

if __name__ == "__main__":
    main()
