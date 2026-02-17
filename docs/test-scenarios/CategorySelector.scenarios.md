# Test Scenarios: CategorySelector

## Happy Path

1. [ ] Renders with initial props (name, color, isDeepWork)
   - Inputs: name="Work", color="#ff0000", isDeepWork=false
   - Expected: AutoComplete shows "Work", color picker hidden (existing category)

2. [ ] Selecting an existing category from suggestions
   - Inputs: User types query, selects existing category from dropdown
   - Expected: Emits update:name, update:color, update:isDeepWork with the selected category's values

3. [ ] Searching filters category suggestions
   - Inputs: searchCategory({ query: "wo" }) with "Work" category in store
   - Expected: filteredSuggestions contains "Work" match

4. [ ] Typing a new category name shows "create new" suggestion
   - Inputs: searchCategory({ query: "Unknown" }) with no matching categories
   - Expected: filteredSuggestions includes { name: "Unknown", isNew: true }

5. [ ] New category shows deep work toggle and color picker
   - Inputs: nameInput set to a name not in store
   - Expected: isNewCategory is true, deep-work-toggle and color-picker-row visible

6. [ ] Existing category hides deep work toggle and color picker
   - Inputs: nameInput matches an existing category
   - Expected: isNewCategory is false, deep-work-toggle and color-picker-row hidden

7. [ ] Color change emits update:color with # prefix
   - Inputs: colorInput changes to "abcdef"
   - Expected: Emits update:color with "#abcdef"

## Edge Cases

1. [ ] Empty name clears color and resets isDeepWork
   - Inputs: nameInput set to ""
   - Expected: Emits update:color("") and update:isDeepWork(false)

2. [ ] Name input receives object from AutoComplete (not string)
   - Inputs: nameInput is { name: "Work" } (AutoComplete selection object)
   - Expected: Extracts .name correctly, emits update:name("Work")

3. [ ] Props changing externally updates internal refs
   - Inputs: props.name changes from "Work" to "Health"
   - Expected: nameInput ref updates to "Health"

4. [ ] Color prop empty but name matches existing category
   - Inputs: props.color="" with name matching a store category
   - Expected: colorInput auto-fills from matching category's color

5. [ ] Color prop empty and name is new
   - Inputs: props.color="" with name not in store
   - Expected: colorInput gets a random color from settings store

6. [ ] Exact match in search does NOT add "create new" option
   - Inputs: searchCategory({ query: "Work" }) with "Work" in store
   - Expected: No isNew:true entry in filteredSuggestions

## UI/Interaction

1. [ ] Deep work checkbox emits update:isDeepWork on toggle
   - Inputs: Click checkbox when isNewCategory is true
   - Expected: Emits update:isDeepWork with toggled value
