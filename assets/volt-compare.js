/**
 * Volt Compare — product comparison bar (up to 3 items)
 * Manages [data-compare-btn][data-product-id] buttons and a floating compare bar.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'volt_compare';
  var MAX_ITEMS = 3;

  /* ── Storage helpers ── */
  function getItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function has(id) {
    return getItems().some(function (item) { return String(item.id) === String(id); });
  }

  function add(id, title) {
    var items = getItems();
    if (items.length >= MAX_ITEMS) return false;
    if (!has(id)) items.push({ id: String(id), title: title });
    saveItems(items);
    return true;
  }

  function remove(id) {
    saveItems(getItems().filter(function (item) { return String(item.id) !== String(id); }));
  }

  /* ── Compare bar ── */
  function getBar() {
    var bar = document.getElementById('volt-compare-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'volt-compare-bar';
      bar.setAttribute('role', 'complementary');
      bar.setAttribute('aria-label', 'Product comparison');
      bar.innerHTML =
        '<div class="volt-compare-bar__inner">' +
        '<div class="volt-compare-bar__items" id="volt-compare-bar-items"></div>' +
        '<div class="volt-compare-bar__actions">' +
        '<a href="/pages/compare" id="volt-compare-btn" class="volt-btn volt-btn--primary volt-btn--sm">Compare</a>' +
        '<button type="button" id="volt-compare-clear" class="volt-compare-bar__clear" aria-label="Clear all">Clear all</button>' +
        '</div>' +
        '</div>';
      document.body.appendChild(bar);

      document.getElementById('volt-compare-clear').addEventListener('click', function () {
        saveItems([]);
        syncAll();
      });
    }
    return bar;
  }

  function updateBar() {
    var items = getItems();
    var bar = getBar();

    if (items.length === 0) {
      bar.classList.remove('is-visible');
      return;
    }

    var container = document.getElementById('volt-compare-bar-items');
    container.innerHTML = items.map(function (item) {
      return (
        '<div class="volt-compare-bar__item">' +
        '<span class="volt-compare-bar__item-title">' + escapeHtml(item.title) + '</span>' +
        '<button type="button" class="volt-compare-bar__item-remove" data-remove-id="' + item.id + '" aria-label="Remove ' + escapeHtml(item.title) + ' from comparison">' +
        '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M1 1l8 8M9 1L1 9"/></svg>' +
        '</button>' +
        '</div>'
      );
    }).join('');

    // Fill empty slots up to MAX_ITEMS
    var empty = MAX_ITEMS - items.length;
    for (var i = 0; i < empty; i++) {
      container.insertAdjacentHTML('beforeend', '<div class="volt-compare-bar__item volt-compare-bar__item--empty"><span>Add a product</span></div>');
    }

    // Update compare link with IDs
    var compareLink = document.getElementById('volt-compare-btn');
    if (compareLink) {
      var ids = items.map(function (i) { return i.id; });
      compareLink.href = '/pages/compare?ids=' + ids.join(',');
      compareLink.classList.toggle('volt-btn--disabled', items.length < 2);
      compareLink.setAttribute('aria-disabled', items.length < 2 ? 'true' : 'false');
    }

    bar.classList.add('is-visible');
  }

  /* ── Button state ── */
  function updateBtn(btn, isActive) {
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }

  function syncAll() {
    document.querySelectorAll('[data-compare-btn]').forEach(function (btn) {
      var id = btn.dataset.productId;
      if (id) updateBtn(btn, has(id));
    });
    updateBar();
  }

  /* ── Toast ── */
  function toast(msg) {
    var existing = document.getElementById('volt-compare-toast');
    if (existing) existing.remove();

    var el = document.createElement('div');
    el.id = 'volt-compare-toast';
    el.setAttribute('role', 'status');
    el.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(30,30,30,0.95)',
      'color:rgba(255,255,255,0.75)',
      'font-family:var(--volt-font-mono,monospace)',
      'font-size:11px',
      'letter-spacing:1px',
      'padding:10px 20px',
      'z-index:99999',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 0.25s ease',
      'white-space:nowrap',
      'border:1px solid rgba(255,255,255,0.08)',
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.opacity = '1'; }); });
    setTimeout(function () { el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 300); }, 2000);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Click handlers ── */
  document.addEventListener('click', function (e) {
    // Compare button toggle
    var btn = e.target.closest('[data-compare-btn]');
    if (btn) {
      var id = btn.dataset.productId;
      var title = btn.dataset.productTitle || 'Product';
      if (!id) return;

      if (has(id)) {
        remove(id);
        updateBtn(btn, false);
      } else {
        if (getItems().length >= MAX_ITEMS) {
          toast('You can compare up to ' + MAX_ITEMS + ' products');
          return;
        }
        var added = add(id, title);
        if (added) updateBtn(btn, true);
      }

      // Sync other buttons for same product
      document.querySelectorAll('[data-compare-btn][data-product-id="' + id + '"]').forEach(function (b) {
        if (b !== btn) updateBtn(b, has(id));
      });

      updateBar();
      return;
    }

    // Remove from bar
    var removeBtn = e.target.closest('[data-remove-id]');
    if (removeBtn) {
      var removeId = removeBtn.dataset.removeId;
      remove(removeId);
      document.querySelectorAll('[data-compare-btn][data-product-id="' + removeId + '"]').forEach(function (b) {
        updateBtn(b, false);
      });
      updateBar();
    }
  });

  /* ── Inject bar CSS ── */
  (function injectStyles() {
    if (document.getElementById('volt-compare-styles')) return;
    var style = document.createElement('style');
    style.id = 'volt-compare-styles';
    style.textContent = [
      '#volt-compare-bar{',
        'position:fixed;bottom:0;left:0;right:0;',
        'background:#0a0a0a;',
        'border-top:1px solid rgba(255,255,255,0.08);',
        'z-index:9000;',
        'transform:translateY(100%);',
        'transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);',
        'padding:12px 0;',
      '}',
      '#volt-compare-bar.is-visible{transform:translateY(0);}',
      '.volt-compare-bar__inner{',
        'max-width:1280px;margin:0 auto;padding:0 48px;',
        'display:flex;align-items:center;gap:16px;flex-wrap:wrap;',
      '}',
      '.volt-compare-bar__items{display:flex;gap:8px;flex:1;flex-wrap:wrap;}',
      '.volt-compare-bar__item{',
        'display:flex;align-items:center;gap:6px;',
        'background:rgba(255,255,255,0.05);',
        'border:1px solid rgba(255,255,255,0.1);',
        'padding:6px 10px;',
        'max-width:180px;',
      '}',
      '.volt-compare-bar__item--empty{',
        'border:1px dashed rgba(255,255,255,0.12);',
        'background:transparent;',
      '}',
      '.volt-compare-bar__item--empty span{',
        'font-family:var(--volt-font-mono,monospace);font-size:9px;',
        'letter-spacing:1px;text-transform:uppercase;',
        'color:rgba(255,255,255,0.2);',
      '}',
      '.volt-compare-bar__item-title{',
        'font-family:var(--volt-font-body,sans-serif);font-size:12px;',
        'color:rgba(255,255,255,0.7);',
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;',
      '}',
      '.volt-compare-bar__item-remove{',
        'background:transparent;border:none;',
        'color:rgba(255,255,255,0.25);cursor:pointer;',
        'padding:2px;display:flex;align-items:center;flex-shrink:0;',
        'transition:color 0.15s;',
      '}',
      '.volt-compare-bar__item-remove:hover{color:#ff5050;}',
      '.volt-compare-bar__actions{display:flex;align-items:center;gap:12px;}',
      '.volt-compare-bar__clear{',
        'background:transparent;border:none;',
        'font-family:var(--volt-font-mono,monospace);font-size:9px;',
        'letter-spacing:1.5px;text-transform:uppercase;',
        'color:rgba(255,255,255,0.2);cursor:pointer;padding:4px;',
        'transition:color 0.15s;',
      '}',
      '.volt-compare-bar__clear:hover{color:rgba(255,255,255,0.6);}',
      '.volt-btn--disabled{opacity:0.4;pointer-events:none;}',
      '@media(max-width:768px){',
        '.volt-compare-bar__inner{padding:0 16px;}',
        '.volt-compare-bar__item{max-width:120px;}',
      '}',
    ].join('');
    document.head.appendChild(style);
  })();

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    syncAll();
  });

  document.addEventListener('volt:section:loaded', syncAll);
})();
