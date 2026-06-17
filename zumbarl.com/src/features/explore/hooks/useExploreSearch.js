import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

function useExploreSearch({ onClearSearch, onSearch }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeQuery = (searchParams.get('q') || '').trim()
  const isSearchMode = activeQuery.length > 0
  const [searchDraft, setSearchDraft] = useState(() => ({
    sourceQuery: activeQuery,
    value: activeQuery,
  }))

  const searchInput = searchDraft.sourceQuery === activeQuery ? searchDraft.value : activeQuery

  const handleSearchInputChange = (event) => {
    setSearchDraft({
      sourceQuery: activeQuery,
      value: event.target.value,
    })
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()

    const nextQuery = searchInput.trim()
    const nextParams = new URLSearchParams(searchParams)

    if (nextQuery) {
      nextParams.set('q', nextQuery)
      onSearch()
    } else {
      nextParams.delete('q')
    }

    setSearchParams(nextParams)
  }

  const handleClearSearch = () => {
    setSearchDraft({ sourceQuery: activeQuery, value: '' })
    onClearSearch()

    if (!isSearchMode) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('q')
    setSearchParams(nextParams)
  }

  return {
    activeQuery,
    handleClearSearch,
    handleSearchInputChange,
    handleSearchSubmit,
    isSearchMode,
    searchInput,
  }
}

export default useExploreSearch
