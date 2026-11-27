import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import {
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  Clock3,
  AlertCircle,
  FolderOpen,
  X,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type DocumentStatus =
  | "Processed"
  | "Processing"
  | "Pending"
  | "Failed";

interface PatentOption {
  _id: string;
  title: string;
  status?: string;
}

interface DocumentItem {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: string;
  sizeBytes: number;
  status: DocumentStatus;
  uploadedAt: string;
  documentType: string;
  patentId?: PatentOption | null;
  validationMessage?: string;
  adminReviewStatus?: string;
  adminReviewComment?: string;
  adminReviewedAt?: string;
}

/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".doc",
  ".docx",
  ".webp",
  ".txt",
];

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
];

/*
 * ============================================================
 * MAIN PAGE
 * ============================================================
 */

export function Documents() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [documents, setDocuments] =
    useState<DocumentItem[]>([]);

  const [patents, setPatents] =
    useState<PatentOption[]>([]);

  const [selectedFiles, setSelectedFiles] =
    useState<File[]>([]);

  const [dragActive, setDragActive] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [documentType, setDocumentType] =
    useState("Other");

  const [patentId, setPatentId] =
    useState("");

  /*
   * ==========================================================
   * LOAD DATA
   * ==========================================================
   */

  const loadData = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [
        documentsResponse,
        patentsResponse,
      ] = await Promise.all([
        api.get("/documents"),
        api.get("/patents"),
      ]);

      const serverDocuments =
        Array.isArray(
          documentsResponse.data?.documents
        )
          ? documentsResponse.data.documents
          : [];

      const serverPatents =
        Array.isArray(
          patentsResponse.data?.patents
        )
          ? patentsResponse.data.patents
          : [];

      setDocuments(
        serverDocuments.map(
          (document: any) =>
            mapServerDocument(document)
        )
      );

      setPatents(
        serverPatents
      );
    } catch (err: any) {
      console.error(
        "Documents load error:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to load documents."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
   * ==========================================================
   * FILE HANDLING
   * ==========================================================
   */

  const handleFiles = (
    files: FileList | File[]
  ) => {
    const incomingFiles =
      Array.from(files);

    if (
      incomingFiles.length === 0
    ) {
      return;
    }

    setError("");
    setSuccess("");

    const validFiles: File[] = [];
    const invalidMessages: string[] =
      [];

    incomingFiles.forEach(
      (file) => {
        const extension =
          getFileExtension(
            file.name
          );

        const validExtension =
          ACCEPTED_EXTENSIONS.includes(
            extension
          );

        const validMime =
          ACCEPTED_MIME_TYPES.includes(
            file.type
          );

        /*
         * Accept either a valid extension OR valid MIME type.
         *
         * This is important because some browsers do not
         * reliably provide MIME types for every file.
         */

        if (
          !validExtension &&
          !validMime
        ) {
          invalidMessages.push(
            `${file.name}: unsupported file type`
          );

          return;
        }

        if (
          file.size >
          MAX_FILE_SIZE
        ) {
          invalidMessages.push(
            `${file.name}: maximum file size is 10 MB`
          );

          return;
        }

        if (file.size === 0) {
          invalidMessages.push(
            `${file.name}: empty files are not allowed`
          );

          return;
        }

        validFiles.push(file);
      }
    );

    if (
      invalidMessages.length > 0
    ) {
      setError(
        invalidMessages.join(
          " | "
        )
      );
    }

    if (
      validFiles.length > 0
    ) {
      setSelectedFiles(
        (current) => {
          const existingKeys =
            new Set(
              current.map(
                (file) =>
                  `${file.name}-${file.size}-${file.lastModified}`
              )
            );

          const newFiles =
            validFiles.filter(
              (file) =>
                !existingKeys.has(
                  `${file.name}-${file.size}-${file.lastModified}`
                )
            );

          return [
            ...current,
            ...newFiles,
          ];
        }
      );
    }

    /*
     * Allow selecting the same file again.
     */

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  };

  /*
   * ==========================================================
   * INPUT CHANGE
   * ==========================================================
   */

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    handleFiles(
      event.target.files || []
    );
  };

  /*
   * ==========================================================
   * DRAG HANDLERS
   * ==========================================================
   */

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDragEnter = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    handleFiles(
      event.dataTransfer.files
    );
  };

  /*
   * ==========================================================
   * REMOVE SELECTED FILE
   * ==========================================================
   */

  const removeSelectedFile = (
    index: number
  ) => {
    if (uploading) {
      return;
    }

    setSelectedFiles(
      (current) =>
        current.filter(
          (_, fileIndex) =>
            fileIndex !== index
        )
    );
  };

  /*
   * ==========================================================
   * UPLOAD DOCUMENTS
   * ==========================================================
   */

  const uploadDocuments = async () => {
    if (
      selectedFiles.length === 0
    ) {
      setError(
        "Please select at least one document."
      );

      return;
    }

    if (uploading) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      let uploadedCount = 0;
      const failedFiles: string[] = [];

      /*
       * Backend accepts one file per request.
       *
       * Therefore upload each selected file separately.
       */

      for (
        const file of selectedFiles
      ) {
        try {
          const formData =
            new FormData();

          const extension =
            getFileExtension(
              file.name
            );

          const nameWithoutExtension =
            file.name.endsWith(
              extension
            )
              ? file.name.slice(
                  0,
                  file.name.length -
                    extension.length
                )
              : file.name;

          formData.append(
            "document",
            file
          );

          formData.append(
            "name",
            nameWithoutExtension
          );

          formData.append(
            "documentType",
            documentType
          );

          if (patentId) {
            formData.append(
              "patentId",
              patentId
            );
          }

          await api.post(
            "/documents",
            formData
          );

          uploadedCount++;
        } catch (fileError: any) {
          console.error(
            `Upload failed for ${file.name}:`,
            fileError
          );

          failedFiles.push(
            `${file.name}: ${getApiErrorMessage(
              fileError,
              "Upload failed"
            )}`
          );
        }
      }

      /*
       * ======================================================
       * RESULT MESSAGE
       * ======================================================
       */

      if (
        uploadedCount > 0 &&
        failedFiles.length === 0
      ) {
        setSuccess(
          uploadedCount === 1
            ? "Document uploaded successfully."
            : `${uploadedCount} documents uploaded successfully.`
        );

        setSelectedFiles([]);
        setDocumentType("Other");
        setPatentId("");
      } else if (
        uploadedCount > 0 &&
        failedFiles.length > 0
      ) {
        setSuccess(
          `${uploadedCount} document${
            uploadedCount !== 1
              ? "s"
              : ""
          } uploaded successfully.`
        );

        setError(
          `Some files could not be uploaded: ${failedFiles.join(
            " | "
          )}`
        );

        /*
         * Keep failed files available for retry.
         *
         * Since the backend does not return the file
         * identifier for each failed upload, reload the
         * successfully uploaded documents and clear the
         * local selection after partial success.
         */

        setSelectedFiles([]);
      } else {
        setError(
          failedFiles.length > 0
            ? failedFiles.join(
                " | "
              )
            : "Unable to upload documents."
        );
      }

      await loadData(false);
    } catch (err: any) {
      console.error(
        "Document upload error:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to upload document."
        )
      );

      await loadData(false);
    } finally {
      setUploading(false);
    }
  };

  /*
   * ==========================================================
   * VIEW DOCUMENT
   * ==========================================================
   */

  const openDocument = async (
    document: DocumentItem
  ) => {
    try {
      setError("");

      const response =
        await api.get(
          `/documents/${document.id}/download`,
          {
            responseType: "blob",
          }
        );

      const blob =
        new Blob(
          [response.data],
          {
            type:
              document.type ||
              "application/octet-stream",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const newWindow =
        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );

      /*
       * If popup blocking prevents opening,
       * show a useful message.
       */

      if (!newWindow) {
        URL.revokeObjectURL(url);

        setError(
          "Unable to open the document. Please allow pop-ups for this application."
        );

        return;
      }

      /*
       * Give the browser enough time to load
       * the blob before revoking it.
       */

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (err: any) {
      console.error(
        "Open document error:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to open document."
        )
      );
    }
  };

  /*
   * ==========================================================
   * DOWNLOAD DOCUMENT
   * ==========================================================
   */

  const downloadDocument = async (
    document: DocumentItem
  ) => {
    try {
      setError("");

      const response =
        await api.get(
          `/documents/${document.id}/download`,
          {
            responseType: "blob",
          }
        );

      const blob =
        new Blob(
          [response.data],
          {
            type:
              document.type ||
              "application/octet-stream",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        window.document.createElement(
          "a"
        );

      anchor.href = url;

      anchor.download =
        document.originalName ||
        document.name ||
        "document";

      window.document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err: any) {
      console.error(
        "Download document error:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to download document."
        )
      );
    }
  };

  /*
   * ==========================================================
   * DELETE DOCUMENT
   * ==========================================================
   */

  const removeDocument = async (
    id: string
  ) => {
    const document =
      documents.find(
        (item) =>
          item.id === id
      );

    if (!document) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${document.originalName}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      await api.delete(
        `/documents/${id}`
      );

      setDocuments(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id
          )
      );

      setSuccess(
        "Document deleted successfully."
      );
    } catch (err: any) {
      console.error(
        "Delete document error:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to delete document."
        )
      );
    } finally {
      setDeletingId("");
    }
  };

  /*
   * ==========================================================
   * SUMMARY COUNTS
   * ==========================================================
   */

  const processedCount =
    documents.filter(
      (document) =>
        document.status ===
        "Processed"
    ).length;

  const processingCount =
    documents.filter(
      (document) =>
        document.status ===
          "Processing" ||
        document.status ===
          "Pending"
    ).length;

  const failedCount =
    documents.filter(
      (document) =>
        document.status ===
        "Failed"
    ).length;

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="space-y-6">

      {/* =====================================================
          PAGE HEADER
         ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-brand">
            <FolderOpen size={18} />
            Inhouse Patent Filing System · Documents
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Documents
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Upload, organize and manage documents
            related to your intellectual property
            applications.
          </p>

        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={() =>
              loadData(false)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-95"
          >
            <Upload size={18} />
            Upload Document
          </button>

        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={
            handleInputChange
          }
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.webp,.txt"
        />

      </div>

      {/* =====================================================
          MESSAGES
         ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">

          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span className="break-words">
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="ml-auto shrink-0 rounded-md p-1 hover:bg-red-100"
            title="Dismiss"
          >
            <X size={16} />
          </button>

        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">

          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
            className="ml-auto shrink-0 rounded-md p-1 hover:bg-emerald-100"
            title="Dismiss"
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* =====================================================
          SELECTED FILES
         ===================================================== */}

      {selectedFiles.length > 0 && (
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-5">

            <div>
              <h2 className="text-lg font-extrabold text-brand">
                Selected Documents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review the files before uploading them.
              </p>
            </div>

            <div className="space-y-2">

              {selectedFiles.map(
                (file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-brand">

                        {getFileIcon(
                          file.type,
                          file.name
                        )}

                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-bold text-slate-800">
                          {file.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatFileSize(
                            file.size
                          )}
                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeSelectedFile(
                          index
                        )
                      }
                      disabled={
                        uploading
                      }
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Remove selected file"
                    >
                      <X size={16} />
                    </button>

                  </div>
                )
              )}

            </div>

            {/* =================================================
                DOCUMENT TYPE + PATENT
               ================================================= */}

            <div className="grid gap-4 md:grid-cols-2">

              <div>

                <label
                  htmlFor="document-type"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Document Type
                </label>

                <select
                  id="document-type"
                  value={
                    documentType
                  }
                  onChange={(event) =>
                    setDocumentType(
                      event.target.value
                    )
                  }
                  className="field w-full"
                  disabled={
                    uploading
                  }
                >

                  <option value="Other">
                    Other
                  </option>

                  <option value="Specification">
                    Specification
                  </option>

                  <option value="Drawing">
                    Drawing
                  </option>

                  <option value="Supporting Document">
                    Supporting Document
                  </option>

                  <option value="PDF">
                    PDF
                  </option>

                  <option value="Image">
                    Image
                  </option>

                </select>

              </div>

              <div>

                <label
                  htmlFor="document-patent"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Attach to Patent
                </label>

                <select
                  id="document-patent"
                  value={patentId}
                  onChange={(event) =>
                    setPatentId(
                      event.target.value
                    )
                  }
                  className="field w-full"
                  disabled={
                    uploading
                  }
                >

                  <option value="">
                    No patent selected
                  </option>

                  {patents.map(
                    (patent) => (
                      <option
                        key={
                          patent._id
                        }
                        value={
                          patent._id
                        }
                      >
                        {patent.title}
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>

            {/* =================================================
                UPLOAD ACTIONS
               ================================================= */}

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={
                  uploadDocuments
                }
                disabled={
                  uploading
                }
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {uploading ? (
                  <Clock3
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Upload size={17} />
                )}

                {uploading
                  ? "Uploading..."
                  : "Upload Selected"}

              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedFiles([])
                }
                disabled={
                  uploading
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Clear Selection
              </button>

            </div>

          </div>

        </section>
      )}

      {/* =====================================================
          SUMMARY
         ===================================================== */}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">

        <SummaryCard
          label="Total Documents"
          value={
            documents.length
          }
          description="Uploaded documents"
          icon={
            <FileText size={20} />
          }
        />

        <SummaryCard
          label="Processed"
          value={
            processedCount
          }
          description="Validated and ready"
          icon={
            <CheckCircle2
              size={20}
            />
          }
        />

        <SummaryCard
          label="Processing"
          value={
            processingCount
          }
          description="Awaiting processing"
          icon={
            <Clock3 size={20} />
          }
        />

        <SummaryCard
          label="Failed"
          value={failedCount}
          description="Validation failed"
          icon={
            <AlertCircle
              size={20}
            />
          }
        />

      </div>

      {/* =====================================================
          UPLOAD AREA
         ===================================================== */}

      <section
        onDrop={handleDrop}
        onDragOver={
          handleDragOver
        }
        onDragEnter={
          handleDragEnter
        }
        onDragLeave={
          handleDragLeave
        }
        className={`rounded-3xl border-2 border-dashed p-8 transition sm:p-10 ${
          dragActive
            ? "border-brand bg-brand-50"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >

        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">

          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand">
            <Upload size={28} />
          </div>

          <h2 className="mt-5 text-xl font-extrabold text-slate-900">
            Upload your patent documents
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Drag and drop your files here, or choose
            files from your computer.
          </p>

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-brand shadow-sm transition hover:bg-slate-50"
          >
            Choose Files
          </button>

          <p className="mt-4 text-xs text-slate-500">
            Supported: PDF, PNG, JPG, JPEG, WEBP,
            DOC, DOCX and TXT · Maximum 10 MB per file
          </p>

        </div>

      </section>

      {/* =====================================================
          DOCUMENT LIST
         ===================================================== */}

      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">

        <div className="flex flex-col gap-3 border-b border-line px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-xl font-extrabold text-slate-900">
              My Documents
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Documents uploaded for your patent applications.
            </p>

          </div>

          {documents.length > 0 && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
              {documents.length} document
              {documents.length !== 1
                ? "s"
                : ""}
            </div>
          )}

        </div>

        {loading ? (

          <div className="px-6 py-14 text-center">

            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-500">

              <Clock3
                size={25}
                className="animate-pulse"
              />

            </div>

            <h3 className="mt-4 text-base font-bold text-slate-800">
              Loading documents...
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Fetching your uploaded documents.
            </p>

          </div>

        ) : documents.length === 0 ? (

          <div className="px-6 py-14 text-center">

            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-500">

              <FileText size={25} />

            </div>

            <h3 className="mt-4 text-base font-bold text-slate-800">
              No documents yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Upload drawings, specifications, PDFs
              or other supporting documents to start
              building your patent application file.
            </p>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-5 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-95"
            >
              Upload Your First Document
            </button>

          </div>

        ) : (

          <div className="divide-y divide-line">

            {documents.map(
              (document) => (
                <DocumentRow
                  key={
                    document.id
                  }
                  document={
                    document
                  }
                  deleting={
                    deletingId ===
                    document.id
                  }
                  onOpen={
                    openDocument
                  }
                  onDownload={
                    downloadDocument
                  }
                  onDelete={
                    removeDocument
                  }
                />
              )
            )}

          </div>

        )}

      </section>

      {/* =====================================================
          PROCESSING INFORMATION
         ===================================================== */}

      <section className="rounded-3xl border border-brand-100 bg-brand-50/60 p-6">

        <div className="flex gap-4">

          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm">

            <AlertCircle size={20} />

          </div>

          <div>

            <h3 className="font-bold text-slate-900">
              Document processing
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Uploaded documents are validated for
              supported file types, file size and
              basic file signatures before they are
              stored. Validated documents can be
              viewed, downloaded and attached to
              patent applications.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

/*
 * ============================================================
 * DOCUMENT ROW
 * ============================================================
 */

interface DocumentRowProps {
  document: DocumentItem;
  deleting: boolean;

  onOpen: (
    document: DocumentItem
  ) => void;

  onDownload: (
    document: DocumentItem
  ) => void;

  onDelete: (
    id: string
  ) => void;
}

function DocumentRow({
  document,
  deleting,
  onOpen,
  onDownload,
  onDelete,
}: DocumentRowProps) {
  return (
    <div className="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50/70 lg:flex-row lg:items-center lg:justify-between">

      <div className="flex min-w-0 items-center gap-4">

        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">

          {getFileIcon(
            document.type,
            document.originalName
          )}

        </div>

        <div className="min-w-0">

          <p
            className="truncate text-sm font-bold text-slate-900"
            title={
              document.name
            }
          >
            {document.name}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {document.originalName}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">

            <span>
              {document.size}
            </span>

            <span>•</span>

            <span>
              {document.documentType}
            </span>

            <span>•</span>

            <span>
              Uploaded{" "}
              {
                document.uploadedAt
              }
            </span>

          </div>

          {document.patentId && (
            <div className="mt-2 text-xs font-semibold text-brand">
              Patent:{" "}
              {
                document
                  .patentId
                  .title
              }
            </div>
          )}

          {document.validationMessage && (
            <p className="mt-2 text-xs text-slate-500">
              {
                document.validationMessage
              }
            </p>
          )}

          {document.adminReviewStatus &&
            document.adminReviewStatus !== "Pending" && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
                  Administrator Review:{" "}
                  {document.adminReviewStatus}
                </div>

                {document.adminReviewComment && (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                    {document.adminReviewComment}
                  </p>
                )}

                {document.adminReviewedAt && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-700">
                    Reviewed{" "}
                    {document.adminReviewedAt}
                  </p>
                )}
              </div>
            )}

        </div>

      </div>

      <div className="flex flex-wrap items-center gap-3">

        <StatusBadge
          status={
            document.status
          }
        />

        <button
          type="button"
          onClick={() =>
            onOpen(document)
          }
          disabled={
            deleting ||
            document.status !==
              "Processed"
          }
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          title="View document"
        >
          <Eye size={15} />
          View
        </button>

        <button
          type="button"
          onClick={() =>
            onDownload(document)
          }
          disabled={
            deleting ||
            document.status !==
              "Processed"
          }
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          title="Download document"
        >
          <Download size={16} />
        </button>

        <button
          type="button"
          onClick={() =>
            onDelete(
              document.id
            )
          }
          disabled={deleting}
          className="grid h-9 w-9 place-items-center rounded-lg border border-red-100 bg-white text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          title="Delete document"
        >
          {deleting ? (
            <Clock3
              size={16}
              className="animate-pulse"
            />
          ) : (
            <Trash2
              size={16}
            />
          )}
        </button>

      </div>

    </div>
  );
}

/*
 * ============================================================
 * STATUS BADGE
 * ============================================================
 */

function StatusBadge({
  status,
}: {
  status: DocumentStatus;
}) {
  if (
    status ===
    "Processed"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">

        <CheckCircle2
          size={13}
        />

        Processed

      </span>
    );
  }

  if (
    status ===
      "Processing" ||
    status === "Pending"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">

        <Clock3 size={13} />

        {status}

      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">

      <AlertCircle
        size={13}
      />

      Failed

    </span>
  );
}

/*
 * ============================================================
 * SUMMARY CARD
 * ============================================================
 */

interface SummaryCardProps {
  label: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}

function SummaryCard({
  label,
  value,
  description,
  icon,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-semibold text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>

        </div>

        <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-50 text-brand">
          {icon}
        </div>

      </div>

    </div>
  );
}

/*
 * ============================================================
 * FILE ICON
 * ============================================================
 */

function getFileIcon(
  type: string,
  fileName?: string
) {
  const extension =
    getFileExtension(
      fileName || ""
    );

  if (
    type.startsWith(
      "image/"
    ) ||
    [
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
    ].includes(extension)
  ) {
    return (
      <ImageIcon
        size={22}
      />
    );
  }

  if (
    type ===
      "application/pdf" ||
    extension === ".pdf"
  ) {
    return (
      <FileText
        size={22}
      />
    );
  }

  return (
    <File size={22} />
  );
}

/*
 * ============================================================
 * MAP SERVER DOCUMENT
 * ============================================================
 */

function mapServerDocument(
  document: any
): DocumentItem {
  const id =
    document?._id ||
    document?.id ||
    "";

  return {
    id,

    name:
      document?.name ||
      document?.originalName ||
      "Untitled Document",

    originalName:
      document?.originalName ||
      document?.name ||
      "Document",

    type:
      document?.mimeType ||
      guessMimeType(
        document?.extension
      ),

    size:
      formatFileSize(
        Number(
          document?.size || 0
        )
      ),

    sizeBytes:
      Number(
        document?.size || 0
      ),

    status:
      mapServerStatus(
        document?.status
      ),

    uploadedAt:
      formatDate(
        document?.createdAt
      ),

    documentType:
      document?.documentType ||
      "Other",

    patentId:
      document?.patentId ||
      null,

    validationMessage:
      document?.validationMessage ||
      "",

    adminReviewStatus:
      document?.adminReviewStatus ||
      "Pending",

    adminReviewComment:
      document?.adminReviewComment ||
      "",

    adminReviewedAt:
      document?.adminReviewedAt ||
      "",
  };
}

/*
 * ============================================================
 * SERVER STATUS MAPPING
 * ============================================================
 */

function mapServerStatus(
  status?: string
): DocumentStatus {
  switch (status) {
    case "Validated":
    case "Generated":
    case "Available":
      return "Processed";

    case "Processing":
      return "Processing";

    case "Rejected":
      return "Failed";

    case "Uploaded":
    default:
      return "Pending";
  }
}

/*
 * ============================================================
 * FILE EXTENSION
 * ============================================================
 */

function getFileExtension(
  fileName: string
) {
  const lastDot =
    fileName.lastIndexOf(".");

  if (lastDot === -1) {
    return "";
  }

  return fileName
    .slice(lastDot)
    .toLowerCase();
}

/*
 * ============================================================
 * FILE SIZE
 * ============================================================
 */

function formatFileSize(
  bytes: number
) {
  if (
    !bytes ||
    bytes <= 0
  ) {
    return "0 Bytes";
  }

  const units = [
    "Bytes",
    "KB",
    "MB",
    "GB",
  ];

  const index = Math.floor(
    Math.log(bytes) /
      Math.log(1024)
  );

  const safeIndex =
    Math.min(
      index,
      units.length - 1
    );

  return `${(
    bytes /
    Math.pow(
      1024,
      safeIndex
    )
  ).toFixed(
    safeIndex === 0
      ? 0
      : 1
  )} ${
    units[safeIndex]
  }`;
}

/*
 * ============================================================
 * DATE
 * ============================================================
 */

function formatDate(
  value?: string
) {
  if (!value) {
    return "N/A";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "N/A";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/*
 * ============================================================
 * MIME TYPE FALLBACK
 * ============================================================
 */

function guessMimeType(
  extension?: string
) {
  switch (
    extension?.toLowerCase()
  ) {
    case ".pdf":
      return "application/pdf";

    case ".png":
      return "image/png";

    case ".jpg":
    case ".jpeg":
      return "image/jpeg";

    case ".webp":
      return "image/webp";

    case ".doc":
      return "application/msword";

    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    case ".txt":
      return "text/plain";

    default:
      return "application/octet-stream";
  }
}

/*
 * ============================================================
 * API ERROR MESSAGE
 * ============================================================
 */

function getApiErrorMessage(
  error: any,
  fallback: string
) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}