// Techcart Orders Operations

document.addEventListener("DOMContentLoaded", () => {
    window.TechcartDB.onReady(function () {
        const user = window.TechcartDB.getCurrentUser();
        if (!user) {
            Swal.fire({
                icon: "warning",
                title: "Authentication Required",
                text: "Please sign in to view your order history.",
                confirmButtonColor: "#132238"
            }).then(() => {
                window.location.href = "../login.html";
            });
            return;
        }

        window.TechcartDB.onAdminCacheReady(function () {
            renderOrdersList(user.id);

            const modal = document.getElementById("order-details-modal");
            const closeBtn = document.getElementById("modal-close-btn");
            if (closeBtn && modal) {
                closeBtn.addEventListener("click", () => {
                    modal.classList.add("hidden");
                });
                modal.addEventListener("click", (e) => {
                    if (e.target === modal) {
                        modal.classList.add("hidden");
                    }
                });
            }
        });
    });
});

// Render List
function renderOrdersList(userId) {
    const tbody = document.getElementById("orders-items-tbody");
    const emptyState = document.getElementById("orders-empty-state");
    const tableContainer = tbody ? tbody.closest("table") : null;

    if (!tbody) return;

    const orders = window.TechcartDB.getOrders();
    const userOrders = orders.filter(o => o.buyerId === userId);

    if (userOrders.length === 0) {
        if (tableContainer) tableContainer.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (tableContainer) tableContainer.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    tbody.innerHTML = userOrders.map(order => {
        // Status Badge Style
        let badgeClass = "text-amber-700 bg-amber-50 border border-amber-100";
        if (order.status === "Shipped") badgeClass = "text-blue-700 bg-blue-50 border border-blue-100";
        if (order.status === "Delivered") badgeClass = "text-emerald-700 bg-emerald-50 border border-emerald-100";
        if (order.status === "Cancelled") badgeClass = "text-rose-700 bg-rose-50 border border-rose-100";

        return `
            <tr>
                <td class="py-4 font-bold text-slate-900 text-sm">${order.id}</td>
                <td class="py-4 text-slate-500 text-sm">${order.date}</td>
                <td class="py-4 font-bold text-slate-800 text-sm">PKR ${order.amount.toLocaleString()}</td>
                <td class="py-4 text-sm">
                    <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${badgeClass}">${order.status}</span>
                </td>
                <td class="py-4 text-center">
                    <button onclick="openOrderDetails('${order.id}')" class="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline">
                        View Details
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// Open Order Details Modal
window.openOrderDetails = (orderId) => {
    const modal = document.getElementById("order-details-modal");
    const orderIdEl = document.getElementById("modal-order-id");
    const dateEl = document.getElementById("modal-date");
    const paymentEl = document.getElementById("modal-payment");
    const itemsContainer = document.getElementById("modal-items-container");
    const totalEl = document.getElementById("modal-total");

    if (!modal) return;

    const orders = window.TechcartDB.getOrders();
    const order = orders.find(o => o.id === orderId);

    if (order) {
        orderIdEl.textContent = `Order Details: ${order.id}`;
        dateEl.textContent = order.date;
        paymentEl.textContent = order.paymentMethod;
        totalEl.textContent = `PKR ${order.amount.toLocaleString()}`;

        itemsContainer.innerHTML = order.items.map(item => `
            <div class="flex justify-between items-center py-3 text-xs font-semibold text-slate-700">
                <div>
                    <span class="font-bold text-slate-900 block">${item.name}</span>
                    <span class="text-[10px] text-slate-400 font-semibold mt-0.5">Price: PKR ${item.price.toLocaleString()}</span>
                </div>
                <div class="text-right pl-4">
                    <span class="text-slate-400 text-[10px] block font-semibold">Qty: ${item.quantity}</span>
                    <span class="font-bold text-slate-900">PKR ${(item.price * item.quantity).toLocaleString()}</span>
                </div>
            </div>
        `).join("");

        modal.classList.remove("hidden");
    }
};
