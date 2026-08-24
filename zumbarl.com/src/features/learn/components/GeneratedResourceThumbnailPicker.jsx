import { useEffect, useMemo } from "react";
import { FiCheck, FiImage, FiRefreshCw, FiUploadCloud, FiX } from "react-icons/fi";
import "./GeneratedResourceThumbnailPicker.css";

const pendingRevocations = new Map();
const fileUrls = new WeakMap();

function previewUrlFor(file) {
  if (!file) return "";
  const existing = fileUrls.get(file);
  if (existing) return existing;
  const created = URL.createObjectURL(file);
  fileUrls.set(file, created);
  return created;
}

function GeneratedResourceThumbnailPicker({ customFile, generatedFile, generationStatus = "idle", onChange, disabled = false }) {
  const activeFile = customFile || generatedFile;
  const previewUrl = useMemo(() => previewUrlFor(activeFile), [activeFile]);
  useEffect(() => {
    if (!activeFile || !previewUrl) return undefined;
    const pending = pendingRevocations.get(previewUrl);
    if (pending) {
      window.clearTimeout(pending);
      pendingRevocations.delete(previewUrl);
    }
    return () => {
      const timer = window.setTimeout(() => {
        URL.revokeObjectURL(previewUrl);
        if (fileUrls.get(activeFile) === previewUrl) fileUrls.delete(activeFile);
        pendingRevocations.delete(previewUrl);
      }, 0);
      pendingRevocations.set(previewUrl, timer);
    };
  }, [activeFile, previewUrl]);

  const title = customFile
    ? "Custom thumbnail"
    : generatedFile
      ? "Thumbnail generated automatically"
      : generationStatus === "loading"
        ? "Generating thumbnail…"
        : "Add a thumbnail";
  const detail = customFile
    ? customFile.name
    : generatedFile
      ? "Created from the first clear page or frame. You can replace it."
      : generationStatus === "default"
        ? "No clear preview was found, so the resource-type default will be used."
        : "A preview will be generated from supported uploads; otherwise a type default is used.";

  return <section className={`knowledge-generated-thumbnail${activeFile ? " has-preview" : ""}${generationStatus === "loading" ? " is-loading" : ""}`}>
    <label>
      {previewUrl ? <img src={previewUrl} alt="Resource thumbnail preview" /> : generationStatus === "loading" ? <FiRefreshCw /> : <FiImage />}
      <span><strong>{title}</strong><small>{detail}</small></span>
      <em>{customFile ? <><FiCheck /> Selected</> : <><FiUploadCloud /> {activeFile ? "Replace" : "Choose"}</>}</em>
      <input type="file" accept="image/*" disabled={disabled} onChange={(event) => { onChange(event.target.files?.[0] || null); event.target.value = ""; }} />
    </label>
    {customFile ? <button type="button" onClick={() => onChange(null)} disabled={disabled}><FiX /> Use generated thumbnail</button> : null}
  </section>;
}

export default GeneratedResourceThumbnailPicker;
