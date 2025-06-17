# main.py  
  
import os  
import jwt  
import datetime  
from typing import Dict, Optional, List  
  
from fastapi import FastAPI, HTTPException, Body, Depends, Header, status  
from fastapi.responses import JSONResponse, HTMLResponse  
from fastapi.middleware.cors import CORSMiddleware  
from pydantic import BaseModel, Field  
from passlib.context import CryptContext  
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError  
import modal  
from pymongo import MongoClient  
from bson import ObjectId  
  
# --- Configuration ---  
  
# Load environment variables or set default values  
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')  
JWT_ALGORITHM = 'HS256'  
ACCESS_TOKEN_EXPIRE_MINUTES = 15  
REFRESH_TOKEN_EXPIRE_DAYS = 180  # Approximately 6 months  
  
# MongoDB configuration  
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')  
  
# --- Modal Setup ---  
  
# Define the image with necessary Python libraries.  
image = modal.Image.debian_slim(python_version="3.12").pip_install(  
    "fastapi[standard]==0.115.4",  
    "pymongo==4.7.2",  
    "pydantic==2.7.1",  
    "passlib==1.7.4",  
    "PyJWT==2.8.0"  
)  
  
# Create a Modal App instance.  
app = modal.App("wishlist-api", image=image)  
  
# --- FastAPI App Setup ---  
  
# Create the FastAPI app.  
web_app = FastAPI(  
    title="Wishlist API with Authentication",  
    description="An API to manage items in a wishlist with JWT authentication using FastAPI, Modal, and MongoDB."  
)  
  
# Allow CORS for development purposes  
web_app.add_middleware(  
    CORSMiddleware,  
    allow_origins=["*"],  # For development, consider specifying origins  
    allow_credentials=True,  
    allow_methods=["*"],  
    allow_headers=["*"],  
)  
  
# --- Set up CryptContext for password hashing ---  
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")  
  
# --- Initialize MongoDB client ---  
client = MongoClient(MONGO_URI)  
db = client.moonshop  # Use your database  
users_collection = db.users  
refresh_tokens_collection = db.refresh_tokens  
wishlists_collection = db.wishlists  
items_collection = db.wishlist_items  
  
# --- Pydantic Models ---  
  
class UserRegister(BaseModel):  
    username: str = Field(..., example="user1")  
    password: str = Field(..., min_length=8, example="password123")  
  
class UserAuth(BaseModel):  
    username: str = Field(..., example="user1")  
    password: str = Field(..., example="password123")  
  
class TokenResponse(BaseModel):  
    status: str  
    access_token: str  
    refresh_token: str  
  
class TokenRefreshRequest(BaseModel):  
    refresh_token: str  
  
class ProtectedResponse(BaseModel):  
    status: str  
    message: str  
  
class WishlistItem(BaseModel):  
    wishlist_id: str = Field(..., example="ObjectId string")  
    title: str = Field(..., example="Wireless Noise-Cancelling Headphones")  
    image: str = Field(None, example="https://example.com/images/headphones.jpg")  
    url: str = Field(None, example="https://example.com/products/headphones")  
  
class WishlistCreate(BaseModel):  
    wishlist_name: str = Field(..., example="Travel Gear")  
  
class RemoveItemRequest(BaseModel):  
    password: str = Field(None, example="mysecretpassword")  # Not needed anymore  
  
class WishlistResponse(BaseModel):  
    id: str  
    wishlist_name: str  
  
class ItemResponse(BaseModel):  
    id: str  
    wishlist_id: str  
    title: str  
    image: Optional[str]  
    url: Optional[str]  
  
class ViewItemsResponse(BaseModel):  
    wishlist_id: str  
    items: List[ItemResponse]  
  
# --- Helper Functions ---  
  
def create_access_token(username: str) -> str:  
    payload = {  
        'sub': username,  
        'iat': datetime.datetime.utcnow(),  
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)  
    }  
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)  
    return token  
  
def create_refresh_token(username: str) -> str:  
    payload = {  
        'sub': username,  
        'iat': datetime.datetime.utcnow(),  
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)  
    }  
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)  
    return token  
  
def get_current_user(Authorization: str = Header(None)) -> str:  
    """Decode the access token and return the username."""  
    if not Authorization:  
        raise HTTPException(status_code=401, detail="Missing Authorization header.")  
  
    try:  
        token_type, token = Authorization.split()  
        if token_type != 'Bearer':  
            raise HTTPException(status_code=401, detail="Invalid token type.")  
  
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])  
        username = payload.get('sub')  
        return username  
  
    except ExpiredSignatureError:  
        raise HTTPException(status_code=401, detail="Access token expired.")  
    except Exception as e:  
        raise HTTPException(status_code=401, detail=str(e))  
  
def serialize_item(item):  
    """Converts a MongoDB document to a dictionary."""  
    return {  
        'id': str(item['_id']),  
        'wishlist_id': item.get('wishlist_id'),  
        'title': item.get('title'),  
        'image': item.get('image'),  
        'url': item.get('url')  
    }  
  
def serialize_wishlist(wishlist):  
    """Converts a MongoDB wishlist document to a dictionary."""  
    return {  
        'id': str(wishlist['_id']),  
        'wishlist_name': wishlist.get('wishlist_name')  
    }  
  
# --- Authentication Endpoints ---  
  
@web_app.post('/register', tags=["Authentication"])  
def register(user: UserRegister):  
    """Registers a new user."""  
    if not user.username or not user.password:  
        raise HTTPException(status_code=400, detail="Username and password are required.")  
  
    if len(user.password) < 8:  
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")  
  
    if users_collection.find_one({'username': user.username}):  
        raise HTTPException(status_code=400, detail="User already exists.")  
  
    # Hash the password for secure storage  
    password_hash = pwd_context.hash(user.password)  
  
    users_collection.insert_one({  
        'username': user.username,  
        'password_hash': password_hash  
    })  
  
    return {'status': 'ok', 'message': 'User registered successfully.'}  
  
@web_app.post('/authenticate', response_model=TokenResponse, tags=["Authentication"])  
def authenticate(user: UserAuth):  
    """Authenticates a user and returns JWT tokens."""  
    db_user = users_collection.find_one({'username': user.username})  
    if not db_user:  
        raise HTTPException(status_code=404, detail="User not found.")  
  
    if not pwd_context.verify(user.password, db_user['password_hash']):  
        raise HTTPException(status_code=401, detail="Invalid credentials.")  
  
    # Generate tokens  
    access_token = create_access_token(user.username)  
    refresh_token = create_refresh_token(user.username)  
  
    # Store refresh token  
    refresh_tokens_collection.insert_one({  
        'refresh_token': refresh_token,  
        'username': user.username  
    })  
  
    return {  
        'status': 'ok',  
        'access_token': access_token,  
        'refresh_token': refresh_token  
    }  
  
@web_app.post('/refresh', response_model=TokenResponse, tags=["Authentication"])  
def refresh_token(data: TokenRefreshRequest):  
    """Generates new access and refresh tokens."""  
    stored_token = refresh_tokens_collection.find_one({'refresh_token': data.refresh_token})  
  
    if not stored_token:  
        raise HTTPException(status_code=400, detail="Invalid refresh token.")  
  
    try:  
        payload = jwt.decode(data.refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])  
        username = payload.get('sub')  
  
        # Generate new tokens  
        access_token = create_access_token(username)  
        new_refresh_token = create_refresh_token(username)  
  
        # Update refresh tokens  
        refresh_tokens_collection.delete_one({'refresh_token': data.refresh_token})  
        refresh_tokens_collection.insert_one({  
            'refresh_token': new_refresh_token,  
            'username': username  
        })  
  
        return {  
            'status': 'ok',  
            'access_token': access_token,  
            'refresh_token': new_refresh_token  
        }  
  
    except ExpiredSignatureError:  
        raise HTTPException(status_code=400, detail="Refresh token expired.")  
    except InvalidTokenError:  
        raise HTTPException(status_code=400, detail="Invalid refresh token.")  
    except Exception as e:  
        raise HTTPException(status_code=400, detail=str(e))  
  
# --- Wishlist Endpoints ---  
  
@web_app.post("/create_wishlist", tags=["Wishlists"])  
async def create_wishlist(  
    data: WishlistCreate,  
    Authorization: str = Header(None)  
):  
    """Creates a new wishlist."""  
    username = get_current_user(Authorization)  
    wishlist_dict = {  
        'wishlist_name': data.wishlist_name,  
        'username': username  
    }  
  
    result = wishlists_collection.insert_one(wishlist_dict)  
    wishlist_id = str(result.inserted_id)  
    # Return the wishlist_id so that it can be used to share the wishlist  
    return {"message": f"Wishlist '{data.wishlist_name}' created successfully.", "wishlist_id": wishlist_id}  
  
@web_app.get("/get_wishlists", response_model=Dict[str, List[WishlistResponse]], tags=["Wishlists"])  
async def get_wishlists(Authorization: str = Header(None)):  
    """Retrieves a list of all wishlists for the authenticated user."""  
    username = get_current_user(Authorization)  
    wishlists_cursor = wishlists_collection.find({'username': username}, {'wishlist_name': 1})  
    wishlists = [serialize_wishlist(wishlist) for wishlist in wishlists_cursor]  
    return {"wishlists": wishlists}  
  
@web_app.post("/add_item", tags=["Items"])  
async def add_item(  
    item: WishlistItem,  
    Authorization: str = Header(None)  
):  
    """Adds a new item to a wishlist."""  
    username = get_current_user(Authorization)  
    # Validate the wishlist_id  
    try:  
        wishlist_obj_id = ObjectId(item.wishlist_id)  
    except Exception:  
        raise HTTPException(status_code=400, detail="Invalid wishlist ID format")  
  
    # Check if the wishlist exists and belongs to the user  
    wishlist = wishlists_collection.find_one({'_id': wishlist_obj_id, 'username': username})  
    if not wishlist:  
        raise HTTPException(status_code=404, detail="Wishlist does not exist or access denied")  
  
    # Check if the item already exists in the target wishlist.  
    if items_collection.find_one({'wishlist_id': item.wishlist_id, 'url': item.url}):  
        raise HTTPException(status_code=400, detail="Item with this URL already exists in the wishlist")  
  
    item_dict = item.dict()  
    result = items_collection.insert_one(item_dict)  
    return {"message": "Item added successfully", "id": str(result.inserted_id)}  
  
@web_app.get("/view_items", response_model=ViewItemsResponse, tags=["Items"])  
async def view_items(  
    wishlist_id: str,  
    Authorization: str = Header(None)  
):  
    """Retrieves all items from a specific wishlist."""  
    username = get_current_user(Authorization)  
    # Validate the wishlist_id  
    try:  
        wishlist_obj_id = ObjectId(wishlist_id)  
    except Exception:  
        raise HTTPException(status_code=400, detail="Invalid wishlist ID format")  
  
    wishlist = wishlists_collection.find_one({'_id': wishlist_obj_id, 'username': username})  
    if not wishlist:  
        raise HTTPException(status_code=404, detail="Wishlist does not exist or access denied")  
  
    items_cursor = items_collection.find({'wishlist_id': wishlist_id})  
    serialized_items = [serialize_item(item) for item in items_cursor]  
  
    return ViewItemsResponse(wishlist_id=wishlist_id, items=serialized_items)  
  
@web_app.delete("/remove_item/{item_id}", tags=["Items"])  
async def remove_item(  
    item_id: str,  
    Authorization: str = Header(None)  
):  
    """Removes a specific item from the wishlist by its ID."""  
    username = get_current_user(Authorization)  
    try:  
        obj_id = ObjectId(item_id)  
    except Exception:  
        raise HTTPException(status_code=400, detail="Invalid item ID format")  
  
    # Find the item  
    item = items_collection.find_one({'_id': obj_id})  
    if not item:  
        raise HTTPException(status_code=404, detail="Item not found")  
  
    wishlist_id = item.get('wishlist_id')  
    if not wishlist_id:  
        raise HTTPException(status_code=404, detail="Wishlist ID not found for the item")  
  
    wishlist_obj_id = ObjectId(wishlist_id)  
    wishlist = wishlists_collection.find_one({'_id': wishlist_obj_id, 'username': username})  
    if not wishlist:  
        raise HTTPException(status_code=404, detail="Wishlist not found or access denied")  
  
    # Proceed to delete the item  
    result = items_collection.delete_one({'_id': obj_id})  
    if result.deleted_count == 1:  
        return {"message": "Item removed successfully"}  
    else:  
        raise HTTPException(status_code=404, detail="Item not found")  
  
@web_app.get("/view_list/{wishlist_id}", response_class=HTMLResponse, tags=["Wishlists"])  
async def view_list(wishlist_id: str):  
    """View a wishlist and its items by wishlist_id."""  
    # This endpoint remains public so users can share their wishlists  
    # Validate the wishlist_id  
    with MongoClient(MONGO_URI) as client:  
        try:  
            wishlist_obj_id = ObjectId(wishlist_id)  
        except Exception:  
            raise HTTPException(status_code=400, detail="Invalid wishlist ID format")  
  
        wishlists_collection = client.moonshop.wishlists  
        wishlist = wishlists_collection.find_one({'_id': wishlist_obj_id})  
  
        if not wishlist:  
            raise HTTPException(status_code=404, detail="Wishlist not found")  
  
        wishlist_name = wishlist['wishlist_name']  
  
        items_collection = client.moonshop.wishlist_items  
        items = items_collection.find({'wishlist_id': wishlist_id})  
        serialized_items = [serialize_item(item) for item in items]  
  
    # Build item HTML outside the f-string  
    item_html = "".join([  
        f'''  
        <div class="item">  
            {'<img src="' + item["image"] + '" alt="' + item["title"] + '">' if item.get("image") else ''}  
            <div>  
                <a href="{item["url"]}" target="_blank">{item["title"]}</a>  
            </div>  
        </div>  
        ''' for item in serialized_items  
    ])  
  
    # Now embed it cleanly in the final HTML template  
    html_content = f"""  
    <!DOCTYPE html>  
    <html>  
    <head>  
        <title>{wishlist_name}</title>  
        <style>  
            body {{  
                font-family: Arial, sans-serif;  
                background-color: #f0f5f4;  
                color: #333;  
                margin: 0;  
                padding: 20px;  
            }}  
            h1 {{  
                color: #13aa52;  
                text-align: center;  
            }}  
            .wishlist {{  
                max-width: 800px;  
                margin: 0 auto;  
            }}  
            .item {{  
                border: 1px solid #ddd;  
                border-radius: 8px;  
                padding: 20px;  
                margin: 10px 0;  
                background-color: #fff;  
                display: flex;  
                align-items: center;  
            }}  
            .item img {{  
                max-width: 150px;  
                max-height: 150px;  
                margin-right: 20px;  
                border-radius: 8px;  
            }}  
            .item a {{  
                text-decoration: none;  
                color: #13aa52;  
                font-size: 20px;  
            }}  
            .item a:hover {{  
                text-decoration: underline;  
            }}  
        </style>  
    </head>  
    <body>  
        <div class="wishlist">  
            <h1>Wishlist: {wishlist_name}</h1>  
            {item_html}  
        </div>  
    </body>  
    </html>  
    """  
  
    return HTMLResponse(content=html_content, status_code=200)  
  
# --- Mount the FastAPI app with Modal ---  
  
@app.function()  
@modal.asgi_app()  
def fastapi_app():  
    """Serves the FastAPI application."""  
    return web_app  