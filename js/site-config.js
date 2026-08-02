/**
 * サイト全体の設定値。価格・連絡先など、後から変更される可能性が高い値をここに集約する。
 * ここを書き換えるだけでサイト全体に反映される。
 */
const SITE_CONFIG = {
  // 屋号：LEGACRAFT（legacraft/brand/brand-guidelines.md Version 1.0で確定）。
  siteName: "LEGACRAFT",
  tagline: "WordPress（SWELL）・LP制作専門のWeb制作",

  // 2026-07-31確定：実績構築期（初回受注獲得優先）の正式価格。
  // 事業が軌道に乗った後の本来価格帯は sales/application-ready-kit.md 4章・
  // strategy/service-design.md を参照（本サイトには現時点では掲載しない）。
  pricing: {
    lp: { label: "LP制作", price: "30,000円〜60,000円" },
    small: { label: "小規模Webサイト制作", price: "80,000円〜120,000円" },
    wordpress: { label: "WordPressサイト制作", price: "150,000円〜250,000円" },
  },

  // 旧価格（参考・履歴。現在の営業価格としては使用しない）：
  // lp 80,000円〜 / corporate 150,000円〜 / highend 300,000円〜

  // 各プラットフォームのアカウント登録・URL確定後にここへ入力する。
  // 未確定の間は null のままにし、フロント側では「準備中」表示にする。
  contact: {
    crowdworks: null,
    lancers: null,
    coconala: null,
    email: null,
  },
};
