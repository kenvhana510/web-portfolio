/**
 * contact-form.js
 *
 * contact.html のサイト内直接問い合わせフォーム（#contact-form）の送信処理。
 *
 * 目的：要件が固まっている見込み客が、外部プラットフォーム（ランサーズ／ココナラ）や
 * 概算シミュレーター（9問）を経由せずに、その場で相談を送れる導線を用意する。
 * 既存の外部チャネル・メール導線・price-estimatorへのCTAは置き換えず、併存させる。
 *
 * Lead Pipeline接続：送信先は price-estimator（tools/price-estimator/logic.js の
 * submitLeadToPipeline）とまったく同一のAPI契約を用いる。
 *   エンドポイント : POST {LEAD_API_BASE_URL}/api/lead
 *   ヘッダー       : Content-Type: application/json
 *   ボディ         : { name, email, message, suspectedBot, planKey, planName,
 *                      totalMin, totalMax, pageCountLabel, designLevelLabel }
 *   成功判定       : HTTPステータスが ok かつ レスポンスJSONの ok === true
 * サーバー側（lead-system/lib/connector.mjs の mapPriceEstimatorPayload）が
 * request_type = planName || planKey || "不明"、budget_range = totalMin/totalMax から
 * 算出するため、本フォームは「相談種別」を planName へマッピングして送る。
 * 診断由来の項目（totalMin/totalMax/pageCountLabel/designLevelLabel/planKey）は
 * 本フォームでは収集しないため、値を捏造せず null のまま送る。
 *
 * 本番安全弁：price-estimatorと同じ二段階ゲート（window.LEAD_API_BASE_URL /
 * window.LEAD_SUBMIT_ENABLED）を共有する。LEAD_SUBMIT_ENABLED !== true の間は
 * fetchを一切呼ばず、「送信は準備中」の安全な表示のみ行う。
 *
 * Abuse対策：ハニーポット欄（input[name="website"]）の入力有無を suspectedBot として
 * サーバーへ引き継ぐ（判定・除外はサーバー側の責務）。
 *
 * 本ファイルは通知メール送信・自動返信・見積送付・契約・決済を一切行わない。
 */

(function () {
  "use strict";

  // Lead Pipeline接続先（ローカル開発用デフォルト）。本番URLへの切り替えは
  // ページ側でwindow.LEAD_API_BASE_URLを設定することで上書きできる（Human Gate対象）。
  var LEAD_API_BASE_URL =
    (typeof window !== "undefined" && window.LEAD_API_BASE_URL) || "http://localhost:4310";

  // 実送信の安全弁（デフォルトfalse＝準備中表示のまま）。
  var LEAD_SUBMIT_ENABLED =
    typeof window !== "undefined" && window.LEAD_SUBMIT_ENABLED === true;

  // Lead APIはコールドスタート時に20秒超（実測21.4秒）かかることがあるため、
  // ブラウザ既定のタイムアウトに任せず、余裕をみて40秒で明示的に打ち切る。
  var SUBMIT_TIMEOUT_MS = 40000;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ---------------------------------------------------------------------
  // イベント計測ラッパー
  //  contact.htmlはprice-estimatorのanalytics.jsを読み込まないため、
  //  window.analytics → window.gtag → console.debug の順にフォールバックする。
  // ---------------------------------------------------------------------
  function trackEvent(eventName, params) {
    if (typeof window === "undefined") return;
    if (window.analytics && typeof window.analytics.track === "function") {
      window.analytics.track(eventName, params || {});
      return;
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
      return;
    }
    // eslint-disable-next-line no-console
    console.debug("[analytics stub]", eventName, params || {});
  }

  // ---------------------------------------------------------------------
  // バリデーション／エラー表示ヘルパー
  // ---------------------------------------------------------------------
  function isValidEmailRequired(value) {
    return !!value && EMAIL_RE.test(value);
  }

  function showError(errorEl, inputEl, message) {
    if (errorEl) {
      // aria-live領域はhidden解除後に内容を変更しないと読み上げられないため、この順序を守る
      errorEl.hidden = false;
      errorEl.textContent = message;
    }
    if (inputEl) {
      inputEl.setAttribute("aria-invalid", "true");
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

  /**
   * どのフォーム経由のLeadかはサーバー側の_meta（free_tool: "price-estimator"固定）
   * では区別できないため、本文の先頭に発生源を明記して人が判別できるようにする。
   */
  function buildMessage(typeLabel, body) {
    var head = "【サイト内お問い合わせフォーム（contact.html）】\n";
    if (typeLabel) {
      head += "相談種別：" + typeLabel + "\n";
    }
    return head + "\n" + body;
  }

  // ---------------------------------------------------------------------
  // Lead API プリウォーム（GET /health）
  // ---------------------------------------------------------------------
  /**
   * tools/price-estimator/logic.js の prewarmLeadApi と同一の考え方。
   *
   * Lead APIはRender無料枠で動いており、一定時間アクセスがないと停止する。
   * 復帰（コールドスタート）は実測で12.3秒〜29.5秒とばらつきがあり、送信時に
   * これがそのまま乗ると SUBMIT_TIMEOUT_MS(40秒) に触れうる。触れると「失敗」と
   * 表示されるが、サーバー側は保存を終えている場合があり、ユーザーが再送すると
   * Leadが重複する。送信より前に接続先を起こしておくことでこれを避ける。
   *
   * Lead送信そのものとは無関係の fire-and-forget リクエスト。Leadデータは一切
   * 送らず、結果もUIに反映しない。フォームへの最初の操作時に1回だけ実行する
   * （ページを表示しただけでは実行しない＝問い合わせ意図のない閲覧でRenderを
   * 起こさない）。
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
        // プリウォーム失敗はユーザー操作を一切阻害しない（UIにも出さない）。
        // 送信は通常どおり行われ、既存のタイムアウト処理に委ねる。
      });
    } catch (err) {
      // fetch未対応など。同上、何もしない。
    }
  }

  // ---------------------------------------------------------------------
  // 送信
  // ---------------------------------------------------------------------
  /**
   * Lead Pipeline 接続ポイント（logic.js の submitLeadToPipeline と同一契約）。
   *
   * 相違点は「例外をrejectで投げず、必ず解決値で返す」ことのみ。
   * タイムアウト・ネットワークエラー・HTTPエラーをUI側で出し分けるため、
   * { ok: false, errorType: "timeout"|"network_error"|"api_error" } を返す。
   *
   * @returns {Promise<{ok: boolean, errorType?: string, status?: number}>}
   */
  function submitLeadToPipeline(leadData) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timedOut = false;
    var timerId = null;

    if (controller) {
      timerId = window.setTimeout(function () {
        timedOut = true;
        controller.abort();
      }, SUBMIT_TIMEOUT_MS);
    }

    function clearTimer() {
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
    }

    var options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    };
    if (controller) {
      options.signal = controller.signal;
    }

    return fetch(LEAD_API_BASE_URL + "/api/lead", options)
      .then(function (response) {
        clearTimer();
        if (!response.ok) {
          return { ok: false, errorType: "api_error", status: response.status };
        }
        return response.json().catch(function () {
          return { ok: true };
        });
      })
      .catch(function () {
        clearTimer();
        return { ok: false, errorType: timedOut ? "timeout" : "network_error" };
      });
  }

  /**
   * 「サーバーに届いたかどうかが確定できない」失敗かどうか。
   *
   * timeout（応答が返る前に打ち切った）と network_error（通信が切れた）は、
   * サーバー側が保存を終えていても結果を受け取れないことがある。実測でも
   * サーバー処理は865msで終わる一方、コールドスタートは最大29.5秒かかっており、
   * この乖離は現実に存在する。
   *
   * これらを「失敗」と断定して再送を促すと、保存済みだった場合にLeadが重複する。
   * 現在のサーバー実装は重複統合の判定にローカルJSONしか参照しないため、
   * Supabase保存時は重複が統合されず2件のまま残る。したがってクライアント側で
   * 再送を促さないことが唯一の防御線になる。
   */
  function isUnknownDelivery(res) {
    return !!res && (res.errorType === "timeout" || res.errorType === "network_error");
  }

  function errorMessageFor(res) {
    if (isUnknownDelivery(res)) {
      return (
        "送信結果を確認できませんでした。すでに送信できている可能性があるため、" +
        "重複を避けるにはこのまま再送信せず、info@legacraft.jp までメールでご連絡ください。"
      );
    }
    if (res && res.status === 429) {
      return "短時間に送信が集中しています。1分ほど時間をおいてから再度お試しください。";
    }
    if (res && res.status === 400) {
      return "入力内容をご確認のうえ、もう一度お試しください。";
    }
    return "送信に失敗しました。時間をおいて再度お試しください。";
  }

  // ---------------------------------------------------------------------
  // 初期化
  // ---------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var nameInput = document.getElementById("contact-name");
    var emailInput = document.getElementById("contact-email");
    var typeSelect = document.getElementById("contact-type");
    var messageInput = document.getElementById("contact-message");

    var nameError = document.getElementById("contact-name-error");
    var emailError = document.getElementById("contact-email-error");
    var typeError = document.getElementById("contact-type-error");
    var messageError = document.getElementById("contact-message-error");

    var formError = document.getElementById("contact-form-error");
    var formErrorText = document.getElementById("contact-form-error-text");
    var formSuccess = document.getElementById("contact-form-success");
    var submitBtn = document.getElementById("contact-submit-btn");
    var submitNote = document.getElementById("contact-submit-note");
    var submitLabel = submitBtn ? submitBtn.textContent : "";

    // 入力中はその項目のエラー表示を消す（再入力の摩擦を減らす）
    [
      [nameInput, nameError],
      [emailInput, emailError],
      [messageInput, messageError],
    ].forEach(function (pair) {
      if (!pair[0]) return;
      pair[0].addEventListener("input", function () {
        clearError(pair[1], pair[0]);
      });
    });
    if (typeSelect) {
      typeSelect.addEventListener("change", function () {
        clearError(typeError, typeSelect);
      });
    }

    // 入力が始まった＝問い合わせ意図が生じた時点で、送信先を一度だけ起こしておく。
    // price-estimator と同じ接続タイミング（form全体のinput/change）に揃える。
    form.addEventListener("input", prewarmLeadApi);
    form.addEventListener("change", prewarmLeadApi);

    function showFormError(message) {
      if (formError) formError.hidden = false;
      if (formErrorText) formErrorText.textContent = message;
    }

    function clearFormError() {
      if (formErrorText) formErrorText.textContent = "";
      if (formError) formError.hidden = true;
    }

    function setSubmitting(isSubmitting) {
      form.dataset.submitting = isSubmitting ? "true" : "false";
      submitBtn.disabled = isSubmitting;
      submitBtn.textContent = isSubmitting ? "送信中…" : submitLabel;
      if (submitNote) submitNote.hidden = !isSubmitting;
    }

    function lockForm() {
      form.querySelectorAll("input, select, textarea, button").forEach(function (el) {
        el.disabled = true;
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (form.dataset.submitting === "true") return; // 連打によるイベント多重発火防止

      clearError(nameError, nameInput);
      clearError(emailError, emailInput);
      clearError(typeError, typeSelect);
      clearError(messageError, messageInput);
      clearFormError();

      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      var typeLabel = typeSelect ? typeSelect.value : "";
      var message = messageInput.value.trim();
      var firstInvalid = null;
      var hasError = false;

      if (!name) {
        showError(nameError, nameInput, "お名前を入力してください。");
        firstInvalid = firstInvalid || nameInput;
        hasError = true;
      }
      if (!email) {
        showError(emailError, emailInput, "メールアドレスを入力してください。");
        firstInvalid = firstInvalid || emailInput;
        hasError = true;
      } else if (!isValidEmailRequired(email)) {
        showError(emailError, emailInput, "正しい形式のメールアドレスを入力してください。（例：sample@example.com）");
        firstInvalid = firstInvalid || emailInput;
        hasError = true;
      }
      if (typeSelect && !typeLabel) {
        showError(typeError, typeSelect, "ご相談の種別を選択してください。");
        firstInvalid = firstInvalid || typeSelect;
        hasError = true;
      }
      if (!message) {
        showError(messageError, messageInput, "ご相談内容を入力してください。（現状・ご希望を一言でも構いません）");
        firstInvalid = firstInvalid || messageInput;
        hasError = true;
      }

      if (hasError) {
        if (firstInvalid) firstInvalid.focus();
        trackEvent("contact_form_validation_error", {});
        return;
      }

      var suspectedBot = isHoneypotFilled(form);
      // サーバー側（mapPriceEstimatorPayload）の期待するキー構造に厳密に合わせる。
      // 本フォームが収集しない診断由来の項目は「不明」等を捏造せずnullで送る。
      var leadData = {
        name: name,
        email: email,
        message: buildMessage(typeLabel, message),
        suspectedBot: suspectedBot,
        planKey: null,
        planName: typeLabel || null,
        totalMin: null,
        totalMax: null,
        pageCountLabel: null,
        designLevelLabel: null,
      };

      setSubmitting(true);
      trackEvent("contact_form_submit_start", { suspected_bot: suspectedBot });

      // 安全弁が無効（デフォルト）の間は、実際にはfetchを呼ばず「準備中」の確認表示のみ行う。
      if (!LEAD_SUBMIT_ENABLED) {
        if (submitNote) submitNote.hidden = true;
        submitBtn.textContent = submitLabel;
        formSuccess.hidden = false;
        formSuccess.textContent =
          "現在このフォームからの送信は準備中です。お手数ですが info@legacraft.jp または下記の各サービス経由でご連絡ください。";
        lockForm();
        trackEvent("contact_form_submit_stub_confirmed", { suspected_bot: suspectedBot });
        return;
      }

      submitLeadToPipeline(leadData).then(function (res) {
        if (res && res.ok) {
          if (submitNote) submitNote.hidden = true;
          submitBtn.textContent = "送信済み";
          formSuccess.hidden = false;
          formSuccess.textContent =
            "送信しました。内容を確認のうえ、通常1〜2営業日以内にご入力のメールアドレス宛にご返信いたします。";
          formSuccess.focus();
          lockForm(); // 送信済みフォームは再送信できない状態にする
          trackEvent("contact_form_submit_success", {});
          return;
        }

        // 失敗時は入力内容を保持したまま再送信できる状態へ戻す
        setSubmitting(false);
        showFormError(errorMessageFor(res));
        if (formError) formError.focus();
        trackEvent("contact_form_submit_error", {
          error_type: (res && res.errorType) || "unknown",
          status: (res && res.status) || null,
        });
      });
    });
  });
})();
