import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import CampusSidebar from "../components/layout/CampusSidebar";
import Seo from "../components/Seo";
import ExploreDefaultRail from "../features/explore/components/ExploreDefaultRail";
import ExploreFeed from "../features/explore/components/ExploreFeed";
import ExploreFeedHero from "../features/explore/components/ExploreFeedHero";
import ExploreMediaModal from "../features/explore/components/ExploreMediaModal";
import ExploreProductRail from "../features/explore/components/ExploreProductRail";
import ExploreSearchResults from "../features/explore/components/ExploreSearchResults";
import ExploreSearchSummary from "../features/explore/components/ExploreSearchSummary";
import ExploreStoryComposer from "../features/explore/components/ExploreStoryComposer";
import ExploreStoryViewer from "../features/explore/components/ExploreStoryViewer";
import ExploreShareModal from "../features/explore/components/ExploreShareModal";
import ExploreTopBar from "../features/explore/components/ExploreTopBar";
import ConnectProfileModal from "../features/explore/components/ConnectProfileModal";
import ExplorePostComposer from "../features/explore/components/ExplorePostComposer";
import ExplorePostEditModal from "../features/explore/components/ExplorePostEditModal";
import ExploreEventDetailsModal from "../features/explore/components/ExploreEventDetailsModal";
import ExploreAnnouncementSubmissionModal from "../features/explore/components/ExploreAnnouncementSubmissionModal";
import {
  createConnectPost,
  createConnectPostComment,
  createConnectPostReshare,
  listConnectPosts,
  listSuggestedProfiles,
  removeConnectPostReshare,
  setConnectEventResponse,
  submitPostForAnnouncement,
  toggleConnectPostLike,
  updateConnectPost,
  voteOnConnectPostPoll,
} from "../features/explore/services/postService";
import {
  CAMPUS_FEED_FILTERS,
  EXPLORE_PRODUCT_DETAILS,
  FEED_COMMENTS,
  FEED_POSTS,
  MARKETPLACE_RESULTS,
  PEOPLE_WHO_CAN_HELP,
  SEARCH_HINTS,
  SEARCH_TABS,
  TOP_LEARNING_RESOURCES,
} from "../features/explore/constants";
import useExploreCampusState from "../features/explore/hooks/useExploreCampusState";
import useExploreConnectWorkflow from "../features/explore/hooks/useExploreConnectWorkflow";
import {
  createStory,
  listStories,
} from "../features/explore/services/storyService";
import { CAMPUS_EXPLORE_SEO } from "../features/seo/constants";
import {
  getAuthUserSnapshot,
  hydrateAuthUserFromBackend,
} from "../features/auth/services/authUserService";
import { normalizeZumbarlFileUrl } from "../lib/normalizeZumbarlFileUrl";
import {
  listMarketplaceListings,
  mapMarketplaceApiListing,
} from "../features/opportunities/services/marketplaceInteractionService";
import { setProfileRelationship } from "../features/profile/services/profileRelationshipService";
import { postCreatorProfilePath } from "../features/explore/utils/creatorProfilePath";
import "../styles/campus.css";
import "../styles/connect.css";
import "../styles/explore-campus.css";

function toStoryItem(record) {
  return {
    id: record.id,
    type: record.mediaType || "image",
    media: record.mediaUrl,
    poster: record.poster,
    storyKind: record.storyKind || record.context || "personal",
    title: record.title || "Campus story",
    caption: record.text,
    time: "Recently",
    likes: 0,
    comments: 0,
    product: record.product || null,
    trimStart: record.trimStart || 0,
    trimEnd: record.trimEnd || null,
    knowledgeSpace: record.knowledgeSpace || null,
    duration: record.trimEnd
      ? Math.max(500, (record.trimEnd - (record.trimStart || 0)) * 1000)
      : undefined,
  };
}

function ownStoryCreator(snapshot, items = []) {
  const user = snapshot?.user || {};
  const student = snapshot?.student || {};
  const name =
    student.name ||
    [student.firstName || user.firstName, student.lastName || user.lastName]
      .filter(Boolean)
      .join(" ") ||
    user.name ||
    "Your Story";
  return {
    id: "your-story",
    name,
    shortName: "Your Story",
    handle: `@${user.username || user.email?.split("@")[0] || "student"}`,
    campus: student.campus || "Your campus",
    zumbarlPoints: student.zumbarlPoints ?? student.score ?? null,
    zumbarlTier: student.zumbarlTier || null,
    avatar:
      normalizeZumbarlFileUrl(student.avatarUrl) ||
      "/assets/index/bee_nobg.png",
    own: true,
    storyCategory: "people",
    isSameCampus: true,
    items,
  };
}

function viewedStoryStorageKey(snapshot) {
  return `zumbarl:viewed-stories:${snapshot?.user?.id || "anonymous"}`;
}
function readViewedStoryIds(snapshot) {
  try {
    return new Set(
      JSON.parse(
        window.localStorage.getItem(viewedStoryStorageKey(snapshot)) || "[]",
      ),
    );
  } catch {
    return new Set();
  }
}

function groupPersistedStories(records, snapshot, viewedIds) {
  const own = ownStoryCreator(snapshot);
  const creators = new Map();
  records.forEach((record) => {
    const item = {
      ...toStoryItem(record),
      isViewed: record.isMine || viewedIds.has(record.id),
    };
    if (record.knowledgeSpace) {
      const key = `space-${record.knowledgeSpace.id}`;
      const creator = creators.get(key) || {
        id: key,
        name: record.knowledgeSpace.name,
        shortName: record.knowledgeSpace.name,
        handle: record.knowledgeSpace.type === "LIBRARY" ? "Library" : "Group",
        campus: record.creator?.campus || "Campus community",
        isSameCampus: true,
        storyCategory: record.knowledgeSpace.type === "LIBRARY" ? "libraries" : "groups",
        avatar: normalizeZumbarlFileUrl(record.knowledgeSpace.avatarUrl) || `/assets/knowledge/default-${record.knowledgeSpace.type.toLowerCase()}-avatar.svg`,
        items: [],
      };
      creator.items.push(item);
      creators.set(key, creator);
      return;
    }
    const isPageStory = record.creator && !['student', 'person'].includes(String(record.creator.profileType || 'student').toLowerCase());
    if (record.isMine && !isPageStory) {
      own.items.push(item);
      return;
    }
    if (!record.creator) return;
    const key = record.creator.id;
    const creator = creators.get(key) || {
      id: `story-${key}`,
      name: record.creator.name,
      shortName: record.creator.name.split(" ")[0],
      handle: record.creator.handle,
      campus: record.creator.campus,
      isSameCampus: record.creator.isSameCampus,
      avatar:
        normalizeZumbarlFileUrl(record.creator.avatarUrl) ||
        "/assets/index/bee_nobg.png",
      items: [],
      storyCategory: isPageStory ? "pages" : "people",
    };
    creator.items.push(item);
    creators.set(key, creator);
  });
  return [own, ...creators.values()];
}

function postMatchesFeed(post, filter) {
  if (filter === "All") return true;
  if (filter === "Following") return Boolean(post.isFollowing);
  if (filter === "For You") return !post.isMine && !post.isPinnedAnnouncement;
  if (filter === "Announcements")
    return Boolean(
      post.isPinnedAnnouncement ||
      post.announcementRequest?.status === "approved",
    );
  if (filter === "Events") return Boolean(post.event || post.type === "event");
  if (filter === "Marketplace")
    return Boolean(
      post.shopProductRef ||
      post.isPromoted ||
      post.type === "promotion" ||
      post.type === "marketplace-promo" ||
      post.tag === "Product",
    );
  if (filter === "Projects & Work")
    return Boolean(
      post.type === "project-update" || ["Project", "Work"].includes(post.tag),
    );
  return true;
}

function postEngagementSnapshot(post) {
  return {
    body: post.copy || 'Shared post',
    type: post.type || 'post',
    mediaUrls: post.gallery || [],
    mediaEdits: post.mediaEdits || [],
    creator: {
      id: post.creatorId || undefined,
      slug: post.creatorSlug || undefined,
      profileType: post.creatorProfileType || undefined,
      name: post.author || 'Zumbarl student',
      handle: post.handle || '@student',
      avatarUrl: post.avatar || null,
      campus: post.campus || null,
      zumbarlPoints: post.zumbarlPoints ?? undefined,
      zumbarlTier: post.zumbarlTier || undefined,
    },
    reactionCount: Number(post.stats?.likes || 0),
    commentCount: Number(post.stats?.comments || 0),
    repostCount: Number(post.stats?.reposts || 0),
  };
}

function relativeFeedTime(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}d ago`;
  return new Date(timestamp).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function marketplaceListingToRailProduct(listing) {
  const sellerName = listing.seller?.name || listing.shop?.name || "Campus seller";
  const deliveryOptions = Array.isArray(listing.deliveryOptions) ? listing.deliveryOptions : [];
  return {
    id: listing.id,
    seller: sellerName,
    sellerUsername: listing.seller?.username || "",
    title: listing.title,
    price: listing.price,
    badge: listing.badge || "Available",
    description: listing.description || listing.subtitle || "Available from a verified campus seller.",
    rating: Number(listing.shop?.ratingAverage || 0).toFixed(1),
    reviews: Number(listing.shop?.ratingCount || 0),
    sold: Number(listing.shop?.orderCount || 0),
    gallery: listing.galleryImages || [listing.image].filter(Boolean),
    featureChips: [
      { label: "Category", value: listing.category || "Other" },
      { label: "Condition", value: listing.condition || "Available" },
      { label: "Stock", value: `${Number(listing.stock || 0)} left` },
      { label: "Location", value: listing.location || "Campus" },
    ],
    summary: listing.description || listing.subtitle || "Available from a verified campus seller.",
    details: deliveryOptions.length
      ? deliveryOptions.map((option) => `Delivery: ${option}`)
      : ["Contact the seller to arrange campus collection or delivery."],
    colors: [],
    posts: [],
  };
}

function conciseText(value, fallback, length = 92) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > length
    ? `${normalized.slice(0, length - 1).trimEnd()}…`
    : normalized;
}

function ExploreCampusPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isSocialHome = location.pathname === "/campus";
  const requestedComposer = searchParams.get("compose") || "";
  const campusHubName = (searchParams.get("campus") || "").trim();
  const selectedTagReference = (searchParams.get("tag") || "").trim();
  const focusedPostId = (searchParams.get("post") || "").trim();
  const requestedStoryItemId = (searchParams.get("story") || "").trim();
  const [isConnectProfileOpen, setIsConnectProfileOpen] = useState(false);
  const connect = useExploreConnectWorkflow({
    onPrepareProfile: () => setIsConnectProfileOpen(true),
  });
  const [activeStoryId, setActiveStoryId] = useState("");
  const [activeStoryItemId, setActiveStoryItemId] = useState(requestedStoryItemId);
  const [isStoryComposerOpen, setIsStoryComposerOpen] = useState(false);
  const [stories, setStories] = useState(() => [
    ownStoryCreator(getAuthUserSnapshot()),
  ]);
  const [createdPosts, setCreatedPosts] = useState([]);
  const [feedComments, setFeedComments] = useState(FEED_COMMENTS);
  const [postEngagementOverrides, setPostEngagementOverrides] = useState({});
  const [engagementPending, setEngagementPending] = useState({});
  const [engagementErrors, setEngagementErrors] = useState({});
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false);
  const [postComposerType, setPostComposerType] = useState("post");
  const [editingPost, setEditingPost] = useState(null);
  const [activeEventPost, setActiveEventPost] = useState(null);
  const [eventResponsePending, setEventResponsePending] = useState(false);
  const [eventResponseError, setEventResponseError] = useState("");
  const [announcementPost, setAnnouncementPost] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [activeFeedFilter, setActiveFeedFilter] = useState("All");
  const [suggestedPeople, setSuggestedPeople] = useState([]);
  const [dismissedPeople, setDismissedPeople] = useState([]);
  const [suggestionPending, setSuggestionPending] = useState({});
  const [campusRailItems, setCampusRailItems] = useState([]);
  const [marketplaceRailItems, setMarketplaceRailItems] = useState([]);
  const [productDetails, setProductDetails] = useState(EXPLORE_PRODUCT_DETAILS);
  const [railDataLoading, setRailDataLoading] = useState(true);
  const scrolledPostIdRef = useRef("");

  useEffect(() => {
    if (requestedComposer === "story") {
      setIsStoryComposerOpen(true);
      return;
    }
    if (["post", "event"].includes(requestedComposer)) {
      setPostComposerType(requestedComposer);
      setIsPostComposerOpen(true);
    }
  }, [requestedComposer]);

  useEffect(() => {
    const openComposer = (event) => {
      const type = event.detail?.type || "post";
      if (type === "story") {
        setIsStoryComposerOpen(true);
        return;
      }
      setPostComposerType(type);
      setIsPostComposerOpen(true);
    };
    window.addEventListener("zumbarl:open-composer", openComposer);
    return () => window.removeEventListener("zumbarl:open-composer", openComposer);
  }, []);

  const {
    activeMediaComments,
    activeMediaImage,
    activeMediaIndex,
    activeMediaPost,
    activeQuery,
    activeRailProduct,
    activeRailProductGallery,
    activeRailProductImage,
    activeRailProductTab,
    areStoriesVisible,
    closeMediaViewer,
    handleClearSearch,
    handleSearchInputChange,
    handleSearchSubmit,
    handleStepRailProductImage,
    handleViewProduct,
    isSearchMode,
    mainScrollContainerRef,
    normalizedRailProductImageIndex,
    openMediaViewer,
    resetRailProduct,
    searchInput,
    setActiveRailProductImageIndex,
    setActiveRailProductTab,
    stepMediaViewer,
  } = useExploreCampusState({
    feedComments,
    feedPosts: FEED_POSTS,
    productDetails,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([hydrateAuthUserFromBackend(), listStories()])
      .then(([snapshot, response]) => {
        if (cancelled) return;
        const viewedIds = readViewedStoryIds(snapshot);
        const groupedStories = groupPersistedStories(response?.data || [], snapshot, viewedIds);
        setStories(groupedStories);
        if (requestedStoryItemId) {
          const requestedCreator = groupedStories.find((creator) =>
            creator.items?.some((item) => item.id === requestedStoryItemId),
          );
          if (requestedCreator) {
            setActiveStoryItemId(requestedStoryItemId);
            setActiveStoryId(requestedCreator.id);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [requestedStoryItemId]);

  useEffect(() => {
    let cancelled = false;
    setRailDataLoading(true);
    Promise.allSettled([
      listSuggestedProfiles(12),
      listMarketplaceListings(),
    ])
      .then(([peopleResult, marketplaceResult]) => {
        if (cancelled) return;
        if (peopleResult.status === "fulfilled") {
          setSuggestedPeople(
            (peopleResult.value?.data || []).map((person) => ({
              ...person,
              avatar: normalizeZumbarlFileUrl(person.avatarUrl),
              profileUrl: `/campus/profiles/${encodeURIComponent(person.id)}`,
            })),
          );
        }
        if (marketplaceResult.status === "fulfilled") {
          const listings = (marketplaceResult.value?.data || [])
            .map(mapMarketplaceApiListing)
            .filter(Boolean);
          const toRailItem = (item) => ({
            id: item.id,
            name: item.title,
            price: item.price,
            image: item.image,
            vendor: item.shop?.name || item.seller?.name || "Campus seller",
            badge: item.category || (item.kind === "service" ? "Service" : "Product"),
            href: `/campus/opportunities/buy-sell/${encodeURIComponent(item.id)}`,
            recommendation: item.recommendation,
          });
          const campusListings = listings.filter((item) => (
            item.campusOnly ||
            item.inventoryType === "food" ||
            item.shop?.entityType === "campus_vendor"
          ));
          const campusListingIds = new Set(campusListings.map((item) => item.id));
          const generalListings = listings.filter((item) => !campusListingIds.has(item.id));
          setProductDetails((current) => ({
            ...current,
            ...Object.fromEntries(listings.map((listing) => [listing.id, marketplaceListingToRailProduct(listing)])),
          }));
          setCampusRailItems(campusListings.slice(0, 3).map(toRailItem));
          setMarketplaceRailItems(generalListings.slice(0, 3).map(toRailItem));
        }
      })
      .finally(() => {
        if (!cancelled) setRailDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function mapComment(comment) {
    return {
      id: comment.id,
      author: comment.author || "Zumbarl student",
      handle: comment.handle || "@student",
      avatar: normalizeZumbarlFileUrl(comment.avatar),
      text: comment.body,
      time: "Recently",
    };
  }
  function mapConnectPost(post) {
    const taggedSpace = (post.tags || []).find((tag) => String(tag?.type || "").startsWith("knowledge-"));
    const taggedProduct = (post.tags || []).find((tag) => String(tag?.type || "") === "product");
    const taggedAcademic = (post.tags || []).filter((tag) => ["university", "course", "unit"].includes(String(tag?.type || "")));
    const shopProductRef = post.shopProductRef || taggedProduct?.id || null;
    const knowledgeSpace = post.knowledgeSpace || (taggedSpace ? {
      id: taggedSpace.id,
      name: taggedSpace.label,
      type: String(taggedSpace.type || "").replace("knowledge-", "").toUpperCase(),
    } : null);
    const isSpaceAuthored = Boolean(post.knowledgeSpace);
    const isPromoted = Boolean(post.isPromoted || post.promotion || post.type === "promotion");
    const spaceType = String(post.knowledgeSpace?.type || "").toLowerCase();
    const contentTag = isPromoted
      ? "Promoted"
      : post.feeling
      ? `${post.feeling.emoji} ${post.feeling.label}`
      : shopProductRef
        ? "Product"
        : post.type === "video"
          ? "Video"
          : post.type === "image"
            ? "Photo"
            : post.type === "event"
              ? "Event"
              : post.type === "poll"
                ? "Poll"
                : post.type === "project-update"
                  ? "Project"
                  : post.type === "marketplace-promo"
                    ? "Product"
                    : "Update";
    return {
      id: post.id,
      type: post.type,
      creatorId: isSpaceAuthored ? knowledgeSpace.id : post.creator?.id || null,
      creatorSlug: isSpaceAuthored ? knowledgeSpace.slug || null : post.creator?.slug || null,
      creatorProfileType: isSpaceAuthored ? `knowledge-${spaceType}` : post.creator?.profileType || "student",
      author: isSpaceAuthored ? knowledgeSpace.name : post.creator?.name || "Zumbarl student",
      handle: isSpaceAuthored ? (spaceType === "library" ? "Library" : "Study group") : post.creator?.handle || "@student",
      campus: post.creator?.campus || null,
      zumbarlPoints: post.creator?.zumbarlPoints ?? null,
      zumbarlTier: post.creator?.zumbarlTier || null,
      avatar: isSpaceAuthored
        ? normalizeZumbarlFileUrl(knowledgeSpace.avatarUrl) || `/assets/knowledge/default-${spaceType || "group"}-avatar.svg`
        : normalizeZumbarlFileUrl(post.creator?.avatarUrl),
      time:
        post.updatedAt && post.createdAt && post.updatedAt !== post.createdAt
          ? "Edited recently"
          : "Recently",
      tag: !isSpaceAuthored && knowledgeSpace?.name ? `Tagged · ${knowledgeSpace.name}` : contentTag,
      copy: post.type === "reshare" ? post.reshareCommentary || "" : post.body,
      gallery: post.type === "reshare" ? [] : post.mediaUrls || [],
      mediaEdits: post.mediaEdits || [],
      event: post.event || null,
      poll: post.poll || null,
      resharedPost: post.resharedPost || null,
      reshareOfPostId: post.reshareOfPostId || null,
      announcementRequest: post.announcementRequest || null,
      isPinnedAnnouncement: Boolean(post.isPinnedAnnouncement),
      isPromoted,
      promotion: post.promotion || null,
      isMine: Boolean(post.isMine),
      isFollowing: Boolean(post.isFollowing),
      isPriorityForViewer: Boolean(post.isPriorityForViewer),
      knowledgeSpace,
      taggedSpace: !isSpaceAuthored && knowledgeSpace ? {
        ...knowledgeSpace,
        href: `/campus/learn/spaces/${encodeURIComponent(knowledgeSpace.slug || knowledgeSpace.id)}`,
      } : null,
      shopProductRef,
      taggedProduct: shopProductRef ? {
        id: shopProductRef,
        title: post.taggedProduct?.title || taggedProduct?.label || "View product",
      } : null,
      taggedAcademic: taggedAcademic.map((tag) => ({
        ...tag,
        href: `/campus/explore?tag=${encodeURIComponent(`${tag.type}:${tag.id}`)}`,
      })),
      tagReferences: (post.tags || []).map((tag) => `${tag.type}:${tag.id}`),
      stats: {
        likes: post.reactionCount || 0,
        comments: post.commentCount || post.comments?.length || 0,
        reposts: post.repostCount ?? post.reposts ?? 0,
      },
      viewerLiked: Boolean(post.viewerReacted),
      viewerReshared: Boolean(post.viewerReshared),
      viewerReshareCommentary: post.viewerReshareCommentary || "",
      createdAt: post.createdAt || null,
      updatedAt: post.updatedAt || null,
    };
  }

  useEffect(() => {
    listConnectPosts({ postId: focusedPostId })
      .then((response) => {
        const records = response?.data || [];
        setCreatedPosts(records.map(mapConnectPost));
        setFeedComments((current) => {
          const next = { ...current };
          records.forEach((post) => {
            const persisted = (post.comments || []).map(mapComment);
            const persistedIds = new Set(persisted.map((comment) => comment.id));
            next[post.id] = [
              ...(current[post.id] || []).filter((comment) => !persistedIds.has(comment.id)),
              ...persisted,
            ];
          });
          return next;
        });
      })
      .catch(() => {});
  }, [focusedPostId]);

  function buildExploreShareUrl(kind, id) {
    const url = new URL(window.location.href);
    url.pathname = "/campus/explore";
    url.searchParams.delete("post");
    url.searchParams.delete("story");
    url.searchParams.set(kind, id);
    url.hash = "";
    return url.toString();
  }

  function sharePost(post) {
    const originalCopy = post.resharedPost?.body || post.resharedPost?.copy || "";
    setShareTarget({
      kind: "post",
      id: post.id,
      author: post.author,
      title: post.event?.title || `${post.author}'s post on Zumbarl`,
      text: post.copy || originalCopy || "See this post on Zumbarl",
      url: buildExploreShareUrl("post", post.id),
    });
  }

  function shareStory(item, creator) {
    setShareTarget({
      kind: "story",
      id: item.id,
      author: creator.name,
      title: item.title || `${creator.name}'s story on Zumbarl`,
      text: item.caption || "See this story on Zumbarl",
      url: buildExploreShareUrl("story", item.id),
    });
  }

  function openStory(creatorId) {
    setActiveStoryItemId("");
    setActiveStoryId(creatorId);
  }
  async function publishPost(payload) {
    const post = await createConnectPost(payload);
    const snapshot = await hydrateAuthUserFromBackend();
    const creator = ownStoryCreator(snapshot);
    setCreatedPosts((current) => [
      mapConnectPost({ ...post, creator, isMine: true }),
      ...current,
    ]);
  }
  function openPostComposer(type = "post") {
    setPostComposerType(type);
    setIsPostComposerOpen(true);
  }
  function openEditPost(post) {
    setEditingPost(post);
  }
  async function saveEditedPost(id, payload) {
    const updated = await updateConnectPost(id, payload);
    setCreatedPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              copy: updated.body,
              gallery: updated.mediaUrls || [],
              mediaEdits: updated.mediaEdits || [],
              time: "Edited recently",
            }
          : post,
      ),
    );
  }
  async function addPostComment(id, body, post) {
    const activePost = post || visibleFeedPosts.find((candidate) => candidate.id === id);
    setEngagementErrors((current) => ({ ...current, [id]: '' }));
    const saved = await createConnectPostComment(id, body, postEngagementSnapshot(activePost || {}));
    const comment = mapComment(saved);
    setFeedComments((current) => ({
      ...current,
      [id]: [...(current[id] || []), comment],
    }));
    setPostEngagementOverrides((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {}),
        stats: {
          ...(current[id]?.stats || {}),
          comments: Number(activePost?.stats?.comments || 0) + 1,
        },
      },
    }));
    return comment;
  }

  async function togglePostLike(post) {
    const key = `${post.id}:like`;
    const previousLiked = Boolean(post.viewerLiked);
    const previousCount = Number(post.stats.likes || 0);
    setEngagementPending((current) => ({ ...current, [key]: true }));
    setEngagementErrors((current) => ({ ...current, [post.id]: '' }));
    setPostEngagementOverrides((current) => ({
      ...current,
      [post.id]: {
        ...(current[post.id] || {}),
        viewerLiked: !previousLiked,
        stats: { ...(current[post.id]?.stats || {}), likes: Math.max(0, previousCount + (previousLiked ? -1 : 1)) },
      },
    }));
    try {
      const saved = await toggleConnectPostLike(post.id, postEngagementSnapshot(post));
      setPostEngagementOverrides((current) => ({
        ...current,
        [post.id]: {
          ...(current[post.id] || {}),
          viewerLiked: saved.viewerReacted,
          stats: { ...(current[post.id]?.stats || {}), likes: saved.reactionCount },
        },
      }));
    } catch (requestError) {
      setPostEngagementOverrides((current) => ({
        ...current,
        [post.id]: {
          ...(current[post.id] || {}),
          viewerLiked: previousLiked,
          stats: { ...(current[post.id]?.stats || {}), likes: previousCount },
        },
      }));
      setEngagementErrors((current) => ({ ...current, [post.id]: requestError.message || 'Could not update this like.' }));
    } finally {
      setEngagementPending((current) => ({ ...current, [key]: false }));
    }
  }

  async function setPostReshare(post, active, commentary = "") {
    const key = `${post.id}:reshare`;
    const previousReshared = Boolean(post.viewerReshared);
    const previousCount = Number(post.stats.reposts || 0);
    setEngagementPending((current) => ({ ...current, [key]: true }));
    setEngagementErrors((current) => ({ ...current, [post.id]: '' }));
    setPostEngagementOverrides((current) => ({
      ...current,
      [post.id]: {
        ...(current[post.id] || {}),
        viewerReshared: active,
        viewerReshareCommentary: active ? commentary : "",
        stats: {
          ...(current[post.id]?.stats || {}),
          reposts: Math.max(
            0,
            previousCount + (active && !previousReshared ? 1 : !active && previousReshared ? -1 : 0),
          ),
        },
      },
    }));
    try {
      const saved = active
        ? await createConnectPostReshare(post.id, postEngagementSnapshot(post), commentary)
        : await removeConnectPostReshare(post.id);
      setPostEngagementOverrides((current) => ({
        ...current,
        [post.id]: {
          ...(current[post.id] || {}),
          viewerReshared: saved.viewerReshared,
          viewerReshareCommentary: saved.viewerReshareCommentary || "",
          stats: { ...(current[post.id]?.stats || {}), reposts: saved.repostCount },
        },
      }));
      const feedResponse = await listConnectPosts({ postId: focusedPostId }).catch(() => null);
      if (feedResponse) {
        const records = feedResponse.data || [];
        setCreatedPosts(records.map(mapConnectPost));
        setFeedComments((current) => {
          const next = { ...current };
          records.forEach((record) => {
            const persisted = (record.comments || []).map(mapComment);
            const persistedIds = new Set(persisted.map((comment) => comment.id));
            next[record.id] = [
              ...(current[record.id] || []).filter((comment) => !persistedIds.has(comment.id)),
              ...persisted,
            ];
          });
          return next;
        });
      }
    } catch (requestError) {
      setPostEngagementOverrides((current) => ({
        ...current,
        [post.id]: {
          ...(current[post.id] || {}),
          viewerReshared: previousReshared,
          stats: { ...(current[post.id]?.stats || {}), reposts: previousCount },
        },
      }));
      setEngagementErrors((current) => ({ ...current, [post.id]: requestError.message || 'Could not update this reshare.' }));
      throw requestError;
    } finally {
      setEngagementPending((current) => ({ ...current, [key]: false }));
    }
  }

  async function voteOnPoll(post, optionIds) {
    const key = `${post.id}:poll`;
    setEngagementPending((current) => ({ ...current, [key]: true }));
    setEngagementErrors((current) => ({ ...current, [post.id]: "" }));
    try {
      const saved = await voteOnConnectPostPoll(post.id, optionIds);
      setCreatedPosts((current) => current.map((item) => item.id === post.id ? { ...item, poll: saved.poll } : item));
      setPostEngagementOverrides((current) => ({
        ...current,
        [post.id]: { ...(current[post.id] || {}), poll: saved.poll },
      }));
      return saved.poll;
    } catch (requestError) {
      setEngagementErrors((current) => ({ ...current, [post.id]: requestError.message || "Your poll choice could not be saved." }));
      throw requestError;
    } finally {
      setEngagementPending((current) => ({ ...current, [key]: false }));
    }
  }
  async function submitAnnouncement(id, payload) {
    const updated = await submitPostForAnnouncement(id, payload);
    setCreatedPosts((current) =>
      current.map((post) =>
        post.id === id
          ? { ...post, announcementRequest: updated.announcementRequest }
          : post,
      ),
    );
    return updated;
  }

  function openEventDetails(post) {
    setEventResponseError("");
    setActiveEventPost(post);
  }

  async function respondToEvent(post, status) {
    setEventResponsePending(true);
    setEventResponseError("");
    try {
      const saved = await setConnectEventResponse(post.id, status);
      const applyResponse = (candidate) =>
        candidate?.id === post.id
          ? {
              ...candidate,
              event: {
                ...candidate.event,
                id: saved.eventId,
                viewerResponse: saved.viewerResponse,
                goingCount: saved.goingCount,
                interestedCount: saved.interestedCount,
                responseCount: saved.responseCount,
              },
            }
          : candidate;
      setCreatedPosts((current) => current.map(applyResponse));
      setActiveEventPost((current) => applyResponse(current));
      return saved;
    } catch (requestError) {
      setEventResponseError(
        requestError.message || "Could not update your event response.",
      );
      return null;
    } finally {
      setEventResponsePending(false);
    }
  }

  async function handlePublishStory(story) {
    await createStory({
      title: story.title,
      text: story.caption,
      mediaUrl: story.media,
      mediaType: story.type,
      poster: story.poster,
      storyKind: story.storyKind,
      product: story.product,
      visibility: "campus",
      context: story.storyKind,
      knowledgeSpaceId: story.knowledgeSpaceId || undefined,
      trimStart: story.trimStart,
      trimEnd: story.trimEnd,
    });
    const [snapshot, response] = await Promise.all([hydrateAuthUserFromBackend(), listStories()]);
    setStories(groupPersistedStories(response?.data || [], snapshot, readViewedStoryIds(snapshot)));
    connect.patchState({ profileReady: true, storyPublished: true });
    setIsStoryComposerOpen(false);
    setActiveStoryId(story.knowledgeSpaceId ? `space-${story.knowledgeSpaceId}` : "your-story");
  }

  const handleStoryViewed = useCallback((creatorId, itemId) => {
    setStories((current) =>
      current.map((creator) =>
        creator.id === creatorId
          ? {
              ...creator,
              items: creator.items.map((item) =>
                item.id === itemId ? { ...item, isViewed: true } : item,
              ),
            }
          : creator,
      ),
    );
    const snapshot = getAuthUserSnapshot();
    const viewedIds = readViewedStoryIds(snapshot);
    viewedIds.add(itemId);
    window.localStorage.setItem(
      viewedStoryStorageKey(snapshot),
      JSON.stringify([...viewedIds]),
    );
  }, []);

  async function handleSaveConnectProfile(payload) {
    const profile = await connect.handleSaveProfile(payload);
    const [snapshot, response] = await Promise.all([
      hydrateAuthUserFromBackend(),
      listStories(),
    ]);
    setStories(
      groupPersistedStories(
        response?.data || [],
        snapshot,
        readViewedStoryIds(snapshot),
      ),
    );
    return profile;
  }

  const visibleFeedPosts = useMemo(
    () => {
      const seen = new Set();
      const filteredPosts = [...createdPosts, ...(campusHubName ? [] : FEED_POSTS)]
        .map((post) => {
          const override = postEngagementOverrides[post.id] || {};
          return {
            ...post,
            ...override,
            stats: { ...post.stats, ...(override.stats || {}) },
          };
        })
        .filter((post) => {
        if (seen.has(post.id)) return false;
        seen.add(post.id);
        const belongsToCampus =
          !campusHubName ||
          post.campus?.toLocaleLowerCase() ===
            campusHubName.toLocaleLowerCase();
          const matchesSelectedTag = !selectedTagReference || (post.tagReferences || []).includes(selectedTagReference);
          return belongsToCampus && matchesSelectedTag && (post.id === focusedPostId || postMatchesFeed(post, activeFeedFilter));
        });
      const focusedIndex = focusedPostId
        ? filteredPosts.findIndex((post) => post.id === focusedPostId)
        : -1;
      return focusedIndex > 0
        ? [filteredPosts[focusedIndex], ...filteredPosts.filter((_, index) => index !== focusedIndex)]
        : filteredPosts;
    },
    [activeFeedFilter, campusHubName, createdPosts, focusedPostId, postEngagementOverrides, selectedTagReference],
  );

  const railPeople = useMemo(
    () => suggestedPeople.filter((person) => {
      if (dismissedPeople.includes(person.id)) return false;
      if (person.isFollowing) return false;
      return !campusHubName || person.campus?.toLocaleLowerCase() === campusHubName.toLocaleLowerCase();
    }),
    [campusHubName, dismissedPeople, suggestedPeople],
  );

  const railAnnouncements = useMemo(
    () => createdPosts
      .filter((post) => post.isPinnedAnnouncement || post.announcementRequest?.status === "approved")
      .slice(0, 3)
      .map((post) => {
        const body = String(post.copy || "").replace(/\s+/g, " ").trim();
        const firstSentence = body.split(/(?<=[.!?])\s+/)[0];
        const params = new URLSearchParams();
        if (campusHubName) params.set("campus", campusHubName);
        params.set("post", post.id);
        return {
          id: post.id,
          title: conciseText(post.event?.title || firstSentence, "Campus announcement", 64),
          detail: body && body !== firstSentence
            ? conciseText(body, `Posted by ${post.author}`)
            : "",
          owner: post.author,
          ownerAvatar: post.avatar || "/assets/index/bee_nobg.png",
          ownerHandle: post.handle,
          ownerProfileUrl: postCreatorProfilePath(post),
          time: relativeFeedTime(post.updatedAt || post.createdAt),
          postUrl: `/campus/explore?${params.toString()}`,
        };
      }),
    [campusHubName, createdPosts],
  );

  const railEvents = useMemo(
    () => createdPosts
      .filter((post) => {
        const startsAt = new Date(post.event?.startsAt).getTime();
        return post.event && Number.isFinite(startsAt) && startsAt >= Date.now();
      })
      .slice(0, 3)
      .map((post) => ({
        id: post.id,
        title: post.event.title,
        dateTime: new Date(post.event.startsAt).toLocaleString("en-KE", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        location: post.event.location || post.event.locationName || "Location to be announced",
        image: normalizeZumbarlFileUrl(post.gallery[0] || post.event.coverImageUrl) || "/assets/index/bee_nobg.png",
        goingCount: Number(post.event.goingCount || 0),
        interestedCount: Number(post.event.interestedCount || 0),
        capacity: Number(post.event.capacity) > 0 ? Number(post.event.capacity) : null,
        post,
      })),
    [createdPosts],
  );

  async function toggleSuggestedFollow(person) {
    if (suggestionPending[person.id]) return;
    const previous = Boolean(person.isFollowing);
    const next = !previous;
    setSuggestionPending((current) => ({ ...current, [person.id]: true }));
    setSuggestedPeople((current) => current.map((candidate) => candidate.id === person.id ? { ...candidate, isFollowing: next } : candidate));
    setCreatedPosts((current) => current.map((post) => post.creatorId === person.id ? { ...post, isFollowing: next } : post));
    try {
      const relationship = await setProfileRelationship(person.id, "follow", next);
      const persisted = Boolean(relationship?.isFollowing);
      setSuggestedPeople((current) => current.map((candidate) => candidate.id === person.id ? { ...candidate, isFollowing: persisted } : candidate));
      setCreatedPosts((current) => current.map((post) => post.creatorId === person.id ? { ...post, isFollowing: persisted } : post));
    } catch {
      setSuggestedPeople((current) => current.map((candidate) => candidate.id === person.id ? { ...candidate, isFollowing: previous } : candidate));
      setCreatedPosts((current) => current.map((post) => post.creatorId === person.id ? { ...post, isFollowing: previous } : post));
    } finally {
      setSuggestionPending((current) => ({ ...current, [person.id]: false }));
    }
  }

  function showRailFeed(filter) {
    setActiveFeedFilter(filter);
    window.requestAnimationFrame(() => {
      mainScrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  useEffect(() => {
    if (!focusedPostId || scrolledPostIdRef.current === focusedPostId || !visibleFeedPosts.some((post) => post.id === focusedPostId)) return undefined;
    let lookupTimer;
    let correctionTimer;
    let settleTimer;
    let cancelled = false;

    const alignFocusedPost = (behavior = "smooth") => {
      const target = document.getElementById(`connect-post-${focusedPostId}`);
      const scrollContainer = mainScrollContainerRef.current;
      const stickyHead = scrollContainer?.querySelector(".explore-campus-sticky-head");
      if (!target || !stickyHead) return;

      const stickyRect = stickyHead.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const visualGap = 32;
      const visualDelta = targetRect.top - (stickyRect.bottom + visualGap);
      if (Math.abs(visualDelta) < 2) return;

      // The campus shell uses CSS zoom. Rectangles are measured in visual
      // pixels, but scroll offsets are layout pixels, so account for its scale.
      const visualScale = stickyHead.offsetHeight > 0
        ? stickyRect.height / stickyHead.offsetHeight
        : 1;
      const scrollDelta = visualDelta / (visualScale || 1);

      if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        scrollContainer.scrollBy({ top: scrollDelta, behavior });
      } else {
        window.scrollBy({ top: scrollDelta, behavior });
      }
    };

    const beginAlignment = (attempt = 0) => {
      const target = document.getElementById(`connect-post-${focusedPostId}`);
      const stickyHead = mainScrollContainerRef.current?.querySelector(".explore-campus-sticky-head");
      if (!target || !stickyHead) {
        if (attempt < 12 && !cancelled) {
          lookupTimer = window.setTimeout(() => beginAlignment(attempt + 1), 100);
        }
        return;
      }

      scrolledPostIdRef.current = focusedPostId;
      alignFocusedPost();

      // Stories contract while the first smooth scroll runs. Re-align after
      // that transition and make one final correction once scrolling settles.
      correctionTimer = window.setTimeout(() => alignFocusedPost(), 450);
      settleTimer = window.setTimeout(() => alignFocusedPost("auto"), 900);
    };

    const frame = window.requestAnimationFrame(() => beginAlignment());
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(lookupTimer);
      window.clearTimeout(correctionTimer);
      window.clearTimeout(settleTimer);
    };
  }, [focusedPostId, mainScrollContainerRef, visibleFeedPosts]);

  return (
    <main className="campus-page explore-campus-page">
      <Seo
        title={CAMPUS_EXPLORE_SEO.title}
        description={CAMPUS_EXPLORE_SEO.description}
        path={CAMPUS_EXPLORE_SEO.path}
        keywords={CAMPUS_EXPLORE_SEO.keywords}
        jsonLd={[CAMPUS_EXPLORE_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div
          className={`campus-shell explore-campus-shell${activeRailProduct ? " is-product-detail-open" : ""}`}
        >
          <CampusSidebar activeItemId="explore" />

          <section
            ref={mainScrollContainerRef}
            className="campus-main explore-campus-main"
          >
            <ExploreTopBar
              onCreate={() => openPostComposer("post")}
              onClearSearch={handleClearSearch}
              onSearchInputChange={handleSearchInputChange}
              onSearchSubmit={handleSearchSubmit}
              searchInput={searchInput}
            />

            <div className="explore-campus-feed-head-area">
              {isSearchMode ? (
                <ExploreSearchSummary
                  activeQuery={activeQuery}
                  hints={SEARCH_HINTS}
                  tabs={SEARCH_TABS}
                />
              ) : (
                <ExploreFeedHero
                  activeFilter={activeFeedFilter}
                  areStoriesVisible={areStoriesVisible}
                  filters={CAMPUS_FEED_FILTERS}
                  isHome={isSocialHome}
                  onOpenStory={openStory}
                  onSelectFilter={setActiveFeedFilter}
                  onPrepareProfile={connect.handlePrepareProfile}
                  onPublishStory={() => setIsStoryComposerOpen(true)}
                  stories={stories}
                />
              )}
            </div>

            {isSearchMode ? (
              <ExploreSearchResults
                marketplaceResults={MARKETPLACE_RESULTS}
                people={PEOPLE_WHO_CAN_HELP}
                resources={TOP_LEARNING_RESOURCES}
              />
            ) : (
              <>
                <ExploreFeed
                  activeFilter={activeFeedFilter}
                  commentsByPost={feedComments}
                  engagementErrors={engagementErrors}
                  engagementPending={engagementPending}
                  focusedPostId={focusedPostId}
                  onComment={addPostComment}
                  onComposerPost={openPostComposer}
                  onEditPost={openEditPost}
                  onLikePost={togglePostLike}
                  onOpenEvent={openEventDetails}
                  onOpenMediaViewer={openMediaViewer}
                  onRemoveReshare={(post) => setPostReshare(post, false)}
                  onResharePost={(post, commentary) => setPostReshare(post, true, commentary)}
                  onSharePost={sharePost}
                  onSubmitAnnouncement={setAnnouncementPost}
                  onVotePoll={voteOnPoll}
                  onViewProduct={handleViewProduct}
                  posts={visibleFeedPosts}
                />
              </>
            )}
          </section>

          <aside
            className="campus-rail explore-campus-rail"
            aria-label="Explore campus side panels"
          >
            {activeRailProduct ? (
              <ExploreProductRail
                activeRailProduct={activeRailProduct}
                activeRailProductGallery={activeRailProductGallery}
                activeRailProductImage={activeRailProductImage}
                activeRailProductTab={activeRailProductTab}
                normalizedRailProductImageIndex={
                  normalizedRailProductImageIndex
                }
                onClose={resetRailProduct}
                onSelectImage={setActiveRailProductImageIndex}
                onSetTab={setActiveRailProductTab}
                onStepImage={handleStepRailProductImage}
              />
            ) : (
              <ExploreDefaultRail
                announcements={railAnnouncements}
                campusItems={campusRailItems}
                events={railEvents}
                isLoading={railDataLoading}
                marketplaceItems={marketplaceRailItems}
                people={railPeople}
                pendingPeople={suggestionPending}
                onDismissPerson={(id) => setDismissedPeople((current) => current.includes(id) ? current : [...current, id])}
                onFollowPerson={toggleSuggestedFollow}
                onOpenEvent={openEventDetails}
                onSeeAnnouncements={() => showRailFeed("Announcements")}
                onSeeEvents={() => showRailFeed("Events")}
              />
            )}
          </aside>

          <ExploreMediaModal
            activeMediaComments={activeMediaComments}
            activeMediaImage={activeMediaImage}
            activeMediaIndex={activeMediaIndex}
            activeMediaPost={activeMediaPost}
            onClose={closeMediaViewer}
            onComment={addPostComment}
            onSharePost={sharePost}
            onStep={stepMediaViewer}
          />
          <ExploreStoryViewer
            key={`${activeStoryId}:${activeStoryItemId}`}
            activeStoryId={activeStoryId}
            activeStoryItemId={activeStoryItemId}
            onClose={() => {
              setActiveStoryId("");
              setActiveStoryItemId("");
            }}
            onShareStory={shareStory}
            onStoryViewed={handleStoryViewed}
            stories={stories.filter((story) => story.items?.length)}
          />
          <ExploreStoryComposer
            isOpen={isStoryComposerOpen}
            onClose={() => setIsStoryComposerOpen(false)}
            onPublish={handlePublishStory}
          />
          <ConnectProfileModal
            key={isConnectProfileOpen ? `open:${connect.connectProfile?.updatedAt || 'new'}` : 'closed'}
            isOpen={isConnectProfileOpen}
            onClose={() => setIsConnectProfileOpen(false)}
            onSave={handleSaveConnectProfile}
            profile={connect.connectProfile}
          />
          <ExplorePostComposer
            initialType={postComposerType}
            isOpen={isPostComposerOpen}
            onClose={() => setIsPostComposerOpen(false)}
            onPublish={publishPost}
          />
          <ExplorePostEditModal
            post={editingPost}
            onClose={() => setEditingPost(null)}
            onSave={saveEditedPost}
          />
          <ExploreEventDetailsModal
            error={eventResponseError}
            isResponding={eventResponsePending}
            post={activeEventPost}
            onClose={() => {
              setActiveEventPost(null);
              setEventResponseError("");
            }}
            onRespond={respondToEvent}
            onSharePost={sharePost}
          />
          <ExploreAnnouncementSubmissionModal
            post={announcementPost}
            onClose={() => setAnnouncementPost(null)}
            onSubmit={submitAnnouncement}
          />
          <ExploreShareModal key={shareTarget?.url || "share"} target={shareTarget} onClose={() => setShareTarget(null)} />
        </div>
      </div>
    </main>
  );
}

export default ExploreCampusPage;
