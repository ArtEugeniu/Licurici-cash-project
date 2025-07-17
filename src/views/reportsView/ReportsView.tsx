import DailyReports from './reports/dailyReports/DailyReports';
import MonthlyReports from './reports/monthly/MonthlyReports';
import SpectacleReports from './reports/spectacleReports/SpectacleReports';
import { supabase } from '../../supabaseClient';
import { useEffect, useState } from 'react';
import './ReportsView.scss';

type Sale = {
  id: string;
  quantity: number;
  total_sum: number;
  payment_method: string;
  created_at: string;
  type: string;
  schedule: {
    title: string;
  };
};


const ReportsView: React.FC = () => {

  const [sales, setSales] = useState<Sale[]>([])

  useEffect(() => {
    const fetchSales = async () => {
      let query = supabase
        .from('sales')
        .select(`
        id,
        quantity,
        total_sum,
        payment_method,
        type,
        created_at,
        schedule:schedule_id (
          title,
          date
        )
      `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Eroare la încărcarea vânzărilor:', error.message);
      } else {
        const formatted = (data || []).map((sale) => ({
          ...sale,
          schedule: Array.isArray(sale.schedule) ? sale.schedule[0] : sale.schedule,
        }));

        setSales(formatted);
      }
    };


    fetchSales();

  }, []);

  return (

    <div className="reports">
      <h2 className="reports__title">Rapoarte vânzări</h2>
      <DailyReports sales={sales} />
      <MonthlyReports sales={sales} />
      <SpectacleReports sales={sales}/>
    </div>

  )
}

export default ReportsView;