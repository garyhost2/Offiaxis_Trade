from fastapi import FastAPI, APIRouter, Query, File, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime
import base64
from permit_extraction import extract_permit_data
from site_notes_ai import process_site_notes


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Profit & Loss Models
class ExpenseCreate(BaseModel):
    projectId: Optional[int] = None
    amount: float
    category: Literal["labor", "material", "warranty", "mileage", "misc"]
    jobType: Optional[Literal["service_call", "new_construction", "remodel", "warranty", "emergency"]] = None
    vendor: Optional[str] = None
    date: datetime
    note: Optional[str] = None
    miles: Optional[float] = None
    ratePerMile: Optional[float] = None
    source: Optional[Literal["manual", "photo", "voice"]] = "manual"

class Expense(ExpenseCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class IncomeCreate(BaseModel):
    projectId: Optional[int] = None
    amount: float
    type: Literal["invoice", "change_order", "service_call", "other"]
    jobType: Optional[Literal["service_call", "new_construction", "remodel", "warranty", "emergency"]] = None
    date: datetime
    note: Optional[str] = None

class Income(IncomeCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# Change Order Models
class PaymentStatusLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime
    oldStatus: str
    newStatus: str
    note: Optional[str] = None
    changedBy: Optional[str] = None
    paidAmount: Optional[float] = None

class StatusLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime
    oldStatus: str
    newStatus: str
    note: Optional[str] = None
    changedBy: Optional[str] = None

class ChangeOrderCreate(BaseModel):
    projectId: int
    title: str
    description: Optional[str] = None
    amount: float
    date: str
    status: Literal['Submitted', 'In Review', 'Approved', 'Rejected', 'On Hold']
    type: Literal['Invoice', 'Change Order', 'Modification']
    requestedBy: str
    fileName: Optional[str] = None
    fileData: Optional[str] = None
    convertToSigned: Optional[bool] = None
    paymentStatus: Optional[Literal['Unpaid', 'Partially Paid', 'Paid', 'Refunded']] = 'Unpaid'
    paidAmount: Optional[float] = None
    paidDate: Optional[str] = None
    statusLogs: Optional[List[StatusLog]] = []
    paymentStatusLogs: Optional[List[PaymentStatusLog]] = []

class ChangeOrder(ChangeOrderCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# Permit Models
class PermitExtractionRequest(BaseModel):
    imageBase64: str

class PermitExtractionResponse(BaseModel):
    permitNumber: Optional[str]
    issueDate: Optional[str]
    expirationDate: Optional[str]
    fees: Optional[str]
    success: bool
    error: Optional[str] = None
    raw_response: Optional[str] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Profit & Loss Endpoints

@api_router.post("/profit-loss/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate):
    expense_data = expense.dict()
    
    # Calculate mileage amount if category is mileage and miles/ratePerMile are provided
    if expense_data.get("category") == "mileage" and expense_data.get("miles") and expense_data.get("ratePerMile"):
        expense_data["amount"] = expense_data["miles"] * expense_data["ratePerMile"]
    
    expense_obj = Expense(**expense_data)
    expense_dict = expense_obj.dict()
    _ = await db.expenses.insert_one(expense_dict)
    return expense_obj

@api_router.post("/profit-loss/income", response_model=Income)
async def create_income(income: IncomeCreate):
    income_obj = Income(**income.dict())
    income_dict = income_obj.dict()
    _ = await db.income.insert_one(income_dict)
    return income_obj

@api_router.get("/profit-loss/expenses")
async def get_expenses(
    projectId: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    jobType: Optional[str] = Query(None),
):
    query = {}
    if projectId and projectId != "all":
        try:
            query["projectId"] = int(projectId)
        except ValueError:
            query["projectId"] = projectId
    if startDate and endDate:
        query["date"] = {
            "$gte": datetime.fromisoformat(startDate.replace('Z', '+00:00')),
            "$lte": datetime.fromisoformat(endDate.replace('Z', '+00:00'))
        }
    if jobType and jobType != "all":
        query["jobType"] = jobType
    
    expenses = await db.expenses.find(query).sort("date", -1).to_list(1000)
    # Remove MongoDB _id field to avoid serialization issues
    for expense in expenses:
        expense.pop('_id', None)
    return expenses

@api_router.get("/profit-loss/income")
async def get_income(
    projectId: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    jobType: Optional[str] = Query(None),
):
    query = {}
    if projectId and projectId != "all":
        try:
            query["projectId"] = int(projectId)
        except ValueError:
            query["projectId"] = projectId
    if startDate and endDate:
        query["date"] = {
            "$gte": datetime.fromisoformat(startDate.replace('Z', '+00:00')),
            "$lte": datetime.fromisoformat(endDate.replace('Z', '+00:00'))
        }
    if jobType and jobType != "all":
        query["jobType"] = jobType
    
    income_entries = await db.income.find(query).sort("date", -1).to_list(1000)
    # Remove MongoDB _id field to avoid serialization issues
    for income in income_entries:
        income.pop('_id', None)
    return income_entries

@api_router.get("/profit-loss/summary")
async def get_profit_loss_summary(
    projectId: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    jobType: Optional[str] = Query(None),
):
    # Build query
    query = {}
    if projectId and projectId != "all":
        try:
            query["projectId"] = int(projectId)
        except ValueError:
            query["projectId"] = projectId
    if startDate and endDate:
        query["date"] = {
            "$gte": datetime.fromisoformat(startDate.replace('Z', '+00:00')),
            "$lte": datetime.fromisoformat(endDate.replace('Z', '+00:00'))
        }
    if jobType and jobType != "all":
        query["jobType"] = jobType
    
    # Calculate totals
    expenses = await db.expenses.find(query).to_list(1000)
    income_entries = await db.income.find(query).to_list(1000)
    
    total_expenses = sum([exp.get("amount", 0) for exp in expenses])
    total_income = sum([inc.get("amount", 0) for inc in income_entries])
    profit = total_income - total_expenses
    
    return {
        "totalIncome": total_income,
        "totalExpenses": total_expenses,
        "profit": profit,
        "status": "profitable" if profit >= 0 else "at_loss"
    }

@api_router.get("/projects")
async def get_projects():
    # Return real projects matching the frontend projectsData.ts
    # In a production app, this would fetch from a MongoDB projects collection
    # For now, returning the structure that matches the existing projects
    projects = [
        {"id": 1, "name": "Andrew Martinez"},
        {"id": 2, "name": "Barbara Thompson"},
        {"id": 3, "name": "Carlos Rodriguez"},
        {"id": 4, "name": "Diana Foster"},
        {"id": 5, "name": "Edward Chen"},
        {"id": 6, "name": "Fiona O'Neill"},
        {"id": 7, "name": "Gabriel Santos"},
        {"id": 8, "name": "Hannah Kim"},
        {"id": 9, "name": "Isaac Johnson"},
        {"id": 10, "name": "Jessica Williams"},
        {"id": 11, "name": "Kevin Anderson"},
        {"id": 12, "name": "Laura Davis"},
        {"id": 13, "name": "Michael Brown"},
        {"id": 14, "name": "Natalie Garcia"},
        {"id": 15, "name": "Oliver Martinez"},
        {"id": 16, "name": "Patricia Wilson"},
        {"id": 17, "name": "Quincy Roberts"},
        {"id": 18, "name": "Rachel Taylor"},
        {"id": 19, "name": "Samuel Moore"},
        {"id": 20, "name": "Theresa Jackson"},
        {"id": 21, "name": "Ursula Harris"},
        {"id": 22, "name": "Victor Nguyen"},
        {"id": 23, "name": "Wendy Clark"},
        {"id": 24, "name": "Xavier Lopez"},
        {"id": 25, "name": "Yolanda Martinez"},
        {"id": 26, "name": "Zachary White"},
        {"id": 27, "name": "Aaron Bennett"},
        {"id": 28, "name": "Brenda Coleman"},
        {"id": 29, "name": "Christopher Diaz"},
        {"id": 30, "name": "Deborah Ellis"},
        {"id": 31, "name": "Eric Foster"},
        {"id": 32, "name": "Frances Gray"},
        {"id": 33, "name": "George Hughes"},
        {"id": 34, "name": "Helen Irving"},
        {"id": 35, "name": "Ian Jenkins"},
        {"id": 36, "name": "Julia Kelly"},
        {"id": 37, "name": "Keith Lambert"},
        {"id": 38, "name": "Linda Morgan"},
        {"id": 39, "name": "Marcus Nelson"},
        {"id": 40, "name": "Nina Owens"},
        {"id": 41, "name": "Oscar Patel"},
        {"id": 42, "name": "Paula Quinn"},
        {"id": 43, "name": "Ryan Stewart"},
        {"id": 44, "name": "Sandra Turner"},
        {"id": 45, "name": "Timothy Underwood"},
        {"id": 46, "name": "Veronica Walsh"},
    ]
    return projects

@api_router.get("/profit-loss/breakdown")
async def get_expense_breakdown(
    projectId: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    jobType: Optional[str] = Query(None),
):
    # Build query
    query = {}
    if projectId and projectId != "all":
        try:
            query["projectId"] = int(projectId)
        except ValueError:
            query["projectId"] = projectId
    if startDate and endDate:
        query["date"] = {
            "$gte": datetime.fromisoformat(startDate.replace('Z', '+00:00')),
            "$lte": datetime.fromisoformat(endDate.replace('Z', '+00:00'))
        }
    if jobType and jobType != "all":
        query["jobType"] = jobType
    
    expenses = await db.expenses.find(query).to_list(1000)
    
    # Calculate breakdown by category
    breakdown = {
        "labor": 0,
        "material": 0,
        "warranty": 0,
        "mileage": 0,
        "misc": 0
    }
    
    for expense in expenses:
        category = expense.get("category", "misc")
        amount = expense.get("amount", 0)
        
        breakdown[category] += amount
    
    total = sum(breakdown.values())
    
    # Calculate percentages
    breakdown_with_percentage = []
    for category, amount in breakdown.items():
        percentage = (amount / total * 100) if total > 0 else 0
        breakdown_with_percentage.append({
            "category": category,
            "amount": amount,
            "percentage": round(percentage, 1)
        })
    
    return breakdown_with_percentage

# Change Order Endpoints

@api_router.post("/change-orders", response_model=ChangeOrder)
async def create_change_order(change_order: ChangeOrderCreate):
    change_order_data = change_order.dict()
    change_order_obj = ChangeOrder(**change_order_data)
    
    # Convert to dict for MongoDB
    change_order_dict = change_order_obj.dict()
    
    # Insert into MongoDB
    result = await db.change_orders.insert_one(change_order_dict)
    
    return change_order_obj

@api_router.get("/change-orders")
async def get_change_orders(
    projectId: Optional[int] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None)
):
    """Get change orders with optional filtering"""
    query = {}
    
    # Filter by project
    if projectId is not None:
        query["projectId"] = projectId
    
    # Filter by date range (using paidDate)
    if startDate or endDate:
        date_query = {}
        if startDate:
            date_query["$gte"] = startDate
        if endDate:
            date_query["$lte"] = endDate
        query["paidDate"] = date_query
    
    # Query MongoDB
    change_orders = await db.change_orders.find(query).to_list(1000)
    
    # Remove MongoDB _id field
    for order in change_orders:
        order.pop('_id', None)
    
    return change_orders

@api_router.put("/change-orders/{change_order_id}")
async def update_change_order(change_order_id: str, change_order: ChangeOrderCreate):
    """Update a change order"""
    update_data = change_order.dict()
    update_data["updatedAt"] = datetime.utcnow()
    
    result = await db.change_orders.update_one(
        {"id": change_order_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        return {"error": "Change order not found"}
    
    # Fetch and return updated change order
    updated_order = await db.change_orders.find_one({"id": change_order_id})
    if updated_order:
        updated_order.pop('_id', None)
    
    return updated_order

@api_router.delete("/change-orders/{change_order_id}")
async def delete_change_order(change_order_id: str):
    """Delete a change order"""
    result = await db.change_orders.delete_one({"id": change_order_id})
    
    if result.deleted_count == 0:
        return {"error": "Change order not found"}
    
    return {"message": "Change order deleted successfully"}

# Permit Extraction Endpoint
@api_router.post("/extract-permit", response_model=PermitExtractionResponse)
async def extract_permit(request: PermitExtractionRequest):
    """
    Extract permit information from an image using AI
    """
    try:
        result = await extract_permit_data(request.imageBase64)
        return PermitExtractionResponse(**result)
    except Exception as e:
        logging.error(f"Error extracting permit data: {str(e)}")
        return PermitExtractionResponse(
            permitNumber=None,
            issueDate=None,
            expirationDate=None,
            fees=None,
            success=False,
            error=str(e)
        )

# Site Notes AI Models
class PunchListItem(BaseModel):
    id: str
    description: str
    location: Optional[str] = None
    priority: Literal["High", "Medium", "Low"] = "Medium"
    status: str = "Pending"

class ChecklistItem(BaseModel):
    id: str
    task: str
    category: str
    checked: bool = False

class MaterialItem(BaseModel):
    id: str
    name: str
    quantity: str
    category: str
    notes: Optional[str] = None

class SiteNotesRequest(BaseModel):
    images: List[str]  # Base64 encoded images
    voiceNotes: List[str]  # Transcribed voice notes
    projectContext: Optional[str] = None

class SiteNotesResponse(BaseModel):
    success: bool
    punchList: List[PunchListItem] = []
    checklist: List[ChecklistItem] = []
    materialList: List[MaterialItem] = []
    error: Optional[str] = None

# Site Notes AI Endpoint
@api_router.post("/site-notes/process", response_model=SiteNotesResponse)
async def process_site_notes_endpoint(request: SiteNotesRequest):
    """
    Process job site photos and voice notes using AI to generate
    punch lists, checklists, and material lists.
    """
    try:
        result = await process_site_notes(
            images_base64=request.images,
            voice_notes=request.voiceNotes,
            project_context=request.projectContext
        )
        
        return SiteNotesResponse(
            success=result.get("success", False),
            punchList=result.get("punchList", []),
            checklist=result.get("checklist", []),
            materialList=result.get("materialList", []),
            error=result.get("error")
        )
    except Exception as e:
        logging.error(f"Error processing site notes: {str(e)}")
        return SiteNotesResponse(
            success=False,
            punchList=[],
            checklist=[],
            materialList=[],
            error=str(e)
        )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
