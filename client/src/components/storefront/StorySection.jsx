/**
 * STORY SECTION
 * =============
 *
 * WHAT THIS COMPONENT IS
 * The two-column brand block near the bottom of the shop: a photograph on the
 * left and a short explanation of the Veloura approach on the right.
 *
 * This component has no state and no logic. It is purely content. It is a
 * separate file mainly so that App.jsx reads as a list of page sections, which
 * makes the overall page structure obvious at a glance.
 *
 * NOTE ON THE PHOTOGRAPH
 * Like the hero image, this one is loaded from Unsplash rather than stored in
 * this repository. See docs/session-handoff-next.md.
 */

import { ArrowRight } from 'lucide-react'

const STORY_IMAGE_URL =
  'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1000&q=85'

export default function StorySection() {
  return (
    <section className="story shell" id="story">
      <div className="story-image">
        <img src={STORY_IMAGE_URL} alt="Skincare products arranged on a vanity" />
      </div>

      <div className="story-copy">
        <p className="section-label">Veloura</p>

        <h2>Skincare should feel like care, not homework.</h2>

        <p>
          We keep the routine simple: rich textures, useful ingredients and products
          that feel beautiful on your shelf and comfortable on your skin.
        </p>

        <a href="#shop">
          Explore all products
          <ArrowRight size={17} />
        </a>
      </div>
    </section>
  )
}
