// Techcart Admin Panel Operations

function bootAdminPanel() {
    const user = window.TechcartDB.getCurrentUser();
    if (!user || user.role !== "admin") {
        Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "You do not have administrator privileges to access this portal.",
            confirmButtonColor: "#132238"
        }).then(() => {
            window.location.href = "../login.html";
        });
        return;
    }

    injectAdminHeader(user);
    injectAdminSidebar();

    const path = window.location.pathname;
    if (path.includes("dashboard.html")) {
        loadAdminDashboard();
    } else if (path.includes("vendor-approval.html")) {
        loadAdminVendorApprovals();
    } else if (path.includes("product-approval.html")) {
        loadAdminProductApprovals();
    } else if (path.includes("users.html")) {
        loadAdminUsers();
    } else if (path.includes("orders.html")) {
        loadAdminOrders();
    } else if (path.includes("categories.html")) {
        loadAdminCategories();
    } else if (path.includes("reports.html")) {
        loadAdminReports();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!window.TechcartDB) return;
    window.TechcartDB.onReady(function () {
        window.TechcartDB.onAdminCacheReady(bootAdminPanel);
    });
});

// Layout Injection: Header
function injectAdminHeader(user) {
    const el = document.getElementById("admin-header");
    if (!el) return;

    el.innerHTML = `
        <header class="brand-footer border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-xl">
            <div class="flex items-center gap-3">
                <button id="sidebar-toggle-btn" class="lg:hidden text-slate-400 hover:text-white mr-2">
                    <i class="fas fa-bars text-lg"></i>
                </button>
                <a href="../index.html" class="flex items-center gap-2 group">
                    <div class="brand-btn-accent p-2 rounded-xl text-white">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <span class="font-extrabold text-lg tracking-tight text-white">Tech<span class="text-sky-400">Verse</span> <span class="text-teal-300 font-medium text-xs font-bold">ADMIN</span></span>
                </a>
            </div>
            
            <div class="flex items-center gap-4">
                <span class="text-xs font-bold text-slate-300 block"><i class="fas fa-user-shield text-teal-300 mr-1.5"></i>${user.name}</span>
                <a href="../index.html" class="text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-3.5 py-1.5 transition-colors">
                    Marketplace
                </a>
            </div>
        </header>
    `;

    const toggleBtn = document.getElementById("sidebar-toggle-btn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const sidebar = document.getElementById("admin-sidebar");
            if (sidebar) sidebar.classList.toggle("open");
        });
    }
}

// Layout Injection: Sidebar
function injectAdminSidebar() {
    const el = document.getElementById("admin-sidebar");
    if (!el) return;

    const path = window.location.pathname;
    const items = [
        { name: "Dashboard", file: "dashboard.html", icon: "fa-tachometer-alt" },
        { name: "Vendor Approval", file: "vendor-approval.html", icon: "fa-store-alt" },
        { name: "Product Approval", file: "product-approval.html", icon: "fa-check-circle" },
        { name: "Users", file: "users.html", icon: "fa-users" },
        { name: "Orders", file: "orders.html", icon: "fa-shopping-bag" },
        { name: "Categories", file: "categories.html", icon: "fa-align-left" },
        { name: "Platform Reports", file: "reports.html", icon: "fa-chart-pie" }
    ];

    const menuItemsHtml = items.map(item => {
        const isActive = path.includes(item.file);
        const activeClass = isActive ? "bg-teal-500 text-white shadow-lg shadow-teal-900/20" : "hover:bg-slate-800 text-slate-400";
        return `
            <a href="${item.file}" class="flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeClass}">
                <i class="fas ${item.icon} w-5 text-sm"></i> ${item.name}
            </a>
        `;
    }).join("");

    el.innerHTML = `
        <aside id="admin-sidebar" class="sidebar w-64 bg-slate-950 border-r border-slate-900 px-4 py-6 flex flex-col justify-between shrink-0 absolute lg:relative z-40">
            <div class="flex flex-col gap-1.5">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Admin Console</span>
                ${menuItemsHtml}
            </div>
            
            <a href="#" id="admin-logout-btn" class="flex items-center gap-3 p-3 rounded-xl font-bold text-red-400 hover:bg-red-950/30 transition-all">
                <i class="fas fa-sign-out-alt w-5 text-sm"></i> Logout
            </a>
        </aside>
    `;

    const logoutBtn = document.getElementById("admin-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.TechcartDB.logout();
            window.location.href = "../index.html";
        });
    }
}

// 1. Dashboard Operations
function loadAdminDashboard() {
    const users = window.TechcartDB.getUsers();
    const products = window.TechcartDB.getProducts();
    const orders = window.TechcartDB.getOrders();
    const apps = window.TechcartDB.getApplications();

    const totalUsers = users.length;
    const totalVendors = users.filter(u => u.role === "vendor").length;
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => o.status === "Cancelled" ? sum : sum + (Number(o.amount) || 0), 0);

    document.getElementById("stat-users").textContent = totalUsers;
    document.getElementById("stat-vendors").textContent = totalVendors;
    document.getElementById("stat-products").textContent = totalProducts;
    document.getElementById("stat-orders").textContent = totalOrders;
    document.getElementById("stat-revenue").textContent = `PKR ${totalRevenue.toLocaleString()}`;

    // Render Platform Recent Orders
    const ordersTbody = document.getElementById("admin-recent-orders-tbody");
    if (ordersTbody) {
        ordersTbody.innerHTML = orders.slice(0, 5).map(o => `
            <tr>
                <td class="py-3 font-bold text-slate-800">${o.id}</td>
                <td class="py-3 text-slate-600">${o.buyerName}</td>
                <td class="py-3 text-slate-500">${o.date}</td>
                <td class="py-3 font-bold text-slate-800">PKR ${o.amount.toLocaleString()}</td>
            </tr>
        `).join("");
    }

    // Render Pending Vendor requests
    const vendorsTbody = document.getElementById("admin-recent-vendors-tbody");
    if (vendorsTbody) {
        vendorsTbody.innerHTML = apps.slice(0, 5).map(app => {
            let statusBadge = "text-amber-700 bg-amber-50 border border-amber-100";
            if (app.status === "Approved") statusBadge = "text-emerald-700 bg-emerald-50 border border-emerald-100";
            if (app.status === "Rejected") statusBadge = "text-rose-700 bg-rose-50 border border-rose-100";

            return `
                <tr>
                    <td class="py-3 font-bold text-slate-800">${app.shopName}</td>
                    <td class="py-3 text-slate-600">${app.vendorName}</td>
                    <td class="py-3 text-slate-500">${app.email}</td>
                    <td class="py-3 text-center"><span class="px-2 py-0.5 rounded-full ${statusBadge}">${app.status}</span></td>
                </tr>
            `;
        }).join("");
    }

    // Chart 1: Global Revenue (Line Chart) — live order data
    const monthlyRevenue = window.TechcartUtils.aggregateRevenueByMonth(orders);
    window.TechcartUtils.renderChart("adminSalesChart", {
        type: "line",
        data: {
            labels: monthlyRevenue.labels,
            datasets: [{
                label: "Global Revenue (PKR)",
                data: monthlyRevenue.values,
                borderColor: "#3b82f6",
                backgroundColor: "rgba(59, 130, 246, 0.08)",
                borderWidth: 3,
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: window.TechcartUtils.chartCurrencyOptions
    });

    // Chart 2: Product status breakdown — live catalog data
    const statusCounts = window.TechcartUtils.getProductStatusCounts(products);
    const statusValues = [statusCounts.approved, statusCounts.pending, statusCounts.rejected];
    const hasProducts = statusValues.some(function (count) { return count > 0; });

    window.TechcartUtils.renderChart("adminProductChart", {
        type: "doughnut",
        data: {
            labels: hasProducts ? ["Approved", "Pending", "Rejected"] : ["No Products Yet"],
            datasets: [{
                data: hasProducts ? statusValues : [1],
                backgroundColor: hasProducts ? ["#10b981", "#f59e0b", "#ef4444"] : ["#cbd5e1"],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom", labels: { boxWidth: 10, font: { weight: "bold", size: 9 } } },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            if (!hasProducts) return "Add products to see stats";
                            return ctx.label + ": " + ctx.parsed + " items";
                        }
                    }
                }
            }
        }
    });
}

// 2. Vendor Approval Operations
function loadAdminVendorApprovals() {
    const tbody = document.getElementById("vendor-approval-tbody");
    const emptyState = document.getElementById("vendor-empty-state");
    const tableContainer = tbody ? tbody.closest("table") : null;

    if (!tbody) return;

    const apps = window.TechcartDB.getApplications();

    if (apps.length === 0) {
        if (tableContainer) tableContainer.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (tableContainer) tableContainer.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    tbody.innerHTML = apps.map(app => {
        let statusBadge = "text-amber-700 bg-amber-50 border border-amber-100";
        if (app.status === "Approved") statusBadge = "text-emerald-700 bg-emerald-50 border border-emerald-100";
        if (app.status === "Rejected") statusBadge = "text-rose-700 bg-rose-50 border border-rose-100";

        const isPending = app.status === "Pending";

        return `
            <tr class="border-b border-slate-100">
                <td class="py-3.5 font-bold text-slate-800">${app.vendorName}</td>
                <td class="py-3.5 font-bold text-slate-800">${app.shopName}</td>
                <td class="py-3.5 text-slate-500">${app.email}</td>
                <td class="py-3.5 text-center"><span class="px-2.5 py-0.5 rounded-full ${statusBadge}">${app.status}</span></td>
                <td class="py-3.5 text-center">
                    ${isPending ? `
                    <div class="flex items-center justify-center gap-3">
                        <button onclick="updateVendorApp('${app.id}', 'Approved')" class="text-emerald-600 hover:text-emerald-700 font-bold">Approve</button>
                        <button onclick="updateVendorApp('${app.id}', 'Rejected')" class="text-rose-650 hover:text-rose-750 font-bold">Reject</button>
                    </div>
                    ` : `<span class="text-slate-400 font-semibold italic">Processed</span>`}
                </td>
            </tr>
        `;
    }).join("");
}

// Approval action
window.updateVendorApp = (appId, action) => {
    const apps = window.TechcartDB.getApplications();
    const app = apps.find(a => a.id === appId);

    if (app) {
        app.status = action;
        window.TechcartDB.saveApplications(apps);

        // If approved, create/sync user account if they don't exist
        if (action === "Approved") {
            const users = window.TechcartDB.getUsers();
            const exists = users.some(u => u.email.toLowerCase() === app.email.toLowerCase());
            if (!exists) {
                users.push({
                    id: "u_v_" + Date.now(),
                    name: app.vendorName,
                    shopName: app.shopName,
                    email: app.email,
                    password: "password123",
                    role: "vendor",
                    address: "",
                    city: "",
                    phone: ""
                });
                window.TechcartDB.saveUsers(users);
            }
        }

        Swal.fire({
            icon: "success",
            title: `Merchant ${action}`,
            text: `Shop application has been set to ${action}`,
            showConfirmButton: false,
            timer: 1200
        });

        loadAdminVendorApprovals();
    }
};

// 3. Product Approval Operations
function loadAdminProductApprovals() {
    const tbody = document.getElementById("product-approval-tbody");
    const emptyState = document.getElementById("product-empty-state");
    const tableContainer = tbody ? tbody.closest("table") : null;

    if (!tbody) return;

    const products = window.TechcartDB.getProducts();
    const pendingProds = products.filter(p => p.status === "pending");

    if (pendingProds.length === 0) {
        if (tableContainer) tableContainer.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (tableContainer) tableContainer.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    tbody.innerHTML = pendingProds.map(p => `
        <tr class="border-b border-slate-100">
            <td class="py-3.5">
                <div class="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg p-1 flex items-center justify-center">
                    <img src="${p.image}" alt="thumb" class="object-contain max-h-full max-w-full">
                </div>
            </td>
            <td class="py-3.5 font-bold text-slate-800">${p.name}</td>
            <td class="py-3.5 text-slate-600 font-semibold">Vendor: ${p.vendorId}</td>
            <td class="py-3.5 text-slate-500 capitalize">${p.category}</td>
            <td class="py-3.5 text-center"><span class="px-2.5 py-0.5 rounded-full text-amber-700 bg-amber-50 border border-amber-100 capitalize">${p.status}</span></td>
            <td class="py-3.5 text-center">
                <div class="flex items-center justify-center gap-3">
                    <button onclick="updateProductStatus('${p.id}', 'approved')" class="text-emerald-600 hover:text-emerald-700 font-bold">Approve</button>
                    <button onclick="updateProductStatus('${p.id}', 'rejected')" class="text-rose-650 hover:text-rose-750 font-bold">Reject</button>
                </div>
            </td>
        </tr>
    `).join("");
}

// Product status update
window.updateProductStatus = (productId, newStatus) => {
    const products = window.TechcartDB.getProducts();
    const product = products.find(p => p.id === productId);

    if (product) {
        product.status = newStatus;
        window.TechcartDB.saveProducts(products);

        Swal.fire({
            icon: "success",
            title: `Product ${newStatus.toUpperCase()}`,
            showConfirmButton: false,
            timer: 1200
        });

        loadAdminProductApprovals();
    }
};

// 4. Users Management operations
function loadAdminUsers() {
    const tbody = document.getElementById("users-tbody");
    if (!tbody) return;

    const users = window.TechcartDB.getUsers();

    tbody.innerHTML = users.map(u => `
        <tr class="border-b border-slate-100">
            <td class="py-3.5 font-bold text-slate-800">${u.name}</td>
            <td class="py-3.5 text-slate-500">${u.email}</td>
            <td class="py-3.5"><span class="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-slate-100 text-slate-600">${u.role}</span></td>
            <td class="py-3.5 text-center">
                <div class="flex items-center justify-center gap-3">
                    <button onclick="editUserRole('${u.id}')" class="text-teal-600 hover:text-teal-700 font-semibold">Change Role</button>
                    <button onclick="deleteUser('${u.id}')" class="text-red-500 hover:text-red-700 font-semibold">Delete</button>
                </div>
            </td>
        </tr>
    `).join("");
}

// Change Role helper
window.editUserRole = (userId) => {
    const users = window.TechcartDB.getUsers();
    const user = users.find(u => u.id === userId);

    if (user) {
        Swal.fire({
            title: "Adjust Account Role",
            input: "select",
            inputOptions: {
                buyer: "Buyer (Customer)",
                vendor: "Vendor (Merchant)",
                admin: "Admin (Moderator)"
            },
            inputValue: user.role,
            showCancelButton: true,
            confirmButtonText: "Update Role",
            confirmButtonColor: "#132238",
            cancelButtonColor: "#64748b"
        }).then((result) => {
            if (result.isConfirmed) {
                user.role = result.value;
                window.TechcartDB.saveUsers(users);
                Swal.fire({
                    icon: "success",
                    title: "Role Updated",
                    showConfirmButton: false,
                    timer: 1200
                });
                loadAdminUsers();
            }
        });
    }
};

// Delete user helper
window.deleteUser = (userId) => {
    Swal.fire({
        title: "Delete Account?",
        text: "This user profile and session logs will be permanently deleted.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, delete"
    }).then((result) => {
        if (result.isConfirmed) {
            let users = window.TechcartDB.getUsers();
            users = users.filter(u => u.id !== userId);
            window.TechcartDB.saveUsers(users);
            Swal.fire({
                icon: "success",
                title: "Deleted",
                showConfirmButton: false,
                timer: 1200
            });
            loadAdminUsers();
        }
    });
};

// 5. Admin Orders Operations
function loadAdminOrders() {
    const tbody = document.getElementById("admin-orders-tbody");
    const emptyState = document.getElementById("orders-empty-state");
    const tableContainer = tbody ? tbody.closest("table") : null;

    if (!tbody) return;

    const orders = window.TechcartDB.getOrders();

    if (orders.length === 0) {
        if (tableContainer) tableContainer.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (tableContainer) tableContainer.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    tbody.innerHTML = orders.map(order => {
        let badgeClass = "text-amber-700 bg-amber-50 border border-amber-100";
        if (order.status === "Shipped") badgeClass = "text-blue-700 bg-blue-50 border border-blue-100";
        if (order.status === "Delivered") badgeClass = "text-emerald-700 bg-emerald-50 border border-emerald-100";
        if (order.status === "Cancelled") badgeClass = "text-rose-700 bg-rose-50 border border-rose-100";

        return `
            <tr class="border-b border-slate-100">
                <td class="py-3.5 font-bold text-slate-800">${order.id}</td>
                <td class="py-3.5 text-slate-700">${order.buyerName}</td>
                <td class="py-3.5 text-slate-500 font-semibold">${order.paymentMethod}</td>
                <td class="py-3.5 font-bold text-slate-800">PKR ${order.amount.toLocaleString()}</td>
                <td class="py-3.5 text-center"><span class="px-2.5 py-0.5 rounded-full ${badgeClass}">${order.status}</span></td>
                <td class="py-3.5 text-center">
                    <div class="flex items-center justify-center gap-3">
                        <button onclick="viewAdminOrder('${order.id}')" class="text-teal-600 hover:text-teal-700 font-semibold">View</button>
                        <select onchange="updateAdminOrderStatus('${order.id}', this.value)" class="bg-slate-50 border border-slate-200 text-slate-700 rounded p-1 text-[10px] font-semibold cursor-pointer">
                            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    // Modal Close Bindings
    const modal = document.getElementById("admin-order-modal");
    const closeBtn = document.getElementById("modal-close-btn");
    if (closeBtn && modal) {
        closeBtn.onclick = () => modal.classList.add("hidden");
        modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hidden"); };
    }
}

// View order helper
window.viewAdminOrder = (orderId) => {
    const modal = document.getElementById("admin-order-modal");
    const orderIdEl = document.getElementById("modal-order-id");
    const customerEl = document.getElementById("modal-customer");
    const dateEl = document.getElementById("modal-date");
    const itemsContainer = document.getElementById("modal-items-container");
    const totalEl = document.getElementById("modal-total");

    const orders = window.TechcartDB.getOrders();
    const order = orders.find(o => o.id === orderId);

    if (order && modal) {
        orderIdEl.textContent = `Order Details: ${order.id}`;
        customerEl.textContent = order.buyerName;
        dateEl.textContent = order.date;

        itemsContainer.innerHTML = order.items.map(item => `
            <div class="flex justify-between items-center py-2 text-xs font-semibold text-slate-700">
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

        totalEl.textContent = `PKR ${order.amount.toLocaleString()}`;
        modal.classList.remove("hidden");
    }
};

// Update order status helper
window.updateAdminOrderStatus = (orderId, newStatus) => {
    const orders = window.TechcartDB.getOrders();
    const order = orders.find(o => o.id === orderId);

    if (order) {
        order.status = newStatus;
        window.TechcartDB.saveOrders(orders);
        Swal.fire({
            icon: "success",
            title: "Order Status Processed",
            text: `Order status set to ${newStatus}`,
            showConfirmButton: false,
            timer: 1200
        });
        loadAdminOrders();
    }
};

// 6. Categories Management operations
function loadAdminCategories() {
    const tbody = document.getElementById("categories-tbody");
    if (!tbody) return;

    const categories = window.TechcartDB.getCategories();

    tbody.innerHTML = categories.map(cat => `
        <tr class="border-b border-slate-100">
            <td class="py-3.5"><div class="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><i class="fas ${cat.icon}"></i></div></td>
            <td class="py-3.5 font-bold text-slate-700">${cat.id}</td>
            <td class="py-3.5 font-bold text-slate-800">${cat.name}</td>
            <td class="py-3.5 text-center">
                <div class="flex items-center justify-center gap-3">
                    <button onclick="editCategoryName('${cat.id}')" class="text-teal-600 hover:text-teal-700 font-semibold">Edit</button>
                    <button onclick="deleteCategory('${cat.id}')" class="text-red-500 hover:text-red-700 font-semibold">Delete</button>
                </div>
            </td>
        </tr>
    `).join("");

    // Add category trigger
    const addBtn = document.getElementById("add-category-btn");
    if (addBtn) {
        addBtn.onclick = () => {
            Swal.fire({
                title: "Add New Category",
                html: `
                    <input id="swal-cat-name" placeholder="Category Name (e.g. Graphic Cards)" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm mb-4">
                    <input id="swal-cat-icon" placeholder="FontAwesome Class (e.g. fa-microchip)" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm">
                `,
                showCancelButton: true,
                confirmButtonText: "Add Category",
                confirmButtonColor: "#132238",
                cancelButtonColor: "#64748b",
                preConfirm: () => {
                    const name = document.getElementById("swal-cat-name").value.trim();
                    const icon = document.getElementById("swal-cat-icon").value.trim() || "fa-laptop";
                    if (!name) {
                        Swal.showValidationMessage("Please enter a category name.");
                    }
                    return { name, icon };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const cats = window.TechcartDB.getCategories();
                    const newId = result.value.name.toLowerCase().replace(/\s+/g, "-");
                    
                    cats.push({
                        id: newId,
                        name: result.value.name,
                        icon: result.value.icon
                    });
                    
                    window.TechcartDB.saveCategories(cats);
                    
                    Swal.fire({
                        icon: "success",
                        title: "Category Created",
                        showConfirmButton: false,
                        timer: 1200
                    });

                    loadAdminCategories();
                }
            });
        };
    }
}

// Edit category name
window.editCategoryName = (catId) => {
    const cats = window.TechcartDB.getCategories();
    const cat = cats.find(c => c.id === catId);

    if (cat) {
        Swal.fire({
            title: "Edit Category Name",
            input: "text",
            inputValue: cat.name,
            showCancelButton: true,
            confirmButtonText: "Update Name",
            confirmButtonColor: "#132238",
            cancelButtonColor: "#64748b",
            inputValidator: (value) => {
                if (!value || value.trim() === "") {
                    return "Please enter a valid category name.";
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                cat.name = result.value.trim();
                window.TechcartDB.saveCategories(cats);
                Swal.fire({
                    icon: "success",
                    title: "Updated",
                    showConfirmButton: false,
                    timer: 1200
                });
                loadAdminCategories();
            }
        });
    }
};

// Delete category
window.deleteCategory = (catId) => {
    Swal.fire({
        title: "Delete Category?",
        text: "Products in this category will not be deleted but they won't show in filtering schemas.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, delete"
    }).then((result) => {
        if (result.isConfirmed) {
            let cats = window.TechcartDB.getCategories();
            cats = cats.filter(c => c.id !== catId);
            window.TechcartDB.saveCategories(cats);
            Swal.fire({
                icon: "success",
                title: "Deleted",
                showConfirmButton: false,
                timer: 1200
            });
            loadAdminCategories();
        }
    });
};

// 7. Platform Reports operations
function loadAdminReports() {
    const products = window.TechcartDB.getProducts();
    const orders = window.TechcartDB.getOrders();

    const totalRevenue = orders.reduce((sum, o) => o.status === "Cancelled" ? sum : sum + (Number(o.amount) || 0), 0);
    const totalOrders = orders.filter(o => o.status !== "Cancelled").length;
    const totalProducts = products.filter(p => p.status === "approved").length;

    document.getElementById("rep-admin-revenue").textContent = `PKR ${totalRevenue.toLocaleString()}`;
    document.getElementById("rep-admin-orders").textContent = `${totalOrders} orders`;
    document.getElementById("rep-admin-products").textContent = `${totalProducts} items`;

    const monthlyRevenue = window.TechcartUtils.aggregateRevenueByMonth(orders);
    window.TechcartUtils.renderChart("adminReportsChart", {
        type: "bar",
        data: {
            labels: monthlyRevenue.labels,
            datasets: [{
                label: "Global Platform Revenue (PKR)",
                data: monthlyRevenue.values,
                backgroundColor: "#1e3a8a",
                hoverBackgroundColor: "#14b8a6",
                borderRadius: 8
            }]
        },
        options: window.TechcartUtils.chartBarCurrencyOptions
    });
}
