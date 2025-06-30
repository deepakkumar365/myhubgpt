// Constants for date formatting
const DATE_FORMAT = "T"; // Split date by "T" to get YYYY-MM-DD format

// Function to get the range for the current week
export const getThisWeekRange = () => {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  const sunday = new Date(today);

  const diffToMonday = day === 0 ? -6 : 1 - day;
  const diffToSunday = 7 - day;

  monday.setDate(today.getDate() + diffToMonday);
  sunday.setDate(today.getDate() + diffToSunday);

  return {
    start: monday.toISOString().split(DATE_FORMAT)[0],
    end: sunday.toISOString().split(DATE_FORMAT)[0],
  };
};

// Function to get the range for the next week
export const getNextWeekRange = () => {
  const today = new Date();
  const nextMonday = new Date(today);
  const nextSunday = new Date(today);

  const day = today.getDay();
  const daysUntilNextMonday = (8 - day) % 7 || 7;
  const daysUntilNextSunday = (14 - day) % 7 || 7;

  nextMonday.setDate(today.getDate() + daysUntilNextMonday);
  nextSunday.setDate(today.getDate() + daysUntilNextSunday);

  return {
    start: nextMonday.toISOString().split(DATE_FORMAT)[0],
    end: nextSunday.toISOString().split(DATE_FORMAT)[0],
  };
};

// Function to get the range for the current month
export const getThisMonthRange = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    start: firstDay.toISOString().split(DATE_FORMAT)[0],
    end: lastDay.toISOString().split(DATE_FORMAT)[0],
  };
};

// Function to get the range for the next month
export const getNextMonthRange = () => {
  const today = new Date();
  const firstDayNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const lastDayNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  return {
    start: firstDayNextMonth.toISOString().split(DATE_FORMAT)[0],
    end: lastDayNextMonth.toISOString().split(DATE_FORMAT)[0],
  };
};

// Function to get the range for the next 90 days
export const getNext90Days = () => {
  const today = new Date();
  const next90Days = new Date(today);
  next90Days.setDate(today.getDate() + 90);

  return {
    start: today.toISOString().split(DATE_FORMAT)[0],
    end: next90Days.toISOString().split(DATE_FORMAT)[0],
  };
};

// Function to get the range for the next 30 days
export const getNext30Days = () => {
  const today = new Date();
  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);

  return {
    start: today.toISOString().split(DATE_FORMAT)[0],
    end: next30Days.toISOString().split(DATE_FORMAT)[0],
  };
};

// Function to get the range for the next 7 days
export const getNext7Days = () => {
  const today = new Date();
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);

  return {
    start: today.toISOString().split(DATE_FORMAT)[0],
    end: next7Days.toISOString().split(DATE_FORMAT)[0],
  };
};

// Function to get the range for the last 90 days
export const getLast90Days = () => {
  const today = new Date();
  const last90Days = new Date(today);
  last90Days.setDate(today.getDate() - 90);

  return {
    start: last90Days.toISOString().split(DATE_FORMAT)[0],
    end: today.toISOString().split(DATE_FORMAT)[0],
  };
};

// Function to get the range for the last 30 days
export const getLast30Days = () => {
  const today = new Date();
  const last30Days = new Date(today);
  last30Days.setDate(today.getDate() - 30);

  return {
    start: last30Days.toISOString().split(DATE_FORMAT)[0],
    end: today.toISOString().split(DATE_FORMAT)[0],
  };
};

// Function to get the range for the last 7 days
export const getLast7Days = () => {
  const today = new Date();
  const last7Days = new Date(today);
  last7Days.setDate(today.getDate() - 7);

  return {
    start: last7Days.toISOString().split(DATE_FORMAT)[0],
    end: today.toISOString().split(DATE_FORMAT)[0],
  };
};

// Function to generate a date filter based on the type and filter type
export const getDateFilter = (dateType: string, filterType: string) => {
  let range;

  // Determine the date range based on the filter type
  switch (filterType.toLowerCase()) {
    case "next90days":
      range = getNext90Days();
      break;
    case "next30days":
      range = getNext30Days();
      break;
    case "next7days":
      range = getNext7Days();
      break;
    case "last90days":
      range = getLast90Days();
      break;
    case "last30days":
      range = getLast30Days();
      break;
    case "last7days":
      range = getLast7Days();
      break;
    case "thisweek":
      range = getThisWeekRange();
      break;
    case "nextweek":
      range = getNextWeekRange();
      break;
    case "thismonth":
      range = getThisMonthRange();
      break;
    case "nextmonth":
      range = getNextMonthRange();
      break;
    default:
      throw new Error(`Invalid filter type: ${filterType}`);
  }

  // Return the filter string
  return `${dateType} ge ${range.start} and ${dateType} le ${range.end}`;
};

const defaultDateFields = ['ETA', 'ETD', 'ATA', 'ATD'];
export const generateModuleText = (module: string, extraFields: string[] = []) => {
  const upperModule = module.charAt(0).toUpperCase() + module.slice(1);

  const timePeriods = [
    'last90days', 'last30days', 'last7days',
    'next90days', 'next30days', 'next7days',
    'thisweek', 'nextweek', 'thismonth', 'nextmonth'
  ];

  // Combine default and extra fields
  const allDateFields = [...defaultDateFields, ...extraFields];

  let generatedText = '';
  allDateFields.forEach((dateField) => {
    timePeriods.forEach((period) => {
      generatedText += `
How many ${upperModule}s are estimated to ${dateField} (${dateField}) in the ${period}?
filter: ${getDateFilter(dateField, period)}`;
    });
  });

  return generatedText;
};

