/**
 * price-estimator / logic.js
 *
 * Web制作費概算シミュレーター — ルールベース算出ロジック（外部通信なし）
 *
 * 価格の正本（source of truth）は常に site/06-price.md。
 * このファイルは06-price.mdの商品A/B/Cをそのままマッピングした「表示レイヤー」であり、
 * 独自に価格を決定しない。オプション加算額のみ、06-price.mdに定義がないため
 * 本ツールの暫定値（仮実装・要確認）として明示する。
 *
 * Privacy: 本ツールはユーザーの入力値を一切サーバー・外部サービスへ送信しない。
 * すべての計算はブラウザ内（クライアントサイド）で完結する。fetch/XHR等の通信コードは
 * このファイル内に一切存在しない（診断結果シミュレーションもリード獲得フォームも、
 * 現状は画面表示・ローカル処理のみ）。
 *
 * Lead Pipeline接続: リード獲得フォーム（#lead-form）の送信処理は
 * handleLeadFormSubmit() に集約している。実際のLead Pipelineへの送信は
 * submitLeadToPipeline() を実装（このファイル内に1関数追加する想定）することで
 * 接続できる設計にしてある。本ファイルのバリデーション・UI制御ロジックには影響しない。
 *
 * Abuse: 外部通信・外部APIが無いため連打によるサーバー負荷やコスト増のリスクはない。
 * 将来実送信を接続した際に備え、リードフォームにはハニーポット欄を用意している
 * （bot対策の下準備。現状は判定のみでブロック処理は行わない＝実送信自体が無いため）。
 *
 * 出典：C:\Users\unear\legacraft\site\06-price.md（最終更新 2026-08-01）
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // 1. プランマスタ（06-price.md 2-2〜2-4 をそのまま転記。価格帯は仮説値）
  // ---------------------------------------------------------------------
  var PLANS = {
    A: {
      key: "A",
      name: "商品A｜LP制作",
      pageDesc: "1ページ完結のランディングページ（目安8〜12セクション）",
      min: 80000,
      max: 180000,
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
    B: {
      key: "B",
      name: "商品B｜WordPress企業サイト制作",
      pageDesc: "5〜8ページ（TOP・会社概要・事業内容・実績・採用・お問い合わせ 等）",
      min: 250000,
      max: 500000,
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
    C: {
      key: "C",
      name: "商品C｜高品質WordPressサイト制作（ハイエンド）",
      pageDesc: "8〜12ページ＋CASE STUDY／実績詳細ページ等",
      min: 500000,
      max: 1000000,
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

  // ---------------------------------------------------------------------
  // 3. GA4イベント計測ラッパー（FREE_TOOL_MVP_SPEC.md 準拠のイベント名 + 本実装での拡張）
  //    実GA4未接続のためdataLayerが無い場合はconsoleへ出力するのみ。
  // ---------------------------------------------------------------------
  function trackEvent(eventName, params) {
    var payload = Object.assign({ event: eventName }, params || {});
    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(payload);
    } else {
      // eslint-disable-next-line no-console
      console.log("[GA4 stub]", payload);
    }
  }

  // ---------------------------------------------------------------------
  // 4. プラン判定ロジック
  //    ベースはページ数で決定。仕上がり方向性「ブランディング重視」を
  //    選んだ場合は1段階上のプランへ引き上げる
  //    （FREE_TOOL_MVP_SPEC.md 1章：「8〜12以上」または「ブランディング重視」→商品C系）。
  // ---------------------------------------------------------------------
  function resolvePlanKey(pageCount, designLevel) {
    var key;
    if (pageCount === "1") {
      key = "A";
    } else if (pageCount === "5-8") {
      key = "B";
    } else {
      key = "C"; // "8plus"
    }

    if (designLevel === "branding") {
      if (key === "A") key = "B";
      else key = "C";
    }

    return key;
  }

  function formatYen(n) {
    return Math.round(n / 10000) + "万円";
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
    var planKey = resolvePlanKey(data.pageCount, data.designLevel);
    var plan = PLANS[planKey];

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
      totalMin: plan.min + addonMin,
      totalMax: plan.max + addonMax,
    };
  }

  function buildReasoningText(data, result) {
    var pageLabel = PAGE_COUNT_LABELS[data.pageCount] || data.pageCount;
    var designLabel = DESIGN_LEVEL_LABELS[data.designLevel] || data.designLevel;
    var text =
      "希望ページ数「" + pageLabel + "」と、希望の仕上がり方向性「" + designLabel +
      "」から、LEGACRAFTの3プラン（商品A｜LP制作／商品B｜WordPress企業サイト制作／商品C｜高品質WordPress" +
      "サイト制作）のうち「" + result.plan.name + "」が最も近いと判定し、そのプランの価格帯を表示しています。";
    if (data.designLevel === "branding") {
      text +=
        "「ブランディング重視」を選択されたため、ページ数のみで判定する場合より1段階上のプランを目安として表示しています。";
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
    document.getElementById("result-range").textContent =
      formatYen(result.totalMin) + "〜" + formatYen(result.totalMax);
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
      "【概算診断結果】" + result.plan.name + " / " +
      formatYen(result.totalMin) + "〜" + formatYen(result.totalMax) +
      "（ページ数：" + (PAGE_COUNT_LABELS[data.pageCount] || data.pageCount) +
      "、仕上がり方向性：" + (DESIGN_LEVEL_LABELS[data.designLevel] || data.designLevel) + "）\n\n";

    var ctaContact = document.getElementById("cta-contact");
    ctaContact.onclick = function () {
      var willOpen = leadPanel.hidden;
      leadPanel.hidden = !willOpen;
      ctaContact.setAttribute("aria-expanded", String(willOpen));
      if (willOpen) {
        if (!leadMessage.value) {
          leadMessage.value = summaryText;
        }
        trackEvent("tool_b_cta_contact_click", { plan: result.plan.key });
        leadPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    var ctaLine = document.getElementById("cta-line");
    ctaLine.href = "#line-placeholder";
    ctaLine.onclick = function (e) {
      e.preventDefault();
      trackEvent("tool_b_cta_line_click", { plan: result.plan.key });
      alert("LINE公式アカウントの友だち追加導線は現在準備中です。有効化まで今しばらくお待ちください。");
    };

    var ctaEmail = document.getElementById("cta-email");
    ctaEmail.onclick = function () {
      var emailInput = document.getElementById("email");
      var currentEmail = (emailInput.value || "").trim();
      trackEvent("tool_b_cta_email_submit", {
        plan: result.plan.key,
        hasEmail: !!currentEmail,
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

    trackEvent("tool_b_result_view", {
      plan: result.plan.key,
      rangeMin: result.totalMin,
      rangeMax: result.totalMax,
    });
  }

  // ---------------------------------------------------------------------
  // 7. リード獲得フォーム
  // ---------------------------------------------------------------------

  /**
   * Lead Pipeline 接続ポイント。
   *
   * 現状はスタブ実装で、実際の送信は行わずローカルで成功扱いにする
   * （Promiseで解決するのは、将来ここを実際のfetch呼び出しに置き換えても
   * handleLeadFormSubmit側の呼び出し方を変えずに済むようにするため）。
   *
   * 実装を差し替える場合は、この関数の中身だけを書き換えればよい。
   * 引数 leadData: { name, email, message, suspectedBot, plan, rangeMin, rangeMax }
   * 戻り値: Promise<{ ok: boolean }>
   */
  function submitLeadToPipeline(leadData) {
    // eslint-disable-next-line no-unused-vars
    return Promise.resolve({ ok: true, stub: true });
  }

  function handleLeadFormSubmit(e) {
    e.preventDefault();

    var leadForm = document.getElementById("lead-form");
    var leadSubmitBtn = document.getElementById("lead-submit-btn");
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
      trackEvent("tool_b_lead_form_validation_error", {});
      return;
    }

    var suspectedBot = isHoneypotFilled(document.getElementById("estimator-form"));
    var leadData = {
      name: name,
      email: email,
      message: messageInput.value.trim(),
      suspectedBot: suspectedBot,
    };

    leadForm.dataset.submitting = "true";
    leadSubmitBtn.disabled = true;

    trackEvent("tool_b_lead_form_submit", { suspectedBot: suspectedBot });

    submitLeadToPipeline(leadData)
      .then(function (res) {
        if (res && res.ok) {
          leadSuccess.hidden = false;
          leadForm.querySelectorAll("input, textarea, button").forEach(function (el) {
            el.disabled = true;
          });
        } else {
          leadForm.dataset.submitting = "false";
          leadSubmitBtn.disabled = false;
          showError(
            document.getElementById("lead-form-error"),
            null,
            "送信に失敗しました。時間をおいて再度お試しください。"
          );
          trackEvent("tool_b_lead_form_submit_error", {});
        }
      })
      .catch(function () {
        leadForm.dataset.submitting = "false";
        leadSubmitBtn.disabled = false;
        showError(
          document.getElementById("lead-form-error"),
          null,
          "送信に失敗しました。時間をおいて再度お試しください。"
        );
        trackEvent("tool_b_lead_form_submit_error", {});
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

    trackEvent("tool_b_start", {});

    // 各設問の回答変化を簡易的にstep_completeとして計測
    var stepCounters = {};
    form.querySelectorAll("fieldset").forEach(function (fieldset, idx) {
      fieldset.addEventListener("change", function () {
        var stepNo = idx + 1;
        stepCounters[stepNo] = true;
        trackEvent("tool_b_step_complete", { step: stepNo });
      });
    });

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
        trackEvent("tool_b_bot_suspected", {});
        return;
      }

      var data = collectFormData(form);

      if (!isValidEmailOrEmpty(data.email)) {
        showError(
          emailError,
          emailInput,
          "メールアドレスの形式が正しくないようです（例：you@example.com）。未入力のままでも結果は表示できます。"
        );
        trackEvent("tool_b_validation_error", { field: "email" });
        return;
      }

      try {
        isSubmitting = true;
        submitBtn.disabled = true;
        var result = computeResult(data);
        renderResult(result, data);
      } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
      }
    });

    initLeadForm();
  });
})();
