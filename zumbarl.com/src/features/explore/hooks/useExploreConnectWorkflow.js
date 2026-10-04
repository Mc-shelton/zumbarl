import { useEffect, useState } from 'react'
import { readConnectProfile, saveConnectProfile } from '../services/connectProfileService'

function useExploreConnectWorkflow({ onPrepareProfile } = {}) {
  const [connectProfile, setConnectProfile] = useState(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    readConnectProfile()
      .then((response) => {
        const profile = response?.profile || null
        setConnectProfile(profile)
      })
      .catch((error) => setProfileError(error.message || 'Connect settings could not be loaded.'))
      .finally(() => setIsProfileLoading(false))
  }, [])

  const handlePrepareProfile = () => onPrepareProfile?.(connectProfile)

  async function handleSaveProfile(payload) {
    const profile = await saveConnectProfile(payload)
    setConnectProfile(profile)
    setProfileError('')
    return profile
  }

  return {
    connectProfile,
    isProfileLoading,
    handlePrepareProfile,
    handleSaveProfile,
    profileError,
  }
}

export default useExploreConnectWorkflow
