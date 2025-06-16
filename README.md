# moonshopping

---

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
   
---  
   
*This blog post incorporates information and excerpts from the Modal documentation to provide a comprehensive guide. All trademarks are the property of their respective owners.*