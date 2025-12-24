#!/usr/bin/env python3
"""
Migration script to populate MongoDB with existing change orders from the frontend test data
"""

from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

# Test change orders data (from projectsData.ts)
change_orders = [
    {
        "id": "1-co-1",
        "projectId": 1,
        "title": "Additional Bathroom Fixtures",
        "description": "Customer requested upgraded fixtures:\n- High-end faucets for master bath\n- Rainfall showerhead\n- Custom vanity mirrors",
        "amount": 2850,
        "date": "2025-11-18",
        "status": "Approved",
        "type": "Change Order",
        "requestedBy": "Andrew Martinez",
        "paymentStatus": "Paid",
        "paidAmount": 2850,
        "paidDate": "2025-11-22"
    },
    {
        "id": "1-co-2",
        "projectId": 1,
        "title": "Progress Invoice #1 - Rough-In Complete",
        "description": "Invoice for rough-in work completed:\n- All plumbing lines installed\n- Gas lines connected\n- Fixtures stubbed out\n- Inspection scheduled",
        "amount": 8500,
        "date": "2025-11-20",
        "status": "Submitted",
        "type": "Invoice",
        "requestedBy": "Boulder Contractor",
        "paymentStatus": "Partially Paid",
        "paidAmount": 5000,
        "paidDate": "2025-11-21"
    },
    {
        "id": "1-co-3",
        "projectId": 1,
        "title": "Kitchen Sink Location Change",
        "description": "Move kitchen sink 2 feet to the left to accommodate new island design. Requires:\n- Rerouting drain line\n- Adjusting water supply lines\n- Additional labor",
        "amount": -450,
        "date": "2025-11-16",
        "status": "On Hold",
        "type": "Modification",
        "requestedBy": "Andrew Martinez",
        "paymentStatus": "Refunded",
        "paidAmount": 450,
        "paidDate": "2025-11-17"
    },
    {
        "id": "1-co-4",
        "projectId": 1,
        "title": "Materials Invoice - PEX Piping",
        "description": "Material costs for plumbing rough-in:\n- 250ft PEX-A tubing (red)\n- 250ft PEX-A tubing (blue)\n- Manifolds and fittings\n- Expansion tools rental",
        "amount": 1250,
        "date": "2025-11-15",
        "status": "Approved",
        "type": "Invoice",
        "requestedBy": "Boulder Contractor",
        "paymentStatus": "Unpaid"
    },
    {
        "id": "1-co-6",
        "projectId": 1,
        "title": "Initial Plumbing Deposit - 2024",
        "description": "Initial deposit for plumbing project work in 2024",
        "amount": 4500,
        "date": "2024-03-15",
        "status": "Approved",
        "type": "Invoice",
        "requestedBy": "Boulder Contractor",
        "paymentStatus": "Paid",
        "paidAmount": 4500,
        "paidDate": "2024-03-20"
    },
    {
        "id": "1-co-7",
        "projectId": 1,
        "title": "Emergency Leak Repair - 2023",
        "description": "Emergency repair for basement pipe leak in 2023",
        "amount": 1800,
        "date": "2023-08-10",
        "status": "Approved",
        "type": "Change Order",
        "requestedBy": "Andrew Martinez",
        "paymentStatus": "Paid",
        "paidAmount": 1800,
        "paidDate": "2023-08-12"
    }
]

async def migrate():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connected to MongoDB: {db_name}")
    
    # Clear existing change orders
    result = await db.change_orders.delete_many({})
    print(f"Deleted {result.deleted_count} existing change orders")
    
    # Insert test data
    result = await db.change_orders.insert_many(change_orders)
    print(f"Inserted {len(result.inserted_ids)} change orders")
    
    # Verify
    count = await db.change_orders.count_documents({})
    print(f"Total change orders in database: {count}")
    
    client.close()
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
