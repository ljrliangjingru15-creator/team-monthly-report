# Monthly Report Export Design QA

- Source visual truth: `/var/folders/02/5h_prj010ls_vkh9c78kpshm0000gn/T/codex-clipboard-61b85627-ac38-44de-b94f-8bd4ef34c6e3.png`
- Browser-rendered PNG export: `/Users/jingru/Downloads/测试学生甲_美国本科新生_2027秋_反馈报告_20260707 (2).png`
- Basic-information spacing source PDF: `/Users/jingru/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_0583215832012_b839/temp/drag/余浩轩_美国本科新生_2027秋_反馈报告_20260707 (12).pdf`
- Post-fix basic-information PNG: `/Users/jingru/Downloads/测试学生甲_美国本科新生_2027秋_反馈报告_20260707 (3).png`
- Stress-test PDF export: `/Users/jingru/Downloads/测试学生甲_美国本科新生_2027秋_反馈报告_20260707 (3).pdf`
- Rendered stress-test PDF page: `/tmp/monthly-report-stress-page-1.png`
- Combined comparison: `/Users/jingru/Documents/申请进度管理/design-qa-compact-comparison-2026-07-15.png`
- Browser viewport: 1280 x 720
- State: six material rows with mixed statuses, multiline stage feedback, two-line next-stage plan, and five-line family cooperation content

**Full-view comparison evidence**

The supplied problem screenshot and the final one-page stress-test PDF render were normalized to the same height and placed side by side in the combined comparison. The final export keeps the same report hierarchy while removing excessive hero, timeline-node, section, and card spacing. The complete stress-test content fits on one A4 page with remaining whitespace at the bottom instead of splitting a text card across pages.

**Focused region comparison evidence**

- Material statuses render as filled rounded capsules in Canvas PNG and PDF output, matching preview semantics.
- Timeline nodes use shorter boxes and row spacing without clipping labels.
- Stage feedback and family cooperation cards expand according to wrapped-line count.
- The next-stage plan preserves two input lines and does not add bullets.
- Material and basic-information rows use adaptive row heights for longer values and remarks.
- Basic-information row height uses measured Canvas text width. `Ready Global Academy` remains a one-line value, so it no longer creates a false blank row before language scores.
- Selected-range color, bold, and underline are represented as styled text segments and shared by preview, HTML, PNG, and PDF rendering.

**Required fidelity surfaces**

- Fonts and typography: Existing font stack and hierarchy are preserved; compact mode reduces export font sizes only when the normal estimate exceeds one A4 page.
- Spacing and layout rhythm: Hero height, inter-card gaps, timeline boxes, and text-card minimum heights compress only under page pressure.
- Colors and visual tokens: Status capsule background and text colors use the same `statusStyles` tokens as the preview.
- Image quality and asset fidelity: The supplied New Oriental logo remains sharp and correctly proportioned.
- Copy and content: Multiline text remains intact; no synthetic bullets are added.

**Findings**

- No actionable P0, P1, or P2 mismatch remains for the reported export issues.
- [P3] Extremely long reports will still use multiple pages by design. The adaptive sizing prevents row overlap, and overflow continues on later PDF pages rather than being discarded.

**Primary interactions tested**

- Filled material rows with done, pending, and active states.
- Exported PNG and visually inspected status capsules and one-page layout.
- Exported PDF, verified valid A4 metadata and exactly one page for representative long content.
- Confirmed multiline next-stage plan has no automatic bullet prefix.
- Confirmed imported English school names and surrounding basic-information fields export with uniform one-line row spacing.
- Confirmed selected-range formatting leaves unselected text at its original style and survives export HTML generation.
- Checked browser console after exports: no errors.

**Comparison history**

1. Before: Canvas export used colored status text without capsule backgrounds; fixed minimum heights produced avoidable whitespace; A4 rounding created a nearly empty second page; next-stage lines received automatic bullets.
2. Fixes: Canvas status pills, content-pressure compact mode, adaptive row heights, exact A4 pixel floor, pagination tolerance, and plain multiline plan rendering.
3. Post-fix: 48 focused monthly-report tests pass, 172 project tests pass, production build passes, representative long PDF is one page, and combined visual comparison shows the requested density improvement.

final result: passed
