'use client'

import PieChart from '@/components/charts/pie-chart'

// Import utilities
import { getCssVariable } from '@/components/utils/utils'

export default function FintechCard09() {

  const chartData = {
    labels: ['Cash', 'Commodities', 'Bonds', 'Stock'],
    datasets: [
      {
        label: 'Sessions By Device',
        data: [12, 13, 10, 65],
        backgroundColor: [
          getCssVariable('--color-green-400'),
          getCssVariable('--color-yellow-400'),
          getCssVariable('--color-sky-500'),
          getCssVariable('--color-violet-500'),
        ],
        hoverBackgroundColor: [
          getCssVariable('--color-green-500'),
          getCssVariable('--color-yellow-500'),
          getCssVariable('--color-sky-600'),
          getCssVariable('--color-violet-600'),
        ],
        borderWidth: 0,
      },
    ],
  }

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 flex items-center">
        <h2 className="font-semibold text-gray-800">Total Value</h2>
      </header>
      <div className="px-5 py-3">
        <div className="text-sm italic mb-2">Hey Mark, here is the value of your portfolio:</div>
        <div className="text-3xl font-bold text-gray-800">$24,529.41</div>
      </div>
      {/* Chart built with Chart.js 3 */}
      {/* Change the height attribute to adjust the chart height */}
      <PieChart data={chartData} width={389} height={220} />
    </div>
  )
}
