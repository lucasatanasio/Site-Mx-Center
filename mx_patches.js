/**
 * MX Center — Patch Script
 * Coloque antes do </body> no seu HTML.
 *
 * Funcionalidades:
 *  1. Produto abre na mesma aba; botão voltar do navegador funciona
 *  2. Paginação — 30 produtos por página
 *  3. Logo sempre volta para o topo da loja
 *  4. Aviso de responsabilidade na página do produto
 *  5. Botão compartilhar abaixo do "Adicionar ao Carrinho"
 */

// ─── CSS ───────────────────────────────────────────────────────────────────
(function injectCSS() {
  var s = document.createElement('style');
  s.textContent = `
/* Botão compartilhar */
.btn-share {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--surface2);
  border: 1px solid var(--brd);
  color: var(--muted);
  padding: 11px 14px;
  border-radius: 8px;
  font-family: var(--fb);
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  margin-top: 10px;
}
.btn-share:hover { border-color: var(--red); color: var(--red); background: var(--surface); }

/* Aviso de compatibilidade */
.disclaimer-box {
  background: linear-gradient(135deg, rgba(204,31,31,.06), rgba(204,31,31,.02));
  border: 1px solid rgba(204,31,31,.2);
  border-left: 4px solid var(--red);
  border-radius: 8px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
  display: flex; gap: 10px; align-items: flex-start;
}
.disclaimer-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.disclaimer-text { font-size: 12.5px; color: var(--muted); line-height: 1.65; }
.disclaimer-text strong { color: var(--text); font-weight: 700; }

/* Sem estoque */
.out-of-stock-badge {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center; z-index: 3;
}
.out-of-stock-badge span {
  background: #1a1a1a; border: 2px solid #f59e0b; color: #f59e0b;
  font-family: var(--fd); font-size: 13px; font-weight: 700;
  padding: 5px 14px; border-radius: 5px;
  text-transform: uppercase; letter-spacing: .5px;
}
.btn-add:disabled, .detail-add-btn:disabled {
  background: #555 !important; cursor: not-allowed; opacity: .65;
}

/* Paginação */
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; flex-wrap: wrap;
  margin-top: 2rem; padding-bottom: 1rem;
}
.pgn-btn {
  background: var(--surface);
  border: 1px solid var(--brd);
  color: var(--text);
  width: 38px; height: 38px;
  border-radius: 6px;
  font-family: var(--fb); font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all .18s;
  display: flex; align-items: center; justify-content: center;
}
.pgn-btn:hover { border-color: var(--red); color: var(--red); }
.pgn-btn.active {
  background: var(--red); border-color: var(--red);
  color: #fff; pointer-events: none;
}
.pgn-btn:disabled { opacity: .35; pointer-events: none; }
.pgn-info {
  font-size: 12px; color: var(--muted);
  padding: 0 6px; align-self: center;
}
  `;
  document.head.appendChild(s);
})();

// ─── Estado de paginação ───────────────────────────────────────────────────
var _pgnList    = [];   // lista filtrada atual
var _pgnPage    = 1;
var _pgnPerPage = 30;

// ─── 1. renderProducts — com paginação ────────────────────────────────────
window.renderProducts = function(list) {
  // Filtra exclusivos de oficina para quem não está logado
  _pgnList = (list||[]).filter(function(p) {
    return !(p.visibility === 'mech' && !window.mechUser);
  });
  _pgnPage = 1;
  _renderPage();
};

function _renderPage() {
  var grid = document.getElementById('prodGrid');
  var cnt  = document.getElementById('resCount');
  var list = _pgnList;
  var total = list.length;

  cnt.textContent = total
    ? total + ' produto' + (total > 1 ? 's' : '') + ' encontrado' + (total > 1 ? 's' : '')
    : '';

  // Limpa paginação anterior que possa estar fora do grid
  var oldPgn = document.getElementById('_mxPagination');
  if (oldPgn) oldPgn.remove();

  grid.innerHTML = '';

  if (!total) {
    grid.innerHTML = '<div class="empty"><div class="ei">🔍</div><h3>Nenhuma peça encontrada</h3><p>Tente ajustar os filtros</p></div>';
    return;
  }

  var totalPages = Math.ceil(total / _pgnPerPage);
  var start = (_pgnPage - 1) * _pgnPerPage;
  var end   = Math.min(start + _pgnPerPage, total);
  var page  = list.slice(start, end);

  page.forEach(function(p) {
    grid.appendChild(_makeCard(p));
  });

  // Paginação só aparece se tiver mais de 1 página
  if (totalPages > 1) {
    var pgn = document.createElement('div');
    pgn.className = 'pagination';
    pgn.id = '_mxPagination';

    // Botão anterior
    var prev = document.createElement('button');
    prev.className = 'pgn-btn';
    prev.innerHTML = '‹';
    prev.disabled = _pgnPage === 1;
    prev.onclick = function() { _goPage(_pgnPage - 1); };
    pgn.appendChild(prev);

    // Números de página (mostra até 7, com reticências)
    var pages = _pageNumbers(totalPages, _pgnPage);
    pages.forEach(function(n) {
      if (n === '…') {
        var sp = document.createElement('span');
        sp.className = 'pgn-info';
        sp.textContent = '…';
        pgn.appendChild(sp);
      } else {
        var btn = document.createElement('button');
        btn.className = 'pgn-btn' + (n === _pgnPage ? ' active' : '');
        btn.textContent = n;
        (function(pg) { btn.onclick = function() { _goPage(pg); }; })(n);
        pgn.appendChild(btn);
      }
    });

    // Botão próximo
    var next = document.createElement('button');
    next.className = 'pgn-btn';
    next.innerHTML = '›';
    next.disabled = _pgnPage === totalPages;
    next.onclick = function() { _goPage(_pgnPage + 1); };
    pgn.appendChild(next);

    // Info de página
    var info = document.createElement('span');
    info.className = 'pgn-info';
    info.textContent = 'Página ' + _pgnPage + ' de ' + totalPages;
    pgn.appendChild(info);

    // Insere depois do grid
    grid.parentNode.insertBefore(pgn, grid.nextSibling);
  }
}

function _goPage(pg) {
  _pgnPage = pg;
  _renderPage();
  // Rola suavemente até o topo dos filtros
  var anchor = document.getElementById('shopAnchor');
  if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _pageNumbers(total, current) {
  if (total <= 7) {
    var arr = [];
    for (var i = 1; i <= total; i++) arr.push(i);
    return arr;
  }
  var pages = [1];
  if (current > 3) pages.push('…');
  for (var p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

function _makeCard(p) {
  var icon       = (window.CAT_ICONS && CAT_ICONS[p.cat]) || '⚙️';
  var mainPhoto  = (p.photos || [])[0] || '';
  var hasOpts    = p.options && p.options.length > 0;
  var hasCF      = p.customFields && p.customFields.length > 0;
  var hasWS      = p.wholesaleTiers && p.wholesaleTiers.length > 0;
  var outOfStock = !!p.outOfStock;

  // Usa helper do Index se disponível, senão fallback
  var priceHtml = window.getPriceHtml
    ? window.getPriceHtml(p, 'card')
    : (window.mechUser
        ? '<div class="card-price-orig">R$ ' + fmt(p.price) + '</div><div class="card-price-mech">🔧 R$ ' + fmt(p.priceMech || p.price) + '</div>'
        : '<div class="card-price">R$ ' + fmt(p.price) + '</div>');

  var osBadge = outOfStock ? '<div class="out-of-stock-badge"><span>Sem estoque</span></div>' : '';
  var addBtn  = outOfStock
    ? '<button class="btn-add" disabled>Sem estoque</button>'
    : '<button class="btn-add" onclick="handleAddCard(event,\'' + p.cod + '\')">+ Adicionar</button>';

  // Só "Opções" fica na foto; Dados e Atacado ficam como chips no card-body
  var imgBadge = (hasOpts && !outOfStock) ? '<span class="has-opts-badge">Opções ▾</span>' : '';
  var chips = '';
  if (hasCF || hasWS) {
    chips = '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">';
    if (hasCF) chips += '<span style="background:rgba(168,85,247,.15);color:#a855f7;border:1px solid rgba(168,85,247,.35);font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">📋 Preencher dados</span>';
    if (hasWS) chips += '<span style="background:rgba(14,116,144,.15);color:#0ea5e9;border:1px solid rgba(14,116,144,.35);font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">📦 Preço atacado</span>';
    chips += '</div>';
  }

  var mechOnlyBadge = (p.visibility === 'mech')
    ? '<span style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,.75);color:#4ade80;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;z-index:3;border:1px solid rgba(74,222,128,.4)">🔧 Exclusivo</span>'
    : '';

  var card = document.createElement('div');
  card.className = 'card';
  card.innerHTML =
    '<div class="card-img">' +
      (mainPhoto ? '<img src="' + mainPhoto + '" alt="' + p.name + '" loading="lazy">' : '<span class="em">' + icon + '</span>') +
      (p.cat ? '<span class="cbadge">' + p.cat + '</span>' : '') +
      imgBadge + osBadge + mechOnlyBadge +
    '</div>' +
    '<div class="card-body">' +
      '<div class="card-cod"># ' + p.cod + '</div>' +
      '<div class="card-name">' + p.name + '</div>' +
      chips + priceHtml +
      '<div class="card-footer">' + addBtn +
        '<button class="btn-detail" title="Ver detalhes" onclick="openDetail(\'' + p.cod + '\')">🔍</button>' +
      '</div>' +
    '</div>';

  card.querySelector('.card-img').addEventListener('click', function() { openDetail(p.cod); });
  card.querySelector('.card-name').addEventListener('click', function() { openDetail(p.cod); });
  return card;
}

// ─── 2. openDetail — mesma aba com pushState ───────────────────────────────
window.openDetail = function(cod, _pushState) {
  var p = (window.products || []).find(function(x) { return x.cod === cod; });
  if (!p) return;

  window._savedScrollY = window.scrollY;
  window.detailCod     = cod;
  window.detailOptSel  = {};
  showPage('pgDetail');
  window.scrollTo(0, 0);

  // Atualiza URL sem reload para que o botão Voltar do navegador funcione
  var q = '?produto=' + encodeURIComponent(cod);
  if (window.location.search !== q) {
    history.pushState({ produto: cod, scrollY: window._savedScrollY }, '', q);
  }

  // Galeria
  var photos  = p.photos || [];
  var icon    = (window.CAT_ICONS && CAT_ICONS[p.cat]) || '⚙️';
  var mainEl  = document.getElementById('galleryMain');
  var thumbEl = document.getElementById('galleryThumbs');

  if (photos.length > 0) {
    mainEl.innerHTML = '<img id="galleryMainImg" src="' + photos[0] + '" alt="' + p.name + '">';
    thumbEl.innerHTML = photos.length > 1
      ? photos.map(function(ph, i) {
          return '<div class="g-thumb' + (i === 0 ? ' active' : '') + '" onclick="setDetailPhoto(' + i + ')"><img src="' + ph + '" alt=""></div>';
        }).join('')
      : '';
  } else {
    mainEl.innerHTML = '<span style="font-size:80px">' + icon + '</span>';
    thumbEl.innerHTML = '';
  }

  // Preço — usa helpers do Index se disponíveis
  var priceHtml = window.getPriceHtml
    ? window.getPriceHtml(p, 'detail')
    : (window.mechUser
        ? '<div class="detail-price-orig">R$ ' + fmt(p.price) + '</div><div class="detail-price-mech">🔧 R$ ' + fmt(p.priceMech || p.price) + '</div>'
        : '<div class="detail-price">R$ ' + fmt(p.price) + '</div>');
  // Tabela de preços por atacado
  var wsHtml = window.getWholesaleHtml ? window.getWholesaleHtml(p) : '';

  // Opções
  var optsHtml = '';
  if (p.options && p.options.length) {
    optsHtml = '<div class="opts-section">';
    p.options.forEach(function(g) {
      if (!g.values || !g.values.length) return;
      optsHtml +=
        '<div class="opts-group">' +
          '<div class="opts-group-label">Escolha: <strong>' + g.name + '</strong></div>' +
          '<div class="opts-pills">' +
            g.values.map(function(v) {
              return '<button class="opt-pill" onclick="toggleDetailOpt(\'' +
                g.name.replace(/'/g, "\\'") + "','" + v.replace(/'/g, "\\'") + '\',this)">' + v + '</button>';
            }).join('') +
          '</div>' +
        '</div>';
    });
    optsHtml += '</div>';
  }

  // Botão compartilhar
  var outOfStock = !!p.outOfStock;
  var addBtnHtml = outOfStock
    ? '<button class="detail-add-btn" disabled>📦 Produto sem estoque</button>'
    : '<button class="detail-add-btn" onclick="addFromDetail(\'' + p.cod + '\')">🛒 Adicionar ao Carrinho</button>';

  var shareBtn =
    '<button class="btn-share" onclick="shareProduct()">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>' +
        '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' +
      '</svg>Compartilhar link deste produto' +
    '</button>';

  document.getElementById('detailInfo').innerHTML =
    (p.cat ? '<div class="detail-cat">' + p.cat + '</div>' : '') +
    '<div class="detail-cod"># ' + p.cod + '</div>' +
    '<div class="detail-name">' + p.name + '</div>' +
    priceHtml + wsHtml +
    (p.desc ? '<div class="detail-desc">' + p.desc + '</div>' : '') +
    optsHtml +
    addBtnHtml +
    shareBtn;

  // Disclaimer — injeta após o botão Voltar original
  var pgDetail = document.getElementById('pgDetail');
  var oldDisc  = pgDetail.querySelector('.disclaimer-box');
  if (oldDisc) oldDisc.remove();

  var disc = document.createElement('div');
  disc.className = 'disclaimer-box';
  disc.innerHTML =
    '<div class="disclaimer-icon">⚠️</div>' +
    '<div class="disclaimer-text">' +
      '<strong>Aviso importante:</strong> A MX Center não se responsabiliza pela compatibilidade das peças com sua moto. ' +
      'As informações de compatibilidade são apenas orientativas. ' +
      '<strong>O correto é sempre medir as peças antes da compra para garantir o encaixe perfeito.</strong> — ' +
      'Em caso de dúvida, consulte nossa equipe pelo WhatsApp antes de finalizar o pedido.' +
    '</div>';

  var origBack = pgDetail.querySelector('.detail-back');
  if (origBack && origBack.nextSibling) {
    pgDetail.insertBefore(disc, origBack.nextSibling);
  } else {
    pgDetail.insertBefore(disc, pgDetail.firstChild);
  }

  // Compatibilidade
  var wrap = document.getElementById('compatTableWrap');
  var cs   = p.compats || [];
  document.getElementById('compatToggleBtn').style.display = 'none';
  document.getElementById('compatCollapsible').classList.remove('open');

  if (!cs.length) {
    wrap.innerHTML = '<div class="no-compat">Este produto não possui lista de compatibilidade cadastrada.</div>';
    renderRelated(cod);
    return;
  }

  var rows = [];
  cs.forEach(function(c) {
    if (c.year && c.year.indexOf('-') > 0) {
      var pts = c.year.split('-'), yf = parseInt(pts[0]), yt = parseInt(pts[1]);
      for (var y = yf; y <= yt; y++) rows.push({ brand: c.brand, model: c.model, year: y });
    } else {
      rows.push({ brand: c.brand, model: c.model, year: c.year || '—' });
    }
  });
  rows.sort(function(a, b) {
    if ((a.brand||'') > (b.brand||'')) return 1; if ((a.brand||'') < (b.brand||'')) return -1;
    if ((a.model||'') > (b.model||'')) return 1; if ((a.model||'') < (b.model||'')) return -1;
    return (+b.year||0) - (+a.year||0);
  });
  wrap.innerHTML =
    '<table class="compat-table"><thead><tr><th>Marca</th><th>Modelo</th><th>Ano</th></tr></thead><tbody>' +
    rows.map(function(r) {
      return '<tr><td>' + (r.brand||'—') + '</td><td>' + (r.model||'—') + '</td><td class="compat-year">' + r.year + '</td></tr>';
    }).join('') + '</tbody></table>';

  var btn = document.getElementById('compatToggleBtn');
  btn.style.display = 'flex';
  btn.innerHTML = '🏍️ Ver Compatibilidade (' + rows.length + ' motos) <span id="compatToggleArrow">▾</span>';
  renderRelated(cod);
};

// ─── 3. goBack — volta para a loja restaurando posição de scroll ───────────
window.goBack = function() {
  history.back();
};

// ─── 4. shareProduct ──────────────────────────────────────────────────────
window.shareProduct = function() {
  var cod = window.detailCod;
  if (!cod) return;
  var url = window.location.origin + window.location.pathname + '?produto=' + encodeURIComponent(cod);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url)
      .then(function() { toast('🔗 Link copiado! Compartilhe com seu cliente.'); })
      .catch(function() { prompt('Copie o link abaixo:', url); });
  } else {
    prompt('Copie o link abaixo:', url);
  }
};

// ─── 5. Logo volta para o topo da loja ────────────────────────────────────
(function patchLogo() {
  // Espera o DOM estar pronto e adiciona o clique na logo
  function attachLogo() {
    var logo = document.querySelector('nav .logo');
    if (!logo) return;
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', function() {
      // Se estiver num produto, volta para a loja
      if (document.getElementById('pgDetail').classList.contains('on')) {
        // Remove o ?produto= da URL
        history.pushState({}, '', window.location.pathname);
        showPage('pgLoja');
      }
      // Sempre rola para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachLogo);
  } else {
    attachLogo();
  }
})();

// ─── 6. Roteamento: popstate (botão voltar do navegador) ───────────────────
(function setupRouting() {

  function getProdutoParam() {
    var m = window.location.search.match(/[?&]produto=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  // Botão voltar/avançar do navegador
  window.addEventListener('popstate', function(e) {
    var cod = getProdutoParam();
    if (cod) {
      // Volta para um produto (avançar)
      openDetail(cod, false);
    } else {
      // Volta para a loja
      showPage('pgLoja');
      var sy = (e.state && e.state.scrollY) ? e.state.scrollY : (window._savedScrollY || 0);
      setTimeout(function() { window.scrollTo(0, sy); }, 30);
    }
  });

  // Ao abrir a página com ?produto= na URL (link compartilhado)
  function tryOpen(cod, tries) {
    tries = tries || 0;
    if (tries > 50) return;
    if (window.products && window.products.length) {
      openDetail(cod, false);
    } else {
      setTimeout(function() { tryOpen(cod, tries + 1); }, 100);
    }
  }

  // Guarda o estado inicial sem ?produto para poder voltar
  var initCod = getProdutoParam();
  if (initCod) {
    // Substitui o estado atual para que o "voltar" leve à loja
    history.replaceState({ lojaRoot: true }, '', window.location.pathname);
    history.pushState({ produto: initCod }, '', window.location.search);
    tryOpen(initCod);
  } else {
    // Garante que o estado da loja esteja salvo
    history.replaceState({ lojaRoot: true }, '', window.location.href);
  }

})();

console.log('[MX Patches] Carregado com sucesso ✅');