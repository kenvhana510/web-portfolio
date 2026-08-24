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
 * 出典：legacraft リポジトリ site/06-price.md（最終更新 2026-08-01）
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

  // Lead Pipeline接続先（ローカル開発用デフォルト）。本番URLへの切り替えは
  // ページ側でwindow.LEAD_API_BASE_URLを設定することで上書きできる（Human Gate対象）。
  var LEAD_API_BASE_URL =
    (typeof window !== "undefined" && window.LEAD_API_BASE_URL) || "http://localhost:4310";

  // 実送信の安全弁（デフォルトfalse＝準備中表示のまま）。詳細はファイル冒頭コメント参照。
  var LEAD_SUBMIT_ENABLED =
    typeof window !== "undefined" && window.LEAD_SUBMIT_ENABLED === true;

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
   * 引数 leadData: { name, email, message, suspectedBot, planKey, planName,
   *                  totalMin, totalMax, pageCountLabel, designLevelLabel }
   * 戻り値: Promise<{ ok: boolean }>（ネットワークエラー時はPromiseがreject）
   */
  function submitLeadToPipeline(leadData) {
    return fetch(LEAD_API_BASE_URL + "/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    }).then(function (response) {
      if (!response.ok) {
        return { ok: false };
      }
      return response.json().catch(function () {
        return { ok: true };
      });
    });
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

    trackEvent("lead_submit_start", { suspected_bot: suspectedBot });

    // 安全弁が無効（デフォルト）の間は、実際にはfetchを呼ばず、これまで通り
    // 「準備中」の確認表示のみ行う（Human Gate: lead-system本番APIデプロイ前の既定挙動）。
    if (!LEAD_SUBMIT_ENABLED) {
      leadSuccess.hidden = false;
      leadForm.querySelectorAll("input, textarea, button").forEach(function (el) {
        el.disabled = true;
      });
      trackEvent("lead_submit_stub_confirmed", { suspected_bot: suspectedBot });
      return;
    }

    submitLeadToPipeline(leadData)
      .then(function (res) {
        if (res && res.ok) {
          // 実送信有効時のみ、静的HTMLの「準備中」文言を実送信完了の文言へ差し替える
          // （UI文言更新案：DIST_CANDIDATE_NOTES.md参照）。
          leadSuccess.textContent =
            "送信しました。担当者が内容を確認のうえご連絡いたします。";
          leadSuccess.hidden = false;
          leadForm.querySelectorAll("input, textarea, button").forEach(function (el) {
            el.disabled = true;
          });
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
      .catch(function () {
        leadForm.dataset.submitting = "false";
        leadSubmitBtn.disabled = false;
        showError(
          document.getElementById("lead-form-error"),
          null,
          "送信に失敗しました。時間をおいて再度お試しください。"
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

    trackEvent("estimator_start", {});

    // 各設問（fieldset）の回答変化をestimator_stepとして計測（step番号付き）
    var stepCounters = {};
    form.querySelectorAll("fieldset").forEach(function (fieldset, idx) {
      fieldset.addEventListener("change", function () {
        var stepNo = idx + 1;
        stepCounters[stepNo] = true;
        trackEvent("estimator_step", { step: stepNo });
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
