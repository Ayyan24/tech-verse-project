// Homepage — lightweight product listing

document.addEventListener("DOMContentLoaded", function () {
    function loadHomepageContent() {
        loadCategories();
        loadAllProducts();
    }

    if (window.TechcartDB && window.TechcartDB.isCacheReady()) {
        loadHomepageContent();
    } else if (window.TechcartDB) {
        window.TechcartDB.onCacheReady(loadHomepageContent);
    } else {
        window.addEventListener("db-cache-ready", loadHomepageContent, { once: true });
    }
});

var card = function (p) { return window.TechcartUtils.createProductCard(p, "buyer/"); };

function loadCategories() {
    var box = document.getElementById("categories-slider-container");
    if (!box) return;

    var cats = window.TechcartDB.getCategories();
    box.innerHTML = cats.map(function (cat) {
        return (
            '<a href="buyer/products.html?category=' + cat.id + '" class="cat-card shrink-0" style="min-width:88px;text-align:center;padding:12px 8px;">' +
                '<i class="fas ' + cat.icon + '" style="font-size:22px;color:#0ea5e9;display:block;margin-bottom:6px;"></i>' +
                '<span style="display:block;font-size:11px;font-weight:600;color:#333;">' + cat.name + '</span>' +
            '</a>'
        );
    }).join("");
}

function loadAllProducts() {
    var box = document.getElementById("featured-products-grid");
    if (!box) return;

    var items = window.TechcartDB.getProducts()
        .filter(function (p) { return p.status === "approved"; })
        .slice(0, 12);

    box.innerHTML = items.length
        ? items.map(card).join("")
        : '<p style="grid-column:1/-1;text-align:center;padding:32px 16px;color:#888;font-size:14px;">No products yet. Vendors can add items from the vendor dashboard.</p>';
}
