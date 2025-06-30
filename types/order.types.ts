export type Chapter = {
  chapter_id: string;
  title: string;
  pages: number;
  summary: string;
  chapterNumber: number;
  isImportant: boolean;
};

export type Book = {
  book_id: string;
  title: string;
  author: string;
  yearPublished: number;
  genre: string;
  chapters: Chapter[];
};

export type OrderLineItem = {
  id: string;
  name: string;
  value: string;
}

export type OrderTypes = {
  ATA: string | null;
  ATD: string | null;
  BookedDate: string;
  BuyerFK: string;
  ConfirmDate: string | null;
  ConsigneeCode: string;
  ConsigneeName: string;
  ConsignorCode: string;
  ConsignorName: string;
  ContainerNumbers: string | null;
  ControlCustomFK: string | null;
  CustomsClearanceDate: string | null;
  Destination: string;
  DestinationName: string;
  ETA: string;
  ETD: string;
  FirstLegATD: string | null;
  FollowupSentDate: string | null;
  HouseBill: string | null;
  IncoTerm: string;
  IsPreadviceMailSent: boolean;
  IsValid: boolean;
  LastLegATA: string | null;
  OrderDate: string;
  OrderNo: string | null;
  OrderStatusDesc: string;
  OrderType: string;
  Origin: string;
  OriginName: string;
  OuterPackCount: number;
  OuterPackType: string | null;
  POHConsigneeCode: string;
  POHPK: string;
  POHSHPFK: string;
  PackingMode: string;
  Remarks: string | null;
  SharedRoleCode: string;
  ShipmentDirection: string;
  ShipmentNo: string;
  ShipmentStatus: string;
  ShipmentStatusCode: string;
  StateId: number;
  Status: string;
  SupplierFK: string;
  TenantCode: string;
  TransportMode: string;
  UnitOfVolume: string;
  UnitOfWeight: string;
  Volume: number;
  Weight: number;
  OrderLine: OrderLineItem[];
}

export interface Order {
  PK: string;
  IsValid: boolean;
  IsCancelled: boolean;
  Buyer: string;
  BuyerName: string;
  OrderNo: string;
  OrderDate: string;
  OrderStatus: string;
  TransportMode: string;
  ContainerMode: string;
  Supplier: string;
  SupplierName: string;
  IncoTerm: string;
  ShipmentNo: string;
  PortOfLoading: string;
  PortOfLoadingDes: string;
  PortOfDischarge: string;
  PortOfDischargeDes: string;
  CreatedBy: string;
  CreatedDateTime: string;
  ModifiedBy: string;
  ModifiedDateTime: string;
  OrderStatusDesc: string;
  ConsigneeName: string;
  ConsignorName: string;
  [key: string]: any; // Add this if there are additional dynamic fields
}
