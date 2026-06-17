import { useEffect, useMemo, useRef, useState } from 'react'
import { HiOutlinePaperAirplane, HiOutlineXMark } from 'react-icons/hi2'

function SupportChatWidget({ isOpen, onClose }) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'support-welcome',
      role: 'agent',
      text: 'Hi, this is Zumbarl support. Tell us what you need help with.',
    },
  ])
  const messagesRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !messagesRef.current) {
      return
    }

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [isOpen, messages])

  const canSend = draft.trim().length > 0
  const inputId = useMemo(() => 'support-chat-input', [])

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = draft.trim()

    if (!trimmed) {
      return
    }

    const timestamp = Date.now()

    setMessages((current) => [
      ...current,
      { id: `user-${timestamp}`, role: 'user', text: trimmed },
      {
        id: `agent-${timestamp}`,
        role: 'agent',
        text: 'Thanks. A support teammate will follow up here shortly.',
      },
    ])
    setDraft('')
  }

  if (!isOpen) {
    return null
  }

  return (
    <aside className="support-chat" role="dialog" aria-modal="false" aria-label="Tech support chat">
      <header className="support-chat-header">
        <h2>Tech support</h2>
        <button type="button" className="support-chat-close" onClick={onClose} aria-label="Close support chat">
          <HiOutlineXMark aria-hidden="true" />
        </button>
      </header>

      <div ref={messagesRef} className="support-chat-messages">
        {messages.map((message) => (
          <p
            key={message.id}
            className={`support-chat-message${message.role === 'user' ? ' is-user' : ' is-agent'}`}
          >
            {message.text}
          </p>
        ))}
      </div>

      <form className="support-chat-form" onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="help-visually-hidden">
          Message support
        </label>
        <input
          id={inputId}
          type="text"
          placeholder="Type a message..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" disabled={!canSend} aria-label="Send message to support">
          <HiOutlinePaperAirplane aria-hidden="true" />
        </button>
      </form>
    </aside>
  )
}

export default SupportChatWidget
