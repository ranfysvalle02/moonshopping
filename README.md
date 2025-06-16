# moonshopping

---

TODO: Make sure password is required for add/remove from wishlist
[wishlist_id+password] = add/remove ok; else just read-only

# Build a Shareable Wishlist App with MongoDB Atlas and Modal's Serverless Platform  
   
Have you ever struggled to keep track of gift ideas for friends and family, or wanted to share a wishlist with loved ones without the hassle of multiple apps and platforms? Imagine a centralized, shareable wishlist application that allows you to save items from any webpage, organize them into custom lists, and share them effortlessly. In this blog post, we'll walk you through building such an app using **MongoDB Atlas** and **Modal's serverless platform**, both leveraging their free tiers.  
   
We'll dive into how to design the data models in MongoDB for efficient storage and retrieval, and how to deploy a scalable backend using Modal's serverless infrastructure. This project is not only cost-effective but also an excellent opportunity for learning and collaboration—perfect for families, friends, or even educational projects with kids interested in web development.  
   
## Why Build a Wishlist App?  
   
Before we get technical, let's consider the benefits:  
   
- **Centralized Storage**: Keep all your desired items in one place, regardless of the source website.  
- **Easy Sharing**: Generate shareable links for your wishlists, allowing friends and family to view them without any extra steps.  
- **Scalable and Cost-Effective**: Use free tiers of powerful cloud services to build an app that can grow with your needs without upfront costs.  
- **Educational Experience**: Learn about modern web development, cloud databases, serverless platforms, and data modeling.  
   
## Leveraging MongoDB Atlas Free Tier and Data Modeling  
   
### Why MongoDB Atlas?  
   
**MongoDB Atlas** offers a flexible, scalable, and easy-to-use cloud database platform with a generous free tier. It's ideal for small to medium-sized applications and prototypes.  
   
- **Flexible Schema**: MongoDB's document model allows for flexible and dynamic schemas, perfect for evolving applications.  
- **Rich Querying**: Powerful querying and indexing capabilities make data retrieval efficient.  
- **Managed Service**: With Atlas, you don't have to worry about database management, backups, or maintenance.  
- **Global Accessibility**: Cloud-based and accessible from anywhere, making data sharing seamless.  
   
### Data Modeling for Our Wishlist App  
   
Proper data modeling is crucial for application performance and scalability. In MongoDB, we'll use collections to store wishlists and their items.  
   
#### Collections and Documents  
   
1. **Wishlists Collection**:  
   - Each document represents a wishlist.  
   - Fields:  
     - `_id`: Unique identifier (ObjectId).  
     - `wishlist_name`: Name of the wishlist.  
     - `created_at`: Timestamp of creation.  
     - `owner`: User identifier (optional, for multi-user support).  
   
2. **WishlistItems Collection**:  
   - Each document represents an item in a wishlist.  
   - Fields:  
     - `_id`: Unique identifier (ObjectId).  
     - `wishlist_id`: Reference to the wishlist (`ObjectId`).  
     - `title`: Title of the item.  
     - `image`: URL to the item's image.  
     - `url`: URL to the item's webpage.  
     - `added_at`: Timestamp when the item was added.  
   
#### Data Relationships  
   
- **One-to-Many Relationship**: One wishlist has many items.  
- **Referencing**: Items reference their parent wishlist via `wishlist_id`.  
   
#### Indexing  
   
To enhance query performance, we'll create indexes on:  
   
- `wishlist_id` in `WishlistItems` for faster retrieval of items in a wishlist.  
- Any other fields frequently used in queries or filters.  
   
#### Example Document Structure  
   
**Wishlist Document**:  
   
```json  
{  
  "_id": ObjectId("609b8a8b8c8a8a8a8a8a8a8a"),  
  "wishlist_name": "Birthday Gifts",  
  "created_at": ISODate("2023-10-01T10:00:00Z")  
}  
```  
   
**WishlistItem Document**:  
   
```json  
{  
  "_id": ObjectId("609b8a8b8c8a8a8a8a8a8a8b"),  
  "wishlist_id": ObjectId("609b8a8b8c8a8a8a8a8a8a8a"),  
  "title": "Wireless Noise-Cancelling Headphones",  
  "image": "https://example.com/images/headphones.jpg",  
  "url": "https://example.com/products/headphones",  
  "added_at": ISODate("2023-10-01T12:00:00Z")  
}  
```  
   
### Setting Up MongoDB Atlas  
   
1. **Sign Up**: Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).  
2. **Create a Cluster**: Set up a free cluster; it's straightforward and only takes a few minutes.  
3. **Configure Security**:  
   - **Whitelist IP Address**: Allow access from your development machine or use `0.0.0.0/0` for all IPs (not recommended for production).  
   - **Create Database User**: Set up a user with proper credentials.  
4. **Obtain Connection String**: You'll need this to connect your application to the database.  
   
## Utilizing Modal's Serverless Platform  
   
### What is Modal?  
   
**Modal** is a serverless cloud platform that allows you to run code without managing servers, infrastructure, or scaling. You can define your container environments in code and deploy applications that scale automatically.  
   
- **Serverless Execution**: Run any code, scale to zero when not in use.  
- **Custom Environments**: Use your own Docker images or define environments using Modal's abstractions.  
- **Scalability**: Automatically scales out to handle increased load.  
- **Ease of Use**: Deploy applications with minimal configuration—no need to manage Kubernetes or AWS accounts.  
   
### Setting Up Modal  
   
1. **Sign Up**: Register for a free account on [Modal](https://modal.com/).  
2. **Install Modal CLI**: Install using `pip install modal`.  
3. **Authenticate**: Run `modal token new` to authenticate your CLI with your account.  
4. **Define Your Application**:  
   - Use Modal's `@app.function()` and `@modal.asgi_app()` decorators to define functions and web endpoints.  
5. **Deploy Your Application**: Use `modal deploy` to deploy your app to the cloud.  
   
### Integrating Modal with MongoDB Atlas  
   
Modal's serverless functions can easily interact with MongoDB Atlas:  
   
- **Environment Variables and Secrets**: Securely store your MongoDB connection string.  
- **Custom Images**: Use Modal's `Image` class to install dependencies like `pymongo`.  
   
## Building the Wishlist Application  
   
### Architecture Overview  
   
- **Frontend**: A Chrome extension (popup) that allows users to add items from any webpage.  
- **Backend**: A FastAPI application deployed on Modal's serverless platform.  
- **Database**: MongoDB Atlas storing wishlists and items.  
   
### Frontend: Chrome Extension  
   
#### Features  
   
- **Popup Interface**: Users can select a wishlist, add the current page's item, and view wishlist items.  
- **Product Scraping**: Scrapes product information like title, image, and URL from the current webpage.  
- **Local Storage Option**: Users can save items to a local wishlist if they prefer not to use the cloud.  
   
#### Key Components  
   
- **Manifest File**: Defines extension permissions and resources.  
- **Popup HTML**: The user interface for the extension.  
- **Popup JavaScript**: Handles user interactions, communicates with the API, and manipulates the DOM.  
   
### Backend: FastAPI Application on Modal  
   
#### Features  
   
- **API Endpoints**:  
  - `POST /create_wishlist`: Create a new wishlist.  
  - `GET /get_wishlists`: Retrieve all wishlists.  
  - `POST /add_item`: Add an item to a wishlist.  
  - `GET /view_items`: Get items from a wishlist.  
  - `DELETE /remove_item/{item_id}`: Remove an item from a wishlist.  
  - `GET /view_list/{wishlist_id}`: View a shareable wishlist as an HTML page.  
- **Data Validation**: Uses Pydantic models for request and response validation.  
- **MongoDB Integration**: Interacts with MongoDB Atlas using `pymongo`.  
   
#### Deploying with Modal  
   
- **Custom Container**: Defines the environment with necessary dependencies.  
- **Serverless Functions**: Deploys the FastAPI app as an ASGI application with `@app.function()` and `@modal.asgi_app()` decorators.  
- **Scalability**: Modal handles scaling the application based on demand.  
   
### Key Features  
   
- **Create and Manage Wishlists**: Users can create multiple wishlists for different occasions.  
- **Add Items from Any Website**: Save items directly from product pages via the Chrome extension.  
- **Shareable Wishlists**: Generate public URLs to share wishlists with others.  
- **Pagination and UI Enhancements**: Handle wishlists with many items and provide a smooth user experience.  
   
## Implementing MongoDB Data Modeling Best Practices  
   
To optimize performance and scalability:  
   
- **Use Appropriate Data Types**: Store dates in `ISODate` format, use `ObjectId` for references.  
- **Avoid Data Duplication**: Reference wishlists in items rather than embedding to allow for efficient updates.  
- **Implement Indexes**: Create indexes on fields used in queries, such as `wishlist_id` and `url`.  
- **Handle ObjectIds Correctly**: When dealing with `_id` fields, ensure that they are properly converted between strings and `ObjectId` objects in your code.  
   
## Bringing It All Together  
   
### Step-by-Step Guide  
   
1. **Set Up MongoDB Atlas**: As outlined above.  
2. **Develop the FastAPI Backend**:  
   - Install dependencies: `fastapi`, `pymongo`, `pydantic`.  
   - Define Pydantic models for data validation.  
   - Implement API endpoints with proper error handling and data interactions.  
   - Test locally to ensure functionality.  
3. **Deploy the Backend with Modal**:  
   - Define the custom image and app in `main.py`.  
   - Use Modal's decorators to set up the web application.  
   - Deploy using `modal deploy`.  
4. **Create the Chrome Extension**:  
   - Design the popup interface in `popup.html`.  
   - Implement scraping and API interactions in `popup.js`.  
   - Define permissions and background scripts in the manifest.  
5. **Connect Frontend and Backend**:  
   - Update API endpoint URLs in the extension to point to your deployed backend.  
   - Ensure CORS policies are properly configured if necessary.  
6. **Test the Application**:  
   - Install the Chrome extension in developer mode.  
   - Try adding items to a wishlist, creating new wishlists, and sharing them.  
   - Debug any issues that arise.  
   
## Utilizing Modal's Features for Better Performance  
   
Modal provides several features that enhance your application's performance and developer experience:  
   
- **Custom Container Images**: Define custom environments with all dependencies.  
- **Scaling Out**: Modal can scale your application to handle increased load without manual intervention.  
- **Serverless Execution**: Pay only for what you use, down to the second.  
- **Integration with Popular Frameworks**: Seamless support for FastAPI and other Python frameworks.  
   
### Example: Defining a Custom Image with Modal  
   
```python  
import modal  
   
image = modal.Image.debian_slim(python_version="3.12").pip_install(  
    "fastapi[standard]==0.115.4",  
    "pymongo==4.7.2",  
    "pydantic==2.7.1"  
)  
   
app = modal.App("wishlist-api", image=image)  
```  
   
### Example: Deploying the FastAPI App  
   
```python  
@web_app = FastAPI()  
   
# Define your API endpoints...  
   
@app.function()  
@modal.asgi_app()  
def fastapi_app():  
    return web_app  
```  
   
## Focusing on MongoDB + Serverless with Modal  
   
By combining MongoDB Atlas and Modal, you create a powerful, scalable, and cost-effective stack:  
   
- **Serverless Backend**: Modal's platform allows you to run your FastAPI application without managing servers.  
- **Cloud Database**: MongoDB Atlas provides a robust database that's accessible from your Modal functions.  
- **Scalability and Performance**: Both services handle scaling automatically, ensuring your app performs well under load.  
- **Cost Efficiency**: Utilizing the free tiers minimizes costs, making it accessible for personal projects and learning purposes.  
   
## Perfect for Kids, Friends, and Family Projects  
   
This wishlist app isn't just about technology; it's about connecting with others:  
   
- **Family Collaboration**: Involve your kids in building the app, teaching them about coding, databases, and cloud services.  
- **Shared Experiences**: Use the app to plan events, share gift ideas, or organize shopping lists with friends and family.  
- **Educational Opportunities**: Explore topics like data modeling, serverless architectures, and web development.  
   
## Conclusion  
   
Building a shareable wishlist application using MongoDB Atlas and Modal's serverless platform is both rewarding and educational. By focusing on proper data modeling with MongoDB, you ensure that your app is efficient and scalable. Modal's platform simplifies deployment and scaling, allowing you to concentrate on delivering value to your users.  
   
Whether you're a seasoned developer or just starting out, this project provides a hands-on experience with modern web technologies. It's a fantastic way to learn, collaborate, and maybe even spark an interest in coding among kids and family members.  
   
So why not give it a try? Build your own wishlist app today, and make sharing gift ideas easier and more fun than ever!  
   
---  
   
*Note: Always ensure that you handle sensitive information like database credentials securely, using environment variables or secrets management provided by your platform. Be mindful of the usage limits of free tiers and the terms of service of the services you use.*  
   
## Resources  
   
- **MongoDB Atlas**:  
  - [Get Started with Atlas](https://docs.atlas.mongodb.com/getting-started/)  
  - [Data Modeling Strategies](https://www.mongodb.com/datamodeling)  
- **Modal**:  
  - [Modal Documentation](https://modal.com/docs/)  
  - [Deploying FastAPI with Modal](https://modal.com/docs/guide/deploying-fastapi)  
- **FastAPI**:  
  - [FastAPI Documentation](https://fastapi.tiangolo.com/)  
- **Pydantic**:  
  - [Data Validation with Pydantic](https://pydantic-docs.helpmanual.io/)  
   
## Full Code

```modal-api.py
# main.py  
  
from pymongo import MongoClient  
from bson import ObjectId  
from fastapi import FastAPI, HTTPException, Body, Response  
from fastapi.responses import HTMLResponse  
from pydantic import BaseModel, Field  
import modal  
import os  
  
# --- Configuration ---  
  
# Please avoid hardcoding your MongoDB credentials directly in the code.  
# Use environment variables or configuration files to store sensitive information securely.  
MONGO_URI = ""
  
# --- Modal Setup ---  
  
# Define the image with necessary Python libraries.  
image = modal.Image.debian_slim(python_version="3.12").pip_install(  
    "fastapi[standard]==0.115.4",  
    "pymongo==4.7.2",  
    "pydantic==2.7.1"  
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
        raise HTTPException(status_code=404, detail="Wishlist not found or has no items")  
    return {"wishlist_id": wishlist_id, "items": serialized_items}  
  
@web_app.delete("/remove_item/{item_id}", tags=["Items"])  
async def remove_item(item_id: str):  
    """Removes a specific item from the wishlist by its ID."""  
    try:  
        obj_id = ObjectId(item_id)  
    except Exception:  
        raise HTTPException(status_code=400, detail="Invalid item ID format")  
  
    with MongoClient(MONGO_URI) as client:  
        items_collection = client.moonshop.wishlist_items  
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
```

```popup.html
<!DOCTYPE html>  
<html lang="en">  
<head>  
  <meta charset="UTF-8">  
  <title>Moonsh0p</title>  
  <!-- Bootstrap CSS -->  
  <link href="bootstrap/bootstrap.min.css" rel="stylesheet">  
  <style>  
    body {  
      font-family: 'Inter', sans-serif;  
      width: 350px;  
      padding: 15px;  
      background-color: #f9fafb;  
      margin: 0;  
    }  
    .title {  
      font-size: 14px;  
      font-weight: 500;  
      color: #374151;  
      max-width: 150px;  
      white-space: nowrap;  
      overflow: hidden;  
      text-overflow: ellipsis;  
    }  
    #addButton, #newWishlistButton, #shareWishlistButton {  
      width: 100%;  
    }  
    #status {  
      text-align: center;  
      font-size: 14px;  
      color: #6b7280;  
      margin-top: 15px;  
    }  
    #wishlistSelect {  
      margin-bottom: 15px;  
    }  
    .list-group-item {  
      opacity: 0;  
      transform: translateY(10px);  
      transition: opacity 0.3s ease, transform 0.3s ease;  
      cursor: pointer;  
    }  
    .list-group-item.show {  
      opacity: 1;  
      transform: translateY(0);  
    }  
    /* Adjust the container height to prevent too much scrolling */  
    #wishlistContainer {  
      max-height: 350px;  
      overflow-y: auto;  
    }  
  </style>  
</head>  
<body>  
  <h1 class="text-center mb-4">Moonsh0p</h1>  
  <div class="mb-3">  
    <select id="wishlistSelect" class="form-select">  
      <!-- Options will be populated by loadWishlists() -->  
    </select>  
  </div>  
  <div class="d-grid gap-2 mb-3">  
    <button id="newWishlistButton" class="btn btn-success">Create New Wishlist</button>  
    <button id="addButton" class="btn btn-primary">Add Current Item</button>  
    <button id="shareWishlistButton" class="btn btn-secondary">Share Wishlist</button>  
  </div>  
  
  <div id="wishlistContainer" class="list-group">  
    <!-- Wishlist items will be inserted here -->  
  </div>  
  
  <!-- Pagination controls -->  
  <div id="paginationContainer">  
    <!-- Pagination buttons will be inserted here -->  
  </div>  
  
  <p id="status">Loading wishlist...</p>  
  
  <!-- New Wishlist Modal -->  
  <div class="modal fade" id="newWishlistModal" tabindex="-1" aria-labelledby="newWishlistModalLabel" aria-hidden="true">  
    <div class="modal-dialog modal-dialog-centered">  
      <div class="modal-content">  
        <div class="modal-header">  
          <h5 class="modal-title">Create New Wishlist</h5>  
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>  
        </div>  
        <div class="modal-body">  
          <input type="text" id="newWishlistName" class="form-control" placeholder="Enter wishlist name">  
        </div>  
        <div class="modal-footer">  
          <button type="button" id="saveWishlistButton" class="btn btn-primary">Save Wishlist</button>  
        </div>  
      </div>  
    </div>  
  </div>  
  
  <!-- Bootstrap JS -->  
  <script src="bootstrap/bootstrap.bundle.min.js"></script>  
  <script src="popup.js"></script>  
</body>  
</html>  
```

```popup.js
// popup.js  
  
// Global variables for pagination  
let currentPage = 1;  
const itemsPerPage = 5; // Maximum of 5 items per page  
  
// Constants for local storage keys  
const LOCAL_WISHLIST_KEY = 'localWishlist';  
  
// API Base URL  
const BASE_URL = 'https://ranfysvalle02--wishlist-api-fastapi-app.modal.run'; // Update this to your actual base URL  
  
// API Endpoints  
const ENDPOINTS = {  
  getWishlists: `${BASE_URL}/get_wishlists`,  
  createWishlist: `${BASE_URL}/create_wishlist`,  
  viewItems: `${BASE_URL}/view_items`,  
  addItem: `${BASE_URL}/add_item`,  
  removeItem: `${BASE_URL}/remove_item`,  
  viewList: `${BASE_URL}/view_list`, // Endpoint for viewing a wishlist by ID  
};  
  
// Function to get the currently selected wishlist name and id  
function getCurrentWishlist() {  
  const select = document.getElementById('wishlistSelect');  
  const selectedOption = select.options[select.selectedIndex];  
  const wishlistName = selectedOption.text;  
  const wishlistId = selectedOption.value;  
  return { wishlistName, wishlistId };  
}  
  
// --- Local Storage Functions ---  
  
// Function to get the local wishlist items  
function getLocalWishlistItems() {  
  const data = localStorage.getItem(LOCAL_WISHLIST_KEY);  
  if (data) {  
    return JSON.parse(data);  
  } else {  
    return [];  
  }  
}  
  
// Function to save the local wishlist items  
function saveLocalWishlistItems(items) {  
  localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(items));  
}  
  
// Function to add an item to the local wishlist  
function addItemToLocalWishlist(item) {  
  const items = getLocalWishlistItems();  
  // Check if the item already exists based on its URL  
  const exists = items.some((existingItem) => existingItem.url === item.url);  
  if (!exists) {  
    items.push(item);  
    saveLocalWishlistItems(items);  
    return true;  
  } else {  
    return false;  
  }  
}  
  
// Function to remove an item from the local wishlist by URL  
function removeItemFromLocalWishlist(url) {  
  let items = getLocalWishlistItems();  
  items = items.filter((item) => item.url !== url);  
  saveLocalWishlistItems(items);  
}  
  
// --- API Functions ---  
  
// Function to get wishlists from the API  
async function getWishlists() {  
  try {  
    const response = await fetch(ENDPOINTS.getWishlists);  
    if (response.ok) {  
      const data = await response.json();  
      return data.wishlists; // Assuming API returns { "wishlists": [...] }  
    } else {  
      console.error('Failed to fetch wishlists');  
      return [];  
    }  
  } catch (error) {  
    console.error('Error fetching wishlists:', error);  
    return [];  
  }  
}  
  
// Function to create a new wishlist via the API  
async function createWishlist(wishlistName) {  
  try {  
    const response = await fetch(ENDPOINTS.createWishlist, {  
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({ wishlist_name: wishlistName }),  
    });  
  
    if (response.ok) {  
      const data = await response.json();  
      return { success: true, wishlistId: data.wishlist_id };  
    } else {  
      // Try to parse the error response  
      const errorData = await response.json();  
      console.error('Failed to create wishlist:', errorData);  
      return { success: false, error: errorData.detail || 'Unknown error' };  
    }  
  } catch (error) {  
    console.error('Error creating wishlist:', error);  
    return { success: false, error: error.message };  
  }  
}  
  
// Function to scrape the current page for product information  
function scrapePage() {  
  return new Promise((resolve) => {  
    // First, get the active tab  
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {  
      if (tabs.length === 0) {  
        resolve(null);  
        return;  
      }  
      var activeTab = tabs[0];  
  
      // Now execute the script in the context of the active tab  
      chrome.scripting.executeScript(  
        {  
          target: { tabId: activeTab.id },  
          function: () => {  
            // This function runs in the webpage context  
  
            // Helper function to get content from multiple selectors  
            function getContent(selectors, attribute = 'content') {  
              for (const selector of selectors) {  
                const element = document.querySelector(selector);  
                if (element) {  
                  // If we're looking for an attribute like 'content' or 'src'  
                  if (attribute && element.getAttribute(attribute)) {  
                    return element.getAttribute(attribute);  
                  }  
                  // For elements where text content is needed  
                  else if (!attribute && (element.innerText || element.textContent)) {  
                    return element.innerText || element.textContent;  
                  }  
                }  
              }  
              return null;  
            }  
  
            // Potential selectors for the title  
            const titleSelectors = [  
              'meta[property="og:title"]',  
              'meta[name="twitter:title"]',  
              'meta[name="title"]',  
              'meta[name="description"]', // Sometimes description is used as title  
              'title',  
              'h1',  
              'h2',  
            ];  
  
            // Potential selectors for the image  
            const imageSelectors = [  
              'meta[property="og:image"]',  
              'meta[name="twitter:image"]',  
              'meta[itemprop="image"]',  
              'link[rel="image_src"]',  
              'img[class*="product"]',  
              'img[class*="main"]',  
              'img[class*="featured"]',  
              'img[property="og:image"]',  
              'img[src]',  
            ];  
  
            // Get the title  
            const title = getContent(titleSelectors) || getContent(['title'], null) || 'No title found';  
  
            // Get the image URL  
            const image = getContent(imageSelectors, 'content') || getContent(imageSelectors, 'src') || '';  
  
            // Get the current page URL  
            const url = window.location.href;  
  
            // Return the scraped data  
            return { title, image, url };  
          },  
        },  
        (injectionResults) => {  
          if (chrome.runtime.lastError) {  
            console.error(chrome.runtime.lastError.message);  
            resolve(null);  
          } else if (injectionResults && injectionResults.length > 0) {  
            // The result is in injectionResults[0].result  
            resolve(injectionResults[0].result);  
          } else {  
            resolve(null);  
          }  
        }  
      );  
    });  
  });  
}  
  
// Function to add the item to the selected wishlist via the API or local storage  
async function addItem() {  
  const item = await scrapePage();  
  
  if (item) {  
    const currentWishlist = getCurrentWishlist();  
  
    if (currentWishlist.wishlistId === 'local') {  
      // Add item to local storage  
      const added = addItemToLocalWishlist(item);  
      if (added) {  
        // Update the UI  
        displayWishlist();  
        alert('Item added to your local wishlist!');  
      } else {  
        alert('This item already exists in your local wishlist.');  
      }  
    } else if (currentWishlist.wishlistId) {  
      // Create the item object to send to the API  
      const itemData = {  
        wishlist_id: currentWishlist.wishlistId,  
        title: item.title,  
        image: item.image,  
        url: item.url || '',  
      };  
  
      // Make a POST request to add_item  
      try {  
        const response = await fetch(ENDPOINTS.addItem, {  
          method: 'POST',  
          headers: {  
            'Content-Type': 'application/json',  
          },  
          body: JSON.stringify(itemData),  
        });  
  
        if (!response.ok) {  
          const errorData = await response.json();  
          alert('Failed to add item: ' + (errorData.detail || 'Unknown error'));  
        } else {  
          // Reset to the first page  
          currentPage = 1;  
          // Update the UI  
          displayWishlist();  
          // Show success alert  
          alert('Item added to "' + currentWishlist.wishlistName + '"!');  
        }  
      } catch (error) {  
        console.error('Error adding item:', error);  
        alert('Error adding item.');  
      }  
    } else {  
      alert('Please select a wishlist or create a new one.');  
      return;  
    }  
  } else {  
    alert('Failed to scrape the page.');  
  }  
}  
  
// Function to remove an item from the wishlist via the API or local storage  
async function removeItem(itemIdOrUrl) {  
  const currentWishlist = getCurrentWishlist();  
  
  if (currentWishlist.wishlistId === 'local') {  
    // Remove item from local storage using its URL  
    removeItemFromLocalWishlist(itemIdOrUrl);  
    // Update the UI  
    displayWishlist();  
  } else {  
    // Remove item via API  
    try {  
      const response = await fetch(`${ENDPOINTS.removeItem}/${encodeURIComponent(itemIdOrUrl)}`, {  
        method: 'DELETE',  
      });  
      if (!response.ok) {  
        console.error('Failed to remove item with ID:', itemIdOrUrl);  
        alert('Failed to remove item.');  
      } else {  
        // Item removed successfully  
        console.log('Item removed.');  
        // Update the UI  
        displayWishlist();  
      }  
    } catch (error) {  
      console.error('Error removing item:', error);  
      alert('Error removing item.');  
    }  
  }  
}  
  
// Function to get items in the wishlist from the API  
async function getWishlistItems(wishlist) {  
  if (wishlist.wishlistId === 'local') {  
    return getLocalWishlistItems();  
  }  
  
  try {  
    const response = await fetch(`${ENDPOINTS.viewItems}?wishlist_id=${encodeURIComponent(wishlist.wishlistId)}`);  
    if (response.ok) {  
      const data = await response.json();  
      return data.items; // Assuming API returns { "items": [...] }  
    } else {  
      console.error('Failed to fetch items for wishlist:', wishlist.wishlistName);  
      return [];  
    }  
  } catch (error) {  
    console.error('Error fetching wishlist items:', error);  
    return [];  
  }  
}  
  
// Function to load wishlists into the select dropdown  
async function loadWishlists() {  
  const wishlistArray = await getWishlists();  
  const select = document.getElementById('wishlistSelect');  
  
  // Clear existing options  
  select.innerHTML = '';  
  
  // Add "Local Wishlist" as the default option  
  const localOption = document.createElement('option');  
  localOption.value = 'local'; // value 'local' to distinguish from IDs  
  localOption.textContent = 'Local Wishlist';  
  select.appendChild(localOption);  
  
  // Append other wishlist options  
  wishlistArray.forEach((wishlist) => {  
    const option = document.createElement('option');  
    option.value = wishlist.id; // Use wishlist_id (MongoDB's _id)  
    option.textContent = wishlist.wishlist_name;  
    select.appendChild(option);  
  });  
  
  // Set current wishlist to "Local Wishlist" if not already set  
  if (!getCurrentWishlist().wishlistId) {  
    select.value = 'local';  
  }  
  
  // Update the share button state  
  updateShareButtonState();  
}  
  
// Function to update the share button state based on selected wishlist  
function updateShareButtonState() {  
  const currentWishlist = getCurrentWishlist();  
  const shareButton = document.getElementById('shareWishlistButton');  
  if (currentWishlist.wishlistId === 'local') {  
    // Disable the share button  
    shareButton.disabled = true;  
    shareButton.classList.add('disabled');  
  } else {  
    // Enable the share button  
    shareButton.disabled = false;  
    shareButton.classList.remove('disabled');  
  }  
}  
  
// Function to display the wishlist in the popup with pagination  
async function displayWishlist() {  
  const wishlistContainer = document.getElementById('wishlistContainer');  
  const status = document.getElementById('status');  
  const paginationContainer = document.getElementById('paginationContainer');  
  
  // Clear the container  
  wishlistContainer.innerHTML = '';  
  paginationContainer.innerHTML = '';  
  
  const currentWishlist = getCurrentWishlist();  
  
  let items = [];  
  
  if (currentWishlist.wishlistId === 'local') {  
    items = getLocalWishlistItems();  
  } else if (currentWishlist.wishlistId) {  
    items = await getWishlistItems(currentWishlist);  
  } else {  
    status.textContent = 'Your wishlist is empty.';  
    return;  
  }  
  
  if (!items || items.length === 0) {  
    status.textContent = 'Your wishlist is empty.';  
  } else {  
    status.textContent = '';  
    // Calculate total pages  
    const totalItems = items.length;  
    const totalPages = Math.ceil(totalItems / itemsPerPage);  
  
    // Adjust currentPage if out of range  
    if (currentPage > totalPages) {  
      currentPage = totalPages;  
    }  
    if (currentPage < 1) {  
      currentPage = 1;  
    }  
  
    // Get items for the current page  
    const startIndex = (currentPage - 1) * itemsPerPage;  
    const endIndex = startIndex + itemsPerPage;  
    const itemsToDisplay = items.slice(startIndex, endIndex);  
  
    // Create item elements  
    itemsToDisplay.forEach((item) => {  
      const itemCard = document.createElement('div');  
      itemCard.className = 'list-group-item d-flex align-items-center justify-content-between show';  
  
      // Left side (image and title)  
      const leftSide = document.createElement('a');  
      leftSide.href = item.url || '#';  
      leftSide.target = '_blank';  
      leftSide.className = 'd-flex align-items-center text-decoration-none text-dark flex-grow-1';  
  
      const img = document.createElement('img');  
      img.src = item.image || 'placeholder.png';  
      img.alt = item.title;  
      img.className = 'rounded me-3';  
      img.style.width = '60px';  
      img.style.height = '60px';  
      img.style.objectFit = 'cover';  
  
      const title = document.createElement('div');  
      title.className = 'title';  
      title.textContent = item.title;  
      title.title = item.title; // Show full title on hover  
  
      leftSide.appendChild(img);  
      leftSide.appendChild(title);  
  
      // Remove button  
      const removeButton = document.createElement('button');  
      removeButton.className = 'btn btn-sm btn-danger';  
      removeButton.textContent = 'Remove';  
      removeButton.addEventListener('click', async (event) => {  
        // Prevent link click  
        event.stopPropagation();  
        event.preventDefault();  
        // Remove the item  
        if (currentWishlist.wishlistId === 'local') {  
          await removeItem(item.url); // Use URL as unique identifier  
        } else {  
          await removeItem(item.id); // Use ID from API  
        }  
        // Item is removed in removeItem function  
      });  
  
      itemCard.appendChild(leftSide);  
      itemCard.appendChild(removeButton);  
  
      wishlistContainer.appendChild(itemCard);  
    });  
  
    // Create pagination controls if necessary  
    if (totalPages > 1) {  
      // Previous button  
      const prevButton = document.createElement('button');  
      prevButton.className = 'btn btn-secondary btn-sm me-2';  
      prevButton.textContent = 'Previous';  
      prevButton.disabled = currentPage === 1;  
      prevButton.addEventListener('click', () => {  
        currentPage--;  
        displayWishlist();  
      });  
  
      // Next button  
      const nextButton = document.createElement('button');  
      nextButton.className = 'btn btn-secondary btn-sm ms-2';  
      nextButton.textContent = 'Next';  
      nextButton.disabled = currentPage === totalPages;  
      nextButton.addEventListener('click', () => {  
        currentPage++;  
        displayWishlist();  
      });  
  
      // Page info  
      const pageInfo = document.createElement('span');  
      pageInfo.className = 'align-self-center mx-2';  
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;  
  
      // Pagination controls container  
      const paginationControls = document.createElement('div');  
      paginationControls.className = 'd-flex justify-content-center align-items-center mt-2';  
  
      paginationControls.appendChild(prevButton);  
      paginationControls.appendChild(pageInfo);  
      paginationControls.appendChild(nextButton);  
  
      paginationContainer.appendChild(paginationControls);  
    }  
  }  
}  
  
// Event listener for the "Add Current Item" button  
document.getElementById('addButton').addEventListener('click', async () => {  
  await addItem();  
});  
  
// Event listener for the wishlist select dropdown  
document.getElementById('wishlistSelect').addEventListener('change', async () => {  
  // Reset to the first page when changing wishlists  
  currentPage = 1;  
  await displayWishlist();  
  updateShareButtonState();  
});  
  
// Event listener for the "Create New Wishlist" button  
document.getElementById('newWishlistButton').addEventListener('click', () => {  
  // Show the modal  
  const newWishlistModal = new bootstrap.Modal(document.getElementById('newWishlistModal'));  
  newWishlistModal.show();  
});  
  
// Event listener for the modal "Save" button  
document.getElementById('saveWishlistButton').addEventListener('click', async () => {  
  const wishlistNameInput = document.getElementById('newWishlistName');  
  const wishlistName = wishlistNameInput.value.trim();  
  
  if (wishlistName) {  
    const result = await createWishlist(wishlistName);  
    if (result.success) {  
      await loadWishlists();  
      document.getElementById('wishlistSelect').value = result.wishlistId;  
      wishlistNameInput.value = ''; // Clear the input  
  
      // Hide the modal  
      const newWishlistModal = bootstrap.Modal.getInstance(document.getElementById('newWishlistModal'));  
      newWishlistModal.hide();  
  
      // Reset to the first page  
      currentPage = 1;  
      displayWishlist();  
      updateShareButtonState();  
  
      // Show success alert  
      alert('Wishlist "' + wishlistName + '" created!');  
    } else {  
      alert('Failed to create wishlist: ' + result.error);  
    }  
  } else {  
    alert('Please enter a name for your wishlist.');  
  }  
});  
  
// Event listener for the "Share Wishlist" button  
document.getElementById('shareWishlistButton').addEventListener('click', () => {  
  const currentWishlist = getCurrentWishlist();  
  if (currentWishlist.wishlistId === 'local') {  
    alert('Local wishlists cannot be shared.');  
    return;  
  }  
  
  // Generate the shareable link using the wishlist_id  
  const shareableLink = `${ENDPOINTS.viewList}/${currentWishlist.wishlistId}`;  
  // Copy the link to clipboard or display it  
  navigator.clipboard.writeText(shareableLink).then(() => {  
    alert(`Shareable link copied to clipboard:\n${shareableLink}`);  
  }).catch(err => {  
    alert(`Shareable link:\n${shareableLink}`);  
  });  
});  
  
// Display the wishlist when the popup loads  
document.addEventListener('DOMContentLoaded', async () => {  
  await loadWishlists();  
  await displayWishlist();  
  updateShareButtonState();  
});  
```

---  
   
*This blog post incorporates information and excerpts from the Modal documentation to provide a comprehensive guide. All trademarks are the property of their respective owners.*
