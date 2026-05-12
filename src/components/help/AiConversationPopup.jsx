import { useEffect, useMemo, useRef, useState } from 'react'
import { HiOutlinePaperAirplane, HiOutlineSparkles, HiOutlineXMark } from 'react-icons/hi2'

function AiConversationPopup({ isOpen, onClose, seedPrompt }) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'ai-welcome',
      role: 'agent',
      text: 'Hi, I am Tonnie AI. Ask me anything about Zumbarl and campus workflows.',
    },
  ])
  const processedSeedIdRef = useRef(null)
  const messagesRef = useRef(null)
  const inputId = useMemo(() => 'help-ai-chat-input', [])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen || !messagesRef.current) {
      return
    }

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [isOpen, messages])

  useEffect(() => {
    const trimmed = seedPrompt?.text?.trim()

    if (!trimmed || processedSeedIdRef.current === seedPrompt.id) {
      return
    }

    processedSeedIdRef.current = seedPrompt.id
    const timestamp = Date.now()

    setMessages((current) => [
      ...current,
      { id: `ai-user-seed-${timestamp}`, role: 'user', text: trimmed },
      {
        id: `ai-agent-seed-${timestamp}`,
        role: 'agent',
        text: 'I received your question. I can guide you here, or you can switch to Ask a human for direct support.',
      },
    ])
  }, [seedPrompt])

  const canSend = draft.trim().length > 0

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = draft.trim()

    if (!trimmed) {
      return
    }

    const timestamp = Date.now()

    setMessages((current) => [
      ...current,
      { id: `ai-user-${timestamp}`, role: 'user', text: trimmed },
      {
        id: `ai-agent-${timestamp}`,
        role: 'agent',
        text: 'Thanks. I am analyzing that. For account-specific issues, use Ask a human.',
      },
    ])
    setDraft('')
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="help-ai-modal" role="dialog" aria-modal="true" aria-label="Tonnie AI conversation" onClick={onClose}>
      <section className="help-ai-modal-card" onClick={(event) => event.stopPropagation()}>
        <header className="help-ai-modal-header">
          <h2>
            <HiOutlineSparkles aria-hidden="true" />
            Tonnie AI
          </h2>
          <button type="button" className="help-ai-modal-close" onClick={onClose} aria-label="Close AI conversation">
            <HiOutlineXMark aria-hidden="true" />
          </button>
        </header>

        <div ref={messagesRef} className="help-ai-messages">
          {messages.map((message) => (
            <p
              key={message.id}
              className={`help-ai-message${message.role === 'user' ? ' is-user' : ' is-agent'}`}
            >
              {message.text}
            </p>
          ))}
        </div>

        <form className="help-ai-form" onSubmit={handleSubmit}>
          <label htmlFor={inputId} className="help-visually-hidden">
            Message Tonnie AI
          </label>
          <input
            id={inputId}
            type="text"
            placeholder="Continue conversation..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" disabled={!canSend} aria-label="Send message to Tonnie AI">
            <HiOutlinePaperAirplane aria-hidden="true" />
          </button>
        </form>
      </section>
    </div>
  )
}

export default AiConversationPopup
