import { Entitlements } from "./utils";
import MillerColumns from "./MillerColumns";
import useMillersColumn from "./useMillersColumn";

const Parent = () => {
  const {
    columnsData,
    selectedEntitlements,
    rootColumn,
    activeEntitlement,
    columnsConfig,
    getRenderItemInfo,
    sortEntitlementsByColumn,
    onToggleSelection,
    onRevokeSelectedEntitlement,
    userData,
    setSelectedEntitlements,
    setActiveEntitlement,
  } = useMillersColumn();

  return (
    <div>
      {activeEntitlement &&
        Object.entries(activeEntitlement)?.map((data) => {
          return (
            data[1] && (
              <>
                <span style={{ color: "black" }}>
                  `{data[0]} - {data[1]}`
                </span>
                <br />
              </>
            )
          );
        })}
      <ul style={{ color: "black" }}>
        {selectedEntitlements?.map((entitlement, index) => {
          return (
            <>
              {entitlement[Entitlements.functionalArea] && (
                <span key={entitlement[Entitlements.functionalArea]}>
                  {entitlement[Entitlements.functionalArea]} {">"}
                </span>
              )}

              {entitlement[Entitlements.department] && (
                <span key={entitlement[Entitlements.department]}>
                  {entitlement[Entitlements.department]}
                  {">"}
                </span>
              )}
              <span key={entitlement[Entitlements.subDepartment]}>
                {entitlement[Entitlements.subDepartment]}
              </span>
              <button
                onClick={() => {
                  const { foundInUserEntitlement, userEntitlementsToUpdate } =
                    onRevokeSelectedEntitlement({
                      entitlementToRevoke: entitlement,
                      userEntitlements: userData?.entitlements?.levels,
                    });

                  const updatedSelectedEntitlements = [...selectedEntitlements];

                  if (!foundInUserEntitlement) {
                    console.log("Item not in user Entitlement");

                    updatedSelectedEntitlements.splice(index, 1);
                    setSelectedEntitlements(updatedSelectedEntitlements);
                  } else {
                    // make an api call with payload : userEntitlementsToUpdate
                    // if success olny the update selectedEntitlement as in line 58

                    console.log("API success", index);
                    updatedSelectedEntitlements.splice(index, 1);
                    console.log(
                      updatedSelectedEntitlements,
                      "updatedSelectedEntitlements"
                    );
                    setSelectedEntitlements(updatedSelectedEntitlements);
                  }
                }}
              >
                Revoke
              </button>
              <br />
            </>
          );
        })}
      </ul>
      <MillerColumns
        columnsData={columnsData}
        rootColumn={rootColumn}
        activeEntitlement={activeEntitlement}
        columnsConfig={columnsConfig}
        getRenderItemInfo={getRenderItemInfo}
        sortEntitlementsByColumn={sortEntitlementsByColumn}
        onToggleSelection={onToggleSelection}
      />
    </div>
  );
};

export default Parent;
