<template>
    <div class="card flex justify-center">
        <Chart type="doughnut" :data="chartData" :options="chartOptions" class="w-full md:w-[30rem]" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

interface CategoryTotal {
  category_id: string | number;
  category_name: string;
  total_amount: number;
  formatted_amount: string;
}

const props = defineProps<{
  categoryTotals: CategoryTotal[];
}>();

const chartData = ref();
const chartOptions = ref<{
  plugins: {
    legend: {
      labels: {
        color: string;
      };
    };
    tooltip: {
      callbacks: {
        label: (context: any) => string;
      };
    };
  };
  cutout: string;
} | undefined>(undefined);

onMounted(() => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});

// Watch for changes in categoryTotals and update chart
watch(() => props.categoryTotals, () => {
    chartData.value = setChartData();
}, { deep: true });

const setChartData = () => {
    const documentStyle = getComputedStyle(document.body);
    
    // If no category data, show empty state
    if (!props.categoryTotals || props.categoryTotals.length === 0) {
        return {
            labels: ['No Data'],
            datasets: [
                {
                    data: [1],
                    backgroundColor: [documentStyle.getPropertyValue('--p-gray-300')],
                    hoverBackgroundColor: [documentStyle.getPropertyValue('--p-gray-200')]
                }
            ]
        };
    }

    // Generate colors for categories
    const colors = [
        '--p-cyan-500',
        '--p-orange-500', 
        '--p-green-500',
        '--p-purple-500',
        '--p-red-500',
        '--p-blue-500',
        '--p-yellow-500',
        '--p-pink-500'
    ];

    const hoverColors = [
        '--p-cyan-400',
        '--p-orange-400',
        '--p-green-400', 
        '--p-purple-400',
        '--p-red-400',
        '--p-blue-400',
        '--p-yellow-400',
        '--p-pink-400'
    ];

    const labels = props.categoryTotals.map(category => category.category_name || 'Uncategorized');
    const data = props.categoryTotals.map(category => category.total_amount);
    const backgroundColor = props.categoryTotals.map((_, index) => 
        documentStyle.getPropertyValue(colors[index % colors.length])
    );
    const hoverBackgroundColor = props.categoryTotals.map((_, index) => 
        documentStyle.getPropertyValue(hoverColors[index % hoverColors.length])
    );

    return {
        labels,
        datasets: [
            {
                data,
                backgroundColor,
                hoverBackgroundColor
            }
        ]
    };
};

const setChartOptions = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');

    return {
        plugins: {
            legend: {
                labels: {
                    color: textColor
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const categoryTotal = props.categoryTotals[context.dataIndex];
                        return `${context.label}: ${categoryTotal?.formatted_amount || context.formattedValue}`;
                    }
                }
            }
        },
        cutout: '60%'
    };
};
</script>
