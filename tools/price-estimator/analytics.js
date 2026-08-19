/**
 * price-estimator / analytics.js
 *
 * 計測抽象化レイヤー（薄いラッパー）。
 *
 * 目的：
 *  - 呼び出し側（logic.js）はGA4等の実装詳細を意識せず analytics.track(eventName, params) だけを呼ぶ。
 *  - 実GA4 Measurement ID（G-xxxxxxxxxx）が未提供の間は、コンソール（console.debug）出力のみで
 *    動作確認できるようにする。実IDが提供された時点で config を差し替えるだけで実送信に切り替わる。
 *  - 将来GA4以外の計測ツールに差し替える場合も、analytics.js内部の実装だけを差し替えればよい
 *    （logic.js側の呼び出し箇所は変更不要）。
 *
 * Measurement ID注入について（絶対ルール：実IDのハードコード禁止）：
 *  - このファイルは実Measurement IDを一切含まない。
 *  - index.html側の <script> で window.GA4_MEASUREMENT_ID を設定することで注入する
 *    （現状は空文字のプレースホルダー。本番投入時に環境ごとの値へ差し替える）。
 *  - window.GA4_MEASUREMENT_ID が空、またはgtag.js未ロードの場合は自動的にconsole.debugへ
 *    フォールバックする（開発時のみ・機微情報を含まない前提）。
 *
 * 出典：TASK-20260819-028（Wave05 P1b）Event taxonomy設計に基づく実装。
 */

(function (window) {
  "use strict";

  var GA4_MEASUREMENT_ID =
    (typeof window !== "undefined" && window.GA4_MEASUREMENT_ID) || "";

  function isGtagReady() {
    return (
      typeof window !== "undefined" &&
      typeof window.gtag === "function" &&
      !!GA4_MEASUREMENT_ID
    );
  }

  function isDataLayerReady() {
    return typeof window !== "undefined" && Array.isArray(window.dataLayer);
  }

  /**
   * analytics.track(eventName, params)
   *
   * eventName: string（イベント名。GA4命名規則に合わせ snake_case を推奨）
   * params: object（イベントパラメータ。undefined/nullのキーは送らない）
   *
   * 送信先の優先順位：
   *  1. gtag（window.gtag が存在し、Measurement IDが注入済みの場合）→ 実GA4送信
   *  2. dataLayer（GTM等が存在する場合）→ dataLayer.push
   *  3. どちらも無ければ console.debug（開発確認用。本番では 1 or 2 が有効な想定）
   */
  function track(eventName, params) {
    var cleanParams = {};
    Object.keys(params || {}).forEach(function (key) {
      var v = params[key];
      if (v !== undefined && v !== null) cleanParams[key] = v;
    });

    if (isGtagReady()) {
      window.gtag("event", eventName, cleanParams);
      return;
    }

    if (isDataLayerReady()) {
      window.dataLayer.push(Object.assign({ event: eventName }, cleanParams));
      return;
    }

    // eslint-disable-next-line no-console
    console.debug("[analytics stub]", eventName, cleanParams);
  }

  window.analytics = { track: track };
})(typeof window !== "undefined" ? window : this);
