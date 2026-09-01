import { useEffect, useMemo, useState } from 'react'
import {
  FiArrowRight,
  FiBookOpen,
  FiCheck,
  FiChevronRight,
  FiHeart,
  FiLock,
  FiMessageCircle,
  FiPlus,
  FiSearch,
  FiShield,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import CampusTopActions from '../components/layout/CampusTopActions'
import Seo from '../components/Seo'
import { CAMPUS_VIEWER } from '../features/campus/constants'
import {
  contributeToCommunityChama,
  createCommunityGroup,
  joinCommunityGroup,
  listCommunityGroups,
} from '../features/community/services/communityService'
import { SUPPORT_CIRCLE_VISUALS } from '../features/community/supportCircleVisuals'
import { useViewerProfile } from '../features/auth/viewerProfile'
import '../styles/campus.css'
import '../styles/community.css'

const CATEGORY_META = {
  group: { label: 'Community', Icon: FiUsers, tone: 'purple' },
  club: { label: 'Club', Icon: FiBookOpen, tone: 'orange' },
  association: { label: 'Association', Icon: FiUsers, tone: 'orange' },
  event: { label: 'Event circle', Icon: FiMessageCircle, tone: 'green' },
  'support-circle': { label: 'Support circle', Icon: FiHeart, tone: 'rose' },
  chama: { label: 'Chama', Icon: FiShield, tone: 'teal' },
}

const VIEW_OPTIONS = [
  { id: 'discover', label: 'Discover' },
  { id: 'mine', label: 'My pages' },
  { id: 'clubs', label: 'Clubs & societies' },
]

const SUPPORT_BOUNDARIES = [
  'Be kind and never pressure someone to share identifying details.',
  'No diagnosis, harassment, fundraising or promotion inside support circles.',
  'Urgent safety concerns may be escalated to trained support staff.',
]

const EMPTY_GROUP = {
  name: '',
  category: 'club',
  purpose: '',
  rulesText: 'Respect every member\nKeep shared stories within the circle',
  privacyMode: 'named',
  contributionAmount: '',
  contributionCadence: 'Monthly',
  splashImageUrl: SUPPORT_CIRCLE_VISUALS[0].url,
}

function createSupportAlias() {
  const adjectives = ['Calm', 'Brave', 'Kind', 'Quiet', 'Hopeful', 'Steady']
  const nouns = ['Bee', 'Acacia', 'Sunbird', 'Baobab', 'Star', 'River']
  const seed = Date.now()
  return `${adjectives[seed % adjectives.length]} ${nouns[Math.floor(seed / 7) % nouns.length]} ${String(seed).slice(-2)}`
}

function normalizeGroup(group) {
  const category = CATEGORY_META[group.category] ? group.category : 'group'
  return {
    ...group,
    category,
    campus: group.campus || 'Campus-wide',
    memberCount: Number(group.memberCount || 0),
    rules: Array.isArray(group.rules) ? group.rules : [],
    privacyMode: group.privacyMode || (category === 'support-circle' ? 'alias' : 'named'),
    isJoined: Boolean(group.viewerMembership),
  }
}

function isDeferredCommunity(group) {
  return group.category === 'chama' || (group.category === 'association' && /welfare/i.test(group.name || ''))
}

function CommunityPage() {
  const viewer = useViewerProfile(CAMPUS_VIEWER)
  const [groups, setGroups] = useState([])
  const [activeView, setActiveView] = useState('discover')
  const [query, setQuery] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [workingGroupId, setWorkingGroupId] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [groupDraft, setGroupDraft] = useState(EMPTY_GROUP)
  const [aliasGroup, setAliasGroup] = useState(null)
  const [supportAlias, setSupportAlias] = useState(createSupportAlias)
  const [isAliasModeActive, setIsAliasModeActive] = useState(false)

  useEffect(() => {
    let active = true
    listCommunityGroups()
      .then((response) => {
        if (!active) return
        const nextGroups = (response?.data || []).map(normalizeGroup)
        setGroups(nextGroups)
        setSelectedGroupId(nextGroups[0]?.id || '')
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Community spaces could not be loaded.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  const counts = useMemo(() => ({
    joined: groups.filter((group) => group.isJoined && group.category !== 'support-circle' && !isDeferredCommunity(group)).length,
    pages: groups.filter((group) => group.category !== 'support-circle' && !isDeferredCommunity(group)).length,
    clubs: groups.filter((group) => ['club', 'association'].includes(group.category) && !isDeferredCommunity(group)).length,
  }), [groups])

  const visibleGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return groups.filter((group) => {
      if (group.category === 'support-circle') return false
      if (isDeferredCommunity(group)) return false
      if (activeView === 'mine' && !group.isJoined) return false
      if (activeView === 'clubs' && !['club', 'association'].includes(group.category)) return false
      if (!normalizedQuery) return true
      return [group.name, group.purpose, group.campus, group.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    })
  }, [activeView, groups, query])

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || visibleGroups[0] || null
  const joinedGroups = groups.filter((group) => group.isJoined && group.category !== 'support-circle' && !isDeferredCommunity(group))

  function patchGroup(groupId, patch) {
    setGroups((current) => current.map((group) => (group.id === groupId ? { ...group, ...patch } : group)))
  }

  async function joinGroup(group, membership = { participationMode: 'named' }) {
    setWorkingGroupId(group.id)
    setError('')
    setNotice('')
    try {
      const viewerMembership = await joinCommunityGroup(group.id, membership)
      patchGroup(group.id, {
        isJoined: true,
        viewerMembership,
        memberCount: group.memberCount + (group.isJoined ? 0 : 1),
      })
      setNotice(`You joined ${group.name}.`)
      setAliasGroup(null)
      if (membership.participationMode === 'alias') setIsAliasModeActive(true)
    } catch (requestError) {
      setError(requestError.message || 'The circle could not be joined.')
    } finally {
      setWorkingGroupId('')
    }
  }

  function requestJoin(group) {
    setSelectedGroupId(group.id)
    if (group.category === 'support-circle' && group.privacyMode === 'alias') {
      setAliasGroup(group)
      return
    }
    joinGroup(group)
  }

  async function createGroup(event) {
    event.preventDefault()
    setWorkingGroupId('create')
    setError('')
    setNotice('')
    try {
      const rules = groupDraft.rulesText.split('\n').map((rule) => rule.trim()).filter(Boolean)
      const created = await createCommunityGroup({
        name: groupDraft.name.trim(),
        category: groupDraft.category,
        purpose: groupDraft.purpose.trim(),
        rules,
        campus: viewer.campus || viewer.meta || 'Campus-wide',
        privacyMode: groupDraft.category === 'support-circle' ? groupDraft.privacyMode : 'named',
        moderationOwner: viewer.name,
        safetyBoundaries: groupDraft.category === 'support-circle' ? SUPPORT_BOUNDARIES : [],
        ...(groupDraft.category === 'support-circle' ? { splashImageUrl: groupDraft.splashImageUrl } : {}),
        ...(groupDraft.category === 'chama' ? {
          contributionAmount: Number(groupDraft.contributionAmount),
          contributionCadence: groupDraft.contributionCadence,
        } : {}),
      })
      const normalized = normalizeGroup({ ...created, memberCount: 0 })
      setGroups((current) => [normalized, ...current])
      setSelectedGroupId(normalized.id)
      setGroupDraft(EMPTY_GROUP)
      setIsCreateOpen(false)
      setNotice(`${normalized.name} is ready for its first members.`)
    } catch (requestError) {
      setError(requestError.message || 'The community space could not be created.')
    } finally {
      setWorkingGroupId('')
    }
  }

  async function contribute(group) {
    const amount = Number(group.contributionAmount || 500)
    setWorkingGroupId(group.id)
    setError('')
    try {
      await contributeToCommunityChama(group.id, amount)
      patchGroup(group.id, { walletBalance: Number(group.walletBalance || 0) + amount })
      setNotice(`KES ${amount.toLocaleString()} was added to ${group.name}.`)
    } catch (requestError) {
      setError(requestError.message || 'The contribution could not be recorded.')
    } finally {
      setWorkingGroupId('')
    }
  }

  return (
    <main className="campus-page community-page">
      <Seo
        title="Community, Clubs & Support | Zumbarl"
        description="Join campus clubs, peer communities, support circles and chamas with clear safety and privacy choices."
        path="/campus/community"
      />

      <div className="campus-stage">
        <div className="campus-shell community-shell">
          <CampusSidebar activeItemId="community" />

          <section className="campus-main community-main">
            <header className="community-topbar">
              <div className="community-heading"><span>Campus belonging</span><h1>Community</h1></div>
              <CampusTopActions
                className="community-top-actions"
                primaryAction={<button type="button" className="community-create-btn" onClick={() => setIsCreateOpen(true)}><FiPlus /> Create page</button>}
                showUserButton={false}
              />
            </header>

            <section className="community-hero">
              <div>
                <span className="community-kicker">Campus life, led by students.</span>
                <h2>Find your people.<br />Build something together.</h2>
                <p>Discover clubs, associations and student chamas with their own pages, leadership, membership and campus identity.</p>
                <div className="community-hero-actions">
                  <button type="button" onClick={() => setActiveView('clubs')}>Explore clubs <FiArrowRight /></button>
                  <button type="button" onClick={() => setIsCreateOpen(true)}><FiPlus /> Create a page</button>
                </div>
              </div>
              <aside>
                <article><strong>{counts.joined}</strong><span>Your pages</span></article>
                <article><strong>{counts.clubs}</strong><span>Clubs & societies</span></article>
                <article><strong>{counts.pages}</strong><span>Community pages</span></article>
              </aside>
            </section>

            <Link className="community-wellbeing-entry" to="/campus/community/wellbeing">
              <span className="community-wellbeing-icon"><FiHeart /></span>
              <div><small>Campus wellbeing</small><strong>Need support, a private check-in, or someone to talk to?</strong><p>Enter a protected space for moderated support circles and counselor access.</p></div>
              <em>Open wellbeing <FiArrowRight /></em>
            </Link>

            <section className="community-coming-soon" aria-label="Upcoming community features">
              <div><span>Coming later</span><strong>Chamas &amp; student welfare</strong><p>We’re still shaping the safeguards, governance, and campus model before these become active features.</p></div>
              <em>In product design</em>
            </section>

            {isAliasModeActive ? (
              <section className="community-alias-banner">
                <span><FiLock /><strong>Alias mode is on</strong> You appear to support-circle members as {supportAlias}.</span>
                <button type="button" onClick={() => setIsAliasModeActive(false)}>Leave alias mode</button>
              </section>
            ) : null}

            <nav className="community-view-tabs" aria-label="Community views">
              {VIEW_OPTIONS.map((option) => (
                <button key={option.id} type="button" className={activeView === option.id ? 'is-active' : ''} onClick={() => setActiveView(option.id)}>
                  {option.label}{option.id === 'mine' && counts.joined ? <span>{counts.joined}</span> : null}
                </button>
              ))}
            </nav>

            <section className="community-directory">
              <header>
                <div className="community-directory-heading"><span>{activeView === 'mine' ? 'Your memberships' : activeView === 'clubs' ? 'Student life' : 'Around your campus'}</span><h2>{activeView === 'mine' ? 'Your pages' : activeView === 'clubs' ? 'Clubs & societies' : 'Discover pages'}</h2></div>
                <label><FiSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search communities..." /></label>
              </header>

              {error ? <p className="community-feedback is-error">{error}</p> : null}
              {notice ? <p className="community-feedback is-notice">{notice}</p> : null}

              {isLoading ? (
                <div className="community-loading"><span /><span /><span /></div>
              ) : visibleGroups.length ? (
                <div className="community-group-grid">
                  {visibleGroups.map((group) => {
                    const meta = CATEGORY_META[group.category]
                    const Icon = meta.Icon
                    return (
                      <article key={group.id} className={`community-group-card tone-${meta.tone}${selectedGroup?.id === group.id ? ' is-selected' : ''}`} onClick={() => setSelectedGroupId(group.id)}>
                        <header><span><Icon /></span><div><small>{meta.label}</small><strong>{group.name}</strong></div>{group.category === 'support-circle' && group.privacyMode === 'alias' ? <em><FiLock /> Alias</em> : null}</header>
                        <p>{group.purpose}</p>
                        <div className="community-group-facts"><span><FiUsers /> {group.memberCount} members</span><span>{group.campus}</span></div>
                        <footer>
                          {group.isJoined ? <span className="community-member-state"><FiCheck /> Member</span> : <button type="button" disabled={workingGroupId === group.id} onClick={(event) => { event.stopPropagation(); requestJoin(group) }}>{workingGroupId === group.id ? 'Joining…' : group.category === 'support-circle' && group.privacyMode === 'alias' ? 'Join with alias' : 'Join circle'}</button>}
                          {group.category === 'chama' && group.isJoined ? <button type="button" className="is-contribute" disabled={workingGroupId === group.id} onClick={(event) => { event.stopPropagation(); contribute(group) }}>Contribute</button> : null}
                          <button type="button" className="community-card-open" aria-label={`View ${group.name}`}><FiChevronRight /></button>
                        </footer>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <section className="community-empty"><FiUsers /><h3>{activeView === 'mine' ? 'Your first community starts here' : 'No matching pages yet'}</h3><p>{activeView === 'mine' ? 'Join a club, association or chama and it will appear here.' : 'Try another search or create a campus page.'}</p><button type="button" onClick={() => setIsCreateOpen(true)}>Create page</button></section>
              )}
            </section>
          </section>

          <aside className="campus-rail community-rail">
            <section className="community-rail-card is-selected">
              <span>Page snapshot</span>
              {selectedGroup ? <><h2>{selectedGroup.name}</h2><p>{selectedGroup.purpose}</p><dl><div><dt>Members</dt><dd>{selectedGroup.memberCount}</dd></div><div><dt>Campus</dt><dd>{selectedGroup.campus}</dd></div><div><dt>Identity</dt><dd>{selectedGroup.privacyMode === 'alias' ? 'Alias available' : 'Named'}</dd></div></dl>{selectedGroup.rules.length ? <div className="community-rules"><strong>Before you join</strong>{selectedGroup.rules.slice(0, 3).map((rule) => <span key={rule}><FiCheck /> {rule}</span>)}</div> : null}</> : <><h2>Select a circle</h2><p>Purpose, rules and privacy choices will appear here.</p></>}
            </section>

            <section className="community-rail-card">
              <span>Your community</span><h2>{joinedGroups.length ? `${joinedGroups.length} active page${joinedGroups.length === 1 ? '' : 's'}` : 'Start with one useful page'}</h2>
              <div className="community-mini-list">{joinedGroups.slice(0, 4).map((group) => <button type="button" key={group.id} onClick={() => { setSelectedGroupId(group.id); setActiveView('mine') }}><span>{group.name.slice(0, 1)}</span><div><strong>{group.name}</strong><small>{CATEGORY_META[group.category]?.label}</small></div><FiChevronRight /></button>)}</div>
            </section>

            <section className="community-rail-card is-safety">
              <FiShield /><div><span>Community standard</span><h2>Belonging needs boundaries.</h2><p>Every circle has visible rules, a moderation owner, reporting, and campus-scoped trust.</p></div><Link to="/help">Safety & support</Link>
            </section>
          </aside>
        </div>
      </div>

      {isCreateOpen ? (
        <div className="community-modal-backdrop" role="presentation" onMouseDown={() => setIsCreateOpen(false)}>
          <form className="community-modal" onSubmit={createGroup} onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>Build belonging</span><h2>Create a community page</h2><p>Give your club, association or wellness circle a trusted campus home.</p></div><button type="button" onClick={() => setIsCreateOpen(false)} aria-label="Close"><FiX /></button></header>
            <div className="community-form-grid">
              <label><span>Page type</span><select value={groupDraft.category} onChange={(event) => setGroupDraft((current) => ({ ...current, category: event.target.value, privacyMode: event.target.value === 'support-circle' ? 'alias' : 'named', splashImageUrl: event.target.value === 'support-circle' ? (current.splashImageUrl || SUPPORT_CIRCLE_VISUALS[0].url) : current.splashImageUrl }))}><option value="club">Club</option><option value="association">Association</option><option value="support-circle">Wellness circle</option></select></label>
              <label><span>Name</span><input required minLength="2" value={groupDraft.name} onChange={(event) => setGroupDraft((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. First-Year Design Circle" /></label>
              <label className="is-wide"><span>Purpose</span><textarea required minLength="12" value={groupDraft.purpose} onChange={(event) => setGroupDraft((current) => ({ ...current, purpose: event.target.value }))} placeholder="What will members find, share or solve together?" /></label>
              {groupDraft.category === 'support-circle' ? <fieldset className="is-wide community-wellness-visual-picker"><legend>Wellness artwork</legend><p>Choose one of Zumbarl’s privacy-safe wellness illustrations. This becomes the circle banner and its post avatar.</p><div>{SUPPORT_CIRCLE_VISUALS.map((visual) => <label className={groupDraft.splashImageUrl === visual.url ? 'is-selected' : ''} key={visual.id}><input type="radio" name="support-circle-visual" value={visual.url} checked={groupDraft.splashImageUrl === visual.url} onChange={(event) => setGroupDraft((current) => ({ ...current, splashImageUrl: event.target.value }))} /><img src={visual.url} alt="" /><span><strong>{visual.label}</strong><small>{visual.description}</small></span><FiCheck /></label>)}</div></fieldset> : null}
              <label className="is-wide"><span>Member rules <small>One per line</small></span><textarea required value={groupDraft.rulesText} onChange={(event) => setGroupDraft((current) => ({ ...current, rulesText: event.target.value }))} /></label>
            </div>
            <footer><p><FiShield /> Created under {viewer.campus || 'your campus'} with {viewer.name} as moderation owner.</p><button type="submit" disabled={workingGroupId === 'create'}>{workingGroupId === 'create' ? 'Creating…' : 'Create space'} <FiArrowRight /></button></footer>
          </form>
        </div>
      ) : null}

      {aliasGroup ? (
        <div className="community-modal-backdrop" role="presentation" onMouseDown={() => setAliasGroup(null)}>
          <section className="community-modal community-alias-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span>Alias participation</span><h2>Join {aliasGroup.name}</h2><p>Other members will see your alias instead of your public profile.</p></div><button type="button" onClick={() => setAliasGroup(null)} aria-label="Close"><FiX /></button></header>
            <div className="community-alias-preview"><span>{supportAlias.slice(0, 1)}</span><div><small>You’ll appear as</small><strong>{supportAlias}</strong></div><button type="button" onClick={() => setSupportAlias(createSupportAlias())}>New alias</button></div>
            <div className="community-privacy-note"><FiShield /><p><strong>Private to members, accountable to safety.</strong>Your student identity is not shown in the circle. Authorized Zumbarl safety staff may access it only for moderation, safeguarding, or a required escalation.</p></div>
            <ul>{SUPPORT_BOUNDARIES.map((boundary) => <li key={boundary}><FiCheck /> {boundary}</li>)}</ul>
            <footer><button type="button" className="is-secondary" onClick={() => setAliasGroup(null)}>Not now</button><button type="button" disabled={workingGroupId === aliasGroup.id} onClick={() => joinGroup(aliasGroup, { participationMode: 'alias', alias: supportAlias })}>{workingGroupId === aliasGroup.id ? 'Joining…' : 'Join with this alias'} <FiArrowRight /></button></footer>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default CommunityPage
