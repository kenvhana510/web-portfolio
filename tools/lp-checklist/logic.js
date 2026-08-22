/* logic.js
 * LP制作チェックリスト生成ロジック。すべてブラウザ内で完結（外部API・送信なし）。
 * 依存: checklist-data.js（CHECKLIST_CATEGORIES / BASE_ITEMS / INDUSTRY_ITEMS / PURPOSE_ITEMS / *_LABELS）
 */

(function () {
  "use strict";

  const form = document.getElementById("checklist-form");
  const resultSection = document.getElementById("result");
  const conditionEl = document.getElementById("result-condition");
  const countEl = document.getElementById("result-count");
  const groupsEl = document.getElementById("checklist-groups");
  const progressFill = document.getElementById("progress-fill");
  const progressLabel = document.getElementById("progress-label");
  const btnPrint = document.getElementById("btn-print");
  const btnReset = document.getElementById("btn-reset");

  const STORAGE_KEY = "lp-checklist-generator:state";

  /**
   * 業種・目的の組み合わせから、カテゴリごとの項目配列を構築する。
   * 同一文言は重複させない。
   */
  function buildChecklist(industry, purpose) {
    const grouped = {};

    CHECKLIST_CATEGORIES.forEach(function (cat) {
      const items = [];
      const seen = new Set();

      function addAll(source) {
        if (!source) return;
        source.forEach(function (text) {
          if (!seen.has(text)) {
            seen.add(text);
            items.push(text);
          }
        });
      }

      addAll(BASE_ITEMS[cat.key]);
      addAll((INDUSTRY_ITEMS[industry] || {})[cat.key]);
      addAll((PURPOSE_ITEMS[purpose] || {})[cat.key]);

      grouped[cat.key] = items;
    });

    return grouped;
  }

  function totalCount(grouped) {
    return Object.keys(grouped).reduce(function (sum, key) {
      return sum + grouped[key].length;
    }, 0);
  }

  function itemId(catKey, index) {
    return "chk-" + catKey + "-" + index;
  }

  function loadCheckedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCheckedState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* localStorage無効環境では保存をスキップ（機能自体は継続動作） */
    }
  }

  function renderChecklist(grouped, industry, purpose) {
    groupsEl.innerHTML = "";
    const checkedState = loadCheckedState();

    CHECKLIST_CATEGORIES.forEach(function (cat) {
      const items = grouped[cat.key];
      if (!items || items.length === 0) return;

      const block = document.createElement("div");
      block.className = "result-block checklist-block";

      const heading = document.createElement("h3");
      heading.textContent = cat.label + "（" + items.length + "項目）";
      block.appendChild(heading);

      const ul = document.createElement("ul");
      ul.className = "checklist-list";

      items.forEach(function (text, index) {
        const id = itemId(cat.key, index);
        const li = document.createElement("li");
        li.className = "checklist-item";

        const label = document.createElement("label");
        label.className = "checklist-label";
        label.setAttribute("for", id);

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = id;
        input.checked = !!checkedState[id];
        input.addEventListener("change", function () {
          const state = loadCheckedState();
          state[id] = input.checked;
          saveCheckedState(state);
          updateProgress(grouped);
        });

        const span = document.createElement("span");
        span.textContent = text;

        label.appendChild(input);
        label.appendChild(span);
        li.appendChild(label);
        ul.appendChild(li);
      });

      block.appendChild(ul);
      groupsEl.appendChild(block);
    });

    updateProgress(grouped);
  }

  function updateProgress(grouped) {
    const state = loadCheckedState();
    const total = totalCount(grouped);
    let checked = 0;

    CHECKLIST_CATEGORIES.forEach(function (cat) {
      const items = grouped[cat.key] || [];
      items.forEach(function (_, index) {
        if (state[itemId(cat.key, index)]) checked++;
      });
    });

    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
    progressFill.style.width = pct + "%";
    progressLabel.textContent = "進捗: " + checked + " / " + total + "（" + pct + "%）";
  }

  function resetChecks(grouped) {
    saveCheckedState({});
    const inputs = groupsEl.querySelectorAll('input[type="checkbox"]');
    inputs.forEach(function (input) {
      input.checked = false;
    });
    updateProgress(grouped);
  }

  let currentGrouped = null;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const industry = form.querySelector('input[name="industry"]:checked').value;
    const purpose = form.querySelector('input[name="purpose"]:checked').value;

    const grouped = buildChecklist(industry, purpose);
    currentGrouped = grouped;

    conditionEl.textContent =
      "業種: " + INDUSTRY_LABELS[industry] + " ／ 目的: " + PURPOSE_LABELS[purpose];
    countEl.textContent = totalCount(grouped) + " 項目のチェックリストを生成しました";

    renderChecklist(grouped, industry, purpose);

    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  btnPrint.addEventListener("click", function () {
    window.print();
  });

  btnReset.addEventListener("click", function () {
    if (currentGrouped) resetChecks(currentGrouped);
  });
})();
