type TicketsReportSummaryProps = {
  firstSerial: string;
  lastSerial: string;
  totalTickets: number;
};

const TicketsReportSummary: React.FC<TicketsReportSummaryProps> = ({
  firstSerial,
  lastSerial,
  totalTickets,
}) => {
  return (
    <div className="ticketsReport__summary">
      <p>Primul număr de serie: {firstSerial}</p>
      <p>Ultimul număr de serie: {lastSerial}</p>
      <p>Total bilete: {totalTickets}</p>
    </div>
  );
};

export default TicketsReportSummary;
