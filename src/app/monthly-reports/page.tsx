import type { Metadata } from "next";
import { MonthlyReportWorkspace } from "./monthly-report-workspace";

export const metadata: Metadata = {
  title: "沟通反馈/月度反馈生成工具",
  description: "新东方留学申请阶段性反馈报告生成工具",
};

export default function MonthlyReportsPage() {
  return <MonthlyReportWorkspace />;
}
