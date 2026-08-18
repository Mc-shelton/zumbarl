import { useEffect, useState } from 'react'
import { getWrappedGalleryIndex } from '../utils/gallery'

function useExploreMediaViewer({ feedComments, feedPosts }) {
  const [mediaViewerState, setMediaViewerState] = useState(null)

  useEffect(() => {
    if (!mediaViewerState) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow

    const stepCurrentMedia = (direction) => {
      setMediaViewerState((current) => {
        if (!current) {
          return current
        }

        const post = current.post || feedPosts.find((candidate) => candidate.id === current.postId)
        if (!post) {
          return current
        }

        return {
          ...current,
          imageIndex: getWrappedGalleryIndex(current.imageIndex + direction, post.gallery.length),
        }
      })
    }

    const handleModalKeys = (event) => {
      if (event.key === 'Escape') {
        setMediaViewerState(null)
      }

      if (event.key === 'ArrowRight') {
        stepCurrentMedia(1)
      }

      if (event.key === 'ArrowLeft') {
        stepCurrentMedia(-1)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleModalKeys)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleModalKeys)
    }
  }, [feedPosts, mediaViewerState])

  const openMediaViewer = (postOrId, imageIndex) => {
    const post = typeof postOrId === 'object' ? postOrId : feedPosts.find((candidate) => candidate.id === postOrId)
    setMediaViewerState({ postId: post?.id || postOrId, post: post || null, imageIndex })
  }

  const closeMediaViewer = () => {
    setMediaViewerState(null)
  }

  const stepMediaViewer = (direction) => {
    setMediaViewerState((current) => {
      if (!current) {
        return current
      }

      const post = current.post || feedPosts.find((candidate) => candidate.id === current.postId)
      if (!post) {
        return current
      }

      return {
        ...current,
        imageIndex: getWrappedGalleryIndex(current.imageIndex + direction, post.gallery.length),
      }
    })
  }

  const activeMediaPost = mediaViewerState
    ? mediaViewerState.post || feedPosts.find((candidate) => candidate.id === mediaViewerState.postId) || null
    : null
  const activeMediaIndex = activeMediaPost
    ? Math.min(Math.max(mediaViewerState?.imageIndex ?? 0, 0), activeMediaPost.gallery.length - 1)
    : 0
  const activeMediaImage = activeMediaPost ? activeMediaPost.gallery[activeMediaIndex] : null
  const activeMediaComments = activeMediaPost ? feedComments[activeMediaPost.id] || [] : []

  return {
    activeMediaComments,
    activeMediaImage,
    activeMediaIndex,
    activeMediaPost,
    closeMediaViewer,
    openMediaViewer,
    stepMediaViewer,
  }
}

export default useExploreMediaViewer
