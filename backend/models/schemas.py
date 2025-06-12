from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class ProjectStatus(str, Enum):
    DRAFT = "draft"
    GENERATING_SPECIFICATION = "generating_specification"
    SPECIFICATION_GENERATED = "specification_generated"
    SPECIFICATION_APPROVED = "specification_approved"
    SPECIFICATION_FAILED = "specification_failed"
    ANALYZING_SPECIFICATION = "analyzing_specification"
    GENERATING_CODE = "generating_code"
    CREATING_ZIP = "creating_zip"
    UPLOADING = "uploading"
    CODE_GENERATED = "code_generated"
    GENERATING = "generating"
    TESTING = "testing"
    UAT = "uat"
    COMPLETED = "completed"
    FAILED = "failed"

class OdooVersion(int, Enum):
    V14 = 14
    V15 = 15
    V16 = 16
    V17 = 17

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class User(BaseModel):
    id: str
    email: str
    created_at: datetime

# Project Models
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    odoo_version: OdooVersion
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Project(BaseModel):
    id: str
    user_id: str
    name: str
    odoo_version: int
    status: ProjectStatus
    description: Optional[str] = None
    created_at: datetime

# Specification Models
class SpecificationGenerate(BaseModel):
    requirements: str = Field(..., min_length=10)

class Specification(BaseModel):
    id: str
    project_id: str
    content: str
    is_approved: bool
    created_at: datetime

# Payment Models
class PaymentIntent(BaseModel):
    amount: int
    currency: str = "usd"

class PaymentSuccess(BaseModel):
    payment_intent_id: str
    amount: int
    status: str

# General Response Models
class StatusResponse(BaseModel):
    status: str
    message: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None 