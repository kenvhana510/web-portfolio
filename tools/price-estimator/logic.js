/**
 * price-estimator / logic.js
 *
 * Web制作費概算シミュレーター — ルールベース算出ロジック（外部通信なし）
 *
 * 価格の正本（source of truth）は js/site-config.js の SITE_CONFIG.pricing。
 * このファイルは金額を一切持たず、常にそこから読む「表示レイヤー」である。
 *
 * 以前は site/06-price.md の商品A/B/C（8〜18万 / 25〜50万 / 50〜100万）を転記していたが、
 * あれは「仮」価格であって営業価格ではなかった。結果として、service.html が 3〜6万と
 * 表示している同じLPを、このツールが 8〜18万と提示していた（2026-08-24 発見。同一商品の
 * 基本価格が最大4倍ずれていた）。同じことを繰り返さないために、ここには数値を書かない。
 *
 * オプション加算額（OPTION_ADDONS）だけは正本側に定義がないため、本ツールの
 * 暫定値（仮実装・要確認）として残す。
 *
 * Privacy: 概算診断（診断結果シミュレーション）の計算は一切サーバー・外部サービスへ
 * 送信せず、ブラウザ内（クライアントサイド）で完結する。fetch/XHR等の通信コードが
 * 存在するのは、ユーザーが明示的に送信操作を行うリード獲得フォーム（#lead-form）のみ。
 *
 * Lead Pipeline接続（Wave04 LANE D / TASK-20260818-034、本番同期候補は W05-P1c /
 * TASK-20260819-034）: リード獲得フォームの送信処理は handleLeadFormSubmit() に集約している。
 * 実際のLead Pipelineへの送信は submitLeadToPipeline() が担い、lead-system側に新設した
 * HTTP API（POST /api/lead。../../lead-system/server.mjs）へfetchする。API側でValidation・
 * 重複統合・Scoring・保存（Human Review対象化）まで一括実行される（lead-system/lib/connector.mjs）。
 * デフォルトの接続先はローカル開発用（http://localhost:4310/api/lead）。本番URLへの
 * 切り替えはwindow.LEAD_API_BASE_URLで上書き可能にしてあるが、実ユーザーLead受付を
 * 有効化する（=本番URLで一般公開する）にはHuman Gate（人による承認）を経ること。
 *
 * 本番安全弁（window.LEAD_SUBMIT_ENABLED）: LEAD_API_BASE_URLを設定しただけでは実送信は
 * 有効化されない。window.LEAD_SUBMIT_ENABLED === true を明示的に設定しない限り、
 * リード獲得フォーム送信時はこれまで通り「送信は準備中」の安全な表示のみ行い、
 * submitLeadToPipeline()（実fetch）は一切呼び出さない。lead-system本番API（Render等）の
 * デプロイ完了とHuman Gate承認がそろって初めて、この2つのフラグ（BASE_URLとENABLED）を
 * 同時に本番値へ切り替えることを想定した二段階ゲート。
 *
 * Abuse: リードフォームにはハニーポット欄（送信時にbot疑いフラグとしてサーバーへ送る）
 * に加え、API側（lead-system/server.mjs）にも同一IPからの短時間大量リクエストを防ぐ
 * 簡易レート制限を実装している（多層防御）。
 *
 * 出典：js/site-config.js の SITE_CONFIG.pricing（service.html の料金表示と同一の正本）
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // 1. プランマスタ。金額は持たない——key は SITE_CONFIG.pricing のキーと一致させる。
  //    名前・価格帯は resolvePlanPricing() が正本から解決して差し込む。
  // ---------------------------------------------------------------------
  var PLANS = {
    lp: {
      key: "lp",
      pageDesc: "1ページ完結のランディングページ（目安8〜12セクション）",
      includes: [
        "構成案作成",
        "デザイン",
        "コーディング",
        "レスポンシブ対応",
        "フォーム設置",
        "基本SEO設定",
        "QA（品質確認）",
        "公開作業",
      ],
      excludes: [
        "広告運用",
        "SEOライティング代行",
        "商品撮影",
        "コピーライティングの一から企画",
      ],
    },
    small: {
      key: "small",
      pageDesc: "3〜5ページ（TOP・会社概要・事業内容・お問い合わせ 等）",
      includes: [
        "構成設計",
        "デザイン",
        "WordPress実装",
        "レスポンシブ対応",
        "フォーム設置",
        "基本SEO設定",
        "簡易マニュアル",
        "QA（品質確認）",
        "公開作業",
      ],
      excludes: [
        "ロゴ制作",
        "商品撮影",
        "記事ライティング大量代行",
        "既存システム連携開発",
      ],
    },
    wordpress: {
      key: "wordpress",
      pageDesc: "WordPress（SWELL）による5〜8ページのコーポレートサイト",
      includes: [
        "ヒアリング深掘り",
        "デザインコンセプト設計",
        "WordPress実装",
        "レスポンシブ対応",
        "フォーム設置",
        "基本SEO設定",
        "QA（品質確認）",
        "公開作業",
        "簡易マニュアル",
      ],
      excludes: [
        "ロゴゼロベース制作",
        "大規模システム開発",
        "広告運用",
      ],
    },
  };

  // ---------------------------------------------------------------------
  // 2. オプション加算目安（仮実装・要確認）
  //    06-price.md にオプション個別の金額定義がないため、本ツール独自の
  //    暫定レンジ。正式な金額はヒアリング後に個別見積り。
  // ---------------------------------------------------------------------
  var OPTION_ADDONS = {
    seoBoost: {
      label: "SEO強化（キーワード設計・構造化データ強化等）",
      min: 30000,
      max: 80000,
    },
    contentSupport: {
      label: "文章作成のサポート（コンテンツ制作支援）",
      min: 50000,
      max: 150000,
    },
    photography: {
      label: "プロ撮影・画像素材手配のご相談",
      min: 30000,
      max: 100000,
    },
    multilingual: {
      label: "多言語対応",
      min: 30000,
      max: 80000,
    },
    blogEnhance: {
      label: "ブログ機能強化",
      min: 20000,
      max: 50000,
    },
    recruitPage: {
      label: "採用ページ拡張",
      min: 30000,
      max: 60000,
    },
    meo: {
      label: "MEO基本設定",
      min: 20000,
      max: 40000,
    },
  };

  // 結果の根拠説明用ラベル
  var PAGE_COUNT_LABELS = {
    "1": "1ページ完結（LP）",
    "5-8": "5〜8ページ",
    "8plus": "8〜12ページ以上",
  };
  var DESIGN_LEVEL_LABELS = {
    simple: "シンプル・低コスト重視",
    balanced: "バランス重視",
    branding: "ブランディング重視",
  };

  // Lead Pipeline接続先（ローカル開発用デフォルト）。本番URLへの切り替えは
  // ページ側でwindow.LEAD_API_BASE_URLを設定することで上書きできる（Human Gate対象）。
  var LEAD_API_BASE_URL =
    (typeof window !== "undefined" && window.LEAD_API_BASE_URL) || "http://localhost:4310";

  // 実送信の安全弁（デフォルトfalse＝準備中表示のまま）。詳細はファイル冒頭コメント参照。
  var LEAD_SUBMIT_ENABLED =
    typeof window !== "undefined" && window.LEAD_SUBMIT_ENABLED === true;

  // Lead送信fetchのタイムアウト（ms）。接続先がスリープからの復帰（コールドスタート）に
  // 20秒以上かかる実測があるため、余裕を持たせて40秒とする。短くしすぎると正常な送信を
  // 取りこぼすため、これ以上短くしないこと。
  var LEAD_SUBMIT_TIMEOUT_MS = 40000;

  // 送信ボタンのラベル（送信中表示から復帰する際のフォールバック）。
  var LEAD_SUBMIT_BTN_LABEL = "この内容で送信する";
  var LEAD_SUBMIT_BTN_PENDING_LABEL = "送信中…";

  // 直近の概算診断結果（リード獲得フォーム送信時にplan情報を引き継ぐために保持）。
  // ユーザー入力値そのものではなく計算結果のみを保持し、フォーム送信前提の一時状態。
  var lastEstimate = null;

  // ---------------------------------------------------------------------
  // 3. イベント計測ラッパー
  //    実送信の実装詳細（GA4 gtag / GTM dataLayer / console.debugフォールバック）は
  //    analytics.js（analytics.track）に集約している。イベント名・パラメータの定義は
  //    GA4_EVENT_TAXONOMY.md を正本とする（TASK-20260819-028）。
  //    analytics.js未読込の環境でも動作を止めないよう、フォールバックを用意する。
  // ---------------------------------------------------------------------
  function trackEvent(eventName, params) {
    if (typeof window !== "undefined" && window.analytics && typeof window.analytics.track === "function") {
      window.analytics.track(eventName, params || {});
    } else {
      // eslint-disable-next-line no-console
      console.debug("[analytics stub]", eventName, params || {});
    }
  }

  // 見積りツールへの流入元を判定する（estimator_viewのentry_source用）。
  // GA4のpage_referrerでも近いことは分かるが、ファネル上で「サイト内のどのページから
  // 来たか」を1つのパラメータで比較したいため、ページ名に正規化して持たせる。
  // 計測のために例外を投げてはならないので、取得に失敗した場合は "direct" に倒す。
  function resolveEntrySource() {
    try {
      var ref = document.referrer;
      if (!ref) return "direct";
      var url = new URL(ref);
      if (url.host !== window.location.host) return "external";
      var matched = url.pathname.match(/([^/]+)\.html$/);
      return matched ? matched[1] : "internal";
    } catch (e) {
      return "direct";
    }
  }

  // ---------------------------------------------------------------------
  // 4. プラン判定ロジック
  //    ページ数とCMS要否で、service.html が売っている3商品のどれに当たるかを決める。
  //    「5〜8ページ」だけは静的サイトでも足りるため、WordPress希望かどうかで
  //    small と wordpress に分かれる（cms 設問がこのために存在する）。
  //
  //    仕上がり方向性「ブランディング重視」は従来どおり1段階引き上げる
  //    （FREE_TOOL_MVP_SPEC.md 1章）。ただし wordpress が最上位なので、そこで頭打ち。
  // ---------------------------------------------------------------------
  var PLAN_ORDER = ["lp", "small", "wordpress"];

  function resolvePlanKey(pageCount, designLevel, cms) {
    var key;
    if (pageCount === "1") {
      key = "lp";
    } else if (pageCount === "5-8") {
      // cms="self" = 自分で更新したい（WordPress希望）
      key = cms === "self" ? "wordpress" : "small";
    } else {
      key = "wordpress"; // "8plus"（上限側。実際は個別見積りになる）
    }

    if (designLevel === "branding") {
      var i = PLAN_ORDER.indexOf(key);
      if (i > -1 && i < PLAN_ORDER.length - 1) key = PLAN_ORDER[i + 1];
    }

    return key;
  }

  // 価格の解決はここ1箇所だけ。SITE_CONFIG が読めない場合は「金額を出さない」を
  // 選ぶ——古い値や 0 を表示するくらいなら、個別見積りへ誘導したほうが害がない。
  function resolvePlanPricing(key) {
    var pricing =
      (typeof window !== "undefined" &&
        window.SITE_CONFIG &&
        window.SITE_CONFIG.pricing) ||
      null;
    var entry = pricing && pricing[key];
    if (!entry || typeof entry.min !== "number" || typeof entry.max !== "number") {
      return null;
    }
    return { name: entry.label, min: entry.min, max: entry.max };
  }

  function formatYen(n) {
    return Math.round(n / 10000) + "万円";
  }

  // 価格が解決できない場合と、8ページ以上で上限を超える場合の表示を1箇所に集約する。
  function formatRange(result) {
    if (result.totalMin === null || result.totalMax === null) {
      return "個別お見積り";
    }
    return formatYen(result.totalMin) + "〜" + formatYen(result.totalMax);
  }

  function collectFormData(form) {
    var fd = new FormData(form);
    var addons = fd.getAll("addon");
    return {
      bizType: fd.get("bizType"),
      purpose: fd.get("purpose"),
      pageCount: fd.get("pageCount"),
      cms: fd.get("cms"),
      designLevel: fd.get("designLevel"),
      contactForm: fd.get("contactForm"),
      seo: fd.get("seo"),
      addons: addons,
      email: (fd.get("email") || "").trim(),
    };
  }

  function computeResult(data) {
    var planKey = resolvePlanKey(data.pageCount, data.designLevel, data.cms);
    var base = PLANS[planKey];
    var pricing = resolvePlanPricing(planKey);

    // PLANS 側の静的な説明と、正本から来た名前・価格帯を1つのオブジェクトに合成する。
    // 以降の描画は今までどおり plan.name / plan.min / plan.max を読めばよい。
    var plan = {
      key: base.key,
      name: pricing ? pricing.name : base.pageDesc,
      pageDesc: base.pageDesc,
      includes: base.includes,
      excludes: base.excludes,
      min: pricing ? pricing.min : null,
      max: pricing ? pricing.max : null,
    };

    // seo=boost もオプション加算に含める
    var addonKeys = data.addons.slice();
    if (data.seo === "boost" && addonKeys.indexOf("seoBoost") === -1) {
      addonKeys.push("seoBoost");
    }

    var addonDetails = addonKeys
      .map(function (k) {
        return OPTION_ADDONS[k];
      })
      .filter(Boolean);

    var addonMin = addonDetails.reduce(function (sum, a) {
      return sum + a.min;
    }, 0);
    var addonMax = addonDetails.reduce(function (sum, a) {
      return sum + a.max;
    }, 0);

    return {
      plan: plan,
      addonDetails: addonDetails,
      totalMin: plan.min === null ? null : plan.min + addonMin,
      totalMax: plan.max === null ? null : plan.max + addonMax,
      // 8ページ以上は正本に対応する商品がなく、wordpress の上限を超える。
      // 金額は出すが「そのまま受注できる額ではない」ことを画面で明示する。
      needsQuote: data.pageCount === "8plus",
    };
  }

  function buildReasoningText(data, result) {
    var pageLabel = PAGE_COUNT_LABELS[data.pageCount] || data.pageCount;
    var designLabel = DESIGN_LEVEL_LABELS[data.designLevel] || data.designLevel;
    // プラン名は正本（SITE_CONFIG.pricing）から来るので、ここでも一覧を
    // ハードコードせずに組み立てる。料金ページと必ず同じ名前・同じ並びになる。
    var planNames = PLAN_ORDER.map(function (key) {
      var p = resolvePlanPricing(key);
      return p ? p.name : null;
    }).filter(Boolean);

    var text =
      "希望ページ数「" + pageLabel + "」と、希望の仕上がり方向性「" + designLabel + "」から、" +
      (planNames.length
        ? "LEGACRAFTの3プラン（" + planNames.join("／") + "）のうち「" + result.plan.name + "」"
        : "「" + result.plan.name + "」") +
      "が最も近いと判定し、そのプランの価格帯を表示しています。";
    if (data.designLevel === "branding") {
      text +=
        "「ブランディング重視」を選択されたため、ページ数のみで判定する場合より1段階上のプランを目安として表示しています。";
    }
    if (result.needsQuote) {
      text +=
        "8ページ以上は標準プランの範囲を超えるため、表示額は下限の目安です。実際の金額はページ数と要件をうかがったうえで個別にお見積りします。";
    }
    if (result.addonDetails.length > 0) {
      text += "選択いただいたオプションの参考加算額を、プランの価格帯に上乗せして表示しています。";
    }
    return text;
  }

  // ---------------------------------------------------------------------
  // 5. バリデーション
  // ---------------------------------------------------------------------
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function isValidEmailOrEmpty(value) {
    if (!value) return true;
    return EMAIL_RE.test(value);
  }

  function isValidEmailRequired(value) {
    return !!value && EMAIL_RE.test(value);
  }

  function showError(errorEl, inputEl, message) {
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
    if (inputEl) {
      inputEl.setAttribute("aria-invalid", "true");
      inputEl.focus();
    }
  }

  function clearError(errorEl, inputEl) {
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.hidden = true;
    }
    if (inputEl) {
      inputEl.removeAttribute("aria-invalid");
    }
  }

  function isHoneypotFilled(form) {
    var hp = form.querySelector('input[name="website"]');
    return !!(hp && hp.value.trim() !== "");
  }

  // ---------------------------------------------------------------------
  // 6. 画面描画
  // ---------------------------------------------------------------------
  function renderResult(result, data) {
    document.getElementById("result-plan-name").textContent =
      result.plan.name + "（" + result.plan.pageDesc + "）相当";
    document.getElementById("result-range").textContent = formatRange(result);
    document.getElementById("result-reasoning").textContent = buildReasoningText(data, result);

    var includesEl = document.getElementById("result-includes");
    includesEl.innerHTML = "";
    result.plan.includes.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      includesEl.appendChild(li);
    });

    var excludesEl = document.getElementById("result-excludes");
    excludesEl.innerHTML = "";
    result.plan.excludes.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      excludesEl.appendChild(li);
    });

    var addonBlock = document.getElementById("addon-block");
    var addonsEl = document.getElementById("result-addons");
    addonsEl.innerHTML = "";
    if (result.addonDetails.length > 0) {
      addonBlock.hidden = false;
      result.addonDetails.forEach(function (a) {
        var li = document.createElement("li");
        li.textContent =
          a.label + "：+" + formatYen(a.min) + "〜" + formatYen(a.max) + "（目安）";
        addonsEl.appendChild(li);
      });
    } else {
      addonBlock.hidden = true;
    }

    // ---- CTA: リード獲得フォーム（実送信なし。UI/導線のみ） ----
    var leadPanel = document.getElementById("lead-form-panel");
    var leadMessage = document.getElementById("lead-message");
    var summaryText =
      "【概算診断結果】" + result.plan.name + " / " + formatRange(result) +
      "（ページ数：" + (PAGE_COUNT_LABELS[data.pageCount] || data.pageCount) +
      "、仕上がり方向性：" + (DESIGN_LEVEL_LABELS[data.designLevel] || data.designLevel) + "）\n\n";

    var ctaContact = document.getElementById("cta-contact");
    ctaContact.onclick = function () {
      var willOpen = leadPanel.hidden;
      leadPanel.hidden = !willOpen;
      ctaContact.setAttribute("aria-expanded", String(willOpen));
      trackEvent("cta_click", { cta_type: "consult", plan: result.plan.key });
      if (willOpen) {
        if (!leadMessage.value) {
          leadMessage.value = summaryText;
        }
        trackEvent("lead_form_open", { plan: result.plan.key });
        leadPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    var ctaLine = document.getElementById("cta-line");
    ctaLine.href = "#line-placeholder";
    ctaLine.onclick = function (e) {
      e.preventDefault();
      trackEvent("cta_click", { cta_type: "line", plan: result.plan.key });
      alert("LINE公式アカウントの友だち追加導線は現在準備中です。有効化まで今しばらくお待ちください。");
    };

    var ctaEmail = document.getElementById("cta-email");
    ctaEmail.onclick = function () {
      var emailInput = document.getElementById("email");
      var currentEmail = (emailInput.value || "").trim();
      trackEvent("cta_click", {
        cta_type: "email",
        plan: result.plan.key,
        has_email: !!currentEmail,
      });
      if (!currentEmail) {
        alert(
          "メールアドレスが未入力です。ページ上部の「結果を受け取るメールアドレス」欄に入力してから再度お試しください。\n（この機能は現在準備中です）"
        );
        return;
      }
      if (!EMAIL_RE.test(currentEmail)) {
        alert("メールアドレスの形式が正しくないようです。ご確認のうえ再度お試しください。");
        return;
      }
      alert(currentEmail + " 宛の送信機能は現在準備中です。有効化まで今しばらくお待ちください。");
    };

    document.getElementById("result").hidden = false;
    document.getElementById("result").scrollIntoView({ behavior: "smooth", block: "start" });

    trackEvent("estimator_complete", {
      plan: result.plan.key,
      range_min: result.totalMin,
      range_max: result.totalMax,
    });
  }

  // ---------------------------------------------------------------------
  // 7. リード獲得フォーム
  // ---------------------------------------------------------------------

  /**
   * Lead Pipeline 接続ポイント。
   *
   * lead-system側に新設したHTTP API（POST /api/lead）へfetchする。
   * API側でmapPriceEstimatorPayload → Validation → 重複統合 → Scoring → 保存 →
   * Human Review対象化まで一括実行される（lead-system/lib/connector.mjs）。
   * 本関数自体は通知メール送信・自動返信・見積送付・契約・決済を一切行わない。
   *
   * 引数 leadData: { name, email, message, suspectedBot, submissionId, planKey,
   *                  planName, totalMin, totalMax, pageCountLabel, designLevelLabel }
   * 戻り値: Promise<{ ok: boolean }>（ネットワークエラー時はPromiseがreject）
   */
  // ---------------------------------------------------------------------
  // 冪等キー（submission_id）
  // ---------------------------------------------------------------------
  /**
   * この送信操作を一意に指す値。contact.html 側の実装と同じ契約で、
   * サーバーは同じ値の2回目を新しいLeadにせず1回目のlead_idを返す
   * （status="already_saved"）。
   *
   * 一度作ったら消さない。タイムアウトやネットワーク断で「届いたか
   * 分からない」状態のあと再送しても同じ値が乗り、サーバー側で1件に畳まれる。
   * ここで作り直すと、防ぎたい重複Leadを自分で作ることになる。
   *
   * 送信成功時はフォーム内の要素が全て disabled になるため、同じページから
   * 別の問い合わせを出す経路は無い。新しい問い合わせはページを開き直した
   * 時点で新しい値になる。
   */
  function getSubmissionId(formEl) {
    if (!formEl.dataset.submissionId) {
      formEl.dataset.submissionId = "s-" + randomToken();
    }
    return formEl.dataset.submissionId;
  }

  /**
   * 保存が確定したときだけ呼ぶ。次の問い合わせは別の送信なので新しいキーを使う。
   * 失敗・タイムアウト・通信断では**呼ばない**——そこで作り直すと再送が別の送信に
   * 見えてしまい、まさに防ぎたい重複Leadを自分で作ることになる。
   */
  function clearSubmissionId(formEl) {
    delete formEl.dataset.submissionId;
  }

  function randomToken() {
    try {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID().replace(/-/g, "");
      }
      if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        var buf = new Uint8Array(16);
        crypto.getRandomValues(buf);
        var out = "";
        for (var i = 0; i < buf.length; i++) {
          out += (buf[i] + 0x100).toString(16).slice(1);
        }
        return out;
      }
    } catch (e) {
      // crypto が使えない環境は下のフォールバックへ
    }
    // 暗号強度は不要——衝突しなければよく、秘匿性も要らない。
    // サーバーは英数-_の8文字以上しか受け付けないため、必ず長さを満たす形にする。
    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 12) +
      Math.random().toString(36).slice(2, 12)
    );
  }

  function submitLeadToPipeline(leadData) {
    var controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    var timeoutId = null;
    var timedOut = false;

    function clearTimer() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    var options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    };

    if (controller) {
      options.signal = controller.signal;
      timeoutId = setTimeout(function () {
        timedOut = true;
        controller.abort();
      }, LEAD_SUBMIT_TIMEOUT_MS);
    }

    return fetch(LEAD_API_BASE_URL + "/api/lead", options)
      .then(function (response) {
        clearTimer();
        if (!response.ok) {
          return { ok: false };
        }
        return response.json().catch(function () {
          return { ok: true };
        });
      })
      .catch(function (err) {
        clearTimer();
        // タイムアウト（AbortController起因）は通信断と区別できるようにして投げ直す。
        if (timedOut || (err && err.name === "AbortError")) {
          var timeoutError = new Error("lead submit timeout");
          timeoutError.name = "LeadSubmitTimeoutError";
          throw timeoutError;
        }
        throw err;
      });
  }

  /**
   * Lead API プリウォーム（GET /health）。
   *
   * Lead送信そのもの（submitLeadToPipeline）とは無関係の、接続先を起こすためだけの
   * fire-and-forget リクエスト。Leadデータは一切送らず、結果もUIに反映しない。
   * 見積り入力の最初の操作時に1回だけ実行する（ページ表示だけでは実行しない）。
   */
  var leadApiPrewarmDone = false;
  function prewarmLeadApi() {
    if (leadApiPrewarmDone) return;
    leadApiPrewarmDone = true;
    if (!LEAD_SUBMIT_ENABLED) return; // 実送信無効時は接続先がローカル既定値のため実行しない
    try {
      fetch(LEAD_API_BASE_URL + "/health", {
        method: "GET",
        mode: "cors",
        cache: "no-store",
      }).catch(function () {
        // プリウォーム失敗はユーザー操作を一切阻害しない（UIにも出さない）
      });
    } catch (err) {
      // fetch未対応など。同上、何もしない。
    }
  }

  // 送信中フィードバック（ボタンラベル差し替え＋所要時間の補足表示）。
  function setLeadSubmitPending(leadSubmitBtn, leadSubmitStatus) {
    if (leadSubmitBtn) {
      if (!leadSubmitBtn.dataset.defaultLabel) {
        leadSubmitBtn.dataset.defaultLabel =
          (leadSubmitBtn.textContent || "").trim() || LEAD_SUBMIT_BTN_LABEL;
      }
      leadSubmitBtn.textContent = LEAD_SUBMIT_BTN_PENDING_LABEL;
      leadSubmitBtn.setAttribute("aria-busy", "true");
    }
    if (leadSubmitStatus) {
      leadSubmitStatus.textContent =
        "送信中です。サーバーの状況により最大40秒ほどかかる場合があります。このまま画面を閉じずにお待ちください。";
      leadSubmitStatus.hidden = false;
    }
  }

  // 送信中フィードバックの解除（成功・失敗・タイムアウトのいずれでも必ず呼ぶ）。
  function clearLeadSubmitPending(leadSubmitBtn, leadSubmitStatus) {
    if (leadSubmitBtn) {
      leadSubmitBtn.textContent =
        leadSubmitBtn.dataset.defaultLabel || LEAD_SUBMIT_BTN_LABEL;
      leadSubmitBtn.removeAttribute("aria-busy");
    }
    if (leadSubmitStatus) {
      leadSubmitStatus.textContent = "";
      leadSubmitStatus.hidden = true;
    }
  }

  function handleLeadFormSubmit(e) {
    e.preventDefault();

    var leadForm = document.getElementById("lead-form");
    var leadSubmitBtn = document.getElementById("lead-submit-btn");
    var leadSubmitStatus = document.getElementById("lead-submit-status");
    var leadSuccess = document.getElementById("lead-success");

    if (leadForm.dataset.submitting === "true") return; // 連打によるイベント多重発火防止

    var nameInput = document.getElementById("lead-name");
    var emailInput = document.getElementById("lead-email");
    var messageInput = document.getElementById("lead-message");
    var nameError = document.getElementById("lead-name-error");
    var emailError = document.getElementById("lead-email-error");

    clearError(nameError, nameInput);
    clearError(emailError, emailInput);
    clearError(document.getElementById("lead-form-error"), null);

    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    var hasError = false;

    if (!name) {
      showError(nameError, nameInput, "お名前を入力してください。");
      hasError = true;
    }
    if (!isValidEmailRequired(email)) {
      showError(emailError, emailInput, "正しい形式のメールアドレスを入力してください。");
      hasError = true;
    }

    if (hasError) {
      trackEvent("lead_form_validation_error", {});
      return;
    }

    var suspectedBot = isHoneypotFilled(document.getElementById("estimator-form"));
    var estimate = lastEstimate; // 直近の概算診断結果（プラン情報をLeadに引き継ぐ）
    var leadData = {
      name: name,
      email: email,
      message: messageInput.value.trim(),
      suspectedBot: suspectedBot,
      submissionId: getSubmissionId(leadForm),
      planKey: estimate ? estimate.result.plan.key : null,
      planName: estimate ? estimate.result.plan.name : null,
      totalMin: estimate ? estimate.result.totalMin : null,
      totalMax: estimate ? estimate.result.totalMax : null,
      pageCountLabel: estimate
        ? PAGE_COUNT_LABELS[estimate.data.pageCount] || estimate.data.pageCount
        : null,
      designLevelLabel: estimate
        ? DESIGN_LEVEL_LABELS[estimate.data.designLevel] || estimate.data.designLevel
        : null,
    };

    leadForm.dataset.submitting = "true";
    leadSubmitBtn.disabled = true;
    setLeadSubmitPending(leadSubmitBtn, leadSubmitStatus);

    trackEvent("lead_submit_start", { suspected_bot: suspectedBot });

    // 安全弁が無効（デフォルト）の間は、実際にはfetchを呼ばず、これまで通り
    // 「準備中」の確認表示のみ行う（Human Gate: lead-system本番APIデプロイ前の既定挙動）。
    if (!LEAD_SUBMIT_ENABLED) {
      clearLeadSubmitPending(leadSubmitBtn, leadSubmitStatus);
      leadSuccess.hidden = false;
      leadForm.querySelectorAll("input, textarea, button").forEach(function (el) {
        el.disabled = true;
      });
      trackEvent("lead_submit_stub_confirmed", { suspected_bot: suspectedBot });
      return;
    }

    submitLeadToPipeline(leadData)
      .then(function (res) {
        // 成功・失敗いずれでも送信中表示は必ず解除する（finally相当）
        clearLeadSubmitPending(leadSubmitBtn, leadSubmitStatus);
        if (res && res.ok) {
          // 実送信有効時のみ、静的HTMLの「準備中」文言を実送信完了の文言へ差し替える
          // （UI文言更新案：DIST_CANDIDATE_NOTES.md参照）。
          leadSuccess.textContent =
            "送信しました。担当者が内容を確認のうえご連絡いたします。";
          leadSuccess.hidden = false;
          leadForm.querySelectorAll("input, textarea, button").forEach(function (el) {
            el.disabled = true;
          });
          // 保存が確定した時点で冪等キーを手放す。次の問い合わせは別の送信であり、
          // 同じキーを持ち回るとサーバー側で「同じ送信の再送」として畳まれてしまう。
          // 失敗・タイムアウト時は**呼ばない**（再送に同じキーを乗せるため）。
          clearSubmissionId(leadForm);
          trackEvent("lead_submit_success", {
            plan: estimate ? estimate.result.plan.key : null,
          });
        } else {
          leadForm.dataset.submitting = "false";
          leadSubmitBtn.disabled = false;
          showError(
            document.getElementById("lead-form-error"),
            null,
            "送信に失敗しました。時間をおいて再度お試しください。"
          );
          trackEvent("lead_submit_error", { error_type: "api_error" });
        }
      })
      .catch(function (err) {
        // 成功・失敗いずれでも送信中表示は必ず解除する（finally相当）
        clearLeadSubmitPending(leadSubmitBtn, leadSubmitStatus);
        leadForm.dataset.submitting = "false";
        leadSubmitBtn.disabled = false;
        var isTimeout = !!(err && err.name === "LeadSubmitTimeoutError");
        showError(
          document.getElementById("lead-form-error"),
          null,
          isTimeout
            ? "時間内に応答がありませんでした。お手数ですが、もう一度送信していただくか、info@legacraft.jp まで直接ご連絡ください。"
            : "送信に失敗しました。時間をおいて再度お試しください。"
        );
        trackEvent("lead_submit_error", { error_type: "network_error" });
      });
  }

  function initLeadForm() {
    var leadForm = document.getElementById("lead-form");
    leadForm.addEventListener("submit", handleLeadFormSubmit);
  }

  // ---------------------------------------------------------------------
  // 8. 初期化
  // ---------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("estimator-form");
    var submitBtn = document.getElementById("submit-btn");
    var emailInput = document.getElementById("email");
    var emailError = document.getElementById("email-error");
    var formError = document.getElementById("form-error");
    var isSubmitting = false;

    // ファネル3段目：見積りツールへの到達。
    // 従来はここで estimator_start を発火していたが、ページ表示と同義であり
    // 「見積もりを開始した」とは言えない（2段目と3段目が常に同数になりファネルとして
    // 機能しない）。到達は estimator_view、開始は下の初回回答時へ分離した。
    trackEvent("estimator_view", { entry_source: resolveEntrySource() });

    // 各設問（fieldset）の回答変化をestimator_stepとして計測（step番号付き）
    var stepCounters = {};
    // ファネル4段目の発火済みフラグ。fieldsetごとにリスナーが付くため、
    // これが無いと回答するたびに estimator_start が発火してしまう。
    var startFired = false;
    form.querySelectorAll("fieldset").forEach(function (fieldset, idx) {
      fieldset.addEventListener("change", function () {
        var stepNo = idx + 1;
        // ファネル4段目：実際に最初の設問へ回答した瞬間を「開始」とする。
        if (!startFired) {
          startFired = true;
          trackEvent("estimator_start", { first_step: stepNo });
        }
        stepCounters[stepNo] = true;
        trackEvent("estimator_step", { step: stepNo });
      });
    });

    // 見積りフォームへの最初の操作（選択・入力）でLead APIを1回だけプリウォームする。
    // ページ表示だけでは実行しない（見積りを触らない訪問者まで接続先を起こさないため）。
    form.addEventListener("change", prewarmLeadApi);
    form.addEventListener("input", prewarmLeadApi);

    // 入力中にエラー表示をクリア（再入力の摩擦を減らす）
    emailInput.addEventListener("input", function () {
      clearError(emailError, emailInput);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (isSubmitting) return; // 連打によるレンダリング多重実行防止

      clearError(formError, null);
      formError.hidden = true;

      // ハニーポット：値が入っていればbotとみなし、UI上は何も起きていないように見せる
      if (isHoneypotFilled(form)) {
        trackEvent("estimator_bot_suspected", {});
        return;
      }

      var data = collectFormData(form);

      if (!isValidEmailOrEmpty(data.email)) {
        showError(
          emailError,
          emailInput,
          "メールアドレスの形式が正しくないようです（例：you@example.com）。未入力のままでも結果は表示できます。"
        );
        trackEvent("estimator_validation_error", { field: "email" });
        return;
      }

      try {
        isSubmitting = true;
        submitBtn.disabled = true;
        var result = computeResult(data);
        lastEstimate = { result: result, data: data };
        renderResult(result, data);
      } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
      }
    });

    initLeadForm();
  });
})();
