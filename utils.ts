export const getCheckedState = ({
  selectedEntitlements,
  key,
  value,
  activeEntitlement,
}) => {
  let state = "init";
  const foundEntitlement = selectedEntitlements?.find(
    (entitlement) => entitlement[key] === value
  );
  if (foundEntitlement) {
    state = "selected";
    if (activeEntitlement?.[key] === value) {
      state = "active";
    }
  }
  return state;
};

// const updateEntitlementStates = ({
