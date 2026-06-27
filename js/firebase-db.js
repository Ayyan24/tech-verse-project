// Tech Verse — Firebase Database Layer
// Exposes window.TechcartDB backed by Firestore + Firebase Auth.

(function () {

    // ─── Default Seed Data ────────────────────────────────────────────────────
    var IMG = "https://static.webx.pk/files/87161/Images";

    var DEFAULT_CATEGORIES = [
        { id: "laptops",     name: "Laptops",          icon: "fa-laptop",      image: IMG + "/laptops-87161-101125021226_w_240_h_240.avif" },
        { id: "monitors",    name: "Monitors",          icon: "fa-desktop",     image: IMG + "/Copy-of-Monitors-87161-180426080712_w_1090_h_600.avif" },
        { id: "components",  name: "Components",        icon: "fa-microchip",   image: IMG + "/processors-87161-101125030606_w_250_h_250.avif" },
        { id: "gaming",      name: "Gaming",            icon: "fa-gamepad",     image: IMG + "/consoles-87161-101125031020_w_300_h_300.avif" },
        { id: "accessories", name: "Accessories",       icon: "fa-headphones",  image: IMG + "/headphones-87161-101125021940_w_300_h_300.avif" },
        { id: "storage",     name: "Storage",           icon: "fa-hdd",         image: IMG + "/cooling-solutions-87161-101125020656_w_300_h_300.avif" },
        { id: "smartphones", name: "Tablets & iPads",  icon: "fa-tablet-alt",  image: IMG + "/tablets-87161-101125030315_w_250_h_250.avif" },
        { id: "printers",    name: "Printers",          icon: "fa-print",       image: IMG + "/keyboards-87161-101125031453_w_300_h_300.avif" }
    ];

    // ─── In-Memory Cache ──────────────────────────────────────────────────────
    var _cache = {
        currentUser: null,   // { id, name, email, role, ... } — set by auth listener
        categories:  DEFAULT_CATEGORIES.slice(),
        products:    [],
        orders:      [],
        applications:[],
        users:       [],
        cart:        {},     // keyed by uid
        wishlist:    {}      // keyed by uid
    };

    // Callbacks waiting for auth / cache to be ready
    var _authReadyCallbacks = [];
    var _authReady = false;
    var _cacheReady = false;
    var _adminCacheReady = false;
    var _cacheReadyCallbacks = [];
    var _adminCacheReadyCallbacks = [];

    var db   = window.tvFirestore;
    var auth = window.tvAuth;

    // ─── Seed Firestore if empty ──────────────────────────────────────────────
    function seedIfEmpty() {
        var batch = db.batch();

        // Seed categories
        db.collection("categories").limit(1).get().then(function (snap) {
            if (snap.empty) {
                DEFAULT_CATEGORIES.forEach(function (cat) {
                    batch.set(db.collection("categories").doc(cat.id), cat);
                });
                batch.commit().catch(function (e) { console.error("Seed categories error:", e); });
            }
        });

    }

    function purgeSystemProducts() {
        return db.collection("products").where("vendorId", "==", "system").get()
            .then(function (snap) {
                if (snap.empty) return;
                var batch = db.batch();
                snap.docs.forEach(function (doc) { batch.delete(doc.ref); });
                return batch.commit();
            })
            .catch(function (e) { console.error("Purge system products error:", e); });
    }

    function _fireCacheReady() {
        if (_cacheReady) return;
        _cacheReady = true;
        _cacheReadyCallbacks.forEach(function (cb) { cb(); });
        _cacheReadyCallbacks = [];
        window.dispatchEvent(new Event("db-cache-ready"));
    }

    function _fireAdminCacheReady() {
        if (_adminCacheReady) return;
        _adminCacheReady = true;
        _adminCacheReadyCallbacks.forEach(function (cb) { cb(); });
        _adminCacheReadyCallbacks = [];
        window.dispatchEvent(new Event("db-admin-ready"));
    }

    // Essential data for storefront pages (categories + products)
    function loadEssentialCache() {
        return Promise.all([
            db.collection("categories").get().then(function (snap) {
                if (!snap.empty) {
                    _cache.categories = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
                }
            }),
            db.collection("products").get().then(function (snap) {
                _cache.products = snap.docs
                    .map(function (d) { return Object.assign({ id: d.id }, d.data()); })
                    .filter(function (p) { return p.vendorId !== "system"; });
            })
        ]);
    }

    // Admin/vendor data loaded in the background
    function loadAdminCache() {
        return Promise.all([
            db.collection("orders").get().then(function (snap) {
                _cache.orders = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
            }),
            db.collection("applications").get().then(function (snap) {
                _cache.applications = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
            }),
            db.collection("users").get().then(function (snap) {
                _cache.users = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
            })
        ]);
    }

    // Load cart & wishlist for a specific user
    function loadUserData(uid) {
        var p1 = db.collection("carts").doc(uid).get().then(function (doc) {
            _cache.cart[uid] = doc.exists ? (doc.data().items || []) : [];
        });
        var p2 = db.collection("wishlists").doc(uid).get().then(function (doc) {
            _cache.wishlist[uid] = doc.exists ? (doc.data().items || []) : [];
        });
        return Promise.all([p1, p2]);
    }

    // Ensure every signed-in Auth user has a Firestore profile (visible in Firebase Console)
    function ensureUserProfile(firebaseUser) {
        return db.collection("users").doc(firebaseUser.uid).get().then(function (doc) {
            if (doc.exists) {
                var profile = Object.assign({ id: doc.id }, doc.data());
                _cache.currentUser = profile;
                var idx = _cache.users.findIndex(function (u) { return u.id === profile.id; });
                if (idx === -1) { _cache.users.push(profile); }
                else { _cache.users[idx] = profile; }
                return profile;
            }

            var newProfile = {
                id: firebaseUser.uid,
                username: "",
                name: firebaseUser.displayName || (firebaseUser.email || "User").split("@")[0],
                email: firebaseUser.email || "",
                role: "buyer",
                address: "",
                city: "",
                phone: ""
            };

            return db.collection("users").doc(firebaseUser.uid).set(newProfile).then(function () {
                _cache.currentUser = newProfile;
                var userIdx = _cache.users.findIndex(function (u) { return u.id === newProfile.id; });
                if (userIdx === -1) { _cache.users.push(newProfile); }
                else { _cache.users[userIdx] = newProfile; }
                return newProfile;
            });
        });
    }

    // ─── Auth State Listener ─────────────────────────────────────────────────
    auth.onAuthStateChanged(function (firebaseUser) {
        if (firebaseUser) {
            ensureUserProfile(firebaseUser)
                .then(function () { return loadUserData(firebaseUser.uid); })
                .then(function () {
                    window.dispatchEvent(new Event("cart-updated"));
                    window.dispatchEvent(new Event("wishlist-updated"));
                    window.dispatchEvent(new Event("auth-ready"));
                    _fireAuthReady();
                })
                .catch(function (err) {
                    console.error("Auth profile load error:", err);
                    _fireAuthReady();
                });
        } else {
            _cache.currentUser = null;
            window.dispatchEvent(new Event("auth-ready"));
            _fireAuthReady();
        }
    });

    function _fireAuthReady() {
        if (!_authReady) {
            _authReady = true;
            _authReadyCallbacks.forEach(function (cb) { cb(_cache.currentUser); });
            _authReadyCallbacks = [];
        }
    }

    // ─── Public API ──────────────────────────────────────────────────────────
    window.TechcartDB = {

        // Auth state ready callback
        onReady: function (cb) {
            if (_authReady) { cb(_cache.currentUser); }
            else { _authReadyCallbacks.push(cb); }
        },

        onCacheReady: function (cb) {
            if (_cacheReady) { cb(); }
            else { _cacheReadyCallbacks.push(cb); }
        },

        onAdminCacheReady: function (cb) {
            if (_adminCacheReady) { cb(); }
            else { _adminCacheReadyCallbacks.push(cb); }
        },

        isCacheReady: function () { return _cacheReady; },
        isAdminCacheReady: function () { return _adminCacheReady; },

        // ── Current User ──
        getCurrentUser: function () { return _cache.currentUser; },
        setCurrentUser: function (user) { _cache.currentUser = user; }, // kept for compat
        logout: function () {
            return auth.signOut().then(function () {
                _cache.currentUser = null;
                _cache.cart = {};
                _cache.wishlist = {};
            });
        },

        // ── Categories ──
        getCategories: function () { return _cache.categories.slice(); },
        saveCategories: function (cats) {
            _cache.categories = cats;
            var batch = db.batch();
            cats.forEach(function (cat) {
                batch.set(db.collection("categories").doc(cat.id), cat);
            });
            return batch.commit();
        },

        // ── Products ──
        getProducts: function () { return _cache.products.slice(); },
        saveProducts: function (products) {
            var prevIds = _cache.products.map(function (p) { return p.id; });
            var newIds = products.map(function (p) { return p.id; });
            var batch = db.batch();
            prevIds.forEach(function (id) {
                if (newIds.indexOf(id) === -1) {
                    batch.delete(db.collection("products").doc(id));
                }
            });
            products.forEach(function (p) {
                batch.set(db.collection("products").doc(p.id), p);
            });
            _cache.products = products;
            return batch.commit();
        },
        addProduct: function (product) {
            return db.collection("products").doc(product.id).set(product).then(function () {
                // Upsert in cache
                var idx = _cache.products.findIndex(function (p) { return p.id === product.id; });
                if (idx === -1) { _cache.products.push(product); }
                else { _cache.products[idx] = product; }
            });
        },
        updateProduct: function (product) {
            return db.collection("products").doc(product.id).set(product, { merge: true }).then(function () {
                var idx = _cache.products.findIndex(function (p) { return p.id === product.id; });
                if (idx !== -1) { _cache.products[idx] = product; }
                else { _cache.products.push(product); }
            });
        },
        deleteProduct: function (productId) {
            return db.collection("products").doc(productId).delete().then(function () {
                _cache.products = _cache.products.filter(function (p) { return p.id !== productId; });
            });
        },

        // ── Users ──
        getUsers: function () { return _cache.users.slice(); },
        saveUsers: function (users) {
            _cache.users = users;
            var batch = db.batch();
            users.forEach(function (u) {
                batch.set(db.collection("users").doc(u.id), u, { merge: true });
            });
            return batch.commit();
        },
        updateUser: function (userId, data) {
            return db.collection("users").doc(userId).set(data, { merge: true }).then(function () {
                var idx = _cache.users.findIndex(function (u) { return u.id === userId; });
                if (idx !== -1) { Object.assign(_cache.users[idx], data); }
                else { _cache.users.push(Object.assign({ id: userId }, data)); }
                if (_cache.currentUser && _cache.currentUser.id === userId) {
                    Object.assign(_cache.currentUser, data);
                }
            });
        },
        registerUserProfile: function (user) {
            return db.collection("users").doc(user.id).set(user).then(function () {
                var idx = _cache.users.findIndex(function (u) { return u.id === user.id; });
                if (idx === -1) { _cache.users.push(user); }
                else { _cache.users[idx] = user; }
                _cache.currentUser = user;
            });
        },

        // ── Orders ──
        getOrders: function () { return _cache.orders.slice(); },
        saveOrders: function (orders) {
            _cache.orders = orders;
            var batch = db.batch();
            orders.forEach(function (o) {
                batch.set(db.collection("orders").doc(o.id), o);
            });
            return batch.commit();
        },
        addOrder: function (order) {
            return db.collection("orders").doc(order.id).set(order).then(function () {
                _cache.orders.push(order);
            });
        },
        updateOrder: function (orderId, data) {
            return db.collection("orders").doc(orderId).set(data, { merge: true }).then(function () {
                var idx = _cache.orders.findIndex(function (o) { return o.id === orderId; });
                if (idx !== -1) { Object.assign(_cache.orders[idx], data); }
            });
        },

        // ── Applications (Vendor) ──
        getApplications: function () { return _cache.applications.slice(); },
        saveApplications: function (apps) {
            _cache.applications = apps;
            var batch = db.batch();
            apps.forEach(function (a) {
                batch.set(db.collection("applications").doc(a.id), a);
            });
            return batch.commit();
        },
        addApplication: function (app) {
            return db.collection("applications").doc(app.id).set(app).then(function () {
                _cache.applications.push(app);
            });
        },
        updateApplication: function (appId, data) {
            return db.collection("applications").doc(appId).set(data, { merge: true }).then(function () {
                var idx = _cache.applications.findIndex(function (a) { return a.id === appId; });
                if (idx !== -1) { Object.assign(_cache.applications[idx], data); }
            });
        },

        // ── Testimonials (stub) ──
        getTestimonials: function () { return []; },

        // ── Cart ──
        getCart: function (userId) { return (_cache.cart[userId] || []).slice(); },
        saveCart: function (userId, items) {
            _cache.cart[userId] = items;
            return db.collection("carts").doc(userId).set({ items: items });
        },
        addToCart: function (userId, product, qty) {
            qty = qty || 1;
            if (!_cache.cart[userId]) _cache.cart[userId] = [];
            var found = _cache.cart[userId].find(function (item) { return item.id === product.id; });
            if (found) {
                found.quantity += qty;
            } else {
                _cache.cart[userId].push({
                    id: product.id,
                    name: product.name,
                    price: product.discountPrice || product.price,
                    image: product.image,
                    quantity: qty,
                    stock: product.stock
                });
            }
            db.collection("carts").doc(userId).set({ items: _cache.cart[userId] });
            window.dispatchEvent(new Event("cart-updated"));
        },

        // ── Wishlist ──
        getWishlist: function (userId) { return (_cache.wishlist[userId] || []).slice(); },
        saveWishlist: function (userId, items) {
            _cache.wishlist[userId] = items;
            return db.collection("wishlists").doc(userId).set({ items: items });
        },
        addToWishlist: function (userId, product) {
            if (!_cache.wishlist[userId]) _cache.wishlist[userId] = [];
            var exists = _cache.wishlist[userId].some(function (item) { return item.id === product.id; });
            if (exists) return false;
            _cache.wishlist[userId].push({
                id: product.id,
                name: product.name,
                price: product.discountPrice || product.price,
                image: product.image
            });
            db.collection("wishlists").doc(userId).set({ items: _cache.wishlist[userId] });
            window.dispatchEvent(new Event("wishlist-updated"));
            return true;
        }
    };

    // Alias for any new code
    window.TechVerseDB = window.TechcartDB;

    // ─── Bootstrap ───────────────────────────────────────────────────────────
    seedIfEmpty();
    purgeSystemProducts()
        .then(function () { return loadEssentialCache(); })
        .then(function () {
            _fireCacheReady();
            return loadAdminCache();
        })
        .then(function () {
            _fireAdminCacheReady();
        })
        .catch(function (err) {
            console.error("TechVerseDB cache load error:", err);
            _fireCacheReady();
            _fireAdminCacheReady();
        });

    window.dispatchEvent(new Event("techcartdb-ready"));

})();
