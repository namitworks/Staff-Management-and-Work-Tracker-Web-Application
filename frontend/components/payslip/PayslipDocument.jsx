import React from 'react';

const PayslipDocument = ({ payslip, staff, company }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 font-sans text-sm" id="payslip-document">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1A3A5C] mb-2">DDinfoways</h1>
          <div className="text-gray-600 text-xs">
            <p>123 Business Street</p>
            <p>Auckland, New Zealand</p>
            <p>Phone: +64 9 123 4567</p>
            <p>Email: info@ddinfoways.co.nz</p>
          </div>
        </div>
        <div className="bg-[#1A3A5C] text-white px-6 py-4 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-1">PAYSLIP</h2>
          <p className="text-sm">{getMonthName(payslip.month)} {payslip.year}</p>
          <p className="text-xs mt-1">Pay Date: {formatDate(payslip.pay_date)}</p>
        </div>
      </div>

      {/* Employee Details */}
      <div className="grid grid-cols-2 gap-8 mb-8 p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-semibold text-[#1A3A5C] mb-3">Employee Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{staff?.name || payslip.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Department:</span>
              <span>{staff?.department || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Designation:</span>
              <span>{staff?.role || 'Staff'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax Code:</span>
              <span>{payslip.tax_code || 'M'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">KiwiSaver %:</span>
              <span>{payslip.kiwisaver_rate || 0}%</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-[#1A3A5C] mb-3">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Staff ID:</span>
              <span>{staff?.staff_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bank Name:</span>
              <span>{payslip.bank_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account No:</span>
              <span>{payslip.bank_account || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IRD No:</span>
              <span>{payslip.ird_number || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pay Frequency:</span>
              <span>Monthly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-[#1A3A5C]">{payslip.working_days || 0}</div>
          <div className="text-sm text-gray-600">Working Days</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-[#1A3A5C]">{payslip.days_worked || 0}</div>
          <div className="text-sm text-gray-600">Days Worked</div>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-[#1A3A5C]">{payslip.leaves_taken || 0}</div>
          <div className="text-sm text-gray-600">Leaves Taken</div>
        </div>
      </div>

      {/* Earnings and Deductions */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Earnings */}
        <div>
          <h3 className="font-semibold text-[#1A3A5C] mb-4">Earnings</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Basic Salary</span>
              <span className="font-medium">{formatCurrency(payslip.basic_salary)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Housing Allowance</span>
              <span className="font-medium">{formatCurrency(payslip.housing_allowance)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Transport Allowance</span>
              <span className="font-medium">{formatCurrency(payslip.transport_allowance)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Special Allowance</span>
              <span className="font-medium">{formatCurrency(payslip.special_allowance)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Overtime ({payslip.overtime_hours || 0} hrs)</span>
              <span className="font-medium">{formatCurrency(payslip.overtime_amount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Bonus</span>
              <span className="font-medium">{formatCurrency(payslip.bonus)}</span>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-[#1A3A5C] bg-gray-50 px-2 rounded">
              <span className="font-semibold">Gross Total</span>
              <span className="font-bold text-[#1A3A5C]">{formatCurrency(payslip.gross_salary)}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div>
          <h3 className="font-semibold text-[#1A3A5C] mb-4">Deductions</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>PAYE Tax</span>
              <span className="font-medium">{formatCurrency(payslip.paye_tax)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>KiwiSaver (Employee)</span>
              <span className="font-medium">{formatCurrency(payslip.kiwisaver_employee)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>ACC Levy</span>
              <span className="font-medium">{formatCurrency(payslip.acc_levy)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Student Loan</span>
              <span className="font-medium">{formatCurrency(payslip.student_loan)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Other Deductions</span>
              <span className="font-medium">{formatCurrency(payslip.other_deductions)}</span>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-[#1A3A5C] bg-gray-50 px-2 rounded">
              <span className="font-semibold">Total Deductions</span>
              <span className="font-bold text-[#1A3A5C]">{formatCurrency(payslip.total_deductions)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Pay Banner */}
      <div className="bg-[#1A3A5C] text-white text-center py-6 rounded-lg mb-8">
        <div className="text-2xl font-bold">
          NET PAY: {formatCurrency(payslip.net_salary)}
        </div>
      </div>

      {/* YTD Summary */}
      <div className="mb-8">
        <h3 className="font-semibold text-[#1A3A5C] mb-4">Year-to-Date Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-[#2E75B6]">{formatCurrency(payslip.ytd_gross)}</div>
            <div className="text-sm text-gray-600">YTD Gross</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-red-600">{formatCurrency(payslip.ytd_tax)}</div>
            <div className="text-sm text-gray-600">YTD Tax Paid</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-green-600">{formatCurrency(payslip.ytd_net)}</div>
            <div className="text-sm text-gray-600">YTD Net</div>
          </div>
        </div>
      </div>

      {/* Leave Balances */}
      <div className="mb-8">
        <h3 className="font-semibold text-[#1A3A5C] mb-4">Leave Balances</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-[#1A3A5C]">{payslip.annual_leave_balance || 0}</div>
            <div className="text-sm text-gray-600">Annual Leave (days)</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-[#1A3A5C]">{payslip.sick_leave_balance || 0}</div>
            <div className="text-sm text-gray-600">Sick Leave (days)</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-6 text-center text-xs text-gray-600">
        <p className="mb-2">
          <strong>Employer KiwiSaver Contribution:</strong> {formatCurrency(payslip.kiwisaver_employer)}
        </p>
        <p className="mb-4">
          This is a system-generated payslip. No signature required.
        </p>
        <div className="flex justify-between items-center">
          <div className="text-left">
            <p className="font-semibold">DDinfoways Ltd</p>
            <p>ddinfoways.co.nz</p>
          </div>
          <div className="text-right">
            <p>Generated on: {formatDate(new Date())}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayslipDocument;