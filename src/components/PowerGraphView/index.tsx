import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import type { CalculationResult } from '../../types/calculation';
import { calculatePowerConsumption } from '../../lib/powerCalculation';
import { formatNumber, formatPower } from '../../utils/format';
import { ItemIcon } from '../ItemIcon';
import { useGameDataStore } from '../../stores/gameDataStore';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface PowerGraphViewProps {
  calculationResult: CalculationResult;
}

// Color palette for the pie chart
const CHART_COLORS = [
  'rgb(59, 130, 246)',  // blue-500
  'rgb(139, 92, 246)',  // violet-500
  'rgb(236, 72, 153)',  // pink-500
  'rgb(251, 146, 60)',  // orange-500
  'rgb(34, 197, 94)',   // green-500
  'rgb(234, 179, 8)',   // yellow-500
  'rgb(20, 184, 166)',  // teal-500
  'rgb(244, 63, 94)',   // rose-500
  'rgb(168, 85, 247)',  // purple-500
  'rgb(14, 165, 233)',  // sky-500
];

export function PowerGraphView({ calculationResult }: PowerGraphViewProps) {
  const { t } = useTranslation();
  const { data: gameData } = useGameDataStore();

  const powerBreakdown = useMemo(() => {
    return calculatePowerConsumption(calculationResult.rootNode);
  }, [calculationResult]);

  const chartData = useMemo(() => {
    return {
      labels: powerBreakdown.byMachine.map(item => item.machineName),
      datasets: [
        {
          label: t('powerConsumptionKW'),
          data: powerBreakdown.byMachine.map(item => item.totalPower),
          backgroundColor: CHART_COLORS.slice(0, powerBreakdown.byMachine.length),
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
        },
      ],
    };
  }, [powerBreakdown, t]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgb(209, 213, 219)', // text-gray-300
          font: {
            size: 12,
          },
          padding: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)', // gray-900
        titleColor: 'rgb(243, 244, 246)', // gray-100
        bodyColor: 'rgb(229, 231, 235)', // gray-200
        borderColor: 'rgb(75, 85, 99)', // gray-600
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const percentage = powerBreakdown.byMachine[context.dataIndex].percentage;
            return `${formatPower(value)} (${percentage.toFixed(1)}%)`;
          }
        }
      },
    },
  };

  // Get machine icon by ID
  const getMachineIcon = (machineId: number) => {
    const machine = gameData?.machines.get(machineId);
    return machine?.id || machineId;
  };

  if (powerBreakdown.total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        {t('noPowerConsumptionData')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 rounded-xl p-6 border border-purple-500/20 dark:border-purple-500/30">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('totalPowerConsumption')}
          </h3>
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {formatPower(powerBreakdown.total)}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {formatNumber(powerBreakdown.total / 1000)} MW • {formatNumber(powerBreakdown.total / 1000000)} GW
        </div>
      </div>

      {/* Chart and Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('powerDistribution')}
          </h3>
          <div className="h-80">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('powerBreakdown')}
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-80">
            {powerBreakdown.byMachine.map((item, index) => (
              <div 
                key={item.machineId}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
              >
                {/* Color Indicator */}
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                
                {/* Machine Icon */}
                <ItemIcon itemId={getMachineIcon(item.machineId)} size={32} />
                
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.machineName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatNumber(item.machineCount)} {t('machines').toLowerCase()} × {formatPower(item.powerPerMachine)}
                  </div>
                </div>
                
                {/* Power and Percentage */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-gray-900 dark:text-gray-100">
                    {formatPower(item.totalPower)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
