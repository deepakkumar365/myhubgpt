export type ContainersType = {
    CNTPK: string;
    ContainerNo: string;
    ContainerMode: string;
    SealNo: string | null;
    Sealno2: string | null;
    PackType: string;
    PackCount: number;
    ShipmentNo: string;
    HouseBill: string;
    Status: string;
    ShipperName: string;
    ConsigneeName: string;
    Origin: string;
    Destination: string;
    ETD: string;  // Can be a date string, or use Date if you want to parse it
    ATD: string;  // Same as above
    ETA: string;  // Same as above
    ATA: string | null;
    IncoTerm: string;
    RCType: string;
    OrderNos: string | null;
    FCLAvailable: boolean | null;
    RequestedDelivery: string | null;
    PlannedDelivery: string | null;
    ArrivalEstimatedDelivery: string;
    ActualDelivery: string | null;
    EmptyReadyForReturn: string | null;
    CustomsClearenceDate: string | null;
    Consigneecode: string;
    ConsignorCode: string;
    MilestonestatusCode: string | null;
    Comments: string | null;
    ContainerSearch: string;
    ShipperFK: string;
    ControlCustomFK: string | null;
    ControlCustomCode: string;
    ControlCustomName: string;
    SharedRoleCode: string;
    ConsigneeFK: string;
    CNTShipmentPK: string;
  }
  