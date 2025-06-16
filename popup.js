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
  
// Password storage for the session    
const wishlistPasswords = {}; // Map of wishlistId to password    
  
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
async function createWishlist(wishlistName, password) {    
  try {    
    const response = await fetch(ENDPOINTS.createWishlist, {    
      method: 'POST',    
      headers: { 'Content-Type': 'application/json' },    
      body: JSON.stringify({ wishlist_name: wishlistName, password: password }),    
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
  
// Function to prompt for password    
function promptForPassword() {    
  return new Promise((resolve) => {    
    const passwordPromptModal = new bootstrap.Modal(document.getElementById('passwordPromptModal'));    
    const submitButton = document.getElementById('submitPasswordButton');    
    const passwordInput = document.getElementById('passwordInput');    
    const rememberPasswordCheck = document.getElementById('rememberPasswordCheck');    
  
    const handleSubmit = () => {    
      const password = passwordInput.value;    
      const rememberPassword = rememberPasswordCheck.checked;    
  
      // Clean up event listener    
      submitButton.removeEventListener('click', handleSubmit);    
      passwordPromptModal.hide();    
      passwordInput.value = '';    
      rememberPasswordCheck.checked = false;    
  
      resolve({ password, rememberPassword });    
    };    
  
    submitButton.addEventListener('click', handleSubmit);    
    passwordPromptModal.show();    
  });    
}    
  
// Function to remove an item from the wishlist via the API or local storage    
async function removeItem(itemIdOrUrl, password) {    
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
        headers: {    
          'Content-Type': 'application/json',    
        },    
        body: JSON.stringify({ password: password }),    
      });    
      if (!response.ok) {    
        const errorData = await response.json();    
        alert('Failed to remove item: ' + (errorData.detail || 'Unknown error'));    
        // If password is incorrect, remove it from the stored passwords    
        if (errorData.detail === 'Incorrect password') {    
          delete wishlistPasswords[currentWishlist.wishlistId];    
        }    
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
          let password = wishlistPasswords[currentWishlist.wishlistId];    
  
          if (!password) {    
            const result = await promptForPassword();    
            if (!result || !result.password) {    
              return;    
            }    
            password = result.password;    
            if (result.rememberPassword) {    
              wishlistPasswords[currentWishlist.wishlistId] = password;    
            }    
          }    
          await removeItem(item.id, password);    
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
  const passwordInput = document.getElementById('newWishlistPassword');    
  const wishlistName = wishlistNameInput.value.trim();    
  const password = passwordInput.value;    
  
  if (wishlistName) {    
    if (!password) {    
      alert('Please enter a password to create a wishlist.');    
      return; // Stop execution if password is empty    
    }    
    const result = await createWishlist(wishlistName, password);    
    if (result.success) {    
      await loadWishlists();    
      document.getElementById('wishlistSelect').value = result.wishlistId;    
      wishlistNameInput.value = ''; // Clear the input    
      passwordInput.value = ''; // Clear the password input    
  
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
