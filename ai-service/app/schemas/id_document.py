from pydantic import BaseModel
from typing import Optional

class AadharData(BaseModel):
    name: str
    id_number: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    has_photo: bool = False

class DrivingLicenseData(BaseModel):
    name: str
    license_number: str
    date_of_birth: Optional[str] = None
    validity_from: Optional[str] = None
    validity_to: Optional[str] = None
    address: Optional[str] = None
    vehicle_class: Optional[str] = None
    blood_group: Optional[str] = None
    has_photo: bool = False

class PANData(BaseModel):
    name: str
    pan_number: str
    father_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    has_photo: bool = False

class VoterIDData(BaseModel):
    name: str
    voter_id_number: str
    father_name: Optional[str] = None
    address: Optional[str] = None
    has_photo: bool = False

class GenericIDData(BaseModel):
    name: str
    organization: Optional[str] = None
    id_number: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    has_photo: bool = False

class IDExtractionResult(BaseModel):
    success: bool
    id_type: str  # aadhar | driving_license | pan | voter_id | college_id | company_id | delivery_id | other
    id_category: str  # government | institutional
    extracted_data: dict
    id_number: Optional[str] = None
    format_valid: Optional[bool] = None
    message: str = ""
