import { FiArrowRight, FiCalendar, FiEdit3, FiPaperclip, FiUploadCloud } from 'react-icons/fi'

function OpportunityBidForm({
  activeBidIntentId,
  intentOptions,
  onIntentChange,
  onSubmitProposal,
}) {
  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    onSubmitProposal({
      currency: formData.get('currency'),
      deliveryTime: formData.get('deliveryTime'),
      message: formData.get('message'),
      price: formData.get('price'),
      pricingType: formData.get('pricingType'),
      proposal: formData.get('proposal'),
    })
  }

  return (
    <form className="opportunities-bid-form-card" aria-label="Submit proposal" onSubmit={handleSubmit}>
      <header>
        <h2>Submit Your Proposal</h2>
        <p>Tell the client why you are the best fit for this gig.</p>
      </header>

      <div className="opportunities-bid-field">
        <span className="opportunities-bid-field-label">Proposal focus</span>
        <p className="opportunities-bid-field-hint">
          Choose how this work should be evaluated in your Zumbarl journey.
        </p>
        <div className="opportunities-bid-intent-grid" role="group" aria-label="Proposal focus">
          {intentOptions.map((intent) => {
            const isActive = activeBidIntentId === intent.id

            return (
              <button
                key={intent.id}
                type="button"
                className={`opportunities-bid-intent-option${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
                onClick={() => onIntentChange(intent.id)}
              >
                <strong>{intent.label}</strong>
                <span>{intent.summary}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="opportunities-bid-field">
        <div className="opportunities-bid-field-head">
          <label htmlFor="bid-proposal">Your Proposal</label>
          <button type="button" className="opportunities-bid-mini-btn">
            <FiEdit3 aria-hidden="true" />
            Use AI to improve
          </button>
        </div>

        <p className="opportunities-bid-field-hint">
          Describe your approach, relevant experience and why the client should choose you.
        </p>

        <div className="opportunities-bid-editor">
          <div className="opportunities-bid-editor-toolbar" aria-hidden="true">
            <button type="button">B</button>
            <button type="button">I</button>
            <button type="button">U</button>
            <button type="button">•</button>
            <button type="button">1.</button>
            <button type="button">
              <FiPaperclip />
            </button>
          </div>
          <textarea
            id="bid-proposal"
            name="proposal"
            placeholder="Write your proposal here..."
            maxLength={1500}
            required
          />
          <p className="opportunities-bid-counter">0 / 1500</p>
        </div>
      </div>

      <div className="opportunities-bid-field">
        <label htmlFor="bid-price">Your Price</label>
        <p className="opportunities-bid-field-hint">Set your price for this gig.</p>

        <div className="opportunities-bid-price-row">
          <select defaultValue="KES" aria-label="Currency" name="currency">
            <option value="KES">KES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          <input id="bid-price" name="price" type="text" placeholder="Enter your price" />
          <select defaultValue="Fixed Price" aria-label="Pricing type" name="pricingType">
            <option value="fixed">Fixed Price</option>
            <option value="per hour">Per Hour</option>
            <option value="per day">Per Day</option>
            <option value="per month">Per Month</option>
          </select>
        </div>
      </div>

      <div className="opportunities-bid-field opportunities-bid-delivery-field">
        <label htmlFor="bid-delivery-time">Delivery Time</label>
        <p className="opportunities-bid-field-hint">How long will it take to complete this gig?</p>

        <div className="opportunities-bid-delivery-row">
          <FiCalendar aria-hidden="true" />
          <select id="bid-delivery-time" name="deliveryTime" defaultValue="Select delivery time">
            <option value="">Select delivery time</option>
            <option value="1 day">1 day</option>
            <option value="2-3 days">2-3 days</option>
            <option value="4-7 days">4-7 days</option>
            <option value="1-2 weeks">1-2 weeks</option>
          </select>
        </div>
      </div>

      <div className="opportunities-bid-field">
        <label htmlFor="bid-attachments">Attachments (Optional)</label>
        <p className="opportunities-bid-field-hint">
          Add relevant samples or documents that support your proposal.
        </p>

        <label className="opportunities-bid-dropzone" htmlFor="bid-attachments">
          <FiUploadCloud aria-hidden="true" />
          <strong>Drag &amp; drop files here or click to upload</strong>
          <span>PDF, DOC, DOCX, PPT, XLS, PNG, JPG (Max 10MB)</span>
          <input id="bid-attachments" type="file" multiple />
        </label>
      </div>

      <div className="opportunities-bid-field">
        <label htmlFor="bid-message">Add a Message (Optional)</label>
        <p className="opportunities-bid-field-hint">Add a brief message to the client.</p>
        <textarea id="bid-message" name="message" placeholder="Type your message here..." maxLength={500} />
        <p className="opportunities-bid-counter">0 / 500</p>
      </div>

      <footer className="opportunities-bid-form-foot">
        <button type="submit" className="opportunities-detail-bid-btn">
          Submit Proposal
          <FiArrowRight aria-hidden="true" />
        </button>
        <p>You can only submit one proposal for this gig.</p>
      </footer>
    </form>
  )
}

export default OpportunityBidForm
