type TicketsReportFiltersProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

const TicketsReportFilters: React.FC<TicketsReportFiltersProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  return (
    <div className="ticketsReport__filters">
      <label>
        De la:
        <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} />
      </label>
      <label>
        Până la:
        <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} />
      </label>
    </div>
  );
};

export default TicketsReportFilters;
