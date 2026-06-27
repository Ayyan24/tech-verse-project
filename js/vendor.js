// Techcart Vendor Panel Operations

function bootVendorPanel() {
    const user = window.TechcartDB.getCurrentUser();
    if (!user || user.role !== "vendor") {
        Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "You do not have vendor permissions to access this portal.",
            confirmButtonColor: "#2563eb"
        }).then(() => {
            window.location.href = "../login.html";
        });
        return;
    }

    injectVendorHeader(user);
    injectVendorSidebar();

    const path = window.location.pathname;
    if (path.includes("dashboard.html")) {
        loadVendorDashboard(user.id);
    } else if (path.includes("add-product.html")) {
        loadVendorAddProduct(user.id);
    } else if (path.includes("manage-products.html")) {
        loadVendorManageProducts(user.id);
    } else if (path.includes("inventory.html")) {
        loadVendorInventory(user.id);
    } else if (path.includes("orders.html")) {
        loadVendorOrders(user.id);
    } else if (path.includes("reports.html")) {
        loadVendorReports(user.id);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!window.TechcartDB) return;
    window.TechcartDB.onReady(function () {
        window.TechcartDB.onAdminCacheReady(bootVendorPanel);
    });
});

// Layout Injection: Header
function injectVendorHeader(user) {
    const el = document.getElementById("vendor-header");
    if (!el) return;

    el.innerHTML = `
        <header class="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <button id="sidebar-toggle-btn" class="lg:hidden text-slate-400 hover:text-white mr-2">
                    <i class="fas fa-bars text-lg"></i>
                </button>
                <a href="../index.html" class="flex items-center gap-2 group">
                    <div class="bg-blue-600 p-2 rounded-xl text-white">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <span class="font-extrabold text-lg tracking-tight text-white">Tech<span class="text-sky-400">Verse</span> <span class="text-blue-500 font-medium text-xs">VENDOR</span></span>
                </a>
            </div>
            
            <div class="flex items-center gap-4">
                <span class="text-xs font-bold text-slate-400 block"><i class="fas fa-store text-blue-500 mr-1.5"></i>${user.shopName || "My Shop"}</span>
                <a href="../index.html" class="text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-3.5 py-1.5 transition-colors">
                    Marketplace
                </a>
            </div>
        </header>
    `;

    // Sidebar toggle for mobile
    const toggleBtn = document.getElementById("sidebar-toggle-btn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const sidebar = document.getElementById("vendor-sidebar");
            if (sidebar) sidebar.classList.toggle("open");
        });
    }
}

// Layout Injection: Sidebar
function injectVendorSidebar() {
    const el = document.getElementById("vendor-sidebar");
    if (!el) return;

    const path = window.location.pathname;
    const items = [
        { name: "Dashboard", file: "dashboard.html", icon: "fa-tachometer-alt" },
        { name: "Products List", file: "manage-products.html", icon: "fa-box" },
        { name: "Add Product", file: "add-product.html", icon: "fa-plus-circle" },
        { name: "Inventory", file: "inventory.html", icon: "fa-cubes" },
        { name: "Orders", file: "orders.html", icon: "fa-shopping-bag" },
        { name: "Sales Reports", file: "reports.html", icon: "fa-chart-pie" }
    ];

    const menuItemsHtml = items.map(item => {
        const isActive = path.includes(item.file);
        const activeClass = isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-400";
        return `
            <a href="${item.file}" class="flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${activeClass}">
                <i class="fas ${item.icon} w-5 text-sm"></i> ${item.name}
            </a>
        `;
    }).join("");

    el.innerHTML = `
        <aside id="vendor-sidebar" class="sidebar w-64 bg-slate-950 border-r border-slate-900 px-4 py-6 flex flex-col justify-between shrink-0 absolute lg:relative z-40">
            <div class="flex flex-col gap-1.5">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Merchant Area</span>
                ${menuItemsHtml}
            </div>
            
            <a href="#" id="vendor-logout-btn" class="flex items-center gap-3 p-3 rounded-xl font-bold text-red-400 hover:bg-red-950/30 transition-all">
                <i class="fas fa-sign-out-alt w-5 text-sm"></i> Logout
            </a>
        </aside>
    `;

    // Bind logout button
    const logoutBtn = document.getElementById("vendor-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.TechcartDB.logout();
            window.location.href = "../index.html";
        });
    }
}

// 1. Dashboard Operations
function loadVendorDashboard(vendorId) {
    const products = window.TechcartDB.getProducts();
    const orders = window.TechcartDB.getOrders();

    // Vendor's products
    const vendorProds = products.filter(p => p.vendorId === vendorId);
    const vendorProdIds = vendorProds.map(p => p.id);

    // Vendor's orders containing their items
    const vendorOrders = orders.filter(o => o.items.some(item => vendorProdIds.includes(item.id)));

    // Calculate metrics
    const totalProducts = vendorProds.length;
    const totalOrders = vendorOrders.length;

    let totalRevenue = 0;
    vendorOrders.forEach(order => {
        order.items.forEach(item => {
            if (vendorProdIds.includes(item.id)) {
                totalRevenue += (item.price * item.quantity);
            }
        });
    });

    const uniqueCustomers = new Set(vendorOrders.map(o => o.buyerId)).size;

    // Update UI Cards
    document.getElementById("stat-products").textContent = totalProducts;
    document.getElementById("stat-orders").textContent = totalOrders;
    document.getElementById("stat-revenue").textContent = `PKR ${totalRevenue.toLocaleString()}`;
    document.getElementById("stat-customers").textContent = uniqueCustomers;

    // Render Recent Orders (limit 5)
    const tbody = document.getElementById("recent-orders-tbody");
    if (tbody) {
        if (vendorOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-6 text-center text-slate-400 font-bold">No orders found.</td>
                </tr>
            `;
        } else {
            tbody.innerHTML = vendorOrders.slice(0, 5).map(o => {
                let badgeClass = "text-amber-700 bg-amber-50 border border-amber-100";
                if (o.status === "Shipped") badgeClass = "text-blue-700 bg-blue-50 border border-blue-100";
                if (o.status === "Delivered") badgeClass = "text-emerald-700 bg-emerald-50 border border-emerald-100";
                if (o.status === "Cancelled") badgeClass = "text-rose-700 bg-rose-50 border border-rose-100";

                return `
                    <tr>
                        <td class="py-3 font-bold text-slate-800">${o.id}</td>
                        <td class="py-3 text-slate-600">${o.buyerName}</td>
                        <td class="py-3 text-slate-450">${o.date}</td>
                        <td class="py-3 font-bold text-slate-800">PKR ${o.amount.toLocaleString()}</td>
                        <td class="py-3"><span class="px-2 py-0.5 rounded-full ${badgeClass}">${o.status}</span></td>
                    </tr>
                `;
            }).join("");
        }
    }

    // Chart 1: Sales Analytics (Line Chart) — live vendor order data
    const monthlyRevenue = window.TechcartUtils.aggregateRevenueByMonth(orders, { productIds: vendorProdIds });
    window.TechcartUtils.renderChart("vendorSalesChart", {
        type: "line",
        data: {
            labels: monthlyRevenue.labels,
            datasets: [{
                label: "Revenue (PKR)",
                data: monthlyRevenue.values,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.08)",
                borderWidth: 3,
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: window.TechcartUtils.chartCurrencyOptions
    });

    // Chart 2: Product Status Doughnut — live vendor catalog data
    const statusCounts = window.TechcartUtils.getProductStatusCounts(vendorProds);
    const statusValues = [statusCounts.approved, statusCounts.pending, statusCounts.rejected];
    const hasProducts = statusValues.some(function (count) { return count > 0; });

    window.TechcartUtils.renderChart("vendorProductChart", {
        type: "doughnut",
        data: {
            labels: hasProducts ? ["Approved", "Pending", "Rejected"] : ["No Products Yet"],
            datasets: [{
                data: hasProducts ? statusValues : [1],
                backgroundColor: hasProducts ? ["#10b981", "#f59e0b", "#ef4444"] : ["#cbd5e1"],
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom", labels: { boxWidth: 12, font: { weight: "bold", size: 10 } } },
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

// 2. Add Product Operations
function loadVendorAddProduct(vendorId) {
    const categorySelect = document.getElementById("prod-category");
    if (categorySelect) {
        const categories = window.TechcartDB.getCategories();
        categorySelect.innerHTML = categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join("");
    }

    const form = document.getElementById("add-product-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("prod-name").value.trim();
            const brand = document.getElementById("prod-brand").value.trim();
            const category = categorySelect.value;
            const price = parseInt(document.getElementById("prod-price").value);
            const stock = parseInt(document.getElementById("prod-stock").value);
            const imageInput = document.getElementById("prod-image").value.trim();
            const desc = document.getElementById("prod-desc").value.trim();

            const imageUrl = imageInput || "https://static.webx.pk/files/87161/Images/laptops-87161-101125021226_w_240_h_240.avif";

            const newProduct = {
                id: "p_ven_" + Date.now(),
                name: name,
                brand: brand,
                category: category,
                price: price,
                discountPrice: null,
                rating: 0.0,
                reviewsCount: 0,
                stock: stock,
                vendorId: vendorId,
                status: "pending",
                featured: false,
                flashSale: false,
                newArrival: false,
                bestSeller: false,
                image: imageUrl,
                description: desc,
                specifications: {
                    "Brand": brand,
                    "Category": category
                }
            };

            const products = window.TechcartDB.getProducts();
            products.push(newProduct);
            window.TechcartDB.saveProducts(products);

            Swal.fire({
                icon: "success",
                title: "Product Submitted",
                text: "Your product was added successfully and is pending admin approval.",
                confirmButtonColor: "#2563eb"
            });

            form.reset();
        });
    }
}

// 3. Manage Products operations
function loadVendorManageProducts(vendorId) {
    const tbody = document.getElementById("manage-products-tbody");
    const emptyState = document.getElementById("manage-empty-state");
    const tableContainer = tbody ? tbody.closest("table") : null;

    if (!tbody) return;

    const products = window.TechcartDB.getProducts();
    const vendorProds = products.filter(p => p.vendorId === vendorId);

    if (vendorProds.length === 0) {
        if (tableContainer) tableContainer.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (tableContainer) tableContainer.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    tbody.innerHTML = vendorProds.map(p => {
        let statusBadgeClass = "text-amber-700 bg-amber-50 border border-amber-100";
        if (p.status === "approved") statusBadgeClass = "text-emerald-700 bg-emerald-50 border border-emerald-100";
        if (p.status === "rejected") statusBadgeClass = "text-rose-700 bg-rose-50 border border-rose-100";

        return `
            <tr class="border-b border-slate-100">
                <td class="py-3.5">
                    <div class="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg p-1 flex items-center justify-center">
                        <img src="${p.image}" alt="thumb" class="object-contain max-h-full max-w-full">
                    </div>
                </td>
                <td class="py-3.5 font-bold text-slate-800">${p.name}</td>
                <td class="py-3.5 text-slate-500 capitalize">${p.category}</td>
                <td class="py-3.5 font-bold text-slate-800">PKR ${p.price.toLocaleString()}</td>
                <td class="py-3.5 text-center"><span class="px-2.5 py-0.5 rounded-full ${statusBadgeClass}">${p.status}</span></td>
                <td class="py-3.5 text-center">
                    <div class="flex items-center justify-center gap-3">
                        <button onclick="editProductPrice('${p.id}')" class="text-blue-600 hover:text-blue-700 font-bold hover:underline">Edit Price</button>
                        <button onclick="deleteProduct('${p.id}', '${vendorId}')" class="text-red-650 hover:text-red-750 font-bold hover:underline">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// Edit price helper
window.editProductPrice = (productId) => {
    const products = window.TechcartDB.getProducts();
    const product = products.find(p => p.id === productId);

    if (product) {
        Swal.fire({
            title: "Adjust Retail Price",
            input: "number",
            inputLabel: `Current Price: PKR ${product.price.toLocaleString()}`,
            inputValue: product.price,
            showCancelButton: true,
            confirmButtonText: "Update Price",
            confirmButtonColor: "#2563eb",
            cancelButtonColor: "#64748b",
            inputValidator: (value) => {
                if (!value || parseInt(value) <= 0) {
                    return "Please enter a valid retail price.";
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                product.price = parseInt(result.value);
                window.TechcartDB.saveProducts(products);
                Swal.fire({
                    icon: "success",
                    title: "Price Updated",
                    showConfirmButton: false,
                    timer: 1200
                });
                const user = window.TechcartDB.getCurrentUser();
                loadVendorManageProducts(user.id);
            }
        });
    }
};

// Delete Product
window.deleteProduct = (productId, vendorId) => {
    Swal.fire({
        title: "Delete Product Listing?",
        text: "This product listing will be permanently removed from the catalog database.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, delete it"
    }).then((result) => {
        if (result.isConfirmed) {
            window.TechcartDB.deleteProduct(productId).then(function () {
                Swal.fire({
                    icon: "success",
                    title: "Deleted",
                    text: "Product deleted successfully.",
                    showConfirmButton: false,
                    timer: 1200
                });
                loadVendorManageProducts(vendorId);
            }).catch(function () {
                Swal.fire({
                    icon: "error",
                    title: "Delete Failed",
                    text: "Could not remove the product. Please try again.",
                    confirmButtonColor: "#132238"
                });
            });
        }
    });
};

// 4. Inventory operations
function loadVendorInventory(vendorId) {
    const tbody = document.getElementById("inventory-tbody");
    const emptyState = document.getElementById("inventory-empty-state");
    const tableContainer = tbody ? tbody.closest("table") : null;

    if (!tbody) return;

    const products = window.TechcartDB.getProducts();
    const vendorProds = products.filter(p => p.vendorId === vendorId);

    if (vendorProds.length === 0) {
        if (tableContainer) tableContainer.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (tableContainer) tableContainer.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    tbody.innerHTML = vendorProds.map(p => {
        const inStock = p.stock > 0;
        const stockBadge = inStock ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-rose-700 bg-rose-50 border border-rose-100";
        return `
            <tr class="border-b border-slate-100">
                <td class="py-3.5 font-bold text-slate-800">${p.name}</td>
                <td class="py-3.5 font-semibold text-slate-500">PKR ${p.price.toLocaleString()}</td>
                <td class="py-3.5 text-center font-bold text-slate-800">${p.stock} units</td>
                <td class="py-3.5 text-center"><span class="px-2.5 py-0.5 rounded-full ${stockBadge}">${inStock ? "In Stock" : "Out of Stock"}</span></td>
                <td class="py-3.5 text-center">
                    <div class="flex items-center justify-center gap-2 select-none">
                        <button onclick="adjustStock('${p.id}', -5, '${vendorId}')" class="px-2 py-1 bg-slate-100 rounded text-[10px] hover:bg-slate-200 transition-colors font-bold">-5</button>
                        <button onclick="adjustStock('${p.id}', -1, '${vendorId}')" class="px-2 py-1 bg-slate-100 rounded text-[10px] hover:bg-slate-200 transition-colors font-bold">-1</button>
                        <button onclick="adjustStock('${p.id}', 1, '${vendorId}')" class="px-2 py-1 bg-slate-100 rounded text-[10px] hover:bg-slate-200 transition-colors font-bold">+1</button>
                        <button onclick="adjustStock('${p.id}', 5, '${vendorId}')" class="px-2 py-1 bg-slate-100 rounded text-[10px] hover:bg-slate-200 transition-colors font-bold">+5</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// Adjust Stock Helper
window.adjustStock = (productId, amount, vendorId) => {
    const products = window.TechcartDB.getProducts();
    const product = products.find(p => p.id === productId);

    if (product) {
        const newStock = product.stock + amount;
        if (newStock < 0) return;
        product.stock = newStock;
        window.TechcartDB.saveProducts(products);
        loadVendorInventory(vendorId);
    }
};

// 5. Vendor Orders Operations
function loadVendorOrders(vendorId) {
    const tbody = document.getElementById("vendor-orders-tbody");
    const emptyState = document.getElementById("orders-empty-state");
    const tableContainer = tbody ? tbody.closest("table") : null;

    if (!tbody) return;

    const products = window.TechcartDB.getProducts();
    const orders = window.TechcartDB.getOrders();

    const vendorProds = products.filter(p => p.vendorId === vendorId);
    const vendorProdIds = vendorProds.map(p => p.id);

    // Filter orders matching vendor items
    const vendorOrders = orders.filter(o => o.items.some(item => vendorProdIds.includes(item.id)));

    if (vendorOrders.length === 0) {
        if (tableContainer) tableContainer.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (tableContainer) tableContainer.classList.remove("hidden");
    if (emptyState) emptyState.classList.add("hidden");

    tbody.innerHTML = vendorOrders.map(order => {
        let badgeClass = "text-amber-700 bg-amber-50 border border-amber-100";
        if (order.status === "Shipped") badgeClass = "text-blue-700 bg-blue-50 border border-blue-100";
        if (order.status === "Delivered") badgeClass = "text-emerald-700 bg-emerald-50 border border-emerald-100";
        if (order.status === "Cancelled") badgeClass = "text-rose-700 bg-rose-50 border border-rose-100";

        // Sum only vendor specific items total
        let vendorTotal = 0;
        order.items.forEach(item => {
            if (vendorProdIds.includes(item.id)) {
                vendorTotal += (item.price * item.quantity);
            }
        });

        return `
            <tr class="border-b border-slate-100">
                <td class="py-3.5 font-bold text-slate-800">${order.id}</td>
                <td class="py-3.5 text-slate-700">${order.buyerName}</td>
                <td class="py-3.5 text-slate-500">${order.date}</td>
                <td class="py-3.5 font-bold text-slate-800">PKR ${vendorTotal.toLocaleString()}</td>
                <td class="py-3.5 text-center"><span class="px-2.5 py-0.5 rounded-full ${badgeClass}">${order.status}</span></td>
                <td class="py-3.5 text-center">
                    <div class="flex items-center justify-center gap-3">
                        <button onclick="viewVendorOrder('${order.id}', '${vendorId}')" class="text-blue-600 hover:text-blue-700 font-semibold">View</button>
                        <select onchange="updateVendorOrderStatus('${order.id}', this.value)" class="bg-slate-50 border border-slate-200 text-slate-700 rounded p-1 text-[10px] font-semibold cursor-pointer">
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

    // Modal Close
    const modal = document.getElementById("vendor-order-modal");
    const closeBtn = document.getElementById("modal-close-btn");
    if (closeBtn && modal) {
        closeBtn.onclick = () => modal.classList.add("hidden");
        modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hidden"); };
    }
}

// View order helper
window.viewVendorOrder = (orderId, vendorId) => {
    const modal = document.getElementById("vendor-order-modal");
    const orderIdEl = document.getElementById("modal-order-id");
    const customerEl = document.getElementById("modal-customer");
    const dateEl = document.getElementById("modal-date");
    const itemsContainer = document.getElementById("modal-items-container");
    const totalEl = document.getElementById("modal-total");

    const orders = window.TechcartDB.getOrders();
    const order = orders.find(o => o.id === orderId);

    const products = window.TechcartDB.getProducts();
    const vendorProds = products.filter(p => p.vendorId === vendorId);
    const vendorProdIds = vendorProds.map(p => p.id);

    if (order && modal) {
        orderIdEl.textContent = `Order Details: ${order.id}`;
        customerEl.textContent = order.buyerName;
        dateEl.textContent = order.date;

        let vendorTotal = 0;
        const vendorItems = order.items.filter(item => vendorProdIds.includes(item.id));

        itemsContainer.innerHTML = vendorItems.map(item => {
            vendorTotal += (item.price * item.quantity);
            return `
                <div class="flex justify-between items-center py-2 text-xs font-semibold text-slate-700">
                    <div>
                        <span class="font-bold text-slate-900 block">${item.name}</span>
                        <span class="text-[10px] text-slate-400 font-semibold mt-0.5">Price: PKR ${item.price.toLocaleString()}</span>
                    </div>
                    <div class="text-right pl-4">
                        <span class="text-slate-400 text-[10px] block">Qty: ${item.quantity}</span>
                        <span class="font-bold text-slate-900">PKR ${(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                </div>
            `;
        }).join("");

        totalEl.textContent = `PKR ${vendorTotal.toLocaleString()}`;
        modal.classList.remove("hidden");
    }
};

// Update order status helper
window.updateVendorOrderStatus = (orderId, newStatus) => {
    const orders = window.TechcartDB.getOrders();
    const order = orders.find(o => o.id === orderId);

    if (order) {
        order.status = newStatus;
        window.TechcartDB.saveOrders(orders);
        Swal.fire({
            icon: "success",
            title: "Status Updated",
            text: `Order status changed to ${newStatus}`,
            showConfirmButton: false,
            timer: 1200
        });
        const user = window.TechcartDB.getCurrentUser();
        loadVendorOrders(user.id);
    }
};

// 6. Reports operations
function loadVendorReports(vendorId) {
    const products = window.TechcartDB.getProducts();
    const orders = window.TechcartDB.getOrders();

    const vendorProds = products.filter(p => p.vendorId === vendorId);
    const vendorProdIds = vendorProds.map(p => p.id);
    const vendorOrders = orders.filter(o => o.items.some(item => vendorProdIds.includes(item.id)));

    let totalRevenue = 0;
    vendorOrders.forEach(order => {
        order.items.forEach(item => {
            if (vendorProdIds.includes(item.id)) {
                totalRevenue += (item.price * item.quantity);
            }
        });
    });

    const totalSales = vendorOrders.length;
    const aov = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;

    document.getElementById("rep-revenue").textContent = `PKR ${totalRevenue.toLocaleString()}`;
    document.getElementById("rep-sales").textContent = `${totalSales} orders`;
    document.getElementById("rep-avg").textContent = `PKR ${aov.toLocaleString()}`;

    const monthlyRevenue = window.TechcartUtils.aggregateRevenueByMonth(orders, { productIds: vendorProdIds });
    window.TechcartUtils.renderChart("vendorReportsChart", {
        type: "bar",
        data: {
            labels: monthlyRevenue.labels,
            datasets: [{
                label: "Monthly Shop Revenue (PKR)",
                data: monthlyRevenue.values,
                backgroundColor: "#3b82f6",
                hoverBackgroundColor: "#1d4ed8",
                borderRadius: 8
            }]
        },
        options: window.TechcartUtils.chartBarCurrencyOptions
    });
}
