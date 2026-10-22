// Menu mobile toggle
let menu = document.querySelector('#menu-bars');
let navbar = document.querySelector('.navbar');

menu.onclick = () => {
    menu.classList.toggle('fa-times');
    navbar.classList.toggle('active');
}

window.onscroll = () => {
    menu.classList.remove('fa-times');
    navbar.classList.remove('active');
}

// Search form toggle
document.querySelector('#search-icon').onclick = () => {
    document.querySelector('#search-form').classList.toggle('active');
}

document.querySelector('#close').onclick = () => {
    document.querySelector('#search-form').classList.remove('active');
}

// Swiper home slider
var swiper = new Swiper(".home-slider", {
    spaceBetween: 30,
    centeredSlides: true,
    autoplay: {
        delay: 4500,
        disableOnInteraction: false,
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    loop: true,
});

// Swiper critique slider
var swiper2 = new Swiper(".critique-slider", {
    spaceBetween: 20,
    centeredSlides: true,
    autoplay: { 
        delay: 4000, 
        disableOnInteraction: false 
    },
    pagination: { 
        el: ".critique .swiper-pagination", 
        clickable: true 
    },
    loop: true,
    breakpoints: {
        0: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
    }
});

// ==================== GESTION DU PANIER ====================
let cart = JSON.parse(localStorage.getItem('fastfood_cart')) || [];

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function addToCart(name, price) {
    const dishBox = Array.from(document.querySelectorAll('.box')).find(box => 
        box.getAttribute('data-name') === name
    );
    
    let imageUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&size=300';
    if (dishBox) {
        const img = dishBox.querySelector('img');
        if (img) {
            imageUrl = img.src;
        }
    }
    
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: Date.now(),
            name: name,
            price: price,
            quantity: 1,
            image: imageUrl
        });
    }
    
    localStorage.setItem('fastfood_cart', JSON.stringify(cart));
    updateCartCount();
    
    showNotification(`✅ ${name} ajouté au panier !`, 'success');
}

// ==================== GESTION DES FAVORIS ====================
let favorites = JSON.parse(localStorage.getItem('fastfood_favorites')) || [];

function updateFavCount() {
    const favCount = document.getElementById('favCount');
    if (favCount) {
        favCount.textContent = favorites.length;
    }
}

function addToFavorites(name) {
    const dishBox = Array.from(document.querySelectorAll('.box')).find(box => 
        box.getAttribute('data-name') === name
    );
    
    let imageUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&size=300';
    let price = 0;
    
    if (dishBox) {
        const img = dishBox.querySelector('img');
        if (img) imageUrl = img.src;
        price = parseInt(dishBox.getAttribute('data-price')) || 0;
    }
    
    const existingFavorite = favorites.find(fav => fav.name === name);
    
    if (existingFavorite) {
        favorites = favorites.filter(fav => fav.name !== name);
        localStorage.setItem('fastfood_favorites', JSON.stringify(favorites));
        showNotification(`💔 ${name} retiré des favoris`, 'info');
        updateFavoriteIcon(name, false);
    } else {
        favorites.push({
            id: Date.now(),
            name: name,
            price: price,
            image: imageUrl
        });
        localStorage.setItem('fastfood_favorites', JSON.stringify(favorites));
        showNotification(`❤️ ${name} ajouté aux favoris !`, 'success');
        updateFavoriteIcon(name, true);
    }
    
    updateFavCount();
}

function updateFavoriteIcon(name, isFavorite) {
    const dishBoxes = document.querySelectorAll('.box');
    dishBoxes.forEach(box => {
        if (box.getAttribute('data-name') === name) {
            const heartIcon = box.querySelector('.fa-heart');
            if (heartIcon) {
                if (isFavorite) {
                    heartIcon.style.color = '#ff4444';
                    heartIcon.classList.add('fas');
                    heartIcon.classList.remove('far');
                } else {
                    heartIcon.style.color = '';
                    heartIcon.classList.remove('fas');
                    heartIcon.classList.add('far');
                }
            }
        }
    });
}

function initializeFavoriteIcons() {
    favorites.forEach(fav => {
        updateFavoriteIcon(fav.name, true);
    });
}

// ==================== MODAL DÉTAILS PLAT ====================
function viewDetails(name) {
    const dishBox = Array.from(document.querySelectorAll('.box')).find(box => 
        box.getAttribute('data-name') === name
    );
    
    if (!dishBox) return;
    
    const img = dishBox.querySelector('img');
    const price = dishBox.getAttribute('data-price');
    const stars = dishBox.querySelector('.stars');
    
    const modal = document.createElement('div');
    modal.className = 'dish-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-body">
                <img src="${img ? img.src : ''}" alt="${name}">
                <div class="modal-info">
                    <h2>${name}</h2>
                    <div class="modal-stars">${stars ? stars.innerHTML : ''}</div>
                    <p class="modal-price">${formatPrice(price)} FCFA</p>
                    <p class="modal-description">
                        Découvrez notre délicieux ${name}, préparé avec des ingrédients frais 
                        et de qualité. Un vrai régal pour vos papilles !
                    </p>
                    <div class="modal-actions">
                        <button onclick="addToCart('${name}', ${price}); closeModal();" class="btn-add-cart">
                            <i class="fas fa-shopping-cart"></i> Ajouter au panier
                        </button>
                        <button onclick="addToFavorites('${name}'); closeModal();" class="btn-add-fav">
                            <i class="fas fa-heart"></i> Ajouter aux favoris
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    }
}

function closeModal() {
    const modal = document.querySelector('.dish-modal');
    if (modal) {
        modal.remove();
    }
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ==================== NOTIFICATIONS ====================
function showNotification(message, type = 'success') {
    const oldNotif = document.querySelector('.custom-notification');
    if (oldNotif) oldNotif.remove();
    
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== FORMULAIRE DE COMMANDE ====================
const orderForm = document.getElementById('orderForm');
if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (!isLoggedIn) {
            if (confirm('Vous devez être connecté pour commander. Voulez-vous vous connecter maintenant ?')) {
                localStorage.setItem('redirect_after_login', 'index.html#order');
                window.location.href = 'connexion.html';
            }
            return;
        }
        
        showNotification(`✅ Commande enregistrée ! Nom: ${data.name}, Plat: ${data['food name']}, Quantité: ${data.order}`, 'success');
        this.reset();
    });
}

// ==================== NAVIGATION ACTIVE ====================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.navbar a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

// ==================== VÉRIFIER CONNEXION ====================
function checkLoginStatus() {
    const profileIcon = document.getElementById('profileIcon');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (profileIcon) {
        if (isLoggedIn === 'true') {
            profileIcon.style.background = '#00C851';
            profileIcon.style.color = '#fff';
        } else {
            profileIcon.style.background = '#eee';
            profileIcon.style.color = '#192a56';
        }
    }
}

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    updateFavCount();
    initializeFavoriteIcons();
    checkLoginStatus();
});