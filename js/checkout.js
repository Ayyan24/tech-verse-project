// Techcart Checkout Operations

document.addEventListener("DOMContentLoaded", () => {
    window.TechcartDB.onReady(function () {
        const user = window.TechcartDB.getCurrentUser();
        if (!user) {
            Swal.fire({
                icon: "warning",
                title: "Authentication Required",
                text: "Please sign in to proceed to checkout.",
                confirmButtonColor: "#132238"
            }).then(() => {
                window.location.href = "../login.html";
            });
            return;
        }

        const cart = window.TechcartDB.getCart(user.id);
        if (cart.length === 0) {
            Swal.fire({
                icon: "info",
                title: "Cart is Empty",
                text: "Please add some items to your cart before checking out.",
                confirmButtonColor: "#132238"
            }).then(() => {
                window.location.href = "cart.html";
            });
            return;
        }

        prefillForm(user);
        renderSummary(cart);

        const form = document.getElementById("checkout-form");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                handleCheckoutSubmit(user, cart);
            });
        }
    });
});

// Pre-fill fields
function prefillForm(user) {
    const nameInput = document.getElementById("checkout-name");
    const phoneInput = document.getElementById("checkout-phone");
    const addressInput = document.getElementById("checkout-address");
    const cityInput = document.getElementById("checkout-city");

    if (nameInput && user.name) nameInput.value = user.name;
    if (phoneInput && user.phone) phoneInput.value = user.phone;
    if (addressInput && user.address) addressInput.value = user.address;
    if (cityInput && user.city) cityInput.value = user.city;
}

// Render Summary
function renderSummary(cart) {
    const listEl = document.getElementById("checkout-items-list");
    const subtotalEl = document.getElementById("checkout-subtotal");
    const shippingEl = document.getElementById("checkout-shipping");
    const taxEl = document.getElementById("checkout-tax");
    const totalEl = document.getElementById("checkout-total");

    if (!listEl) return;

    // Items list
    listEl.innerHTML = cart.map(item => `
        <div class="flex items-center gap-3 py-3">
            <div class="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg p-1 flex items-center justify-center shrink-0">
                <img src="${item.image}" alt="${item.name}" class="object-contain max-h-full max-w-full">
            </div>
            <div class="flex-grow min-w-0">
                <p class="font-bold text-slate-800 text-xs truncate">${item.name}</p>
                <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Qty: ${item.quantity} x PKR ${item.price.toLocaleString()}</p>
            </div>
            <span class="font-bold text-slate-800 text-xs shrink-0 pl-2">PKR ${(item.price * item.quantity).toLocaleString()}</span>
        </div>
    `).join("");

    // Computations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05);
    const shipping = (subtotal < 50000) ? 500 : 0;
    const total = subtotal + tax + shipping;

    subtotalEl.textContent = `PKR ${subtotal.toLocaleString()}`;
    shippingEl.textContent = shipping === 0 ? "FREE" : `PKR ${shipping.toLocaleString()}`;
    taxEl.textContent = `PKR ${tax.toLocaleString()}`;
    totalEl.textContent = `PKR ${total.toLocaleString()}`;
}

// Submit Order Process
function handleCheckoutSubmit(user, cart) {
    const name = document.getElementById("checkout-name").value.trim();
    const phone = document.getElementById("checkout-phone").value.trim();
    const address = document.getElementById("checkout-address").value.trim();
    const city = document.getElementById("checkout-city").value.trim();
    
    // Payment Method
    const paymentRadio = document.querySelector("input[name='payment-method']:checked");
    const paymentMethod = paymentRadio ? paymentRadio.value : "Cash On Delivery";

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05);
    const shipping = (subtotal < 50000) ? 500 : 0;
    const total = subtotal + tax + shipping;

    // Generate Order ID
    const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);

    const newOrder = {
        id: orderId,
        buyerId: user.id,
        buyerName: name,
        date: new Date().toISOString().split("T")[0],
        amount: total,
        status: "Pending", // Pending, Shipped, Delivered, Cancelled
        paymentMethod: paymentMethod,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    };

    // Save to Database
    const orders = window.TechcartDB.getOrders();
    orders.unshift(newOrder);
    window.TechcartDB.saveOrders(orders);

    // Save shipping details on User profile if empty
    const users = window.TechcartDB.getUsers();
    const dbUser = users.find(u => u.id === user.id);
    if (dbUser) {
        dbUser.name = name;
        dbUser.phone = phone;
        dbUser.address = address;
        dbUser.city = city;
        window.TechcartDB.saveUsers(users);
        window.TechcartDB.setCurrentUser(dbUser); // reload session details
    }

    // Clear Cart
    window.TechcartDB.saveCart(user.id, []);
    window.dispatchEvent(new Event("cart-updated"));

    // Success notification
    Swal.fire({
        icon: "success",
        title: "Order Placed Successfully!",
        text: `Your Order ID is ${orderId}. Thank you for choosing Techcart.`,
        confirmButtonColor: "#132238",
        timer: 3000,
        showConfirmButton: true
    }).then(() => {
        window.location.href = "orders.html";
    });
}
