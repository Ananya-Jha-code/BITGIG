import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Hammer } from "lucide-react";

// Placeholder for routes that exist in the nav but are not built yet.
export default function ComingSoon({ title, description }) {
  return (
    <PageContainer className="flex flex-col gap-8">
      <PageHeader title={title} description={description} />
      <EmptyState icon={Hammer} title="Being built" description="This screen is next in the redesign." />
    </PageContainer>
  );
}
