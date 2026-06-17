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
      <label className="field">
        <span className="field__label">De la</span>
        <input
          className="input input--inline"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
        />
      </label>
      <label className="field">
        <span className="field__label">Până la</span>
        <input
          className="input input--inline"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
        />
      </label>
    </div>
  );
};

export default TicketsReportFilters;
