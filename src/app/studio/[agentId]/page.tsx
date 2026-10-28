import { Studio } from "@/components/studio/Studio";

export default async function StudioPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  return <Studio agentId={agentId} />;
}
