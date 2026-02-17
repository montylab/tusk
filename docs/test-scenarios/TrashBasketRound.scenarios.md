# Test Scenarios: TrashBasketRound

## Happy Path

1. [ ] **Renders round basket**
   - Inputs: Mount
   - Expected: .trash-basket-round rendered with trash icon

2. [ ] **'is-over' class when currentZone is 'trash'**
   - Inputs: useDragOperator.currentZone = 'trash'
   - Expected: .trash-basket-round has class 'is-over'

3. [ ] **'is-destroying' class when destroying**
   - Inputs: useDragOperator.isDestroying = true
   - Expected: .trash-basket-round has class 'is-destroying'

4. [ ] **Registers zone on mount**
   - Inputs: Mount
   - Expected: registerZone called with 'trash'

## Edge Cases

1. [ ] **Updates bounds on mouseover**
   - Inputs: Mouseover event
   - Expected: updateZoneBounds called
