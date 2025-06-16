from pymongo import MongoClient  
from bson import ObjectId  
from fastapi import FastAPI, HTTPException, Body, Response  
from fastapi.responses import HTMLResponse  
from pydantic import BaseModel, Field  
import modal  
import os  
import bcrypt  # Added import for bcrypt  
  
# --- Configuration ---  
  
# Please avoid hardcoding your MongoDB credentials directly in the code.  
# Use environment variables or configuration files to store sensitive information securely.  
MONGO_URI = ""  # Should be set appropriately  
  
# --- Modal Setup ---  
  
# Define the image with necessary Python libraries.  
image = modal.Image.debian_slim(python_version="3.12").pip_install(  
    "fastapi[standard]==0.115.4",  
    "pymongo==4.7.2",  
    "pydantic==2.7.1",  
    "bcrypt==4.0.1"  # Added bcrypt here  
)  
  
# Create a Modal App instance.  
app = modal.App("wishlist-api", image=image)  
  
# Create the FastAPI app.  
web_app = FastAPI(  
    title="Wishlist API",  
    description="A simple API to manage items in a wishlist using FastAPI, Modal, and MongoDB."  
)  
  
# --- Pydantic Models and Helper Functions ---  
  
class WishlistItem(BaseModel):  
    wishlist_id: str = Field(..., example="ObjectId string")  
    title: str = Field(..., example="Wireless Noise-Cancelling Headphones")  
    image: str = Field(None, example="https://example.com/images/headphones.jpg")  
    url: str = Field(None, example="https://example.com/products/headphones")  
  
class WishlistCreate(BaseModel):  
    wishlist_name: str = Field(..., example="Travel Gear")  
    password: str = Field(None, example="mysecretpassword")  
  
class RemoveItemRequest(BaseModel):  
    password: str = Field(None, example="mysecretpassword")  
  
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
  
# --- API Endpoints ---  
  
@web_app.get("/", tags=["Root"])  
async def read_root():  
    """Root endpoint to check if the API is running."""  
    return {"message": "Welcome to the Wishlist API!"}  
  
@web_app.post("/create_wishlist", tags=["Wishlists"])  
async def create_wishlist(data: WishlistCreate):  
    """Creates a new wishlist."""  
    with MongoClient(MONGO_URI) as client:  
        collection = client.moonshop.wishlists  
        wishlist_dict = data.dict()  
        password = wishlist_dict.pop('password', '')  
        # Hash the password using bcrypt  
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())  
        wishlist_dict['password_hash'] = hashed_password.decode('utf-8')  # Store as string  
        # Insert the new wishlist and get its inserted ID  
        result = collection.insert_one(wishlist_dict)  
        wishlist_id = str(result.inserted_id)  
    # Return the wishlist_id so that it can be used to share the wishlist  
    return {"message": f"Wishlist '{data.wishlist_name}' created successfully.", "wishlist_id": wishlist_id}  
  
@web_app.get("/get_wishlists", tags=["Wishlists"])  
async def get_wishlists():  
    """Retrieves a list of all wishlists."""  
    with MongoClient(MONGO_URI) as client:  
        collection = client.moonshop.wishlists  
        wishlists_cursor = collection.find({}, {'wishlist_name': 1})  
        wishlists = [serialize_wishlist(wishlist) for wishlist in wishlists_cursor]  
    return {"wishlists": wishlists}  
  
@web_app.post("/add_item", tags=["Items"])  
async def add_item(item: WishlistItem):  
    """Adds a new item to a wishlist."""  
    with MongoClient(MONGO_URI) as client:  
        wishlists_collection = client.moonshop.wishlists  
        # Validate the wishlist_id  
        try:  
            wishlist_obj_id = ObjectId(item.wishlist_id)  
        except Exception:  
            raise HTTPException(status_code=400, detail="Invalid wishlist ID format")  
  
        # Check if the wishlist exists  
        wishlist = wishlists_collection.find_one({'_id': wishlist_obj_id})  
        if not wishlist:  
            raise HTTPException(status_code=404, detail="Wishlist does not exist")  
  
        items_collection = client.moonshop.wishlist_items  
        # Check if the item already exists in the target wishlist.  
        if items_collection.find_one({'wishlist_id': item.wishlist_id, 'url': item.url}):  
            raise HTTPException(status_code=400, detail="Item with this URL already exists in the wishlist")  
  
        item_dict = item.dict()  
        result = items_collection.insert_one(item_dict)  
        return {"message": "Item added successfully", "id": str(result.inserted_id)}  
  
@web_app.get("/view_items", tags=["Items"])  
async def view_items(wishlist_id: str):  
    """Retrieves all items from a specific wishlist."""  
    with MongoClient(MONGO_URI) as client:  
        items_collection = client.moonshop.wishlist_items  
        # Validate the wishlist_id  
        try:  
            wishlist_obj_id = ObjectId(wishlist_id)  
        except Exception:  
            raise HTTPException(status_code=400, detail="Invalid wishlist ID format")  
  
        items = items_collection.find({'wishlist_id': wishlist_id})  
        serialized_items = [serialize_item(item) for item in items]  
  
    if not serialized_items:  
        # Do not raise an exception here, it's okay to return empty items  
        serialized_items = []  
    return {"wishlist_id": wishlist_id, "items": serialized_items}  
  
@web_app.delete("/remove_item/{item_id}", tags=["Items"])  
async def remove_item(item_id: str, request: RemoveItemRequest = Body(...)):  
    """Removes a specific item from the wishlist by its ID."""  
    password = request.password or ''  
    try:  
        obj_id = ObjectId(item_id)  
    except Exception:  
        raise HTTPException(status_code=400, detail="Invalid item ID format")  
  
    with MongoClient(MONGO_URI) as client:  
        items_collection = client.moonshop.wishlist_items  
        item = items_collection.find_one({'_id': obj_id})  
        if not item:  
            raise HTTPException(status_code=404, detail="Item not found")  
  
        wishlist_id = item.get('wishlist_id')  
        if not wishlist_id:  
            raise HTTPException(status_code=404, detail="Wishlist ID not found for the item")  
  
        wishlists_collection = client.moonshop.wishlists  
        wishlist = wishlists_collection.find_one({'_id': ObjectId(wishlist_id)})  
        if not wishlist:  
            raise HTTPException(status_code=404, detail="Wishlist not found")  
  
        password_hash = wishlist.get('password_hash')  
        if password_hash is None:  
            # Assume empty password for wishlists without a password  
            password_hash = bcrypt.hashpw(''.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')  
  
        hashed_password = password_hash.encode('utf-8')  
        if not bcrypt.checkpw(password.encode('utf-8'), hashed_password):  
            raise HTTPException(status_code=403, detail="Incorrect password")  
  
        # Proceed to delete the item  
        result = items_collection.delete_one({'_id': obj_id})  
    if result.deleted_count == 1:  
        return {"message": "Item removed successfully"}  
    else:  
        raise HTTPException(status_code=404, detail="Item not found")  
  
@web_app.get("/view_list/{wishlist_id}", response_class=HTMLResponse, tags=["Wishlists"])  
async def view_list(wishlist_id: str):  
    """View a wishlist and its items by wishlist_id."""  
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
