#!/usr/bin/env python3
"""
Targeted test for mileage calculation
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://timesheet-hub-12.preview.emergentagent.com/api"

def test_mileage_calculation():
    """Test mileage calculation specifically"""
    
    # Create a unique mileage expense
    mileage_expense = {
        "amount": 0,  # Will be calculated
        "category": "mileage",
        "date": datetime.now().isoformat(),
        "miles": 25.0,
        "ratePerMile": 0.60,
        "note": "Test mileage calculation - unique",
        "jobType": "service_call"
    }
    
    print("Creating mileage expense...")
    response = requests.post(
        f"{BASE_URL}/profit-loss/expenses",
        json=mileage_expense,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        expense = response.json()
        expected_amount = 25.0 * 0.60  # $15.00
        print(f"✅ Expense created with amount: ${expense['amount']}")
        print(f"Expected amount: ${expected_amount}")
        
        if abs(expense['amount'] - expected_amount) < 0.01:
            print("✅ Mileage calculation in CREATE is correct")
        else:
            print("❌ Mileage calculation in CREATE is incorrect")
        
        # Now test the breakdown
        print("\nTesting breakdown...")
        breakdown_response = requests.get(f"{BASE_URL}/profit-loss/breakdown")
        
        if breakdown_response.status_code == 200:
            breakdown = breakdown_response.json()
            mileage_item = next((item for item in breakdown if item["category"] == "mileage"), None)
            
            if mileage_item:
                print(f"Breakdown mileage total: ${mileage_item['amount']}")
                print("Note: This includes all mileage expenses in the database")
                
                # Check if our specific expense is included correctly
                expenses_response = requests.get(f"{BASE_URL}/profit-loss/expenses")
                if expenses_response.status_code == 200:
                    expenses = expenses_response.json()
                    our_expense = next((exp for exp in expenses if exp.get("note") == "Test mileage calculation - unique"), None)
                    
                    if our_expense:
                        print(f"Our expense in database: ${our_expense['amount']}")
                        if abs(our_expense['amount'] - expected_amount) < 0.01:
                            print("✅ Our expense is stored correctly in database")
                        else:
                            print("❌ Our expense is stored incorrectly in database")
                    else:
                        print("❌ Could not find our expense in database")
            else:
                print("❌ No mileage category found in breakdown")
        else:
            print(f"❌ Breakdown request failed: {breakdown_response.status_code}")
    else:
        print(f"❌ Create expense failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_mileage_calculation()