function ProfileShopRail({ shop }) {
  if (!shop) {
    return <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card"><h2>Shop</h2><p>No shop created yet.</p></article>
  }

  return (
      <article className="campus-rail-card campus-profile-side-card campus-shop-rail-card">
        <header className="campus-shop-rail-head">
          <h2>About {shop.name}</h2>
          <button type="button" className="campus-link-btn">Edit</button>
        </header>
        <p className="campus-shop-about-copy">
          {shop.description || 'No shop description added yet.'}
        </p>
      </article>
  )
}

export default ProfileShopRail
