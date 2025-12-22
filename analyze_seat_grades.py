
import json

def analyze_seat_map(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Structure: grade -> section -> rows (min-max)
    grade_map = {}

    for section in data['sections']:
        section_name = section['sectionName'] # e.g., 'A구역'
        for row in section['rows']:
            try:
                row_num = int(row['rowId'])
                sort_key = row_num
            except ValueError:
                row_num = row['rowId']
                sort_key = -1 if row['rowId'] == 'OP' else 0 # OP comes first
            
            grade = row['grade']
            
            if grade not in grade_map:
                grade_map[grade] = {}
            if section_name not in grade_map[grade]:
                grade_map[grade][section_name] = []
            
            # Store tuple (sort_key, display_value)
            grade_map[grade][section_name].append((sort_key, row_num))

    for grade, sections in grade_map.items():
        print(f"\n[{grade}석]")
        for sec, rows in sections.items():
            # Sort by sort_key
            rows.sort(key=lambda x: x[0])
            
            ranges = []
            if not rows: continue
            
            # Simple range collapsing only for integers
            current_range_start = rows[0]
            current_range_end = rows[0]
            
            def format_range(start_t, end_t):
                if start_t[0] == end_t[0]:
                    return f"{start_t[1]}열"
                # If both are integers and consecutive
                if isinstance(start_t[1], int) and isinstance(end_t[1], int):
                     return f"{start_t[1]}~{end_t[1]}열"
                # Fallback
                return f"{start_t[1]}...{end_t[1]}열"

            ranges_str = []
            
            # Group consecutive integers
            int_groups = []
            special_rows = []
            
            for r in rows:
                if isinstance(r[1], int):
                    if not int_groups:
                        int_groups.append([r[1]])
                    else:
                        last_group = int_groups[-1]
                        if r[1] == last_group[-1] + 1:
                            last_group.append(r[1])
                        else:
                            int_groups.append([r[1]])
                else:
                    special_rows.append(r[1])
            
            parts = []
            for r in special_rows:
                parts.append(f"{r}열")
            
            for group in int_groups:
                if len(group) == 1:
                    parts.append(f"{group[0]}열")
                else:
                    parts.append(f"{group[0]}~{group[-1]}열")
            
            print(f"  - {sec}: {', '.join(parts)}")

analyze_seat_map('c:/bedrock_space/apps/web/data/venues/sample-theater.json')
