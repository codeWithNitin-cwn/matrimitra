interface StatsCardsProps {
  totalProfiles: number;
  totalProposals: number;
  activePipelines: number;
}

export default function StatsCards({ totalProfiles, totalProposals, activePipelines }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500">Total Profiles</h3>
        <p className="text-3xl font-semibold text-gray-900 mt-2">{totalProfiles}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500">Total Proposals</h3>
        <p className="text-3xl font-semibold text-gray-900 mt-2">{totalProposals}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500">Active Pipelines</h3>
        <p className="text-3xl font-semibold text-gray-900 mt-2">{activePipelines}</p>
      </div>
    </div>
  );
}