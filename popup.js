// popup.js  
  
// Global variables for pagination  
let currentPage = 1;  
const itemsPerPage = 5; // Maximum of 5 items per page  
  
// API Base URL  
const BASE_URL = 'https://ranfysvalle02--wishlist-api-fastapi-app.modal.run'; // Update this to your actual base URL  
  
// API Endpoints  
const ENDPOINTS = {  
  register: `${BASE_URL}/register`,  
  authenticate: `${BASE_URL}/authenticate`,  
  refresh: `${BASE_URL}/refresh`,  
  getWishlists: `${BASE_URL}/get_wishlists`,  
  createWishlist: `${BASE_URL}/create_wishlist`,  
  viewItems: `${BASE_URL}/view_items`,  
  addItem: `${BASE_URL}/add_item`,  
  removeItem: `${BASE_URL}/remove_item`,  
  viewList: `${BASE_URL}/view_list`, // Endpoint for viewing a wishlist by ID  
};  
  
// Authentication tokens  
let accessToken = '';  
let refreshToken = '';  
  
// Function to store tokens in local storage  
function storeTokens(access, refresh) {  
  accessToken = access;  
  refreshToken = refresh;  
  localStorage.setItem('accessToken', accessToken);  
  localStorage.setItem('refreshToken', refreshToken);  
}  
  
// Function to load tokens from local storage  
function loadTokens() {  
  accessToken = localStorage.getItem('accessToken') || '';  
  refreshToken = localStorage.getItem('refreshToken') || '';  
}  
  
// Function to clear tokens  
function clearTokens() {  
  accessToken = '';  
  refreshToken = '';  
  localStorage.removeItem('accessToken');  
  localStorage.removeItem('refreshToken');  
}  
  
// Function to check if the user is authenticated  
function isAuthenticated() {  
  return !!accessToken;  
}  
  
// Function to get the currently selected wishlist name and id  
function getCurrentWishlist() {  
  const select = document.getElementById('wishlistSelect');  
  const selectedIndex = select.selectedIndex;  
  if (selectedIndex < 0) {  
    // No option is selected  
    return { wishlistName: '', wishlistId: '' };  
  }  
  const selectedOption = select.options[selectedIndex];  
  const wishlistName = selectedOption.text;  
  const wishlistId = selectedOption.value;  
  return { wishlistName, wishlistId };  
}  
  
// Function to make authenticated API calls  
async function authenticatedFetch(url, options = {}) {  
  if (!options.headers) {  
    options.headers = {};  
  }  
  options.headers['Authorization'] = `Bearer ${accessToken}`;  
  
  let response = await fetch(url, options);  
  
  if (response.status === 401) {  
    // Try to refresh the token  
    const refreshed = await refreshAccessToken();  
    if (refreshed) {  
      options.headers['Authorization'] = `Bearer ${accessToken}`;  
      response = await fetch(url, options);  
    } else {  
      // Failed to refresh token, force logout  
      alert('Session expired. Please log in again.');  
      logout();  
      throw new Error('Authentication required');  
    }  
  }  
  
  return response;  
}  
  
// Function to refresh access token  
async function refreshAccessToken() {  
  if (!refreshToken) {  
    return false;  
  }  
  
  try {  
    const response = await fetch(ENDPOINTS.refresh, {  
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({ refresh_token: refreshToken }),  
    });  
  
    if (response.ok) {  
      const data = await response.json();  
      storeTokens(data.access_token, data.refresh_token);  
      return true;  
    } else {  
      clearTokens();  
      return false;  
    }  
  } catch (error) {  
    console.error('Error refreshing token:', error);  
    clearTokens();  
    return false;  
  }  
}  
  
// --- Authentication Functions ---  
  
// Function to register a new user  
async function register(username, password) {  
  try {  
    const response = await fetch(ENDPOINTS.register, {  
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({ username, password }),  
    });  
  
    if (response.ok) {  
      alert('Registration successful! You can now log in.');  
      return true;  
    } else {  
      const errorData = await response.json();  
      alert('Registration failed: ' + (errorData.detail || 'Unknown error'));  
      return false;  
    }  
  } catch (error) {  
    console.error('Error registering:', error);  
    alert('Error registering.');  
    return false;  
  }  
}  
  
// Function to authenticate a user (login)  
async function login(username, password) {  
  try {  
    const response = await fetch(ENDPOINTS.authenticate, {  
      method: 'POST',  
      headers: { 'Content-Type': 'application/json' },  
      body: JSON.stringify({ username, password }),  
    });  
  
    if (response.ok) {  
      const data = await response.json();  
      storeTokens(data.access_token, data.refresh_token);  
      // Store the username for display purposes  
      localStorage.setItem('username', username);  
      return true;  
    } else {  
      const errorData = await response.json();  
      alert('Login failed: ' + (errorData.detail || 'Unknown error'));  
      return false;  
    }  
  } catch (error) {  
    console.error('Error logging in:', error);  
    alert('Error logging in.');  
    return false;  
  }  
}  
  
// Function to logout  
function logout() {  
  clearTokens();  
  // Clear stored username  
  localStorage.removeItem('username');  
  // Update UI  
  const authSection = document.getElementById('authSection');  
  const welcomeSection = document.getElementById('welcomeSection');  
  const mainContent = document.getElementById('mainContent');  
  showSection(authSection);  
  hideSection(welcomeSection);  
  hideSection(mainContent);  
  document.getElementById('wishlistSelect').innerHTML = '';  
  document.getElementById('wishlistContainer').innerHTML = '';  
  document.getElementById('status').textContent = 'Please log in to view your wishlists.';  
}  
  
// --- API Functions ---  
  
// Function to get wishlists from the API  
async function getWishlists() {  
  try {  
    const response = await authenticatedFetch(ENDPOINTS.getWishlists);  
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
    const response = await authenticatedFetch(ENDPOINTS.createWishlist, {  
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
  
// Function to add the item to the selected wishlist via the API  
async function addItem() {  
  const item = await scrapePage();  
  
  if (item) {  
    const currentWishlist = getCurrentWishlist();  
  
    if (currentWishlist.wishlistId) {  
      // Create the item object to send to the API  
      const itemData = {  
        wishlist_id: currentWishlist.wishlistId,  
        title: item.title,  
        image: item.image,  
        url: item.url || '',  
      };  
  
      // Make a POST request to add_item  
      try {  
        const response = await authenticatedFetch(ENDPOINTS.addItem, {  
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
          await displayWishlist();  
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
  
// Function to remove an item from the wishlist via the API  
async function removeItem(itemId) {  
  try {  
    const response = await authenticatedFetch(`${ENDPOINTS.removeItem}/${encodeURIComponent(itemId)}`, {  
      method: 'DELETE',  
    });  
    if (!response.ok) {  
      const errorData = await response.json();  
      alert('Failed to remove item: ' + (errorData.detail || 'Unknown error'));  
    } else {  
      // Item removed successfully  
      console.log('Item removed.');  
      // Update the UI  
      await displayWishlist();  
    }  
  } catch (error) {  
    console.error('Error removing item:', error);  
    alert('Error removing item.');  
  }  
}  
  
// Function to get items in the wishlist from the API  
async function getWishlistItems(wishlist) {  
  try {  
    const response = await authenticatedFetch(  
      `${ENDPOINTS.viewItems}?wishlist_id=${encodeURIComponent(wishlist.wishlistId)}`  
    );  
    if (response.ok) {  
      const data = await response.json();  
      // Ensure data is structured as expected  
      return data.items || []; // Assuming API returns { "items": [...] }  
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
  
  // Add the default 'Select a Wishlist' option  
  const defaultOption = document.createElement('option');  
  defaultOption.value = '';  
  defaultOption.disabled = true;  
  defaultOption.selected = true;  
  defaultOption.textContent = 'Select a Wishlist';  
  select.appendChild(defaultOption);  
  
  // Append wishlist options  
  wishlistArray.forEach((wishlist) => {  
    const option = document.createElement('option');  
    option.value = wishlist.id; // Use wishlist_id (assumed to be 'id')  
    option.textContent = wishlist.wishlist_name;  
    select.appendChild(option);  
  });  
  
  if (wishlistArray.length > 0) {  
    // Select the first wishlist by default without dispatching the 'change' event  
    select.value = wishlistArray[0].id;  
  
    // Manually call displayWishlist  
    await displayWishlist();  
  }  
  
  // Update the share button state  
  updateShareButtonState();  
}  
  
// Function to update the share button state based on selected wishlist  
function updateShareButtonState() {  
  const currentWishlist = getCurrentWishlist();  
  const shareButton = document.getElementById('shareWishlistButton');  
  if (!currentWishlist.wishlistId) {  
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
  
  if (!currentWishlist.wishlistId) {  
    status.textContent = 'Please select a wishlist to view items.';  
    return;  
  }  
  
  let items = [];  
  
  items = await getWishlistItems(currentWishlist);  
  
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
        await removeItem(item.id);  
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
  
// Smooth transitions when showing/hiding sections  
function showSection(section) {  
  // Remove the 'hidden' class to start the transition  
  section.classList.remove('hidden');  
  
  // Add the 'section-visible' class to ensure the section is displayed  
  section.classList.add('section-visible');  
  
  // Force a reflow to ensure the transition starts correctly  
  void section.offsetWidth;  
}  
  
function hideSection(section) {  
  // Check if section is already hidden  
  if (section.classList.contains('hidden')) {  
    return;  
  }  
  
  // Define the event handler  
  function handleTransitionEnd(event) {  
    // Ensure the event is for opacity transition  
    if (event.propertyName === 'opacity') {  
      section.classList.remove('section-visible');  
      // Clean up the event listener  
      section.removeEventListener('transitionend', handleTransitionEnd);  
    }  
  }  
  
  // Add the transitionend event listener  
  section.addEventListener('transitionend', handleTransitionEnd);  
  
  // Add the 'hidden' class to start the transition  
  section.classList.add('hidden');  
}  
  
// Event listener for the "Add Current Item" button  
document.getElementById('addButton').addEventListener('click', async () => {  
  if (!isAuthenticated()) {  
    alert('Please log in to add items.');  
    return;  
  }  
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
  if (!isAuthenticated()) {  
    alert('Please log in to create wishlists.');  
    return;  
  }  
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
      await displayWishlist();  
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
  if (!currentWishlist.wishlistId) {  
    alert('Please select a wishlist to share.');  
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
  
// Event listener for the "Login / Register" button  
document.getElementById('loginButton').addEventListener('click', () => {  
  // Show the modal  
  const authModal = new bootstrap.Modal(document.getElementById('authModal'));  
  authModal.show();  
});  
  
// Event listener for the "Logout" button  
document.getElementById('logoutButton').addEventListener('click', () => {  
  logout();  
});  
  
// Event listener for the "Login" button in the auth modal  
document.getElementById('loginModalButton').addEventListener('click', async () => {  
  const username = document.getElementById('usernameInput').value.trim();  
  const password = document.getElementById('passwordInput').value;  
  
  if (username && password) {  
    const success = await login(username, password);  
    if (success) {  
      // Hide the modal  
      const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));  
      authModal.hide();  
  
      // Update UI  
      const authSection = document.getElementById('authSection');  
      const welcomeSection = document.getElementById('welcomeSection');  
      const mainContent = document.getElementById('mainContent');  
      hideSection(authSection);  
      showSection(welcomeSection);  
      showSection(mainContent);  
      document.getElementById('welcomeMessage').textContent = 'Welcome, ' + username + '!';  
  
      // Clear input fields  
      document.getElementById('usernameInput').value = '';  
      document.getElementById('passwordInput').value = '';  
  
      // Load wishlists and display  
      await loadWishlists();  
    }  
  } else {  
    alert('Please enter username and password.');  
  }  
});  
  
// Event listener for the "Register" button in the auth modal  
document.getElementById('registerModalButton').addEventListener('click', async () => {  
  const username = document.getElementById('usernameInput').value.trim();  
  const password = document.getElementById('passwordInput').value;  
  
  if (username && password) {  
    const success = await register(username, password);  
    if (success) {  
      // You can auto-login the user after registration if desired  
      // Or prompt them to log in  
      // For now, we clear the input fields  
      document.getElementById('usernameInput').value = '';  
      document.getElementById('passwordInput').value = '';  
    }  
  } else {  
    alert('Please enter username and password.');  
  }  
});  
  
// Display the correct sections when the popup loads  
document.addEventListener('DOMContentLoaded', async () => {  
  loadTokens();  
  const authSection = document.getElementById('authSection');  
  const welcomeSection = document.getElementById('welcomeSection');  
  const mainContent = document.getElementById('mainContent');  
  
  if (isAuthenticated()) {  
    hideSection(authSection);  
    showSection(welcomeSection);  
    showSection(mainContent);  
  
    const username = localStorage.getItem('username') || 'User';  
    document.getElementById('welcomeMessage').textContent = 'Welcome, ' + username + '!';  
    await loadWishlists();  
    // Removed extra call to displayWishlist()  
    // await displayWishlist();  
  } else {  
    showSection(authSection);  
    hideSection(welcomeSection);  
    hideSection(mainContent);  
    document.getElementById('status').textContent = 'Please log in to view your wishlists.';  
  }  
  updateShareButtonState();  
});  