-- Adds "aadhaar" as a partner document type (partner table only; additive —
-- existing rows and values are unchanged).
ALTER TABLE partner_documents
  MODIFY doc_type ENUM('aadhaar','gst_certificate','id_proof','business_proof','other') NOT NULL;
