import ProfileDefaultRail from './ProfileDefaultRail'
import ProfileExperienceRail from './ProfileExperienceRail'
import ProfileShopDetailRail from './ProfileShopDetailRail'
import ProfileShopRail from './ProfileShopRail'
import ProfileSkillsRail from './ProfileSkillsRail'

function ProfileSideRail({
  activeShopDetailImage,
  activeShopDetailTab,
  isExperienceTab,
  isShopProductDetailOpen,
  isShopTab,
  isSkillsTab,
  normalizedShopDetailImageIndex,
  onCloseShopDetail,
  onDetailImageChange,
  onDetailTabChange,
  onNextShopImage,
  onPreviousShopImage,
  profileExperience,
  selectedShopProduct,
  selectedShopProductDetail,
  skillsTrendCoordinates,
  skillsTrendFillPoints,
  skillsTrendPoints,
}) {
  const railClasses = [
    'campus-rail campus-profile-rail',
    isSkillsTab ? 'is-skills-rail' : '',
    isShopTab ? 'is-shop-rail' : '',
    isShopProductDetailOpen ? 'is-shop-detail-open' : '',
  ].filter(Boolean).join(' ')

  return (
    <aside className={railClasses}>
      {isExperienceTab ? (
        <ProfileExperienceRail />
      ) : isSkillsTab ? (
        <ProfileSkillsRail
          skillsTrendCoordinates={skillsTrendCoordinates}
          skillsTrendFillPoints={skillsTrendFillPoints}
          skillsTrendPoints={skillsTrendPoints}
        />
      ) : isShopTab ? (
        isShopProductDetailOpen && selectedShopProduct ? (
          <ProfileShopDetailRail
            activeShopDetailImage={activeShopDetailImage}
            activeShopDetailTab={activeShopDetailTab}
            normalizedShopDetailImageIndex={normalizedShopDetailImageIndex}
            onClose={onCloseShopDetail}
            onDetailImageChange={onDetailImageChange}
            onDetailTabChange={onDetailTabChange}
            onNextImage={onNextShopImage}
            onPreviousImage={onPreviousShopImage}
            selectedShopProduct={selectedShopProduct}
            selectedShopProductDetail={selectedShopProductDetail}
          />
        ) : (
          <ProfileShopRail />
        )
      ) : (
        <ProfileDefaultRail
          recentActivity={profileExperience?.recentActivity}
          relationships={profileExperience?.relationships}
        />
      )}
    </aside>
  )
}

export default ProfileSideRail
