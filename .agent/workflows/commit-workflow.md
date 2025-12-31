---
description: Commit workflow and layout debugging strategy
---

# Commit Workflow

When changes are agreed upon:
// turbo-all
1. Stage the changed files: `git add <files>`
2. Commit with a descriptive message: `git commit -m "<message>"`
3. Push to remote: `git push`
4. **Always provide the commit ID** to the user after pushing

# Layout Debugging Strategy

If we get stuck on layout/styling issues (more than **2 commits** attempting to fix the same layout problem):

1. **Switch to debug color mode** - Apply distinct, highly visible background colors to the problematic elements:
   - Use colors like `#fef3c7` (yellow), `#dbeafe` (blue), `#d1fae5` (green), `#fee2e2` (red), `#f3e8ff` (purple)
   - Add visible borders: `border: 3px solid <color>`
   - Add color labels in text so user can identify which element is which

2. Ask the user to identify which colored element has the issue

3. Once identified, fix the specific element and remove debug colors
