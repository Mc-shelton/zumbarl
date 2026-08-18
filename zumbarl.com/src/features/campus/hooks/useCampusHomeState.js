import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { readCampusHomeExperience, sendCampusAssistantQuery } from '../services/readCampusExperience'
import useMarketplaceSlideshow from './useMarketplaceSlideshow'
import useTypewriterPromptHint from './useTypewriterPromptHint'

const EMPTY_ARRAY = []

const ASSISTANT_KIND_LABELS = {
  gig: 'Gig',
  product: 'Product',
  service: 'Service',
  person: 'Person',
  event: 'Event',
  resource: 'Resource',
}

// Map a backend deep-search result into the discovery card shape the UI renders.
function toDiscoveryCard(result) {
  const label = ASSISTANT_KIND_LABELS[result.kind] || 'Result'
  return {
    id: result.id,
    type: label,
    title: result.title,
    summary: result.summary || result.meta || '',
    href: result.href || undefined,
    actionLabel: result.href ? 'Open' : undefined,
    chip: label,
  }
}

function getSearchableText(item) {
  return [
    item.type,
    item.title,
    item.summary,
    item.description,
    item.meta,
    ...(Array.isArray(item.tags) ? item.tags : []),
    ...(Array.isArray(item.keywords) ? item.keywords : []),
  ].filter(Boolean).join(' ').toLowerCase()
}

function getDiscoverySuggestions(prompt, discoveryLibrary) {
  const normalizedPrompt = prompt.trim().toLowerCase()
  if (!normalizedPrompt) {
    return discoveryLibrary.slice(0, 5)
  }

  const terms = normalizedPrompt.split(/\s+/).filter(Boolean)
  const ranked = discoveryLibrary.map((item) => {
    const searchableText = getSearchableText(item)
    const score = terms.reduce((total, term) => {
      if (!searchableText.includes(term)) {
        return total
      }
      return total + (Array.isArray(item.tags) && item.tags.includes(term) ? 3 : 1)
    }, 0)
    return { ...item, score }
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return ranked.slice(0, 5)
}

function formatAssistantReply(prompt, suggestions, assistant) {
  const suggestionTitles = suggestions.slice(0, 2).map((item) => item.title).join(' and ')
  const template = suggestionTitles ? assistant?.replyTemplate : assistant?.emptyReplyTemplate
  if (!template) {
    return ''
  }

  return template
    .replaceAll('{prompt}', prompt)
    .replaceAll('{suggestions}', suggestionTitles)
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
  const [showBackToAiButton, setShowBackToAiButton] = useState(false)
  const [assistantResults, setAssistantResults] = useState(null)
  const [isAssistantThinking, setIsAssistantThinking] = useState(false)

  const assistant = campusExperience?.assistant ?? {}
  const activeHints = chatMode ? assistant.chatPromptHints ?? EMPTY_ARRAY : assistant.searchPromptHints ?? EMPTY_ARRAY
  const typewriterHints = useMemo(() => (activeHints.length ? activeHints : ['']), [activeHints])
  const { hintDeleting, hintText, resetHint } = useTypewriterPromptHint(typewriterHints)
  const {
    activeMarketplaceHover,
    activeMarketplaceSlide,
    handleMarketplaceHoverEnd,
    handleMarketplaceHoverStart,
  } = useMarketplaceSlideshow()

  useEffect(() => {
    const handleShortcutFocus = (event) => {
      const usedCommandOrControl = event.metaKey || event.ctrlKey
      if (!usedCommandOrControl || event.key !== '/') {
        return
      }

      event.preventDefault()
      promptInputRef.current?.focus()
    }

    window.addEventListener('keydown', handleShortcutFocus)
    return () => window.removeEventListener('keydown', handleShortcutFocus)
  }, [])

  useEffect(() => {
    let isMounted = true
    readCampusHomeExperience()
      .then((experience) => {
        if (isMounted) setCampusExperience(experience)
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [])

  const discoveryLibrary = useMemo(
    () => campusExperience?.discoveryLibrary ?? EMPTY_ARRAY,
    [campusExperience?.discoveryLibrary]
  )
  const discoverySuggestions = useMemo(() => {
    // Prefer the live deep-search results from the backend once a query has run;
    // fall back to ranking the seeded discovery library locally.
    if (chatMode && Array.isArray(assistantResults)) {
      return assistantResults.map(toDiscoveryCard)
    }
    return getDiscoverySuggestions(chatMode ? activePrompt : '', discoveryLibrary)
  }, [assistantResults, chatMode, activePrompt, discoveryLibrary])

  const discoveryChips = useMemo(() => {
    if (!chatMode) {
      return assistant.defaultChips ?? []
    }
    const chips = discoverySuggestions.map((item) => item.chip)
    return [...new Set(chips)].slice(0, 5)
  }, [assistant.defaultChips, chatMode, discoverySuggestions])

  const handlePromptSubmit = async (event) => {
    event.preventDefault()
    const trimmedPrompt = prompt.trim()

    if (!trimmedPrompt || isAssistantThinking) {
      return
    }

    const requestId = `${Date.now()}`
    const userMessage = {
      id: `${requestId}-user`,
      role: 'user',
      content: trimmedPrompt,
    }
    const pendingMessage = {
      id: `${requestId}-assistant`,
      role: 'assistant',
      content: '',
      pending: true,
    }

    setActivePrompt(trimmedPrompt)
    setChatMode(true)
    setChatMessages((previous) => [...previous, userMessage, pendingMessage])
    setPrompt('')
    setIsAssistantThinking(true)
    resetHint()

    const finishMessage = (content) => {
      setChatMessages((previous) => previous.map((message) => (
        message.id === pendingMessage.id ? { ...message, content, pending: false } : message
      )))
    }

    try {
      const response = await sendCampusAssistantQuery(trimmedPrompt)
      setAssistantResults(Array.isArray(response?.results) ? response.results : [])
      finishMessage(response?.reply || 'I could not find anything for that just yet.')
    } catch {
      // Backend/AI unavailable — fall back to the local discovery library search.
      const suggestions = getDiscoverySuggestions(trimmedPrompt, discoveryLibrary)
      setAssistantResults(null)
      finishMessage(formatAssistantReply(trimmedPrompt, suggestions, assistant))
    } finally {
      setIsAssistantThinking(false)
    }
  }

  const resetChatSurface = () => {
    setChatMode(false)
    setActivePrompt('')
    setPrompt('')
    setChatMessages([])
    setAssistantResults(null)
    setIsAssistantThinking(false)
    resetHint()
  }

  const handleMainScroll = (event) => {
    const scrollTop = event.currentTarget.scrollTop
    const collapseDistance = 150
    const progress = Math.min(scrollTop / collapseDistance, 1)
    event.currentTarget.style.setProperty('--campus-header-progress', progress.toFixed(3))

    const heroCard = heroCardRef.current
    if (!heroCard) {
      return
    }

    const heroBottom = heroCard.offsetTop + heroCard.offsetHeight
    const shouldShowBackToAi = scrollTop > heroBottom - 120
    setShowBackToAiButton((previous) => (
      previous === shouldShowBackToAi ? previous : shouldShowBackToAi
    ))
  }

  const handleBackToAi = () => {
    const mainScroller = mainScrollRef.current
    const heroCard = heroCardRef.current
    if (!mainScroller || !heroCard) {
      return
    }

    mainScroller.scrollTo({
      top: Math.max(heroCard.offsetTop - 10, 0),
      behavior: 'smooth',
    })
  }

  const focusPromptInput = () => {
    promptInputRef.current?.focus()
  }

  const activeHint = hintText || activeHints[0] || ''
  const promptPlaceholder = activeHint
    ? `${chatMode ? 'Ask Zumbarl AI: ' : 'Try: '}${activeHint}${hintDeleting ? '' : '|'}`
    : ''

  const openRecommendedGig = (opportunityUuid, owner, href) => {
    if (href) {
      navigate(href)
      return
    }
    const params = new URLSearchParams()
    if (typeof opportunityUuid === 'string' && opportunityUuid.trim() !== '') {
      params.set('opportunity', opportunityUuid)
    }
    if (typeof owner === 'string' && owner.trim() !== '') {
      params.set('owner', owner)
    }
    navigate(`/campus/opportunities?${params.toString()}`)
  }

  return {
    activeMarketplaceHover,
    activeMarketplaceSlide,
    chatMessages,
    chatMode,
    discoveryChips,
    discoverySuggestions,
    hero: campusExperience?.hero ?? null,
    rail: campusExperience?.rail ?? null,
    viewer: campusExperience?.viewer ?? null,
    quickActions: campusExperience?.quickActions ?? [],
    trustPoints: campusExperience?.trustPoints ?? [],
    focusPromptInput,
    handleBackToAi,
    handleMainScroll,
    handleMarketplaceHoverEnd,
    handleMarketplaceHoverStart,
    handlePromptSubmit,
    heroCardRef,
    isAssistantThinking,
    mainScrollRef,
    openRecommendedGig,
    prompt,
    promptInputRef,
    promptPlaceholder,
    recommendationSections: campusExperience?.recommendationSections || [],
    resetChatSurface,
    setPrompt,
    showBackToAiButton,
  }
}

export default useCampusHomeState
