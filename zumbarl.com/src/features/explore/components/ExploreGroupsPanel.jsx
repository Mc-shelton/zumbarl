import { FiShoppingCart, FiUsers } from 'react-icons/fi'
import { CONNECT_GROUPS } from '../../workflows/workflowData'

function ExploreGroupsPanel({ activeGroup, onPatchState, state, walletSaved }) {
  return (
    <section className="connect-groups-panel explore-connect-groups-panel" aria-label="Groups, clubs, and chamas">
      <header>
        <div>
          <h2>Groups, clubs, and chamas</h2>
          <p>Join useful spaces, contribute to chamas, and keep wallet and safety context visible.</p>
        </div>
      </header>

      <div className="connect-group-grid">
        {CONNECT_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            className={group.id === state.activeGroupId ? 'is-active' : ''}
            onClick={() => onPatchState({ activeGroupId: group.id })}
          >
            <span>{group.type}</span>
            <strong>{group.title}</strong>
            <em>{group.members} members</em>
          </button>
        ))}
      </div>

      <article className="connect-group-detail">
        <div>
          <span>{activeGroup.type}</span>
          <h3>{activeGroup.title}</h3>
          <p>{activeGroup.purpose}</p>
          <ul>
            {activeGroup.rules.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </div>
        <aside>
          <strong>{activeGroup.cadence}</strong>
          <button type="button" className="connect-primary-btn" disabled={state.groupJoined} onClick={() => onPatchState({ groupJoined: true })}>
            <FiUsers aria-hidden="true" />
            Join group
          </button>
        </aside>
      </article>

      {activeGroup.wallet ? (
        <article className="connect-wallet-card">
          <div>
            <span>Chama wallet</span>
            <h3>KES {walletSaved.toLocaleString()} saved</h3>
            <p>Goal: KES {activeGroup.wallet.goal.toLocaleString()} - Next due: {activeGroup.wallet.nextDue}</p>
          </div>
          <button
            type="button"
            className="connect-primary-btn"
            disabled={!state.groupJoined || state.contributionMade}
            onClick={() => onPatchState({ contributionMade: true })}
          >
            <FiShoppingCart aria-hidden="true" />
            Contribute KES 500
          </button>
          <ul>
            {(state.contributionMade
              ? [{ name: 'Brian Mwangi', amount: 'KES 500', date: 'Just now' }, ...activeGroup.wallet.ledger]
              : activeGroup.wallet.ledger
            ).map((entry) => (
              <li key={`${entry.name}-${entry.date}`}>
                <strong>{entry.name}</strong>
                <span>{entry.amount} - {entry.date}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  )
}

export default ExploreGroupsPanel
