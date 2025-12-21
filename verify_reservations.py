import json
import os

RESERVATIONS_FILE = r'c:\bedrock_space\apps\web\data\reservations.json'
HOLDINGS_FILE = r'c:\bedrock_space\apps\web\data\seat-holdings.json'

def verify():
    if not os.path.exists(RESERVATIONS_FILE):
        print("Reservations file not found.")
        return

    with open(RESERVATIONS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Total Reservations: {len(data['reservations'])}")

    mock_user_res = [r for r in data['reservations'] if r.get('userId') == 'mock-user-01']
    print(f"Mock User (mock-user-01) Reservations: {len(mock_user_res)}")
    for r in mock_user_res:
        print(f" - ID: {r.get('id') or r.get('reservationId')}, Title: {r.get('performanceTitle')}, Status: {r.get('status')}")

    # Check for F-9, F-10, F-11
    target_seats = {'F-9', 'F-10', 'F-11'}
    perf_id = 'perf-1'
    date = '2025-12-25'
    time = '19:00'

    confirmed = [r for r in data['reservations'] 
                 if r.get('performanceId') == perf_id 
                 and r.get('date') == date 
                 and r.get('time') == time
                 and r.get('status') == 'confirmed']
    
    print(f"\nConfirmed reservations for {perf_id} {date} {time}: {len(confirmed)}")
    
    found_seats = set()
    for r in confirmed:
        for s in r['seats']:
            sid = s.get('seatId') or f"{s.get('grade')}-{s.get('seatNumber')}" # Handle different structures if any
            found_seats.add(sid)
            print(f"  Reserved Seat: {sid} (User: {r.get('userId')})")

    print(f"\nChecking target seats {target_seats}:")
    for s in target_seats:
        status = 'Reserved' if s in found_seats else 'Available (NOT RESERVED)'
        print(f"  {s}: {status}")

if __name__ == '__main__':
    verify()
