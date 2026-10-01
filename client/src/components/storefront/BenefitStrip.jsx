/**
 * BENEFIT STRIP
 * =============
 *
 * WHAT THIS COMPONENT IS
 * The thin band of three reassurances directly under the hero:
 * fast delivery, everyday care, and secure checkout.
 *
 * WHY THE FIRST TWO ICONS ARE HARD-CODED
 * The three icons are React components from the `lucide-react` library. They
 * cannot be stored in a plain data file without also storing a component
 * reference, which reads awkwardly for someone learning the code. There are
 * only three, they never change, and writing them out makes the markup
 * obvious at a glance.
 *
 * The text, however, comes from `STOREFRONT_BENEFITS` so the wording lives in
 * one place with the other site copy.
 */

import { ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { STOREFRONT_BENEFITS } from '../../lib/constants.js'

/** The icon shown beside each benefit, matched to the text by array position. */
const BENEFIT_ICONS = [Truck, Sparkles, ShieldCheck]

export default function BenefitStrip() {
  return (
    <section className="benefit-strip" id="care">
      <div className="shell benefits">
        {STOREFRONT_BENEFITS.map((benefit, index) => {
          const Icon = BENEFIT_ICONS[index]

          return (
            <div key={benefit.title}>
              <Icon />
              <span>
                <strong>{benefit.title}</strong>
                {benefit.detail}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
