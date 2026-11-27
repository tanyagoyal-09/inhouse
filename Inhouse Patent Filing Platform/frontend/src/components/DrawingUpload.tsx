import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../services/api";

interface DrawingUploadProps {
  patentId: string;
  onUploaded?: (
    drawing: any
  ) => void;
}

interface DrawingForm {
  figureNumber: string;
  description: string;
  referenceNumbers: string;
}

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const MIN_WIDTH = 100;
const MIN_HEIGHT = 100;

const MAX_PIXELS =
  40_000_000;

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

const ALLOWED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
];

export function DrawingUpload({
  patentId,
  onUploaded,
}: DrawingUploadProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [file, setFile] =
    useState<File | null>(
      null
    );

  const [preview, setPreview] =
    useState("");

  const [form, setForm] =
    useState<DrawingForm>({
      figureNumber: "1",
      description: "",
      referenceNumbers: "",
    });

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const [validating, setValidating] =
    useState(false);

  const [
    imageDimensions,
    setImageDimensions,
  ] = useState<{
    width: number;
    height: number;
  } | null>(null);

  /*
  |--------------------------------------------------------------------------
  | PREVIEW CLEANUP
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }
    };
  }, [preview]);

  /*
  |--------------------------------------------------------------------------
  | VALIDATE FILE
  |--------------------------------------------------------------------------
  */

  const validateFile = (
    selectedFile: File
  ): Promise<
    string | null
  > => {
    return new Promise(
      (resolve) => {
        if (
          !ALLOWED_TYPES.includes(
            selectedFile.type
          )
        ) {
          resolve(
            "Invalid file type. Please upload a PNG, JPG, JPEG or WebP image."
          );
          return;
        }

        const extension =
          selectedFile.name
            .slice(
              selectedFile.name.lastIndexOf(
                "."
              )
            )
            .toLowerCase();

        if (
          !ALLOWED_EXTENSIONS.includes(
            extension
          )
        ) {
          resolve(
            "Invalid file extension. Allowed formats are PNG, JPG, JPEG and WebP."
          );
          return;
        }

        if (
          selectedFile.size >
          MAX_FILE_SIZE
        ) {
          resolve(
            "File size must not exceed 5 MB."
          );
          return;
        }

        if (
          selectedFile.size === 0
        ) {
          resolve(
            "The selected file is empty."
          );
          return;
        }

        const objectUrl =
          URL.createObjectURL(
            selectedFile
          );

        const image =
          new Image();

        image.onload = () => {
          const width =
            image.naturalWidth;

          const height =
            image.naturalHeight;

          URL.revokeObjectURL(
            objectUrl
          );

          setImageDimensions({
            width,
            height,
          });

          if (
            width <
              MIN_WIDTH ||
            height <
              MIN_HEIGHT
          ) {
            resolve(
              `Image must be at least ${MIN_WIDTH} × ${MIN_HEIGHT} pixels.`
            );
            return;
          }

          if (
            width * height >
            MAX_PIXELS
          ) {
            resolve(
              "Image dimensions are too large."
            );
            return;
          }

          resolve(null);
        };

        image.onerror = () => {
          URL.revokeObjectURL(
            objectUrl
          );

          resolve(
            "The selected file is not a valid or readable image."
          );
        };

        image.src =
          objectUrl;
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | FILE SELECT
  |--------------------------------------------------------------------------
  */

  const handleFileChange =
    async (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      const selectedFile =
        event.target.files?.[0];

      if (!selectedFile) {
        return;
      }

      setError("");
      setSuccess("");
      setImageDimensions(
        null
      );

      setValidating(true);

      const validationError =
        await validateFile(
          selectedFile
        );

      setValidating(false);

      if (validationError) {
        setFile(null);
        setPreview("");
        setImageDimensions(
          null
        );

        setError(
          validationError
        );

        if (inputRef.current) {
          inputRef.current.value =
            "";
        }

        return;
      }

      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }

      setFile(
        selectedFile
      );

      const objectUrl =
        URL.createObjectURL(
          selectedFile
        );

      setPreview(
        objectUrl
      );
    };

  /*
  |--------------------------------------------------------------------------
  | REMOVE FILE
  |--------------------------------------------------------------------------
  */

  const handleRemove =
    () => {
      if (preview) {
        URL.revokeObjectURL(
          preview
        );
      }

      setFile(null);
      setPreview("");
      setError("");
      setImageDimensions(
        null
      );

      if (inputRef.current) {
        inputRef.current.value =
          "";
      }
    };

  /*
  |--------------------------------------------------------------------------
  | FORM UPDATE
  |--------------------------------------------------------------------------
  */

  const updateForm = (
    field: keyof DrawingForm,
    value: string
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | UPLOAD
  |--------------------------------------------------------------------------
  */

  const handleUpload =
    async () => {
      setError("");
      setSuccess("");

      if (!patentId) {
        setError(
          "Patent ID is missing. Please save the patent before uploading a drawing."
        );
        return;
      }

      if (!file) {
        setError(
          "Please select a drawing image first."
        );
        return;
      }

      const figureNumber =
        Number(
          form.figureNumber
        );

      if (
        !Number.isInteger(
          figureNumber
        ) ||
        figureNumber <= 0
      ) {
        setError(
          "Figure number must be a positive whole number."
        );
        return;
      }

      if (
        !form.description.trim()
      ) {
        setError(
          "Please enter a description for the drawing."
        );
        return;
      }

      setUploading(true);

      try {
        const validationError =
          await validateFile(
            file
          );

        if (
          validationError
        ) {
          setError(
            validationError
          );
          return;
        }

        const formData =
          new FormData();

        formData.append(
          "image",
          file
        );

        formData.append(
          "figureNumber",
          String(
            figureNumber
          )
        );

        formData.append(
          "description",
          form.description.trim()
        );

        formData.append(
          "referenceNumbers",
          form.referenceNumbers.trim()
        );

        const response =
          await api.post(
            `/patents/${patentId}/drawings`,
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        const drawing =
          response.data?.drawing;

        const document =
          response.data?.document;

        /*
        |--------------------------------------------------------------------------
        | UPDATE PARENT
        |--------------------------------------------------------------------------
        */

        if (onUploaded) {
          onUploaded({
            ...drawing,
            document,
          });
        }

        /*
        |--------------------------------------------------------------------------
        | RESET
        |--------------------------------------------------------------------------
        */

        handleRemove();

        setForm({
          figureNumber:
            String(
              figureNumber + 1
            ),
          description: "",
          referenceNumbers: "",
        });

        /*
        |--------------------------------------------------------------------------
        | SUCCESS
        |--------------------------------------------------------------------------
        */

        setSuccess(
          "Drawing uploaded successfully and added to the patent document records."
        );
      } catch (err: any) {
        console.error(
          "Drawing upload error:",
          err
        );

        let message =
          err?.response?.data
            ?.message;

        if (
          err?.response?.data instanceof
          Blob
        ) {
          try {
            const text =
              await err.response.data.text();

            const parsed =
              JSON.parse(
                text
              );

            message =
              parsed?.message;
          } catch {
            // Ignore
          }
        }

        setError(
          message ||
            "Unable to upload drawing. Please try again."
        );
      } finally {
        setUploading(
          false
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="rounded-2xl border border-line bg-white p-6">

      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-brand">
          Patent Drawings
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Upload technical drawings or figures associated with this patent application.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          ✓ {success}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Figure Number
          </label>

          <input
            type="number"
            min="1"
            value={
              form.figureNumber
            }
            onChange={(event) =>
              updateForm(
                "figureNumber",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Reference Numbers
          </label>

          <input
            type="text"
            value={
              form.referenceNumbers
            }
            onChange={(event) =>
              updateForm(
                "referenceNumbers",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand"
            placeholder="e.g. 100, 101, 102, 103"
          />
        </div>

      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-bold text-slate-700">
          Drawing Description
        </label>

        <textarea
          value={
            form.description
          }
          onChange={(event) =>
            updateForm(
              "description",
              event.target.value
            )
          }
          rows={3}
          className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand"
          placeholder="Describe what this figure represents..."
        />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-bold text-slate-700">
          Drawing Image
        </label>

        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          onChange={
            handleFileChange
          }
          className="block w-full rounded-xl border border-line bg-white p-3 text-sm"
        />

        <p className="mt-2 text-xs text-slate-500">
          Supported formats: PNG, JPG, JPEG and WebP. Maximum size: 5 MB. Minimum dimensions: 100 × 100 pixels.
        </p>
      </div>

      {validating && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
          Validating image...
        </div>
      )}

      {preview &&
        !validating && (
          <div className="mt-5 rounded-2xl border border-line bg-slate-50 p-4">

            <div className="mb-3 flex items-center justify-between">

              <div>
                <div className="font-bold text-brand">
                  Drawing Preview
                </div>

                {file && (
                  <div className="mt-1 text-xs text-slate-500">
                    {file.name}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={
                  handleRemove
                }
                disabled={
                  uploading
                }
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>

            </div>

            <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-line bg-white p-4">

              <img
                src={preview}
                alt={`Figure ${form.figureNumber} preview`}
                className="max-h-[420px] max-w-full object-contain"
              />

            </div>

            {file && (
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">

                <div>
                  <span className="font-bold">
                    File:
                  </span>{" "}
                  {file.name}
                </div>

                <div>
                  <span className="font-bold">
                    Size:
                  </span>{" "}
                  {(
                    file.size /
                    (1024 * 1024)
                  ).toFixed(2)}{" "}
                  MB
                </div>

                {imageDimensions && (
                  <div>
                    <span className="font-bold">
                      Dimensions:
                    </span>{" "}
                    {
                      imageDimensions.width
                    }{" "}
                    ×{" "}
                    {
                      imageDimensions.height
                    }{" "}
                    px
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      <div className="mt-5 flex justify-end">

        <button
          type="button"
          onClick={
            handleUpload
          }
          disabled={
            uploading ||
            validating ||
            !file
          }
          className="rounded-xl bg-brand px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading
            ? "Uploading..."
            : "Upload Drawing"}
        </button>

      </div>

    </div>
  );
}