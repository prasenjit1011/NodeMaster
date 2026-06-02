exports.handler = async (event) => {
  console.log("EVENT:", JSON.stringify(event));

  const {
    employeeId,
    employeeName,
    leaveType,
    fromDate,
    toDate,
    reason
  } = event;


  throw new Error("Mongo URI5:"+ process.env.MONGO_URI);

  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  if (!employeeName) {
    throw new Error("Employee Name is required");
  }

  if (!leaveType) {
    throw new Error("Leave Type is required");
  }

  if (!fromDate) {
    throw new Error("From Date is required");
  }

  if (!toDate) {
    throw new Error("To Date is required");
  }

  if (!reason) {
    throw new Error("Reason is required");
  }

  const startDate = new Date(fromDate);
  const endDate = new Date(toDate);

  if (isNaN(startDate.getTime())) {
    throw new Error("Invalid From Date");
  }

  if (isNaN(endDate.getTime())) {
    throw new Error("Invalid To Date");
  }

  if (endDate < startDate) {
    throw new Error("To Date cannot be before From Date");
  }

  return {
    employeeId,
    employeeName,
    leaveType,
    fromDate,
    toDate,
    reason
  };
};