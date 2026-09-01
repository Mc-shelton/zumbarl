import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiCheck,
  FiImage,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiShoppingBag,
  FiTag,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { useDialog } from "../../../components/ui";
import { normalizeZumbarlFileUrl } from "../../../lib/normalizeZumbarlFileUrl";
import { uploadZumbarlFile } from "../../../lib/uploadZumbarlFile";
import {
  listMarketplaceListings,
  mapMarketplaceApiListing,
  searchMarketplaceLocations,
} from "../../opportunities/services/marketplaceInteractionService";
import { readKnowledgeHub } from "../../learn/services/learnService";
import { searchEventOrganizers, searchPostTagTargets } from "../services/postService";

const TYPES = [
  { id: "post", label: "Post" },
  { id: "media", label: "Photo/Video" },
  { id: "event", label: "Event" },
  { id: "poll", label: "Poll" },
  { id: "feeling", label: "Feeling/Activity" },
];
const DEFAULT_TYPE_IDS = TYPES.map((type) => type.id);
const FEELINGS = [
  ["😊", "happy"],
  ["🎉", "celebrating"],
  ["📚", "studying"],
  ["💪", "motivated"],
  ["🙏", "grateful"],
  ["🏃", "active"],
];

function ExplorePostComposer({
  allowedTypes = DEFAULT_TYPE_IDS,
  identity = null,
  initialType = "post",
  isOpen,
  onClose,
  onPublish,
  eyebrow = "Zumbarl Connect",
  fixedOrganizer = null,
  placeholder = "What's happening on campus?",
  publishLabel = "Post",
  requiredTag = null,
  title = "Create post",
  allowSpaceTags = true,
}) {
  const dialogRef = useDialog({ isOpen, onClose });
  const requiredTagId = requiredTag?.id || "";
  const requiredTagLabel = requiredTag?.label || "";
  const requiredTagType = requiredTag?.type || "";
  const fixedOrganizerId = fixedOrganizer?.id || "";
  const fixedOrganizerName = fixedOrganizer?.name || "";
  const fixedOrganizerType = fixedOrganizer?.type || "";
  const fixedOrganizerHandle = fixedOrganizer?.handle || "";
  const fixedOrganizerAvatarUrl = fixedOrganizer?.avatarUrl || null;
  const [type, setType] = useState(initialType);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState([]);
  const [mediaEdits, setMediaEdits] = useState([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [event, setEvent] = useState({
    title: "",
    startsAt: "",
    endsAt: "",
    location: "",
    latitude: "",
    longitude: "",
  });
  const [locationResults, setLocationResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const locationRequestRef = useRef(0);
  const [organizer, setOrganizer] = useState(null);
  const [organizerQuery, setOrganizerQuery] = useState("");
  const [organizerResults, setOrganizerResults] = useState([]);
  const [isSearchingOrganizers, setIsSearchingOrganizers] = useState(false);
  const [organizerDefaultResolved, setOrganizerDefaultResolved] = useState(false);
  const organizerRequestRef = useRef(0);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionType, setPollOptionType] = useState("text");
  const [pollSelectionMode, setPollSelectionMode] = useState("single");
  const [pollDurationDays, setPollDurationDays] = useState("7");
  const [options, setOptions] = useState([
    { label: "", value: "" },
    { label: "", value: "" },
  ]);
  const [feeling, setFeeling] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [tagTargets, setTagTargets] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const availableTypes = TYPES.filter((item) => allowedTypes.includes(item.id));
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setBody("");
      setFiles([]);
      setMediaEdits([]);
      setActiveMediaIndex(0);
      setEvent({
        title: "",
        startsAt: "",
        endsAt: "",
        location: "",
        latitude: "",
        longitude: "",
      });
      setLocationResults([]);
      setOrganizer(fixedOrganizerId ? { id: fixedOrganizerId, name: fixedOrganizerName, type: fixedOrganizerType, handle: fixedOrganizerHandle, avatarUrl: fixedOrganizerAvatarUrl } : null); setOrganizerQuery(""); setOrganizerResults([]); setOrganizerDefaultResolved(Boolean(fixedOrganizerId));
      setPollQuestion("");
      setPollOptionType("text");
      setPollSelectionMode("single");
      setPollDurationDays("7");
      setOptions([
        { label: "", value: "" },
        { label: "", value: "" },
      ]);
      setFeeling(null);
      setTagQuery("");
      setSelectedTags(requiredTagId ? [{ id: requiredTagId, label: requiredTagLabel, type: requiredTagType, locked: true }] : []);
      setError("");
    }
  }, [fixedOrganizerAvatarUrl, fixedOrganizerHandle, fixedOrganizerId, fixedOrganizerName, fixedOrganizerType, initialType, isOpen, requiredTagId, requiredTagLabel, requiredTagType]);
  useEffect(() => {
    if (!isOpen) return;
    Promise.allSettled([readKnowledgeHub(), listMarketplaceListings(), allowSpaceTags ? searchPostTagTargets("") : Promise.resolve({ data: [] })])
      .then(([knowledgeResult, marketplaceResult, academicResult]) => {
        const knowledge = knowledgeResult.status === "fulfilled" ? knowledgeResult.value : {};
        const products = marketplaceResult.status === "fulfilled" ? marketplaceResult.value?.data || [] : [];
        const academicTargets = academicResult.status === "fulfilled" ? academicResult.value?.data || [] : [];
        setTagTargets([
          ...(allowSpaceTags ? (knowledge.libraries || []).map((space) => ({ type: "knowledge-library", id: space.id, label: space.name, kind: "Library" })) : []),
          ...(allowSpaceTags ? (knowledge.groups || []).map((space) => ({ type: "knowledge-group", id: space.id, label: space.name, kind: "Group" })) : []),
          ...products.map(mapMarketplaceApiListing).filter(Boolean).map((product) => ({
            type: "product",
            id: product.id,
            label: product.title,
            kind: "Product",
            image: product.image,
            detail: product.price,
          })),
          ...academicTargets,
        ]);
      });
  }, [allowSpaceTags, isOpen]);
  useEffect(() => {
    if (!isOpen || !allowSpaceTags) return undefined;
    const timer = window.setTimeout(() => {
      searchPostTagTargets(tagQuery.trim()).then((response) => {
        const academicTypes = new Set(["university", "course", "unit"]);
        setTagTargets((current) => [...current.filter((target) => !academicTypes.has(target.type)), ...(response.data || [])]);
      }).catch(() => {});
    }, tagQuery.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [allowSpaceTags, isOpen, tagQuery]);
  useEffect(() => {
    const query = event.location.trim();
    if (type !== "event" || event.latitude !== "" || query.length < 3) {
      setLocationResults([]);
      setIsSearchingLocation(false);
      return undefined;
    }
    const requestId = ++locationRequestRef.current;
    setIsSearchingLocation(true);
    const timer = window.setTimeout(() => {
      searchMarketplaceLocations(query)
        .then((response) => {
          if (requestId === locationRequestRef.current)
            setLocationResults(response.results || []);
        })
        .catch(() => {
          if (requestId === locationRequestRef.current) setLocationResults([]);
        })
        .finally(() => {
          if (requestId === locationRequestRef.current)
            setIsSearchingLocation(false);
        });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [event.latitude, event.location, type]);
  useEffect(() => {
    if (!isOpen || type !== "event" || organizer || fixedOrganizerId) return undefined;
    const requestId = ++organizerRequestRef.current; setIsSearchingOrganizers(true);
    const timer = window.setTimeout(() => searchEventOrganizers(organizerQuery.trim()).then((response) => { if (requestId !== organizerRequestRef.current) return; const results = response.data || []; setOrganizerResults(results); if (!organizerQuery.trim() && !organizerDefaultResolved) { setOrganizer(results.find((item) => item.isSelf) || null); setOrganizerDefaultResolved(true) } }).catch(() => { if (requestId === organizerRequestRef.current) setOrganizerResults([]) }).finally(() => { if (requestId === organizerRequestRef.current) setIsSearchingOrganizers(false) }), organizerQuery.trim() ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [fixedOrganizerId, isOpen, organizer, organizerDefaultResolved, organizerQuery, type]);
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setMediaEdits(
      files.map((file, index) => ({
        type: file.type.startsWith("video/") ? "video" : "image",
        zoom: mediaEdits[index]?.zoom || 1,
        positionX: mediaEdits[index]?.positionX ?? 50,
        positionY: mediaEdits[index]?.positionY ?? 50,
        trimStart: mediaEdits[index]?.trimStart || 0,
        trimEnd: mediaEdits[index]?.trimEnd,
        previewUrl: urls[index],
      })),
    );
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);
  if (!isOpen) return null;
  const validPollOptions = options.filter((item) => String(item.value).trim());
  const valid =
    body.trim() &&
    (type !== "media" || files.length) &&
    (type !== "event" ||
      (event.title &&
        event.startsAt &&
        event.location &&
        event.latitude !== "" &&
        event.longitude !== "")) &&
    (type !== "poll" || (pollQuestion && validPollOptions.length >= 2)) &&
    (type !== "feeling" || feeling);
  function selectTagTarget(target) {
    setSelectedTags((current) => ["product", "university", "course", "unit"].includes(target.type)
      ? [...current.filter((item) => item.type !== target.type), target]
      : [...current, target]);
    setTagQuery("");
  }
  async function submit(e) {
    e.preventDefault();
    if (!valid) return;
    setIsPublishing(true);
    setError("");
    try {
      const uploads = await Promise.all(
        files.map((file) =>
          uploadZumbarlFile(file, {
            scope:
              type === "event" ? "connect-event-thumbnail" : "connect-post",
            metadata: { type },
          }),
        ),
      );
      const mediaUrls = uploads.map((item) =>
        normalizeZumbarlFileUrl(item.url || item.previewUrl),
      );
      await onPublish({
        type:
          type === "media"
            ? files.some((file) => file.type.startsWith("video/"))
              ? "video"
              : "image"
            : type,
        body: body.trim(),
        visibility: "campus",
        tags: selectedTags.map(({ type: tagType, id, label }) => ({ type: tagType, id, label })),
        mediaUrls,
        mediaEdits: mediaEdits.map((edit) => ({
          type: edit.type,
          zoom: edit.zoom,
          positionX: edit.positionX,
          positionY: edit.positionY,
          trimStart: edit.trimStart,
          trimEnd: edit.trimEnd,
        })),
        ...(type === "event"
          ? {
              event: {
                ...event,
                latitude: Number(event.latitude),
                longitude: Number(event.longitude),
                thumbnailUrl: mediaUrls[0] || null,
                ...(organizer ? { organizer: { id: organizer.id, type: organizer.type, name: organizer.name, handle: organizer.handle, avatarUrl: organizer.avatarUrl || null } } : {}),
              },
            }
          : {}),
        ...(type === "poll"
          ? {
              poll: {
                question: pollQuestion,
                optionType: pollOptionType,
                selectionMode: pollSelectionMode,
                ...(pollDurationDays !== "never" ? { expiresAt: new Date(Date.now() + Number(pollDurationDays) * 86400000).toISOString() } : {}),
                options: validPollOptions.map((item, index) => ({
                  id: `option-${index + 1}`,
                  label: item.label.trim() || String(item.value),
                  value: String(item.value).trim(),
                })),
              },
            }
          : {}),
        ...(type === "feeling"
          ? { feeling: { emoji: feeling[0], label: feeling[1] } }
          : {}),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Could not publish your post.");
    } finally {
      setIsPublishing(false);
    }
  }
  const activeEdit = mediaEdits[activeMediaIndex];
  const patchEdit = (patch) =>
    setMediaEdits((current) =>
      current.map((item, index) =>
        index === activeMediaIndex ? { ...item, ...patch } : item,
      ),
    );
  const appendFiles = (incoming) => {
    const available = Math.max(0, 8 - files.length);
    const additions = [...incoming].slice(0, available);
    if (!additions.length) return;
    setFiles((current) => [...current, ...additions]);
    setActiveMediaIndex(files.length);
  };
  const removeMedia = (index) => {
    setFiles((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setMediaEdits((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setActiveMediaIndex((current) =>
      Math.max(
        0,
        Math.min(current > index ? current - 1 : current, files.length - 2),
      ),
    );
  };
  const moveMedia = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= files.length) return;
    const reorder = (items) => {
      const next = [...items];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    };
    setFiles(reorder);
    setMediaEdits(reorder);
    setActiveMediaIndex(nextIndex);
  };
  return createPortal((
    <section
      ref={dialogRef}
      className="explore-post-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Create post"
      onClick={onClose}
    >
      <form
        className="explore-post-modal"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <span>{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onClose}>
            <FiX />
          </button>
        </header>
        {identity ? <div className="explore-post-identity"><img src={normalizeZumbarlFileUrl(identity.avatarUrl) || "/assets/knowledge/default-group-avatar.svg"} alt="" /><span><small>Posting as</small><strong>{identity.name}</strong></span></div> : null}
        <nav>
          {availableTypes.map((item) => (
            <button
              type="button"
              key={item.id}
              className={type === item.id ? "is-active" : ""}
              onClick={() => setType(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="explore-post-fields">
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
          />
          <section className="explore-post-tag-picker">
            <label><FiTag /> {allowSpaceTags ? "Tag a university, course, unit, space or product" : "Tag a product"}</label>
            <div className="explore-post-tag-search"><FiSearch /><input type="search" value={tagQuery} onChange={(event) => setTagQuery(event.target.value)} placeholder={allowSpaceTags ? "Search universities, courses, units, spaces and products" : "Search marketplace products"} /></div>
            {selectedTags.length ? <div className="explore-post-selected-tags">{selectedTags.map((tag) => tag.locked
              ? <span className="is-required" key={`${tag.type}-${tag.id}`}><FiCheck /> {tag.label}<small>Tagged automatically</small></span>
              : <button type="button" className={tag.type === "product" ? "is-product" : ""} key={`${tag.type}-${tag.id}`} onClick={() => setSelectedTags((current) => current.filter((item) => item.type !== tag.type || item.id !== tag.id))}>{tag.type === "product" ? <FiShoppingBag /> : ["course", "unit"].includes(tag.type) ? <FiBookOpen /> : tag.type === "university" ? <FiMapPin /> : null}{tag.label} <FiX /></button>)}</div> : null}
            {tagQuery.trim() ? <div className="explore-post-tag-results">{tagTargets.filter((target) => `${target.label} ${target.kind}`.toLowerCase().includes(tagQuery.trim().toLowerCase()) && !selectedTags.some((tag) => tag.type === target.type && tag.id === target.id)).slice(0, 10).map((target) => <button type="button" className={target.type === "product" ? "is-product" : ""} key={`${target.type}-${target.id}`} onClick={() => selectTagTarget(target)}>{target.image ? <img src={target.image} alt="" /> : target.type === "product" ? <FiShoppingBag className="explore-post-tag-result-icon" /> : ["course", "unit"].includes(target.type) ? <FiBookOpen className="explore-post-tag-result-icon" /> : target.type === "university" ? <FiMapPin className="explore-post-tag-result-icon" /> : null}<span><strong>{target.label}</strong><small>{target.kind}{target.detail ? ` · ${target.detail}` : ""}</small></span><FiPlus /></button>)}</div> : null}
            <small>{allowSpaceTags ? "Academic and space tags make related posts discoverable. Space followers also see tagged posts first; product tags open the marketplace item." : "This publishes as the library or group profile. A product tag is optional."}</small>
          </section>
          {type === "media" ? (
            <>
              <label className={`explore-post-upload explore-event-thumbnail-upload${activeEdit ? " has-preview" : ""}`}>
                <FiUploadCloud />
                <span>
                  {files.length
                    ? `${files.length} of 8 selected · Add more`
                    : "Choose photos or videos"}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  disabled={files.length >= 8}
                  onChange={(e) => {
                    appendFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {activeEdit ? (
                <section className="explore-post-media-editor">
                  <div className="explore-post-media-stage">
                    {activeEdit.type === "video" ? (
                      <video src={activeEdit.previewUrl} controls />
                    ) : (
                      <img
                        src={activeEdit.previewUrl}
                        alt="Post preview"
                        style={{
                          objectPosition: `${activeEdit.positionX}% ${activeEdit.positionY}%`,
                          transform: `scale(${activeEdit.zoom})`,
                        }}
                      />
                    )}
                  </div>
                  <div className="explore-post-media-thumbs">
                    {mediaEdits.map((edit, index) => (
                      <article
                        key={edit.previewUrl}
                        className={
                          index === activeMediaIndex ? "is-active" : ""
                        }
                      >
                        <button
                          type="button"
                          className="explore-post-thumb-preview"
                          onClick={() => setActiveMediaIndex(index)}
                        >
                          {edit.type === "video" ? (
                            <video src={edit.previewUrl} />
                          ) : (
                            <img src={edit.previewUrl} alt="" />
                          )}
                          <span>{index + 1}</span>
                        </button>
                        <div>
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveMedia(index, -1)}
                            aria-label="Move media left"
                          >
                            <FiArrowLeft />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            aria-label="Remove media"
                          >
                            <FiTrash2 />
                          </button>
                          <button
                            type="button"
                            disabled={index === mediaEdits.length - 1}
                            onClick={() => moveMedia(index, 1)}
                            aria-label="Move media right"
                          >
                            <FiArrowRight />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                  {activeEdit.type === "image" ? (
                    <div className="explore-post-edit-controls">
                      <label>
                        Zoom
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step=".05"
                          value={activeEdit.zoom}
                          onChange={(e) =>
                            patchEdit({ zoom: Number(e.target.value) })
                          }
                        />
                      </label>
                      <label>
                        Horizontal position
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={activeEdit.positionX}
                          onChange={(e) =>
                            patchEdit({ positionX: Number(e.target.value) })
                          }
                        />
                      </label>
                      <label>
                        Vertical position
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={activeEdit.positionY}
                          onChange={(e) =>
                            patchEdit({ positionY: Number(e.target.value) })
                          }
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="explore-post-edit-controls">
                      <label>
                        Start at (seconds)
                        <input
                          type="number"
                          min="0"
                          step=".1"
                          value={activeEdit.trimStart || 0}
                          onChange={(e) =>
                            patchEdit({ trimStart: Number(e.target.value) })
                          }
                        />
                      </label>
                      <label>
                        End at (seconds)
                        <input
                          type="number"
                          min=".1"
                          step=".1"
                          value={activeEdit.trimEnd || ""}
                          onChange={(e) =>
                            patchEdit({
                              trimEnd: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </label>
                    </div>
                  )}
                </section>
              ) : null}
            </>
          ) : null}
          {type === "event" ? (
            <section>
              <label className="explore-post-upload">
                <FiImage />
                <span>
                  {files.length
                    ? "Replace event thumbnail"
                    : "Add event thumbnail"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) {
                      setFiles([selected]);
                      setActiveMediaIndex(0);
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              {activeEdit ? (
                <div className="explore-event-thumbnail-editor">
                  <div className="explore-post-media-stage">
                    <img
                      src={activeEdit.previewUrl}
                      alt="Event thumbnail preview"
                      style={{
                        objectPosition: `${activeEdit.positionX}% ${activeEdit.positionY}%`,
                        transform: `scale(${activeEdit.zoom})`,
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="explore-event-thumbnail-remove"
                    onClick={() => removeMedia(0)}
                  >
                    <FiTrash2 /> Remove thumbnail
                  </button>
                  <div className="explore-post-edit-controls">
                    <label>
                      Zoom
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step=".05"
                        value={activeEdit.zoom}
                        onChange={(e) =>
                          patchEdit({ zoom: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      Horizontal position
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeEdit.positionX}
                        onChange={(e) =>
                          patchEdit({ positionX: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      Vertical position
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeEdit.positionY}
                        onChange={(e) =>
                          patchEdit({ positionY: Number(e.target.value) })
                        }
                      />
                    </label>
                  </div>
                </div>
              ) : null}
              <label>
                Event name
                <input
                  value={event.title}
                  onChange={(e) =>
                    setEvent({ ...event, title: e.target.value })
                  }
                />
              </label>
              <label>
                Starts
                <input
                  type="datetime-local"
                  value={event.startsAt}
                  onChange={(e) =>
                    setEvent({ ...event, startsAt: e.target.value })
                  }
                />
              </label>
              <label>
                Ends
                <input
                  type="datetime-local"
                  value={event.endsAt}
                  onChange={(e) =>
                    setEvent({ ...event, endsAt: e.target.value })
                  }
                />
              </label>
              <div className="explore-event-location explore-event-location-field">
                <label>
                  Location
                  <div className={`explore-event-location-input${event.latitude !== "" ? " is-selected" : ""}`}>
                    <FiSearch />
                    <input role="combobox" aria-expanded={Boolean(locationResults.length)} value={event.location} placeholder="Search a campus, venue or landmark" onChange={(e) => setEvent({ ...event, location: e.target.value, latitude: "", longitude: "" })} />
                    {isSearchingLocation ? <span>Searching…</span> : event.latitude !== "" ? <FiCheck /> : null}
                  </div>
                </label>
                {locationResults.length ? <div className="explore-event-location-results" role="listbox">{locationResults.map((result) => <button key={result.id} type="button" role="option" onClick={() => { setEvent({ ...event, location: result.label, latitude: result.latitude, longitude: result.longitude }); setLocationResults([]) }}><FiMapPin /><span><strong>{result.label.split(",")[0]}</strong><small>{result.label}</small></span></button>)}</div> : null}
                <small>{event.latitude !== "" ? "Exact pin selected." : "Select a search result to attach an exact map pin."}</small>
              </div>
              {fixedOrganizerId ? <div className="explore-event-organizer-field">
                <label>Organizer<div className="explore-event-organizer-input is-selected"><div className="explore-event-organizer-selected"><img src={fixedOrganizerAvatarUrl || "/assets/index/bee_nobg.png"} alt="" /><span><strong>{fixedOrganizerName}</strong><small>{fixedOrganizerHandle || 'Support circle'}</small></span></div></div></label>
                <small>This event is published under the circle’s identity.</small>
              </div> : <div className="explore-event-organizer-field">
                <label>Organizer<div className={`explore-event-organizer-input${organizer ? " is-selected" : ""}`}><FiSearch />{organizer ? <div className="explore-event-organizer-selected"><img src={organizer.avatarUrl || "/assets/index/bee_nobg.png"} alt="" /><span><strong>{organizer.name}</strong><small>{organizer.handle || organizer.type}</small></span><button type="button" onClick={() => { setOrganizerDefaultResolved(true); setOrganizer(null); setOrganizerQuery(""); setOrganizerResults([]) }} aria-label="Change organizer"><FiX /></button></div> : <input autoFocus value={organizerQuery} onChange={(e) => setOrganizerQuery(e.target.value)} placeholder="Search people, businesses or campus entities" />}{isSearchingOrganizers && !organizer ? <span>Searching…</span> : null}</div></label>
                {!organizer && organizerResults.length ? <div className="explore-event-organizer-results">{organizerResults.map((result) => <button type="button" key={`${result.type}-${result.id}`} onClick={() => { setOrganizer(result); setOrganizerResults([]) }}><img src={result.avatarUrl || "/assets/index/bee_nobg.png"} alt="" /><span><strong>{result.name}{result.isSelf ? " (You)" : ""}</strong><small>{result.handle || result.type}</small></span></button>)}</div> : null}
                <small>{organizer ? `This event will show ${organizer.name} as organizer.` : "You are the organizer by default."}</small>
              </div>}
            </section>
          ) : null}
          {type === "poll" ? (
            <section>
              <label>
                Question
                <input
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                />
              </label>
              <div className="explore-poll-settings">
                <label>Answer type<select value={pollOptionType} onChange={(e) => { setPollOptionType(e.target.value); setOptions([{ label: "", value: "" }, { label: "", value: "" }]) }}><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="time">Time</option></select></label>
                <label>People can choose<select value={pollSelectionMode} onChange={(e) => setPollSelectionMode(e.target.value)}><option value="single">One option</option><option value="multiple">Multiple options</option></select></label>
                <label>Poll duration<select value={pollDurationDays} onChange={(e) => setPollDurationDays(e.target.value)}><option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="never">No closing date</option></select></label>
              </div>
              {options.map((option, index) => (
                <div className="explore-poll-option" key={index}>
                  <label>Option {index + 1}<input type={pollOptionType} value={option.value} onChange={(e) => setOptions(options.map((item, i) => i === index ? { label: e.target.value, value: e.target.value } : item))} /></label>
                  {options.length > 2 ? <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== index))} aria-label={`Remove option ${index + 1}`}><FiTrash2 /></button> : null}
                </div>
              ))}
              {options.length < 6 ? (
                <button
                  type="button"
                  onClick={() => setOptions([...options, { label: "", value: "" }])}
                >
                  <FiPlus /> Add option
                </button>
              ) : null}
            </section>
          ) : null}
          {type === "feeling" ? (
            <section className="explore-post-feelings">
              {FEELINGS.map((item) => (
                <button
                  type="button"
                  key={item[1]}
                  className={feeling?.[1] === item[1] ? "is-active" : ""}
                  onClick={() => setFeeling(item)}
                >
                  {item[0]} {item[1]}
                </button>
              ))}
            </section>
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={!valid || isPublishing}>
            {isPublishing ? "Posting…" : publishLabel}
          </button>
        </footer>
      </form>
    </section>
  ), document.body);
}
export default ExplorePostComposer;
