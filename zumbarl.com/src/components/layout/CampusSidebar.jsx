import {
  FiArrowRight,
  FiActivity,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCamera,
  FiChevronRight,
  FiCreditCard,
  FiCoffee,
  FiFileText,
  FiHeart,
  FiHome,
  FiGrid,
  FiMail,
  FiLogOut,
  FiRadio,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiTruck,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProfileAvatar from "../ui/ProfileAvatar";
import {
  ACCESS_KEYS,
  filterByAccess,
  hasAccess,
} from "../../features/auth/roleConfig";
import { logoutAuthUser } from "../../features/auth/services/authUserService";
import { useViewerProfile } from "../../features/auth/viewerProfile";
import { clearBusinessProfileCache } from "../../features/business/services/businessProfileService";
import {
  CAMPUS_NAV_ITEMS,
  CAMPUS_VIEWER,
} from "../../features/campus/constants";
import { readNavigationFeatureTags } from "../../features/navigation/navigationFeatureTags";

const ICON_BY_ID = {
  activity: FiActivity,
  analytics: FiBarChart2,
  bell: FiBell,
  book: FiBookOpen,
  briefcase: FiBriefcase,
  calendar: FiCalendar,
  "credit-card": FiCreditCard,
  coffee: FiCoffee,
  file: FiFileText,
  home: FiHome,
  heart: FiHeart,
  mail: FiMail,
  marketing: FiRadio,
  search: FiSearch,
  settings: FiSettings,
  "shopping-bag": FiShoppingBag,
  trending: FiTrendingUp,
  truck: FiTruck,
  user: FiUser,
  users: FiUsers,
};

function CampusSidebar({
  activeItemId,
  ariaLabel = "Student portal navigation",
  isProfileCurrent = false,
  navItems = CAMPUS_NAV_ITEMS,
  profileAccess = ACCESS_KEYS.profile.viewOwn,
  profileHref = "/campus/profile",
  profileLabel = "Student profile",
  supportCard = {
    title: "Invite your friends",
    description: "Bring your squad and earn rewards together.",
    actionLabel: "Invite Now",
  },
  viewer = CAMPUS_VIEWER,
}) {
  const navigate = useNavigate();
  const accessibleNavItems = filterByAccess(navItems);
  const canViewProfile = hasAccess(profileAccess);
  const resolvedViewer = useViewerProfile(viewer);
  const [featureTags, setFeatureTags] = useState({});
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const isCampusNavigation = navItems === CAMPUS_NAV_ITEMS;
  const mobilePrimaryItems = ["explore", "opportunities", "learn"]
    .map((id) => accessibleNavItems.find((item) => item.id === id))
    .filter(Boolean);
  const mobileMoreItems = ["workspace", "marketplace", "eatery", "wellbeing"]
    .map((id) => accessibleNavItems.find((item) => item.id === id))
    .filter(Boolean);
  const isMoreCurrent = isProfileCurrent || mobileMoreItems.some(({ id }) => id === activeItemId) || activeItemId === "messages";

  useEffect(() => {
    let active = true;
    readNavigationFeatureTags().then((tags) => {
      if (active) setFeatureTags(tags);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isCreateMenuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsCreateMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isCreateMenuOpen]);

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;
    const closeAccountMenu = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "pointerdown" && (accountMenuRef.current?.contains(event.target) || event.target.closest?.(".campus-mobile-account-sheet"))) return;
      setIsAccountMenuOpen(false);
    };
    window.addEventListener("keydown", closeAccountMenu);
    document.addEventListener("pointerdown", closeAccountMenu);
    return () => {
      window.removeEventListener("keydown", closeAccountMenu);
      document.removeEventListener("pointerdown", closeAccountMenu);
    };
  }, [isAccountMenuOpen]);

  function openMobileComposer(type) {
    setIsCreateMenuOpen(false);
    window.dispatchEvent(new CustomEvent("zumbarl:open-composer", {
      detail: { type },
    }));
  }

  function handleLogout() {
    void logoutAuthUser();
    clearBusinessProfileCache();
    setIsAccountMenuOpen(false);
    navigate("/login", { replace: true });
  }

  return (
    <>
    <aside className={`campus-sidebar${isCampusNavigation ? " is-social-rail" : ""}`} aria-label={ariaLabel}>
      <div className="campus-sidebar-primary">
      <Link className="campus-brand" to="/campus" aria-label="Open Explore Campus">
        <img
          className="campus-brand-logo"
          width="62"
          height="62"
          src="/assets/index/bee_nobg.png"
          alt="Zumbarl bee logo"
        />
        <span className="campus-brand-text">zumbarl.</span>
      </Link>

      <nav className="campus-nav">
        {accessibleNavItems.map(
          ({ id, label, icon, href, badge, featureTagKey }) => {
            const Icon = ICON_BY_ID[icon];
            const isActive = id === activeItemId;
            const resolvedBadge = featureTagKey
              ? featureTags[featureTagKey]
              : badge;
            const content = (
              <>
                {Icon ? <Icon aria-hidden="true" /> : null}
                <span>{label}</span>
                {resolvedBadge ? <em>{resolvedBadge}</em> : null}
              </>
            );

            return href ? (
              <Link
                key={id}
                to={href}
                className={`campus-nav-item${isActive ? " is-active" : ""}`}
                data-label={label}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                {content}
              </Link>
            ) : (
              <button
                key={id}
                type="button"
                className={`campus-nav-item${isActive ? " is-active" : ""}`}
                data-label={label}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                {content}
              </button>
            );
          },
        )}
      </nav>
      </div>

      {canViewProfile ? (
        <div className="campus-sidebar-account" ref={accountMenuRef}>
          <button
            type="button"
            className={`campus-profile-card${isProfileCurrent ? " is-current" : ""}`}
            data-label={resolvedViewer.name || profileLabel}
            aria-expanded={isAccountMenuOpen}
            aria-current={isProfileCurrent ? "page" : undefined}
            aria-label={`Open ${resolvedViewer.name || profileLabel} account menu`}
            onClick={() => setIsAccountMenuOpen((current) => !current)}
          >
            <ProfileAvatar
              className="campus-avatar"
              width="42"
              height="42"
              src={resolvedViewer.avatar}
              alt={resolvedViewer.name}
            />
            <div>
              <p className="campus-profile-name">{resolvedViewer.name}</p>
              <p className="campus-profile-meta meta-category">{resolvedViewer.role}</p>
              <p className="campus-profile-meta">{resolvedViewer.campus || resolvedViewer.meta}</p>
            </div>
            <FiChevronRight aria-hidden="true" />
          </button>
          {isAccountMenuOpen ? (
            <section className="campus-sidebar-account-menu" aria-label="Account menu">
              <header>
                <ProfileAvatar src={resolvedViewer.avatar} alt="" />
                <span><strong>{resolvedViewer.name}</strong><small>{resolvedViewer.campus || resolvedViewer.meta}</small></span>
              </header>
              <Link to={profileHref} onClick={() => setIsAccountMenuOpen(false)}>{profileLabel}</Link>
              <Link to="/messages" onClick={() => setIsAccountMenuOpen(false)}>Messages</Link>
              <button type="button" onClick={handleLogout}><FiLogOut aria-hidden="true" /> Log out</button>
            </section>
          ) : null}
        </div>
      ) : null}

      {supportCard ? (
        <section className="campus-sidebar-card">
          <h3>{supportCard.title}</h3>
          <p>{supportCard.description}</p>
          {supportCard.actionHref ? (
            <Link to={supportCard.actionHref} className="campus-pill-btn">
              {supportCard.actionLabel}
              <FiArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              className="campus-pill-btn"
              onClick={supportCard.onAction}
            >
              {supportCard.actionLabel}
              <FiArrowRight aria-hidden="true" />
            </button>
          )}
        </section>
      ) : null}
    </aside>

    {isCampusNavigation ? (
      <>
        <nav className="campus-mobile-nav" aria-label="Primary campus navigation">
          {mobilePrimaryItems.slice(0, 2).map(({ id, label, icon, href }) => {
            const Icon = ICON_BY_ID[icon];
            const isActive = id === activeItemId;
            return (
              <Link key={id} to={href} className={isActive ? "is-active" : ""} aria-current={isActive ? "page" : undefined}>
                {Icon ? <Icon aria-hidden="true" /> : null}
                <span>{label}</span>
              </Link>
            );
          })}
          <button type="button" className="campus-mobile-create" aria-expanded={isCreateMenuOpen} onClick={() => setIsCreateMenuOpen(true)}>
            <span><FiPlus aria-hidden="true" /></span>
            <em>Create</em>
          </button>
          {mobilePrimaryItems.slice(2, 3).map(({ id, label, icon, href }) => {
            const Icon = ICON_BY_ID[icon];
            const isActive = id === activeItemId;
            return (
              <Link key={id} to={href} className={isActive ? "is-active" : ""} aria-current={isActive ? "page" : undefined}>
                {Icon ? <Icon aria-hidden="true" /> : null}
                <span>{label}</span>
              </Link>
            );
          })}
          <button type="button" className={`campus-mobile-more${isMoreCurrent ? " is-active" : ""}`} aria-expanded={isAccountMenuOpen} aria-controls="campus-mobile-more-sheet" onClick={() => setIsAccountMenuOpen(true)}>
            <FiGrid aria-hidden="true" />
            <span>More</span>
          </button>
        </nav>

        {isCreateMenuOpen ? (
          <div className="campus-create-backdrop" role="presentation" onMouseDown={() => setIsCreateMenuOpen(false)}>
            <section className="campus-create-sheet" role="dialog" aria-modal="true" aria-labelledby="campus-create-title" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div><small>Share with Zumbarl</small><h2 id="campus-create-title">Create something</h2></div>
                <button type="button" aria-label="Close create menu" onClick={() => setIsCreateMenuOpen(false)}><FiX aria-hidden="true" /></button>
              </header>
              <div className="campus-create-options">
                <Link className="is-post" to="/campus?compose=post" onClick={() => openMobileComposer("post")}>
                  <span className="campus-create-option-icon" aria-hidden="true"><FiFileText /></span>
                  <span className="campus-create-option-copy"><strong>Post</strong><span>Share an update, photo, poll or project moment.</span></span>
                  <FiChevronRight className="campus-create-option-arrow" aria-hidden="true" />
                </Link>
                <Link className="is-story" to="/campus?compose=story" onClick={() => openMobileComposer("story")}>
                  <span className="campus-create-option-icon" aria-hidden="true"><FiCamera /></span>
                  <span className="campus-create-option-copy"><strong>Story</strong><span>Publish a quick campus moment.</span></span>
                  <FiChevronRight className="campus-create-option-arrow" aria-hidden="true" />
                </Link>
                <Link className="is-event" to="/campus?compose=event" onClick={() => openMobileComposer("event")}>
                  <span className="campus-create-option-icon" aria-hidden="true"><FiCalendar /></span>
                  <span className="campus-create-option-copy"><strong>Event</strong><span>Invite people to something happening nearby.</span></span>
                  <FiChevronRight className="campus-create-option-arrow" aria-hidden="true" />
                </Link>
                <Link className="is-listing" to="/campus/marketplace/listings/new" onClick={() => setIsCreateMenuOpen(false)}>
                  <span className="campus-create-option-icon" aria-hidden="true"><FiShoppingBag /></span>
                  <span className="campus-create-option-copy"><strong>Listing</strong><span>Sell a product or offer a service.</span></span>
                  <FiChevronRight className="campus-create-option-arrow" aria-hidden="true" />
                </Link>
                <Link className="is-meal" to="/campus/marketplace/listings/new?mode=food" onClick={() => setIsCreateMenuOpen(false)}>
                  <span className="campus-create-option-icon" aria-hidden="true"><FiCoffee /></span>
                  <span className="campus-create-option-copy"><strong>Home-cooked meal</strong><span>Share today’s plate from your student kitchen.</span></span>
                  <FiChevronRight className="campus-create-option-arrow" aria-hidden="true" />
                </Link>
              </div>
            </section>
          </div>
        ) : null}

        {isAccountMenuOpen ? (
          <div className="campus-mobile-account-backdrop" role="presentation" onMouseDown={() => setIsAccountMenuOpen(false)}>
            <section id="campus-mobile-more-sheet" className="campus-mobile-account-sheet" role="dialog" aria-modal="true" aria-labelledby="campus-mobile-more-title" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <ProfileAvatar src={resolvedViewer.avatar} alt="" />
                <span><strong id="campus-mobile-more-title">More</strong><small>{resolvedViewer.name} · {resolvedViewer.campus || resolvedViewer.meta}</small></span>
                <button type="button" onClick={() => setIsAccountMenuOpen(false)} aria-label="Close more menu"><FiX aria-hidden="true" /></button>
              </header>
              <nav className="campus-mobile-more-links" aria-label="More campus destinations">
                {mobileMoreItems.map(({ id, label, icon, href }) => {
                  const Icon = ICON_BY_ID[icon];
                  return <Link key={id} to={href} className={id === activeItemId ? "is-active" : ""} aria-current={id === activeItemId ? "page" : undefined} onClick={() => setIsAccountMenuOpen(false)}>
                    <span>{Icon ? <Icon aria-hidden="true" /> : null}<strong>{label}</strong></span><FiChevronRight aria-hidden="true" />
                  </Link>;
                })}
              </nav>
              <div className="campus-mobile-more-account"><span>Account</span></div>
              <Link to={profileHref} className={isProfileCurrent ? "is-active" : ""} onClick={() => setIsAccountMenuOpen(false)}><span><FiUser aria-hidden="true" />{profileLabel}</span><FiChevronRight aria-hidden="true" /></Link>
              <Link to="/messages" className={activeItemId === "messages" ? "is-active" : ""} onClick={() => setIsAccountMenuOpen(false)}><span><FiMail aria-hidden="true" />Messages</span><FiChevronRight aria-hidden="true" /></Link>
              <button type="button" className="is-logout" onClick={handleLogout}><span><FiLogOut aria-hidden="true" /> Log out</span><FiChevronRight aria-hidden="true" /></button>
            </section>
          </div>
        ) : null}
      </>
    ) : null}
    </>
  );
}

export default CampusSidebar;
