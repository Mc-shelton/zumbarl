import { FiDownload, FiFileText, FiInfo, FiMessageCircle, FiPaperclip, FiPhone, FiSend, FiSmile, FiVideo } from 'react-icons/fi'
import { messages, project } from '../data/mockWorkspace'

function MessagesPanel() {
  return (
    <section className="project-messages-grid">
      <aside className="project-message-list project-card">
        <h2>Messages</h2>
        <label>
          <FiMessageCircle aria-hidden="true" />
          <input type="search" placeholder="Search messages" />
        </label>
        {['Thanks Mercy! I will start working...', 'Shared a file', 'Hi Brian, welcome to the project!', 'Project activity log updated'].map((item, index) => (
          <button key={item} type="button" className={index === 0 ? 'is-active' : ''}>
            <img src="/assets/index/bee_nobg.png" alt="" />
            <span>
              <strong>{index === 3 ? 'Zumbarl Support' : project.owner}</strong>
              <em>{item}</em>
            </span>
            <small>{index === 0 ? '11:02 AM' : index === 1 ? 'Yesterday' : 'Apr 28'}</small>
          </button>
        ))}
      </aside>

      <section className="project-chat project-card">
        <header>
          <img src="/assets/index/bee_nobg.png" alt="" />
          <div>
            <h2>{project.owner}</h2>
            <p>Online</p>
          </div>
          <button type="button" aria-label="Call">
            <FiPhone aria-hidden="true" />
          </button>
          <button type="button" aria-label="Video call">
            <FiVideo aria-hidden="true" />
          </button>
          <button type="button" aria-label="Conversation info">
            <FiInfo aria-hidden="true" />
          </button>
        </header>

        <div className="project-chat-body">
          <p className="project-chat-start">This is the beginning of your conversation for {project.title}.</p>
          {messages.map((message) => (
            <article key={`${message.author}-${message.date}`} className={message.mine ? 'is-mine' : ''}>
              {!message.mine ? <img src="/assets/index/bee_nobg.png" alt="" /> : null}
              <div>
                <p>
                  <strong>{message.author}</strong>
                  <span>{message.date}</span>
                </p>
                <div className="project-chat-bubble">
                  {message.text}
                  {message.files ? (
                    <div className="project-chat-files">
                      {message.files.map((file) => (
                        <button key={file.name} type="button">
                          <FiFileText aria-hidden="true" />
                          <span>
                            <strong>{file.name}</strong>
                            <em>{file.meta}</em>
                          </span>
                          <FiDownload aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer>
          <input type="text" placeholder="Type a message..." />
          <button type="button" aria-label="Attach file">
            <FiPaperclip aria-hidden="true" />
          </button>
          <button type="button" aria-label="Add reaction">
            <FiSmile aria-hidden="true" />
          </button>
          <button type="button" className="project-primary-btn" aria-label="Send message">
            <FiSend aria-hidden="true" />
          </button>
        </footer>
      </section>
    </section>
  )
}

export default MessagesPanel
