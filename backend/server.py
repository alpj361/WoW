from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = ""
    category: str  # "music", "volunteer", "general"
    image: Optional[str] = None  # Base64 image
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: str = "general"
    image: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None

class SavedEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    saved_at: datetime = Field(default_factory=datetime.utcnow)

class AttendedEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    emoji_rating: Optional[str] = None  # Emoji used for rating
    attended_at: datetime = Field(default_factory=datetime.utcnow)

class AttendRequest(BaseModel):
    emoji_rating: Optional[str] = None

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "WOW API - Descubre y Vive Eventos"}

# ==================== EVENT ROUTES ====================

@api_router.get("/events", response_model=List[Event])
async def get_events(category: Optional[str] = None):
    """Get all events, optionally filtered by category"""
    query = {}
    if category and category != "all":
        query["category"] = category
    
    events = await db.events.find(query).sort("created_at", -1).to_list(1000)
    return [Event(**event) for event in events]

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    """Get a single event by ID"""
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return Event(**event)

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate):
    """Create a new event"""
    event = Event(**event_data.dict())
    await db.events.insert_one(event.dict())
    return event

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str):
    """Delete an event"""
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# ==================== SAVED EVENTS ROUTES ====================

@api_router.get("/saved", response_model=List[dict])
async def get_saved_events():
    """Get all saved events with event details"""
    saved = await db.saved_events.find().sort("saved_at", -1).to_list(1000)
    result = []
    for s in saved:
        event = await db.events.find_one({"id": s["event_id"]})
        if event:
            result.append({
                "saved": SavedEvent(**s).dict(),
                "event": Event(**event).dict()
            })
    return result

@api_router.post("/events/{event_id}/save")
async def save_event(event_id: str):
    """Save an event to user's list"""
    # Check if event exists
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already saved
    existing = await db.saved_events.find_one({"event_id": event_id})
    if existing:
        return {"message": "Event already saved", "saved": SavedEvent(**existing).dict()}
    
    saved = SavedEvent(event_id=event_id)
    await db.saved_events.insert_one(saved.dict())
    return {"message": "Event saved successfully", "saved": saved.dict()}

@api_router.delete("/saved/{event_id}")
async def unsave_event(event_id: str):
    """Remove an event from saved list"""
    result = await db.saved_events.delete_one({"event_id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Saved event not found")
    return {"message": "Event removed from saved"}

@api_router.get("/saved/check/{event_id}")
async def check_if_saved(event_id: str):
    """Check if an event is saved"""
    existing = await db.saved_events.find_one({"event_id": event_id})
    return {"is_saved": existing is not None}

# ==================== ATTENDED EVENTS ROUTES ====================

@api_router.get("/attended", response_model=List[dict])
async def get_attended_events():
    """Get all attended events with event details"""
    attended = await db.attended_events.find().sort("attended_at", -1).to_list(1000)
    result = []
    for a in attended:
        event = await db.events.find_one({"id": a["event_id"]})
        if event:
            result.append({
                "attended": AttendedEvent(**a).dict(),
                "event": Event(**event).dict()
            })
    return result

@api_router.post("/events/{event_id}/attend")
async def mark_attended(event_id: str, attend_data: AttendRequest):
    """Mark an event as attended with optional emoji rating"""
    # Check if event exists
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already attended
    existing = await db.attended_events.find_one({"event_id": event_id})
    if existing:
        # Update the rating
        await db.attended_events.update_one(
            {"event_id": event_id},
            {"$set": {"emoji_rating": attend_data.emoji_rating}}
        )
        existing["emoji_rating"] = attend_data.emoji_rating
        return {"message": "Attendance updated", "attended": AttendedEvent(**existing).dict()}
    
    attended = AttendedEvent(event_id=event_id, emoji_rating=attend_data.emoji_rating)
    await db.attended_events.insert_one(attended.dict())
    
    # Remove from saved if it was saved
    await db.saved_events.delete_one({"event_id": event_id})
    
    return {"message": "Event marked as attended", "attended": attended.dict()}

@api_router.delete("/attended/{event_id}")
async def remove_attended(event_id: str):
    """Remove an event from attended list"""
    result = await db.attended_events.delete_one({"event_id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Attended event not found")
    return {"message": "Event removed from attended"}

@api_router.get("/attended/check/{event_id}")
async def check_if_attended(event_id: str):
    """Check if an event is attended"""
    existing = await db.attended_events.find_one({"event_id": event_id})
    return {"is_attended": existing is not None, "emoji_rating": existing.get("emoji_rating") if existing else None}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed database with sample events"""
    # Clear existing data
    await db.events.delete_many({})
    await db.saved_events.delete_many({})
    await db.attended_events.delete_many({})
    
    sample_events = [
        {
            "title": "Noche de Jazz en Vivo",
            "description": "Disfruta de una noche inolvidable con los mejores músicos de jazz de la ciudad. Incluye copa de bienvenida.",
            "category": "music",
            "date": "2025-07-20",
            "time": "21:00",
            "location": "Jazz Bar La Cava"
        },
        {
            "title": "Festival de Rock Underground",
            "description": "Las mejores bandas emergentes de rock alternativo. ¡No te lo pierdas!",
            "category": "music",
            "date": "2025-07-25",
            "time": "18:00",
            "location": "Arena Norte"
        },
        {
            "title": "Concierto Sinfónico",
            "description": "La orquesta filarmónica presenta obras clásicas de Mozart y Beethoven.",
            "category": "music",
            "date": "2025-07-28",
            "time": "19:30",
            "location": "Teatro Principal"
        },
        {
            "title": "Limpieza de Playa",
            "description": "Únete a nuestra jornada de limpieza ecológica. Incluye desayuno y camiseta.",
            "category": "volunteer",
            "date": "2025-07-22",
            "time": "07:00",
            "location": "Playa del Sol"
        },
        {
            "title": "Reforestación Comunitaria",
            "description": "Planta un árbol y ayuda al medio ambiente. Todas las herramientas incluidas.",
            "category": "volunteer",
            "date": "2025-07-26",
            "time": "09:00",
            "location": "Bosque Municipal"
        },
        {
            "title": "Comedor Social",
            "description": "Ayuda a servir comidas a personas necesitadas. Tu tiempo hace la diferencia.",
            "category": "volunteer",
            "date": "2025-07-21",
            "time": "12:00",
            "location": "Centro Comunitario"
        },
        {
            "title": "Food Truck Festival",
            "description": "Los mejores food trucks de la ciudad en un solo lugar. Música en vivo incluida.",
            "category": "general",
            "date": "2025-07-24",
            "time": "12:00",
            "location": "Parque Central"
        },
        {
            "title": "Networking Tech",
            "description": "Conecta con profesionales del mundo tecnológico. Charlas y networking.",
            "category": "general",
            "date": "2025-07-23",
            "time": "18:30",
            "location": "Hub de Innovación"
        },
        {
            "title": "Mercado Artesanal",
            "description": "Descubre productos únicos hechos a mano por artesanos locales.",
            "category": "general",
            "date": "2025-07-27",
            "time": "10:00",
            "location": "Plaza Mayor"
        },
        {
            "title": "Clase de Yoga al Aire Libre",
            "description": "Relájate y conecta con tu cuerpo en esta sesión de yoga gratuita.",
            "category": "general",
            "date": "2025-07-20",
            "time": "08:00",
            "location": "Jardín Botánico"
        }
    ]
    
    for event_data in sample_events:
        event = Event(**event_data)
        await db.events.insert_one(event.dict())
    
    return {"message": f"Seeded {len(sample_events)} events successfully"}

# ==================== STATUS ROUTES ====================

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
