import {
  FiArrowRight,
  FiActivity,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiChevronRight,
  FiCreditCard,
  FiFileText,
  FiHeart,
  FiHome,
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
import {
  ACCESS_KEYS,
  AUTH_ROLE_STORAGE_KEY,
  filterByAccess,
  hasAccess,
} from "../../features/auth/roleConfig";
import { clearAuthUserCache } from "../../features/auth/services/authUserService";
import { useViewerProfile } from "../../features/auth/viewerProfile";
import { clearBusinessProfileCache } from "../../features/business/services/businessProfileService";
import {
  CAMPUS_NAV_ITEMS,
  CAMPUS_VIEWER,
} from "../../features/campus/constants";
import { readNavigationFeatureTags } from "../../features/navigation/navigationFeatureTags";
import { AUTH_TOKEN_KEY } from "../../lib/sendZumbarlApiRequest";

const ICON_BY_ID = {
  activity: FiActivity,
  analytics: FiBarChart2,
  bell: FiBell,
  book: FiBookOpen,
  briefcase: FiBriefcase,
  calendar: FiCalendar,
  "credit-card": FiCreditCard,
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
  const mobileNavItems = accessibleNavItems.filter(({ id }) =>
    ["explore", "opportunities", "wellbeing"].includes(id),
  );

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
    clearAuthUserCache();
    clearBusinessProfileCache();
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
    setIsAccountMenuOpen(false);
    navigate("/login", { replace: true });
  }

  return (
    <>
    <aside className={`campus-sidebar${isCampusNavigation ? " is-social-rail" : ""}`} aria-label={ariaLabel}>
      <div className="campus-sidebar-primary">
      <Link className="campus-brand" to="/" aria-label="Zumbarl logo">
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
            data-label="Account"
            aria-expanded={isAccountMenuOpen}
            aria-current={isProfileCurrent ? "page" : undefined}
            aria-label="Open account menu"
            onClick={() => setIsAccountMenuOpen((current) => !current)}
          >
            <img
              className="campus-avatar"
              width="42"
              height="42"
              src={resolvedViewer.avatar}
              alt={resolvedViewer.name}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/assets/index/bee_nobg.png";
              }}
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
                <img src={resolvedViewer.avatar} alt="" />
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
          {mobileNavItems.slice(0, 2).map(({ id, label, icon, href }) => {
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
          {mobileNavItems.slice(2, 3).map(({ id, label, icon, href }) => {
            const Icon = ICON_BY_ID[icon];
            const isActive = id === activeItemId;
            return (
              <Link key={id} to={href} className={isActive ? "is-active" : ""} aria-current={isActive ? "page" : undefined}>
                {Icon ? <Icon aria-hidden="true" /> : null}
                <span>{label}</span>
              </Link>
            );
          })}
          <button type="button" className={isProfileCurrent ? "is-active" : ""} aria-expanded={isAccountMenuOpen} onClick={() => setIsAccountMenuOpen(true)}>
            <img src={resolvedViewer.avatar} alt="" />
            <span>Account</span>
          </button>
        </nav>

        {isCreateMenuOpen ? (
          <div className="campus-create-backdrop" role="presentation" onMouseDown={() => setIsCreateMenuOpen(false)}>
            <section className="campus-create-sheet" role="dialog" aria-modal="true" aria-labelledby="campus-create-title" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div><small>Share with Zumbarl</small><h2 id="campus-create-title">Create something</h2></div>
                <button type="button" aria-label="Close create menu" onClick={() => setIsCreateMenuOpen(false)}><FiX aria-hidden="true" /></button>
              </header>
              <div>
                <Link to="/campus?compose=post" onClick={() => openMobileComposer("post")}><strong>Post</strong><span>Share an update, photo, poll or project moment.</span></Link>
                <Link to="/campus?compose=story" onClick={() => openMobileComposer("story")}><strong>Story</strong><span>Publish a quick campus moment.</span></Link>
                <Link to="/campus?compose=event" onClick={() => openMobileComposer("event")}><strong>Event</strong><span>Invite people to something happening nearby.</span></Link>
                <Link to="/campus/marketplace/listings/new" onClick={() => setIsCreateMenuOpen(false)}><strong>Listing</strong><span>Sell a product or offer a service.</span></Link>
              </div>
            </section>
          </div>
        ) : null}

        {isAccountMenuOpen ? (
          <div className="campus-mobile-account-backdrop" role="presentation" onMouseDown={() => setIsAccountMenuOpen(false)}>
            <section className="campus-mobile-account-sheet" role="dialog" aria-modal="true" aria-label="Account menu" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <img src={resolvedViewer.avatar} alt="" />
                <span><strong>{resolvedViewer.name}</strong><small>{resolvedViewer.campus || resolvedViewer.meta}</small></span>
                <button type="button" onClick={() => setIsAccountMenuOpen(false)} aria-label="Close account menu"><FiX aria-hidden="true" /></button>
              </header>
              <Link to={profileHref} onClick={() => setIsAccountMenuOpen(false)}>{profileLabel}<FiChevronRight aria-hidden="true" /></Link>
              <Link to="/messages" onClick={() => setIsAccountMenuOpen(false)}>Messages<FiChevronRight aria-hidden="true" /></Link>
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
