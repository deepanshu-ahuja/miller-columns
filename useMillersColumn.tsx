import { useEffect, useState } from "react";
import { mockAllUserData, mockedUserData } from "./mock";
import {
  EntitlementKey,
  rootColumn,
  columnsConfig,
  EntitlementLevel,
  ColumnsConfig,
  ColumnsLookup,
  ColumnItem,
  ColumnsData,
  onToggleParams,
} from "./config";
import { getCheckedState } from "./utils";

type allUserDataType = {
  [key: string]: any;
} & EntitlementLevel;

export const buildColumnsRelationship = (
  data: allUserDataType[],
  rootColumn: EntitlementKey,
  columnsConfig: ColumnsConfig
): {
  columnsLookup: ColumnsLookup;
  uniqueRootColumnItems: ColumnItem[];
} => {
  const lookup: ColumnsLookup = {};

  const uniqueRootColumns: ColumnItem[] = [];

  data?.forEach((item) => {
    let currentParentKey: EntitlementKey | undefined = rootColumn;

    while (currentParentKey) {
      const config = columnsConfig?.[currentParentKey];
      if (!config) break; // Exit if no config exists for the current key

      const parentValue = item?.[currentParentKey];
      const childKey = config.directChild;
      const childValue = childKey ? item?.[childKey] : undefined;

      // Build parent-child relationship if valid
      if (parentValue && childKey) {
        const key = `${currentParentKey}-${parentValue}`;
        // Initialize key if not present
        if (!lookup[key]) {
          if (currentParentKey === rootColumn) {
            uniqueRootColumns?.push({ id: parentValue, label: parentValue });
          }

          lookup[key] = {
            children: [],
            id: parentValue,
            label: parentValue,
            count: 0,
          };
        }

        if (!childValue) {
          break;
        }
        if (!lookup[key].children.find((child) => child.id === childValue)) {
          // Add unique child value
          lookup[key].children.push({ id: childValue, label: childValue });

          lookup[key].count = lookup[key].children?.length ?? 0;
        }
      }

      // Move to the next child in the hierarchy
      currentParentKey = childKey as EntitlementKey;
    }
  });

  return { columnsLookup: lookup, uniqueRootColumnItems: uniqueRootColumns };
};

const isEntitlementContainsActiveParents = ({
  entitlement,
  parentColumns,
  activeEntitlement,
}) => {
  const matchesParents = parentColumns.reduce(
    (acc, pColumn) =>
      acc && activeEntitlement?.[pColumn] === entitlement[pColumn],
    true
  );
  return matchesParents;
};

export const checkItemExistsInEntitlement = ({
  selectedEntitlements = [],
  activeEntitlement = {},
  columnsConfig,
  columnType,
  clickedItem,
}: onToggleParams) => {
  const { parentColumns, childColumns } = columnsConfig?.[columnType] || {};

  const hasItemInEntitlement = selectedEntitlements?.find(
    (entitlement) => entitlement[columnType] === clickedItem.label
  );

  console.log("has", hasItemInEntitlement);
  if (!hasItemInEntitlement) {
    if (!parentColumns?.length) {
      console.log("have no parents", parentColumns);
      return { hasItemInEntitlement, actionType: "add" };
    } else {
      console.log("have  parents", parentColumns);
      const isParentWithDifferentChild =
        selectedEntitlements?.findIndex((entitlement) => {
          // Check if parent column values match

          const matchesParents = isEntitlementContainsActiveParents({
            entitlement,
            parentColumns,
            activeEntitlement,
          });

          // Check if a different child exists for the same parent
          const anotherChildItem = entitlement[columnType];

          return anotherChildItem && matchesParents;
        }) ?? -1;

      if (isParentWithDifferentChild >= 0) {
        return { hasItemInEntitlement, actionType: "add" };
      } else {
        return {
          hasItemInEntitlement,
          actionType: "update",
          index: selectedEntitlements?.findIndex((entitlement) =>
            parentColumns.reduce(
              (acc, pColumn) =>
                acc && activeEntitlement?.[pColumn] === entitlement[pColumn],
              true
            )
          ),
        };
      }
    }
  } else {
    if (!childColumns?.length) {
      return { hasItemInEntitlement, actionType: "remove" };
    }
    return {
      hasItemInEntitlement,
      actionType:
        activeEntitlement[columnType] === clickedItem.label
          ? "remove"
          : "setActive",
    };
  }
};

export const handleEntitlementUpdate = (
  params: onToggleParams,
  actionMeta: any
) => {
  const {
    setSelectedEntitlements,
    setActiveEntitlement,
    clickedItem,
    columnsConfig,
    activeEntitlement,
    selectedEntitlements = [],
    columnType,
  } = params || {};
  console.log("actionMeta", actionMeta);

  // Reset existing child columns based on the current column type
  const resetChildColumns = columnsConfig?.[columnType]?.childColumns?.reduce(
    (acc, childColumn) => ({ ...acc, [childColumn]: null }),
    {}
  );

  // Create a new entitlement object
  const newEntitlement: EntitlementLevel = {
    ...activeEntitlement,
    [columnType]: clickedItem.label,
    ...resetChildColumns,
  };

  switch (actionMeta?.actionType) {
    case "add": {
      setSelectedEntitlements((prev) => [...prev, newEntitlement]);
      setActiveEntitlement(newEntitlement);
      break;
    }

    case "update": {
      const updatedEntitlements = [...selectedEntitlements];
      if (actionMeta?.index !== undefined) {
        updatedEntitlements[actionMeta.index] = newEntitlement;
      }
      setSelectedEntitlements(updatedEntitlements);
      setActiveEntitlement(newEntitlement);
      break;
    }

    case "setActive": {
      setActiveEntitlement(newEntitlement);
      break;
    }

    case "remove": {
      const { parentColumns } = columnsConfig?.[columnType] || {};
      const removedEntitlement = newEntitlement;
      removedEntitlement[columnType] = null;
      setActiveEntitlement(removedEntitlement);

      if (!parentColumns?.length) {
        setSelectedEntitlements((prevSelected) =>
          prevSelected.filter(
            (entitlementValue) =>
              entitlementValue[columnType] !== clickedItem.label
          )
        );
        return;
      }
      let parentEntitlementCountInList = 0;
      const listOfItemsToRemove = selectedEntitlements?.filter(
        (entitlement) => {
          let matchesParents = false;
          let clickedItemFound = false;

          matchesParents = isEntitlementContainsActiveParents({
            entitlement,
            parentColumns,
            activeEntitlement,
          });
          if (matchesParents) {
            parentEntitlementCountInList++;
            clickedItemFound = entitlement[columnType] === clickedItem.label;
          }

          return clickedItemFound && matchesParents;
        }
      );
      console.log(
        "itemstoremove",
        listOfItemsToRemove,
        parentEntitlementCountInList
      );
      let updatedSelectedItems: EntitlementLevel[] = [];
      if (listOfItemsToRemove?.length === 1) {
        if (parentEntitlementCountInList > 1) {
          updatedSelectedItems = selectedEntitlements?.filter((entitlement) => {
            const clickedItemFound =
              entitlement[columnType] === clickedItem.label;

            if (!clickedItemFound) return true;

            const matchesParents = isEntitlementContainsActiveParents({
              entitlement,
              parentColumns,
              activeEntitlement,
            });

            return !matchesParents;
          });
        } else {
          updatedSelectedItems = selectedEntitlements?.map((entitlement) => {
            const clickedItemFound =
              entitlement[columnType] === clickedItem.label;

            if (!clickedItemFound) return entitlement;

            const matchesParents = isEntitlementContainsActiveParents({
              entitlement,
              parentColumns,
              activeEntitlement,
            });
            if (!matchesParents) return entitlement;

            return removedEntitlement;
          });
        }
      } else {
        updatedSelectedItems = selectedEntitlements?.filter((entitlement) => {
          const clickedItemFound =
            entitlement[columnType] === clickedItem.label;

          if (!clickedItemFound) return true;

          const matchesParents = isEntitlementContainsActiveParents({
            entitlement,
            parentColumns,
            activeEntitlement,
          });

          return !matchesParents;
        });
      }
      setSelectedEntitlements(updatedSelectedItems);

      break;
    }

    default:
      break;
  }
};

const toggleSelection = (params: onToggleParams) => {
  const actionMeta = checkItemExistsInEntitlement(params);

  handleEntitlementUpdate(params, actionMeta);
};

const useMillersColumn = () => {
  const [columnsData, setColumnsData] = useState<ColumnsData>({});
  const [selectedEntitlements, setSelectedEntitlements] = useState<
    EntitlementLevel[]
  >([]);
  const [activeEntitlement, setActiveEntitlement] = useState<EntitlementLevel>({
    functionalArea: null,
    department: null,
    subDepartment: null,
  });

  const [userData, setUserData] = useState<
    | {
        [key: string]: any;
        entitlements: { levels: EntitlementLevel[] };
      }
    | undefined
  >();

  // const updateEntitlementStates = ({
  //   setSelectedEntitlements,
  //   setActiveEntitlement,
  //   metaInfo,
  //   item,
  //   columnsConfig,
  //   activeEntitlement,
  //   selectedEntitlements,
  //   columnType,
  // }) => {
  //   const resetExisitingActiveChildColumns = columnsConfig?.[
  //     columnType
  //   ]?.childColumns?.reduce((obj, childColumn) => {
  //     return { ...obj, [childColumn]: null };
  //   }, {});

  //   if (metaInfo?.actionType === "add") {
  //     const entitlement = {
  //       ...activeEntitlement,
  //       [columnType]: item.label,
  //       ...resetExisitingActiveChildColumns,
  //     };

  //     setSelectedEntitlements((prev) => {
  //       return [...prev, entitlement];
  //     });
  //     setActiveEntitlement(entitlement);
  //   } else if (metaInfo?.actionType === "update") {
  //     const entitlement = {
  //       ...activeEntitlement,
  //       [columnType]: item.label,
  //       ...resetExisitingActiveChildColumns,
  //     };
  //     const updatedSelectedEntitlements = [...selectedEntitlements];
  //     const indexToUpdate = metaInfo?.index;
  //     updatedSelectedEntitlements[indexToUpdate] = entitlement;
  //     setSelectedEntitlements(updatedSelectedEntitlements);
  //     setActiveEntitlement(entitlement);
  //   } else if (metaInfo.actionType === "setActive") {
  //     const entitlement = {
  //       ...activeEntitlement,
  //       [columnType]: item.label,
  //       ...resetExisitingActiveChildColumns,
  //     };
  //     setActiveEntitlement(entitlement);
  //   } else if (metaInfo.actionType === "remove") {
  //     const entitlement = {
  //       ...activeEntitlement,
  //       [columnType]: null,
  //       ...resetExisitingActiveChildColumns,
  //     };
  //     setActiveEntitlement(entitlement);
  //   }
  // };
  useEffect(() => {
    // API to fetch data

    Promise.resolve(mockAllUserData).then((response) => {
      // Example Usage
      const columnsInfo = buildColumnsRelationship(
        mockAllUserData,
        rootColumn,
        columnsConfig
      );

      setColumnsData(columnsInfo);
    });

    Promise.resolve(mockedUserData).then((response: any) => {
      setUserData(response);
      setSelectedEntitlements(response?.entitlements?.levels);
    });
  }, []);

  return {
    columnsData,
    userData,
    setSelectedEntitlements,
    selectedEntitlements,
    rootColumn,
    columnsConfig,
    getCheckedState,
    activeEntitlement,
    setActiveEntitlement,
    toggleSelection,
  };
};

// Usage

export default useMillersColumn;
