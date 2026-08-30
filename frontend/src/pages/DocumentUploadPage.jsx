import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";

const documentTypes = [
  {
    key: "ID_PROOF",
    title: "Identity Proof",
    description: "Aadhaar card, passport, driving licence or other valid ID.",
  },
  {
    key: "DEGREE",
    title: "Degree Certificate",
    description: "Highest educational qualification or degree certificate.",
  },
  {
    key: "OFFER_LETTER",
    title: "Signed Offer Letter",
    description: "Signed copy of the accepted employment offer letter.",
  },
];

const allowedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const maximumFileSize = 5 * 1024 * 1024;

function formatFileSize(bytes) {
  if (!bytes) {
    return "0 KB";
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function DocumentCard({ document, selectedFile, onSelect, onRemove }) {
  const inputRef = useRef(null);

  return (
    <article className={`upload-card ${selectedFile ? "selected" : ""}`}>
      <div className="upload-card-heading">
        <div className="upload-document-icon">
          <FileText size={22} />
        </div>

        <div>
          <h2>{document.title}</h2>
          <p>{document.description}</p>
        </div>
      </div>

      {selectedFile ? (
        <div className="selected-file">
          <div className="selected-file-icon">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <strong>{selectedFile.name}</strong>
            <span>{formatFileSize(selectedFile.size)}</span>
          </div>

          <button
            type="button"
            onClick={() => onRemove(document.key)}
            aria-label={`Remove ${document.title}`}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <button
          className="upload-dropzone"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud size={25} />
          <strong>Select {document.title}</strong>
          <span>PDF, JPEG or PNG · Maximum 5 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        className="hidden-file-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(event) =>
          onSelect(document.key, event.target.files?.[0])
        }
      />
    </article>
  );
}

function DocumentUploadPage() {
  const [employeeId, setEmployeeId] = useState(
  () => localStorage.getItem("employee_id") || ""
);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [error, setError] = useState("");
  const [readyMessage, setReadyMessage] = useState("");

  const selectedCount = Object.keys(selectedFiles).length;

  const allDocumentsSelected = useMemo(
    () =>
      documentTypes.every((document) =>
        Boolean(selectedFiles[document.key])
      ),
    [selectedFiles]
  );

  const handleFileSelect = (documentType, file) => {
    setError("");
    setReadyMessage("");

    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, JPEG and PNG files are allowed.");
      return;
    }

    if (file.size > maximumFileSize) {
      setError("Each document must be smaller than 5 MB.");
      return;
    }

    setSelectedFiles((currentFiles) => ({
      ...currentFiles,
      [documentType]: file,
    }));
  };

  const handleRemove = (documentType) => {
    setSelectedFiles((currentFiles) => {
      const updatedFiles = { ...currentFiles };
      delete updatedFiles[documentType];
      return updatedFiles;
    });

    setReadyMessage("");
  };

  const handlePrepareUpload = (event) => {
    event.preventDefault();
    setError("");
    setReadyMessage("");

    if (!employeeId.trim()) {
      setError("Enter your Employee ID before uploading documents.");
      return;
    }

    if (!allDocumentsSelected) {
      setError("Please select all three mandatory documents.");
      return;
    }

    setReadyMessage(
      "All documents passed frontend validation and are ready for secure upload."
    );
  };

  return (
    <main className="documents-page">
      <header className="documents-header">
        <div className="security-label">
          <ShieldCheck size={18} />
          Secure document collection
        </div>

        <h1>Upload your documents</h1>

        <p>
          Submit the three mandatory documents required to complete the
          Document Collection stage of your onboarding.
        </p>
      </header>

      <form className="documents-form" onSubmit={handlePrepareUpload}>
        <section className="employee-id-section">
          <label htmlFor="document-employee-id">Employee ID</label>

          <input
            id="document-employee-id"
            type="text"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            placeholder="Enter the Employee ID received after registration"
          />

          <p>
            Your Employee ID connects these documents to the correct onboarding
            profile.
          </p>
        </section>

        <section className="upload-grid">
          {documentTypes.map((document) => (
            <DocumentCard
              key={document.key}
              document={document}
              selectedFile={selectedFiles[document.key]}
              onSelect={handleFileSelect}
              onRemove={handleRemove}
            />
          ))}
        </section>

        {error && (
          <div className="upload-message error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {readyMessage && (
          <div className="upload-message success">
            <CheckCircle2 size={20} />
            <span>{readyMessage}</span>
          </div>
        )}

        <footer className="upload-footer">
          <div>
            <strong>
              {selectedCount} of {documentTypes.length} documents selected
            </strong>
            <span>
              Files will be encrypted and uploaded through a secure S3 URL.
            </span>
          </div>

          <button className="primary-button" type="submit">
            <UploadCloud size={18} />
            Validate documents
          </button>
        </footer>
      </form>
    </main>
  );
}

export default DocumentUploadPage;