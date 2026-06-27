// Techcart Cart Operations

document.addEventListener("DOMContentLoaded", () => {
    window.TechcartDB.onReady(function () {
        const user = window.TechcartDB.getCurrentUser();
        if (!user) {
            Swal.fire({
                icon: "warning",
                title: "Authentication Required",
                text: "Please sign in to view your shopping cart.",
                confirmButtonColor: "#132238"
            }).then(() => {
                window.location.href = "../login.html";
            });
            return;
        }

        renderCart(user.id);

        const clearBtn = document.getElementById("clear-cart-btn");
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
            Swal.fire({
                title: "Are you sure?",
                text: "Do you want to remove all items from your cart?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#ef4444",
                cancelButtonColor: "#64748b",
                confirmButtonText: "Yes, empty it!"
            }).then((result) => {
                if (result.isConfirmed) {
                    window.TechcartDB.saveCart(user.id, []);
                    window.dispatchEvent(new Event("cart-updated"));
                    renderCart(user.id);
                }
            });
        });
    }
    });
});

// Render Cart Layout
function renderCart(userId) {
    const wrapper = document.getElementById("cart-content-wrapper");
    const emptyState = document.getElementById("cart-empty-state");
    const tbody = document.getElementById("cart-items-tbody");

    if (!wrapper || !tbody) return;

    const cart = window.TechcartDB.getCart(userId);

    if (cart.length === 0) {
        wrapper.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    wrapper.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    tbody.innerHTML = cart.map(item => {
        const itemSubtotal = item.price * item.quantity;
        return `
            <tr class="border-b border-slate-100 group">
                <!-- Product detail -->
                <td class="py-5 flex items-center gap-4">
                    <div class="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center justify-center shrink-0">
                        <img src="${item.image}" alt="${item.name}" class="object-contain max-h-full max-w-full">
                    </div>
                    <div>
                        <a href="product-details.html?id=${item.id}" class="font-bold text-slate-800 text-sm hover:text-teal-600 transition-colors line-clamp-1">${item.name}</a>
                        <span class="text-[10px] text-slate-400 font-semibold block mt-0.5">SKU: ${item.id} | Stock: ${item.stock || 10}</span>
                    </div>
                </td>
                
                <!-- Quantity controls -->
                <td class="py-5 text-center">
                    <div class="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl px-1 py-0.5 select-none">
                        <button onclick="updateQty('${userId}', '${item.id}', -1)" class="w-8 h-8 rounded-lg hover:bg-white text-slate-600 flex items-center justify-center font-bold transition-colors"><i class="fas fa-minus text-[10px]"></i></button>
                        <span class="w-8 text-center font-bold text-slate-800 text-xs">${item.quantity}</span>
                        <button onclick="updateQty('${userId}', '${item.id}', 1)" class="w-8 h-8 rounded-lg hover:bg-white text-slate-600 flex items-center justify-center font-bold transition-colors"><i class="fas fa-plus text-[10px]"></i></button>
                    </div>
                </td>
                
                <!-- Price -->
                <td class="py-5 text-right font-bold text-slate-800 text-sm">PKR ${item.price.toLocaleString()}</td>
                
                <!-- Subtotal -->
                <td class="py-5 text-right font-black text-slate-900 text-sm">PKR ${itemSubtotal.toLocaleString()}</td>
                
                <!-- Action -->
                <td class="py-5 text-center">
                    <button onclick="removeCartItem('${userId}', '${item.id}')" class="text-slate-400 hover:text-red-500 w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center transition-colors">
                        <i class="far fa-trash-alt text-sm"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    // Calculate Summary values
    calculateSummary(cart);
}

// Update Quantity
window.updateQty = (userId, itemId, delta) => {
    const cart = window.TechcartDB.getCart(userId);
    const item = cart.find(i => i.id === itemId);

    if (item) {
        const newQty = item.quantity + delta;
        const maxStock = item.stock || 10;

        if (newQty < 1) return;
        if (newQty > maxStock) {
            Swal.fire({
                icon: "warning",
                title: "Stock Limit",
                text: `Sorry, only ${maxStock} items are available in stock.`,
                confirmButtonColor: "#132238"
            });
            return;
        }

        item.quantity = newQty;
        window.TechcartDB.saveCart(userId, cart);
        window.dispatchEvent(new Event("cart-updated"));
        renderCart(userId);
    }
};

// Remove Cart Item
window.removeCartItem = (userId, itemId) => {
    let cart = window.TechcartDB.getCart(userId);
    cart = cart.filter(i => i.id !== itemId);
    window.TechcartDB.saveCart(userId, cart);
    window.dispatchEvent(new Event("cart-updated"));
    renderCart(userId);
};

// Summary Logic
function calculateSummary(cart) {
    const subtotalEl = document.getElementById("summary-subtotal");
    const shippingEl = document.getElementById("summary-shipping");
    const taxEl = document.getElementById("summary-tax");
    const totalEl = document.getElementById("summary-total");

    if (!subtotalEl) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const shipping = (subtotal < 50000 && subtotal > 0) ? 500 : 0;
    const total = subtotal + tax + shipping;

    subtotalEl.textContent = `PKR ${subtotal.toLocaleString()}`;
    shippingEl.textContent = shipping === 0 ? "FREE" : `PKR ${shipping.toLocaleString()}`;
    if (shipping === 0 && subtotal > 0) {
        shippingEl.className = "font-bold text-emerald-600";
    } else {
        shippingEl.className = "font-bold text-slate-800";
    }
    taxEl.textContent = `PKR ${tax.toLocaleString()}`;
    totalEl.textContent = `PKR ${total.toLocaleString()}`;
}
