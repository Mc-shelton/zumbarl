import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import ExploreTopBar from "../features/explore/components/ExploreTopBar";
import ConnectProfileModal from "../features/explore/components/ConnectProfileModal";
import ExplorePostComposer from "../features/explore/components/ExplorePostComposer";
import ExplorePostEditModal from "../features/explore/components/ExplorePostEditModal";
import ExploreEventDetailsModal from "../features/explore/components/ExploreEventDetailsModal";
import ExploreAnnouncementSubmissionModal from "../features/explore/components/ExploreAnnouncementSubmissionModal";
import {
  createConnectPost,
  createConnectPostComment,
  listConnectPosts,
  submitPostForAnnouncement,
  updateConnectPost,
} from "../features/explore/services/postService";
import {
  CAMPUS_ANNOUNCEMENTS,
  CAMPUS_FEED_FILTERS,
  EXPLORE_PRODUCT_DETAILS,
  FEED_COMMENTS,
  FEED_POSTS,
  MARKETPLACE_ITEMS,
  MARKETPLACE_RESULTS,
  PEOPLE_WHO_CAN_HELP,
  PEOPLE_YOU_MAY_KNOW,
  SEARCH_HINTS,
  SEARCH_TABS,
  TOP_LEARNING_RESOURCES,
  UPCOMING_EVENTS,
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
    avatar:
      normalizeZumbarlFileUrl(student.avatarUrl) ||
      "/assets/index/bee_nobg.png",
    own: true,
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
    if (record.isMine) {
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
      post.type === "marketplace-promo" ||
      post.tag === "Product",
    );
  if (filter === "Projects & Work")
    return Boolean(
      post.type === "project-update" || ["Project", "Work"].includes(post.tag),
    );
  return true;
}

function ExploreCampusPage() {
  const [searchParams] = useSearchParams();
  const campusHubName = (searchParams.get("campus") || "").trim();
  const [isConnectProfileOpen, setIsConnectProfileOpen] = useState(false);
  const connect = useExploreConnectWorkflow({
    onPrepareProfile: () => setIsConnectProfileOpen(true),
  });
  const [activeStoryId, setActiveStoryId] = useState("");
  const [isStoryComposerOpen, setIsStoryComposerOpen] = useState(false);
  const [stories, setStories] = useState(() => [
    ownStoryCreator(getAuthUserSnapshot()),
  ]);
  const [createdPosts, setCreatedPosts] = useState([]);
  const [feedComments, setFeedComments] = useState(FEED_COMMENTS);
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false);
  const [postComposerType, setPostComposerType] = useState("post");
  const [editingPost, setEditingPost] = useState(null);
  const [activeEventPost, setActiveEventPost] = useState(null);
  const [announcementPost, setAnnouncementPost] = useState(null);
  const [activeFeedFilter, setActiveFeedFilter] = useState("All");
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
    productDetails: EXPLORE_PRODUCT_DETAILS,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([hydrateAuthUserFromBackend(), listStories()])
      .then(([snapshot, response]) => {
        if (cancelled) return;
        const viewedIds = readViewedStoryIds(snapshot);
        setStories(
          groupPersistedStories(response?.data || [], snapshot, viewedIds),
        );
      })
      .catch(() => {});
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
    return {
      id: post.id,
      type: post.type,
      creatorId: post.creator?.id || null,
      creatorSlug: post.creator?.slug || null,
      creatorProfileType: post.creator?.profileType || "student",
      author: post.creator?.name || "Zumbarl student",
      handle: post.creator?.handle || "@student",
      campus: post.creator?.campus || null,
      avatar: normalizeZumbarlFileUrl(post.creator?.avatarUrl),
      time:
        post.updatedAt && post.createdAt && post.updatedAt !== post.createdAt
          ? "Edited recently"
          : "Recently",
      tag: post.feeling
        ? `${post.feeling.emoji} ${post.feeling.label}`
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
                    : "Update",
      copy: post.body,
      gallery: post.mediaUrls || [],
      mediaEdits: post.mediaEdits || [],
      event: post.event || null,
      poll: post.poll || null,
      announcementRequest: post.announcementRequest || null,
      isPinnedAnnouncement: Boolean(post.isPinnedAnnouncement),
      isMine: Boolean(post.isMine),
      isFollowing: Boolean(post.isFollowing),
      stats: {
        likes: 0,
        comments: post.commentCount || post.comments?.length || 0,
        reposts: post.reposts || 0,
      },
    };
  }

  useEffect(() => {
    listConnectPosts()
      .then((response) => {
        const records = response?.data || [];
        setCreatedPosts(records.map(mapConnectPost));
        setFeedComments((current) => ({
          ...current,
          ...Object.fromEntries(
            records.map((post) => [
              post.id,
              (post.comments || []).map(mapComment),
            ]),
          ),
        }));
      })
      .catch(() => {});
  }, []);
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
  async function addPostComment(id, body) {
    const saved = await createConnectPostComment(id, body);
    const comment = mapComment(saved);
    setFeedComments((current) => ({
      ...current,
      [id]: [...(current[id] || []), comment],
    }));
    setCreatedPosts((current) =>
      current.map((post) =>
        post.id === id
          ? {
              ...post,
              stats: { ...post.stats, comments: post.stats.comments + 1 },
            }
          : post,
      ),
    );
    return comment;
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

  async function handlePublishStory(story) {
    const record = await createStory({
      title: story.title,
      text: story.caption,
      mediaUrl: story.media,
      mediaType: story.type,
      poster: story.poster,
      storyKind: story.storyKind,
      product: story.product,
      visibility: "campus",
      context: story.storyKind,
      trimStart: story.trimStart,
      trimEnd: story.trimEnd,
    });
    const persistedStory = { ...toStoryItem(record), isViewed: true };
    setStories((current) =>
      current.map((creator) =>
        creator.own
          ? { ...creator, items: [persistedStory, ...(creator.items || [])] }
          : creator,
      ),
    );
    connect.patchState({ profileReady: true, storyPublished: true });
    setIsStoryComposerOpen(false);
    setActiveStoryId("your-story");
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
    () =>
      [...createdPosts, ...(campusHubName ? [] : FEED_POSTS)].filter((post) => {
        const belongsToCampus =
          !campusHubName ||
          post.campus?.toLocaleLowerCase() ===
            campusHubName.toLocaleLowerCase();
        return belongsToCampus && postMatchesFeed(post, activeFeedFilter);
      }),
    [activeFeedFilter, campusHubName, createdPosts],
  );

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
            <div className="explore-campus-sticky-head">
              <ExploreTopBar
                onClearSearch={handleClearSearch}
                onSearchInputChange={handleSearchInputChange}
                onSearchSubmit={handleSearchSubmit}
                searchInput={searchInput}
              />

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
                  onOpenStory={setActiveStoryId}
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
                  onComposerPost={openPostComposer}
                  onEditPost={openEditPost}
                  onOpenEvent={setActiveEventPost}
                  onOpenMediaViewer={openMediaViewer}
                  onSubmitAnnouncement={setAnnouncementPost}
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
                announcements={CAMPUS_ANNOUNCEMENTS}
                events={[
                  ...createdPosts
                    .filter((post) => post.event)
                    .map((post) => ({
                      id: post.id,
                      title: post.event.title,
                      dateTime: new Date(post.event.startsAt).toLocaleString(
                        "en-KE",
                      ),
                      location: post.event.location,
                      image: post.gallery[0] || "/assets/index/bee_nobg.png",
                      post,
                    })),
                  ...UPCOMING_EVENTS,
                ].slice(0, 3)}
                marketplaceItems={MARKETPLACE_ITEMS}
                people={PEOPLE_YOU_MAY_KNOW}
                onOpenEvent={setActiveEventPost}
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
            onStep={stepMediaViewer}
          />
          <ExploreStoryViewer
            key={activeStoryId}
            activeStoryId={activeStoryId}
            onClose={() => setActiveStoryId("")}
            onStoryViewed={handleStoryViewed}
            stories={stories.filter((story) => story.items?.length)}
          />
          <ExploreStoryComposer
            isOpen={isStoryComposerOpen}
            onClose={() => setIsStoryComposerOpen(false)}
            onPublish={handlePublishStory}
          />
          <ConnectProfileModal
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
            post={activeEventPost}
            onClose={() => setActiveEventPost(null)}
          />
          <ExploreAnnouncementSubmissionModal
            post={announcementPost}
            onClose={() => setAnnouncementPost(null)}
            onSubmit={submitAnnouncement}
          />
        </div>
      </div>
    </main>
  );
}

export default ExploreCampusPage;
