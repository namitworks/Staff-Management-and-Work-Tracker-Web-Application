-- Migration: Add payslip-related columns to salary and staff_profiles tables
-- Date: 2026-04-22
-- Description: Adds comprehensive payslip fields for NZ payroll compliance

USE ddinfoways_staff;

-- Add payslip columns to salary table
ALTER TABLE salary
ADD COLUMN basic_salary DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN housing_allowance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN transport_allowance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN special_allowance DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN overtime_hours DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN overtime_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN bonus DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN gross_salary DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN paye_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN kiwisaver_employee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN kiwisaver_employer DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN acc_levy DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN student_loan DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN other_deductions DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN total_deductions DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN net_salary DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN days_worked DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN working_days DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN leaves_taken DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN ytd_gross DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN ytd_tax DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN ytd_net DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN annual_leave_balance DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN sick_leave_balance DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN tax_code VARCHAR(10),
ADD COLUMN ird_number VARCHAR(20),
ADD COLUMN kiwisaver_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN bank_name VARCHAR(255),
ADD COLUMN bank_account VARCHAR(50),
ADD COLUMN pay_date DATE;

-- Add tax and banking columns to staff_profiles table
ALTER TABLE staff_profiles
ADD COLUMN ird_number VARCHAR(20),
ADD COLUMN tax_code VARCHAR(10),
ADD COLUMN kiwisaver_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN bank_name VARCHAR(255),
ADD COLUMN bank_account VARCHAR(50);