import boto3
import json
import os
from decimal import Decimal

# Helper to convert float to Decimal for DynamoDB
def float_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: float_to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [float_to_decimal(v) for v in obj]
    return obj

def migrate_venue():
    # 1. Load JSON
    venue_file = os.path.join('apps', 'web', 'data', 'venues', 'charlotte-theater.json')
    if not os.path.exists(venue_file):
        print(f"Error: {venue_file} not found.")
        return

    with open(venue_file, 'r', encoding='utf-8') as f:
        venue_data = json.load(f)

    # Convert prices or any floats to Decimal
    venue_data = float_to_decimal(venue_data)

    # 2. Setup Boto3 with Profile (Assuming the profile from bedrock-project-guide.md)
    # Using specific profile and region as per guides
    try:
        session = boto3.Session(profile_name='BedrockDevUser-hyebom', region_name='ap-northeast-2')
        dynamodb = session.resource('dynamodb')
        table_name = 'MegaTicket-Venues'
        table = dynamodb.Table(table_name)

        print(f"Migrating {venue_data['venueName']} to table {table_name}...")

        # 3. Put Item
        # We use venueId as PK
        table.put_item(Item=venue_data)

        print("Successfully migrated venue data to DynamoDB.")
    except Exception as e:
        print(f"Error migrating to DynamoDB: {e}")
        print("\nNote: Make sure the table 'MegaTicket-Venues' exists with Partition Key 'venueId' (String).")

if __name__ == "__main__":
    migrate_venue()
