/**
 * SITE FOOTER
 * ===========
 *
 * WHAT THIS COMPONENT IS
 * The dark block at the bottom of every storefront page: brand blurb, quick
 * shop links, contact details, and the copyright line.
 *
 * The links are anchors pointing at sections of the same page, so they scroll
 * rather than navigating. The contact details are plain text because this is a
 * demo storefront and there is no contact form or support inbox behind them.
 */

export default function Footer() {
  return (
    <footer>
      <div className="shell footer">
        <div>
          <a className="brand inverse" href="#top">
            VELOURA
          </a>
          <p>Everyday skincare for soft, nourished skin.</p>
        </div>

        <div>
          <strong>Shop</strong>
          <a href="#shop">All products</a>
          <a href="#care">Why Veloura</a>
        </div>

        <div>
          <strong>Contact</strong>
          <span>Lagos, Nigeria</span>
          <span>hello@veloura.store</span>
        </div>
      </div>

      <div className="shell copyright">© 2026 Veloura. Demo storefront.</div>
    </footer>
  )
}
