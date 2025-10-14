
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ProgressPoint } from '../types';

interface ProgressChartProps {
  data: ProgressPoint[];
  theme: 'light' | 'dark';
}

const ProgressChart: React.FC<ProgressChartProps> = ({ data, theme }) => {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#475569' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipLabel = isDark ? '#cbd5e1' : '#334155';

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-md dark:shadow-lg h-80 w-full transition-colors duration-300">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 transition-colors duration-300">Progression Hebdomadaire (XP)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="day" stroke={tickColor} tick={{ fill: tickColor }} />
          <YAxis stroke={tickColor} tick={{ fill: tickColor }} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: '0.75rem',
              transition: 'background-color 0.3s ease',
            }}
            labelStyle={{ color: tooltipLabel }}
            cursor={{ fill: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.3)' }}
          />
          <Bar dataKey="xp" name="XP Gagnés" fill="#8884d8" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;