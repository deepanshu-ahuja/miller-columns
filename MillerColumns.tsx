import { BASE_CLASS, Entitlements, millerColumnsProps } from "./utils";
import MillerColumn from "./MillerColumn";

const MillerColumns = ({
  columnsData,
  rootColumn,
  activeEntitlement,
  columnsConfig,
  getRenderItemInfo,
  sortEntitlementsByColumn,
  onToggleSelection,
}: millerColumnsProps) => {
  const { columnsLookup } = columnsData || {};

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        width: "100%",
        backgroundColor: "white",
      }}
    >
      <div style={{ color: "black" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              gap: "40px",
            }}
          >
            <MillerColumn
              items={columnsData?.uniqueRootColumnItems || []}
              columnsLookup={columnsLookup}
              columnType={rootColumn}
              onToggleSelection={onToggleSelection}
              getRenderItemInfo={getRenderItemInfo}
              haveChildColumns={
                !!columnsConfig?.[rootColumn]?.childColumns?.length
              }
              BASE_CLASS={BASE_CLASS}
              parentColumns={[]}
              sortEntitlementsByColumn={sortEntitlementsByColumn}
            />
            {[Entitlements.department, Entitlements.subDepartment].map(
              (entityType) => {
                const parentKey = columnsConfig[entityType]?.directParent;
                const parentColumns = columnsConfig[entityType]?.parentColumns;
                const activeValue = parentKey && activeEntitlement?.[parentKey];
                const lookupKey = !activeValue
                  ? ""
                  : `${parentKey}-${activeValue}`;
                const entitlementParentInfo =
                  lookupKey && columnsLookup?.[lookupKey];
                const haveChildColumns =
                  columnsConfig?.[entityType]?.childColumns?.length;

                return (
                  entitlementParentInfo &&
                  entitlementParentInfo?.children?.length > 0 && (
                    <MillerColumn
                      items={entitlementParentInfo.children || []}
                      columnsLookup={columnsLookup}
                      columnType={entityType}
                      onToggleSelection={onToggleSelection}
                      getRenderItemInfo={getRenderItemInfo}
                      haveChildColumns={haveChildColumns}
                      BASE_CLASS={BASE_CLASS}
                      parentColumns={parentColumns}
                      sortEntitlementsByColumn={sortEntitlementsByColumn}
                    />
                  )
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MillerColumns;
