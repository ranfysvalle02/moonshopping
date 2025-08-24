// popup.js

// --- Global variables ---
let currentPage = 1;
const itemsPerPage = 5;
const BASE_URL = 'https://ranfysvalle02--wishlist-api-fastapi-app.modal.run';

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
  viewList: `${BASE_URL}/view_list`,
};

// Authentication tokens
let accessToken = '';
let refreshToken = '';

// --- Helper Functions ---

// Sets the loading state for a button
function setButtonLoading(button, isLoading) {
  const spinner = button.querySelector('.spinner-border');
  const text = button.querySelector('.button-text');
  if (isLoading) {
    button.disabled = true;
    spinner.classList.remove('d-none');
    if (text) text.style.opacity = '0';
  } else {
    button.disabled = false;
    spinner.classList.add('d-none');
    if (text) text.style.opacity = '1';
  }
}

// --- Token/Storage Management using chrome.storage.local ---

// Stores tokens using the asynchronous chrome.storage API.
async function storeTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  await chrome.storage.local.set({ accessToken, refreshToken });
}

// Loads tokens from chrome.storage.
async function loadTokens() {
  const data = await chrome.storage.local.get(['accessToken', 'refreshToken']);
  accessToken = data.accessToken || '';
  refreshToken = data.refreshToken || '';
}

// Clears tokens from chrome.storage.
async function clearTokens() {
  accessToken = '';
  refreshToken = '';
  await chrome.storage.local.remove(['accessToken', 'refreshToken']);
}

function isAuthenticated() {
  return !!accessToken;
}

function getCurrentWishlist() {
  const select = document.getElementById('wishlistSelect');
  const selectedIndex = select.selectedIndex;
  if (selectedIndex < 1) return { wishlistName: '', wishlistId: '' };
  const selectedOption = select.options[selectedIndex];
  return { wishlistName: selectedOption.text, wishlistId: selectedOption.value };
}

async function authenticatedFetch(url, options = {}) {
  if (!options.headers) options.headers = {};
  options.headers['Authorization'] = `Bearer ${accessToken}`;
  let response = await fetch(url, options);
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      options.headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, options);
    } else {
      alert('Session expired. Please log in again.');
      await logout();
      throw new Error('Authentication required');
    }
  }
  return response;
}

async function refreshAccessToken() {
  if (!refreshToken) return false;
  try {
    const response = await fetch(ENDPOINTS.refresh, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (response.ok) {
      const data = await response.json();
      await storeTokens(data.access_token, data.refresh_token);
      return true;
    }
    await clearTokens();
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    await clearTokens();
    return false;
  }
}

// --- Authentication Functions ---

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
    }
    const errorData = await response.json();
    alert('Registration failed: ' + (errorData.detail || 'Unknown error'));
    return false;
  } catch (error) {
    console.error('Error registering:', error);
    alert('Error registering.');
    return false;
  }
}

async function login(username, password) {
  try {
    const response = await fetch(ENDPOINTS.authenticate, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (response.ok) {
      const data = await response.json();
      await storeTokens(data.access_token, data.refresh_token);
      await chrome.storage.local.set({ username }); // Use chrome.storage
      return true;
    }
    const errorData = await response.json();
    alert('Login failed: ' + (errorData.detail || 'Unknown error'));
    return false;
  } catch (error) {
    console.error('Error logging in:', error);
    alert('Error logging in.');
    return false;
  }
}

async function logout() {
  await clearTokens();
  await chrome.storage.local.remove('username');
  showSection(document.getElementById('authSection'));
  hideSection(document.getElementById('welcomeSection'));
  hideSection(document.getElementById('mainContent'));
  document.getElementById('wishlistSelect').innerHTML = '';
  document.getElementById('wishlistContainer').innerHTML = '';
  document.getElementById('paginationContainer').innerHTML = '';
  document.getElementById('status').textContent = 'Please log in to view your wishlists.';
}

// --- API & Core Functions ---

function scrapePage() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error("No active tab found.");
        return resolve(null);
      }
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
          const siteConfigs = {
            'www.amazon.com': {
              title: ['#productTitle', '#title', '#ebooksProductTitle'],
              image: ['#imgTagWrapperId img#landingImage', '#img-canvas img', '#ebooks-img-canvas img#ebooksImgBlkFront'],
            }
          };
          const genericSelectors = {
            title: ['meta[property="og:title"]', 'meta[name="twitter:title"]', 'h1'],
            image: ['meta[property="og:image"]', 'meta[name="twitter:image"]'],
          };
          const querySelectors = (selectors, attribute = 'innerText') => {
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element) {
                let value = (attribute === 'innerText') ? element.innerText : element.getAttribute(attribute);
                if (value) return value.trim();
              }
            }
            return null;
          };
          const findBestImage = () => {
            let bestImage = { src: null, area: 0 };
            document.querySelectorAll('img').forEach(img => {
              if (img.src && img.naturalWidth > 200 && img.naturalHeight > 200 && img.offsetParent !== null) {
                const area = img.naturalWidth * img.naturalHeight;
                if (area > bestImage.area) bestImage = { src: img.src, area };
              }
            });
            return bestImage.src;
          };
          const hostname = window.location.hostname;
          const siteConfig = siteConfigs[hostname];
          let title = null, image = null;
          if (siteConfig) {
            title = querySelectors(siteConfig.title, 'innerText');
            image = querySelectors(siteConfig.image, 'src');
          }
          if (!title) title = querySelectors(genericSelectors.title, 'content') || querySelectors(genericSelectors.title, 'innerText');
          if (!image) image = querySelectors(genericSelectors.image, 'content');
          if (!title) title = document.title || 'No title found';
          if (!image) image = findBestImage();
          return { title: title || 'Title not found', image: image || '', url: window.location.href };
        },
      }, (injectionResults) => {
        if (chrome.runtime.lastError) {
          console.error("Script injection failed: ", chrome.runtime.lastError.message);
          resolve(null);
        } else {
          resolve(injectionResults?.[0]?.result || null);
        }
      });
    });
  });
}

async function getWishlists() {
  try {
    const response = await authenticatedFetch(ENDPOINTS.getWishlists);
    return response.ok ? (await response.json()).wishlists : [];
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    return [];
  }
}

async function createWishlist(wishlistName) {
  try {
    const response = await authenticatedFetch(ENDPOINTS.createWishlist, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wishlist_name: wishlistName }),
    });
    return response.ok ? { success: true, wishlistId: (await response.json()).wishlist_id } : { success: false, error: (await response.json()).detail || 'Unknown error' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function addItem() {
  const item = await scrapePage();
  if (!item) return alert('Failed to scrape product details from this page.');
  const currentWishlist = getCurrentWishlist();
  if (!currentWishlist.wishlistId) return alert('Please select a wishlist or create a new one.');
  try {
    const itemData = { wishlist_id: currentWishlist.wishlistId, title: item.title, image: item.image, url: item.url };
    const response = await authenticatedFetch(ENDPOINTS.addItem, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData),
    });
    if (!response.ok) {
      alert('Failed to add item: ' + ((await response.json()).detail || 'Unknown error'));
    } else {
      currentPage = 1;
      await displayWishlist();
      alert('Item added to "' + currentWishlist.wishlistName + '"!');
    }
  } catch (error) {
    console.error('Error adding item:', error);
    alert('Error adding item.');
  }
}

async function removeItem(itemId, itemElement) {
  itemElement.style.cssText = 'opacity:0; transform:translateX(50px); height:0; padding:0; margin:0; border:none;';
  try {
    const response = await authenticatedFetch(`${ENDPOINTS.removeItem}/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
    if (!response.ok) {
      alert('Failed to remove item: ' + ((await response.json()).detail || 'Unknown error'));
      itemElement.style.cssText = ''; // Revert on failure
    } else {
      setTimeout(() => displayWishlist(), 400);
    }
  } catch (error) {
    console.error('Error removing item:', error);
    alert('Error removing item.');
    itemElement.style.cssText = ''; // Revert on error
  }
}

async function getWishlistItems(wishlist) {
  try {
    const response = await authenticatedFetch(`${ENDPOINTS.viewItems}?wishlist_id=${encodeURIComponent(wishlist.wishlistId)}`);
    return response.ok ? (await response.json()).items || [] : [];
  } catch (error) {
    console.error('Error fetching wishlist items:', error);
    return [];
  }
}

// --- UI Functions ---

function showSection(section) {
  section.classList.remove('hidden');
  section.classList.add('section-visible');
}

function hideSection(section) {
  section.classList.add('hidden');
  section.classList.remove('section-visible');
}

function updateShareButtonState() {
  document.getElementById('shareWishlistButton').disabled = !getCurrentWishlist().wishlistId;
}

async function loadWishlists() {
  const wishlistArray = await getWishlists();
  const select = document.getElementById('wishlistSelect');
  select.innerHTML = '<option value="" disabled selected>Select a Wishlist</option>';
  wishlistArray.forEach((wishlist) => {
    select.innerHTML += `<option value="${wishlist.id}">${wishlist.wishlist_name}</option>`;
  });
  if (wishlistArray.length > 0) {
    select.value = wishlistArray[0].id;
    await displayWishlist();
  }
  updateShareButtonState();
}

async function displayWishlist() {
  const wishlistContainer = document.getElementById('wishlistContainer');
  const status = document.getElementById('status');
  const paginationContainer = document.getElementById('paginationContainer');
  wishlistContainer.innerHTML = '';
  paginationContainer.innerHTML = '';
  const currentWishlist = getCurrentWishlist();

  if (!currentWishlist.wishlistId) {
    status.textContent = 'Select a wishlist to view items.';
    return;
  }

  const items = await getWishlistItems(currentWishlist);

  if (!items || items.length === 0) {
    status.textContent = 'This wishlist is empty.';
  } else {
    status.textContent = '';
    const totalPages = Math.ceil(items.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const itemsToDisplay = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    itemsToDisplay.forEach((item, index) => {
      const itemCard = document.createElement('div');
      itemCard.className = 'list-group-item d-flex align-items-center justify-content-between';
      itemCard.innerHTML = `
        <a href="${item.url || '#'}" target="_blank" class="d-flex align-items-center text-decoration-none text-dark flex-grow-1">
          <img src="${item.image || 'placeholder.png'}" alt="${item.title}" class="rounded me-3" style="width:60px; height:60px; object-fit:cover;">
          <div class="title" title="${item.title}">${item.title}</div>
        </a>
        <button class="btn btn-sm btn-danger remove-btn">Remove</button>
      `;
      wishlistContainer.appendChild(itemCard);
      itemCard.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation(); e.preventDefault();
        removeItem(item.id, itemCard);
      });
      setTimeout(() => itemCard.classList.add('show'), index * 100);
    });

    // Pagination logic
    if (totalPages > 1) {
      const paginationControls = document.createElement('nav');
      paginationControls.className = 'd-flex justify-content-center align-items-center mt-3';

      const prevButton = document.createElement('button');
      prevButton.className = 'btn btn-secondary btn-sm me-2';
      prevButton.innerHTML = '&laquo; Previous';
      prevButton.disabled = currentPage === 1;
      prevButton.addEventListener('click', () => {
        currentPage--;
        displayWishlist();
      });

      const nextButton = document.createElement('button');
      nextButton.className = 'btn btn-secondary btn-sm ms-2';
      nextButton.innerHTML = 'Next &raquo;';
      nextButton.disabled = currentPage === totalPages;
      nextButton.addEventListener('click', () => {
        currentPage++;
        displayWishlist();
      });

      const pageInfo = document.createElement('span');
      pageInfo.className = 'align-self-center mx-2';
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
      
      paginationControls.appendChild(prevButton);
      paginationControls.appendChild(pageInfo);
      paginationControls.appendChild(nextButton);
      
      paginationContainer.appendChild(paginationControls);
    }
  }
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', async () => {
  await loadTokens();
  const data = await chrome.storage.local.get('username');
  if (isAuthenticated()) {
    hideSection(document.getElementById('authSection'));
    showSection(document.getElementById('welcomeSection'));
    showSection(document.getElementById('mainContent'));
    document.getElementById('welcomeMessage').textContent = `Welcome back, ${data.username || 'User'}!`;
    await loadWishlists();
  } else {
    showSection(document.getElementById('authSection'));
    hideSection(document.getElementById('welcomeSection'));
    hideSection(document.getElementById('mainContent'));
    document.getElementById('status').textContent = 'Please log in to view your wishlists.';
  }
  updateShareButtonState();
});

document.getElementById('addButton').addEventListener('click', async () => {
  if (!isAuthenticated()) { alert('Please log in to add items.'); return; }
  await addItem();
});

document.getElementById('wishlistSelect').addEventListener('change', async () => {
  currentPage = 1;
  await displayWishlist();
  updateShareButtonState();
});

document.getElementById('newWishlistButton').addEventListener('click', () => {
  if (!isAuthenticated()) { alert('Please log in to create wishlists.'); return; }
  new bootstrap.Modal(document.getElementById('newWishlistModal')).show();
});

document.getElementById('saveWishlistButton').addEventListener('click', async () => {
  const wishlistNameInput = document.getElementById('newWishlistName');
  const wishlistName = wishlistNameInput.value.trim();
  if (wishlistName) {
    const result = await createWishlist(wishlistName);
    if (result.success) {
      await loadWishlists();
      document.getElementById('wishlistSelect').value = result.wishlistId;
      wishlistNameInput.value = '';
      bootstrap.Modal.getInstance(document.getElementById('newWishlistModal')).hide();
      currentPage = 1;
      await displayWishlist();
      updateShareButtonState();
      alert(`Wishlist "${wishlistName}" created!`);
    } else {
      alert(`Failed to create wishlist: ${result.error}`);
    }
  } else {
    alert('Please enter a name for your wishlist.');
  }
});

document.getElementById('shareWishlistButton').addEventListener('click', () => {
  const currentWishlist = getCurrentWishlist();
  if (!currentWishlist.wishlistId) return alert('Please select a wishlist to share.');
  const shareableLink = `${ENDPOINTS.viewList}/${currentWishlist.wishlistId}`;
  navigator.clipboard.writeText(shareableLink)
    .then(() => alert(`Shareable link copied to clipboard:\n${shareableLink}`))
    .catch(() => alert(`Shareable link:\n${shareableLink}`));
});

document.getElementById('loginButton').addEventListener('click', () => {
  new bootstrap.Modal(document.getElementById('authModal')).show();
});

document.getElementById('logoutButton').addEventListener('click', async () => {
  await logout();
});

document.getElementById('loginModalButton').addEventListener('click', async (event) => {
  const loginButton = event.currentTarget;
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  if (!username || !password) return alert('Please enter username and password.');

  setButtonLoading(loginButton, true);
  try {
    const success = await login(username, password);
    if (success) {
      bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
      hideSection(document.getElementById('authSection'));
      showSection(document.getElementById('welcomeSection'));
      showSection(document.getElementById('mainContent'));
      document.getElementById('welcomeMessage').textContent = `Welcome back, ${username}!`;
      document.getElementById('usernameInput').value = '';
      document.getElementById('passwordInput').value = '';
      await loadWishlists();
    }
  } finally {
    setButtonLoading(loginButton, false);
  }
});

document.getElementById('registerModalButton').addEventListener('click', async (event) => {
  const registerButton = event.currentTarget;
  const username = document.getElementById('usernameInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  if (!username || !password) return alert('Please enter username and password.');
  
  setButtonLoading(registerButton, true);
  try {
    const success = await register(username, password);
    if (success) {
      document.getElementById('usernameInput').value = '';
      document.getElementById('passwordInput').value = '';
    }
  } finally {
    setButtonLoading(registerButton, false);
  }
});