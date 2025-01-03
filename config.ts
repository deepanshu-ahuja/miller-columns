export const Entitlements = {
  department: "department",
  subDepartment: "subDepartment",
  functionalArea: "functionalArea",
} as const;

export type EntitlementKey = (typeof Entitlements)[keyof typeof Entitlements];

export interface EntitlementLevel {
  functionalArea?: string | null;
  department?: string | null;
  subDepartment?: string | null;
}

interface ColumnConfig {
  childColumns?: EntitlementKey[];
  parentColumns?: EntitlementKey[];
  directChild?: EntitlementKey;
  directParent?: EntitlementKey;
}

export type ColumnsConfig = Record<EntitlementKey, ColumnConfig>;

export interface ColumnItem {
  id: string;
  label: string;
}

export interface ColumnLookUpEntry {
  children: ColumnItem[];
  id: string;
  label: string;
  count: number;
}

export type ColumnsLookup = {
  [key: string]: ColumnLookUpEntry;
};

export interface ColumnsData {
  columnsLookup?: ColumnsLookup;
  uniqueRootColumnItems?: ColumnItem[];
}

export const columnsConfig: ColumnsConfig = {
  [Entitlements.functionalArea]: {
    childColumns: [Entitlements.department, Entitlements.subDepartment],
    parentColumns: [],
    directChild: Entitlements.department,
  },
  [Entitlements.department]: {
    childColumns: [Entitlements.subDepartment],
    parentColumns: [Entitlements.functionalArea],
    directChild: Entitlements.subDepartment,
    directParent: Entitlements.functionalArea,
  },
  [Entitlements.subDepartment]: {
    parentColumns: [Entitlements.functionalArea, Entitlements.department],
    directParent: Entitlements.department,
  },
};

export const rootColumn: EntitlementKey = Entitlements.functionalArea;

export type onToggleParams = {
  columnType: EntitlementKey;
  clickedItem: ColumnItem;
  selectedEntitlements?: EntitlementLevel[];
  clickedItemLookUpInfo?: ColumnLookUpEntry;
  activeEntitlement?: EntitlementLevel;
  setSelectedEntitlements: React.Dispatch<
    React.SetStateAction<EntitlementLevel[]>
  >;
  setActiveEntitlement: React.Dispatch<React.SetStateAction<EntitlementLevel>>;
  columnsConfig?: ColumnsConfig;
};
