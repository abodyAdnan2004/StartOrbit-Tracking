<script setup lang="ts">
import ChartCard from '~/common/components/app-chart/ChartCard.vue'

const lineChart = {
  type: 'line',
  height: 300,
  series: [
    {
      name: 'Revenue',
      data: [42000, 57000, 48000, 65000, 72000, 58000, 80000, 91000, 76000, 88000, 95000, 110000],
    },
  ],
  options: {
    chart: { toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#6366f1'],
    xaxis: {
      categories: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `$${(val / 1000).toFixed(0)}k`,
      },
    },
    tooltip: {
      y: { formatter: (val: number) => `$${val.toLocaleString()}` },
    },
    grid: { borderColor: '#e5e7eb' },
  },
}

const barChart = {
  type: 'bar',
  height: 300,
  series: [
    {
      name: 'Employees',
      data: [34, 22, 18, 47, 29, 15, 38],
    },
  ],
  options: {
    chart: { toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
    colors: ['#10b981'],
    xaxis: {
      categories: ['HR', 'IT', 'Finance', 'Sales', 'Marketing', 'Legal', 'Operations'],
    },
    yaxis: { labels: { formatter: (val: number) => `${val}` } },
    grid: { borderColor: '#e5e7eb' },
    dataLabels: { enabled: false },
  },
}

const areaChart = {
  type: 'area',
  height: 300,
  series: [
    { name: 'Hired', data: [4, 7, 5, 9, 6, 11, 8, 13, 10, 15, 12, 18] },
    { name: 'Resigned', data: [2, 3, 2, 4, 3, 5, 3, 6, 4, 7, 5, 6] },
  ],
  options: {
    chart: { toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#6366f1', '#f43f5e'],
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    xaxis: {
      categories: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ],
    },
    legend: { position: 'top' },
    grid: { borderColor: '#e5e7eb' },
    dataLabels: { enabled: false },
  },
}

const donutChart = {
  type: 'donut',
  height: 300,
  series: [150000, 200000, 75000, 120000, 90000],
  options: {
    chart: { toolbar: { show: false } },
    colors: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6'],
    labels: ['HR', 'IT', 'Marketing', 'Finance', 'Sales'],
    legend: { position: 'bottom' },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: { show: true, total: { show: true, label: 'Total', formatter: () => '$635k' } },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      y: { formatter: (val: number) => `$${(val / 1000).toFixed(0)}k` },
    },
  },
}
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <ChartCard title="Monthly Revenue" :chart-config="lineChart" />
      <ChartCard title="Department Headcount" :chart-config="barChart" />
      <ChartCard title="Hiring vs Resignations" :chart-config="areaChart" />
      <ChartCard title="Budget Allocation" :chart-config="donutChart" />
    </div>
  </div>
</template>
