export type DocumentDetailType = {
    PK: string;
    EntityRefKey: string;
    EntitySource: string;
    EntityRefCode: string;
    ParentEntityRefKey: string | null;
    ParentEntitySource: string | null;
    ParentEntityRefCode: string | null;
    AdditionalEntityRefKey: string | null;
    AdditionalEntitySource: string | null;
    AdditionalEntityRefCode: string | null;
    DocFK: string;
    IsPublic: boolean;
    IsAuto: boolean;
    IsActive: boolean;
    ModifiedDateTime: string;
    ModifiedBy: string;
    CreatedDateTime: string;
    CreatedBy: string;
    FileName: string;
    FileExtension: string;
    ContentType: string;
    DocumentName: string;
    DocumentType: string;
    IsModified: boolean;
    IsDeleted: boolean;
    TenantCode: string;
    Status: string;
    StartTime: string;
    EndTime: string;
    Remarks: string | null;
    Criteria: string | null;
    Parent_FK: string | null;
    AmendCount: number;
    DownloadCount: number;
    IsShared: boolean;
    IsResticted: boolean;
    PartyType_FK: string | null;
    PartyType_Code: string | null;
    IsOriginalReceived: boolean;
    OriginalReceivedRemarks: string | null;
    IsOriginalRequired: boolean;
    DocumentData: string | null;
    Thumbnail: string | null;
    BaseThumbnail: string | null;
    SRO_FK: string | null;
    SRO_Code: string | null;
    Description: string;
    Message: string | null;
    PrintType: string | null;
    SharedTenantCode: string | null;
  }

export type DocumentsResponseType = {
  count: number;
  success: boolean;
  value: DocumentDetailType[];
}
  