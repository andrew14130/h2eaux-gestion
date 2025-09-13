from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'h2eaux-secret-key-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

app = FastAPI(title="H2EAUX Gestion API")
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    role: str = "employee"  # admin or employee
    permissions: dict = Field(default_factory=lambda: {
        "clients": True,
        "documents": True,
        "chantiers": True,
        "calculs_pac": True,
        "catalogues": True,
        "chat": True,
        "parametres": False
    })
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "employee"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    permissions: dict
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    prenom: str
    telephone: str = ""
    email: str = ""
    adresse: str = ""
    ville: str = ""
    code_postal: str = ""
    type_chauffage: str = ""
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ClientCreate(BaseModel):
    nom: str
    prenom: str
    telephone: str = ""
    email: str = ""
    adresse: str = ""
    ville: str = ""
    code_postal: str = ""
    type_chauffage: str = ""
    notes: str = ""

class ClientUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    code_postal: Optional[str] = None
    type_chauffage: Optional[str] = None
    notes: Optional[str] = None

# Utility functions
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return User(**user)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Initialize default admin user
async def init_default_users():
    admin_exists = await db.users.find_one({"username": "admin"})
    if not admin_exists:
        admin_user = User(
            username="admin",
            role="admin",
            permissions={
                "clients": True,
                "documents": True,
                "chantiers": True,
                "calculs_pac": True,
                "catalogues": True,
                "chat": True,
                "parametres": True
            },
            hashed_password=hash_password("admin123")
        )
        await db.users.insert_one(admin_user.dict())
        
    # Create a sample employee
    employee_exists = await db.users.find_one({"username": "employe1"})
    if not employee_exists:
        employee_user = User(
            username="employe1",
            role="employee",
            permissions={
                "clients": True,
                "documents": True,
                "chantiers": True,
                "calculs_pac": True,
                "catalogues": True,
                "chat": True,
                "parametres": False
            },
            hashed_password=hash_password("employe123")
        )
        await db.users.insert_one(employee_user.dict())

# Auth routes
@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=user["id"],
        username=user["username"],
        role=user["role"],
        permissions=user["permissions"],
        created_at=user["created_at"].isoformat()
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    # Only admin can create new users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create new users"
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    new_user = User(
        username=user_data.username,
        role=user_data.role,
        hashed_password=hash_password(user_data.password)
    )
    
    await db.users.insert_one(new_user.dict())
    
    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        role=new_user.role,
        permissions=new_user.permissions,
        created_at=new_user.created_at.isoformat()
    )

# Client routes
@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("clients", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to clients not permitted"
        )
    
    clients = await db.clients.find().sort("created_at", -1).to_list(1000)
    return [Client(**client) for client in clients]

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("clients", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to clients not permitted"
        )
    
    new_client = Client(**client_data.dict())
    await db.clients.insert_one(new_client.dict())
    return new_client

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("clients", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to clients not permitted"
        )
    
    client = await db.clients.find_one({"id": client_id})
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return Client(**client)

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(
    client_id: str, 
    client_data: ClientUpdate, 
    current_user: User = Depends(get_current_user)
):
    if not current_user.permissions.get("clients", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to clients not permitted"
        )
    
    client = await db.clients.find_one({"id": client_id})
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    update_data = {k: v for k, v in client_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.clients.update_one({"id": client_id}, {"$set": update_data})
    
    updated_client = await db.clients.find_one({"id": client_id})
    return Client(**updated_client)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("clients", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to clients not permitted"
        )
    
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return {"message": "Client deleted successfully"}

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "ok", "message": "H2EAUX Gestion API is running"}

# Include router
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

@app.on_event("startup")
async def startup_event():
    await init_default_users()
    logger.info("H2EAUX Gestion API started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("H2EAUX Gestion API shut down")