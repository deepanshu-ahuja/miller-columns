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
  renderItemInfo,
  itemState,
  millerFuncTypes,
} from "./utils";

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
      if (!config) break;

      const parentValue = item?.[currentParentKey];
      const childKey = config.directChild;
      const childValue = childKey ? item?.[childKey] : undefined;

      if (parentValue && childKey) {
        const key = `${currentParentKey}-${parentValue}`;
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
          lookup[key].children.push({ id: childValue, label: childValue });

          lookup[key].count = lookup[key].children?.length ?? 0;
        }
      }

      currentParentKey = childKey as EntitlementKey;
    }
  });

  return { columnsLookup: lookup, uniqueRootColumnItems: uniqueRootColumns };
};

const isEntitlementContainsActiveParents = ({
  entitlement,
  parentColumns,
  activeEntitlement,
}: {
  entitlement: EntitlementLevel;
  parentColumns?: EntitlementKey[];
  activeEntitlement?: EntitlementLevel;
}) => {
  const matchesParents = parentColumns?.reduce(
    (acc, pColumn) =>
      acc && activeEntitlement?.[pColumn] === entitlement[pColumn],
    true
  );
  return !!matchesParents;
};

export const checkItemExistsInEntitlement = ({
  selectedEntitlements = [],
  activeEntitlement = {},
  columnsConfig,
  columnType,
  clickedItem,
}: onToggleParams) => {
  const { parentColumns, childColumns } = columnsConfig?.[columnType] || {};

  const hasItemInEntitlement = selectedEntitlements?.find((entitlement) => {
    const matchesParents = isEntitlementContainsActiveParents({
      entitlement,
      parentColumns,
      activeEntitlement,
    });

    if (!matchesParents) {
      return false;
    }

    return entitlement[columnType] === clickedItem.label;
  });

  if (!hasItemInEntitlement) {
    if (!parentColumns?.length) {
      return { hasItemInEntitlement, actionType: "add" };
    } else {
      const isParentWithDifferentChild =
        selectedEntitlements?.findIndex((entitlement) => {
          const matchesParents = isEntitlementContainsActiveParents({
            entitlement,
            parentColumns,
            activeEntitlement,
          });

          if (!matchesParents) {
            return false;
          }

          const anotherChildItem = entitlement[columnType];

          return anotherChildItem;
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

  const resetChildColumns = columnsConfig?.[columnType]?.childColumns?.reduce(
    (acc, childColumn) => ({ ...acc, [childColumn]: null }),
    {}
  );

  const newEntitlement: EntitlementLevel = {
    ...activeEntitlement,
    [columnType]: clickedItem.label,
    ...resetChildColumns,
  };

  switch (actionMeta?.actionType) {
    case "add": {
      let updatedEntitlements = [...selectedEntitlements, newEntitlement];
      updatedEntitlements = sortEntitlements({
        selectedEntitlements: updatedEntitlements,
        columnsConfig,
        rootColumn,
      });

      setSelectedEntitlements(updatedEntitlements);
      setActiveEntitlement(newEntitlement);
      break;
    }

    case "update": {
      let updatedEntitlements = [...selectedEntitlements];

      updatedEntitlements = sortEntitlements({
        selectedEntitlements,
        columnsConfig,
        rootColumn,
      });

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
        setSelectedEntitlements((prevSelected) => {
          const list = prevSelected.filter(
            (entitlementValue) =>
              entitlementValue[columnType] !== clickedItem.label
          );
          return sortEntitlements({
            selectedEntitlements: list,
            columnsConfig,
            rootColumn,
          });
        });
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

      updatedSelectedItems = sortEntitlements({
        selectedEntitlements: updatedSelectedItems,
        columnsConfig: columnsConfig,
        rootColumn,
      });

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

export const sortEntitlementsByColumn = ({
  entitlements,
  sortKey,
}: {
  entitlements: ColumnItem[];
  sortKey: keyof ColumnItem;
}) => {
  const sortedEntitlements = entitlements?.sort((entitlementA, entitlementB) =>
    entitlementA?.[sortKey]?.localeCompare(entitlementB?.[sortKey])
  );

  return sortedEntitlements;
};

export const sortEntitlements = ({
  selectedEntitlements,
  columnsConfig,
  rootColumn,
}: {
  selectedEntitlements: EntitlementLevel[];
  columnsConfig: ColumnsConfig;
  rootColumn: EntitlementKey;
}) => {
  if (selectedEntitlements?.length <= 1) {
    return selectedEntitlements;
  }
  const recursiveSort = (
    data: EntitlementLevel[],
    sortKey: keyof EntitlementLevel
  ): EntitlementLevel[] => {
    if (!sortKey) return data;

    const sortedData = [...data].sort((a, b) => {
      const valueA = a[sortKey] || "";
      const valueB = b[sortKey] || "";

      return valueA.localeCompare(valueB);
    });

    const groupedData = sortedData.reduce((acc, item) => {
      const key = item[sortKey] || "";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, EntitlementLevel[]>);

    const nextSortKey = columnsConfig[sortKey]?.directChild as
      | keyof EntitlementLevel
      | undefined;

    if (!nextSortKey) return Object.values(groupedData).flat();

    return Object.values(groupedData)
      .map((group: EntitlementLevel[]) => recursiveSort(group, nextSortKey))
      .flat();
  };

  return recursiveSort(selectedEntitlements, rootColumn);
};

const onRevokeSelectedEntitlement = ({
  entitlementToRevoke,
  userEntitlements,
}: {
  entitlementToRevoke: EntitlementLevel;
  userEntitlements?: EntitlementLevel[];
}) => {
  const userEntitlementsToUpdate: EntitlementLevel[] = [];
  let foundInUserEntitlement = false;

  if (!userEntitlements?.length) {
    return { foundInUserEntitlement };
  }

  const entitlementToRevokeKeys = Object.keys(
    entitlementToRevoke
  ) as EntitlementKey[];

  userEntitlements?.forEach((userEntitlement) => {
    const userEntitlementKeys = Object.keys(userEntitlement);

    if (entitlementToRevokeKeys.length !== userEntitlementKeys.length) {
      userEntitlementsToUpdate.push(userEntitlement);
    } else if (
      entitlementToRevokeKeys.every(
        (key) => entitlementToRevoke[key] === userEntitlement[key]
      )
    ) {
      foundInUserEntitlement = true;
    } else {
      userEntitlementsToUpdate.push(userEntitlement);
    }
  });

  return { foundInUserEntitlement, userEntitlementsToUpdate };
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

  const getRenderItemInfo = ({
    columnType,
    itemValue,
    haveChildColumns,
    parentColumns,
  }: {
    columnType: EntitlementKey;
    itemValue: string;
    haveChildColumns: boolean;
    parentColumns: EntitlementKey[];
  }) => {
    let state: itemState = "initial";
    const foundEntitlement = selectedEntitlements?.find(
      (entitlement: EntitlementLevel) => {
        const matchesParents = parentColumns?.length
          ? isEntitlementContainsActiveParents({
              entitlement,
              parentColumns,
              activeEntitlement,
            })
          : true;

        if (!matchesParents) {
          return false;
        }

        const itemsFound =
          matchesParents && entitlement?.[columnType] === itemValue;
        return itemsFound;
      }
    );

    if (foundEntitlement) {
      state = "selected";
      if (activeEntitlement?.[columnType] === itemValue) {
        state = "active";
      }
    }

    const { buttonClass, checkboxClass, textClass } = renderItemInfo?.[
      state
    ] || {
      buttonClass: "",
      checkboxClass: "",
      textClass: "",
    };

    return {
      state,
      buttonClass: haveChildColumns
        ? buttonClass
        : renderItemInfo?.["initial"]?.buttonClass,
      checkboxClass: haveChildColumns
        ? checkboxClass
        : state === "active"
        ? renderItemInfo?.["selected"]?.checkboxClass
        : checkboxClass,
      textClass: haveChildColumns
        ? textClass
        : state === "active"
        ? renderItemInfo?.["initial"]?.textClass
        : textClass,
    };
  };

  useEffect(() => {
    Promise.resolve(mockAllUserData).then((response) => {
      const columnsInfo = buildColumnsRelationship(
        mockAllUserData,
        rootColumn,
        columnsConfig
      );

      setColumnsData(columnsInfo);
    });

    Promise.resolve(mockedUserData).then((response: any) => {
      setUserData(response);
      let entitlements = response?.entitlements?.levels;

      entitlements = sortEntitlements({
        selectedEntitlements: entitlements,
        columnsConfig,
        rootColumn,
      });

      setSelectedEntitlements(entitlements);
    });
  }, []);

  const onToggleSelection: millerFuncTypes['onToggleSelection']= ({
    item,
    itemLookupInfo,
    columnType,
  }) => {
    toggleSelection({
      columnType,
      clickedItem: item,
      selectedEntitlements,
      clickedItemLookUpInfo: itemLookupInfo,
      activeEntitlement,
      setActiveEntitlement,
      columnsConfig,
      setSelectedEntitlements,
    });
  };

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
    getRenderItemInfo,
    sortEntitlements,
    sortEntitlementsByColumn,
    onToggleSelection,
    onRevokeSelectedEntitlement,
  };
};

export default useMillersColumn;
