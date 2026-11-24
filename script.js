// Search form toggle
document.querySelector('#search-icon').onclick = () => {
    document.querySelector('#search-form').classList.toggle('active');
}

document.querySelector('#close').onclick = () => {
    document.querySelector('#search-form').classList.remove('active');
}

// ==================== GESTION DU PANIER ====================
let cart = JSON.parse(localStorage.getItem('fastfood_cart')) || [];

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function addToCart(name, price, image) {
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
    if (image) imageUrl = image;
    
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

function addToFavorites(name, priceArg, imageArg) {
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
    if (priceArg) price = priceArg;
    if (imageArg) imageUrl = imageArg;
    
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
                        <button onclick="addToCart('${name}', ${price}); closeModal();" class="ihb">${ihbMarkup('Ajouter au panier')}</button>
                        <button onclick="addToFavorites('${name}'); closeModal();" class="ihb">${ihbMarkup('Ajouter aux favoris')}</button>
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
    const formOpenedAt = Date.now();
    const dateField = orderForm.querySelector('[name="date"]');

    // Une date de commande ne peut pas être dans le passé
    function setMinDate() {
        if (!dateField) return;
        const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
        dateField.min = d.toISOString().slice(0, 16);
    }
    setMinDate();

    function fieldError(field) {
        const v = field.value.trim();
        if (field.required && !v) return 'Ce champ est obligatoire.';
        if (!v) return '';
        if (field.name === 'name' && v.length < 2) return 'Entrez votre nom complet.';
        if (field.name === 'Number' && !/^\+?[0-9 ().-]{8,16}$/.test(v)) return 'Entrez un numéro de téléphone valide.';
        if (field.name === 'order') {
            const n = Number(v);
            if (!Number.isInteger(n) || n < 1 || n > 50) return 'Choisissez une quantité entre 1 et 50.';
        }
        if (field.name === 'date') {
            const t = new Date(v).getTime();
            if (Number.isNaN(t) || t < Date.now() - 60000) return 'Choisissez une date et une heure à venir.';
        }
        if (field.name === 'address' && v.length < 5) return 'Précisez votre adresse de livraison.';
        return '';
    }

    function showFieldError(field, msg) {
        const out = document.getElementById(field.id + '-error');
        if (out) out.textContent = msg;
        if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
    }

    orderForm.addEventListener('input', e => {
        if (e.target.getAttribute('aria-invalid') === 'true') showFieldError(e.target, fieldError(e.target));
    });
    orderForm.addEventListener('reset', () => {
        orderForm.querySelectorAll('.of-input').forEach(f => showFieldError(f, ''));
        setTimeout(setMinDate, 0);
    });

    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Anti-spam : champ piège rempli, ou envoi en moins de 3 secondes après l'ouverture de la page
        if (this.elements['website'].value || Date.now() - formOpenedAt < 3000) return;

        setMinDate();
        let firstInvalid = null;
        this.querySelectorAll('.of-input').forEach(f => {
            const msg = fieldError(f);
            showFieldError(f, msg);
            if (msg && !firstInvalid) firstInvalid = f;
        });
        if (firstInvalid) { firstInvalid.focus(); return; }

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
