import { useState } from 'react'
import {
  FiCheckCircle,
  FiImage,
  FiMapPin,
  FiPackage,
  FiShoppingBag,
  FiShoppingCart,
  FiStar,
  FiTag,
  FiTruck,
} from 'react-icons/fi'
import { WorkflowStatusPanel } from '../../workflows/components/WorkflowStatusPanel'
import {
  MARKETPLACE_LISTING_MOCK,
  MARKETPLACE_ORDER_MOCK,
  MARKETPLACE_PICKUP_SPOTS,
  MARKETPLACE_SHOP_MOCK,
  createInitialMarketplaceWorkflowState,
} from '../../workflows/workflowData'

function MarketplaceWorkflowPanel() {
  const [state, setState] = useState(createInitialMarketplaceWorkflowState)
  const patchState = (patch) => setState((current) => ({ ...current, ...patch }))
  const promoReady = state.galleryUpdated && state.promoPublished
  const canScore = state.delivered && state.buyerReviewed

  return (
    <section className="marketplace-workflow-shell" aria-label="Marketplace workflow">
      <div className="marketplace-workflow-main">
        <WorkflowStatusPanel
          title="Marketplace gates"
          items={[
            { label: 'Shop created', status: state.shopCreated ? 'done' : 'blocked', detail: state.shopCreated ? `${MARKETPLACE_SHOP_MOCK.name} is live at ${MARKETPLACE_SHOP_MOCK.handle}.` : 'Create seller shop, campus, policies, and pickup spots.' },
            { label: 'Listing published', status: state.listingPublished ? 'done' : 'blocked', detail: state.listingPublished ? `${MARKETPLACE_LISTING_MOCK.title} is discoverable.` : 'Publish product or service details with stock and price.' },
            { label: 'Gallery and promo', status: promoReady ? 'done' : 'blocked', detail: `${MARKETPLACE_LISTING_MOCK.galleryCount} gallery slots, Connect promo ${state.promoPublished ? 'published' : 'pending'}.` },
            { label: 'Buyer cart', status: state.cartAdded ? 'done' : 'blocked', detail: state.cartAdded ? `${MARKETPLACE_ORDER_MOCK.item} added to cart.` : 'Buyer adds item and reviews order rules.' },
            { label: 'Checkout paid', status: state.checkoutPaid ? 'done' : 'blocked', detail: state.checkoutPaid ? `${MARKETPLACE_ORDER_MOCK.total} paid for ${state.selectedPickupSpot}.` : 'Buyer chooses approved campus handoff and pays.' },
            { label: 'Seller confirmation', status: state.sellerConfirmed ? 'done' : 'blocked', detail: state.sellerConfirmed ? 'Seller confirmed stock and pickup window.' : 'Seller must confirm availability before packaging.' },
            { label: 'Packaging', status: state.packaged ? 'done' : 'blocked', detail: state.packaged ? 'Item packed and ready for campus handoff.' : 'Seller prepares item or service slot.' },
            { label: 'Campus handoff', status: state.delivered ? 'done' : state.handoffReady ? 'done' : 'blocked', detail: state.delivered ? 'Buyer confirmed delivery.' : state.handoffReady ? `${state.selectedPickupSpot} handoff is ready.` : 'Move order to approved pickup/drop-off.' },
            { label: 'Review and score', status: state.scoreUpdated ? 'done' : 'blocked', detail: state.scoreUpdated ? `Shop score ${MARKETPLACE_SHOP_MOCK.nextScore}, buyer score ${MARKETPLACE_ORDER_MOCK.buyerNextScore}.` : 'Buyer review and score update complete the loop.' },
          ]}
          actions={(
            <>
              <button type="button" className="marketplace-soft-btn" disabled={state.shopCreated} onClick={() => patchState({ shopCreated: true })}>
                <FiShoppingBag aria-hidden="true" />
                Create shop
              </button>
              <button type="button" className="marketplace-soft-btn" disabled={!state.shopCreated || state.listingPublished} onClick={() => patchState({ listingPublished: true })}>
                <FiTag aria-hidden="true" />
                Publish listing
              </button>
              <button type="button" className="marketplace-soft-btn" disabled={!state.listingPublished || state.galleryUpdated} onClick={() => patchState({ galleryUpdated: true })}>
                <FiImage aria-hidden="true" />
                Update gallery
              </button>
              <button type="button" className="marketplace-soft-btn" disabled={!state.galleryUpdated || state.promoPublished} onClick={() => patchState({ promoPublished: true })}>
                <FiStar aria-hidden="true" />
                Publish promo
              </button>
              <button type="button" className="marketplace-primary-btn" disabled={!promoReady || state.cartAdded} onClick={() => patchState({ cartAdded: true })}>
                <FiShoppingCart aria-hidden="true" />
                Add to cart
              </button>
              <button type="button" className="marketplace-primary-btn" disabled={!state.cartAdded || state.checkoutPaid} onClick={() => patchState({ checkoutPaid: true })}>
                <FiCheckCircle aria-hidden="true" />
                Pay checkout
              </button>
              <button type="button" className="marketplace-soft-btn" disabled={!state.checkoutPaid || state.sellerConfirmed} onClick={() => patchState({ sellerConfirmed: true })}>
                <FiShoppingBag aria-hidden="true" />
                Seller confirm
              </button>
              <button type="button" className="marketplace-soft-btn" disabled={!state.sellerConfirmed || state.packaged} onClick={() => patchState({ packaged: true })}>
                <FiPackage aria-hidden="true" />
                Package item
              </button>
              <button type="button" className="marketplace-soft-btn" disabled={!state.packaged || state.handoffReady} onClick={() => patchState({ handoffReady: true })}>
                <FiMapPin aria-hidden="true" />
                Ready handoff
              </button>
              <button type="button" className="marketplace-soft-btn" disabled={!state.handoffReady || state.delivered} onClick={() => patchState({ delivered: true })}>
                <FiTruck aria-hidden="true" />
                Confirm delivered
              </button>
              <button type="button" className="marketplace-soft-btn" disabled={!state.delivered || state.buyerReviewed} onClick={() => patchState({ buyerReviewed: true })}>
                <FiStar aria-hidden="true" />
                Buyer review
              </button>
              <button type="button" className="marketplace-primary-btn" disabled={!canScore || state.scoreUpdated} onClick={() => patchState({ scoreUpdated: true })}>
                <FiCheckCircle aria-hidden="true" />
                Update scores
              </button>
            </>
          )}
        />

        <div className="marketplace-workflow-grid">
          <article className="marketplace-workflow-card">
            <span>Seller shop</span>
            <h2>{MARKETPLACE_SHOP_MOCK.name}</h2>
            <p>{MARKETPLACE_SHOP_MOCK.category}</p>
            <dl>
              <div><dt>Handle</dt><dd>{MARKETPLACE_SHOP_MOCK.handle}</dd></div>
              <div><dt>Campus</dt><dd>{MARKETPLACE_SHOP_MOCK.campus}</dd></div>
              <div><dt>Shop score</dt><dd>{state.scoreUpdated ? MARKETPLACE_SHOP_MOCK.nextScore : MARKETPLACE_SHOP_MOCK.score}</dd></div>
            </dl>
            <ul>
              {MARKETPLACE_SHOP_MOCK.policies.map((policy) => <li key={policy}>{policy}</li>)}
            </ul>
          </article>

          <article className="marketplace-workflow-card">
            <span>Listing</span>
            <h2>{MARKETPLACE_LISTING_MOCK.title}</h2>
            <p>{MARKETPLACE_LISTING_MOCK.type} - {MARKETPLACE_LISTING_MOCK.availability}</p>
            <dl>
              <div><dt>Price</dt><dd>{MARKETPLACE_LISTING_MOCK.price}</dd></div>
              <div><dt>Stock</dt><dd>{MARKETPLACE_LISTING_MOCK.stock}</dd></div>
              <div><dt>Gallery</dt><dd>{state.galleryUpdated ? `${MARKETPLACE_LISTING_MOCK.galleryCount} updated` : 'Draft'}</dd></div>
            </dl>
            <p className="marketplace-workflow-note">{state.promoPublished ? MARKETPLACE_LISTING_MOCK.promo : 'Promo is pending.'}</p>
          </article>

          <article className="marketplace-workflow-card">
            <span>Order progress</span>
            <h2>{MARKETPLACE_ORDER_MOCK.orderId}</h2>
            <p>{MARKETPLACE_ORDER_MOCK.buyer} buying from {MARKETPLACE_ORDER_MOCK.seller}</p>
            <div className="marketplace-handoff-select">
              <label htmlFor="marketplace-pickup-spot">Campus handoff spot</label>
              <select
                id="marketplace-pickup-spot"
                value={state.selectedPickupSpot}
                onChange={(event) => patchState({ selectedPickupSpot: event.target.value })}
                disabled={state.checkoutPaid}
              >
                {MARKETPLACE_PICKUP_SPOTS.map((spot) => <option key={spot} value={spot}>{spot}</option>)}
              </select>
            </div>
            <ol className="marketplace-order-progress">
              {[
                ['Paid', state.checkoutPaid],
                ['Seller confirmed', state.sellerConfirmed],
                ['Packaged', state.packaged],
                ['Handoff ready', state.handoffReady],
                ['Delivered', state.delivered],
                ['Reviewed', state.buyerReviewed],
              ].map(([label, done]) => (
                <li key={label} className={done ? 'is-done' : ''}>{label}</li>
              ))}
            </ol>
          </article>
        </div>
      </div>
    </section>
  )
}

export default MarketplaceWorkflowPanel
