
import json
import os

VENUE_PATH = r"c:\bedrock_space\apps\web\data\venues\sample-theater.json"

def rename_sections():
    if not os.path.exists(VENUE_PATH):
        print(f"Error: File not found at {VENUE_PATH}")
        return

    with open(VENUE_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # A->D, B->E, C->F mapping for 2nd floor
    mapping = {
        'A': 'D',
        'B': 'E',
        'C': 'F'
    }

    modified_count = 0
    
    for section in data.get('sections', []):
        if section.get('floor') == '2층':
            old_id = section.get('sectionId')
            if old_id in mapping:
                new_id = mapping[old_id]
                section['sectionId'] = new_id
                section['sectionName'] = f"{new_id}구역"
                print(f"Renaming Section {old_id} -> {new_id}")

                # Update seats
                for row in section.get('rows', []):
                    for seat in row.get('seats', []):
                        # Seat ID format: "2층-A-1-5" -> "2층-D-1-5"
                        parts = seat['seatId'].split('-')
                        if len(parts) == 4 and parts[1] == old_id:
                            parts[1] = new_id
                            seat['seatId'] = '-'.join(parts)
                            modified_count += 1
    
    with open(VENUE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Update complete. Modified {modified_count} seats.")

if __name__ == "__main__":
    rename_sections()
