// Tech Verse — Common Layout & Event Handler

var NAV_FALLBACK_CATEGORIES = [
    { id: "laptops", name: "Laptops", icon: "fa-laptop" },
    { id: "monitors", name: "Monitors", icon: "fa-desktop" },
    { id: "components", name: "Components", icon: "fa-microchip" },
    { id: "gaming", name: "Gaming", icon: "fa-gamepad" },
    { id: "accessories", name: "Accessories", icon: "fa-headphones" },
    { id: "storage", name: "Storage", icon: "fa-hdd" },
    { id: "smartphones", name: "Tablets & iPads", icon: "fa-tablet-alt" },
    { id: "printers", name: "Printers", icon: "fa-print" }
];

function getNavCategories() {
    if (window.TechcartDB) {
        var cats = window.TechcartDB.getCategories();
        if (cats.length) return cats;
    }
    return NAV_FALLBACK_CATEGORIES;
}

document.addEventListener("DOMContentLoaded", () => {
    // Determine path prefix based on file depth
    const path = window.location.pathname;
    const isRoot = !path.includes("/buyer/") && !path.includes("/vendor/") && !path.includes("/admin/");
    const prefix = isRoot ? "" : "../";

    // Initialize Dark Mode immediately (before auth)
    if (localStorage.getItem('techverse-dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    function renderLayout() {
        injectNavbar(prefix, isRoot);
        injectFooter(prefix, isRoot);
        setupUserSessionControls(prefix);
        updateCartCount();
        updateWishlistCount();
    }

    // Show nav/footer immediately — do not wait for Firebase auth
    renderLayout();

    // Refresh user menu, categories, and badge counts when auth/cache arrive
    if (window.TechcartDB) {
        window.TechcartDB.onReady(renderLayout);
        window.TechcartDB.onCacheReady(renderLayout);
    } else {
        window.addEventListener("techcartdb-ready", function () {
            window.TechcartDB.onReady(renderLayout);
            window.TechcartDB.onCacheReady(renderLayout);
            renderLayout();
        }, { once: true });
    }

    window.addEventListener("cart-updated", updateCartCount);
    window.addEventListener("wishlist-updated", updateWishlistCount);
});

// Update Cart Badge Count
function updateCartCount() {
    if (!window.TechcartDB) return;
    const user = window.TechcartDB.getCurrentUser();
    const countEl = document.getElementById("cart-count");
    if (!countEl) return;
    if (user) {
        const cart = window.TechcartDB.getCart(user.id);
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        countEl.textContent = totalItems;
        countEl.classList.toggle("hidden", totalItems === 0);
    } else {
        countEl.textContent = "0";
        countEl.classList.add("hidden");
    }
}

// Update Wishlist Badge Count
function updateWishlistCount() {
    if (!window.TechcartDB) return;
    const user = window.TechcartDB.getCurrentUser();
    const countEl = document.getElementById("wishlist-count");
    if (!countEl) return;
    if (user) {
        const wishlist = window.TechcartDB.getWishlist(user.id);
        countEl.textContent = wishlist.length;
        countEl.classList.toggle("hidden", wishlist.length === 0);
    } else {
        countEl.textContent = "0";
        countEl.classList.add("hidden");
    }
}

// Set up User Session Controls
function setupUserSessionControls(prefix) {
    var logoutBtn = document.getElementById("nav-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            window.TechcartDB.logout().then(function () {
            Swal.fire({ icon: "success", title: "Logged Out", showConfirmButton: false, timer: 1500 })
                .then(function () { window.location.href = prefix + "index.html"; });
            });
        });
    }

    var mobileMenuBtn = document.getElementById("mobile-menu-btn");
    var mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", function () {
            mobileMenu.classList.toggle("hidden");
        });
    }

    var searchForm = document.getElementById("nav-search-form");
    if (searchForm) {
        searchForm.addEventListener("submit", function (e) {
            e.preventDefault();
            var q = document.getElementById("nav-search-input").value.trim();
            var cat = document.getElementById("nav-search-category").value;
            window.location.href = prefix + "buyer/products.html?search=" + encodeURIComponent(q) + "&category=" + encodeURIComponent(cat);
        });
    }

    var darkModeToggle = document.getElementById("dark-mode-toggle");
    if (darkModeToggle) {
        darkModeToggle.addEventListener("click", function () {
            document.body.classList.toggle("dark-mode");
            const isDark = document.body.classList.contains("dark-mode");
            localStorage.setItem("techverse-dark-mode", isDark);
            darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun text-xl"></i>' : '<i class="fas fa-moon text-xl"></i>';
        });
        
        // Set initial icon
        if (document.body.classList.contains("dark-mode")) {
            darkModeToggle.innerHTML = '<i class="fas fa-sun text-xl"></i>';
        }
    }
}

// Navbar template builder
function injectNavbar(prefix, isRoot) {
    const container = document.getElementById("navbar-container");
    if (!container) return;

    const currentUser = window.TechcartDB ? window.TechcartDB.getCurrentUser() : null;
    const categories = getNavCategories();

    // User section display
    let userAuthSection = "";
    if (currentUser) {
        let dashboardLink = prefix + "buyer/profile.html";
        if (currentUser.role === "admin") dashboardLink = prefix + "admin/dashboard.html";
        if (currentUser.role === "vendor") dashboardLink = prefix + "vendor/dashboard.html";

        userAuthSection = `
            <div class="relative group">
                <button class="flex items-center gap-2 text-slate-700 hover:text-red-600 font-medium py-2 transition-colors">
                    <i class="fas fa-user-circle text-xl"></i>
                    <span class="max-w-[100px] truncate hidden md:inline text-sm">${currentUser.name}</span>
                </button>
                <div class="absolute right-0 w-48 mt-2 bg-white/95 rounded-2xl shadow-2xl py-2 hidden group-hover:block z-50 border border-slate-200/80 backdrop-blur">
                    <a href="${dashboardLink}" class="block px-4 py-2.5 hover:bg-slate-50 text-sm rounded-xl mx-2 transition-colors"><i class="fas fa-tachometer-alt mr-2 brand-text-light"></i>Dashboard</a>
                    ${currentUser.role === 'buyer' ? '<a href="' + prefix + 'buyer/orders.html" class="block px-4 py-2.5 hover:bg-slate-50 text-sm rounded-xl mx-2 transition-colors"><i class="fas fa-shopping-bag mr-2 brand-text-light"></i>My Orders</a>' : ''}
                    <hr class="my-1">
                    <a href="#" id="nav-logout-btn" class="block px-4 py-2.5 hover:bg-red-50 text-red-500 text-sm font-semibold rounded-xl mx-2 transition-colors"><i class="fas fa-sign-out-alt mr-2"></i>Logout</a>
                </div>
            </div>
        `;
    } else {
        userAuthSection = `
            <a href="${prefix}login.html" class="brand-btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold">
                <i class="fas fa-sign-in-alt mr-1"></i>Login
            </a>
        `;
    }

    // Category options for search bar
    const categoryOptions = categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join("");

    // Category menu list for the mega menu
    const megaMenuCategories = categories.map(cat => `
        <a href="${prefix}buyer/products.html?category=${cat.id}" class="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
            <div class="w-10 h-10 rounded-xl brand-icon-soft flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                <i class="fas ${cat.icon}"></i>
            </div>
            <div>
                <p class="font-semibold text-slate-800 text-sm group-hover:text-red-600 transition-colors">${cat.name}</p>
                <p class="text-xs text-slate-400">Explore premium devices</p>
            </div>
        </a>
    `).join("");

    container.innerHTML = `
        <div class="czone-topbar py-2 px-4">
            <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                <div class="flex items-center gap-4">
                    <span><i class="fas fa-phone-alt mr-1.5"></i>+92 21 3481 7355</span>
                    <span><i class="fas fa-envelope mr-1.5"></i>support@techverse.pk</span>
                </div>
                <span>Free delivery across Pakistan on orders above Rs. 50,000</span>
            </div>
        </div>

        <header class="czone-header sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
                <a href="${prefix}index.html" class="flex items-center gap-2 shrink-0">
                    <div class="brand-btn-primary p-2.5 rounded-2xl text-white"><i class="fas fa-microchip text-lg"></i></div>
                    <span class="font-extrabold text-xl brand-text-primary">Tech<span class="brand-text-accent">Verse</span><span class="brand-text-accent text-sm font-bold ml-1">.pk</span></span>
                </a>

                <form id="nav-search-form" class="hidden md:flex flex-grow max-w-2xl border border-slate-200 rounded overflow-hidden bg-white shadow transition-all" style="focus-within:border-color:#0ea5e9;">
                    <select id="nav-search-category" class="bg-slate-50 text-slate-600 px-3 text-xs font-semibold border-r border-slate-200 focus:outline-none">
                        <option value="all">All Categories</option>
                        ${categoryOptions}
                    </select>
                    <input id="nav-search-input" type="text" placeholder="What are you looking for?" class="text-sm px-4 py-2.5 flex-grow focus:outline-none text-slate-700">
                    <button type="submit" class="brand-btn-primary px-5 flex items-center justify-center rounded-none"><i class="fas fa-search"></i></button>
                </form>

                <div class="flex items-center gap-4 text-slate-600">
                    <a href="${prefix}buyer/wishlist.html" class="relative hover:text-sky-500 py-2 transition-colors">
                        <i class="far fa-heart text-xl"></i>
                        <span id="wishlist-count" class="absolute -top-1 -right-2 brand-bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center hidden">0</span>
                    </a>
                    <a href="${prefix}buyer/cart.html" class="relative hover:text-sky-500 py-2 transition-colors">
                        <i class="fas fa-shopping-cart text-xl"></i>
                        <span id="cart-count" class="absolute -top-1 -right-2 brand-bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center hidden">0</span>
                    </a>
                    ${userAuthSection}
                    <button id="dark-mode-toggle" class="hover:text-sky-500 transition-colors py-2 ml-2">
                        <i class="fas fa-moon text-xl"></i>
                    </button>
                    <button id="mobile-menu-btn" class="md:hidden hover:text-sky-500 transition-colors ml-2"><i class="fas fa-bars text-xl"></i></button>
                </div>
            </div>

            <nav class="czone-nav-bar hidden md:block">
                <div class="max-w-7xl mx-auto px-4 flex items-center gap-1">
                    <div class="relative nav-item-categories">
                        <button class="brand-btn-accent text-white font-semibold text-sm px-5 py-2.5 flex items-center gap-2" style="border-radius: 0;">
                            <i class="fas fa-bars"></i> All Categories <i class="fas fa-chevron-down text-[10px]"></i>
                        </button>
                        <div class="mega-menu absolute left-0 w-[600px] bg-white/95 text-slate-900 rounded-b-[24px] shadow-2xl p-5 border border-slate-200/80 grid grid-cols-2 gap-3 z-50 backdrop-blur">
                            ${megaMenuCategories}
                        </div>
                    </div>
                    <a href="${prefix}index.html" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">Home</a>
                    <a href="${prefix}buyer/products.html" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">Products</a>
                    <a href="${prefix}buyer/products.html?category=laptops" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">Laptops</a>
                    <a href="${prefix}buyer/products.html?category=components" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">GPU</a>
                    <a href="${prefix}buyer/products.html?category=monitors" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">Monitors</a>
                    <a href="${prefix}buyer/products.html?category=gaming" class="text-white/85 hover:text-white px-4 py-2.5 text-sm font-medium transition-colors">Gaming</a>
                </div>
            </nav>

            <div id="mobile-menu" class="hidden md:hidden bg-white/95 border-t border-slate-200/80 px-4 py-4 backdrop-blur">
                <form class="flex border border-slate-200 rounded-2xl overflow-hidden mb-3" onsubmit="event.preventDefault(); window.location.href='${prefix}buyer/products.html?search='+encodeURIComponent(document.getElementById('nav-search-input-mobile').value);">
                    <input id="nav-search-input-mobile" type="text" placeholder="Search..." class="text-sm px-4 py-2 flex-grow focus:outline-none">
                    <button type="submit" class="brand-btn-primary text-white px-4 rounded-none"><i class="fas fa-search"></i></button>
                </form>
                <div class="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    <a href="${prefix}index.html" class="py-2 border-b">Home</a>
                    <a href="${prefix}buyer/products.html" class="py-2 border-b">Products</a>
                    <a href="${prefix}buyer/cart.html" class="py-2 border-b">Cart</a>
                    ${currentUser ? '<a href="#" id="nav-logout-btn-mobile" class="py-2 text-red-500">Logout</a>' : '<a href="' + prefix + 'login.html" class="py-2 text-sky-900">Login</a>'}
                </div>
            </div>
        </header>
    `;

    // Mobil logout handler since elements are injected
    const logoutMobileBtn = document.getElementById("nav-logout-btn-mobile");
    if (logoutMobileBtn) {
        logoutMobileBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.TechcartDB.logout().then(function () {
                window.location.href = prefix + "index.html";
            });
        });
    }
}

// Footer template builder
function injectFooter(prefix, isRoot) {
    const container = document.getElementById("footer-container");
    if (!container) return;

    container.innerHTML = `
        <footer class="brand-footer text-slate-300 pt-12 pb-6">
            <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <!-- Column 1: About Us -->
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <div class="brand-btn-accent p-2 rounded-xl text-white">
                            <i class="fas fa-microchip"></i>
                        </div>
                        <span class="font-extrabold text-xl tracking-tight text-white">Tech<span class="brand-text-accent">Verse</span></span>
                    </div>
                    <p class="text-sm leading-relaxed mb-4 text-slate-400">
                        Tech Verse is Pakistan's leading multi-vendor IT & gaming store, delivering components, laptops, and custom gaming gear right to your doorstep.
                    </p>
                    <div class="flex gap-3">
                        <a href="#" class="w-8 h-8 rounded-full bg-white/10 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-colors"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" class="w-8 h-8 rounded-full bg-white/10 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-colors"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="w-8 h-8 rounded-full bg-white/10 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-colors"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="w-8 h-8 rounded-full bg-white/10 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-colors"><i class="fab fa-linkedin-in"></i></a>
                    </div>
                </div>

                <!-- Column 2: Categories -->
                <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wider mb-4 border-l-2 brand-border-accent pl-3">Popular Categories</h4>
                    <ul class="space-y-2.5 text-sm">
                        <li><a href="${prefix}buyer/products.html?category=laptops" class="hover:text-sky-400 hover:underline transition-colors">Laptops</a></li>
                        <li><a href="${prefix}buyer/products.html?category=smartphones" class="hover:text-sky-400 hover:underline transition-colors">Smartphones</a></li>
                        <li><a href="${prefix}buyer/products.html?category=gaming" class="hover:text-sky-400 hover:underline transition-colors">Gaming Zone</a></li>
                        <li><a href="${prefix}buyer/products.html?category=components" class="hover:text-sky-400 hover:underline transition-colors">PC Components</a></li>
                        <li><a href="${prefix}buyer/products.html?category=storage" class="hover:text-sky-400 hover:underline transition-colors">Storage Devices</a></li>
                    </ul>
                </div>

                <!-- Column 3: Customer Support -->
                <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wider mb-4 border-l-2 brand-border-accent pl-3">Customer Support</h4>
                    <ul class="space-y-2.5 text-sm">
                        <li><a href="#" class="hover:text-teal-400 hover:underline transition-colors">Track Your Order</a></li>
                        <li><a href="#" class="hover:text-teal-400 hover:underline transition-colors">Easy Returns Policy</a></li>
                        <li><a href="#" class="hover:text-teal-400 hover:underline transition-colors">Warranty Claim Center</a></li>
                        <li><a href="#" class="hover:text-teal-400 hover:underline transition-colors">Shipping & Deliveries</a></li>
                        <li><a href="#" class="hover:text-teal-400 hover:underline transition-colors">Privacy & Terms</a></li>
                    </ul>
                </div>

                <!-- Column 4: Contact Us -->
                <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wider mb-4 border-l-2 brand-border-accent pl-3">Contact Details</h4>
                    <ul class="space-y-3.5 text-sm text-slate-400">
                        <li class="flex items-start gap-3">
                            <i class="fas fa-map-marker-alt brand-text-accent mt-1"></i>
                            <span>Suite 302, 3rd Floor, Techno City Mall, I.I. Chundrigar Road, Karachi, Pakistan.</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="fas fa-phone-alt brand-text-accent"></i>
                            <span>+92 21 111 234 567</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <i class="fas fa-envelope brand-text-accent"></i>
                            <span>sales@techverse.pk</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Footer Bottom -->
            <div class="max-w-7xl mx-auto px-4 pt-8 border-t border-slate-900 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p>&copy; 2026 Tech Verse. All Rights Reserved.</p>
                <div class="flex gap-4">
                    <i class="fab fa-cc-visa text-2xl hover:text-white transition-colors"></i>
                    <i class="fab fa-cc-mastercard text-2xl hover:text-white transition-colors"></i>
                    <i class="fab fa-cc-stripe text-2xl hover:text-white transition-colors"></i>
                    <i class="fas fa-money-bill-wave text-2xl hover:text-white transition-colors"></i>
                </div>
            </div>
        </footer>
    `;
}

// Global Cart & Wishlist Actions
window.CartActions = {
    addToCart: (productId, qty = 1) => {
        const user = window.TechcartDB.getCurrentUser();
        if (!user) {
            Swal.fire({
                icon: "warning",
                title: "Sign In Required",
                text: "Please sign in to add products to your shopping cart.",
                showCancelButton: true,
                confirmButtonText: "Sign In",
                confirmButtonColor: "#0f3b5f",
                cancelButtonColor: "#64748b"
            }).then((res) => {
                if (res.isConfirmed) {
                    const isRoot = !window.location.pathname.includes("/buyer/") && !window.location.pathname.includes("/vendor/") && !window.location.pathname.includes("/admin/");
                    const prefix = isRoot ? "" : "../";
                    window.location.href = prefix + "login.html";
                }
            });
            return;
        }

        const products = window.TechcartDB.getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            if (product.stock <= 0) {
                Swal.fire({ icon: "error", title: "Out of Stock", text: "This product is currently out of stock.", confirmButtonColor: "#da251c" });
                return;
            }
            window.TechcartDB.addToCart(user.id, product, qty);
            Swal.fire({
                icon: "success",
                title: "Added to Cart",
                text: `${product.name} has been added.`,
                showConfirmButton: false,
                timer: 1200
            });
        }
    },

    addToWishlist: (productId) => {
        const user = window.TechcartDB.getCurrentUser();
        if (!user) {
            Swal.fire({
                icon: "warning",
                title: "Sign In Required",
                text: "Please sign in to save products to your wishlist.",
                showCancelButton: true,
                confirmButtonText: "Sign In",
                confirmButtonColor: "#0f3b5f",
                cancelButtonColor: "#64748b"
            }).then((res) => {
                if (res.isConfirmed) {
                    const isRoot = !window.location.pathname.includes("/buyer/") && !window.location.pathname.includes("/vendor/") && !window.location.pathname.includes("/admin/");
                    const prefix = isRoot ? "" : "../";
                    window.location.href = prefix + "login.html";
                }
            });
            return;
        }

        const products = window.TechcartDB.getProducts();
        const product = products.find(p => p.id === productId);
        if (product) {
            const added = window.TechcartDB.addToWishlist(user.id, product);
            if (added) {
                Swal.fire({
                    icon: "success",
                    title: "Added to Wishlist",
                    text: `${product.name} has been saved.`,
                    showConfirmButton: false,
                    timer: 1200
                });
            } else {
                Swal.fire({
                    icon: "info",
                    title: "Already in Wishlist",
                    text: `${product.name} is already saved in your wishlist.`,
                    confirmButtonColor: "#0f3b5f"
                });
            }
        }
    }
};
