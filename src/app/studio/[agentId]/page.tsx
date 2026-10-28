export default async function StudioPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  return (
    <section>
      <h1 className="text-4xl font-semibold">Your agent is created.</h1>
      <p className="label mt-3 text-mute">{agentId}</p>
    </section>
  );
}
