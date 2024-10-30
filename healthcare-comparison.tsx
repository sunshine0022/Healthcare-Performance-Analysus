import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

const CampaignComparison = () => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalEnrollments: { week1: 0, week2: 0 },
    totalImpressions: { week1: 0, week2: 0 },
    totalRevenue: { week1: 0, week2: 0 },
    totalCVR: { week1: 0, week2: 0 }
  });

  useEffect(() => {
    const processData = async () => {
      try {
        const response = await window.fs.readFile('Healthcare Data - Health Summary (1).csv', { encoding: 'utf8' });
        
        const result = Papa.parse(response, {
          header: true,
          skipEmptyLines: true,
          transform: (value) => {
            if (typeof value === 'string') {
              // Remove commas and % signs, then convert to number if possible
              const cleanValue = value.replace(/,/g, '').replace('%', '');
              const number = parseFloat(cleanValue);
              return isNaN(number) ? value : number;
            }
            return value;
          }
        });

        // Process data for visualization
        const providers = {};
        let totals = {
          week1: { enrollments: 0, impressions: 0, revenue: 0, cvr: 0 },
          week2: { enrollments: 0, impressions: 0, revenue: 0, cvr: 0 }
        };
        let providerCount = 0;

        result.data.forEach(row => {
          if (!row.Provider || !row.Week) return;
          
          const providerName = row.Provider.split('(')[0].trim();
          if (!providers[providerName]) {
            providers[providerName] = { name: providerName };
            providerCount++;
          }
          
          const week = row.Week;
          if (week === 1 || week === 2) {
            providers[providerName][`week${week}_enrollments`] = row['Enrollment count'];
            providers[providerName][`week${week}_impressions`] = row.Impressions;
            providers[providerName][`week${week}_revenue`] = row.Revenue;
            providers[providerName][`week${week}_cvr`] = parseFloat(row.CVR) || 0;
            
            totals[`week${week}`].enrollments += row['Enrollment count'];
            totals[`week${week}`].impressions += row.Impressions;
            totals[`week${week}`].revenue += row.Revenue;
            totals[`week${week}`].cvr += parseFloat(row.CVR) || 0;
          }
        });

        const processedData = Object.values(providers);
        
        setData(processedData);
        setSummary({
          totalEnrollments: { 
            week1: totals.week1.enrollments, 
            week2: totals.week2.enrollments 
          },
          totalImpressions: { 
            week1: totals.week1.impressions, 
            week2: totals.week2.impressions 
          },
          totalRevenue: { 
            week1: totals.week1.revenue, 
            week2: totals.week2.revenue 
          },
          totalCVR: { 
            week1: totals.week1.cvr / providerCount, 
            week2: totals.week2.cvr / providerCount 
          }
        });
      } catch (error) {
        console.error('Error processing data:', error);
      }
    };

    processData();
  }, []);

  const calculatePercentChange = (week1, week2) => {
    if (!week1 || week1 === 0) return 'N/A';
    return ((week2 - week1) / week1 * 100).toFixed(1);
  };

  return (
    <div className="w-full p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Campaign Performance Summary</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-blue-100 rounded">
            <h3 className="font-semibold">Total Enrollments</h3>
            <p>Week 1: {summary.totalEnrollments.week1}</p>
            <p>Week 2: {summary.totalEnrollments.week2}</p>
            <p className={`text-sm mt-2 ${calculatePercentChange(summary.totalEnrollments.week1, summary.totalEnrollments.week2) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Change: {calculatePercentChange(summary.totalEnrollments.week1, summary.totalEnrollments.week2)}%
            </p>
          </div>
          <div className="p-4 bg-green-100 rounded">
            <h3 className="font-semibold">Total Impressions</h3>
            <p>Week 1: {summary.totalImpressions.week1?.toLocaleString()}</p>
            <p>Week 2: {summary.totalImpressions.week2?.toLocaleString()}</p>
            <p className={`text-sm mt-2 ${calculatePercentChange(summary.totalImpressions.week1, summary.totalImpressions.week2) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Change: {calculatePercentChange(summary.totalImpressions.week1, summary.totalImpressions.week2)}%
            </p>
          </div>
          <div className="p-4 bg-purple-100 rounded">
            <h3 className="font-semibold">Total Revenue</h3>
            <p>Week 1: ${summary.totalRevenue.week1?.toLocaleString()}</p>
            <p>Week 2: ${summary.totalRevenue.week2?.toLocaleString()}</p>
            <p className={`text-sm mt-2 ${calculatePercentChange(summary.totalRevenue.week1, summary.totalRevenue.week2) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Change: {calculatePercentChange(summary.totalRevenue.week1, summary.totalRevenue.week2)}%
            </p>
          </div>
          <div className="p-4 bg-yellow-100 rounded">
            <h3 className="font-semibold">Average CVR</h3>
            <p>Week 1: {summary.totalCVR.week1?.toFixed(2)}%</p>
            <p>Week 2: {summary.totalCVR.week2?.toFixed(2)}%</p>
            <p className={`text-sm mt-2 ${calculatePercentChange(summary.totalCVR.week1, summary.totalCVR.week2) > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Change: {calculatePercentChange(summary.totalCVR.week1, summary.totalCVR.week2)}%
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Enrollment Comparison by Provider</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="week1_enrollments" name="Week 1 Enrollments" fill="#3B82F6" />
              <Bar dataKey="week2_enrollments" name="Week 2 Enrollments" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="text-lg font-semibold mb-3">Top Performers (Week 2)</h3>
          {data
            .sort((a, b) => (b.week2_enrollments || 0) - (a.week2_enrollments || 0))
            .slice(0, 5)
            .map(provider => (
              <div key={provider.name} className="mb-2">
                <p className="font-medium">{provider.name}</p>
                <p className="text-sm">Enrollments: {provider.week2_enrollments}</p>
                <p className="text-sm">Change: {calculatePercentChange(provider.week1_enrollments, provider.week2_enrollments)}%</p>
              </div>
            ))}
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="text-lg font-semibold mb-3">Largest Changes</h3>
          {data
            .sort((a, b) => {
              const changeA = Math.abs(calculatePercentChange(a.week1_enrollments, a.week2_enrollments));
              const changeB = Math.abs(calculatePercentChange(b.week1_enrollments, b.week2_enrollments));
              return changeB - changeA;
            })
            .slice(0, 5)
            .map(provider => {
              const change = calculatePercentChange(provider.week1_enrollments, provider.week2_enrollments);
              return (
                <div key={provider.name} className="mb-2">
                  <p className="font-medium">{provider.name}</p>
                  <p className={`text-sm ${parseFloat(change) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Change: {change}%
                  </p>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default CampaignComparison;