import React, { useState, useMemo, useEffect } from "react";

const data = [
  {
    functionalArea: "Transport",
    department: "Driving and road transport",
    subdepartment: "Road traffic",
  },
  {
    functionalArea: "Transport",
    department: "Driving and road transport",
    subdepartment: "Road transport and the environment",
  },
  {
    functionalArea: "Transport",
    department: "Transport planning",
    subdepartment: "",
  },
  {
    functionalArea: "Transport",
    department: "Transport security",
    subdepartment: "",
  },
  {
    functionalArea: "Environment",
    department: "Climate action",
    subdepartment: "Carbon emissions",
  },
];

const columnsConfig = {
  functionalArea: {
    childColumns: ["department", "subdepartement"],
    parentColumns: [],
    directChild: "department",
  },
  department: {
    childColumns: ["subdepartement"],
    parentColumns: ["functionalArea"],
    directChild: "subdepartment",
    getUniqueColumns: (data, clickedItem) =>
      data?.entitlement?.functionalArea === clickedItem.id,
  },
  subdepartment: { parentColumns: ["functionalArea", "department"] },
};
const onColumnInputItemClicked = ({
  columnType,
  item,
  inputColumnState,
  metsInfo,
}) => {
  let updatedInputColumnState = [...inputColumnState];

  const {
    uniqueItemsForColumns,
    parentChildMapperCache,
    apiData,
    setUniqueItemsForColumns,
    setParentChildCache,
  } = metsInfo || {};

  const itemFound = inputColumnState?.findIndex(
    (value) => value?.[columnType] === item?.id
  );
  if (itemFound >= 0) {
    if (
      inputColumnState.length === 1 &&
      !columnsConfig?.[columnType]?.parentColumns?.length
    ) {
      updatedInputColumnState = [];
    } else {
      if (!columnsConfig?.[columnType]?.parentColumns?.length) {
        updatedInputColumnState = updatedInputColumnState.filter(
          (_, index) => index !== itemFound
        );
      } else {
        const restFields = {};
        columnsConfig?.[columnType]?.childColumns?.forEach((columnKey) => {
          restFields[columnKey] = "";
        });
        updatedInputColumnState[itemFound] = {
          ...updatedInputColumnState[itemFound],
          [columnType]: "",
          ...restFields,
        };
      }
    }
  } else {
    if (item.id) {
      updatedInputColumnState.push({ [columnType]: item.id });
      const directChild = columnsConfig?.[columnType]?.directChild;
      if (directChild) {
        console.log("inside i");
        let childUniqueColumnItems = {};
        if (!parentChildMapperCache?.[columnType]?.[item.id]) {
          const getUniqueColumns =
            columnsConfig?.[directChild]?.getUniqueColumns;
          const childUniqueColumnItems = getUniqueItemsForColumns(
            apiData,
            [{ key: directChild }],
            (data) => getUniqueColumns(data, item)
          );
          setParentChildCache();
        } else {
        }
        setUniqueItemsForColumns((prev) => {
          return { ...prev, ...childUniqueColumnItems };
        });

        console.log("childunique", childUniqueColumnItems);
      }
    }
  }
  return updatedInputColumnState;
};

const getUniqueItemsForColumns = (data, columnTypes, predicate) => {
  const uniqueItems = {};
  const counts = {};

  // Initialize structures for unique items and counts
  columnTypes.forEach((column) => {
    const columnKey = column.key;
    uniqueItems[columnKey] = [];
    counts[columnKey] = {};
  });

  // Populate unique items and count occurrences
  columnTypes.forEach((column) => {
    const columnKey = column.key;

    data.forEach((item) => {
      const value = item[columnKey];
      console.log(
        typeof predicate === "function" && predicate({ entitlement: item }),
        "predic"
      );
      if (
        value &&
        (!predicate ||
          (typeof predicate === "function" && predicate({ entitlement: item })))
      ) {
        // Add to unique items if not already present
        if (!uniqueItems[columnKey].includes(value)) {
          uniqueItems[columnKey].push(value);
        }

        // Increment count
        counts[columnKey][value] = (counts[columnKey][value] || 0) + 1;
      }
    });
  });

  // Add expandable flag to each unique item
  const result = {};
  Object.keys(uniqueItems).forEach((columnKey) => {
    result[columnKey] = uniqueItems[columnKey].map((item) => ({
      name: item,
      id: item,
      count: counts[columnKey][item],
      expandable: counts[columnKey][item] > 1, // Expandable if count > 1
    }));
  });

  return result;
};

const MultiColumnTree = () => {
  const [activeItems, setActiveItems] = useState({
    functionalArea: null,
    department: null,
    subdepartment: null,
  });

  const [selectedItems, setSelectedItems] = useState({
    functionalArea: [],
    department: [],
    subdepartment: [],
  });

  // Toggle checkbox selection
  const toggleSelection = (column, value) => {
    const isSelected = selectedItems[column].includes(value);

    if (column === "functionalArea") {
      setSelectedItems((prev) => ({
        functionalArea: isSelected
          ? prev.functionalArea.filter((item) => item !== value)
          : [...prev.functionalArea, value],
        department: isSelected
          ? prev.department.filter((dept) =>
              data
                .filter((item) => item.functionalArea === value)
                .map((item) => item.department)
                .includes(dept)
            )
          : prev.department,
        subdepartment: isSelected
          ? prev.subdepartment.filter((subdept) =>
              data
                .filter((item) => item.functionalArea === value)
                .map((item) => item.subdepartment)
                .includes(subdept)
            )
          : prev.subdepartment,
      }));

      if (isSelected) {
        // Deselecting the parent collapses its children
        setActiveItems((prev) => ({
          functionalArea: null,
          department: null,
          subdepartment: null,
        }));
      }
    } else if (column === "department") {
      setSelectedItems((prev) => ({
        ...prev,
        department: isSelected
          ? prev.department.filter((item) => item !== value)
          : [...prev.department, value],
        subdepartment: isSelected
          ? prev.subdepartment.filter((subdept) =>
              data
                .filter((item) => item.department === value)
                .map((item) => item.subdepartment)
                .includes(subdept)
            )
          : prev.subdepartment,
      }));

      if (isSelected) {
        // Deselecting the department collapses its children
        setActiveItems((prev) => ({
          ...prev,
          department: null,
          subdepartment: null,
        }));
      }
    } else if (column === "subdepartment") {
      setSelectedItems((prev) => ({
        ...prev,
        subdepartment: isSelected
          ? prev.subdepartment.filter((item) => item !== value)
          : [...prev.subdepartment, value],
      }));
    }
  };

  // Handle item click for active state
  const handleClick = (column, value) => {
    setActiveItems((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  // Determine the color of an item
  const getColor = (column, value) => {
    if (activeItems[column] === value) {
      return "yellow"; // Currently active
    }
    if (selectedItems[column].includes(value)) {
      return "blue"; // Parent of selected children or selected item
    }
    return "white"; // Default
  };

  const functionalAreas = Array.from(
    new Set(data.map((item) => item.functionalArea))
  );

  const departments =
    activeItems.functionalArea &&
    Array.from(
      new Set(
        data
          .filter((item) => item.functionalArea === activeItems.functionalArea)
          .map((item) => item.department)
      )
    );

  const subdepartments =
    activeItems.department &&
    data
      .filter(
        (item) =>
          item.functionalArea === activeItems.functionalArea &&
          item.department === activeItems.department
      )
      .map((item) => item.subdepartment)
      .filter((sub) => sub);

  //   const uniqueItemsForColumns= getUniqueItemsForColumns(data, [{key: 'functionalArea'}, {key: 'department'}, {key: 'subdepartment'}])
  //   console.log("unique", uniqueItemsForColumns, data)

  const [uniqueItemsForColumns, setUniqueItemsForColumns] = useState({
    functionalArea: [],
    department: [],
    subdepartment: [],
  });

  useEffect(() => {
    //when data changes from api
    const uniqueItems = getUniqueItemsForColumns(data, [
      { key: "functionalArea" },
    ]);
    setUniqueItemsForColumns(uniqueItems);
  }, [data]);

  const [parentChildMapperCache, setParentChildCache] = useState({
    functionalArea: {},
    department: {},
    subdepartment: {},
  });

  console.log("unique items", uniqueItemsForColumns);
  const [inputColumnState, setInputColumnState] = useState([]);

  const tpggleSelectionV2 = (columnType, item, inputColumnState) => {
    const newColumnsInputState = onColumnInputItemClicked({
      columnType,
      item,
      inputColumnState,
      metsInfo: {
        uniqueItemsForColumns,
        parentChildMapperCache,
        setParentChildCache,
        setUniqueItemsForColumns,
        apiData: data,
      },
    });

    setInputColumnState(newColumnsInputState);
  };

  console.log("input", inputColumnState);

  return (
    <div style={{ display: "flex", gap: "16px" }}>
      {/* Functional Area */}
      <div>
        <h3>Functional Area</h3>
        <ul>
          {uniqueItemsForColumns?.functionalArea.map((area) => (
            <li
              key={area.id}
              style={{
                display: "flex",
                alignItems: "center",
                // backgroundColor: getColor("functionalArea", area),
                padding: "8px",
                cursor: "pointer",
              }}
              onClick={() => {
                tpggleSelectionV2("functionalArea", area, inputColumnState);
                // handleClick("functionalArea", area);
              }}
            >
              {/* <input
                type="checkbox"
                checked={selectedItems.functionalArea.includes(area)}
                onChange={() => toggleSelection("functionalArea", area)}
                style={{ marginRight: "8px" }}
              /> */}
              {area.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Department */}
      {uniqueItemsForColumns?.department && (
        <div>
          <h3>Department</h3>
          <ul>
            {uniqueItemsForColumns?.department.map((dept) => (
              <li
                key={dept.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  //   backgroundColor: getColor("department", dept),
                  padding: "8px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  tpggleSelectionV2("department", dept, inputColumnState);
                  // handleClick("functionalArea", area);
                }}
                // onClick={() => {
                //   toggleSelection("department", dept);
                //   handleClick("department", dept);
                // }}
              >
                {/* <input
                  type="checkbox"
                  checked={selectedItems.department.includes(dept)}
                  onChange={() => toggleSelection("department", dept)}
                  style={{ marginRight: "8px" }} */}
                {/* /> */}
                {dept.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Subdepartment */}
      {uniqueItemsForColumns?.subdepartment && (
        <div>
          <h3>Subdepartment</h3>
          <ul>
            {uniqueItemsForColumns?.subdepartment.map((subdept) => (
              <li
                key={subdept.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  //   backgroundColor: getColor("subdepartment", subdept),
                  padding: "8px",
                  cursor: "pointer",
                }}
                onClick={() => {
                  tpggleSelectionV2("subdepartment", subdept, inputColumnState);
                  // handleClick("functionalArea", area);
                }}
                //
                // onClick={() => {
                //   toggleSelection("subdepartment", subdept);
                //   handleClick("subdepartment", subdept);
                // }}
              >
                {/* <input
                  type="checkbox"
                  checked={selectedItems.subdepartment.includes(subdept)}
                //   onChange={() => toggleSelection("subdepartment", subdept)} */}
                {/* style={{ marginRight: "8px" }} */}
                {/* /> */}
                {subdept.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiColumnTree;
