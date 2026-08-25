import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArchive,
  FiBookOpen,
  FiBookmark,
  FiCalendar,
  FiCheck,
  FiChevronRight,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiEye,
  FiEdit3,
  FiExternalLink,
  FiFileText,
  FiMapPin,
  FiMessageCircle,
  FiPaperclip,
  FiInfo,
  FiLink,
  FiLogOut,
  FiPlus,
  FiSearch,
  FiSend,
  FiSettings,
  FiTrash2,
  FiUploadCloud,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import CampusSidebar from "../components/layout/CampusSidebar";
import Seo from "../components/Seo";
import KnowledgeResourceCheckoutModal from "../features/learn/components/KnowledgeResourceCheckoutModal";
import KnowledgeAvatarPicker from "../features/learn/components/KnowledgeAvatarPicker";
import GeneratedResourceThumbnailPicker from "../features/learn/components/GeneratedResourceThumbnailPicker";
import { generateResourceThumbnail } from "../features/learn/lib/generateResourceThumbnail";
import ExplorePostComposer from "../features/explore/components/ExplorePostComposer";
import {
  accessKnowledgeResource,
  addKnowledgeManager,
  createKnowledgeRoom,
  createKnowledgeResource,
  createKnowledgeSpacePost,
  decideKnowledgeMembershipRequest,
  decideKnowledgeResourceAccessRequest,
  decideKnowledgeResourceSubmission,
  decideKnowledgeRoomMembershipRequest,
  listKnowledgeManagerCandidates,
  purchaseKnowledgeResource,
  readKnowledgeRoomMessages,
  readKnowledgeRoom,
  readKnowledgeResourceCheckout,
  readKnowledgeSpace,
  removeKnowledgeManager,
  sendKnowledgeRoomMessage,
  searchKnowledgeUnits,
  setKnowledgeSpaceFollowing,
  setKnowledgeSpaceMembership,
  setKnowledgeRoomMembership,
  takeDownKnowledgeSpacePost,
  updateKnowledgeRoom,
  updateKnowledgeSpace,
  updateKnowledgeSpacePost,
} from "../features/learn/services/learnService";
import { setProfileRelationship } from "../features/profile/services/profileRelationshipService";
import { normalizeZumbarlFileUrl } from "../lib/normalizeZumbarlFileUrl";
import { uploadZumbarlFile } from "../lib/uploadZumbarlFile";
import "../styles/campus.css";
import "../styles/explore-campus.css";
import "../styles/knowledge-space.css";

const RESOURCE_LABELS = {
  past_paper: "Past paper",
  book: "Book",
  notes: "Notes",
  study_guide: "Study guide",
  article: "Article",
};

const ACCESS_LABELS = {
  free_read: "Read free",
  borrow: "Borrow",
  buy: "Buy",
  members_only: "Members only",
};

const EMPTY_SPACE_RESOURCE = {
  title: "",
  description: "",
  resourceType: "NOTES",
  accessMode: "FREE_READ",
  courseCode: "",
  price: "",
  availableCopies: "",
  previewText: "",
  fileUrl: "",
};

const DEFAULT_MEMBER_AVATAR = "/assets/knowledge/default-member-avatar.svg";
const avatar = (person) => normalizeZumbarlFileUrl(person?.avatarUrl) || DEFAULT_MEMBER_AVATAR;
const firstWebLink = (value = "") => value.match(/https?:\/\/[^\s]+/i)?.[0]?.replace(/[),.;]+$/, "") || "";
const fileLabel = (value = "") => value.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
const pendingPreviewRevocations = new Map();
const filePreviewUrls = new WeakMap();
const previewUrlForFile = (file) => {
  const existing = filePreviewUrls.get(file);
  if (existing) return existing;
  const created = URL.createObjectURL(file);
  filePreviewUrls.set(file, created);
  return created;
};

function ChatAttachmentPreview({ file, onRemove }) {
  const previewUrl = useMemo(() => previewUrlForFile(file), [file]);
  const [failedPreviewUrl, setFailedPreviewUrl] = useState("");
  const previewFailed = failedPreviewUrl === previewUrl;
  useEffect(() => {
    const pending = pendingPreviewRevocations.get(previewUrl);
    if (pending) {
      window.clearTimeout(pending);
      pendingPreviewRevocations.delete(previewUrl);
    }
    return () => {
      const timer = window.setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
        if (filePreviewUrls.get(file) === previewUrl) filePreviewUrls.delete(file);
        pendingPreviewRevocations.delete(previewUrl);
      }, 0);
      pendingPreviewRevocations.set(previewUrl, timer);
    };
  }, [file, previewUrl]);
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  return <article className={`knowledge-chat-draft-item${isImage || isVideo ? " is-media" : " is-document"}`}>
    <button type="button" aria-label={`Remove ${file.name}`} onClick={onRemove}><FiX /></button>
    {previewUrl && !previewFailed && isImage ? <img src={previewUrl} alt="" onError={() => setFailedPreviewUrl(previewUrl)} /> : previewUrl && !previewFailed && isVideo ? <video src={previewUrl} muted playsInline preload="metadata" onError={() => setFailedPreviewUrl(previewUrl)} /> : <div className={isImage || isVideo ? "is-loading" : ""}><FiFileText /><span>{previewFailed ? "Preview unavailable" : isImage || isVideo ? "Preparing preview…" : "Document"}</span></div>}
    <footer><strong>{file.name}</strong><small>{file.type || "Document"}</small></footer>
  </article>;
}

function SentChatAttachment({ attachment, onPreview }) {
  const url = normalizeZumbarlFileUrl(attachment.url);
  const isImage = String(attachment.mimeType || "").startsWith("image/");
  const isVideo = String(attachment.mimeType || "").startsWith("video/");
  if (isImage || isVideo) return <button type="button" className="knowledge-chat-media-attachment" onClick={() => onPreview({ ...attachment, url })}>
    {isImage ? <img src={url} alt={attachment.name} /> : <video src={url} muted playsInline preload="metadata" />}
    <span><strong>{attachment.name}</strong><FiDownload /></span>
  </button>;
  return <button type="button" onClick={() => onPreview({ ...attachment, url })}><FiPaperclip /><span><strong>{attachment.name}</strong><small>{attachment.mimeType || "Attached file"}</small></span><FiEye /></button>;
}

function ChatMessage({ message, canPromote = false, promoting = false, onPromote, onPreviewAttachment, onOpenResource }) {
  const attachments = Array.isArray(message.attachments) ? message.attachments : [];
  const linkPreviews = Array.isArray(message.linkPreviews) ? message.linkPreviews : [];
  const resources = Array.isArray(message.resources) ? message.resources : [];
  return <article className={message.isMine ? "is-mine" : "is-theirs"}>
    <img src={avatar(message.author)} alt="" />
    <div>
      <header><strong>{message.author.name}</strong><time>{relativeTime(message.createdAt)}</time></header>
      {message.body && <p>{message.body}</p>}
      {linkPreviews.length > 0 && <div className="knowledge-chat-link-previews">{linkPreviews.map((preview, index) => <a href={preview.url} target="_blank" rel="noreferrer" key={`${preview.url}-${index}`}>{preview.imageUrl && <img src={preview.imageUrl} alt="" />}<span><small>{preview.siteName || new URL(preview.url).hostname}</small><strong>{preview.title || preview.url}</strong>{preview.description && <em>{preview.description}</em>}</span></a>)}</div>}
      {attachments.length > 0 && <div className="knowledge-chat-attachments">{attachments.map((attachment, index) => <SentChatAttachment attachment={attachment} onPreview={onPreviewAttachment} key={`${attachment.url}-${index}`} />)}</div>}
      {resources.length > 0 && <div className="knowledge-chat-resource-badges">{resources.map((resource) => <button type="button" onClick={() => onOpenResource?.(resource.id)} key={resource.id}><FiBookmark /> {resource.title}</button>)}</div>}
      {canPromote && resources.length === 0 && <button type="button" className="knowledge-chat-promote" disabled={promoting} onClick={() => onPromote(message)}><FiBookmark /> {promoting ? "Opening…" : "Mark as resource"}</button>}
    </div>
  </article>;
}

function AttachmentPreviewModal({ attachment, onClose }) {
  if (!attachment) return null;
  const url = normalizeZumbarlFileUrl(attachment.url);
  const mimeType = String(attachment.mimeType || "").toLowerCase();
  const path = String(url).split(/[?#]/)[0].toLowerCase();
  const isImage = mimeType.startsWith("image/") || /\.(avif|gif|jpe?g|png|webp|svg)$/.test(path);
  const isVideo = mimeType.startsWith("video/") || /\.(mp4|mov|m4v|webm|ogg)$/.test(path);
  const isPdf = mimeType === "application/pdf" || path.endsWith(".pdf");
  const isWebPage = /^https?:\/\//i.test(url) && !mimeType && !/\.(docx?|xlsx?|pptx?|zip|rar|7z)$/i.test(path);
  const name = attachment.name || (() => { try { return decodeURIComponent(new URL(url, window.location.origin).pathname.split("/").filter(Boolean).at(-1) || "Resource preview"); } catch { return "Resource preview"; } })();
  return <div className="knowledge-attachment-preview-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="knowledge-attachment-preview-modal" role="dialog" aria-modal="true" aria-label={`Preview ${name}`}>
      <header><div><span>Resource preview</span><h2>{name}</h2></div><button type="button" onClick={onClose} aria-label="Close preview"><FiX /></button></header>
      <div className="knowledge-attachment-preview-stage">
        {isImage ? <img src={url} alt={name} /> : isVideo ? <video src={url} controls autoPlay playsInline /> : isPdf || isWebPage ? <iframe src={url} title={name} /> : <div className="knowledge-attachment-preview-unavailable"><FiFileText /><h3>Preview unavailable</h3><p>This file type cannot be displayed in the browser, but you can download it below.</p></div>}
      </div>
      <footer><span>{attachment.mimeType || "Shared resource"}</span><a href={url} download={name}><FiDownload /> Download</a><a href={url} target="_blank" rel="noreferrer"><FiExternalLink /> Open original</a></footer>
    </section>
  </div>;
}

function ResourceIcon({ type }) {
  return type === "past_paper" ? <FiFileText /> : <FiBookOpen />;
}

function ResourceAction({ resource, isMember, canOpen }) {
  if (canOpen) return <><FiEye /> Open resource</>;
  if (resource.viewerActions?.borrow?.status === "pending") return <><FiClock /> Borrow requested</>;
  if (resource.accessMode === "buy") return <><FiDollarSign /> {resource.currency} {Number(resource.price || 0).toLocaleString()}</>;
  if (resource.accessMode === "borrow") return <><FiClock /> Borrow</>;
  if (resource.accessMode === "free_read" || (resource.accessMode === "members_only" && isMember)) return <><FiEye /> Open resource</>;
  return <><FiEye /> Members only</>;
}

function PersonRow({ person, action, secondaryAction, showDetails = false }) {
  return (
    <article className="knowledge-person-row">
      <Link className="knowledge-person-avatar" to={`/campus/profiles/${person.id}`} aria-label={`View ${person.name}'s profile`}>
        <img src={avatar(person)} alt="" />
      </Link>
      <div>
        <Link className="knowledge-person-name" to={`/campus/profiles/${person.id}`}>{person.name}</Link>
        <span>{[person.handle, person.campus].filter(Boolean).join(" · ") || person.email || "Zumbarl member"}</span>
        {showDetails && <div className="knowledge-person-snippets">
          <small><strong>{Number(person.followerCount || 0).toLocaleString()}</strong> followers</small>
          <small><strong>{person.zumbarlScore ?? "New"}</strong> Zumbarl score</small>
          <small className={`is-${String(person.zumbarlTier || "provisional").toLowerCase()}`}>{String(person.zumbarlTier || "provisional").toLowerCase()}</small>
        </div>}
      </div>
      {secondaryAction}
      {action}
    </article>
  );
}

function relativeTime(value) {
  if (!value) return "No messages yet";
  const difference = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(difference / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function KnowledgeSpacePage() {
  const { spaceSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reader, setReader] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [activeTab, setActiveTab] = useState("resources");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [roomMessages, setRoomMessages] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [editingRoomInfo, setEditingRoomInfo] = useState(false);
  const [roomInfoForm, setRoomInfoForm] = useState({ title: "", description: "" });
  const [messageBody, setMessageBody] = useState("");
  const [messageFiles, setMessageFiles] = useState([]);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [roomForm, setRoomForm] = useState({ title: "", description: "", resourceId: "" });
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postComposerType, setPostComposerType] = useState("post");
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all");
  const [resourceAccessFilter, setResourceAccessFilter] = useState("all");
  const [resourceForm, setResourceForm] = useState(EMPTY_SPACE_RESOURCE);
  const [resourceSource, setResourceSource] = useState("FILES");
  const [resourceFiles, setResourceFiles] = useState([]);
  const [resourceExistingFiles, setResourceExistingFiles] = useState([]);
  const [resourceOriginMessage, setResourceOriginMessage] = useState(null);
  const [resourceCoverFile, setResourceCoverFile] = useState(null);
  const [resourceGeneratedCoverFile, setResourceGeneratedCoverFile] = useState(null);
  const [thumbnailGenerationStatus, setThumbnailGenerationStatus] = useState("idle");
  const thumbnailGenerationRef = useRef(0);
  const [unitQuery, setUnitQuery] = useState("");
  const [unitOptions, setUnitOptions] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [createNewUnit, setCreateNewUnit] = useState(false);
  const [unitSearching, setUnitSearching] = useState(false);
  const unitSearchTimerRef = useRef(null);
  const unitSearchSequenceRef = useRef(0);
  const loadedSpaceSlugRef = useRef("");
  const [spaceForm, setSpaceForm] = useState({ name: "", description: "", visibility: "campus", membershipMode: "request", avatarUrl: "", coverImageUrl: "" });
  const [spaceAvatarFile, setSpaceAvatarFile] = useState(null);
  const [managerQuery, setManagerQuery] = useState("");
  const [managerCandidates, setManagerCandidates] = useState([]);
  const [manageQueueTab, setManageQueueTab] = useState("members");
  const [purchaseCheckout, setPurchaseCheckout] = useState(null);
  const [purchaseError, setPurchaseError] = useState("");

  function canOpenResourceDirectly(resource) {
    const membership = data?.space?.membership;
    const canManageSpace = resource.ownedByViewer || (membership?.status === "active" && ["owner", "admin"].includes(membership.role));
    const approvedAction = resource.accessMode === "buy" ? resource.viewerActions?.purchase : resource.viewerActions?.borrow;
    const hasApprovedAccess = ["active", "completed"].includes(approvedAction?.status);
    return canManageSpace
      || hasApprovedAccess
      || resource.accessMode === "free_read"
      || (resource.accessMode === "members_only" && membership?.status === "active");
  }

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return readKnowledgeSpace(spaceSlug)
      .then((payload) => {
        setData(payload);
        if (loadedSpaceSlugRef.current !== spaceSlug) {
          setActiveTab(payload.space.type === "group" ? "chat" : "resources");
          setManageQueueTab("members");
          loadedSpaceSlugRef.current = spaceSlug;
        }
        const primaryRoom = payload.space.type === "group" ? payload.rooms?.find((room) => room.isPrimary) : null;
        if (primaryRoom) {
          setSelectedRoomId(primaryRoom.id);
          if (payload.space.membership?.status === "active") {
            readKnowledgeRoomMessages(primaryRoom.id).then(setRoomMessages).catch(() => setRoomMessages([]));
          }
        }
        setSpaceForm({
          name: payload.space.name || "",
          description: payload.space.description || "",
          visibility: payload.space.visibility || "campus",
          membershipMode: payload.space.membershipMode === "open" ? "request" : payload.space.membershipMode || "request",
          avatarUrl: payload.space.avatarUrl || "",
          coverImageUrl: payload.space.coverImageUrl || "",
        });
      })
      .catch((requestError) => setError(requestError.message || "This Knowledge Hub page could not be loaded."))
      .finally(() => setLoading(false));
  }, [spaceSlug]);

  // Loading route-owned data is the external synchronization this effect performs.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const selectedRoom = data?.rooms?.find((room) => room.id === selectedRoomId) || null;
  const selectedRoomHasAccess = Boolean(selectedRoom?.isPrimary && data?.space?.membership?.status === "active" || selectedRoom?.isCreator || selectedRoom?.membership?.status === "active");

  async function updateMembership() {
    const space = data.space;
    const previousStatus = space.membership?.status;
    setWorking("membership");
    setError("");
    setNotice("");
    try {
      const updated = await setKnowledgeSpaceMembership(space.id, !space.membership);
      setNotice(updated.membership?.status === "pending"
        ? "Membership request sent. An owner or admin must approve it."
        : previousStatus === "pending" ? "Membership request cancelled." : "You left this space.");
      await load();
    } catch (requestError) {
      setError(requestError.message || "That action could not be completed.");
    } finally {
      setWorking("");
    }
  }

  async function updateFollowing() {
    setWorking("following");
    setError("");
    try {
      const updated = await setKnowledgeSpaceFollowing(data.space.id, !data.space.followed);
      setData((current) => ({ ...current, space: updated }));
    } catch (requestError) {
      setError(requestError.message || "That action could not be completed.");
    } finally {
      setWorking("");
    }
  }

  async function openResource(resource) {
    if (resource.accessMode === "buy" && !canOpenResourceDirectly(resource)) {
      setWorking(resource.id);
      setPurchaseError("");
      try {
        setPurchaseCheckout(await readKnowledgeResourceCheckout(resource.id));
      } catch (requestError) {
        setError(requestError.message || "Checkout could not be opened.");
      } finally {
        setWorking("");
      }
      return;
    }
    const action = canOpenResourceDirectly(resource) ? "READ" : resource.accessMode === "borrow" ? "BORROW" : resource.accessMode === "buy" ? "PURCHASE" : "READ";
    setWorking(resource.id);
    setError("");
    try {
      const updated = await accessKnowledgeResource(resource.id, action);
      setData((current) => ({ ...current, resources: current.resources.map((item) => item.id === updated.id ? updated : item) }));
      if (action === "READ") setReader(updated);
      else setNotice("Your borrow request was sent.");
    } catch (requestError) {
      setError(requestError.message || "This resource could not be opened.");
    } finally {
      setWorking("");
    }
  }

  async function confirmResourcePurchase() {
    if (!purchaseCheckout || working === "purchase") return;
    setWorking("purchase");
    setPurchaseError("");
    try {
      const purchased = await purchaseKnowledgeResource(purchaseCheckout.resource.id);
      setData((current) => ({ ...current, resources: current.resources.map((item) => item.id === purchased.id ? purchased : item) }));
      setPurchaseCheckout(null);
      setNotice("Payment complete. The resource is now available in your account.");
      setReader(purchased);
    } catch (requestError) {
      setPurchaseError(requestError.message || "Payment could not be completed.");
    } finally {
      setWorking("");
    }
  }

  async function openRoom(roomId) {
    setSelectedRoomId(roomId);
    const room = data?.rooms?.find((item) => item.id === roomId);
    const followsGroupMembership = room?.isPrimary && data?.space?.membership?.status === "active";
    if (!followsGroupMembership && !room?.isCreator && room?.membership?.status !== "active") {
      setRoomMessages([]);
      return;
    }
    setWorking(`room-${roomId}`);
    setError("");
    try {
      setRoomMessages(await readKnowledgeRoomMessages(roomId));
    } catch (requestError) {
      setRoomMessages([]);
      setError(requestError.message || "This room could not be opened.");
    } finally {
      setWorking("");
    }
  }

  function applyRoomInfo(payload) {
    setRoomInfo(payload);
    setRoomInfoForm({ title: payload.room.title || "", description: payload.room.description || "" });
    setData((current) => ({
      ...current,
      rooms: current.rooms.map((room) => room.id === payload.room.id ? { ...room, ...payload.room } : room),
    }));
  }

  async function openRoomInfo() {
    if (!selectedRoom) return;
    setShowRoomInfo(true);
    setRoomInfo(null);
    setEditingRoomInfo(false);
    setWorking(`room-info-${selectedRoom.id}`);
    setError("");
    try {
      applyRoomInfo(await readKnowledgeRoom(selectedRoom.id));
    } catch (requestError) {
      setError(requestError.message || "Room information could not be loaded.");
    } finally {
      setWorking("");
    }
  }

  async function changeRoomMembership() {
    const room = roomInfo?.room || selectedRoom;
    if (!room) return;
    const wasActive = room.membership?.status === "active";
    const wasPending = room.membership?.status === "pending";
    setWorking("room-membership");
    setError("");
    try {
      const updated = await setKnowledgeRoomMembership(room.id, !room.membership);
      if (updated.deleted) {
        setShowRoomInfo(false);
        setRoomInfo(null);
        setSelectedRoomId("");
        setRoomMessages([]);
        setNotice("You left the room. It was removed because no other members remained.");
        await load();
        return;
      }
      applyRoomInfo(updated);
      if (updated.room.membership?.status === "active") {
        setRoomMessages(await readKnowledgeRoomMessages(room.id));
      } else {
        setRoomMessages([]);
      }
      setNotice(wasActive ? "You left the room." : wasPending ? "Room request cancelled." : "Room request sent for admin approval.");
    } catch (requestError) {
      setError(requestError.message || "Room membership could not be updated.");
    } finally {
      setWorking("");
    }
  }

  async function decideRoomRequest(studentId, action) {
    if (!roomInfo?.room) return;
    setWorking(`room-request-${studentId}`);
    setError("");
    try {
      applyRoomInfo(await decideKnowledgeRoomMembershipRequest(roomInfo.room.id, studentId, action));
      setNotice(action === "APPROVE" ? "Room membership approved." : "Room request declined.");
    } catch (requestError) {
      setError(requestError.message || "The room request could not be updated.");
    } finally {
      setWorking("");
    }
  }

  async function saveRoomInfo(event) {
    event.preventDefault();
    if (!roomInfo?.room) return;
    setWorking("save-room-info");
    setError("");
    try {
      applyRoomInfo(await updateKnowledgeRoom(roomInfo.room.id, {
        title: roomInfoForm.title.trim(),
        description: roomInfoForm.description.trim() || null,
      }));
      setEditingRoomInfo(false);
      setNotice("Room information updated.");
    } catch (requestError) {
      setError(requestError.message || "Room information could not be saved.");
    } finally {
      setWorking("");
    }
  }

  async function submitRoom(event) {
    event.preventDefault();
    setWorking("create-room");
    setError("");
    try {
      const room = await createKnowledgeRoom(data.space.id, {
        title: roomForm.title.trim(),
        description: roomForm.description.trim() || undefined,
        resourceId: roomForm.resourceId || undefined,
      });
      setData((current) => ({ ...current, rooms: [room, ...(current.rooms || [])] }));
      setRoomForm({ title: "", description: "", resourceId: "" });
      setShowRoomForm(false);
      await openRoom(room.id);
    } catch (requestError) {
      setError(requestError.message || "The room could not be created.");
    } finally {
      setWorking("");
    }
  }

  async function submitResource(event) {
    event.preventDefault();
    if (!selectedUnit && !createNewUnit) {
      setError("Choose an existing unit, or create the typed unit as new.");
      return;
    }
    if (resourceSource === "FILES" && !resourceFiles.length && !resourceExistingFiles.length) {
      setError("Choose at least one file to add this resource.");
      return;
    }
    if (resourceSource === "LINK" && !resourceForm.fileUrl.trim()) {
      setError("Add the web link to this resource.");
      return;
    }

    setWorking("create-resource");
    setError("");
    try {
      const uploadedFileUrls = resourceSource === "FILES"
        ? await Promise.all(resourceFiles.map(async (file) => {
          const upload = await uploadZumbarlFile(file, {
            scope: "learn-resource",
            metadata: { purpose: "knowledge-resource", title: resourceForm.title.trim() },
          });
          return upload.url || upload.previewUrl;
        }))
        : [];
      const fileUrls = [...resourceExistingFiles.map((file) => file.url), ...uploadedFileUrls];
      const effectiveCoverFile = resourceCoverFile || resourceGeneratedCoverFile;
      const coverUpload = effectiveCoverFile
        ? await uploadZumbarlFile(effectiveCoverFile, {
          scope: "learn-resource-cover",
          metadata: { purpose: resourceCoverFile ? "knowledge-resource-cover" : "knowledge-resource-generated-cover", title: resourceForm.title.trim() },
        })
        : null;
      const created = await createKnowledgeResource({
        spaceId: data.space.id,
        sourceMessageId: resourceOriginMessage?.id || undefined,
        title: resourceForm.title.trim(),
        description: resourceForm.description.trim() || undefined,
        resourceType: resourceForm.resourceType,
        accessMode: data.space.type === "group" ? "MEMBERS_ONLY" : resourceForm.accessMode,
        courseCode: resourceForm.courseCode.trim() || undefined,
        unitId: selectedUnit?.id || undefined,
        unitName: createNewUnit ? unitQuery.trim() : undefined,
        createUnit: createNewUnit,
        price: resourceForm.price ? Number(resourceForm.price) : undefined,
        availableCopies: resourceForm.availableCopies === "" ? undefined : Number(resourceForm.availableCopies),
        previewText: resourceForm.previewText.trim() || undefined,
        currency: "KES",
        sourceMode: resourceSource,
        fileUrl: resourceSource === "LINK" ? resourceForm.fileUrl.trim() : undefined,
        fileUrls,
        coverImageUrl: coverUpload?.url || coverUpload?.previewUrl || undefined,
      });
      if (created.status === "published") {
        setData((current) => ({
          ...current,
          space: { ...current.space, resourceCount: Number(current.space.resourceCount || 0) + 1 },
          resources: [created, ...(current.resources || [])],
        }));
        if (created.sourceMessageId) {
          setRoomMessages((current) => current.map((message) => message.id === created.sourceMessageId
            ? { ...message, resources: [...(message.resources || []), { id: created.id, title: created.title, type: created.type }] }
            : message));
        }
      }
      setResourceForm(data.space.type === "group" ? { ...EMPTY_SPACE_RESOURCE, accessMode: "MEMBERS_ONLY" } : EMPTY_SPACE_RESOURCE);
      setResourceFiles([]);
      setResourceExistingFiles([]);
      setResourceOriginMessage(null);
      setResourceCoverFile(null);
      setResourceGeneratedCoverFile(null);
      setThumbnailGenerationStatus("idle");
      setUnitQuery("");
      setUnitOptions([]);
      setSelectedUnit(null);
      setCreateNewUnit(false);
      setResourceSource("FILES");
      setShowResourceForm(false);
      setNotice(created.status === "pending"
        ? "Resource submitted for review. An owner or admin must approve it before it appears on the shelf."
        : "Resource added to this learning shelf.");
    } catch (requestError) {
      setError(requestError.message || "The resource could not be added.");
    } finally {
      setWorking("");
    }
  }

  async function prepareResourceThumbnail(file) {
    const generationId = ++thumbnailGenerationRef.current;
    setResourceGeneratedCoverFile(null);
    if (!file) { setThumbnailGenerationStatus("idle"); return; }
    setThumbnailGenerationStatus("loading");
    const generated = await generateResourceThumbnail(file);
    if (generationId !== thumbnailGenerationRef.current) return;
    setResourceGeneratedCoverFile(generated);
    setThumbnailGenerationStatus(generated ? "generated" : "default");
  }

  function selectResourceFiles(incoming) {
    const files = Array.from(incoming || []).slice(0, 12);
    setResourceFiles(files);
    const candidate = files.find((file) => file.type.startsWith("image/") || file.type.startsWith("video/") || file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
    prepareResourceThumbnail(candidate);
  }

  async function prepareChatResourceThumbnail(attachment) {
    if (!attachment?.url) { prepareResourceThumbnail(null); return; }
    const generationId = ++thumbnailGenerationRef.current;
    setResourceGeneratedCoverFile(null);
    setThumbnailGenerationStatus("loading");
    try {
      const response = await fetch(normalizeZumbarlFileUrl(attachment.url));
      if (!response.ok) throw new Error("Attachment unavailable");
      const blob = await response.blob();
      const file = new File([blob], attachment.name || "chat-resource", { type: attachment.mimeType || blob.type });
      const generated = await generateResourceThumbnail(file);
      if (generationId !== thumbnailGenerationRef.current) return;
      setResourceGeneratedCoverFile(generated);
      setThumbnailGenerationStatus(generated ? "generated" : "default");
    } catch {
      if (generationId === thumbnailGenerationRef.current) setThumbnailGenerationStatus("default");
    }
  }

  function startResourceFromMessage(message) {
    const attachments = Array.isArray(message.attachments) ? message.attachments : [];
    const link = firstWebLink(message.body);
    const suggestedTitle = fileLabel(attachments[0]?.name) || fileLabel(link.split("/").filter(Boolean).at(-1)) || message.body?.trim().slice(0, 80) || "Group resource";
    setResourceOriginMessage(message);
    setResourceExistingFiles(attachments);
    setResourceFiles([]);
    setResourceCoverFile(null);
    prepareChatResourceThumbnail(attachments[0]);
    setResourceSource(attachments.length ? "FILES" : link ? "LINK" : "FILES");
    setResourceForm({
      ...EMPTY_SPACE_RESOURCE,
      title: suggestedTitle,
      description: message.body?.trim() || "Shared from the group chat.",
      accessMode: "MEMBERS_ONLY",
      fileUrl: attachments.length ? "" : link,
    });
    setShowResourceForm(true);
  }

  function updateUnitQuery(value) {
    setUnitQuery(value);
    setSelectedUnit(null);
    setCreateNewUnit(false);
    setUnitOptions([]);
    if (unitSearchTimerRef.current) window.clearTimeout(unitSearchTimerRef.current);
    const query = value.trim();
    if (query.length < 2) {
      setUnitSearching(false);
      return;
    }
    const requestId = ++unitSearchSequenceRef.current;
    setUnitSearching(true);
    unitSearchTimerRef.current = window.setTimeout(async () => {
      try {
        const options = await searchKnowledgeUnits(query);
        if (requestId === unitSearchSequenceRef.current) setUnitOptions(options);
      } catch (requestError) {
        if (requestId === unitSearchSequenceRef.current) setError(requestError.message || "Units could not be searched.");
      } finally {
        if (requestId === unitSearchSequenceRef.current) setUnitSearching(false);
      }
    }, 250);
  }

  async function submitMessage(event) {
    event.preventDefault();
    const body = messageBody.trim();
    if ((!body && !messageFiles.length) || !selectedRoomId) return;
    setWorking("send-message");
    setError("");
    try {
      const attachments = await Promise.all(messageFiles.map(async (file) => {
        const upload = await uploadZumbarlFile(file, {
          scope: "knowledge-chat-attachment",
          metadata: { purpose: "knowledge-chat-attachment", roomId: selectedRoomId },
        });
        return { name: file.name, url: upload.url || upload.previewUrl, mimeType: file.type || undefined, size: file.size };
      }));
      const message = await sendKnowledgeRoomMessage(selectedRoomId, { body, attachments });
      setRoomMessages((current) => [...current, message]);
      setMessageBody("");
      setMessageFiles([]);
      setData((current) => ({
        ...current,
        rooms: current.rooms.map((room) => room.id === selectedRoomId
          ? { ...room, messageCount: room.messageCount + 1, updatedAt: message.createdAt }
          : room),
      }));
    } catch (requestError) {
      setError(requestError.message || "Your message could not be sent.");
    } finally {
      setWorking("");
    }
  }

  async function publishSpacePost(payload) {
    setWorking("create-post");
    setError("");
    try {
      setData(await createKnowledgeSpacePost(data.space.id, payload));
      setNotice("Post published here and on Explore Campus.");
    } catch (requestError) {
      setError(requestError.message || "Your post could not be published.");
      throw requestError;
    } finally {
      setWorking("");
    }
  }

  async function saveSpacePost(event) {
    event.preventDefault();
    const body = editingPost?.body?.trim();
    if (!body) return;
    setWorking(`edit-post-${editingPost.id}`);
    setError("");
    try {
      setData(await updateKnowledgeSpacePost(data.space.id, editingPost.id, { body }));
      setEditingPost(null);
      setNotice("Post updated.");
    } catch (requestError) {
      setError(requestError.message || "That post could not be updated.");
    } finally {
      setWorking("");
    }
  }

  async function takeDownPost(post) {
    if (!window.confirm("Take this post down from this page and Explore Campus?")) return;
    setWorking(`remove-post-${post.id}`);
    setError("");
    try {
      setData(await takeDownKnowledgeSpacePost(data.space.id, post.id));
      setNotice("Post taken down.");
    } catch (requestError) {
      setError(requestError.message || "That post could not be taken down.");
    } finally {
      setWorking("");
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    setWorking("save-settings");
    setError("");
    try {
      const avatarUpload = spaceAvatarFile
        ? await uploadZumbarlFile(spaceAvatarFile, {
            scope: "knowledge-space-avatar",
            metadata: { purpose: "knowledge-space-avatar", spaceId: data.space.id, spaceType: data.space.type },
          })
        : null;
      const updated = await updateKnowledgeSpace(data.space.id, {
        ...spaceForm,
        visibility: spaceForm.visibility.toUpperCase(),
        membershipMode: spaceForm.membershipMode.toUpperCase(),
        avatarUrl: avatarUpload?.url || avatarUpload?.previewUrl || spaceForm.avatarUrl.trim() || null,
        coverImageUrl: spaceForm.coverImageUrl.trim() || null,
      });
      setData(updated);
      setSpaceAvatarFile(null);
      setNotice("Page settings saved.");
    } catch (requestError) {
      setError(requestError.message || "The page settings could not be saved.");
    } finally {
      setWorking("");
    }
  }

  async function searchManagers(event) {
    event.preventDefault();
    setWorking("manager-search");
    try {
      setManagerCandidates(await listKnowledgeManagerCandidates(data.space.id, managerQuery));
    } catch (requestError) {
      setError(requestError.message || "People could not be loaded.");
    } finally {
      setWorking("");
    }
  }

  async function changeManager(studentId, active) {
    setWorking(`manager-${studentId}`);
    try {
      const updated = active
        ? await addKnowledgeManager(data.space.id, studentId)
        : await removeKnowledgeManager(data.space.id, studentId);
      setData(updated);
      setManagerCandidates((current) => current.map((candidate) => candidate.id === studentId
        ? { ...candidate, currentRole: active ? "admin" : "member", membershipStatus: "active" }
        : candidate));
      setNotice(active ? "Manager added." : "Manager access removed.");
    } catch (requestError) {
      setError(requestError.message || "Manager access could not be changed.");
    } finally {
      setWorking("");
    }
  }

  async function decideRequest(studentId, action) {
    setWorking(`request-${studentId}`);
    try {
      setData(await decideKnowledgeMembershipRequest(data.space.id, studentId, action));
      setNotice(action === "APPROVE" ? "Membership approved." : "Membership request declined.");
    } catch (requestError) {
      setError(requestError.message || "The membership request could not be updated.");
    } finally {
      setWorking("");
    }
  }

  async function decideResource(resourceId, action) {
    setWorking(`resource-request-${resourceId}`);
    setError("");
    try {
      setData(await decideKnowledgeResourceSubmission(data.space.id, resourceId, action));
      setNotice(action === "APPROVE" ? "Resource approved and published." : "Resource submission declined.");
    } catch (requestError) {
      setError(requestError.message || "The resource submission could not be reviewed.");
    } finally {
      setWorking("");
    }
  }

  async function decideAccessRequest(accessId, action) {
    setWorking(`access-request-${accessId}`);
    setError("");
    try {
      setData(await decideKnowledgeResourceAccessRequest(data.space.id, accessId, action));
      setNotice(action === "APPROVE" ? "Resource access approved." : "Resource access request declined.");
    } catch (requestError) {
      setError(requestError.message || "The resource access request could not be reviewed.");
    } finally {
      setWorking("");
    }
  }

  async function toggleMemberFollow(member) {
    if (member.isViewer || working === `follow-${member.id}`) return;
    const next = !member.isFollowing;
    setWorking(`follow-${member.id}`);
    setError("");
    try {
      const relationship = await setProfileRelationship(member.id, "follow", next);
      setData((current) => ({
        ...current,
        members: current.members.map((person) => person.id === member.id ? {
          ...person,
          isFollowing: Boolean(relationship.isFollowing),
          followerCount: Math.max(0, Number(person.followerCount || 0) + (relationship.isFollowing ? 1 : -1)),
        } : person),
      }));
    } catch (requestError) {
      setError(requestError.message || "This member could not be followed.");
    } finally {
      setWorking("");
    }
  }

  if (loading) return <main className="knowledge-space-loading">Loading Knowledge Hub page…</main>;
  if (error && !data) return <main className="knowledge-space-loading"><h1>Page unavailable</h1><p>{error}</p><button type="button" onClick={load}>Try again</button></main>;

  const { space, resources, members = [], rooms = [], posts = [], management } = data;
  const isOwner = space.membership?.role === "owner";
  const canManage = ["owner", "admin"].includes(space.membership?.role) && space.membership?.status === "active";
  const isMember = space.membership?.status === "active" || isOwner;
  const isLibrary = space.type === "library";
  const isPending = space.membership?.status === "pending";
  const isInviteOnly = space.membershipMode === "invite" && !space.membership && Boolean(space.owner.id);
  const approvalCount = (management?.pendingRequests?.length || 0) + (isLibrary ? (management?.pendingResources?.length || 0) + (management?.pendingAccesses?.length || 0) : 0);
  const membershipLabel = isPending ? "Cancel request" : isMember ? "Leave" : isInviteOnly ? "Invite only" : "Request to join";
  const eventPosts = posts.filter((post) => post.type === "event");
  const communityPosts = isLibrary ? posts : posts.filter((post) => post.type !== "event");
  const filteredResources = resources.filter((resource) => {
    const query = resourceSearch.trim().toLowerCase();
    const matchesSearch = !query || `${resource.title} ${resource.description || ""} ${resource.unit?.name || resource.subject || ""}`.toLowerCase().includes(query);
    const matchesType = resourceTypeFilter === "all" || resource.type === resourceTypeFilter;
    const matchesAccess = resourceAccessFilter === "all" || resource.accessMode === resourceAccessFilter;
    return matchesSearch && matchesType && matchesAccess;
  });
  const coreTabs = isLibrary ? [
    { id: "resources", label: "Resources", count: resources.length, icon: FiBookOpen },
    { id: "posts", label: "Posts", count: posts.length, icon: FiFileText },
    { id: "members", label: "Members", count: members.length, icon: FiUsers },
    { id: "rooms", label: "Rooms", count: rooms.length, icon: FiMessageCircle },
  ] : [
    { id: "chat", label: "Chat", count: null, icon: FiMessageCircle },
    { id: "posts", label: "Posts", count: communityPosts.length, icon: FiFileText },
    { id: "events", label: "Events", count: eventPosts.length, icon: FiCalendar },
    { id: "members", label: "Members", count: members.length, icon: FiUsers },
    { id: "resources", label: "Resources", count: resources.length, icon: FiBookOpen },
  ];
  const tabs = [
    ...coreTabs,
    ...(canManage ? [{ id: "manage", label: "Manage", count: approvalCount, icon: FiSettings }] : []),
  ];

  return (
    <main className="campus-page knowledge-space-page">
      <Seo title={`${space.name} | Knowledge Hub | Zumbarl`} description={space.description} />
      <div className="campus-stage">
        <div className="campus-shell knowledge-space-shell">
          <CampusSidebar activeItemId="learn" />

          <section className="campus-main knowledge-space-main">
            <nav className="knowledge-space-breadcrumb" aria-label="Breadcrumb">
              <Link to="/campus/learn">Learn &amp; Grow</Link><span>›</span>
              <Link to="/campus/learn?view=knowledge">Knowledge Hub</Link><span>›</span>
              <strong>{space.name}</strong>
            </nav>

            <header className={`knowledge-space-hero ${isLibrary ? "is-library" : "is-group"}`}>
              <div className="knowledge-space-cover-art" style={space.coverImageUrl ? { backgroundImage: `linear-gradient(rgba(24,28,43,.28), rgba(24,28,43,.28)), url(${space.coverImageUrl})` } : undefined}>
                <img src={space.avatarUrl} alt={`${space.name} avatar`} />
              </div>
              <div className="knowledge-space-identity">
                <span className="knowledge-space-type">{isLibrary ? "Student library" : "Study group"}</span>
                <h1>{space.name}</h1>
                <p>{space.description || `A student-owned ${isLibrary ? "library" : "study group"} in the Zumbarl Knowledge Hub.`}</p>
                <div className="knowledge-space-owner-line">
                  <img src={avatar(space.owner)} alt="" />
                  <span>{space.owner.id ? <Link to={`/campus/profiles/${space.owner.id}`}>{space.owner.name}</Link> : <strong>{space.owner.name}</strong>}</span>
                  <small>{space.owner.id ? "Manager" : "Awaiting manager"}</small>
                  {space.owner.campus && <><FiMapPin /><span>{space.owner.campus}</span></>}
                </div>
                <dl className="knowledge-space-hero-stats" aria-label="Space activity">
                  <div title="Followers"><dt><span className="sr-only">Followers</span><FiUserPlus /></dt><dd>{space.followerCount || 0}</dd></div>
                  {isLibrary ? <>
                    <div title="Resources"><dt><span className="sr-only">Resources</span><FiBookOpen /></dt><dd>{resources.length}</dd></div>
                    <div title="Rooms"><dt><span className="sr-only">Rooms</span><FiMessageCircle /></dt><dd>{rooms.length}</dd></div>
                  </> : <>
                    <div title="Members"><dt><span className="sr-only">Members</span><FiUsers /></dt><dd>{members.length}</dd></div>
                    <div title="Events"><dt><span className="sr-only">Events</span><FiCalendar /></dt><dd>{eventPosts.length}</dd></div>
                  </>}
                </dl>
              </div>
              <div className="knowledge-space-hero-actions">
                <button type="button" className={`is-primary${isMember ? " is-leave" : ""}`} disabled={isInviteOnly || working === "membership"} onClick={updateMembership}>
                  {isPending ? <FiClock /> : space.membership ? <FiCheck /> : null}{membershipLabel}
                </button>
                <button type="button" disabled={working === "following"} onClick={updateFollowing}>{space.followed ? "Following" : "Follow updates"}</button>
              </div>
            </header>

            {(error || notice) ? (
              <div className={`knowledge-space-feedback ${error ? "is-error" : ""}`} role={error ? "alert" : "status"}>
                <span>{error || notice}</span>
                <button
                  type="button"
                  aria-label="Dismiss message"
                  onClick={() => {
                    setError("");
                    setNotice("");
                  }}
                >
                  <FiX />
                </button>
              </div>
            ) : null}

            <nav className="knowledge-space-tabs" aria-label={`${space.name} sections`}>
              {tabs.map(({ id, label, count, icon: Icon }) => (
                <button type="button" className={activeTab === id ? "is-active" : ""} onClick={() => setActiveTab(id)} key={id}>
                  <Icon /><span>{label}</span>{count > 0 && <strong>{count}</strong>}
                </button>
              ))}
            </nav>

            {activeTab === "resources" && <section className="knowledge-space-section">
              <div className="knowledge-space-section-head">
                <div><span>Resources</span><h2>Learning shelf</h2><p>Material published by this {isLibrary ? "library" : "group"}.</p></div>
                <div className="knowledge-space-section-actions">
                  <strong>{resources.length} {resources.length === 1 ? "resource" : "resources"}</strong>
                  {isMember && isLibrary && <button type="button" className="knowledge-add-button" onClick={() => { setResourceOriginMessage(null); setResourceExistingFiles([]); setResourceFiles([]); setResourceCoverFile(null); setResourceGeneratedCoverFile(null); setThumbnailGenerationStatus("idle"); setShowResourceForm(true); }}><FiPlus /> Add resource</button>}
                </div>
              </div>
              <form className="knowledge-space-resource-filters" onSubmit={(event) => event.preventDefault()}>
                <label><span className="sr-only">Search resources</span><FiSearch /><input value={resourceSearch} onChange={(event) => setResourceSearch(event.target.value)} placeholder="Search title, subject or unit" /></label>
                <select value={resourceTypeFilter} onChange={(event) => setResourceTypeFilter(event.target.value)} aria-label="Filter by resource type"><option value="all">All types</option><option value="past_paper">Past papers</option><option value="book">Books</option><option value="notes">Notes</option><option value="study_guide">Study guides</option><option value="article">Articles</option></select>
                {isLibrary && <select value={resourceAccessFilter} onChange={(event) => setResourceAccessFilter(event.target.value)} aria-label="Filter by access"><option value="all">All access</option><option value="free_read">Open resources</option><option value="members_only">Members only</option><option value="borrow">Borrow</option><option value="buy">Buy</option></select>}
                {(resourceSearch || resourceTypeFilter !== "all" || resourceAccessFilter !== "all") && <button type="button" onClick={() => { setResourceSearch(""); setResourceTypeFilter("all"); setResourceAccessFilter("all"); }}><FiX /> Reset</button>}
              </form>
              <div className="knowledge-space-resource-grid">
                {filteredResources.map((resource) => {
                  const canOpen = canOpenResourceDirectly(resource);
                  const hasPendingRequest = resource.viewerActions?.borrow?.status === "pending";
                  return (
                  <article className="knowledge-space-resource" key={resource.id}>
                    <div className="knowledge-space-resource-art" style={resource.coverImageUrl ? { backgroundImage: `url(${normalizeZumbarlFileUrl(resource.coverImageUrl)})` } : undefined}>
                      {!resource.coverImageUrl && <ResourceIcon type={resource.type} />}<span>{RESOURCE_LABELS[resource.type] || "Resource"}</span>
                    </div>
                    <div className="knowledge-space-resource-body">
                      <div className="knowledge-space-resource-meta"><span>{resource.unit?.name || resource.subject || "General"}</span><strong>{canOpen ? "Available now" : ACCESS_LABELS[resource.accessMode]}</strong></div>
                      <h3>{resource.title}</h3><p>{resource.description}</p>
                      <div className="knowledge-space-resource-owner">
                        <Link className="knowledge-space-resource-owner-avatar" to={`/campus/profiles/${resource.owner.id}`} aria-label={`View ${resource.owner.name}'s profile`}><img src={avatar(resource.owner)} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = DEFAULT_MEMBER_AVATAR; }} /></Link>
                        <span><small>Shared by</small><Link to={`/campus/profiles/${resource.owner.id}`}>{resource.owner.name}</Link><em>{resource.owner.campus || "Zumbarl member"}</em></span>
                      </div>
                      <button type="button" disabled={working === resource.id || (!canOpen && hasPendingRequest)} onClick={() => openResource(resource)}><ResourceAction resource={resource} isMember={isMember} canOpen={canOpen} /></button>
                    </div>
                  </article>
                  );
                })}
                {!resources.length && <div className="knowledge-space-empty">No resources have been published here yet.</div>}
                {resources.length > 0 && !filteredResources.length && <div className="knowledge-space-empty">No resources match these filters.</div>}
              </div>
            </section>}

            {activeTab === "posts" && <section className="knowledge-space-section knowledge-posts-section">
              <div className="knowledge-space-section-head">
                <div><span>Explore Campus</span><h2>Community posts</h2><p>Member updates from this {isLibrary ? "library" : "group"} also appear in Explore Campus.</p></div>
                {isMember && <button type="button" className="knowledge-add-button" onClick={() => { setPostComposerType("post"); setShowPostForm(true); }}><FiPlus /> New post</button>}
              </div>
              <div className="knowledge-post-list">
                {communityPosts.map((post) => <article className="knowledge-post-card" key={post.id}>
                  <header>
                    {post.author.profilePath ? <Link to={post.author.profilePath}><img src={avatar(post.author)} alt="" /></Link> : <img src={avatar(post.author)} alt="" />}
                    <div><strong>{post.author.name}</strong><span>{[post.author.handle, post.author.campus, relativeTime(post.createdAt)].filter(Boolean).join(" · ")}</span></div>
                    <div className="knowledge-post-actions">
                      {post.canEdit && <button type="button" onClick={() => setEditingPost({ id: post.id, body: post.body })}><FiEdit3 /> Edit</button>}
                      {post.canTakeDown && <button type="button" className="is-danger" disabled={working === `remove-post-${post.id}`} onClick={() => takeDownPost(post)}><FiTrash2 /> Take down</button>}
                    </div>
                  </header>
                  <p>{post.body}</p>
                  {post.mediaUrls?.length ? <div className={`knowledge-post-media is-${Math.min(post.mediaUrls.length, 3)}`}>{post.mediaUrls.slice(0, 3).map((url) => <img src={normalizeZumbarlFileUrl(url)} alt="" key={url} />)}</div> : null}
                  <footer><span><FiMessageCircle /> Explore Campus post</span>{post.updatedAt !== post.createdAt && <small>Edited</small>}</footer>
                </article>)}
                {!communityPosts.length && <div className="knowledge-space-empty">No posts yet.{isMember ? " Share the first update with this community." : ""}</div>}
              </div>
            </section>}

            {activeTab === "events" && !isLibrary && <section className="knowledge-space-section knowledge-events-section">
              <div className="knowledge-space-section-head">
                <div><span>Meet together</span><h2>Group events</h2><p>Revision sessions, meetups and activities organised by this group.</p></div>
                {isMember && <button type="button" className="knowledge-add-button" onClick={() => { setPostComposerType("event"); setShowPostForm(true); }}><FiPlus /> New event</button>}
              </div>
              <div className="knowledge-event-grid">
                {eventPosts.map((post) => <article className="knowledge-event-card" key={post.id}>
                  {post.event?.thumbnailUrl || post.mediaUrls?.[0] ? <img src={normalizeZumbarlFileUrl(post.event?.thumbnailUrl || post.mediaUrls[0])} alt="" /> : <div className="knowledge-event-placeholder"><FiCalendar /></div>}
                  <div className="knowledge-event-card-body">
                    <header><span><FiCalendar /> {post.event?.startsAt ? new Date(post.event.startsAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : "Date to be confirmed"}</span>
                      <div className="knowledge-post-actions">{post.canEdit && <button type="button" onClick={() => setEditingPost({ id: post.id, body: post.body })}><FiEdit3 /> Edit</button>}{post.canTakeDown && <button type="button" className="is-danger" disabled={working === `remove-post-${post.id}`} onClick={() => takeDownPost(post)}><FiTrash2 /> Take down</button>}</div>
                    </header>
                    <h3>{post.event?.title || "Group event"}</h3><p>{post.body}</p>
                    <footer><span><FiMapPin /> {post.event?.location || "Location to be confirmed"}</span><small>By {post.author.name}</small></footer>
                  </div>
                </article>)}
                {!eventPosts.length && <div className="knowledge-space-empty">No events planned yet.{isMember ? " Create the first group event." : ""}</div>}
              </div>
            </section>}

            {activeTab === "members" && <section className="knowledge-space-section">
              <div className="knowledge-space-section-head"><div><span>Community</span><h2>Members</h2><p>People who belong to this {isLibrary ? "library" : "study group"}.</p></div><strong>{members.length} members</strong></div>
              <div className="knowledge-member-grid">
                {members.map((member) => <PersonRow
                  key={member.id}
                  person={member}
                  showDetails
                  secondaryAction={!member.isViewer ? <button type="button" className={member.isFollowing ? "is-following" : ""} disabled={working === `follow-${member.id}`} onClick={() => toggleMemberFollow(member)}>{working === `follow-${member.id}` ? "Saving…" : member.isFollowing ? "Following" : "Follow"}</button> : null}
                  action={<span className={`knowledge-role is-${member.role}`}>{member.role}</span>}
                />)}
                {!members.length && <div className="knowledge-space-empty">No active members yet.</div>}
              </div>
            </section>}

            {activeTab === "rooms" && <section className="knowledge-space-section knowledge-rooms-section">
              <div className="knowledge-space-section-head">
                <div><span>Member conversations</span><h2>Rooms</h2><p>Discuss a book, a resource, or a topic with other members.</p></div>
                {isMember && <button type="button" className="knowledge-add-button" onClick={() => setShowRoomForm(true)}><FiPlus /> New room</button>}
              </div>
              <div className="knowledge-room-layout">
                  <div className="knowledge-room-list">
                    {rooms.map((room) => <button type="button" className={selectedRoomId === room.id ? "is-active" : ""} onClick={() => openRoom(room.id)} key={room.id}>
                      <span className="knowledge-room-list-icon">{room.resource ? <FiBookOpen /> : <FiMessageCircle />}</span>
                      <span><strong>{room.title}</strong><small>{!isMember ? `${room.memberCount} members · Join to view conversation` : room.membership?.status === "pending" ? "Approval pending" : room.membership?.status === "active" || room.isCreator ? `${room.messageCount} messages · ${room.memberCount} members` : `${room.memberCount} members · Request to join`}</small></span>
                      <time>{relativeTime(room.updatedAt)}</time>
                    </button>)}
                    {!rooms.length && <div className="knowledge-room-empty"><FiMessageCircle /><p>No rooms yet.</p>{isMember && <button type="button" onClick={() => setShowRoomForm(true)}>Create the first room</button>}</div>}
                  </div>
                  <div className="knowledge-chat-panel">
                    {!selectedRoom ? <div className="knowledge-chat-placeholder"><FiMessageCircle /><h3>Choose a room</h3><p>{isMember ? "Select a book or topic room to join the conversation." : "You can browse room names and topics. Join this space to view conversations."}</p></div> : <>
                      <header><button type="button" className="knowledge-chat-room-title" onClick={isMember ? openRoomInfo : undefined}><span>{selectedRoom.resource ? "Resource room" : "Topic room"}</span><h3>{selectedRoom.title}</h3><p>{selectedRoom.description || selectedRoom.resource?.title || "Member conversation"}</p><small>{selectedRoom.memberCount} members{isMember ? <> · View room info <FiChevronRight /></> : " · Conversation locked"}</small></button>{selectedRoom.messageCount !== null && <strong>{selectedRoom.messageCount}</strong>}</header>
                      {selectedRoomHasAccess ? <>
                        <div className="knowledge-chat-messages">
                          {working === `room-${selectedRoom.id}` && <p className="knowledge-chat-status">Loading conversation…</p>}
                          {roomMessages.map((message) => <ChatMessage message={message} onPreviewAttachment={setAttachmentPreview} onOpenResource={(resourceId) => { const resource = resources.find((item) => item.id === resourceId); if (resource) setReader(resource); }} key={message.id} />)}
                          {!roomMessages.length && working !== `room-${selectedRoom.id}` && <p className="knowledge-chat-status">No messages yet. Start the conversation.</p>}
                        </div>
                        <form className="knowledge-chat-composer" onSubmit={submitMessage}>
                          {messageFiles.length > 0 && <div className={`knowledge-chat-attachment-draft${messageFiles.length === 1 ? " is-single" : ""}`}>{messageFiles.map((file, index) => <ChatAttachmentPreview file={file} onRemove={() => setMessageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} key={`${file.name}-${file.lastModified}-${index}`} />)}</div>}
                          <label className="knowledge-chat-attach" title="Attach files"><FiPaperclip /><span className="sr-only">Attach files</span><input type="file" multiple onChange={(event) => setMessageFiles(Array.from(event.target.files || []).slice(0, 8))} /></label>
                          <input value={messageBody} onChange={(event) => setMessageBody(event.target.value)} placeholder={`Message ${selectedRoom.title}`} maxLength={2000} />
                          <button type="submit" disabled={(!messageBody.trim() && !messageFiles.length) || working === "send-message"}><FiSend /><span>{working === "send-message" ? "Sending…" : "Send"}</span></button>
                        </form>
                      </> : !isMember ? <div className="knowledge-room-access-prompt"><FiMessageCircle /><h3>{isPending ? "Membership awaiting approval" : "Join to view this conversation"}</h3><p>{isPending ? "An owner or admin must approve your space membership before room threads become available." : "Room titles and topics are public on this page, but messages and member details are available only to approved members."}</p><div><button type="button" onClick={updateMembership} disabled={isInviteOnly || working === "membership"}>{membershipLabel}</button></div></div> : <div className="knowledge-room-access-prompt"><FiMessageCircle /><h3>{selectedRoom.membership?.status === "pending" ? "Waiting for room admin approval" : "Join this room"}</h3><p>{selectedRoom.membership?.status === "pending" ? "Your request is pending. You can cancel it whenever you like." : "Joining needs approval from a room or space admin. Once admitted, you can read and send messages."}</p><div><button type="button" onClick={changeRoomMembership} disabled={working === "room-membership"}>{selectedRoom.membership?.status === "pending" ? "Cancel request" : "Request to join"}</button><button type="button" className="is-secondary" onClick={openRoomInfo}><FiInfo /> Room info</button></div></div>}
                    </>}
                  </div>
                </div>
            </section>}

            {activeTab === "chat" && !isLibrary && <section className="knowledge-space-section knowledge-group-chat-section">
              <div className="knowledge-space-section-head"><div><span>Group conversation</span><h2>Chat</h2><p>One shared room for approved members, links, documents, and learning resources.</p></div><strong>{members.length} {members.length === 1 ? "member" : "members"}</strong></div>
              <div className="knowledge-group-chat-shell">
                <div className="knowledge-chat-panel">
                  {!selectedRoom ? <div className="knowledge-chat-placeholder"><FiMessageCircle /><h3>Group chat is being prepared</h3><p>Refresh shortly to open the group conversation.</p></div> : <>
                    <header className="knowledge-group-chat-toolbar"><span><FiUsers /> Approved members only</span>{isMember && <button type="button" onClick={openRoomInfo}>Chat info <FiChevronRight /></button>}{selectedRoom.messageCount !== null && <strong title="Messages">{selectedRoom.messageCount}</strong>}</header>
                    {selectedRoomHasAccess ? <>
                      <div className="knowledge-chat-messages">
                        {working === `room-${selectedRoom.id}` && <p className="knowledge-chat-status">Loading conversation…</p>}
                        {roomMessages.map((message) => <ChatMessage message={message} canPromote promoting={working === `promote-${message.id}`} onPromote={startResourceFromMessage} onPreviewAttachment={setAttachmentPreview} onOpenResource={(resourceId) => { const resource = resources.find((item) => item.id === resourceId); if (resource) setReader(resource); }} key={message.id} />)}
                        {!roomMessages.length && working !== `room-${selectedRoom.id}` && <p className="knowledge-chat-status">No messages yet. Start the conversation.</p>}
                      </div>
                      <form className="knowledge-chat-composer" onSubmit={submitMessage}>
                        {messageFiles.length > 0 && <div className={`knowledge-chat-attachment-draft${messageFiles.length === 1 ? " is-single" : ""}`}>{messageFiles.map((file, index) => <ChatAttachmentPreview file={file} onRemove={() => setMessageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} key={`${file.name}-${file.lastModified}-${index}`} />)}</div>}
                        <label className="knowledge-chat-attach" title="Attach documents, books, papers, or media"><FiPaperclip /><span className="sr-only">Attach files</span><input type="file" multiple onChange={(event) => setMessageFiles(Array.from(event.target.files || []).slice(0, 8))} /></label>
                        <input value={messageBody} onChange={(event) => setMessageBody(event.target.value)} placeholder="Write a message or paste a link" maxLength={2000} />
                        <button type="submit" disabled={(!messageBody.trim() && !messageFiles.length) || working === "send-message"}><FiSend /><span>{working === "send-message" ? "Sending…" : "Send"}</span></button>
                      </form>
                    </> : <div className="knowledge-room-access-prompt"><FiMessageCircle /><h3>{isPending ? "Membership awaiting approval" : "Join to open group chat"}</h3><p>{isPending ? "An owner or admin must approve your request first." : "Everyone can see that this group has a chat, while its messages remain private to approved members."}</p><div><button type="button" onClick={updateMembership} disabled={isInviteOnly || working === "membership"}>{membershipLabel}</button></div></div>}
                  </>}
                </div>
              </div>
            </section>}

            {activeTab === "manage" && canManage && <section className="knowledge-management">
              <form className="knowledge-manage-card" onSubmit={saveSettings}>
                <div className="knowledge-manage-heading"><FiSettings /><div><h2>Page settings</h2><p>Update what members see and how they can join.</p></div></div>
                <label>Name<input value={spaceForm.name} onChange={(event) => setSpaceForm((current) => ({ ...current, name: event.target.value }))} required /></label>
                <label>Description<textarea value={spaceForm.description} onChange={(event) => setSpaceForm((current) => ({ ...current, description: event.target.value }))} rows={4} /></label>
                <div className="knowledge-form-pair"><label>Visibility<select value={spaceForm.visibility} onChange={(event) => setSpaceForm((current) => ({ ...current, visibility: event.target.value }))}><option value="public">Public</option><option value="campus">Campus</option><option value="private">Private</option></select></label><label>Joining<select value={spaceForm.membershipMode} onChange={(event) => setSpaceForm((current) => ({ ...current, membershipMode: event.target.value }))}><option value="request">Admin approval required</option><option value="invite">Invite only</option></select></label></div>
                <KnowledgeAvatarPicker
                  currentUrl={spaceForm.avatarUrl}
                  file={spaceAvatarFile}
                  fallbackUrl={`/assets/knowledge/default-${space.type}-avatar.svg`}
                  onChange={setSpaceAvatarFile}
                  onClear={() => { setSpaceAvatarFile(null); setSpaceForm((current) => ({ ...current, avatarUrl: "" })); }}
                  disabled={working === "save-settings"}
                />
                <label>Cover image URL<input type="url" value={spaceForm.coverImageUrl} onChange={(event) => setSpaceForm((current) => ({ ...current, coverImageUrl: event.target.value }))} /></label>
                <button type="submit" disabled={working === "save-settings"}>{working === "save-settings" ? "Saving…" : "Save page"}</button>
              </form>

              <section className="knowledge-manage-card">
                <div className="knowledge-manage-heading"><FiUserPlus /><div><h2>Managers</h2><p>Managers can edit this page, manage members and {isLibrary ? "create rooms" : "moderate the group chat"}.</p></div></div>
                <div className="knowledge-manager-list">{management?.managers?.map((manager) => <PersonRow key={manager.id} person={manager} action={isOwner && manager.role !== "owner" ? <button type="button" disabled={working === `manager-${manager.id}`} onClick={() => changeManager(manager.id, false)}>Remove</button> : <span className={`knowledge-role is-${manager.role}`}>{manager.role}</span>} />)}</div>
                {isOwner && <><form className="knowledge-manager-search" onSubmit={searchManagers}><input value={managerQuery} onChange={(event) => setManagerQuery(event.target.value)} placeholder="Search name, username or email" /><button type="submit"><FiSearch /> Search</button></form><div className="knowledge-manager-results">{managerCandidates.map((candidate) => <PersonRow key={candidate.id} person={candidate} action={<button type="button" disabled={candidate.currentRole === "admin" || working === `manager-${candidate.id}`} onClick={() => changeManager(candidate.id, true)}>{candidate.currentRole === "admin" ? "Manager" : "Add manager"}</button>} />)}</div></>}
              </section>

              <section className="knowledge-manage-card knowledge-manage-queues">
                <nav className="knowledge-manage-subtabs" aria-label="Management queues">
                  <button type="button" className={manageQueueTab === "members" ? "is-active" : ""} onClick={() => setManageQueueTab("members")}><FiUsers /><span>Members</span><strong>{management?.pendingRequests?.length || 0}</strong></button>
                  {isLibrary && <button type="button" className={manageQueueTab === "resources" ? "is-active" : ""} onClick={() => setManageQueueTab("resources")}><FiBookOpen /><span>Submissions</span><strong>{management?.pendingResources?.length || 0}</strong></button>}
                  {isLibrary && <button type="button" className={manageQueueTab === "access" ? "is-active" : ""} onClick={() => setManageQueueTab("access")}><FiArchive /><span>Borrow requests</span><strong>{management?.pendingAccesses?.length || 0}</strong></button>}
                  {isLibrary && <button type="button" className={manageQueueTab === "sales" ? "is-active" : ""} onClick={() => setManageQueueTab("sales")}><FiDollarSign /><span>Sales</span><strong>{management?.earnings?.purchaseCount || 0}</strong></button>}
                </nav>

                {manageQueueTab === "members" && <div className="knowledge-manage-panel">
                  <div className="knowledge-manage-heading"><FiUsers /><div><h2>Members &amp; requests</h2><p>Review requests and see everyone with active access.</p></div></div>
                  <h3>Pending requests <span>{management?.pendingRequests?.length || 0}</span></h3>
                  {(management?.pendingRequests || []).map((person) => <PersonRow key={person.id} person={person} secondaryAction={<button type="button" className="is-decline" onClick={() => decideRequest(person.id, "REJECT")}>Decline</button>} action={<button type="button" onClick={() => decideRequest(person.id, "APPROVE")}>Approve</button>} />)}
                  {!management?.pendingRequests?.length && <p className="knowledge-manage-empty">No pending membership requests.</p>}
                  <h3>Active members <span>{management?.members?.length || 0}</span></h3>
                  <div className="knowledge-manager-list">{(management?.members || []).map((person) => <PersonRow key={person.id} person={person} action={<span className="knowledge-role">member</span>} />)}</div>
                </div>}

                {isLibrary && manageQueueTab === "resources" && <div className="knowledge-manage-panel">
                  <div className="knowledge-manage-heading"><FiBookOpen /><div><h2>Resource submissions</h2><p>Review member contributions before they appear on the learning shelf.</p></div></div>
                  <h3>Pending review <span>{management?.pendingResources?.length || 0}</span></h3>
                  <div className="knowledge-resource-review-list">{(management?.pendingResources || []).map((resource) => <article key={resource.id}>
                    <img src={resource.coverImageUrl} alt="" />
                    <div><strong>{resource.title}</strong><span>{[RESOURCE_LABELS[resource.type], resource.unit?.name || resource.subject, resource.owner?.name].filter(Boolean).join(" · ")}</span><p>{resource.description || "No description supplied."}</p></div>
                    <div><button type="button" className="is-decline" disabled={working === `resource-request-${resource.id}`} onClick={() => decideResource(resource.id, "REJECT")}>Decline</button><button type="button" disabled={working === `resource-request-${resource.id}`} onClick={() => decideResource(resource.id, "APPROVE")}>Approve</button></div>
                  </article>)}</div>
                  {!management?.pendingResources?.length && <p className="knowledge-manage-empty">No resources are waiting for review.</p>}
                </div>}

                {isLibrary && manageQueueTab === "access" && <div className="knowledge-manage-panel">
                  <div className="knowledge-manage-heading"><FiArchive /><div><h2>Borrow requests</h2><p>Approve lending requests before members can open borrowable resources.</p></div></div>
                  <h3>Waiting for approval <span>{management?.pendingAccesses?.length || 0}</span></h3>
                  <div className="knowledge-resource-review-list">{(management?.pendingAccesses || []).map((request) => <article key={request.id}>
                    <img src={normalizeZumbarlFileUrl(request.requester.avatarUrl) || DEFAULT_MEMBER_AVATAR} alt="" />
                    <div><strong>{request.requester.name} requested to borrow {request.resource.title}</strong><span>{[RESOURCE_LABELS[request.resource.type], request.requester.campus, `${request.resource.availableCopies || 0} copies`].filter(Boolean).join(" · ")}</span><p>{relativeTime(request.requestedAt)}</p></div>
                    <div><button type="button" className="is-decline" disabled={working === `access-request-${request.id}`} onClick={() => decideAccessRequest(request.id, "REJECT")}>Decline</button><button type="button" disabled={working === `access-request-${request.id}`} onClick={() => decideAccessRequest(request.id, "APPROVE")}>Approve</button></div>
                  </article>)}</div>
                  {!management?.pendingAccesses?.length && <p className="knowledge-manage-empty">No borrow requests are waiting.</p>}
                </div>}

                {isLibrary && manageQueueTab === "sales" && <div className="knowledge-manage-panel">
                  <div className="knowledge-manage-heading"><FiDollarSign /><div><h2>Library sales</h2><p>Completed resource purchases and gross earnings across this library.</p></div></div>
                  <div className="knowledge-sales-summary"><div><span>Gross earned</span><strong>{management?.earnings?.currency || "KES"} {Number(management?.earnings?.grossAmount || 0).toLocaleString()}</strong></div><div><span>Purchases</span><strong>{management?.earnings?.purchaseCount || 0}</strong></div></div>
                  <div className="knowledge-resource-review-list">{(management?.purchases || []).map((purchase) => <article key={purchase.id}>
                    <img src={normalizeZumbarlFileUrl(purchase.buyer.avatarUrl) || DEFAULT_MEMBER_AVATAR} alt="" />
                    <div><strong>{purchase.buyer.name} bought {purchase.resource.title}</strong><span>{[purchase.publisher?.name ? `Published by ${purchase.publisher.name}` : null, relativeTime(purchase.purchasedAt)].filter(Boolean).join(" · ")}</span><p>Payment completed and access granted</p></div>
                    <b className="knowledge-sale-amount">{purchase.currency} {Number(purchase.amount || 0).toLocaleString()}</b>
                  </article>)}</div>
                  {!management?.purchases?.length && <p className="knowledge-manage-empty">No completed resource purchases yet.</p>}
                </div>}
              </section>
            </section>}
          </section>

          <aside className="campus-rail knowledge-space-rail">
            <section className="knowledge-space-rail-card">
              <div className="knowledge-space-rail-icon">{isLibrary ? <FiArchive /> : <FiUsers />}</div>
              <h2>About this {isLibrary ? "library" : "group"}</h2><p>{space.description || "This space brings campus learning material and learners together."}</p>
              <dl><div title="Resources"><dt><FiBookOpen /><span className="sr-only">Resources</span></dt><dd>{space.resourceCount}</dd></div><div title="Members"><dt><FiUsers /><span className="sr-only">Members</span></dt><dd>{space.memberCount}</dd></div><div title={isLibrary ? "Rooms" : "Events"}><dt>{isLibrary ? <FiMessageCircle /> : <FiCalendar />}<span className="sr-only">{isLibrary ? "Rooms" : "Events"}</span></dt><dd>{isLibrary ? rooms.length : eventPosts.length}</dd></div></dl>
            </section>
            {canManage && <button type="button" className="knowledge-rail-manage" onClick={() => setActiveTab("manage")}><FiSettings /><span><strong>Manage this page</strong><small>{approvalCount ? `${approvalCount} approvals waiting` : isLibrary ? "Members, rooms and settings" : "Members, chat and settings"}</small></span></button>}
            {canManage && isLibrary && <section className="knowledge-space-rail-card knowledge-space-earnings-card"><div className="knowledge-space-rail-icon"><FiDollarSign /></div><span>Library earnings</span><strong>{management?.earnings?.currency || "KES"} {Number(management?.earnings?.grossAmount || 0).toLocaleString()}</strong><p>{management?.earnings?.purchaseCount || 0} completed {management?.earnings?.purchaseCount === 1 ? "purchase" : "purchases"}</p><button type="button" onClick={() => { setActiveTab("manage"); setManageQueueTab("sales"); }}>View sales</button></section>}
            <section className="knowledge-space-rail-card"><h2>Access</h2><p>{space.membershipMode === "invite" ? "Membership is by invitation. Invited members are admitted by an owner or admin." : `Every membership request is reviewed by this space’s owner or admins before ${isLibrary ? "room" : "group chat"} access is granted.`}</p><span className="knowledge-space-visibility">{space.visibility === "campus" ? "Visible across this campus" : space.visibility === "private" ? "Private space" : "Public space"}</span></section>
          </aside>
        </div>
      </div>

      {showRoomForm && <div className="knowledge-space-reader-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowRoomForm(false); }}><form className="knowledge-room-dialog" onSubmit={submitRoom}><button type="button" className="knowledge-space-reader-close" onClick={() => setShowRoomForm(false)}><FiX /></button><span>New member room</span><h2>Start a conversation</h2><p>Create a general topic room or connect the room to a resource on this page.</p><label>Room title<input value={roomForm.title} onChange={(event) => setRoomForm((current) => ({ ...current, title: event.target.value }))} minLength={3} maxLength={120} required /></label><label>Linked book or resource<select value={roomForm.resourceId} onChange={(event) => setRoomForm((current) => ({ ...current, resourceId: event.target.value }))}><option value="">General topic</option>{resources.map((resource) => <option value={resource.id} key={resource.id}>{resource.title}</option>)}</select></label><label>Description<textarea value={roomForm.description} onChange={(event) => setRoomForm((current) => ({ ...current, description: event.target.value }))} maxLength={500} rows={4} /></label><button type="submit" disabled={working === "create-room"}>{working === "create-room" ? "Creating…" : "Create room"}</button></form></div>}

      {showResourceForm && <div className="knowledge-space-reader-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowResourceForm(false); setResourceOriginMessage(null); setResourceExistingFiles([]); } }}>
        <form className="knowledge-room-dialog knowledge-resource-dialog" onSubmit={submitResource}>
          <button type="button" className="knowledge-space-reader-close" onClick={() => { setShowResourceForm(false); setResourceOriginMessage(null); setResourceExistingFiles([]); }} aria-label="Close resource form"><FiX /></button>
          <span>{resourceOriginMessage ? "From group chat" : "Member contribution"}</span><h2>{resourceOriginMessage ? "Mark as a resource" : "Add a resource"}</h2><p>{resourceOriginMessage ? "Add the details once. This message will be linked to the published group resource." : "Share notes, a book, a past paper, or a useful study link with everyone in this space."}</p>
          {resourceOriginMessage && <div className="knowledge-resource-origin"><FiMessageCircle /><span><strong>Chat message</strong><small>{resourceOriginMessage.body || `${resourceOriginMessage.attachments?.length || 0} attached file(s)`}</small></span></div>}
          <label>Resource title<input value={resourceForm.title} onChange={(event) => setResourceForm((current) => ({ ...current, title: event.target.value }))} minLength={3} maxLength={180} required /></label>
          <div className="knowledge-form-pair">
            <label>Type<select value={resourceForm.resourceType} onChange={(event) => setResourceForm((current) => ({ ...current, resourceType: event.target.value }))}><option value="NOTES">Notes</option><option value="PAST_PAPER">Past paper</option><option value="BOOK">Book</option><option value="STUDY_GUIDE">Study guide</option><option value="ARTICLE">Article</option></select></label>
            <label>Access<select value={isLibrary ? resourceForm.accessMode : "MEMBERS_ONLY"} disabled={!isLibrary} onChange={(event) => setResourceForm((current) => ({ ...current, accessMode: event.target.value }))}>{isLibrary ? <><option value="FREE_READ">Read free</option><option value="MEMBERS_ONLY">Members only</option><option value="BORROW">Borrow</option><option value="BUY">Buy</option></> : <option value="MEMBERS_ONLY">Members only</option>}</select></label>
          </div>
          <label>Course code <small>(optional)</small><input value={resourceForm.courseCode} onChange={(event) => setResourceForm((current) => ({ ...current, courseCode: event.target.value }))} maxLength={40} placeholder="e.g. BAC 1101" /></label>
          <div className="knowledge-unit-picker">
            <label>Unit<input value={unitQuery} onChange={(event) => updateUnitQuery(event.target.value)} placeholder="Search unit name or code" autoComplete="off" required /></label>
            {selectedUnit && <div className="knowledge-unit-selection"><FiCheck /><span>Using existing unit <strong>{selectedUnit.name}</strong></span><button type="button" onClick={() => updateUnitQuery("")}><FiX /></button></div>}
            {createNewUnit && <div className="knowledge-unit-selection is-new"><FiPlus /><span>Will create <strong>{unitQuery.trim()}</strong> as a new unit</span><button type="button" onClick={() => updateUnitQuery(unitQuery)}><FiX /></button></div>}
            {!selectedUnit && !createNewUnit && unitQuery.trim().length >= 2 && <div className="knowledge-unit-results">
              {unitSearching ? <span>Searching units…</span> : <>
                {unitOptions.map((unit) => <button type="button" key={unit.id} onClick={() => { setSelectedUnit(unit); setUnitQuery(unit.name); setUnitOptions([]); }}><FiBookOpen /><span><strong>{unit.name}</strong><small>Use existing unit</small></span><FiChevronRight /></button>)}
                {!unitOptions.some((unit) => unit.name.trim().toLowerCase() === unitQuery.trim().toLowerCase()) && <button type="button" className="is-create" onClick={() => { setCreateNewUnit(true); setUnitOptions([]); }}><FiPlus /><span><strong>Create “{unitQuery.trim()}”</strong><small>No exact unit found — add it as new</small></span><FiChevronRight /></button>}
              </>}
            </div>}
          </div>
          <label>Description<textarea value={resourceForm.description} onChange={(event) => setResourceForm((current) => ({ ...current, description: event.target.value }))} maxLength={1200} rows={3} /></label>
          <GeneratedResourceThumbnailPicker customFile={resourceCoverFile} generatedFile={resourceGeneratedCoverFile} generationStatus={thumbnailGenerationStatus} onChange={setResourceCoverFile} disabled={working === "create-resource"} />
          {resourceForm.accessMode === "BUY" && <label>Price (KES)<input type="number" min="1" step="1" value={resourceForm.price} onChange={(event) => setResourceForm((current) => ({ ...current, price: event.target.value }))} required /></label>}
          {resourceForm.accessMode === "BORROW" && <label>Available copies<input type="number" min="0" step="1" value={resourceForm.availableCopies} onChange={(event) => setResourceForm((current) => ({ ...current, availableCopies: event.target.value }))} required /></label>}
          {resourceOriginMessage ? <section className="knowledge-resource-chat-source" aria-label="Resource source from chat">
            <header><FiCheck /><span><strong>Source from chat</strong><small>The original message source is attached automatically and cannot be replaced here.</small></span></header>
            {resourceSource === "FILES"
              ? <div className="knowledge-resource-existing-files is-locked">{resourceExistingFiles.map((file, index) => <span key={`${file.url}-${index}`}><FiPaperclip /><strong>{file.name}</strong></span>)}</div>
              : <div className="knowledge-resource-chat-link"><FiLink /><span>{resourceForm.fileUrl}</span></div>}
          </section> : <>
            <fieldset className="knowledge-resource-source"><legend>Resource source</legend><div><button type="button" className={resourceSource === "FILES" ? "is-active" : ""} onClick={() => setResourceSource("FILES")}><FiUploadCloud /> Upload files</button><button type="button" className={resourceSource === "LINK" ? "is-active" : ""} onClick={() => { setResourceSource("LINK"); selectResourceFiles([]); }}><FiLink /> Web link</button></div></fieldset>
            {resourceSource === "FILES" ? <><label className="knowledge-resource-file-picker"><FiUploadCloud /><span><strong>{resourceFiles.length ? `${resourceFiles.length} new file${resourceFiles.length === 1 ? "" : "s"} selected` : resourceExistingFiles.length ? "Add more files" : "Choose files"}</strong><small>PDFs, documents, images, videos, or other learning files</small></span><input type="file" multiple onChange={(event) => selectResourceFiles(event.target.files)} required={!resourceExistingFiles.length} /></label>{resourceExistingFiles.length > 0 && <div className="knowledge-resource-existing-files">{resourceExistingFiles.map((file, index) => <span key={`${file.url}-${index}`}><FiPaperclip /><strong>{file.name}</strong><button type="button" onClick={() => setResourceExistingFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><FiX /></button></span>)}</div>}</> : <label>Resource link<input type="url" value={resourceForm.fileUrl} onChange={(event) => setResourceForm((current) => ({ ...current, fileUrl: event.target.value }))} placeholder="https://…" required /></label>}
          </>}
          <label>Preview text <small>(optional)</small><textarea value={resourceForm.previewText} onChange={(event) => setResourceForm((current) => ({ ...current, previewText: event.target.value }))} maxLength={5000} rows={3} /></label>
          <button type="submit" disabled={working === "create-resource"}>{working === "create-resource" ? "Adding resource…" : resourceOriginMessage ? "Add to group resources" : "Add resource"}</button>
        </form>
      </div>}

      {showRoomInfo && <div className="knowledge-room-info-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowRoomInfo(false); }}>
        <aside className="knowledge-room-info" role="dialog" aria-modal="true" aria-label="Room information">
          <header><button type="button" onClick={() => setShowRoomInfo(false)} aria-label="Close room information"><FiX /></button><div><span>Room details</span><h2>{roomInfo?.room?.title || selectedRoom?.title || "Room"}</h2></div></header>
          {!roomInfo ? <div className="knowledge-room-info-loading">Loading room information…</div> : <>
            <section className="knowledge-room-info-identity"><div><FiMessageCircle /></div><h3>{roomInfo.room.title}</h3><p>{roomInfo.room.resource ? `Resource room · ${roomInfo.room.resource.title}` : "Topic room"}</p><strong>{roomInfo.room.memberCount} members</strong></section>
            {!roomInfo.room.isPrimary && <button type="button" className={`knowledge-room-membership-action${roomInfo.room.membership?.status === "active" || roomInfo.room.isCreator ? " is-leave" : ""}`} disabled={working === "room-membership"} onClick={changeRoomMembership}>{roomInfo.room.membership?.status === "active" || roomInfo.room.isCreator ? <><FiLogOut /> Leave room</> : roomInfo.room.membership?.status === "pending" ? <><FiClock /> Cancel request</> : <><FiUserPlus /> Request to join</>}</button>}
            {roomInfo.room.isPrimary && <div className="knowledge-room-creator-note"><FiCheck /> Chat access follows group membership</div>}
            {roomInfo.room.isCreator && <div className="knowledge-room-creator-note"><FiCheck /> You currently manage this room</div>}
            <section className="knowledge-room-about">
              <header><div><span>About</span><h3>Room information</h3></div>{roomInfo.room.canManage && !editingRoomInfo && <button type="button" onClick={() => setEditingRoomInfo(true)}><FiEdit3 /> Edit</button>}</header>
              {editingRoomInfo ? <form onSubmit={saveRoomInfo}><label>Room name<input required minLength={3} maxLength={120} value={roomInfoForm.title} onChange={(event) => setRoomInfoForm((current) => ({ ...current, title: event.target.value }))} /></label><label>About<textarea rows={4} maxLength={500} value={roomInfoForm.description} onChange={(event) => setRoomInfoForm((current) => ({ ...current, description: event.target.value }))} /></label><div><button type="button" onClick={() => setEditingRoomInfo(false)}>Cancel</button><button type="submit" disabled={working === "save-room-info"}>Save</button></div></form> : <p>{roomInfo.room.description || "No room description has been added yet."}</p>}
            </section>
            {roomInfo.management && <section className="knowledge-room-requests"><h3>Join requests <span>{roomInfo.management.pendingRequests.length}</span></h3>{roomInfo.management.pendingRequests.map((person) => <PersonRow key={person.id} person={person} secondaryAction={<button type="button" className="is-decline" disabled={working === `room-request-${person.id}`} onClick={() => decideRoomRequest(person.id, "REJECT")}>Decline</button>} action={<button type="button" disabled={working === `room-request-${person.id}`} onClick={() => decideRoomRequest(person.id, "APPROVE")}>Approve</button>} />)}{!roomInfo.management.pendingRequests.length && <p>No pending requests.</p>}</section>}
            <section className="knowledge-room-members"><h3>Members <span>{roomInfo.members.length}</span></h3><div>{roomInfo.members.map((person) => <PersonRow key={person.id} person={person} action={<span className={`knowledge-role is-${person.role}`}>{person.isViewer ? "You" : person.role}</span>} />)}</div></section>
          </>}
        </aside>
      </div>}

      <ExplorePostComposer
        isOpen={showPostForm}
        initialType={postComposerType}
        allowSpaceTags={false}
        onClose={() => setShowPostForm(false)}
        onPublish={publishSpacePost}
      />
      {editingPost && <div className="knowledge-space-reader-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingPost(null); }}>
        <form className="knowledge-room-dialog knowledge-post-edit-dialog" onSubmit={saveSpacePost}>
          <button type="button" className="knowledge-space-reader-close" onClick={() => setEditingPost(null)} aria-label="Close post editor"><FiX /></button>
          <span>Community post</span><h2>Edit post</h2><p>Your changes also update the post in Explore Campus.</p>
          <label>Post text<textarea value={editingPost.body} onChange={(event) => setEditingPost((current) => ({ ...current, body: event.target.value }))} minLength={1} maxLength={5000} rows={7} required /></label>
          <button type="submit" disabled={working === `edit-post-${editingPost.id}`}>{working === `edit-post-${editingPost.id}` ? "Saving…" : "Save changes"}</button>
        </form>
      </div>}
      <KnowledgeResourceCheckoutModal checkout={purchaseCheckout} error={purchaseError} working={working === "purchase"} onClose={() => { setPurchaseCheckout(null); setPurchaseError(""); }} onConfirm={confirmResourcePurchase} />
      {reader && <div className="knowledge-space-reader-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setReader(null); }}><section className="knowledge-space-reader" role="dialog" aria-modal="true" aria-label={reader.title}><button type="button" className="knowledge-space-reader-close" onClick={() => setReader(null)}><FiX /></button><span>{RESOURCE_LABELS[reader.type]}</span><h2>{reader.title}</h2><p>{reader.description}</p><div className="knowledge-space-preview">{reader.previewText || "The publisher has not added a text preview. Open the attached resource below."}</div><div className="knowledge-space-reader-links">{reader.fileUrl && <button type="button" onClick={() => setAttachmentPreview({ url: reader.fileUrl, name: reader.title })}><FiEye /> Preview resource link</button>}{(reader.fileUrls || []).map((url, index) => <button type="button" onClick={() => setAttachmentPreview({ url, name: `${reader.title} · File ${index + 1}` })} key={url}><FiEye /> Preview file {index + 1}</button>)}</div></section></div>}
      <AttachmentPreviewModal attachment={attachmentPreview} onClose={() => setAttachmentPreview(null)} />
    </main>
  );
}
