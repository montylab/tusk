# Test Scenarios: TrashBasket

## Happy Path

1. [ ] **Renders trash icon and label**
   - Inputs: Mount
   - Expected: AppIcon(trash) and 'Delete' label visible

2. [ ] **Active state when currentZone is 'trash'**
   - Inputs: useDragOperator.currentZone = 'trash'
   - Expected: .trash-basket has class 'active'

3. [ ] **Registers zone on mount**
   - Inputs: Mount
   - Expected: registerZone called with 'trash'

4. [ ] **Unregisters zone on unmount**
   - Inputs: Unmount
   - Expected: unregisterZone called with 'trash'

## Edge Cases

1. [ ] **Updates bounds on resize**
   - Inputs: Trigger resize event
   - Expected: updateZoneBounds called
