// Product catalog page

document.addEventListener("DOMContentLoaded", function () {
    var filters = {
        categories: [],
        brands: [],
        maxPrice: 600000,
        inStockOnly: false,
        searchQuery: "",
        sortBy: "default"
    };

    var params = new URLSearchParams(window.location.search);
    if (params.get("search")) {
        filters.searchQuery = params.get("search");
        var searchBox = document.getElementById("catalog-search-input");
        if (searchBox) searchBox.value = filters.searchQuery;
    }
    if (params.get("category")) filters.categories.push(params.get("category"));
    if (params.get("brand")) filters.brands.push(params.get("brand"));

    function initCatalog() {
        renderSidebar(filters);
        setupListeners(filters);
        renderCatalog(filters);
    }

    if (window.TechcartDB && window.TechcartDB.isCacheReady()) {
        initCatalog();
    } else if (window.TechcartDB) {
        window.TechcartDB.onCacheReady(initCatalog);
    } else {
        window.addEventListener("db-cache-ready", initCatalog, { once: true });
    }
});

function renderSidebar(filters) {
    var catBox = document.getElementById("sidebar-categories");
    var brandBox = document.getElementById("sidebar-brands");
    var categories = window.TechcartDB.getCategories();
    var products = window.TechcartDB.getProducts();
    var brands = [];

    products.forEach(function (p) {
        if (p.status === "approved" && brands.indexOf(p.brand) === -1) brands.push(p.brand);
    });
    brands.sort();

    if (catBox) {
        catBox.innerHTML = categories.map(function (cat) {
            var checked = filters.categories.indexOf(cat.id) !== -1 ? "checked" : "";
            return (
                '<label class="flex items-center gap-2 cursor-pointer">' +
                    '<input type="checkbox" value="' + cat.id + '" class="category-checkbox w-4 h-4" ' + checked + '>' +
                    '<span class="text-xs font-medium text-slate-600">' + cat.name + '</span>' +
                '</label>'
            );
        }).join("");
    }

    if (brandBox) {
        brandBox.innerHTML = brands.map(function (brand) {
            var checked = filters.brands.indexOf(brand) !== -1 ? "checked" : "";
            return (
                '<label class="flex items-center gap-2 cursor-pointer">' +
                    '<input type="checkbox" value="' + brand + '" class="brand-checkbox w-4 h-4" ' + checked + '>' +
                    '<span class="text-xs font-medium text-slate-600">' + brand + '</span>' +
                '</label>'
            );
        }).join("");
    }
}

function setupListeners(filters) {
    document.addEventListener("change", function (e) {
        if (e.target.classList.contains("category-checkbox")) {
            filters.categories = getCheckedValues(".category-checkbox");
            renderCatalog(filters);
        }
        if (e.target.classList.contains("brand-checkbox")) {
            filters.brands = getCheckedValues(".brand-checkbox");
            renderCatalog(filters);
        }
    });

    var priceSlider = document.getElementById("price-slider");
    var priceLabel = document.getElementById("price-slider-value");
    if (priceSlider) {
        priceSlider.addEventListener("input", function () {
            filters.maxPrice = parseInt(priceSlider.value, 10);
            if (priceLabel) priceLabel.textContent = "Max: " + filters.maxPrice.toLocaleString();
            renderCatalog(filters);
        });
    }

    var stockToggle = document.getElementById("stock-toggle");
    if (stockToggle) {
        stockToggle.addEventListener("change", function () {
            filters.inStockOnly = stockToggle.checked;
            renderCatalog(filters);
        });
    }

    var searchInput = document.getElementById("catalog-search-input");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            filters.searchQuery = searchInput.value.trim();
            renderCatalog(filters);
        });
    }

    var sortDropdown = document.getElementById("catalog-sort");
    if (sortDropdown) {
        sortDropdown.addEventListener("change", function () {
            filters.sortBy = sortDropdown.value;
            renderCatalog(filters);
        });
    }

    var reset = function () {
        filters.categories = [];
        filters.brands = [];
        filters.maxPrice = 600000;
        filters.inStockOnly = false;
        filters.searchQuery = "";
        filters.sortBy = "default";
        document.querySelectorAll(".category-checkbox, .brand-checkbox").forEach(function (el) { el.checked = false; });
        if (priceSlider) { priceSlider.value = 600000; if (priceLabel) priceLabel.textContent = "Max: 600,000"; }
        if (stockToggle) stockToggle.checked = false;
        if (searchInput) searchInput.value = "";
        if (sortDropdown) sortDropdown.value = "default";
        renderCatalog(filters);
    };

    var clearBtn = document.getElementById("clear-filters-btn");
    var resetBtn = document.getElementById("reset-catalog-btn");
    if (clearBtn) clearBtn.addEventListener("click", reset);
    if (resetBtn) resetBtn.addEventListener("click", reset);
}

function getCheckedValues(selector) {
    return Array.from(document.querySelectorAll(selector + ":checked")).map(function (el) { return el.value; });
}

function renderCatalog(filters) {
    var grid = document.getElementById("products-catalog-grid");
    var empty = document.getElementById("catalog-empty-state");
    var summary = document.getElementById("catalog-count-summary");
    if (!grid) return;

    var all = window.TechcartDB.getProducts();
    var filtered = all.filter(function (p) {
        if (p.status !== "approved") return false;
        if (filters.categories.length && filters.categories.indexOf(p.category) === -1) return false;
        if (filters.brands.length && filters.brands.indexOf(p.brand) === -1) return false;
        if ((p.discountPrice || p.price) > filters.maxPrice) return false;
        if (filters.inStockOnly && p.stock <= 0) return false;
        if (filters.searchQuery) {
            var q = filters.searchQuery.toLowerCase();
            if (p.name.toLowerCase().indexOf(q) === -1 && p.brand.toLowerCase().indexOf(q) === -1) return false;
        }
        return true;
    });

    if (filters.sortBy === "price-low") {
        filtered.sort(function (a, b) { return (a.discountPrice || a.price) - (b.discountPrice || b.price); });
    } else if (filters.sortBy === "price-high") {
        filtered.sort(function (a, b) { return (b.discountPrice || b.price) - (a.discountPrice || a.price); });
    } else if (filters.sortBy === "rating") {
        filtered.sort(function (a, b) { return b.rating - a.rating; });
    }

    var approvedCount = all.filter(function (p) { return p.status === "approved"; }).length;
    if (summary) summary.textContent = "Showing " + filtered.length + " of " + approvedCount + " items";

    if (filtered.length === 0) {
        grid.classList.add("hidden");
        if (empty) empty.classList.remove("hidden");
        return;
    }

    grid.classList.remove("hidden");
    if (empty) empty.classList.add("hidden");
    grid.innerHTML = filtered.map(function (p) {
        return window.TechcartUtils.createProductCard(p, "");
    }).join("");
}
