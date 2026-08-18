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
  FiHome,
  FiMail,
  FiRadio,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiTruck,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ACCESS_KEYS,
  filterByAccess,
  hasAccess,
} from "../../features/auth/roleConfig";
import { useViewerProfile } from "../../features/auth/viewerProfile";
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
  file: FiFileText,
  home: FiHome,
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
  const accessibleNavItems = filterByAccess(navItems);
  const canViewProfile = hasAccess(profileAccess);
  const resolvedViewer = useViewerProfile(viewer);
  const [featureTags, setFeatureTags] = useState({});

  useEffect(() => {
    let active = true;
    readNavigationFeatureTags().then((tags) => {
      if (active) setFeatureTags(tags);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className="campus-sidebar" aria-label={ariaLabel}>
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
                aria-current={isActive ? "page" : undefined}
              >
                {content}
              </Link>
            ) : (
              <button
                key={id}
                type="button"
                className={`campus-nav-item${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {content}
              </button>
            );
          },
        )}
      </nav>

      {canViewProfile ? (
        <Link
          className={`campus-profile-card${isProfileCurrent ? " is-current" : ""}`}
          to={profileHref}
          aria-current={isProfileCurrent ? "page" : undefined}
          aria-label={profileLabel}
        >
          <img
            className="campus-avatar"
            width="42"
            height="42"
            src={resolvedViewer.avatar}
            alt={resolvedViewer.name}
          />
          <div>
            <p className="campus-profile-name">{resolvedViewer.name}</p>
            <p className="campus-profile-meta meta-category">
              {resolvedViewer.role}
            </p>
            <p className="campus-profile-meta">
              {resolvedViewer.campus || resolvedViewer.meta}
            </p>
          </div>
          <FiChevronRight aria-hidden="true" />
        </Link>
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
  );
}

export default CampusSidebar;
