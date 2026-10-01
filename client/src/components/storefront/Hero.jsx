/**
 * HERO SECTION
 * ============
 *
 * WHAT THIS COMPONENT IS
 * The large opening area at the top of the shop: the headline on the left and
 * the main photograph on the right, with a small floating card over the photo.
 *
 * NOTE ON THE PHOTOGRAPH
 * The hero image is loaded from Unsplash, an external image service. It is not
 * stored in this repository. That means if the Unsplash URL ever changes or the
 * service is unavailable, the hero picture will not appear. This is a known
 * limitation, recorded in docs/session-handoff-next.md.
 *
 * The product photographs are different: those live in `client/public/products`
 * and are served by this site.
 */

import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=1200&q=85'

export default function Hero() {
  return (
    <section className="hero shell">
      <div className="hero-copy">
        {/*
          The <br/> forces the line break so the headline always reads as two
          balanced lines, and <em> gives the second half the wine colour.
        */}
        <h1>
          Soft skin.
          <br />
          <em>Quiet confidence.</em>
        </h1>

        <p>
          Thoughtfully selected creams and moisturizers for women who want simple,
          beautiful everyday skincare.
        </p>

        {/*
          This is a link, not a button, because it navigates to another part of
          the page. Using the right element means keyboard users can reach it
          and screen readers announce it correctly.
        */}
        <a className="primary" href="#shop">
          Shop the collection
          <ArrowRight size={18} />
        </a>

        <div className="hero-notes">
          <span>
            <Sparkles size={17} /> Moisture-first formulas
          </span>
          <span>
            <ShieldCheck size={17} /> Carefully curated
          </span>
        </div>
      </div>

      <div className="hero-media">
        <img src={HERO_IMAGE_URL} alt="Woman applying skincare cream" />

        <div className="hero-card">
          <span>Daily ritual</span>
          <strong>Glow, without the fuss.</strong>
        </div>
      </div>
    </section>
  )
}
