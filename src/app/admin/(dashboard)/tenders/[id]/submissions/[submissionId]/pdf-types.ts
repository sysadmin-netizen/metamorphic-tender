export interface PdfData {
  packageCode: string;
  packageName: string;
  projectName: string;
  submissionDate: string;
  reference: string;
  vendor: {
    company: string;
    tradeLicence: string;
    contact: string;
    email: string;
    whatsapp: string;
    tier: string;
  };
  boq: { code: string; description: string; unit: string; qty: number; rate: string; total: string }[];
  totalAed: string;
  materialOption: string;
  mobilisationDate: string;
  crewSize: number;
  metaforgeConfirmed: boolean;
  insuranceConfirmed: boolean;
  terms: { key: string; value: string }[];
}
