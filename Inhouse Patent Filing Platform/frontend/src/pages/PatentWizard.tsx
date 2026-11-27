import { useEffect, useState } from "react";
import {
  useForm,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import api from "../services/api";
import { DrawingUpload } from "../components/DrawingUpload";

/* =========================================================
   FORM SCHEMA
========================================================= */

const patentSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters"),

  field: z
    .string()
    .min(10, "Please describe the field of the invention"),

  backgroundPriorArt: z
    .string()
    .min(10, "Please provide prior-art/background information"),

  backgroundProblems: z
    .string()
    .min(10, "Please describe the problems with existing solutions"),

  backgroundNeed: z
    .string()
    .min(10, "Please explain the need for the invention"),

  summaryProblem: z
    .string()
    .min(10, "Please describe the problem addressed"),

  summarySolution: z
    .string()
    .min(10, "Please describe the proposed solution"),

  summaryComponents: z
    .string()
    .min(10, "Please describe the main components"),

  summaryOperation: z
    .string()
    .min(10, "Please describe how the invention operates"),

  summaryAdvantages: z
    .string()
    .min(10, "Please describe the advantages"),

  detailedOverview: z
    .string()
    .min(10, "Please provide a detailed overview"),

  detailedArchitecture: z
    .string()
    .min(10, "Please describe the architecture"),

  detailedOperation: z
    .string()
    .min(10, "Please describe the detailed operation"),

  detailedImplementation: z
    .string()
    .min(10, "Please describe the implementation"),

  detailedEmbodiments: z
    .string()
    .min(10, "Please provide at least one embodiment"),

  abstract: z
    .string()
    .min(30, "Abstract must be at least 30 characters"),

  applicantName: z
    .string()
    .min(2, "Applicant name is required"),

  applicantEmail: z
    .string()
    .email("Enter a valid applicant email"),

  applicantDepartment: z
    .string()
    .min(2, "Department is required"),

  inventors: z
    .string()
    .min(2, "Inventor information is required"),

  guideName: z
    .string()
    .min(2, "Guide name is required"),

  guideEmail: z
    .string()
    .email("Enter a valid guide email"),

  classification: z
    .string()
    .min(2, "Classification is required"),

  keywords: z
    .string()
    .min(2, "Please provide keywords"),
});

type FormData = z.infer<typeof patentSchema>;

type Section = {
  id: string;
  title: string;
  description: string;
  fields: Array<keyof FormData>;
};

/* =========================================================
   SECTIONS
========================================================= */

const sections: Section[] = [
  {
    id: "basic",
    title: "1. Basic Information",
    description:
      "Provide the title and field of the invention.",
    fields: ["title", "field"],
  },

  {
    id: "background",
    title: "2. Background of the Invention",
    description:
      "Describe existing technology, problems and the need for the invention.",
    fields: [
      "backgroundPriorArt",
      "backgroundProblems",
      "backgroundNeed",
    ],
  },

  {
    id: "summary",
    title: "3. Summary of the Invention",
    description:
      "Explain the problem, solution, components, operation and advantages.",
    fields: [
      "summaryProblem",
      "summarySolution",
      "summaryComponents",
      "summaryOperation",
      "summaryAdvantages",
    ],
  },

  {
    id: "drawings",
    title: "4. Brief Description of Drawings",
    description:
      "Upload and describe technical drawings associated with the invention.",
    fields: [],
  },

  {
    id: "detailed",
    title: "5. Detailed Description",
    description:
      "Provide the technical implementation and embodiments.",
    fields: [
      "detailedOverview",
      "detailedArchitecture",
      "detailedOperation",
      "detailedImplementation",
      "detailedEmbodiments",
    ],
  },

  {
    id: "abstract",
    title: "6. Abstract",
    description:
      "Provide a concise summary of the invention.",
    fields: ["abstract"],
  },

  {
    id: "applicant",
    title: "7. Applicant & Inventors",
    description:
      "Provide applicant, inventor and guide information.",
    fields: [
      "applicantName",
      "applicantEmail",
      "applicantDepartment",
      "inventors",
      "guideName",
      "guideEmail",
    ],
  },

  {
    id: "classification",
    title: "8. Classification & Keywords",
    description:
      "Provide classification and important keywords.",
    fields: ["classification", "keywords"],
  },
];

/* =========================================================
   EMPTY VALUES
========================================================= */

const emptyValues: FormData = {
  title: "",
  field: "",

  backgroundPriorArt: "",
  backgroundProblems: "",
  backgroundNeed: "",

  summaryProblem: "",
  summarySolution: "",
  summaryComponents: "",
  summaryOperation: "",
  summaryAdvantages: "",

  detailedOverview: "",
  detailedArchitecture: "",
  detailedOperation: "",
  detailedImplementation: "",
  detailedEmbodiments: "",

  abstract: "",

  applicantName: "",
  applicantEmail: "",
  applicantDepartment: "",
  inventors: "",
  guideName: "",
  guideEmail: "",

  classification: "",
  keywords: "",
};

/* =========================================================
   FIELD COMPONENT
========================================================= */

interface FieldProps {
  label: string;
  name: keyof FormData;
  register: UseFormRegister<FormData>;
  error?: string;
  placeholder?: string;
  rows?: number;
}

function FormField({
  label,
  name,
  register,
  error,
  placeholder,
  rows = 5,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">
        {label}
      </label>

      <textarea
        {...register(name)}
        rows={rows}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-brand/20 ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-line focus:border-brand"
        }`}
      />

      {error && (
        <p className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   INPUT COMPONENT
========================================================= */

interface InputProps {
  label: string;
  name: keyof FormData;
  register: UseFormRegister<FormData>;
  error?: string;
  placeholder?: string;
}

function FormInput({
  label,
  name,
  register,
  error,
  placeholder,
}: InputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        {...register(name)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-brand/20 ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-line focus:border-brand"
        }`}
      />

      {error && (
        <p className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   PROPS
========================================================= */

interface PatentWizardProps {
  onBack: () => void;
  onSaved: () => void;
  patentId?: string | null;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export function PatentWizard({
  onBack,
  onSaved,
  patentId: existingPatentId = null,
}: PatentWizardProps) {
  const [currentSection, setCurrentSection] =
    useState(0);

  const [patentId, setPatentId] =
    useState<string | null>(existingPatentId);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [generatingPdf, setGeneratingPdf] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [loadingExistingPatent, setLoadingExistingPatent] =
    useState(false);

  const [uploadedDrawings, setUploadedDrawings] =
    useState<any[]>([]);

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(patentSchema),
    defaultValues: emptyValues,
    mode: "onTouched",
  });

  /* =========================================================
     LOAD EXISTING PATENT FOR EDITING
  ========================================================= */

  useEffect(() => {
    if (!existingPatentId) {
      reset(emptyValues);
      setPatentId(null);
      setUploadedDrawings([]);
      setCurrentSection(0);
      setMessage("");
      setErrorMessage("");
      return;
    }

    const loadPatent = async () => {
      setLoadingExistingPatent(true);
      setErrorMessage("");
      setMessage("");

      try {
        const response = await api.get(
          `/patents/${existingPatentId}`
        );

        const patent = response.data?.patent;

        if (!patent) {
          throw new Error(
            "Patent information was not returned by the server."
          );
        }

        if (
          patent.status !== "Draft" &&
          patent.status !== "Changes Requested"
        ) {
          setErrorMessage(
            "Only Draft or Changes Requested patents can be edited."
          );
          return;
        }

        setPatentId(patent._id);

        reset({
          title: patent.title || "",
          field: patent.field || "",

          backgroundPriorArt:
            patent.backgroundPriorArt || "",
          backgroundProblems:
            patent.backgroundProblems || "",
          backgroundNeed:
            patent.backgroundNeed || "",

          summaryProblem:
            patent.summaryProblem || "",
          summarySolution:
            patent.summarySolution || "",
          summaryComponents:
            patent.summaryComponents || "",
          summaryOperation:
            patent.summaryOperation || "",
          summaryAdvantages:
            patent.summaryAdvantages || "",

          detailedOverview:
            patent.detailedOverview || "",
          detailedArchitecture:
            patent.detailedArchitecture || "",
          detailedOperation:
            patent.detailedOperation || "",
          detailedImplementation:
            patent.detailedImplementation || "",
          detailedEmbodiments:
            patent.detailedEmbodiments || "",

          abstract:
            patent.abstract || "",

          applicantName:
            patent.applicantName || "",
          applicantEmail:
            patent.applicantEmail || "",
          applicantDepartment:
            patent.applicantDepartment || "",
          inventors:
            patent.inventors || "",
          guideName:
            patent.guideName || "",
          guideEmail:
            patent.guideEmail || "",

          classification:
            patent.classification || "",
          keywords:
            patent.keywords || "",
        });

        setUploadedDrawings(
          Array.isArray(patent.drawings)
            ? patent.drawings
            : []
        );

        setMessage(
          "Draft loaded successfully. You can continue editing."
        );
      } catch (error: any) {
        console.error(
          "Failed to load patent:",
          error
        );

        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load patent draft."
        );
      } finally {
        setLoadingExistingPatent(false);
      }
    };

    loadPatent();
  }, [existingPatentId, reset]);

  /* =========================================================
     CLEAR MESSAGES
  ========================================================= */

  const clearMessages = () => {
    setMessage("");
    setErrorMessage("");
  };

  /* =========================================================
     SAVE DRAFT
  ========================================================= */

  const saveDraft = async (): Promise<boolean> => {
    clearMessages();

    const data = getValues();

    if (!data.title.trim()) {
      setErrorMessage(
        "Patent title is required before saving."
      );
      return false;
    }

    setSaving(true);

    try {
      let response;

      if (patentId) {
        response = await api.put(
          `/patents/${patentId}`,
          data
        );
      } else {
        response = await api.post(
          "/patents",
          data
        );
      }

      const savedPatent =
        response.data?.patent;

      if (!savedPatent?._id) {
        throw new Error(
          "Patent was saved but no patent ID was returned."
        );
      }

      setPatentId(savedPatent._id);

      setMessage(
        patentId
          ? "Draft updated successfully."
          : "Draft saved successfully."
      );

      return true;
    } catch (error: any) {
      console.error(
        "Failed to save patent:",
        error
      );

      setErrorMessage(
        error?.response?.data?.message ||
          "Failed to save patent draft."
      );

      return false;
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     VALIDATE CURRENT SECTION
  ========================================================= */

  const validateCurrentSection =
    async (): Promise<boolean> => {
      const section = sections[currentSection];

      if (section.fields.length === 0) {
        return true;
      }

      const valid = await trigger(
        section.fields
      );

      if (!valid) {
        setErrorMessage(
          "Please complete the required fields before continuing."
        );
      }

      return valid;
    };

  /* =========================================================
     NEXT SECTION
  ========================================================= */

  const nextSection = async () => {
    clearMessages();

    const valid =
      await validateCurrentSection();

    if (!valid) {
      return;
    }

    const saved = await saveDraft();

    if (!saved) {
      return;
    }

    if (
      currentSection <
      sections.length - 1
    ) {
      setCurrentSection(
        (previous) => previous + 1
      );

      setMessage(
        "Section saved successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  /* =========================================================
     PREVIOUS SECTION
  ========================================================= */

  const previousSection = () => {
    clearMessages();

    if (currentSection > 0) {
      setCurrentSection(
        (previous) => previous - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  /* =========================================================
     DRAWING UPLOAD CALLBACK
  ========================================================= */

  const handleDrawingUploaded = (
    drawing: any
  ) => {
    if (!drawing) {
      return;
    }

    setUploadedDrawings(
      (previous) => [
        ...previous,
        drawing,
      ]
    );

    setMessage(
      "Drawing uploaded successfully."
    );
  };

  /* =========================================================
     GENERATE PDF
  ========================================================= */

  const generatePdf = async () => {
    clearMessages();

    if (!patentId) {
      setErrorMessage(
        "Please save the patent draft before generating the PDF."
      );
      return;
    }

    setGeneratingPdf(true);

    try {
      const response = await api.post(
        `/patents/${patentId}/pdf`,
        {},
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      const title =
        getValues("title")
          .trim()
          .replace(
            /[^a-z0-9]+/gi,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          ) || "Patent";

      link.download =
        `${title}-Patent-Specification.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage(
        "Patent PDF generated successfully."
      );
    } catch (error: any) {
      console.error(
        "PDF generation failed:",
        error
      );

      setErrorMessage(
        "Failed to generate the patent PDF."
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  /* =========================================================
     SUBMIT PATENT
  ========================================================= */

  const submitPatent = async () => {
    clearMessages();

    if (!patentId) {
      setErrorMessage(
        "Please save the patent before submitting."
      );
      return;
    }

    const valid =
      await trigger();

    if (!valid) {
      setErrorMessage(
        "Please complete all required fields before submitting the patent."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to submit this patent for review?"
      );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      await api.post(
        `/patents/${patentId}/submit`
      );

      setMessage(
        "Patent submitted successfully for review."
      );
    } catch (error: any) {
      console.error(
        "Patent submission failed:",
        error
      );

      setErrorMessage(
        error?.response?.data?.message ||
          "Failed to submit patent."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     FINISH
  ========================================================= */

  const finish = () => {
    onSaved();
  };

  /* =========================================================
     ERROR HELPER
  ========================================================= */

  const getErrorMessage = (
    name: keyof FormData
  ) => {
    const error =
      errors[name];

    if (!error) {
      return undefined;
    }

    return error.message?.toString();
  };

  /* =========================================================
     CURRENT SECTION
  ========================================================= */

  const section =
    sections[currentSection];

  /* =========================================================
     FORM SUBMIT
  ========================================================= */

  const onSubmit = async () => {
    await saveDraft();
  };

  /* =========================================================
     LOADING EXISTING PATENT
  ========================================================= */

  if (loadingExistingPatent) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="rounded-2xl border border-line bg-white px-5 sm:px-8 py-7 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />

          <h2 className="text-lg font-bold text-brand">
            Loading Patent Draft
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Please wait while the existing patent
            information is loaded.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 text-sm font-semibold text-slate-600 hover:text-brand"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-extrabold text-slate-900">
            {existingPatentId
              ? "Edit Patent Draft"
              : "New Patent Draft"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Complete the patent specification section
            by section.
          </p>
        </div>

        {patentId && (
          <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
            <span className="font-semibold text-slate-500">
              Patent ID:
            </span>{" "}
            <span className="font-mono text-xs text-brand">
              {patentId}
            </span>
          </div>
        )}
      </div>

      {/* SECTION PROGRESS */}

      <div className="rounded-2xl border border-line bg-white p-3 sm:p-4">
        <div className="flex flex-wrap gap-2" role="list">

          {sections.map(
            (item, index) => {
              const active =
                index === currentSection;

              const completed =
                index < currentSection;

              return (
                <button
                  type="button"
                  role="listitem"
                  aria-current={active ? "step" : undefined}
                  key={item.id}
                  onClick={() => {
                    if (
                      index <=
                      currentSection
                    ) {
                      setCurrentSection(
                        index
                      );
                      clearMessages();
                    }
                  }}
                  className={`rounded-xl px-3 py-2 text-left text-xs font-semibold transition sm:px-4 sm:text-sm ${
                    active
                      ? "bg-brand text-white"
                      : completed
                      ? "bg-slate-100 text-brand"
                      : "text-slate-500"
                  }`}
                >
                  {index + 1}.{" "}
                  {item.title.replace(
                    /^\d+\.\s*/,
                    ""
                  )}
                </button>
              );
            }
          )}

        </div>
      </div>

      {/* MESSAGES */}

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {/* FORM */}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >

        {/* SECTION HEADER */}

        <div className="rounded-2xl border border-line bg-white p-6">
          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
              {currentSection + 1}
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-brand">
                {section.title}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {section.description}
              </p>
            </div>

          </div>
        </div>

        {/* =================================================
            BASIC INFORMATION
        ================================================= */}

        {section.id === "basic" && (
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="grid gap-6">

              <FormInput
                label="Title of the Invention"
                name="title"
                register={register}
                error={getErrorMessage(
                  "title"
                )}
                placeholder="Enter the complete title of your invention"
              />

              <FormField
                label="Field of the Invention"
                name="field"
                register={register}
                error={getErrorMessage(
                  "field"
                )}
                placeholder="Describe the technical field to which the invention relates"
              />

            </div>
          </div>
        )}

        {/* =================================================
            BACKGROUND
        ================================================= */}

        {section.id === "background" && (
          <div className="space-y-6 rounded-2xl border border-line bg-white p-6">

            <FormField
              label="3.1 Prior Art / Existing Technology"
              name="backgroundPriorArt"
              register={register}
              error={getErrorMessage(
                "backgroundPriorArt"
              )}
              placeholder="Describe existing solutions, technologies, systems or prior art..."
            />

            <FormField
              label="3.2 Problems with Existing Solutions"
              name="backgroundProblems"
              register={register}
              error={getErrorMessage(
                "backgroundProblems"
              )}
              placeholder="Explain the limitations and problems in existing approaches..."
            />

            <FormField
              label="3.3 Need for the Invention"
              name="backgroundNeed"
              register={register}
              error={getErrorMessage(
                "backgroundNeed"
              )}
              placeholder="Explain why the proposed invention is needed..."
            />

          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        {section.id === "summary" && (
          <div className="space-y-6 rounded-2xl border border-line bg-white p-6">

            <FormField
              label="4.1 Problem Addressed"
              name="summaryProblem"
              register={register}
              error={getErrorMessage(
                "summaryProblem"
              )}
              placeholder="Explain the specific problem addressed by the invention..."
            />

            <FormField
              label="4.2 Proposed Solution"
              name="summarySolution"
              register={register}
              error={getErrorMessage(
                "summarySolution"
              )}
              placeholder="Explain how the invention solves the identified problem..."
            />

            <FormField
              label="4.3 Main Components"
              name="summaryComponents"
              register={register}
              error={getErrorMessage(
                "summaryComponents"
              )}
              placeholder="List and describe the main components/modules..."
            />

            <FormField
              label="4.4 Operation"
              name="summaryOperation"
              register={register}
              error={getErrorMessage(
                "summaryOperation"
              )}
              placeholder="Explain how the invention operates..."
            />

            <FormField
              label="4.5 Advantages"
              name="summaryAdvantages"
              register={register}
              error={getErrorMessage(
                "summaryAdvantages"
              )}
              placeholder="Describe the advantages and benefits..."
            />

          </div>
        )}

        {/* =================================================
            DRAWINGS
        ================================================= */}

        {section.id === "drawings" && (
          <div className="space-y-6">

            {!patentId ? (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
                <h3 className="font-bold text-yellow-800">
                  Save the draft first
                </h3>

                <p className="mt-2 text-sm text-yellow-700">
                  A patent ID is required before drawings
                  can be uploaded. Click "Save & Next" from
                  the previous section first.
                </p>
              </div>
            ) : (
              <>
                <DrawingUpload
                  patentId={patentId}
                  onUploaded={
                    handleDrawingUploaded
                  }
                />

                {uploadedDrawings.length >
                  0 && (
                  <div className="rounded-2xl border border-line bg-white p-6">

                    <h3 className="text-lg font-extrabold text-brand">
                      Uploaded Drawings
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Technical drawings currently
                      attached to this patent.
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">

                      {uploadedDrawings.map(
                        (
                          drawing,
                          index
                        ) => {
                          const preview =
                            drawing.preview ||
                            drawing.url;

                          const imageUrl =
                            preview?.startsWith(
                              "http"
                            )
                              ? preview
                              : preview
                              ? `http://127.0.0.1:5000${preview}`
                              : "";

                          return (
                            <div
                              key={
                                drawing._id ||
                                drawing.id ||
                                `${drawing.figureNumber}-${index}`
                              }
                              className="overflow-hidden rounded-xl border border-line bg-slate-50"
                            >

                              {imageUrl && (
                                <div className="flex h-52 items-center justify-center bg-white p-3">
                                  <img
                                    src={
                                      imageUrl
                                    }
                                    alt={`Figure ${
                                      drawing.figureNumber ||
                                      index +
                                        1
                                    }`}
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </div>
                              )}

                              <div className="space-y-1 border-t border-line p-4">

                                <p className="font-bold text-brand">
                                  Figure{" "}
                                  {drawing.figureNumber ||
                                    index +
                                      1}
                                </p>

                                {drawing.description && (
                                  <p className="text-sm text-slate-600">
                                    {
                                      drawing.description
                                    }
                                  </p>
                                )}

                                {drawing.referenceNumbers && (
                                  <p className="text-xs text-slate-500">
                                    <span className="font-semibold">
                                      Reference
                                      Numbers:
                                    </span>{" "}
                                    {
                                      drawing.referenceNumbers
                                    }
                                  </p>
                                )}

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* =================================================
            DETAILED DESCRIPTION
        ================================================= */}

        {section.id === "detailed" && (
          <div className="space-y-6 rounded-2xl border border-line bg-white p-6">

            <FormField
              label="6.1 Detailed Overview"
              name="detailedOverview"
              register={register}
              error={getErrorMessage(
                "detailedOverview"
              )}
              placeholder="Provide a complete technical overview..."
            />

            <FormField
              label="6.2 Detailed Architecture"
              name="detailedArchitecture"
              register={register}
              error={getErrorMessage(
                "detailedArchitecture"
              )}
              placeholder="Describe the architecture, modules, components and relationships..."
            />

            <FormField
              label="6.3 Detailed Operation"
              name="detailedOperation"
              register={register}
              error={getErrorMessage(
                "detailedOperation"
              )}
              placeholder="Explain the step-by-step operation of the invention..."
            />

            <FormField
              label="6.4 Detailed Implementation"
              name="detailedImplementation"
              register={register}
              error={getErrorMessage(
                "detailedImplementation"
              )}
              placeholder="Describe the technical implementation..."
            />

            <FormField
              label="6.5 Detailed Embodiments"
              name="detailedEmbodiments"
              register={register}
              error={getErrorMessage(
                "detailedEmbodiments"
              )}
              placeholder="Describe possible embodiments, variations and implementations..."
            />

          </div>
        )}

        {/* =================================================
            ABSTRACT
        ================================================= */}

        {section.id === "abstract" && (
          <div className="rounded-2xl border border-line bg-white p-6">

            <FormField
              label="Abstract"
              name="abstract"
              register={register}
              error={getErrorMessage(
                "abstract"
              )}
              placeholder="Provide a concise summary of the invention, its technical solution and key advantages..."
              rows={8}
            />

            <p className="mt-2 text-xs text-slate-500">
              Recommended: keep the abstract concise and
              focused on the technical essence of the invention.
            </p>

          </div>
        )}

        {/* =================================================
            APPLICANT & INVENTORS
        ================================================= */}

        {section.id === "applicant" && (
          <div className="rounded-2xl border border-line bg-white p-6">

            <div className="grid gap-6 md:grid-cols-2">

              <FormInput
                label="Applicant Name"
                name="applicantName"
                register={register}
                error={getErrorMessage(
                  "applicantName"
                )}
                placeholder="Full applicant name"
              />

              <FormInput
                label="Applicant Email"
                name="applicantEmail"
                register={register}
                error={getErrorMessage(
                  "applicantEmail"
                )}
                placeholder="applicant@example.com"
              />

              <FormInput
                label="Applicant Department"
                name="applicantDepartment"
                register={register}
                error={getErrorMessage(
                  "applicantDepartment"
                )}
                placeholder="Department / Institution"
              />

              <FormInput
                label="Inventor(s)"
                name="inventors"
                register={register}
                error={getErrorMessage(
                  "inventors"
                )}
                placeholder="Enter inventor names"
              />

              <FormInput
                label="Guide / Supervisor Name"
                name="guideName"
                register={register}
                error={getErrorMessage(
                  "guideName"
                )}
                placeholder="Guide or supervisor name"
              />

              <FormInput
                label="Guide / Supervisor Email"
                name="guideEmail"
                register={register}
                error={getErrorMessage(
                  "guideEmail"
                )}
                placeholder="guide@example.com"
              />

            </div>

          </div>
        )}

        {/* =================================================
            CLASSIFICATION
        ================================================= */}

        {section.id === "classification" && (
          <div className="rounded-2xl border border-line bg-white p-6">

            <div className="grid gap-6">

              <FormInput
                label="Patent Classification"
                name="classification"
                register={register}
                error={getErrorMessage(
                  "classification"
                )}
                placeholder="Example: G06N, G06F, H04L"
              />

              <FormField
                label="Keywords"
                name="keywords"
                register={register}
                error={getErrorMessage(
                  "keywords"
                )}
                placeholder="Enter important keywords separated by commas"
                rows={4}
              />

            </div>

          </div>
        )}

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">

          <button
            type="button"
            onClick={previousSection}
            disabled={
              currentSection === 0 ||
              saving
            }
            className="rounded-xl border border-line px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="rounded-xl border border-line px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Draft"}
            </button>

            {currentSection <
              sections.length - 1 ? (
              <button
                type="button"
                onClick={nextSection}
                disabled={saving}
                className="rounded-xl bg-brand px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Save & Next →"}
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const valid =
                    await validateCurrentSection();

                  if (!valid) {
                    return;
                  }

                  const saved =
                    await saveDraft();

                  if (saved) {
                    setMessage(
                      "Patent draft completed successfully."
                    );
                  }
                }}
                disabled={saving}
                className="rounded-xl bg-brand px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Complete Draft"}
              </button>
            )}

          </div>
        </div>

      </form>

      {/* =================================================
          FINAL ACTIONS
      ================================================= */}

      {patentId && (
        <div className="rounded-2xl border border-line bg-white p-6">

          <h2 className="text-xl font-extrabold text-brand">
            Final Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Save, generate the final specification PDF or
            submit the patent for administrative review.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">

            <button
              type="button"
              onClick={generatePdf}
              disabled={
                generatingPdf ||
                saving
              }
              className="rounded-xl border border-line px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingPdf
                ? "Generating PDF..."
                : "Download PDF"}
            </button>

            <button
              type="button"
              onClick={submitPatent}
              disabled={
                submitting ||
                saving
              }
              className="rounded-xl bg-brand px-5 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Submitting..."
                : "Submit Patent"}
            </button>

            <button
              type="button"
              onClick={finish}
              className="rounded-xl border border-line px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Finish
            </button>

          </div>

        </div>
      )}

    </div>
  );
}