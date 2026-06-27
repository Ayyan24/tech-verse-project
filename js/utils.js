// Simple shared helpers used across the site
(function () {
    function formatPrice(amount) {
        return "Rs. " + Number(amount).toLocaleString();
    }

    function renderStars(rating) {
        var html = "";
        var full = Math.floor(rating);
        for (var i = 1; i <= 5; i++) {
            html += i <= full
                ? '<i class="fas fa-star"></i>'
                : '<i class="far fa-star"></i>';
        }
        return html;
    }

    function getDiscountPercent(product) {
        if (!product.discountPrice || product.discountPrice >= product.price) return 0;
        return Math.round((1 - product.discountPrice / product.price) * 100);
    }

    var chartInstances = {};

    function parseOrderDate(dateStr) {
        if (!dateStr) return null;
        var parts = String(dateStr).split("-");
        if (parts.length >= 2) {
            var d = new Date(Number(parts[0]), Number(parts[1]) - 1, parts[2] ? Number(parts[2]) : 1);
            if (!isNaN(d.getTime())) return d;
        }
        var fallback = new Date(dateStr);
        return isNaN(fallback.getTime()) ? null : fallback;
    }

    function getRecentMonthBuckets(count) {
        var labels = [];
        var buckets = [];
        var now = new Date();

        for (var i = count - 1; i >= 0; i--) {
            var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(d.toLocaleString("en-US", { month: "short" }));
            buckets.push({ year: d.getFullYear(), month: d.getMonth() });
        }

        return { labels: labels, buckets: buckets };
    }

    function aggregateRevenueByMonth(orders, options) {
        options = options || {};
        var monthCount = options.monthCount || 6;
        var productIds = options.productIds || null;
        var excludeCancelled = options.excludeCancelled !== false;
        var recent = getRecentMonthBuckets(monthCount);
        var values = recent.buckets.map(function () { return 0; });

        (orders || []).forEach(function (order) {
            if (excludeCancelled && order.status === "Cancelled") return;

            var date = parseOrderDate(order.date);
            if (!date) return;

            var bucketIndex = -1;
            for (var i = 0; i < recent.buckets.length; i++) {
                var bucket = recent.buckets[i];
                if (bucket.year === date.getFullYear() && bucket.month === date.getMonth()) {
                    bucketIndex = i;
                    break;
                }
            }
            if (bucketIndex === -1) return;

            var revenue = 0;
            if (productIds && order.items && order.items.length) {
                order.items.forEach(function (item) {
                    if (productIds.indexOf(item.id) !== -1) {
                        revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
                    }
                });
            } else {
                revenue = Number(order.amount) || 0;
            }

            values[bucketIndex] += revenue;
        });

        return { labels: recent.labels, values: values };
    }

    function getProductStatusCounts(products) {
        var list = products || [];
        return {
            approved: list.filter(function (p) { return p.status === "approved"; }).length,
            pending: list.filter(function (p) { return p.status === "pending"; }).length,
            rejected: list.filter(function (p) { return p.status === "rejected"; }).length
        };
    }

    function destroyChart(canvasId) {
        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
            delete chartInstances[canvasId];
        }
    }

    function renderChart(canvasId, config) {
        if (typeof Chart === "undefined") return null;
        var canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        destroyChart(canvasId);
        chartInstances[canvasId] = new Chart(canvas, config);
        return chartInstances[canvasId];
    }

    var chartCurrencyOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (ctx) {
                        var value = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.parsed;
                        return (ctx.dataset.label || "Revenue") + ": PKR " + Number(value).toLocaleString();
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: "#f1f5f9" },
                ticks: {
                    callback: function (value) {
                        return "PKR " + Number(value).toLocaleString();
                    }
                }
            },
            x: { grid: { display: false } }
        }
    };

    var chartBarCurrencyOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function (ctx) {
                        return (ctx.dataset.label || "Revenue") + ": PKR " + Number(ctx.parsed.y).toLocaleString();
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: "#f1f5f9" },
                ticks: {
                    callback: function (value) {
                        return "PKR " + Number(value).toLocaleString();
                    }
                }
            },
            x: { grid: { display: false } }
        }
    };

    // Czone-style product box — one place for all product cards
    function createProductCard(product, linkPrefix) {
        linkPrefix = linkPrefix || "";
        var discount = getDiscountPercent(product);
        var salePrice = product.discountPrice || product.price;
        var outOfStock = product.stock <= 0;
        var badges = "";
        var ratingText = product.rating > 0
            ? product.rating.toFixed(1) + " (" + (product.reviewsCount || 0) + " reviews)"
            : "New arrival";
        var stockLabel = outOfStock ? "Out of stock" : (product.stock || 0) + " in stock";
        var stockClass = outOfStock ? "out-stock" : "in-stock";

        if (product.newArrival) {
            badges += '<span class="czone-badge czone-badge-new">New</span>';
        }
        if (discount > 0) {
            badges += '<span class="czone-badge czone-badge-sale">' + discount + '% Off</span>';
        }

        var priceHtml = product.discountPrice
            ? '<span class="czone-price-old">' + formatPrice(product.price) + '</span>' +
              '<span class="czone-price">' + formatPrice(product.discountPrice) + '</span>'
            : '<span class="czone-price">' + formatPrice(product.price) + '</span>';

        var cartBtn = outOfStock
            ? '<button class="czone-btn czone-btn-disabled" disabled>Out Of Stock</button>'
            : '<button class="czone-btn" onclick="window.CartActions.addToCart(\'' + product.id + '\')">Add To Cart</button>';

        return (
            '<div class="czone-product-box">' +
                (badges ? '<div class="czone-badges">' + badges + '</div>' : '') +
                '<a href="' + linkPrefix + 'product-details.html?id=' + product.id + '" class="czone-product-img">' +
                    '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy">' +
                '</a>' +
                '<div class="czone-product-body">' +
                    '<div class="czone-product-top">' +
                        '<span class="czone-product-brand">' + (product.brand || 'Tech Verse') + '</span>' +
                        '<span class="czone-stock-pill ' + stockClass + '"><i class="fas fa-box"></i>' + stockLabel + '</span>' +
                    '</div>' +
                    '<a href="' + linkPrefix + 'product-details.html?id=' + product.id + '" class="czone-product-title">' + product.name + '</a>' +
                    '<div class="czone-rating-row">' +
                        '<div class="czone-stars">' + renderStars(product.rating) + '</div>' +
                        '<span class="czone-rating-copy">' + ratingText + '</span>' +
                    '</div>' +
                    '<div class="czone-prices">' + priceHtml + '</div>' +
                    '<div class="czone-card-actions">' +
                        '<button class="czone-icon-btn" aria-label="Add to wishlist" onclick="window.CartActions.addToWishlist(\'' + product.id + '\')"><i class="far fa-heart"></i></button>' +
                        cartBtn +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    }

    window.TechcartUtils = {
        formatPrice: formatPrice,
        renderStars: renderStars,
        getDiscountPercent: getDiscountPercent,
        createProductCard: createProductCard,
        aggregateRevenueByMonth: aggregateRevenueByMonth,
        getProductStatusCounts: getProductStatusCounts,
        renderChart: renderChart,
        destroyChart: destroyChart,
        chartCurrencyOptions: chartCurrencyOptions,
        chartBarCurrencyOptions: chartBarCurrencyOptions
    };
})();
