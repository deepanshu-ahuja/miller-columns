import { Entitlements } from "./config";
import useMillersColumn from "./useMillersColumn";

const MillersColumn = () => {
  const {
    columnsData,
    userData,
    selectedEntitlements,
    setSelectedEntitlements,
    rootColumn,
    getCheckedState,
    activeEntitlement,
    setActiveEntitlement,
    toggleSelection,
    columnsConfig,
  } = useMillersColumn();

  const { columnsLookup } = columnsData || {};

  return (
    <div style={{ display: "flex", gap: "16px" }}>
      {activeEntitlement &&
        Object.entries(activeEntitlement)?.map((data) => {
          return (
            data[1] && (
              <>
                <span>
                  `{data[0]} - {data[1]}`
                </span>
                <br />
              </>
            )
          );
        })}

      {/* Functional Area */}
      <div>
        <ul>
          {selectedEntitlements?.map((entitlement) => {
            return (
              <>
                <span key={entitlement[Entitlements.functionalArea]}>
                  {entitlement[Entitlements.functionalArea]} {">"}
                </span>

                <span key={entitlement[Entitlements.department]}>
                  {entitlement[Entitlements.department]}
                  {">"}
                </span>

                <span key={entitlement[Entitlements.subDepartment]}>
                  {entitlement[Entitlements.subDepartment]}
                </span>
                <br />
              </>
            );
          })}
        </ul>

        <div style={{ display: "flex", gap: "16px" }}>
          <ul>
            {columnsData?.uniqueRootColumnItems?.map((item) => {
              const itemLookupInfo =
                columnsLookup?.[`${rootColumn}-${item.id}`];

              return (
                <li
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    // backgroundColor: getColor("functionalArea", area),
                    padding: "8px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    toggleSelection({
                      columnType: rootColumn,
                      clickedItem: item,
                      selectedEntitlements,
                      clickedItemLookUpInfo: itemLookupInfo,
                      activeEntitlement,
                      setActiveEntitlement,
                      columnsConfig,
                      setSelectedEntitlements,
                    });
                    // handleClick("functionalArea", area);
                  }}
                >
                  {/* <input
                type="checkbox"
                checked={selectedItems.functionalArea.includes(area)}
                onChange={() => toggleSelection("functionalArea", area)}
                style={{ marginRight: "8px" }}
              /> */}
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      // backgroundColor: getColor("functionalArea", area),
                      padding: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {getCheckedState({
                      selectedEntitlements,
                      key: rootColumn,
                      value: item.id,
                      activeEntitlement,
                    })}
                  </span>
                  {item.label}
                  {itemLookupInfo?.count > 0 && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        // backgroundColor: getColor("functionalArea", area),
                        padding: "8px",
                        cursor: "pointer",
                      }}
                    >
                      {">"}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {[Entitlements.department, Entitlements.subDepartment].map(
            (entityType) => {
              const parentKey = columnsConfig[entityType]?.directParent;
              const activeValue = parentKey && activeEntitlement?.[parentKey];
              const lookupKey = !activeValue
                ? ""
                : `${parentKey}-${activeValue}`;
              const entitlementParentInfo =
                lookupKey && columnsLookup?.[lookupKey];

              return (
                <ul>
                  {entitlementParentInfo?.children?.map((item) => {
                    const itemLookupInfo =
                      columnsLookup?.[`${entityType}-${item.id}`];

                    return (
                      <li
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          // backgroundColor: getColor("functionalArea", area),
                          padding: "8px",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          toggleSelection({
                            columnType: entityType,
                            clickedItem: item,
                            selectedEntitlements,
                            clickedItemLookUpInfo: itemLookupInfo,
                            activeEntitlement,
                            setActiveEntitlement,
                            columnsConfig,
                            setSelectedEntitlements,
                          });
                          // handleClick("functionalArea", area);
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            // backgroundColor: getColor("functionalArea", area),
                            padding: "8px",
                            cursor: "pointer",
                          }}
                        >
                          {getCheckedState({
                            selectedEntitlements,
                            key: entityType,
                            value: item.id,
                            activeEntitlement,
                          })}
                        </span>
                        {item.label}
                        {itemLookupInfo?.count > 0 && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              // backgroundColor: getColor("functionalArea", area),
                              padding: "8px",
                              cursor: "pointer",
                            }}
                          >
                            {">"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default MillersColumn;
