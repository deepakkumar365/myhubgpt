export interface RelatedDetailType {
  Data: {
    JEE_CustomVarIII: string;
    JEE_CustomVarII: string;
    JEE_CustomVarI: string;
    JEE_CustomDateI: string;
    JEE_CustomDateII: string;
  };
}

export type ExceptionDetailType = {
  PK: string;
  ExceptionDesc: string;
  EntityRefCode: string;
  Status: string;
  Title: string;
  Description: string;
  CreatedDateTime: string;
  CreatedBy: string;
  ReferenceNo: string;
  RelatedDetails: RelatedDetailType[];
};
