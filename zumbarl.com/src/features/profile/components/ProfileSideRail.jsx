import ProfileDefaultRail from './ProfileDefaultRail'
import ProfileExperienceRail from './ProfileExperienceRail'
import ProfileShopDetailRail from './ProfileShopDetailRail'
import ProfileShopRail from './ProfileShopRail'

function ProfileSideRail({
  activeShopDetailImage,
  activeShopDetailTab,
  canContact = false,
  contactName,
  isExperienceTab,
  isFollowedByViewer = false,
  isOwnProfile = false,
  isShopProductDetailOpen,
  isShopTab,
  normalizedShopDetailImageIndex,
  onCloseShopDetail,
  onAudioCall,
  onDetailImageChange,
  onDetailTabChange,
  onNextShopImage,
  onEditListing,
  onMessage,
  onPreviousShopImage,
  onVideoCall,
  profileExperience,
  shop,
  selectedShopProduct,
  selectedShopProductDetail,
}) {
  const railClasses = [
    'campus-rail campus-profile-rail',
    isShopTab ? 'is-shop-rail' : '',
    isShopProductDetailOpen ? 'is-shop-detail-open' : '',
  ].filter(Boolean).join(' ')

  return (
    <aside className={railClasses}>
      {isExperienceTab ? (
        <ProfileExperienceRail />
      ) : isShopTab ? (
        isShopProductDetailOpen && selectedShopProduct ? (
          <ProfileShopDetailRail
            activeShopDetailImage={activeShopDetailImage}
            activeShopDetailTab={activeShopDetailTab}
            isOwner={isOwnProfile}
            normalizedShopDetailImageIndex={normalizedShopDetailImageIndex}
            onClose={onCloseShopDetail}
            onDetailImageChange={onDetailImageChange}
            onDetailTabChange={onDetailTabChange}
            onNextImage={onNextShopImage}
            onEditListing={onEditListing}
            onPreviousImage={onPreviousShopImage}
            selectedShopProduct={selectedShopProduct}
            selectedShopProductDetail={selectedShopProductDetail}
          />
        ) : (
          <ProfileShopRail shop={shop} />
        )
      ) : (
        <ProfileDefaultRail
          canContact={canContact}
          contactName={contactName}
          isFollowedByViewer={isFollowedByViewer}
          isOwnProfile={isOwnProfile}
          onAudioCall={onAudioCall}
          onMessage={onMessage}
          onVideoCall={onVideoCall}
          recentActivity={profileExperience?.recentActivity}
          relationships={profileExperience?.relationships}
          socialStats={profileExperience?.socialStats}
        />
      )}
    </aside>
  )
}

export default ProfileSideRail
