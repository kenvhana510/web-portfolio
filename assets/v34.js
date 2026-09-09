/* LEGACRAFT V3.4 — 3分で概算
   ==========================================================================
   出力は固定価格 3 本のどれか。幅は出さない。合計の自動加算もしない。
   業種は「向いている」と「ページ構成」の文言を決めるだけで、金額は動かさない
   （業種で金額が動くように見せるのは、根拠のない精度を演出することになる）。
   金額を決めるのは「目的の下限」と「グレード」の大きい方。

   JS が無い場合は何もしない = 3 プランがそのまま全部表示される。
   ========================================================================== */
(function () {
  'use strict';
  var form = document.getElementById('est-form');
  var out = document.getElementById('est-out');
  if (!form || !out) return;
  var sec = form.closest('.est');
  if (!sec) return;
  sec.classList.add('est--js');

  var IND = {
    kenchiku: ['建築・工務店', 'TOP・施工事例・設計の考え方・会社概要・お問い合わせ'],
    biyou:    ['美容',        'TOP・メニューと料金・症例／実績・スタッフ紹介・アクセス'],
    inshoku:  ['飲食',        'TOP・メニュー・こだわり・店舗情報・お問い合わせ'],
    shigyo:   ['士業',        'TOP・取扱業務・料金・事務所案内・相談の流れ'],
    saiyo:    ['採用',        'TOP・仕事内容・職場環境・社員の声・募集要項・応募'],
    butsuryu: ['物流',        'TOP・事業内容・拠点と設備・安全への取り組み・お問い合わせ'],
    kaigo:    ['介護',        'TOP・サービス紹介・事業所案内・ご利用の流れ・お問い合わせ'],
    seiso:    ['クリーニング', 'TOP・料金表・対応エリア・作業の流れ・お問い合わせ'],
    other:    ['その他',      'TOP・事業内容・会社概要・実績／お知らせ・お問い合わせ']
  };
  /* [表示名, 必要な最低ティア] — 1ページで足りない目的には下限を置く */
  var PUR = {
    toiawase: ['問い合わせを増やす', 1],
    yoyaku:   ['予約を増やす', 1],
    oubo:     ['採用応募を増やす', 1],
    kaisha:   ['会社案内', 2],
    service:  ['サービス紹介', 1],
    seo:      ['ブログでSEO', 3],
    shinrai:  ['信頼性を上げる', 2]
  };
  var GRADE = { simple: ['シンプル', 1], standard: ['スタンダード', 2], deep: ['しっかり運用', 3] };
  var TIER = { 1: 'lp', 2: 'wp', 3: 'blog' };
  var LP_PAGES = '1ページに 見出し／お悩み／サービス内容／料金／実績／よくある質問／申し込み を縦に並べます';

  function val(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function update(userAction) {
    var i = val('industry'), pu = val('purpose'), g = val('grade');
    var hint = sec.querySelector('.est__hint');
    if (!i || !pu || !g) { if (hint) hint.classList.add('is-on'); return; }
    if (hint) hint.classList.remove('is-on');

    var tier = Math.max(GRADE[g][1], PUR[pu][1]);
    var key = TIER[tier];
    var cards = out.querySelectorAll('.est__card');
    for (var k = 0; k < cards.length; k++) {
      var card = cards[k];
      var on = card.getAttribute('data-plan') === key;
      card.classList.toggle('is-on', on);
      if (!on) continue;
      var fit = card.querySelector('.est__fit');
      var pages = card.querySelector('.est__pages');
      if (fit) fit.textContent = IND[i][0] + ' ／ ' + PUR[pu][0] + ' ／ ' + GRADE[g][0];
      if (pages) pages.textContent = (key === 'lp') ? LP_PAGES
        : (key === 'blog') ? (IND[i][1] + '＋ブログ') : IND[i][1];
    }
    if (userAction && window.matchMedia && window.matchMedia('(max-width: 999px)').matches) {
      var onCard = out.querySelector('.est__card.is-on');
      if (onCard && onCard.scrollIntoView) {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        onCard.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      }
    }
  }

  form.addEventListener('change', function () { update(true); });
  update(false);
})();

/* 狭い画面だけ明細を畳む。HTML 側は open のままなので JS 無しでは何も隠れない。 */
(function () {
  'use strict';
  var mq = window.matchMedia ? window.matchMedia('(max-width: 759px)') : null;
  if (!mq) return;
  var items = document.querySelectorAll('.plan__all, .est__all');
  function apply() {
    for (var i = 0; i < items.length; i++) {
      if (mq.matches) items[i].removeAttribute('open');
      else items[i].setAttribute('open', '');
    }
  }
  apply();
  if (mq.addEventListener) mq.addEventListener('change', apply);
})();
