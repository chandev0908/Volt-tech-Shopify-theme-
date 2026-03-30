/**
 * Volt Wishlist — localStorage-based wishlist
 * Manages [data-wishlist-btn][data-product-id] buttons and #volt-wishlist-count badge.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'volt_wishlist';

  /* ── Storage helpers ── */
  function getIds() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveIds(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {}
  }

  function has(id) {
    return getIds().indexOf(String(id)) !== -1;
  }

  function add(id) {
    var ids = getIds();
    id = String(id);
    if (ids.indexOf(id) === -1) ids.push(id);
    saveIds(ids);
  }

  function remove(id) {
    var ids = getIds();
    id = String(id);
    saveIds(ids.filter(function (i) { return i !== id; }));
  }

  /* ── Toast notification ── */
  function toast(msg, type) {
    var existing = document.getElementById('volt-wishlist-toast');
    if (existing) existing.remove();

    var el = document.createElement('div');
    el.id = 'volt-wishlist-toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:' + (type === 'remove' ? 'rgba(30,30,30,0.95)' : '#0066ff'),
      'color:#fff',
      'font-family:var(--volt-font-mono,monospace)',
      'font-size:11px',
      'letter-spacing:1.5px',
      'text-transform:uppercase',
      'padding:12px 24px',
      'z-index:99999',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 0.25s ease',
      'white-space:nowrap',
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);

    // Trigger fade-in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.opacity = '1';
      });
    });

    setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 300);
    }, 2200);
  }

  /* ── Update a single button ── */
  function updateBtn(btn, isActive) {
    btn.classList.toggle('is-wished', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    var label = btn.dataset.productTitle
      ? (isActive ? 'Remove from wishlist' : 'Add to wishlist') + ': ' + btn.dataset.productTitle
      : (isActive ? 'Remove from wishlist' : 'Add to wishlist');
    btn.setAttribute('aria-label', label);
  }

  /* ── Update count badge ── */
  function updateBadge() {
    var badge = document.getElementById('volt-wishlist-count');
    if (!badge) return;
    var count = getIds().length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  /* ── Sync all buttons on page ── */
  function syncAllButtons() {
    document.querySelectorAll('[data-wishlist-btn]').forEach(function (btn) {
      var id = btn.dataset.productId;
      if (id) updateBtn(btn, has(id));
    });
    updateBadge();
  }

  /* ── Handle click ── */
  function handleClick(e) {
    var btn = e.target.closest('[data-wishlist-btn]');
    if (!btn) return;

    var id = btn.dataset.productId;
    if (!id) return;

    var wasActive = has(id);
    if (wasActive) {
      remove(id);
      updateBtn(btn, false);
      toast('Removed from wishlist', 'remove');
    } else {
      add(id);
      updateBtn(btn, true);
      toast('Added to wishlist');
    }

    updateBadge();

    // Sync any other buttons for the same product on the page
    document.querySelectorAll('[data-wishlist-btn][data-product-id="' + id + '"]').forEach(function (b) {
      if (b !== btn) updateBtn(b, !wasActive);
    });
  }

  /* ── Wishlist page rendering ── */
  function renderWishlistPage() {
    var container = document.getElementById('volt-wishlist-page');
    if (!container) return;

    var ids = getIds();
    if (ids.length === 0) {
      container.innerHTML =
        '<div class="volt-wishlist-page__empty">' +
        '<p class="volt-wishlist-page__empty-title">Your wishlist is empty</p>' +
        '<a href="/collections/all" class="volt-btn volt-btn--primary">Start Shopping</a>' +
        '</div>';
      return;
    }

    container.innerHTML = '<div class="volt-wishlist-page__loading">Loading…</div>';

    // Fetch each product and render
    var fetches = ids.map(function (id) {
      return fetch('/products.json?ids=' + id + '&limit=1')
        .then(function (r) { return r.json(); })
        .catch(function () { return { products: [] }; });
    });

    Promise.all(fetches).then(function (results) {
      var products = [];
      results.forEach(function (data) {
        if (data.products && data.products.length > 0) {
          products.push(data.products[0]);
        }
      });

      if (products.length === 0) {
        container.innerHTML = '<p>Could not load wishlist items.</p>';
        return;
      }

      var html = '<div class="volt-wishlist-page__grid">';
      products.forEach(function (p) {
        var variant = p.variants[0];
        var imgSrc = p.images.length > 0 ? p.images[0].src : '';
        var imgHtml = imgSrc
          ? '<img src="' + imgSrc + '" alt="' + escapeHtml(p.title) + '" loading="lazy" width="400" height="400">'
          : '<div class="volt-card__img-placeholder">VOLT</div>';
        var hasCompare = variant.compare_at_price && variant.compare_at_price > variant.price;
        var money = function (cents) {
          return '₱' + (cents / 100).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        };

        html +=
          '<article class="volt-card" aria-label="' + escapeHtml(p.title) + '">' +
          '<a href="/products/' + p.handle + '" class="volt-card__image-wrap" tabindex="-1" aria-hidden="true">' +
          '<div class="volt-card__img">' + imgHtml + '</div>' +
          '<div class="volt-card__overlay" aria-hidden="true"></div>' +
          '</a>' +
          '<button class="volt-card__wishlist is-wished" type="button" ' +
          'data-wishlist-btn data-product-id="' + p.id + '" ' +
          'aria-label="Remove ' + escapeHtml(p.title) + ' from wishlist" aria-pressed="true">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
          '</button>' +
          '<div class="volt-card__body">' +
          (p.vendor ? '<p class="volt-card__brand">' + escapeHtml(p.vendor) + '</p>' : '') +
          '<a class="volt-card__name" href="/products/' + p.handle + '">' + escapeHtml(p.title) + '</a>' +
          '<div class="volt-card__footer">' +
          '<div class="volt-card__prices">' +
          '<span class="volt-card__price">' + money(variant.price) + '</span>' +
          (hasCompare ? '<span class="volt-card__compare">' + money(variant.compare_at_price) + '</span>' : '') +
          '</div>' +
          '</div>' +
          '</div>' +
          '</article>';
      });
      html += '</div>';
      container.innerHTML = html;
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    syncAllButtons();
    renderWishlistPage();
    document.addEventListener('click', handleClick);
  });

  // Re-sync after cart/SRA updates (product cards may be re-rendered)
  document.addEventListener('volt:section:loaded', syncAllButtons);
})();
