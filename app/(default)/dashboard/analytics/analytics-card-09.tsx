'use client'

import DoughnutChart from '@/components/charts/doughnut-chart'

// Import utilities
import { getCssVariable } from '@/components/utils/utils'

export default function AnalyticsCard09() {

  const chartData = {
    labels: ['<18', '18-24', '24-36', '>35'],
    datasets: [
      {
        label: 'Visit By Age Category',
        data: [
          30, 50, 5, 15,
        ],
        backgroundColor: [
          getCssVariable('--color-violet-500'),
          getCssVariable('--color-sky-500'),
          getCssVariable('--color-red-500'),
          getCssVariable('--color-green-500'),
        ],
        hoverBackgroundColor: [
          getCssVariable('--color-violet-600'),
          getCssVariable('--color-sky-600'),
          getCssVariable('--color-red-600'),
          getCssVariable('--color-green-600'),
        ],
        borderWidth: 0,
      },
    ],
  }

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white shadow-sm rounded-xl">
      <header className="className="px-5 py-4 border-b border-gray-100 ">
        <h2 className="className="font-semibold text-gray-800 By Age</h2>">
      </header>
      {/* Chart built with Chart.js 3 */}
      {/* Change the height attribute to adjust the chart height */}
      <DoughnutChart data={chartData} width={389} height={260} />
    </div>
  )
}
