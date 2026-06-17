import useExploreMediaViewer from './useExploreMediaViewer'
import useExploreProductRail from './useExploreProductRail'
import useExploreSearch from './useExploreSearch'
import useExploreStoriesVisibility from './useExploreStoriesVisibility'

function useExploreCampusState({ feedPosts, feedComments, productDetails }) {
  const productRail = useExploreProductRail({ productDetails })
  const mediaViewer = useExploreMediaViewer({ feedComments, feedPosts })
  const search = useExploreSearch({
    onClearSearch: productRail.resetRailProduct,
    onSearch: productRail.resetRailProduct,
  })
  const stories = useExploreStoriesVisibility({
    isSearchMode: search.isSearchMode,
  })

  const handleClearSearch = () => {
    search.handleClearSearch()
    stories.showStories()
  }

  const handleSearchSubmit = (event) => {
    search.handleSearchSubmit(event)

    if (search.searchInput.trim()) {
      stories.showStories()
    }
  }

  return {
    ...mediaViewer,
    ...productRail,
    ...search,
    ...stories,
    handleClearSearch,
    handleSearchSubmit,
  }
}

export default useExploreCampusState
