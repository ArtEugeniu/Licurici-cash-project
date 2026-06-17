export const getDefaultReportDates = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dayTo = (date.getDate() + 1).toString().padStart(2, '0');

  return {
    startDate: `${year}-${month}-${day}`,
    endDate: `${year}-${month}-${dayTo}`,
  };
};

export const getTicketPrice = (type: string) => {
  switch (type) {
    case 'Standart':
      return 100;
    case 'Premiera':
      return 150;
    case 'Special':
      return 200;
    default:
      return undefined;
  }
};
