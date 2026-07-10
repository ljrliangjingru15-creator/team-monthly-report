import * as XLSX from "xlsx";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { buildCounselorWorkbook } from "../fixtures/build-workbooks";
import { UploadPreviewPanel } from "@/app/import/upload-preview-panel";

function workbookFile() {
  const workbookData = XLSX.write(buildCounselorWorkbook(), {
    type: "array",
    bookType: "xlsx",
  }) as ArrayBuffer;

  return new File([workbookData], "顾问进度表.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("upload preview panel", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows layout and preview summary after selecting an Excel file", async () => {
    render(<UploadPreviewPanel season="2027 Fall" />);

    fireEvent.change(screen.getByLabelText("选择 Excel 文件"), {
      target: {
        files: [workbookFile()],
      },
    });

    await waitFor(() => {
      expect(screen.getByText("已识别：顾问进度表")).toBeInTheDocument();
    });

    expect(screen.getByText("新增学生")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("敏感字段已拦截")).toBeInTheDocument();
  });

  it("creates a no-database confirmation draft from the preview", async () => {
    render(<UploadPreviewPanel season="2027 Fall" />);

    fireEvent.change(screen.getByLabelText("选择 Excel 文件"), {
      target: {
        files: [workbookFile()],
      },
    });

    await waitFor(() => {
      expect(screen.getByText("已识别：顾问进度表")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "生成确认草稿" }));

    expect(screen.getByText("确认草稿已生成")).toBeInTheDocument();
    expect(screen.getByText("将创建学生：2")).toBeInTheDocument();
    expect(screen.getByText("将创建申请项：2")).toBeInTheDocument();
    expect(screen.getByText("当前没有写入数据库")).toBeInTheDocument();
  });
});
