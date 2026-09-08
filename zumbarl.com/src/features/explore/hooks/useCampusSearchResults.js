import { useEffect, useMemo, useState } from 'react'
import { searchCampus } from '../services/searchService'

const EMPTY_RESULTS = {
  query: '',
  groups: { marketplace: [], people: [], pages: [], posts: [], projects: [], resources: [] },
  counts: { all: 0, marketplace: 0, people: 0, pages: 0, posts: 0, projects: 0, resources: 0 },
  hints: [],
  partial: false,
}

function useCampusSearchResults(query, feedPosts = []) {
  const [state, setState] = useState({ data: EMPTY_RESULTS, error: '', loading: false })
  const stablePosts = useMemo(() => feedPosts, [feedPosts])

  useEffect(() => {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      setState({ data: EMPTY_RESULTS, error: '', loading: false })
      return undefined
    }
    let cancelled = false
    setState((current) => ({ ...current, error: '', loading: true }))
    searchCampus(normalizedQuery, stablePosts)
      .then((data) => {
        if (!cancelled) setState({ data, error: '', loading: false })
      })
      .catch((error) => {
        if (!cancelled) setState({ data: EMPTY_RESULTS, error: error.message || 'Search is unavailable right now.', loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [query, stablePosts])

  return state
}

export default useCampusSearchResults
