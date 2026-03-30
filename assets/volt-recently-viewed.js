/**
 * Volt Recently Viewed — localStorage product tracker
 * On product pages: saves minimal product data.
 * <volt-recently-viewed> custom element reads data and renders cards.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'volt_recently_viewed';
  var MAX_ITEMS = 10;

  /* ── Storage ── */
  function getItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveProduct(data) {
    if (!data || !data.id) return;
    var items = getItems().filter(function (p) { return String(p.id) !== String(data.id); });
    items.unshift(data);
    if (items.length > MAX_ITEMS) items = items.slice(0, MAX_ITEMS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  /* ── Save current product (injected by section via data attribute) ── */
  var tracker = document.getElementById('volt-rv-tracker');
  if (tracker) {
    try {
      var data = JSON.parse(tracker.getAttribute('data-product'));
      if (data && data.id) saveProduct(data);
    } catch (e) {}
  }

  /* ── Custom element that renders the grid ── */
  if (!customElements.get('volt-recently-viewed')) {
    customElements.define('volt-recently-viewed', class extends HTMLElement {
      connectedCallback() {
        var currentId = String(this.dataset.currentId || '');
        var limit = parseInt(this.dataset.limit || '4', 10);
        var items = getItems().filter(function (p) {
          return String(p.id) !== currentId;
        }).slice(0, limit);

        if (items.length === 0) {
          this.hidden = true;
          var section = this.closest('.volt-rv-section');
          if (section) section.hidden = true;
          return;
        }

        var money = function (cents) {
          return '₱' + (cents / 100).toLocaleString('en-PH', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });
        };

        var html = '<div class="volt-featured__grid">';
        items.forEach(function (p) {
          var imgHtml = p.image
            ? '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.title) + '" loading="lazy" width="400" height="400" class="volt-card__img">'
            : '<div class="volt-card__img-placeholder">VOLT</div>';

          var hasCompare = p.compare_price && p.compare_price > p.price;
          var hasDiscount = hasCompare;

          html +=
            '<article class="volt-card" aria-label="' + escapeHtml(p.title) + '">' +
            '<a href="' + escapeHtml(p.url) + '" class="volt-card__image-wrap" tabindex="-1" aria-hidden="true">' +
            imgHtml +
            '<div class="volt-card__overlay" aria-hidden="true"></div>' +
            '</a>' +
            (hasDiscount ? '<div class="volt-card__badge"><span class="volt-badge volt-badge--sale">Sale</span></div>' : '') +
            '<div class="volt-card__body">' +
            (p.vendor ? '<p class="volt-card__brand">' + escapeHtml(p.vendor) + '</p>' : '') +
            '<a class="volt-card__name" href="' + escapeHtml(p.url) + '">' + escapeHtml(p.title) + '</a>' +
            '<div class="volt-card__footer">' +
            '<div class="volt-card__prices">' +
            '<span class="volt-card__price">' + money(p.price) + '</span>' +
            (hasCompare ? '<span class="volt-card__compare">' + money(p.compare_price) + '</span>' : '') +
            '</div>' +
            '</div>' +
            '</div>' +
            '</article>';
        });
        html += '</div>';
        this.innerHTML = html;
      }
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
