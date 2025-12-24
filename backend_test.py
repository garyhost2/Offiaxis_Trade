#!/usr/bin/env python3
"""
Backend API Testing for Profit & Loss Endpoints
Tests all 6 P&L API endpoints with comprehensive scenarios
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Backend URL from frontend/.env
BASE_URL = "https://timesheet-hub-12.preview.emergentagent.com/api"

class ProfitLossAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_results = []
        self.created_expenses = []
        self.created_income = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        print(f"   {message}")
        if details:
            print(f"   Details: {details}")
        print()

    def test_create_expenses(self):
        """Test creating expenses with various categories"""
        print("=== Testing Expense Creation ===")
        
        # Test data for different expense categories
        expenses_data = [
            {
                "amount": 150.00,
                "category": "material",
                "date": datetime.now().isoformat(),
                "vendor": "Home Depot",
                "note": "Electrical supplies for kitchen remodel",
                "jobType": "remodel"
            },
            {
                "amount": 300.00,
                "category": "labor",
                "date": datetime.now().isoformat(),
                "vendor": "John's Electric",
                "note": "Electrician work - 4 hours",
                "jobType": "service_call"
            },
            {
                "amount": 75.00,
                "category": "warranty",
                "date": datetime.now().isoformat(),
                "note": "Callback for outlet repair",
                "jobType": "warranty"
            },
            {
                "amount": 0,  # Will be calculated from miles * ratePerMile
                "category": "mileage",
                "date": datetime.now().isoformat(),
                "miles": 50.0,
                "ratePerMile": 0.67,
                "note": "Travel to job site",
                "jobType": "service_call"
            },
            {
                "amount": 25.00,
                "category": "misc",
                "date": datetime.now().isoformat(),
                "note": "Parking fees",
                "jobType": "service_call"
            }
        ]
        
        for i, expense_data in enumerate(expenses_data):
            try:
                response = requests.post(
                    f"{self.base_url}/profit-loss/expenses",
                    json=expense_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    expense = response.json()
                    self.created_expenses.append(expense)
                    
                    # Special validation for mileage calculation
                    if expense_data["category"] == "mileage":
                        expected_amount = expense_data["miles"] * expense_data["ratePerMile"]
                        if abs(expense["amount"] - expected_amount) < 0.01:
                            self.log_result(
                                f"Create {expense_data['category']} expense",
                                True,
                                f"Created successfully with calculated amount ${expected_amount}",
                                f"ID: {expense['id']}"
                            )
                        else:
                            self.log_result(
                                f"Create {expense_data['category']} expense",
                                False,
                                f"Mileage calculation incorrect. Expected: ${expected_amount}, Got: ${expense['amount']}"
                            )
                    else:
                        self.log_result(
                            f"Create {expense_data['category']} expense",
                            True,
                            f"Created successfully with amount ${expense['amount']}",
                            f"ID: {expense['id']}"
                        )
                else:
                    self.log_result(
                        f"Create {expense_data['category']} expense",
                        False,
                        f"HTTP {response.status_code}: {response.text}"
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Create {expense_data['category']} expense",
                    False,
                    f"Exception: {str(e)}"
                )

    def test_create_income(self):
        """Test creating income entries"""
        print("=== Testing Income Creation ===")
        
        income_data = [
            {
                "amount": 1200.00,
                "type": "invoice",
                "date": datetime.now().isoformat(),
                "note": "Kitchen remodel - final payment",
                "jobType": "remodel"
            },
            {
                "amount": 350.00,
                "type": "service_call",
                "date": datetime.now().isoformat(),
                "note": "Emergency outlet repair",
                "jobType": "service_call"
            }
        ]
        
        for income_item in income_data:
            try:
                response = requests.post(
                    f"{self.base_url}/profit-loss/income",
                    json=income_item,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    income = response.json()
                    self.created_income.append(income)
                    self.log_result(
                        f"Create {income_item['type']} income",
                        True,
                        f"Created successfully with amount ${income['amount']}",
                        f"ID: {income['id']}"
                    )
                else:
                    self.log_result(
                        f"Create {income_item['type']} income",
                        False,
                        f"HTTP {response.status_code}: {response.text}"
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Create {income_item['type']} income",
                    False,
                    f"Exception: {str(e)}"
                )

    def test_get_expenses(self):
        """Test retrieving expenses with filters"""
        print("=== Testing Get Expenses ===")
        
        try:
            # Test without filters
            response = requests.get(f"{self.base_url}/profit-loss/expenses")
            
            if response.status_code == 200:
                expenses = response.json()
                self.log_result(
                    "Get all expenses",
                    True,
                    f"Retrieved {len(expenses)} expenses",
                    f"Expected at least {len(self.created_expenses)} expenses"
                )
                
                # Verify sorting (newest first)
                if len(expenses) >= 2:
                    dates = [datetime.fromisoformat(exp['date'].replace('Z', '+00:00')) for exp in expenses[:2]]
                    if dates[0] >= dates[1]:
                        self.log_result(
                            "Expense sorting",
                            True,
                            "Expenses are sorted by date (newest first)"
                        )
                    else:
                        self.log_result(
                            "Expense sorting",
                            False,
                            "Expenses are not properly sorted by date"
                        )
            else:
                self.log_result(
                    "Get all expenses",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Get all expenses",
                False,
                f"Exception: {str(e)}"
            )

    def test_get_income(self):
        """Test retrieving income with filters"""
        print("=== Testing Get Income ===")
        
        try:
            response = requests.get(f"{self.base_url}/profit-loss/income")
            
            if response.status_code == 200:
                income_entries = response.json()
                self.log_result(
                    "Get all income",
                    True,
                    f"Retrieved {len(income_entries)} income entries",
                    f"Expected at least {len(self.created_income)} entries"
                )
            else:
                self.log_result(
                    "Get all income",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Get all income",
                False,
                f"Exception: {str(e)}"
            )

    def test_summary_calculation(self):
        """Test profit/loss summary calculation"""
        print("=== Testing Summary Calculation ===")
        
        try:
            response = requests.get(f"{self.base_url}/profit-loss/summary")
            
            if response.status_code == 200:
                summary = response.json()
                
                # Verify required fields
                required_fields = ["totalIncome", "totalExpenses", "profit", "status"]
                missing_fields = [field for field in required_fields if field not in summary]
                
                if not missing_fields:
                    # Verify profit calculation
                    calculated_profit = summary["totalIncome"] - summary["totalExpenses"]
                    if abs(summary["profit"] - calculated_profit) < 0.01:
                        self.log_result(
                            "Summary profit calculation",
                            True,
                            f"Profit correctly calculated: ${summary['profit']:.2f}",
                            f"Income: ${summary['totalIncome']:.2f}, Expenses: ${summary['totalExpenses']:.2f}"
                        )
                    else:
                        self.log_result(
                            "Summary profit calculation",
                            False,
                            f"Profit calculation incorrect. Expected: ${calculated_profit:.2f}, Got: ${summary['profit']:.2f}"
                        )
                    
                    # Verify status
                    expected_status = "profitable" if summary["profit"] >= 0 else "at_loss"
                    if summary["status"] == expected_status:
                        self.log_result(
                            "Summary status",
                            True,
                            f"Status correctly set to '{summary['status']}'"
                        )
                    else:
                        self.log_result(
                            "Summary status",
                            False,
                            f"Status incorrect. Expected: '{expected_status}', Got: '{summary['status']}'"
                        )
                else:
                    self.log_result(
                        "Summary fields",
                        False,
                        f"Missing required fields: {missing_fields}"
                    )
            else:
                self.log_result(
                    "Get summary",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Get summary",
                False,
                f"Exception: {str(e)}"
            )

    def test_expense_breakdown(self):
        """Test expense breakdown by category"""
        print("=== Testing Expense Breakdown ===")
        
        try:
            response = requests.get(f"{self.base_url}/profit-loss/breakdown")
            
            if response.status_code == 200:
                breakdown = response.json()
                
                if isinstance(breakdown, list):
                    # Verify all 5 categories are present
                    expected_categories = ["labor", "material", "warranty", "mileage", "misc"]
                    found_categories = [item["category"] for item in breakdown]
                    
                    all_categories_present = all(cat in found_categories for cat in expected_categories)
                    
                    if all_categories_present:
                        self.log_result(
                            "Breakdown categories",
                            True,
                            "All 5 expense categories present in breakdown"
                        )
                    else:
                        missing = [cat for cat in expected_categories if cat not in found_categories]
                        self.log_result(
                            "Breakdown categories",
                            False,
                            f"Missing categories: {missing}"
                        )
                    
                    # Verify percentages add up to 100% (or close to it)
                    total_percentage = sum(item["percentage"] for item in breakdown)
                    if abs(total_percentage - 100.0) < 1.0:  # Allow small rounding errors
                        self.log_result(
                            "Breakdown percentages",
                            True,
                            f"Percentages add up to {total_percentage:.1f}%"
                        )
                    else:
                        self.log_result(
                            "Breakdown percentages",
                            False,
                            f"Percentages add up to {total_percentage:.1f}%, expected ~100%"
                        )
                    
                    # Verify mileage calculation in breakdown
                    mileage_item = next((item for item in breakdown if item["category"] == "mileage"), None)
                    if mileage_item:
                        expected_mileage_amount = 50.0 * 0.67  # From our test data
                        if abs(mileage_item["amount"] - expected_mileage_amount) < 0.01:
                            self.log_result(
                                "Breakdown mileage calculation",
                                True,
                                f"Mileage amount correctly calculated: ${mileage_item['amount']:.2f}"
                            )
                        else:
                            self.log_result(
                                "Breakdown mileage calculation",
                                False,
                                f"Mileage amount incorrect. Expected: ${expected_mileage_amount:.2f}, Got: ${mileage_item['amount']:.2f}"
                            )
                else:
                    self.log_result(
                        "Breakdown format",
                        False,
                        "Breakdown should return an array of objects"
                    )
            else:
                self.log_result(
                    "Get breakdown",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Get breakdown",
                False,
                f"Exception: {str(e)}"
            )

    def test_date_filtering(self):
        """Test date range filtering"""
        print("=== Testing Date Filtering ===")
        
        try:
            # Create an expense with a specific past date
            past_date = (datetime.now() - timedelta(days=30)).isoformat()
            past_expense = {
                "amount": 100.00,
                "category": "misc",
                "date": past_date,
                "note": "Past expense for filtering test"
            }
            
            response = requests.post(
                f"{self.base_url}/profit-loss/expenses",
                json=past_expense,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                # Test filtering with date range
                start_date = (datetime.now() - timedelta(days=7)).isoformat()
                end_date = datetime.now().isoformat()
                
                response = requests.get(
                    f"{self.base_url}/profit-loss/expenses",
                    params={
                        "startDate": start_date,
                        "endDate": end_date
                    }
                )
                
                if response.status_code == 200:
                    filtered_expenses = response.json()
                    
                    # Check if the past expense is excluded
                    past_expense_found = any(
                        exp.get("note") == "Past expense for filtering test" 
                        for exp in filtered_expenses
                    )
                    
                    if not past_expense_found:
                        self.log_result(
                            "Date range filtering",
                            True,
                            f"Date filtering working - {len(filtered_expenses)} expenses in range"
                        )
                    else:
                        self.log_result(
                            "Date range filtering",
                            False,
                            "Past expense incorrectly included in filtered results"
                        )
                else:
                    self.log_result(
                        "Date range filtering",
                        False,
                        f"HTTP {response.status_code}: {response.text}"
                    )
            else:
                self.log_result(
                    "Create past expense for filtering",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result(
                "Date range filtering",
                False,
                f"Exception: {str(e)}"
            )

    def test_error_cases(self):
        """Test error handling for invalid requests"""
        print("=== Testing Error Cases ===")
        
        # Test missing required fields
        invalid_expense = {
            "category": "labor"
            # Missing amount and date
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/profit-loss/expenses",
                json=invalid_expense,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 422:  # FastAPI validation error
                self.log_result(
                    "Invalid expense validation",
                    True,
                    "Correctly rejected expense with missing required fields"
                )
            else:
                self.log_result(
                    "Invalid expense validation",
                    False,
                    f"Expected 422 validation error, got {response.status_code}"
                )
                
        except Exception as e:
            self.log_result(
                "Invalid expense validation",
                False,
                f"Exception: {str(e)}"
            )

    def run_all_tests(self):
        """Run all test scenarios"""
        print("🚀 Starting Profit & Loss API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)
        
        # Run test scenarios in order
        self.test_create_expenses()
        self.test_create_income()
        self.test_get_expenses()
        self.test_get_income()
        self.test_summary_calculation()
        self.test_expense_breakdown()
        self.test_date_filtering()
        self.test_error_cases()
        
        # Summary
        print("=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = ProfitLossAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)