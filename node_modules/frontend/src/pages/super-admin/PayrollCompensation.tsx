import React, { useState } from 'react';
import { 
  DollarSign, 
  Calculator, 
  FileText, 
  Gift, 
  TrendingUp, 
  Download,
  Edit,
  Plus,
  Search,
  Eye,
  AlertCircle,
  Clock,
  Users
} from 'lucide-react';

const PayrollCompensation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('payroll');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  // Mock data - TODO: Replace with actual API calls
  const payrollSummary = {
    total_gross_pay: 125000,
    total_tax_amount: 18750,
    total_net_pay: 106250,
    total_employees: 25
  };

  const payrollPeriods = [
    { id: '1', period_name: 'December 2024', status: 'completed', start_date: '2024-12-01', end_date: '2024-12-31' },
    { id: '2', period_name: 'January 2025', status: 'draft', start_date: '2025-01-01', end_date: '2025-01-31' }
  ];

  const payrollRecords = [
    {
      id: '1',
      employee_name: 'Maria Santos',
      position: 'Sales Manager',
      department: 'Sales',
      base_salary: 25000,
      overtime_pay: 2000,
      bonuses: 1500,
      gross_pay: 28500,
      tax_amount: 4275,
      net_pay: 24225,
      status: 'paid'
    },
    {
      id: '2',
      employee_name: 'Juan Dela Cruz',
      position: 'Cashier',
      department: 'POS',
      base_salary: 18000,
      overtime_pay: 800,
      bonuses: 500,
      gross_pay: 19300,
      tax_amount: 2895,
      net_pay: 16405,
      status: 'paid'
    },
    {
      id: '3',
      employee_name: 'Ana Garcia',
      position: 'Inventory Clerk',
      department: 'Inventory',
      base_salary: 16000,
      overtime_pay: 1200,
      bonuses: 300,
      gross_pay: 17500,
      tax_amount: 2625,
      net_pay: 14875,
      status: 'approved'
    }
  ];

  const benefits = [
    {
      id: '1',
      benefit_name: 'Health Insurance',
      benefit_type: 'health',
      cost_value: 5000,
      employer_contribution: 3000,
      employee_contribution: 2000,
      is_active: true
    },
    {
      id: '2',
      benefit_name: 'SSS Contribution',
      benefit_type: 'social_security',
      cost_value: 2000,
      employer_contribution: 1000,
      employee_contribution: 1000,
      is_active: true
    },
    {
      id: '3',
      benefit_name: 'PhilHealth',
      benefit_type: 'health',
      cost_value: 1500,
      employer_contribution: 750,
      employee_contribution: 750,
      is_active: true
    }
  ];

  const taxRates = [
    {
      id: '1',
      tax_name: 'Withholding Tax',
      tax_type: 'withholding',
      rate_value: 15,
      rate_type: 'percentage',
      min_amount: 0,
      max_amount: 100000,
      is_active: true
    },
    {
      id: '2',
      tax_name: 'SSS Contribution',
      tax_type: 'sss',
      rate_value: 11,
      rate_type: 'percentage',
      min_amount: 0,
      max_amount: 30000,
      is_active: true
    },
    {
      id: '3',
      tax_name: 'PhilHealth',
      tax_type: 'philhealth',
      rate_value: 3,
      rate_type: 'percentage',
      min_amount: 0,
      max_amount: 100000,
      is_active: true
    },
    {
      id: '4',
      tax_name: 'Pag-IBIG',
      tax_type: 'pagibig',
      rate_value: 200,
      rate_type: 'fixed',
      min_amount: 0,
      max_amount: null,
      is_active: true
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const renderPayrollTab = () => (
    <div className="space-y-6">
      {/* Payroll Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Gross Pay</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(payrollSummary.total_gross_pay)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tax</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(payrollSummary.total_tax_amount)}
              </p>
            </div>
            <Calculator className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Net Pay</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(payrollSummary.total_net_pay)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Employees</p>
              <p className="text-2xl font-bold text-purple-600">
                {payrollSummary.total_employees}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Payroll Period Selector */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Payroll Period</h3>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Period
          </button>
        </div>
        
        <select 
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select a payroll period</option>
          {payrollPeriods.map(period => (
            <option key={period.id} value={period.id}>
              {period.period_name} - {period.status}
            </option>
          ))}
        </select>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payroll Records</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
                />
              </div>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Process Payroll
              </button>
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Base Salary</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Overtime</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bonuses</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Gross Pay</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tax</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Net Pay</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrollRecords
                .filter(record => 
                  record.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(record => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{record.employee_name}</p>
                        <p className="text-sm text-gray-500">{record.position} - {record.department}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(record.base_salary)}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(record.overtime_pay)}</td>
                    <td className="px-4 py-3 text-gray-900">{formatCurrency(record.bonuses)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{formatCurrency(record.gross_pay)}</td>
                    <td className="px-4 py-3 text-red-600">{formatCurrency(record.tax_amount)}</td>
                    <td className="px-4 py-3 text-green-600 font-bold">{formatCurrency(record.net_pay)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        record.status === 'paid' ? 'bg-green-100 text-green-800' :
                        record.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        record.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-800" title="Download Pay Stub">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800" title="Edit Record">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBenefitsTab = () => (
    <div className="space-y-6">
      {/* Benefits Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Benefits Cost</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(benefits.reduce((sum, benefit) => sum + benefit.cost_value, 0))}
              </p>
            </div>
            <Gift className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Employer Contribution</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(benefits.reduce((sum, benefit) => sum + benefit.employer_contribution, 0))}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Benefits</p>
              <p className="text-2xl font-bold text-blue-600">
                {benefits.filter(benefit => benefit.is_active).length}
              </p>
            </div>
            <Gift className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Benefits Management */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Benefits Management</h3>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Benefit
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Benefit Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Cost</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employer Cost</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee Cost</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {benefits.map(benefit => (
                <tr key={benefit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{benefit.benefit_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {benefit.benefit_type.replace('_', ' ').charAt(0).toUpperCase() + benefit.benefit_type.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{formatCurrency(benefit.cost_value)}</td>
                  <td className="px-4 py-3 text-green-600">{formatCurrency(benefit.employer_contribution)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(benefit.employee_contribution)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      benefit.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {benefit.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800" title="Edit Benefit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800" title="View Details">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTaxTab = () => (
    <div className="space-y-6">
      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Withholding Tax</p>
              <p className="text-2xl font-bold text-red-600">
                {taxRates.find(rate => rate.tax_type === 'withholding')?.rate_value || 0}%
              </p>
            </div>
            <Calculator className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">SSS Contribution</p>
              <p className="text-2xl font-bold text-blue-600">
                {taxRates.find(rate => rate.tax_type === 'sss')?.rate_value || 0}%
              </p>
            </div>
            <Calculator className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">PhilHealth</p>
              <p className="text-2xl font-bold text-green-600">
                {taxRates.find(rate => rate.tax_type === 'philhealth')?.rate_value || 0}%
              </p>
            </div>
            <Calculator className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pag-IBIG</p>
              <p className="text-2xl font-bold text-purple-600">
                ₱{taxRates.find(rate => rate.tax_type === 'pagibig')?.rate_value || 0}
              </p>
            </div>
            <Calculator className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tax Rates Management */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tax Rates Configuration</h3>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Tax Rate
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tax Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rate</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Min Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Max Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {taxRates.map(taxRate => (
                <tr key={taxRate.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{taxRate.tax_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {taxRate.tax_type.replace('_', ' ').charAt(0).toUpperCase() + taxRate.tax_type.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {taxRate.rate_type === 'percentage' ? `${taxRate.rate_value}%` : 
                     taxRate.rate_type === 'fixed' ? `₱${taxRate.rate_value}` : 
                     'Bracket'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(taxRate.min_amount)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {taxRate.max_amount ? formatCurrency(taxRate.max_amount) : 'Unlimited'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      taxRate.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {taxRate.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800" title="Edit Tax Rate">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800" title="View Details">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll & Compensation</h1>
            <p className="text-gray-600">Manage employee payroll, benefits, and tax calculations</p>
            {loading && (
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-sm text-blue-600">Loading...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Process Payroll
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Reports
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'payroll', label: 'Payroll', icon: DollarSign },
              { id: 'benefits', label: 'Benefits', icon: Gift },
              { id: 'tax', label: 'Tax Management', icon: Calculator }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'payroll' && renderPayrollTab()}
          {activeTab === 'benefits' && renderBenefitsTab()}
          {activeTab === 'tax' && renderTaxTab()}
        </div>
      </div>
    </div>
  );
};

export default PayrollCompensation;