import DailyReports from './reports/dailyReports/DailyReports';
import MonthlyReports from './reports/monthly/MonthlyReports';
import SpectacleReports from './reports/spectacleReports/SpectacleReports';
import PeriodReports from './reports/periodReports/PeriodReports';
import { useEffect, useState } from 'react';
import './ReportsView.scss';

type Sale = {
  id: string;
  quantity: number;
  total_sum: number;
  payment_method: string;
  created_at: string;
  type: string;
  title: string;
  schedule_id: string
};


const ReportsView: React.FC = () => {

  const [sales, setSales] = useState<Sale[]>([])

  useEffect(() => {
    const fetchSales = async () => {
      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'GET'
      });

      if (!response.ok) {
        alert('Eroare la incarcarea vanzarilor')
        return;
      }

      const data = await response.json();
  
      setSales(data)
    };

    fetchSales();


  }, []);




  return (

    <div className="reports">
      <h2 className="reports__title">Rapoarte vânzări</h2>
      <DailyReports sales={sales} />
      <MonthlyReports sales={sales} />
      <SpectacleReports sales={sales} />
      <PeriodReports sales={sales} />
    </div>

  )
}

export default ReportsView;