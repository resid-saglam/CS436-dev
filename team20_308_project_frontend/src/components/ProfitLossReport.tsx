// src/components/ProfitLossReport.tsx
import React, { useState } from "react";
import { fetchProfitLoss, ProfitLossDTO } from "../services/reportService";
import "../styles/ProfitLossReport.css";

/* Chart */
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const ProfitLossReport: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<ProfitLossDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    if (!startDate || !endDate) {
      setError("Please select both dates");
      return;
    }
    setLoading(true);
    try {
      const data = await fetchProfitLoss(startDate, endDate);
      setReport(data);
      setError("");
    } catch (err) {
      setError("Failed to fetch report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ["Revenue", "Cost", "Profit/Loss"],
    datasets: [
      {
        label: "Amount ($)",
        data: report
          ? [report.totalRevenue, report.totalCost, report.profitOrLoss]
          : [0, 0, 0],
        backgroundColor: ["#4caf50", "#f44336", "#2196f3"],
        borderRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="pl-wrapper">
      <h2 className="pl-title">📈 Profit / Loss Report</h2>

      <div className="pl-date-row">
        <div>
          <label>Start:</label>
          <input
            type="date"
            placeholder="gg.aa.yyyy"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label>End:</label>
          <input
            type="date"
            placeholder="gg.aa.yyyy"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          className="generate-btn"
          onClick={handleFetch}
          disabled={loading}
        >
          {loading ? "Loading..." : "Generate"}
        </button>
      </div>

      {error && <p className="pl-error">{error}</p>}

      <div className="pl-summary">
        {report && (
          <>
            <p className="pl-text">
              <strong>Revenue:</strong>{" "}
              <span className="pl-value">
                ${report.totalRevenue.toFixed(2)}
              </span>
            </p>
            <p className="pl-text">
              <strong>Cost:</strong>{" "}
              <span className="pl-value">${report.totalCost.toFixed(2)}</span>
            </p>
            <p className="pl-text">
              <strong>{report.status}:</strong>{" "}
              <span className="pl-value">
                ${report.profitOrLoss.toFixed(2)}
              </span>
            </p>
          </>
        )}
      </div>

      <div className="pl-chart">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "top",
                labels: {
                  font: {
                    size: 20,
                    weight: "bold",
                  },
                },
              },
              title: {
                display: true,
                text: "Financial Overview",
                font: {
                  size: 26,
                  weight: "bold",
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  font: {
                    size: 22,
                    weight: "bold",
                  },
                },
              },
              y: {
                ticks: {
                  font: {
                    size: 20,
                    weight: "bold",
                  },
                  stepSize: 1000, // Net değerlerle artış
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default ProfitLossReport;
