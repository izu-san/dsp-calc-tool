import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import type { CalculationResult } from '../../types/calculation';
import { calculatePowerConsumption } from '../../lib/powerCalculation';
import { formatNumber, formatPower, formatBuildingCount } from '../../utils/format';
import { ItemIcon } from '../ItemIcon';
import { useGameDataStore } from '../../stores/gameDataStore';
import { useSettingsStore } from '../../stores/settingsStore';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface PowerGraphViewProps {
  calculationResult: CalculationResult;
}

// SF-themed color palette for the pie chart
const CHART_COLORS = [
  'rgb(0, 136, 255)',   // neon-blue
  'rgb(0, 217, 255)',   // neon-cyan
  'rgb(233, 53, 255)',  // neon-magenta
  'rgb(255, 107, 53)',  // neon-orange
  'rgb(0, 255, 136)',   // neon-green
  'rgb(255, 215, 0)',   // neon-yellow
  'rgb(168, 85, 247)',  // neon-purple
  'rgb(255, 0, 255)',   // bright-magenta
  'rgb(0, 255, 255)',   // bright-cyan
  'rgb(255, 128, 0)',   // bright-orange
];

export function PowerGraphView({ calculationResult }: PowerGraphViewProps) {
  const { t } = useTranslation();
  const { data: gameData } = useGameDataStore();
  const { settings } = useSettingsStore();

  const powerBreakdown = useMemo(() => {
    return calculatePowerConsumption(calculationResult.rootNode, settings);
  }, [calculationResult, settings]);

  const chartData = useMemo(() => {
    return {
      labels: powerBreakdown.byMachine.map(item => item.machineName),
      datasets: [
        {
          label: t('powerConsumptionKW'),
          data: powerBreakdown.byMachine.map(item => item.totalPower),
          backgroundColor: CHART_COLORS.slice(0, powerBreakdown.byMachine.length),
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 2,
          hoverBorderColor: 'rgba(255, 255, 255, 0.5)',
          hoverBorderWidth: 3,
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
          color: 'rgb(180, 197, 228)', // space-200
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          padding: 10,
          usePointStyle: true,
          pointStyle: 'circle' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)', // dark-800
        titleColor: 'rgb(255, 255, 255)', // white
        bodyColor: 'rgb(180, 197, 228)', // space-200
        borderColor: 'rgba(0, 217, 255, 0.5)', // neon-cyan
        borderWidth: 2,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: { parsed: number; dataIndex: number }) {
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
      <div className="flex items-center justify-center h-64 text-space-300 bg-dark-700/50 backdrop-blur-sm border border-neon-purple/30 rounded-lg">
        {t('noPowerConsumptionData')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 backdrop-blur-sm rounded-xl p-6 border border-neon-purple/40 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>⚡</span>
            {t('totalPowerConsumption')}
          </h3>
          <div className="text-3xl font-bold text-white drop-shadow-[0_0_8px_rgba(0,217,255,0.6)]">
            {formatPower(powerBreakdown.total)}
          </div>
        </div>
        <div className="mt-2 text-sm text-space-200">
          {formatNumber(powerBreakdown.total / 1000)} MW • {formatNumber(powerBreakdown.total / 1000000)} GW
        </div>
      </div>

      {/* Chart and Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-dark-700/50 backdrop-blur-sm rounded-xl p-6 border border-neon-cyan/30 shadow-[0_0_20px_rgba(0,217,255,0.2)]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span>
            {t('powerDistribution')}
          </h3>
          <div className="h-80">
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-dark-700/50 backdrop-blur-sm rounded-xl p-6 border border-neon-green/30 shadow-[0_0_20px_rgba(0,255,136,0.2)]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>⚙️</span>
            {t('powerBreakdown')}
          </h3>
          <div className="space-y-3 overflow-y-auto max-h-80">
            {powerBreakdown.byMachine.map((item, index) => (
              <div 
                key={item.machineId}
                className="flex items-center gap-3 p-3 rounded-lg bg-dark-800/50 border border-neon-blue/20 hover:border-neon-blue/40 transition-all"
              >
                {/* Color Indicator */}
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                
                {/* Machine Icon */}
                <ItemIcon itemId={getMachineIcon(item.machineId)} size={32} />
                
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {item.machineName}
                  </div>
                  <div className="text-sm text-space-300">
                    {formatBuildingCount(item.machineCount)} {t('machines').toLowerCase()} × {formatPower(item.powerPerMachine)}
                  </div>
                </div>
                
                {/* Power and Percentage */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-neon-yellow drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]">
                    {formatPower(item.totalPower)}
                  </div>
                  <div className="text-sm text-space-200">
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
