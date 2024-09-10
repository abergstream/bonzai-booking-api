export const validateDate = (dateString) => {
  // Regex to match the date format YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  // Check if the date string matches the regex
  if (!regex.test(dateString)) {
    return false;
  }

  // Check if the date is a valid date
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  // Check if the date object is valid and matches the input
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};
