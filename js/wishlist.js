// Techcart Wishlist Operations

document.addEventListener("DOMContentLoaded", () => {
    window.TechcartDB.onReady(function () {
        const user = window.TechcartDB.getCurrentUser();
        if (!user) {
            Swal.fire({
                icon: "warning",
                title: "Authentication Required",
                text: "Please sign in to view your wishlist.",
                confirmButtonColor: "#132238"
            }).then(() => {
                window.location.href = "../login.html";
            });
            return;
        }

        renderWishlist(user.id);
    });
});

// Render Wishlist Table
function renderWishlist(userId) {
    const wrapper = document.getElementById("wishlist-content-wrapper");
    const emptyState = document.getElementById("wishlist-empty-state");
    const tbody = document.getElementById("wishlist-items-tbody");

    if (!wrapper || !tbody) return;

    const wishlist = window.TechcartDB.getWishlist(userId);

    if (wishlist.length === 0) {
        wrapper.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    wrapper.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    tbody.innerHTML = wishlist.map(item => `
        <tr class="border-b border-slate-100 group">
            <!-- Product detail -->
            <td class="py-5 flex items-center gap-4">
                <div class="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center justify-center shrink-0">
                    <img src="${item.image}" alt="${item.name}" class="object-contain max-h-full max-w-full">
                </div>
                <div>
                    <a href="product-details.html?id=${item.id}" class="font-bold text-slate-800 text-sm hover:text-teal-600 transition-colors line-clamp-1">${item.name}</a>
                    <span class="text-[10px] text-slate-400 font-semibold block mt-0.5">SKU: ${item.id}</span>
                </div>
            </td>
            
            <!-- Price -->
            <td class="py-5 text-right font-black text-slate-900 text-sm">PKR ${item.price.toLocaleString()}</td>
            
            <!-- Actions -->
            <td class="py-5">
                <div class="flex items-center justify-center gap-3">
                    <button onclick="moveToCart('${userId}', '${item.id}')" class="brand-btn-primary text-white font-bold text-xs px-4 py-2 rounded-xl transition-all">
                        <i class="fas fa-shopping-cart mr-1.5"></i> Move to Cart
                    </button>
                    <button onclick="removeWishlistItem('${userId}', '${item.id}')" class="text-slate-400 hover:text-red-500 w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors">
                        <i class="far fa-trash-alt text-sm"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

// Move to Cart Action
window.moveToCart = (userId, itemId) => {
    const products = window.TechcartDB.getProducts();
    const product = products.find(p => p.id === itemId);

    if (product) {
        if (product.stock <= 0) {
            Swal.fire({
                icon: "error",
                title: "Out of Stock",
                text: "Cannot move to cart, this product is currently out of stock.",
                confirmButtonColor: "#132238"
            });
            return;
        }

        // Add to Cart
        window.TechcartDB.addToCart(userId, product, 1);

        // Delete from Wishlist
        let wishlist = window.TechcartDB.getWishlist(userId);
        wishlist = wishlist.filter(i => i.id !== itemId);
        window.TechcartDB.saveWishlist(userId, wishlist);

        // Trigger Badge Updates
        window.dispatchEvent(new Event("wishlist-updated"));
        window.dispatchEvent(new Event("cart-updated"));

        Swal.fire({
            icon: "success",
            title: "Moved to Cart",
            text: `${product.name} has been moved to your shopping cart.`,
            showConfirmButton: false,
            timer: 1200
        });

        renderWishlist(userId);
    }
};

// Remove Wishlist Item
window.removeWishlistItem = (userId, itemId) => {
    let wishlist = window.TechcartDB.getWishlist(userId);
    wishlist = wishlist.filter(i => i.id !== itemId);
    window.TechcartDB.saveWishlist(userId, wishlist);

    window.dispatchEvent(new Event("wishlist-updated"));
    renderWishlist(userId);
};
