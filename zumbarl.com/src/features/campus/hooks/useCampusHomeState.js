import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CHAT_PROMPT_HINTS,
  DISCOVERY_DEFAULT_CHIPS,
  RECOMMENDATION_SECTIONS,
  SEARCH_PROMPT_HINTS,
  getAssistantReply,
  getDiscoverySuggestions,
} from '../homeData'
import { readCampusHomeExperience } from '../services/readCampusExperience'
import useMarketplaceSlideshow from './useMarketplaceSlideshow'
import useTypewriterPromptHint from './useTypewriterPromptHint'

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

  const activeHints = chatMode ? CHAT_PROMPT_HINTS : SEARCH_PROMPT_HINTS
  const { hintDeleting, hintText, resetHint } = useTypewriterPromptHint(activeHints)
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

  const discoverySuggestions = useMemo(
    () => getDiscoverySuggestions(chatMode ? activePrompt : ''),
    [chatMode, activePrompt]
  )

  const discoveryChips = useMemo(() => {
    if (!chatMode) {
      return DISCOVERY_DEFAULT_CHIPS
    }
    const chips = discoverySuggestions.map((item) => item.chip)
    return [...new Set(chips)].slice(0, 5)
  }, [chatMode, discoverySuggestions])

  const handlePromptSubmit = (event) => {
    event.preventDefault()
    const trimmedPrompt = prompt.trim()

    if (!trimmedPrompt) {
      return
    }

    const suggestions = getDiscoverySuggestions(trimmedPrompt)
    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmedPrompt,
    }
    const assistantMessage = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: getAssistantReply(trimmedPrompt, suggestions),
    }

    setActivePrompt(trimmedPrompt)
    setChatMode(true)
    setChatMessages((previous) => [...previous, userMessage, assistantMessage])
    setPrompt('')
    resetHint()
  }

  const resetChatSurface = () => {
    setChatMode(false)
    setActivePrompt('')
    setPrompt('')
    setChatMessages([])
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

  const promptPlaceholder = `${chatMode ? 'Ask Zumbarl AI: ' : 'Try: '}${hintText || activeHints[0]}${
    hintDeleting ? '' : '|'
  }`

  const openRecommendedGig = (opportunityUuid, owner) => {
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
    focusPromptInput,
    handleBackToAi,
    handleMainScroll,
    handleMarketplaceHoverEnd,
    handleMarketplaceHoverStart,
    handlePromptSubmit,
    heroCardRef,
    mainScrollRef,
    openRecommendedGig,
    prompt,
    promptInputRef,
    promptPlaceholder,
    recommendationSections: campusExperience?.recommendationSections?.some((section) => section.items?.length)
      ? campusExperience.recommendationSections
      : RECOMMENDATION_SECTIONS,
    resetChatSurface,
    setPrompt,
    showBackToAiButton,
  }
}

export default useCampusHomeState
