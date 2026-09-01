import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { readCampusHomeExperience, sendCampusAssistantQuery } from '../services/readCampusExperience'
import useMarketplaceSlideshow from './useMarketplaceSlideshow'
import useTypewriterPromptHint from './useTypewriterPromptHint'

const EMPTY_ARRAY = []
const DEFAULT_PROMPTS = [
  'Find weekend gigs near me',
  'What is happening on campus this week?',
  'Find affordable study resources',
]

const ASSISTANT_KIND_LABELS = {
  gig: 'Gig',
  product: 'Marketplace',
  service: 'Service',
  person: 'People',
  event: 'Event',
  resource: 'Study',
}

const SECTION_LABELS = {
  gigs: 'Gig',
  marketplace: 'Marketplace',
  services: 'Service',
  events: 'Event',
  roadmaps: 'Roadmap',
  stories: 'Story',
  posts: 'Post',
}

function toDiscoveryCard(result) {
  const label = ASSISTANT_KIND_LABELS[result.kind] || SECTION_LABELS[result.section] || 'Campus'
  return {
    ...result,
    type: label,
    summary: result.summary || result.description || result.meta || '',
    href: result.href || undefined,
    actionLabel: result.href ? (result.actionLabel || 'Open') : undefined,
    chip: label,
  }
}

function getSearchableText(item) {
  return [item.type, item.title, item.summary, item.description, item.meta, ...(Array.isArray(item.tags) ? item.tags : [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function getDiscoverySuggestions(prompt, discoveryLibrary) {
  const normalizedPrompt = prompt.trim().toLowerCase()
  if (!normalizedPrompt) return discoveryLibrary.slice(0, 5).map(toDiscoveryCard)

  const terms = normalizedPrompt.split(/\s+/).filter((term) => term.length > 2)
  const ranked = discoveryLibrary
    .map((item) => ({
      ...toDiscoveryCard(item),
      score: terms.reduce((score, term) => score + (getSearchableText(item).includes(term) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)

  return (ranked.length ? ranked : discoveryLibrary.map(toDiscoveryCard)).slice(0, 5)
}

function useCampusHomeState() {
  const navigate = useNavigate()
  const mainScrollRef = useRef(null)
  const heroCardRef = useRef(null)
  const promptInputRef = useRef(null)
  const [prompt, setPrompt] = useState('')
  const [chatMode, setChatMode] = useState(false)
  const [activePrompt, setActivePrompt] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [campusExperience, setCampusExperience] = useState(null)
  const [homeError, setHomeError] = useState('')
  const [isHomeLoading, setIsHomeLoading] = useState(true)
  const [showBackToAiButton, setShowBackToAiButton] = useState(false)
  const [assistantResults, setAssistantResults] = useState(null)
  const [assistantPrompts, setAssistantPrompts] = useState(DEFAULT_PROMPTS)
  const [assistantSource, setAssistantSource] = useState('')
  const [isAssistantThinking, setIsAssistantThinking] = useState(false)

  const assistant = campusExperience?.assistant ?? {}
  const configuredHints = chatMode ? assistant.chatPromptHints : assistant.searchPromptHints
  const activeHints = Array.isArray(configuredHints) && configuredHints.length ? configuredHints : DEFAULT_PROMPTS
  const typewriterHints = useMemo(() => activeHints, [activeHints])
  const { hintDeleting, hintText, resetHint } = useTypewriterPromptHint(typewriterHints)
  const {
    activeMarketplaceHover,
    activeMarketplaceSlide,
    handleMarketplaceHoverEnd,
    handleMarketplaceHoverStart,
  } = useMarketplaceSlideshow()

  const loadHomeExperience = useCallback(async () => {
    setIsHomeLoading(true)
    setHomeError('')
    try {
      setCampusExperience(await readCampusHomeExperience())
    } catch {
      setHomeError('We could not load your campus workspace. Check your connection and try again.')
    } finally {
      setIsHomeLoading(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true
    readCampusHomeExperience()
      .then((experience) => {
        if (isActive) setCampusExperience(experience)
      })
      .catch(() => {
        if (isActive) setHomeError('We could not load your campus workspace. Check your connection and try again.')
      })
      .finally(() => {
        if (isActive) setIsHomeLoading(false)
      })
    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const handleShortcutFocus = (event) => {
      if (!(event.metaKey || event.ctrlKey) || event.key !== '/') return
      event.preventDefault()
      promptInputRef.current?.focus()
    }
    window.addEventListener('keydown', handleShortcutFocus)
    return () => window.removeEventListener('keydown', handleShortcutFocus)
  }, [])

  const discoveryLibrary = useMemo(
    () => campusExperience?.discoveryLibrary ?? EMPTY_ARRAY,
    [campusExperience?.discoveryLibrary]
  )
  const discoverySuggestions = useMemo(() => {
    if (chatMode && Array.isArray(assistantResults)) return assistantResults.map(toDiscoveryCard)
    return getDiscoverySuggestions(chatMode ? activePrompt : '', discoveryLibrary)
  }, [activePrompt, assistantResults, chatMode, discoveryLibrary])

  const discoveryChips = useMemo(() => {
    const chips = discoverySuggestions.map((item) => item.chip).filter(Boolean)
    return [...new Set(chips)].slice(0, 5)
  }, [discoverySuggestions])

  const runAssistantPrompt = useCallback(async (rawPrompt) => {
    const trimmedPrompt = String(rawPrompt || '').trim()
    if (!trimmedPrompt || isAssistantThinking) return

    const requestId = `${Date.now()}`
    const history = chatMessages
      .filter((message) => !message.pending && message.content)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }))
    const userMessage = { id: `${requestId}-user`, role: 'user', content: trimmedPrompt }
    const pendingMessage = { id: `${requestId}-assistant`, role: 'assistant', content: '', pending: true }

    setActivePrompt(trimmedPrompt)
    setChatMode(true)
    setChatMessages((previous) => [...previous, userMessage, pendingMessage])
    setPrompt('')
    setAssistantSource('')
    setIsAssistantThinking(true)
    resetHint()

    const finishMessage = (content, { hasError = false, results = [], suggestions = [] } = {}) => {
      setChatMessages((previous) => previous.map((message) => (
        message.id === pendingMessage.id
          ? { ...message, content, pending: false, hasError, results, suggestions }
          : message
      )))
    }

    try {
      const response = await sendCampusAssistantQuery(trimmedPrompt, history)
      const results = Array.isArray(response?.results) ? response.results : []
      setAssistantResults(results)
      setAssistantPrompts(Array.isArray(response?.suggestedPrompts) && response.suggestedPrompts.length
        ? response.suggestedPrompts
        : DEFAULT_PROMPTS)
      setAssistantSource(response?.source || 'search')
      finishMessage(
        response?.reply || 'I found no live match yet. Try a more specific campus, skill, item, or date.',
        { results: results.map(toDiscoveryCard), suggestions: response?.suggestedPrompts || DEFAULT_PROMPTS }
      )
    } catch {
      const suggestions = getDiscoverySuggestions(trimmedPrompt, discoveryLibrary)
      setAssistantResults(suggestions)
      setAssistantPrompts(DEFAULT_PROMPTS)
      setAssistantSource('offline')
      finishMessage(suggestions.length
        ? 'The live search is taking a break, but these saved campus picks may still help.'
        : 'I could not reach campus search just now. Please try again in a moment.', {
        hasError: true,
        results: suggestions,
        suggestions: DEFAULT_PROMPTS,
      })
    } finally {
      setIsAssistantThinking(false)
    }
  }, [chatMessages, discoveryLibrary, isAssistantThinking, resetHint])

  const handlePromptSubmit = (event) => {
    event.preventDefault()
    runAssistantPrompt(prompt)
  }

  const resetChatSurface = () => {
    setChatMode(false)
    setActivePrompt('')
    setPrompt('')
    setChatMessages([])
    setAssistantResults(null)
    setAssistantPrompts(DEFAULT_PROMPTS)
    setAssistantSource('')
    setIsAssistantThinking(false)
    resetHint()
  }

  const handleMainScroll = (event) => {
    const scrollTop = event.currentTarget.scrollTop
    event.currentTarget.style.setProperty('--campus-header-progress', Math.min(scrollTop / 150, 1).toFixed(3))
    const heroCard = heroCardRef.current
    if (!heroCard) return
    const shouldShowBackToAi = scrollTop > heroCard.offsetTop + heroCard.offsetHeight - 120
    setShowBackToAiButton((previous) => previous === shouldShowBackToAi ? previous : shouldShowBackToAi)
  }

  const handleBackToAi = () => {
    if (!mainScrollRef.current || !heroCardRef.current) return
    mainScrollRef.current.scrollTo({
      top: Math.max(heroCardRef.current.offsetTop - 10, 0),
      behavior: 'smooth',
    })
  }

  const focusPromptInput = () => promptInputRef.current?.focus()
  const activeHint = hintText || activeHints[0] || DEFAULT_PROMPTS[0]
  const promptPlaceholder = `${chatMode ? 'Ask a follow-up: ' : 'Ask Zumbarl: '}${activeHint}${hintDeleting ? '' : '|'}`

  const openRecommendedGig = (opportunityUuid, owner, href) => {
    if (href) return navigate(href)
    const params = new URLSearchParams()
    if (typeof opportunityUuid === 'string' && opportunityUuid.trim()) params.set('opportunity', opportunityUuid)
    if (typeof owner === 'string' && owner.trim()) params.set('owner', owner)
    navigate(`/campus/opportunities?${params.toString()}`)
  }

  return {
    activeMarketplaceHover,
    activeMarketplaceSlide,
    assistantPrompts,
    assistantSource,
    chatMessages,
    chatMode,
    discoveryChips,
    discoverySuggestions,
    focusPromptInput,
    handleBackToAi,
    handleMainScroll,
    handleMarketplaceHoverEnd,
    handleMarketplaceHoverStart,
    handlePromptSubmit,
    hero: campusExperience?.hero ?? null,
    heroCardRef,
    homeError,
    isAssistantThinking,
    isHomeLoading,
    mainScrollRef,
    openRecommendedGig,
    prompt,
    promptInputRef,
    promptPlaceholder,
    quickActions: campusExperience?.quickActions ?? [],
    rail: campusExperience?.rail ?? null,
    recommendationSections: campusExperience?.recommendationSections ?? [],
    reloadHomeExperience: loadHomeExperience,
    resetChatSurface,
    runAssistantPrompt,
    setPrompt,
    showBackToAiButton,
    trustPoints: campusExperience?.trustPoints ?? [],
    viewer: campusExperience?.viewer ?? null,
  }
}

export default useCampusHomeState
