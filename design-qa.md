# Monthly Report Design QA

- Source visual truth: `/var/folders/02/5h_prj010ls_vkh9c78kpshm0000gn/T/codex-clipboard-f627c63e-bb80-4caa-9037-49fceca611c6.png`
- Browser-rendered implementation screenshot: `/Users/jingru/Documents/申请进度管理/design-qa-basic-material-2026-07-15.png`
- Actual PNG export: `/Users/jingru/Downloads/测试学生甲_美国本科新生_2027秋_反馈报告_20260707.png`
- Actual PDF export: `/Users/jingru/Downloads/测试学生甲_美国本科新生_2027秋_反馈报告_20260707.pdf`
- Combined full-view comparison: `/Users/jingru/Documents/申请进度管理/design-qa-comparison-2026-07-15.png`
- Implementation URL: `http://127.0.0.1:3007/monthly-reports`
- Viewport: 1280 x 720
- State: default US undergraduate freshman report, both information modules enabled; secondary check with material collection disabled

**Full-view comparison evidence**

The source and the first 1240 x 1754 pixels of the actual PNG export were normalized to the same height and placed side by side in `design-qa-comparison-2026-07-15.png`. The requested information region preserves the Figma composition: two equal-width rounded cards on one row, aligned at the same top edge. Differences in timeline row count and empty-field content reflect current application data and the product's required default modules rather than layout drift.

**Focused region comparison evidence**

The browser capture shows the paired cards at the same `y=222.5`, the same `height=275`, and equal `width=564.5`. With material collection disabled, the basic information card expands to `width=1141`, reports `data-layout=full`, and the pair wrapper is removed. The actual PNG export independently shows the same two-column layout.

**Required fidelity surfaces**

- Fonts and typography: Existing Chinese/Arial fallback stack, weights, sizes, and hierarchy remain consistent across preview and export. No clipping or unintended wrapping is visible in the paired region.
- Spacing and layout rhythm: Equal tracks, 20px Canvas gap, aligned card tops, matching heights, rounded corners, and full-width fallback all pass.
- Colors and visual tokens: Existing theme colors, status colors, card borders, and highlighted states are preserved.
- Image quality and asset fidelity: The official New Oriental logo remains sharp and correctly scaled in the actual export; no substitute asset is used.
- Copy and content: The six required default basic-information labels appear and remain editable. Empty values render as `待填写`.

**Findings**

- No actionable P0, P1, or P2 mismatch remains for the requested two-column and fallback behavior.
- [P3] Real imported material remarks with unusually long text may increase visual density in the compact column. Existing wrapping keeps the content visible, but a future row-height refinement could make very long records more spacious.

**Primary interactions tested**

- Both modules enabled: paired layout rendered in preview.
- Material collection disabled: basic information expanded to full width.
- PNG selected and PDF deselected: export completed with the expected file name.
- PDF selected and PNG deselected: a valid two-page A4 PDF was generated; both pages were rendered and checked, with overflow content continuing at the top of page two.
- Console checked after layout toggle and export: no errors.

**Comparison history**

1. Earlier state: preview and exports rendered basic information and material collection as separate full-width rows.
2. Fixes: paired composition added to React preview, HTML export, Canvas PNG export, PDF source canvas, and export height estimation; single-module fallback retained.
3. Post-fix evidence: browser geometry checks, focused screenshot, actual PNG export, combined comparison image, 46 focused tests, and a successful production build.

**Implementation Checklist**

- [x] Pair basic information and material collection when both are enabled.
- [x] Use equal widths and equal heights.
- [x] Expand either lone module to the full report width.
- [x] Keep preview, HTML, PNG, and PDF rendering behavior synchronized.
- [x] Provide six editable default basic-information fields.
- [x] Verify the actual PNG export and browser console.

final result: passed
