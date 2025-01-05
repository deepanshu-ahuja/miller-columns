import {
  ColumnItem,
  ColumnLookUpEntry,
  ColumnsLookup,
  EntitlementKey,
  millerFuncTypes,
} from "./utils";
import "./millerColumn.scss";

const MillerColumn = ({
  items,
  columnsLookup,
  onToggleSelection,
  columnType,
  getRenderItemInfo,
  haveChildColumns,
  BASE_CLASS,
  parentColumns,
  sortEntitlementsByColumn,
}: {
  items: ColumnItem[];
  columnsLookup?: ColumnsLookup;
  BASE_CLASS: string;
  parentColumns: EntitlementKey[];
  haveChildColumns: boolean;
  sortEntitlementsByColumn: millerFuncTypes['sortEntitlementsByColumn'];
  columnType: EntitlementKey;
  onToggleSelection: millerFuncTypes["onToggleSelection"];
  getRenderItemInfo: millerFuncTypes['getRenderItemInfo']
}) => {
  return (
    <div className={`${BASE_CLASS}-container`}>
      {sortEntitlementsByColumn({
        entitlements: items,
        sortKey: "label",
      })?.map((item: ColumnItem) => {
        const itemLookupInfo = columnsLookup?.[`${columnType}-${item.id}`];

        const { buttonClass, textClass, checkboxClass, state } =
          getRenderItemInfo({
            columnType,
            itemValue: item.label,
            haveChildColumns,
            parentColumns,
          });

        return (
          <button
            key={item.id || item.label}
            onClick={() => {
              onToggleSelection({
                item,
                itemLookupInfo,
                columnType,
              });
            }}
            title={item.label}
            className={`${BASE_CLASS}-button ${`${BASE_CLASS}${buttonClass}`}`}
          >
            <div className={`${BASE_CLASS}-content`}>
              <div className={`${BASE_CLASS}-checkbox-container`}>
                <input
                  type="checkbox"
                  className={`
                   ${BASE_CLASS}${checkboxClass}`}
                />
              </div>
              <span
                className={`${textClass ? `${BASE_CLASS}${textClass}` : ""}`}
              >
                {item?.label}
              </span>
            </div>
            {haveChildColumns && state === "active" && (
              <div
                className={`${textClass ? `${BASE_CLASS}${textClass}` : ""}`}
              >
                {">"}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MillerColumn;
